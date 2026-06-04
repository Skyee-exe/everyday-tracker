"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import {
  kanbanBoards,
  kanbanColumns,
  kanbanTasks,
  calendarTasks,
  boardCollaborators,
  users,
} from "@/db/schema";
import { eq, and, asc, desc, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { canAccessBoard, assertCanAccessBoard } from "@/lib/board-access";
import { isCollabRole, type CollabRole } from "@/lib/collab/permissions";

/* ═══════════════════════════════════════════════
   Board Templates
   ═══════════════════════════════════════════════ */
const BOARD_TEMPLATES: Record<string, string[]> = {
  "personal-planner": ["Todo", "In Progress", "Done", "Someday"],
  "study-tracker": ["To Study", "Studying", "Review", "Mastered"],
  "project-management": ["Backlog", "Todo", "In Progress", "In Review", "Done"],
  "sprint-board": ["Sprint Backlog", "In Development", "Testing", "Done"],
  "work-tasks": ["Todo", "In Progress", "Blocked", "Done"],
  blank: ["Todo", "In Progress", "Done"],
};

/* ═══════════════════════════════════════════════
   Boards
   ═══════════════════════════════════════════════ */

export async function getBoards() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthenticated");

  const boards = await db
    .select()
    .from(kanbanBoards)
    .where(eq(kanbanBoards.clerkUserId, userId))
    .orderBy(desc(kanbanBoards.updatedAt));

  return boards;
}

export async function getMyRoleForBoard(
  boardId: number
): Promise<CollabRole | null> {
  const access = await canAccessBoard(boardId, "viewer");
  return access?.role ?? null;
}

export async function getBoardAccess(
  boardId: number
): Promise<{ role: CollabRole | null; totalCollaborators: number }> {
  const access = await canAccessBoard(boardId, "viewer");
  const totalRows = await db
    .select({ id: boardCollaborators.id })
    .from(boardCollaborators)
    .where(eq(boardCollaborators.boardId, boardId));
  return {
    role: access?.role ?? null,
    totalCollaborators: totalRows.length,
  };
}

export async function createBoard(data: {
  name: string;
  color: string;
  template: string;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthenticated");

  const [board] = await db
    .insert(kanbanBoards)
    .values({
      clerkUserId: userId,
      name: data.name,
      color: data.color,
    })
    .returning();

  // Auto-insert the creator as the owner of the board
  const localUser = await db.query.users.findFirst({
    where: eq(users.clerkUserId, userId),
  });
  await db.insert(boardCollaborators).values({
    boardId: board.id,
    userId: localUser?.id ?? null,
    email: localUser?.email ?? "",
    role: "owner",
    invitedByClerkUserId: userId,
    acceptedAt: localUser ? new Date() : null,
  });

  // Create template columns
  const cols = BOARD_TEMPLATES[data.template] || BOARD_TEMPLATES["blank"];
  for (let i = 0; i < cols.length; i++) {
    await db.insert(kanbanColumns).values({
      boardId: board.id,
      name: cols[i],
      position: i,
    });
  }

  revalidatePath("/dashboard/tasks");
  return board;
}

export async function updateBoard(
  id: number,
  data: Partial<{ name: string; color: string }>
) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthenticated");

  const [board] = await db
    .update(kanbanBoards)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(kanbanBoards.id, id), eq(kanbanBoards.clerkUserId, userId)))
    .returning();

  revalidatePath("/dashboard/tasks");
  return board;
}

export async function deleteBoard(id: number) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthenticated");

  await db
    .delete(kanbanBoards)
    .where(and(eq(kanbanBoards.id, id), eq(kanbanBoards.clerkUserId, userId)));

  revalidatePath("/dashboard/tasks");
}

/* ═══════════════════════════════════════════════
   Columns
   ═══════════════════════════════════════════════ */

export async function getColumns(boardId: number) {
  const columns = await db
    .select()
    .from(kanbanColumns)
    .where(eq(kanbanColumns.boardId, boardId))
    .orderBy(asc(kanbanColumns.position));

  return columns;
}

export async function createColumn(boardId: number, name: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthenticated");

  // Get max position
  const existing = await db
    .select({ maxPos: sql<number>`COALESCE(MAX(${kanbanColumns.position}), -1)` })
    .from(kanbanColumns)
    .where(eq(kanbanColumns.boardId, boardId));

  const [col] = await db
    .insert(kanbanColumns)
    .values({
      boardId,
      name,
      position: (existing[0]?.maxPos ?? -1) + 1,
    })
    .returning();

  revalidatePath("/dashboard/tasks");
  return col;
}

export async function updateColumn(
  id: number,
  data: Partial<{ name: string }>
) {
  const [col] = await db
    .update(kanbanColumns)
    .set(data)
    .where(eq(kanbanColumns.id, id))
    .returning();

  revalidatePath("/dashboard/tasks");
  return col;
}

export async function deleteColumn(id: number) {
  await db.delete(kanbanColumns).where(eq(kanbanColumns.id, id));
  revalidatePath("/dashboard/tasks");
}

export async function updateColumnPositions(
  columns: { id: number; position: number }[]
) {
  for (const col of columns) {
    await db
      .update(kanbanColumns)
      .set({ position: col.position })
      .where(eq(kanbanColumns.id, col.id));
  }
  revalidatePath("/dashboard/tasks");
}

/* ═══════════════════════════════════════════════
   Tasks
   ═══════════════════════════════════════════════ */

export async function getTasks(boardId: number) {
  const tasks = await db
    .select()
    .from(kanbanTasks)
    .where(eq(kanbanTasks.boardId, boardId))
    .orderBy(asc(kanbanTasks.position));

  return tasks;
}

export async function createTask(data: {
  boardId: number;
  columnId: number;
  title: string;
  description?: string;
  priority?: string;
  category?: string;
  dueDate?: Date | null;
  estimatedDuration?: number;
  syncCalendar?: boolean;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthenticated");

  // Get max position in column
  const existing = await db
    .select({ maxPos: sql<number>`COALESCE(MAX(${kanbanTasks.position}), -1)` })
    .from(kanbanTasks)
    .where(
      and(
        eq(kanbanTasks.boardId, data.boardId),
        eq(kanbanTasks.columnId, data.columnId)
      )
    );

  let linkedCalendarTaskId: number | null = null;

  // Create linked calendar entry if requested
  if (data.syncCalendar && data.dueDate) {
    const [calTask] = await db
      .insert(calendarTasks)
      .values({
        clerkUserId: userId,
        title: data.title,
        description: data.description ?? null,
        startAt: data.dueDate,
        endAt: data.dueDate
          ? new Date(data.dueDate.getTime() + (data.estimatedDuration || 60) * 60000)
          : null,
        durationMinutes: data.estimatedDuration || 60,
        priority: data.priority || "medium",
        category: data.category || "work",
        type: "task",
        isDraft: false,
        reminder: false,
      })
      .returning();
    linkedCalendarTaskId = calTask.id;
  }

  const [task] = await db
    .insert(kanbanTasks)
    .values({
      boardId: data.boardId,
      columnId: data.columnId,
      title: data.title,
      description: data.description ?? null,
      priority: data.priority || "medium",
      category: data.category || "work",
      dueDate: data.dueDate ?? null,
      estimatedDuration: data.estimatedDuration || 60,
      position: (existing[0]?.maxPos ?? -1) + 1,
      linkedCalendarTaskId,
    })
    .returning();

  revalidatePath("/dashboard/tasks");
  revalidatePath("/dashboard/calendar");
  return task;
}

export async function updateTask(
  id: number,
  data: Partial<{
    title: string;
    description: string | null;
    priority: string;
    category: string;
    dueDate: Date | null;
    estimatedDuration: number;
    completed: boolean;
    linkedNoteId: number | null;
  }>
) {
  const [task] = await db
    .update(kanbanTasks)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(kanbanTasks.id, id))
    .returning();

  revalidatePath("/dashboard/tasks");
  return task;
}

export async function deleteTask(id: number) {
  await db.delete(kanbanTasks).where(eq(kanbanTasks.id, id));
  revalidatePath("/dashboard/tasks");
}

export async function moveTask(
  taskId: number,
  newColumnId: number,
  newPosition: number
) {
  await db
    .update(kanbanTasks)
    .set({
      columnId: newColumnId,
      position: newPosition,
      updatedAt: new Date(),
    })
    .where(eq(kanbanTasks.id, taskId));

  revalidatePath("/dashboard/tasks");
}

export async function updateTaskPositions(
  tasks: { id: number; columnId: number; position: number }[]
) {
  for (const t of tasks) {
    await db
      .update(kanbanTasks)
      .set({ columnId: t.columnId, position: t.position, updatedAt: new Date() })
      .where(eq(kanbanTasks.id, t.id));
  }
  revalidatePath("/dashboard/tasks");
}
