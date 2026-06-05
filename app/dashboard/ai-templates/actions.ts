"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { auth } from "@clerk/nextjs/server";
import { and, desc, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db, generatedApps } from "@/db";
import type { GeneratedApp } from "@/db/schema";
import { getActiveWorkspacePlan } from "@/app/dashboard/workspaces/actions";

const AI_TEMPLATES_PATH = "/dashboard/ai-templates";
const MAX_GENERATED_APPS = 3;
const COLORS = ["#2563eb", "#0891b2", "#16a34a", "#d97706", "#dc2626", "#7c3aed"];
const ICONS = ["Sparkles", "Calendar", "ListChecks", "Wallet", "BookOpen", "Utensils", "BarChart3", "Target"];

export type GeneratedAppJson = {
  appName: string;
  description: string;
  icon: string;
  color: string;
  layout: "single-page";
  appType: string;
  sections: Array<{
    title: string;
    type: "stats" | "list" | "table" | "form" | "progress" | "checklist" | "buttons" | "chart";
    description?: string;
    items?: string[];
    columns?: string[];
  }>;
  components: string[];
  fields: Array<{
    label: string;
    type: "text" | "number" | "date" | "select" | "checkbox";
    placeholder?: string;
    options?: string[];
  }>;
  actions: string[];
  sampleData: Array<Record<string, string | number | boolean>>;
};

function extractJson(text: string) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1] ?? text;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) throw new Error("AI did not return JSON");
  return JSON.parse(candidate.slice(start, end + 1));
}

function cleanText(value: unknown, fallback: string, max = 120) {
  const text = String(value || fallback).trim().replace(/\s+/g, " ");
  return text.slice(0, max);
}

function cleanColor(value: unknown, fallbackIndex = 0) {
  const color = String(value || "");
  return /^#[0-9a-f]{6}$/i.test(color) ? color : COLORS[fallbackIndex % COLORS.length];
}

function asArray(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function normalizeGeneratedApp(value: unknown, prompt: string): GeneratedAppJson {
  if (!value || typeof value !== "object") throw new Error("Invalid app JSON");
  const raw = value as Record<string, unknown>;
  const sections = asArray(raw.sections).slice(0, 8).map((section, index) => {
    const item = section && typeof section === "object" ? (section as Record<string, unknown>) : {};
    const type = cleanText(item.type, index === 0 ? "stats" : "list", 20).toLowerCase();
    const allowedTypes = new Set(["stats", "list", "table", "form", "progress", "checklist", "buttons", "chart"]);
    return {
      title: cleanText(item.title, `Section ${index + 1}`, 60),
      type: (allowedTypes.has(type) ? type : "list") as GeneratedAppJson["sections"][number]["type"],
      description: item.description ? cleanText(item.description, "", 120) : undefined,
      items: asArray(item.items).slice(0, 8).map((entry, itemIndex) => cleanText(entry, `Item ${itemIndex + 1}`, 60)),
      columns: asArray(item.columns).slice(0, 5).map((entry, itemIndex) => cleanText(entry, `Column ${itemIndex + 1}`, 40)),
    };
  });

  const fields = asArray(raw.fields).slice(0, 8).map((field, index) => {
    const item = field && typeof field === "object" ? (field as Record<string, unknown>) : {};
    const type = cleanText(item.type, "text", 20).toLowerCase();
    const allowedTypes = new Set(["text", "number", "date", "select", "checkbox"]);
    return {
      label: cleanText(item.label, `Field ${index + 1}`, 48),
      type: (allowedTypes.has(type) ? type : "text") as GeneratedAppJson["fields"][number]["type"],
      placeholder: item.placeholder ? cleanText(item.placeholder, "", 80) : undefined,
      options: asArray(item.options).slice(0, 5).map((entry, itemIndex) => cleanText(entry, `Option ${itemIndex + 1}`, 40)),
    };
  });

  const appName = cleanText(raw.appName, "Generated Tracker", 48);
  return {
    appName,
    description: cleanText(raw.description, `A focused app generated from: ${prompt}`, 160),
    icon: ICONS.includes(String(raw.icon)) ? String(raw.icon) : "Sparkles",
    color: cleanColor(raw.color, appName.length),
    layout: "single-page",
    appType: cleanText(raw.appType, "tracker", 40).toLowerCase(),
    sections: sections.length ? sections : [
      { title: "Overview", type: "stats", items: ["Today", "Progress", "Next step"] },
      { title: "Plan", type: "checklist", items: ["Add first item", "Review progress", "Complete task"] },
    ],
    components: asArray(raw.components).slice(0, 10).map((entry) => cleanText(entry, "Component", 50)),
    fields: fields.length ? fields : [
      { label: "Title", type: "text", placeholder: "Add an item" },
      { label: "Due date", type: "date" },
    ],
    actions: asArray(raw.actions ?? raw.actionsButtons).slice(0, 6).map((entry) => cleanText(entry, "Add item", 40)),
    sampleData: asArray(raw.sampleData)
      .slice(0, 6)
      .map((row) => (row && typeof row === "object" ? (row as Record<string, string | number | boolean>) : {})),
  };
}

async function requireUserId() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  return userId;
}

export async function getGeneratedApps(): Promise<GeneratedApp[]> {
  const userId = await requireUserId();
  return db
    .select()
    .from(generatedApps)
    .where(eq(generatedApps.clerkUserId, userId))
    .orderBy(desc(generatedApps.updatedAt));
}

export async function generateTemplateApp(prompt: string) {
  const userId = await requireUserId();
  const userPrompt = prompt.trim();
  if (!userPrompt) throw new Error("Prompt is required");

  const plan = await getActiveWorkspacePlan(userId);
  if (plan === "Free") {
    throw new Error("AI Template Builder is only available on the Paid plan. Upgrade to Pro to use this feature.");
  }

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(generatedApps)
    .where(eq(generatedApps.clerkUserId, userId));

  if (Number(count) >= MAX_GENERATED_APPS) {
    throw new Error(`You can create up to ${MAX_GENERATED_APPS} generated apps. Delete one to create another.`);
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) throw new Error("AI API key not configured");

  const genAI = new GoogleGenerativeAI(apiKey);
  const promptBody = `
You are designing a single-page productivity mini app for Everyday Workspace.
User prompt: "${userPrompt}"

Return strict JSON only. Do not include markdown, comments, or explanations.
Required shape:
{
  "appName": "Habit Tracker",
  "description": "Track habits, streaks, and weekly progress.",
  "icon": "Sparkles | Calendar | ListChecks | Wallet | BookOpen | Utensils | BarChart3 | Target",
  "color": "#2563eb",
  "layout": "single-page",
  "appType": "tracker | planner | budget | study | meal | fitness | custom",
  "sections": [
    { "title": "Overview", "type": "stats", "description": "short helper text", "items": ["Total", "Due today", "Progress"] },
    { "title": "Tasks", "type": "checklist", "items": ["Item one", "Item two"] },
    { "title": "Details", "type": "table", "columns": ["Name", "Status", "Due"] }
  ],
  "components": ["Stats cards", "Checklist", "Progress bars"],
  "fields": [
    { "label": "Name", "type": "text", "placeholder": "Add a name" },
    { "label": "Status", "type": "select", "options": ["Planned", "Active", "Done"] }
  ],
  "actions": ["Add item", "Mark done", "Review"],
  "sampleData": [{ "name": "Example", "status": "Active", "progress": 60 }]
}

Use 3 to 5 sections, 3 to 7 fields, and realistic sample data. Keep text concise.
`;

  let responseText = "";
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(promptBody);
    responseText = result.response.text();
  } catch (err25) {
    console.warn("gemini-2.5-flash failed, falling back to gemini-1.5-flash:", err25);
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent(promptBody);
      responseText = result.response.text();
    } catch (err15) {
      console.warn("gemini-1.5-flash failed, falling back to gemini-2.0-flash:", err15);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      const result = await model.generateContent(promptBody);
      responseText = result.response.text();
    }
  }

  const appJson = normalizeGeneratedApp(extractJson(responseText), userPrompt);
  const [app] = await db
    .insert(generatedApps)
    .values({
      clerkUserId: userId,
      appName: appJson.appName,
      description: appJson.description,
      icon: appJson.icon,
      color: appJson.color,
      layout: appJson.layout,
      appJson,
      inSidebar: false,
    })
    .returning();

  revalidatePath(AI_TEMPLATES_PATH);
  return app;
}

export async function markGeneratedAppOpened(id: number) {
  const userId = await requireUserId();
  await db
    .update(generatedApps)
    .set({ lastOpenedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(generatedApps.id, id), eq(generatedApps.clerkUserId, userId)));
  revalidatePath(AI_TEMPLATES_PATH);
}

export async function deleteGeneratedApp(id: number) {
  const userId = await requireUserId();
  await db
    .delete(generatedApps)
    .where(and(eq(generatedApps.id, id), eq(generatedApps.clerkUserId, userId)));
  revalidatePath(AI_TEMPLATES_PATH);
}

export async function toggleAppSidebar(id: number, inSidebar: boolean) {
  const userId = await requireUserId();

  if (inSidebar) {
    // Check if user already has 3 apps pinned in the sidebar
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(generatedApps)
      .where(and(eq(generatedApps.clerkUserId, userId), eq(generatedApps.inSidebar, true)));

    if (Number(count) >= 3) {
      throw new Error("Maximum 3 generated apps can be added to the sidebar. Remove one first.");
    }
  }

  await db
    .update(generatedApps)
    .set({ inSidebar, updatedAt: new Date() })
    .where(and(eq(generatedApps.id, id), eq(generatedApps.clerkUserId, userId)));

  revalidatePath(AI_TEMPLATES_PATH);
}

export async function updateGeneratedAppJson(id: number, appJson: GeneratedAppJson) {
  const userId = await requireUserId();

  await db
    .update(generatedApps)
    .set({ appJson, updatedAt: new Date() })
    .where(and(eq(generatedApps.id, id), eq(generatedApps.clerkUserId, userId)));

  revalidatePath(AI_TEMPLATES_PATH);
}
