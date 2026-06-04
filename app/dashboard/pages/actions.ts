"use server";

import { auth } from "@clerk/nextjs/server";
import { and, desc, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db, spacePages, spaces, users } from "@/db";
import type { Space, SpacePage } from "@/db/schema";

const PAGES_PATH = "/dashboard/pages";

export type SpaceWithStats = Space & {
  pageCount: number;
  activePageCount: number;
};

export type PageTemplate =
  | "Blank Page"
  | "Project Plan"
  | "Meeting Notes"
  | "PRD"
  | "Research Notes"
  | "Task Plan";

async function requireUserId() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  return userId;
}

async function assertOwnsSpace(spaceId: number, userId: string) {
  const [space] = await db
    .select()
    .from(spaces)
    .where(and(eq(spaces.id, spaceId), eq(spaces.clerkUserId, userId)));

  if (!space) throw new Error("Space not found");
  return space;
}

export async function getSpaces(): Promise<SpaceWithStats[]> {
  const userId = await requireUserId();

  const dbUser = await db.query.users.findFirst({
    where: eq(users.clerkUserId, userId),
  });

  if (dbUser && !dbUser.hasOnboardedPages) {
    const [defaultSpace] = await db
      .insert(spaces)
      .values({
        clerkUserId: userId,
        name: "Personal Workspace",
        description: "A private space for your notes and tasks.",
        color: "#2563eb",
        isFavorite: true,
      })
      .returning();

    await db.insert(spacePages).values([
      {
        spaceId: defaultSpace.id,
        clerkUserId: userId,
        title: "To-Do List",
        type: "Task Plan",
        summary: "Track your daily tasks here.",
      },
      {
        spaceId: defaultSpace.id,
        clerkUserId: userId,
        title: "Meeting Notes",
        type: "Meeting Notes",
        summary: "Notes from weekly syncs.",
      },
      {
        spaceId: defaultSpace.id,
        clerkUserId: userId,
        title: "Ideas & Research",
        type: "Research Notes",
        summary: "Brainstorming and random thoughts.",
      },
    ]);

    await db
      .update(users)
      .set({ hasOnboardedPages: true })
      .where(eq(users.id, dbUser.id));
  }

  const rows = await db
    .select({
      id: spaces.id,
      clerkUserId: spaces.clerkUserId,
      name: spaces.name,
      description: spaces.description,
      color: spaces.color,
      isFavorite: spaces.isFavorite,
      isArchived: spaces.isArchived,
      lastOpenedAt: spaces.lastOpenedAt,
      createdAt: spaces.createdAt,
      updatedAt: spaces.updatedAt,
      pageCount: sql<number>`count(${spacePages.id})`,
      activePageCount: sql<number>`count(${spacePages.id}) filter (where ${spacePages.isArchived} = false)`,
    })
    .from(spaces)
    .leftJoin(spacePages, eq(spacePages.spaceId, spaces.id))
    .where(eq(spaces.clerkUserId, userId))
    .groupBy(
      spaces.id,
      spaces.clerkUserId,
      spaces.name,
      spaces.description,
      spaces.color,
      spaces.isFavorite,
      spaces.isArchived,
      spaces.lastOpenedAt,
      spaces.createdAt,
      spaces.updatedAt
    )
    .orderBy(desc(spaces.updatedAt));

  return rows.map((row) => ({
    ...row,
    pageCount: Number(row.pageCount),
    activePageCount: Number(row.activePageCount),
  }));
}

export async function createSpace(data: {
  name: string;
  description?: string | null;
  color: string;
}) {
  const userId = await requireUserId();
  const [space] = await db
    .insert(spaces)
    .values({
      clerkUserId: userId,
      name: data.name.trim(),
      description: data.description?.trim() || null,
      color: data.color,
    })
    .returning();

  revalidatePath(PAGES_PATH);
  return space;
}

export async function updateSpace(
  id: number,
  data: Partial<{
    name: string;
    description: string | null;
    color: string;
    isFavorite: boolean;
    isArchived: boolean;
    lastOpenedAt: Date | null;
  }>
) {
  const userId = await requireUserId();
  await assertOwnsSpace(id, userId);

  const [space] = await db
    .update(spaces)
    .set({
      ...data,
      name: data.name?.trim(),
      description:
        data.description === undefined ? undefined : data.description?.trim() || null,
      updatedAt: new Date(),
    })
    .where(and(eq(spaces.id, id), eq(spaces.clerkUserId, userId)))
    .returning();

  revalidatePath(PAGES_PATH);
  return space;
}

export async function deleteSpace(id: number) {
  const userId = await requireUserId();
  await db
    .delete(spaces)
    .where(and(eq(spaces.id, id), eq(spaces.clerkUserId, userId)));
  revalidatePath(PAGES_PATH);
}

export async function duplicateSpace(id: number) {
  const userId = await requireUserId();
  const existing = await assertOwnsSpace(id, userId);
  const pages = await db
    .select()
    .from(spacePages)
    .where(and(eq(spacePages.spaceId, id), eq(spacePages.clerkUserId, userId)));

  const [copy] = await db
    .insert(spaces)
    .values({
      clerkUserId: userId,
      name: `${existing.name} Copy`,
      description: existing.description,
      color: existing.color,
      isFavorite: false,
      isArchived: false,
    })
    .returning();

  for (const page of pages) {
    await db.insert(spacePages).values({
      spaceId: copy.id,
      clerkUserId: userId,
      title: page.title,
      type: page.type,
      summary: page.summary,
      content: page.content,
      linkedTaskCount: page.linkedTaskCount,
    });
  }

  revalidatePath(PAGES_PATH);
  return copy;
}

export async function getPagesForSpace(
  spaceId: number,
  includeArchived = false
): Promise<SpacePage[]> {
  const userId = await requireUserId();
  await assertOwnsSpace(spaceId, userId);

  await db
    .update(spaces)
    .set({ lastOpenedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(spaces.id, spaceId), eq(spaces.clerkUserId, userId)));

  const clauses = [
    eq(spacePages.spaceId, spaceId),
    eq(spacePages.clerkUserId, userId),
  ];
  if (!includeArchived) clauses.push(eq(spacePages.isArchived, false));

  return db
    .select()
    .from(spacePages)
    .where(and(...clauses))
    .orderBy(desc(spacePages.updatedAt));
}

export async function createPage(data: {
  spaceId: number;
  title: string;
  type: PageTemplate;
  summary?: string | null;
}) {
  const userId = await requireUserId();
  await assertOwnsSpace(data.spaceId, userId);

  const [page] = await db
    .insert(spacePages)
    .values({
      spaceId: data.spaceId,
      clerkUserId: userId,
      title: data.title.trim(),
      type: data.type,
      summary: data.summary?.trim() || null,
    })
    .returning();

  await db
    .update(spaces)
    .set({ updatedAt: new Date() })
    .where(and(eq(spaces.id, data.spaceId), eq(spaces.clerkUserId, userId)));

  revalidatePath(PAGES_PATH);
  return page;
}

export async function updatePage(
  id: number,
  data: Partial<{
    spaceId: number;
    title: string;
    type: PageTemplate;
    summary: string | null;
    content: any;
    isFavorite: boolean;
    isArchived: boolean;
    lastOpenedAt: Date | null;
  }>
) {
  const userId = await requireUserId();
  const [existing] = await db
    .select()
    .from(spacePages)
    .where(and(eq(spacePages.id, id), eq(spacePages.clerkUserId, userId)));
  if (!existing) throw new Error("Page not found");

  if (data.spaceId !== undefined) {
    await assertOwnsSpace(data.spaceId, userId);
  }

  const [page] = await db
    .update(spacePages)
    .set({
      ...data,
      title: data.title?.trim(),
      summary: data.summary === undefined ? undefined : data.summary?.trim() || null,
      updatedAt: new Date(),
    })
    .where(and(eq(spacePages.id, id), eq(spacePages.clerkUserId, userId)))
    .returning();

  await db
    .update(spaces)
    .set({ updatedAt: new Date() })
    .where(eq(spaces.id, page.spaceId));

  revalidatePath(PAGES_PATH);
  return page;
}

export async function duplicatePage(id: number) {
  const userId = await requireUserId();
  const [existing] = await db
    .select()
    .from(spacePages)
    .where(and(eq(spacePages.id, id), eq(spacePages.clerkUserId, userId)));
  if (!existing) throw new Error("Page not found");

  const [page] = await db
    .insert(spacePages)
    .values({
      spaceId: existing.spaceId,
      clerkUserId: userId,
      title: `${existing.title} Copy`,
      type: existing.type,
      summary: existing.summary,
      content: existing.content,
      linkedTaskCount: existing.linkedTaskCount,
    })
    .returning();

  await db
    .update(spaces)
    .set({ updatedAt: new Date() })
    .where(and(eq(spaces.id, existing.spaceId), eq(spaces.clerkUserId, userId)));

  revalidatePath(PAGES_PATH);
  return page;
}

export async function deletePage(id: number) {
  const userId = await requireUserId();
  const [existing] = await db
    .select()
    .from(spacePages)
    .where(and(eq(spacePages.id, id), eq(spacePages.clerkUserId, userId)));
  if (!existing) return;

  await db
    .delete(spacePages)
    .where(and(eq(spacePages.id, id), eq(spacePages.clerkUserId, userId)));

  await db
    .update(spaces)
    .set({ updatedAt: new Date() })
    .where(and(eq(spaces.id, existing.spaceId), eq(spaces.clerkUserId, userId)));

  revalidatePath(PAGES_PATH);
}
