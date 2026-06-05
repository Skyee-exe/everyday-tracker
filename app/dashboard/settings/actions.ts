"use server";

import { auth } from "@clerk/nextjs/server";
import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { generatedApps, userCategories, userSettings, notes, spaces, notifications } from "@/db/schema";

export type SettingsPayload = Partial<{
  theme: string;
  notificationsEnabled: boolean;
  defaultCalendarView: string;
  defaultTaskPriority: string;
  autosaveEnabled: boolean;
  dataExportPreference: string;
  privacyModeEnabled: boolean;
  securityAlertsEnabled: boolean;
  aiDefaultModel: string;
  aiBehavior: string;
  aiResponseStyle: string;
  aiRefineEnabled: boolean;
  aiAssistantEnabled: boolean;
  aiTemplateBuilderEnabled: boolean;
}>;

export type CategoryScope = "calendar" | "tasks" | "notes" | "reminders";

export type CategoryPayload = {
  scope: CategoryScope;
  name: string;
  color: string;
  icon: string;
  position?: number;
};

import { DEFAULT_CATEGORIES } from "./constants";

const SETTINGS_PATH = "/dashboard/settings";
const VALID_SCOPES = new Set<CategoryScope>(["calendar", "tasks", "notes", "reminders"]);

async function requireUserId() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthenticated");
  return userId;
}

function normalizeCategory(data: CategoryPayload) {
  const name = data.name.trim();
  if (!name) throw new Error("Category name is required");
  if (!VALID_SCOPES.has(data.scope)) throw new Error("Invalid category scope");
  return {
    scope: data.scope,
    name,
    color: data.color || "#2563eb",
    icon: data.icon || "Tag",
    position: data.position ?? 0,
  };
}

export async function getOrCreateUserSettings() {
  const userId = await requireUserId();

  const existing = await db.query.userSettings.findFirst({
    where: eq(userSettings.clerkUserId, userId),
  });
  if (existing) return existing;

  const [created] = await db
    .insert(userSettings)
    .values({ clerkUserId: userId })
    .returning();

  return created;
}

export async function getSettingsData() {
  const userId = await requireUserId();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [settings, appUsage, notesUsage, spacesUsage, aiActionsUsage] = await Promise.all([
    getOrCreateUserSettings(),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(generatedApps)
      .where(eq(generatedApps.clerkUserId, userId)),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(notes)
      .where(and(eq(notes.clerkUserId, userId), eq(notes.isTrash, false))),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(spaces)
      .where(and(eq(spaces.clerkUserId, userId), eq(spaces.isArchived, false))),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.type, "ai_action"),
          sql`${notifications.createdAt} >= ${today}`
        )
      ),
  ]);

  let categories = await db
    .select()
    .from(userCategories)
    .where(eq(userCategories.clerkUserId, userId))
    .orderBy(userCategories.scope, userCategories.position, userCategories.name);

  if (categories.length === 0) {
    const toInsert = [];
    for (const scope of VALID_SCOPES) {
      const defaults = DEFAULT_CATEGORIES[scope] || [];
      for (const d of defaults) {
        toInsert.push({
          clerkUserId: userId,
          scope: d.scope,
          name: d.name,
          color: d.color,
          icon: d.icon,
          position: d.position,
        });
      }
    }
    if (toInsert.length > 0) {
      categories = await db.insert(userCategories).values(toInsert).returning();
      categories.sort((a, b) => {
        if (a.scope !== b.scope) return a.scope.localeCompare(b.scope);
        if (a.position !== b.position) return a.position - b.position;
        return a.name.localeCompare(b.name);
      });
    }
  }

  return {
    settings,
    categories,
    usage: {
      generatedApps: appUsage[0]?.count ?? 0,
      notesCount: notesUsage[0]?.count ?? 0,
      spacesCount: spacesUsage[0]?.count ?? 0,
      aiActionsCount: aiActionsUsage[0]?.count ?? 0,
    },
  };
}

export async function updateUserSettings(data: SettingsPayload) {
  const userId = await requireUserId();

  const [updated] = await db
    .insert(userSettings)
    .values({
      clerkUserId: userId,
      ...data,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: userSettings.clerkUserId,
      set: {
        ...data,
        updatedAt: new Date(),
      },
    })
    .returning();

  revalidatePath(SETTINGS_PATH);
  return updated;
}

export async function createUserCategory(data: CategoryPayload) {
  const userId = await requireUserId();
  const category = normalizeCategory(data);

  const existing = await db.query.userCategories.findFirst({
    where: and(
      eq(userCategories.clerkUserId, userId),
      eq(userCategories.scope, category.scope),
      sql`lower(${userCategories.name}) = ${category.name.toLowerCase()}`
    )
  });
  if (existing) {
    throw new Error(`Category "${category.name}" already exists.`);
  }

  const [created] = await db
    .insert(userCategories)
    .values({
      clerkUserId: userId,
      ...category,
    })
    .returning();

  revalidatePath(SETTINGS_PATH);
  return created;
}

export async function updateUserCategory(id: number, data: Partial<CategoryPayload>) {
  const userId = await requireUserId();
  
  const existingCategory = await db.query.userCategories.findFirst({
    where: and(eq(userCategories.id, id), eq(userCategories.clerkUserId, userId))
  });
  if (!existingCategory) throw new Error("Category not found");

  const updateData: Partial<typeof userCategories.$inferInsert> = {
    updatedAt: new Date(),
  };

  const scope = data.scope || existingCategory.scope as CategoryScope;

  if (data.scope) {
    if (!VALID_SCOPES.has(data.scope)) throw new Error("Invalid category scope");
    updateData.scope = data.scope;
  }
  if (data.name !== undefined) {
    const name = data.name.trim();
    if (!name) throw new Error("Category name is required");

    const existing = await db.query.userCategories.findFirst({
      where: and(
        eq(userCategories.clerkUserId, userId),
        eq(userCategories.scope, scope),
        sql`lower(${userCategories.name}) = ${name.toLowerCase()}`,
        sql`${userCategories.id} != ${id}`
      )
    });
    if (existing) {
      throw new Error(`Category "${name}" already exists.`);
    }
    
    updateData.name = name;
  }
  if (data.color !== undefined) updateData.color = data.color || "#2563eb";
  if (data.icon !== undefined) updateData.icon = data.icon || "Tag";
  if (data.position !== undefined) updateData.position = data.position;

  const [updated] = await db
    .update(userCategories)
    .set(updateData)
    .where(and(eq(userCategories.id, id), eq(userCategories.clerkUserId, userId)))
    .returning();

  revalidatePath(SETTINGS_PATH);
  return updated;
}

export async function deleteUserCategory(id: number) {
  const userId = await requireUserId();

  await db
    .delete(userCategories)
    .where(and(eq(userCategories.id, id), eq(userCategories.clerkUserId, userId)));

  revalidatePath(SETTINGS_PATH);
}
