import { auth } from "@clerk/nextjs/server";
import { and, eq, isNull, or, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  boardCollaborators,
  kanbanBoards,
  kanbanTasks,
  users,
} from "@/db/schema";
import {
  isCollabRole,
  meetsRole,
  type CollabRole,
} from "./collab/permissions";

export type AccessContext = {
  clerkUserId: string;
  email: string;
  userId: number;
};

async function resolveContext(): Promise<AccessContext | null> {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;
  const u = await db.query.users.findFirst({
    where: eq(users.clerkUserId, clerkId),
  });
  if (!u) return null;
  return { clerkUserId: clerkId, email: u.email, userId: u.id };
}

export async function getAccessContext(): Promise<AccessContext | null> {
  return resolveContext();
}

export async function canAccessBoard(
  boardId: number,
  minRole: CollabRole = "viewer"
): Promise<{ role: CollabRole; context: AccessContext } | null> {
  const ctx = await resolveContext();
  if (!ctx) return null;

  const board = await db.query.kanbanBoards.findFirst({
    where: eq(kanbanBoards.id, boardId),
  });
  if (!board) return null;

  if (board.clerkUserId === ctx.clerkUserId) {
    if (!meetsRole("owner", minRole)) return null;
    return { role: "owner", context: ctx };
  }

  const rows = await db
    .select({ role: boardCollaborators.role, userId: boardCollaborators.userId })
    .from(boardCollaborators)
    .where(
      and(
        eq(boardCollaborators.boardId, boardId),
        or(
          eq(boardCollaborators.userId, ctx.userId),
          sql`LOWER(${boardCollaborators.email}) = LOWER(${ctx.email})`
        )
      )
    );

  for (const row of rows) {
    if (isCollabRole(row.role) && meetsRole(row.role, minRole)) {
      return { role: row.role, context: ctx };
    }
  }

  return null;
}

export async function assertCanAccessBoard(
  boardId: number,
  minRole: CollabRole = "viewer"
): Promise<{ role: CollabRole; context: AccessContext }> {
  const access = await canAccessBoard(boardId, minRole);
  if (!access) throw new Error("FORBIDDEN");
  return access;
}

export async function canAccessTask(
  taskId: number,
  minRole: CollabRole = "viewer"
): Promise<{ role: CollabRole; context: AccessContext; boardId: number } | null> {
  const task = await db.query.kanbanTasks.findFirst({
    where: eq(kanbanTasks.id, taskId),
  });
  if (!task) return null;
  const access = await canAccessBoard(task.boardId, minRole);
  if (!access) return null;
  return { ...access, boardId: task.boardId };
}

export async function getBoardIdForTask(
  taskId: number
): Promise<number | null> {
  const task = await db.query.kanbanTasks.findFirst({
    where: eq(kanbanTasks.id, taskId),
  });
  return task?.boardId ?? null;
}

export async function autoAcceptPendingInvite(
  ctx: AccessContext
): Promise<void> {
  await db
    .update(boardCollaborators)
    .set({ userId: ctx.userId, acceptedAt: new Date() })
    .where(
      and(
        isNull(boardCollaborators.userId),
        sql`LOWER(${boardCollaborators.email}) = LOWER(${ctx.email})`
      )
    );
}
