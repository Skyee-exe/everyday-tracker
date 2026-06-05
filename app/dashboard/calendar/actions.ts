"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { calendarTasks, userCategories } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { createNotification } from "@/app/dashboard/notifications/actions";

/* ─── Get custom categories ─── */
export async function getCalendarCategories() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthenticated");

  const categories = await db
    .select()
    .from(userCategories)
    .where(and(eq(userCategories.clerkUserId, userId), eq(userCategories.scope, "calendar")))
    .orderBy(userCategories.position, userCategories.name);

  return categories;
}

export async function getReminderCategories() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthenticated");

  const categories = await db
    .select()
    .from(userCategories)
    .where(and(eq(userCategories.clerkUserId, userId), eq(userCategories.scope, "reminders")))
    .orderBy(userCategories.position, userCategories.name);

  return categories;
}

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

  await createNotification({
    userId,
    type: data.type === "reminder" ? "reminder" : "calendar",
    title: data.type === "reminder" ? "Reminder Created" : "Calendar Event Created",
    message: `${data.type === "reminder" ? "Reminder" : "Event"} "${data.title}" was added to your schedule.`,
    entityType: "calendar",
    entityId: String(task.id),
  });

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
