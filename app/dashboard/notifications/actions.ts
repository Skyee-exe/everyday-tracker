"use server";

import { auth } from "@clerk/nextjs/server";
import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { notifications } from "@/db/schema";

async function requireUserId() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthenticated");
  return userId;
}

export async function getNotifications() {
  const userId = await requireUserId();

  return db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(sql`${notifications.createdAt} desc`);
}

export async function markAsRead(id: number) {
  const userId = await requireUserId();

  const [updated] = await db
    .update(notifications)
    .set({ isRead: true })
    .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
    .returning();

  return updated;
}

export async function markAllAsRead() {
  const userId = await requireUserId();

  const updated = await db
    .update(notifications)
    .set({ isRead: true })
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)))
    .returning();

  return updated;
}

export async function deleteNotification(id: number) {
  const userId = await requireUserId();

  await db
    .delete(notifications)
    .where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
}

export async function createNotification(data: {
  userId: string;
  type: string;
  title: string;
  message: string;
  entityType?: string;
  entityId?: string;
}) {
  const [created] = await db
    .insert(notifications)
    .values({
      userId: data.userId,
      type: data.type,
      title: data.title,
      message: data.message,
      entityType: data.entityType || null,
      entityId: data.entityId || null,
      isRead: false,
    })
    .returning();

  return created;
}

export async function triggerDemoNotifications() {
  const userId = await requireUserId();

  const demoItems = [
    {
      userId,
      type: "mention",
      title: "Rahul mentioned you in Sprint Review",
      message: "Hey, can we verify if theRate Limiting tasks are scheduled for today?",
      entityType: "task",
      entityId: "sprint-review",
    },
    {
      userId,
      type: "comment",
      title: "Aditi commented on Design System Notes",
      message: "'This typography sizing looks amazing! Let's implement it globally.'",
      entityType: "note",
      entityId: "design-system-notes",
    },
    {
      userId,
      type: "calendar",
      title: "Physics Revision starts in 1 hour",
      message: "Reminder: Physics Revision is scheduled from 11:30 AM to 1:00 PM.",
      entityType: "calendar",
      entityId: "physics-revision",
    },
    {
      userId,
      type: "system",
      title: "Workspace Update: v1.1.0 Released",
      message: "Enjoy a faster UI, dynamic notes/calendar category scopes, and settings validation.",
    },
    {
      userId,
      type: "task",
      title: "Task Assigned: Deploy Frontend v2.1",
      message: "Deploy Frontend v2.1 has been added and assigned to you by Soham.",
      entityType: "task",
      entityId: "deploy-frontend",
    },
  ];

  const created = await db.insert(notifications).values(demoItems).returning();
  return created;
}
