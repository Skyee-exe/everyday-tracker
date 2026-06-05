"use server";

import { db, notes, userCategories } from "@/db";
import { eq, and, sql } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { createNotification } from "@/app/dashboard/notifications/actions";
import { getActiveWorkspacePlan } from "@/app/dashboard/workspaces/actions";

export async function getNotes() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  return db.select().from(notes).where(eq(notes.clerkUserId, userId));
}

export async function getNotesCategories() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  return db
    .select()
    .from(userCategories)
    .where(and(eq(userCategories.clerkUserId, userId), eq(userCategories.scope, "notes")))
    .orderBy(userCategories.position, userCategories.name);
}

export async function createNote(templateData?: { title: string; content: any }) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const plan = await getActiveWorkspacePlan(userId);
  if (plan === "Free") {
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(notes)
      .where(and(eq(notes.clerkUserId, userId), eq(notes.isTrash, false)));
    if (Number(count) >= 10) {
      throw new Error("Free plan is limited to 10 notes. Upgrade to Pro for unlimited notes.");
    }
  }

  const [note] = await db
    .insert(notes)
    .values({
      clerkUserId: userId,
      title: templateData?.title || "Untitled",
      content: templateData?.content || null,
    })
    .returning();

  await createNotification({
    userId,
    type: "note",
    title: "New Note Created",
    message: `Note "${note.title}" has been created.`,
    entityType: "note",
    entityId: String(note.id),
  });

  revalidatePath("/dashboard/notes");
  return note;
}

export async function updateNote(id: number, data: Partial<typeof notes.$inferInsert>) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const [updated] = await db
    .update(notes)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(notes.id, id), eq(notes.clerkUserId, userId)))
    .returning();

  if (data.title !== undefined || data.content !== undefined) {
    await createNotification({
      userId,
      type: "note",
      title: "Note Updated",
      message: `Note "${updated.title}" was updated.`,
      entityType: "note",
      entityId: String(updated.id),
    });
  }

  revalidatePath("/dashboard/notes");
  return updated;
}

export async function duplicateNote(id: number) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const [existing] = await db.select().from(notes).where(and(eq(notes.id, id), eq(notes.clerkUserId, userId)));
  if (!existing) throw new Error("Not found");

  const plan = await getActiveWorkspacePlan(userId);
  if (plan === "Free") {
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(notes)
      .where(and(eq(notes.clerkUserId, userId), eq(notes.isTrash, false)));
    if (Number(count) >= 10) {
      throw new Error("Free plan is limited to 10 notes. Upgrade to Pro for unlimited notes.");
    }
  }
  
  const [note] = await db
    .insert(notes)
    .values({
      clerkUserId: userId,
      title: `${existing.title} (Copy)`,
      content: existing.content,
      icon: existing.icon,
      color: existing.color,
      category: existing.category,
    })
    .returning();
  revalidatePath("/dashboard/notes");
  return note;
}

export async function moveToTrash(id: number) {
  return updateNote(id, { isTrash: true, isPinned: false, isFavorite: false });
}

export async function restoreNote(id: number) {
  return updateNote(id, { isTrash: false });
}

export async function emptyTrash() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  await db.delete(notes).where(and(eq(notes.clerkUserId, userId), eq(notes.isTrash, true)));
  revalidatePath("/dashboard/notes");
}

export async function togglePin(id: number, isPinned: boolean) {
  return updateNote(id, { isPinned });
}

export async function toggleFavorite(id: number, isFavorite: boolean) {
  return updateNote(id, { isFavorite });
}

export async function updateColor(id: number, color: string | null) {
  return updateNote(id, { color });
}

export async function updateIcon(id: number, icon: string | null) {
  return updateNote(id, { icon });
}

export async function updateCategory(id: number, category: string | null) {
  return updateNote(id, { category });
}
