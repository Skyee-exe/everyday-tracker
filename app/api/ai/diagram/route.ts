import { GoogleGenerativeAI } from "@google/generative-ai";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

type DiagramNode = {
  id: string;
  label: string;
  type: "rectangle" | "diamond" | "ellipse";
  color?: string;
};

type DiagramEdge = {
  from: string;
  to: string;
  label?: string;
};

const NODE_TYPES = new Set(["rectangle", "diamond", "ellipse"]);
const LAYOUTS = new Set(["flowchart", "mindmap", "system", "journey", "process"]);
const COLORS = ["#2563eb", "#0891b2", "#16a34a", "#d97706", "#dc2626", "#7c3aed"];

function extractJson(text: string) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1] ?? text;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("AI did not return JSON");
  }
  return JSON.parse(candidate.slice(start, end + 1));
}

function normalizeId(value: unknown, fallback: string) {
  const raw = String(value || fallback).trim().toLowerCase();
  return raw.replace(/[^a-z0-9_-]+/g, "-").replace(/^-|-$/g, "") || fallback;
}

function normalizeDiagram(value: unknown) {
  if (!value || typeof value !== "object") throw new Error("Invalid diagram");
  const raw = value as Record<string, unknown>;
  const rawNodes = Array.isArray(raw.nodes) ? raw.nodes : [];
  const rawEdges = Array.isArray(raw.edges) ? raw.edges : [];

  const nodes: DiagramNode[] = rawNodes.slice(0, 14).map((node, index) => {
    const item = node && typeof node === "object" ? (node as Record<string, unknown>) : {};
    const type = String(item.type || "rectangle").toLowerCase();
    const color = String(item.color || COLORS[index % COLORS.length]);

    return {
      id: normalizeId(item.id, `node-${index + 1}`),
      label: String(item.label || `Step ${index + 1}`).slice(0, 80),
      type: NODE_TYPES.has(type) ? (type as DiagramNode["type"]) : "rectangle",
      color: /^#[0-9a-f]{6}$/i.test(color) ? color : COLORS[index % COLORS.length],
    };
  });

  const nodeIds = new Set(nodes.map((node) => node.id));
  const edges: DiagramEdge[] = rawEdges
    .slice(0, 18)
    .map((edge) => {
      const item = edge && typeof edge === "object" ? (edge as Record<string, unknown>) : {};
      return {
        from: normalizeId(item.from, ""),
        to: normalizeId(item.to, ""),
        label: item.label ? String(item.label).slice(0, 40) : undefined,
      };
    })
    .filter((edge) => nodeIds.has(edge.from) && nodeIds.has(edge.to) && edge.from !== edge.to);

  if (nodes.length === 0) throw new Error("AI returned no diagram nodes");

  const layout = String(raw.layout || "flowchart").toLowerCase();
  return {
    title: String(raw.title || "Generated diagram").slice(0, 80),
    layout: LAYOUTS.has(layout) ? layout : "flowchart",
    nodes,
    edges,
  };
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { prompt } = await req.json();
    const userPrompt = String(prompt || "").trim();
    if (!userPrompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const apiKey =
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "AI API key not configured" },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(`
Create an editable whiteboard diagram from this request:
"${userPrompt}"

Return strict JSON only. Do not include markdown.
Shape:
{
  "title": "short diagram title",
  "layout": "flowchart" | "mindmap" | "system" | "journey" | "process",
  "nodes": [
    { "id": "stable-kebab-id", "label": "short label", "type": "rectangle" | "diamond" | "ellipse", "color": "#2563eb" }
  ],
  "edges": [
    { "from": "source-node-id", "to": "target-node-id", "label": "optional short label" }
  ]
}
Use 4 to 10 nodes. Use diamond nodes only for decisions. Keep labels concise.
`);

    const text = result.response.text();
    const diagram = normalizeDiagram(extractJson(text));
    return NextResponse.json({ diagram });
  } catch (error) {
    console.error("AI Diagram error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate diagram" },
      { status: 500 }
    );
  }
}
