"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { calendarTasks } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

/* ─── Get all tasks for the current user ─── */
export async function getTasks() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthenticated");

  const tasks = await db
    .select()
    .from(calendarTasks)
    .where(eq(calendarTasks.clerkUserId, userId))
    .orderBy(calendarTasks.createdAt);

  return tasks;
}

/* ─── Create a new task ─── */
export async function createTask(data: {
  title: string;
  description?: string;
  startAt?: Date | null;
  endAt?: Date | null;
  durationMinutes?: number;
  priority?: string;
  category: string;
  type: string;
  isDraft: boolean;
  reminder: boolean;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthenticated");

  const [task] = await db
    .insert(calendarTasks)
    .values({
      clerkUserId: userId,
      title: data.title,
      description: data.description ?? null,
      startAt: data.startAt ?? null,
      endAt: data.endAt ?? null,
      durationMinutes: data.durationMinutes ?? 60,
      priority: data.priority ?? "medium",
      category: data.category,
      type: data.type,
      isDraft: data.isDraft,
      reminder: data.reminder,
    })
    .returning();

  revalidatePath("/dashboard/calendar");
  return task;
}

/* ─── Update a task (reschedule, complete, undraft, etc.) ─── */
export async function updateTask(
  id: number,
  data: Partial<{
    title: string;
    description: string | null;
    startAt: Date | null;
    endAt: Date | null;
    durationMinutes: number;
    priority: string;
    category: string;
    type: string;
    isDraft: boolean;
    reminder: boolean;
    completed: boolean;
  }>
) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthenticated");

  const [task] = await db
    .update(calendarTasks)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(calendarTasks.id, id), eq(calendarTasks.clerkUserId, userId)))
    .returning();

  revalidatePath("/dashboard/calendar");
  return task;
}

/* ─── Delete a task ─── */
export async function deleteTask(id: number) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthenticated");

  await db
    .delete(calendarTasks)
    .where(and(eq(calendarTasks.id, id), eq(calendarTasks.clerkUserId, userId)));

  revalidatePath("/dashboard/calendar");
}
