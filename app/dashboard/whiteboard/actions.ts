"use server";

import { auth } from "@clerk/nextjs/server";
import { and, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db, whiteboards } from "@/db";

export type WhiteboardScene = {
  elements?: unknown[];
  appState?: Record<string, unknown> | null;
  files?: Record<string, unknown>;
};

const DEFAULT_SCENE: WhiteboardScene = {
  elements: [],
  appState: {
    viewBackgroundColor: "#ffffff",
    gridModeEnabled: true,
  },
  files: {},
};

const COLORS = [
  "#2563eb",
  "#0891b2",
  "#16a34a",
  "#d97706",
  "#dc2626",
  "#7c3aed",
];

function requireUserId() {
  return auth().then(({ userId }) => {
    if (!userId) throw new Error("Unauthorized");
    return userId;
  });
}

function normalizeScene(scene: unknown): WhiteboardScene {
  if (!scene || typeof scene !== "object") return DEFAULT_SCENE;

  const value = scene as WhiteboardScene;
  return {
    elements: Array.isArray(value.elements) ? value.elements : [],
    appState:
      value.appState && typeof value.appState === "object"
        ? value.appState
        : DEFAULT_SCENE.appState,
    files:
      value.files && typeof value.files === "object" && !Array.isArray(value.files)
        ? value.files
        : {},
  };
}

export async function getWhiteboards() {
  const userId = await requireUserId();

  return db
    .select()
    .from(whiteboards)
    .where(eq(whiteboards.clerkUserId, userId))
    .orderBy(desc(whiteboards.updatedAt));
}

export async function createWhiteboard(data?: { name?: string; color?: string }) {
  const userId = await requireUserId();
  const color = data?.color || COLORS[Math.floor(Math.random() * COLORS.length)];

  const [board] = await db
    .insert(whiteboards)
    .values({
      clerkUserId: userId,
      name: data?.name?.trim() || "Untitled whiteboard",
      color,
      scene: DEFAULT_SCENE,
    })
    .returning();

  revalidatePath("/dashboard/whiteboard");
  return board;
}

export async function renameWhiteboard(id: number, name: string) {
  const userId = await requireUserId();
  const trimmedName = name.trim();
  if (!trimmedName) throw new Error("Whiteboard name is required");

  const [board] = await db
    .update(whiteboards)
    .set({ name: trimmedName, updatedAt: new Date() })
    .where(and(eq(whiteboards.id, id), eq(whiteboards.clerkUserId, userId)))
    .returning();

  if (!board) throw new Error("Whiteboard not found");
  revalidatePath("/dashboard/whiteboard");
  return board;
}

export async function deleteWhiteboard(id: number) {
  const userId = await requireUserId();

  await db
    .delete(whiteboards)
    .where(and(eq(whiteboards.id, id), eq(whiteboards.clerkUserId, userId)));

  revalidatePath("/dashboard/whiteboard");
}

export async function updateWhiteboardScene(id: number, scene: WhiteboardScene) {
  const userId = await requireUserId();
  const safeScene = normalizeScene(scene);

  const [board] = await db
    .update(whiteboards)
    .set({ scene: safeScene, updatedAt: new Date() })
    .where(and(eq(whiteboards.id, id), eq(whiteboards.clerkUserId, userId)))
    .returning();

  if (!board) throw new Error("Whiteboard not found");
  return board;
}
