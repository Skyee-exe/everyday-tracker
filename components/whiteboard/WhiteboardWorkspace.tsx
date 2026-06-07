"use client";

import dynamic from "next/dynamic";
import React, { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  Bot,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Download,
  FilePenLine,
  Loader2,
  MoreHorizontal,
  Plus,
  Search,
  StickyNote,
  Trash2,
  X,
} from "lucide-react";
import {
  convertToExcalidrawElements,
  exportToBlob,
} from "@excalidraw/excalidraw";
import type {
  AppState,
  BinaryFiles,
  ExcalidrawImperativeAPI,
} from "@excalidraw/excalidraw/types";
import type { ExcalidrawElementSkeleton } from "@excalidraw/excalidraw/data/transform";
import type { OrderedExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import type { Whiteboard } from "@/db/schema";
import {
  createWhiteboard,
  deleteWhiteboard,
  renameWhiteboard,
  updateWhiteboardScene,
  type WhiteboardScene,
} from "@/app/dashboard/whiteboard/actions";
import { useTheme } from "@/components/landing/theme-context";

const Excalidraw = dynamic(
  async () => (await import("@excalidraw/excalidraw")).Excalidraw,
  {
    ssr: false,
    loading: () => (
      <div className="wb-canvas-loading">
        <Loader2 size={18} className="wb-spin" />
        <span>Loading canvas</span>
      </div>
    ),
  }
);

type SaveStatus = "idle" | "saving" | "saved" | "error";

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

type DiagramResponse = {
  title: string;
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  layout: "flowchart" | "mindmap" | "system" | "journey" | "process";
};

const BOARD_COLORS = ["#2563eb", "#0891b2", "#16a34a", "#d97706", "#dc2626", "#7c3aed"];

function getScene(board: Whiteboard | null): WhiteboardScene {
  if (!board?.scene || typeof board.scene !== "object") {
    return { elements: [], appState: { viewBackgroundColor: "#ffffff", gridModeEnabled: true }, files: {} };
  }
  const scene = board.scene as WhiteboardScene;
  return {
    elements: Array.isArray(scene.elements) ? scene.elements : [],
    appState: scene.appState && typeof scene.appState === "object" ? scene.appState : {},
    files: scene.files && typeof scene.files === "object" ? scene.files : {},
  };
}

function formatUpdatedAt(value: Date | string) {
  const date = new Date(value);
  const diff = Date.now() - date.getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) return "Just now";
  if (diff < hour) return `${Math.floor(diff / minute)}m ago`;
  if (diff < day) return `${Math.floor(diff / hour)}h ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "whiteboard";
}

function getViewportCenter(api: ExcalidrawImperativeAPI) {
  const appState = api.getAppState();
  const width = appState.width || 1200;
  const height = appState.height || 800;
  const zoom = appState.zoom?.value || 1;

  return {
    x: -appState.scrollX + width / 2 / zoom,
    y: -appState.scrollY + height / 2 / zoom,
    width,
    height,
    zoom,
  };
}

function serializableAppState(appState: AppState) {
  return {
    viewBackgroundColor: appState.viewBackgroundColor,
    gridModeEnabled: appState.gridModeEnabled,
    currentItemStrokeColor: appState.currentItemStrokeColor,
    currentItemBackgroundColor: appState.currentItemBackgroundColor,
    currentItemFillStyle: appState.currentItemFillStyle,
    currentItemStrokeWidth: appState.currentItemStrokeWidth,
    currentItemStrokeStyle: appState.currentItemStrokeStyle,
    currentItemRoughness: appState.currentItemRoughness,
    currentItemOpacity: appState.currentItemOpacity,
    theme: appState.theme,
    exportBackground: appState.exportBackground,
  };
}

function makeStickyNote(api: ExcalidrawImperativeAPI): OrderedExcalidrawElement[] {
  const center = getViewportCenter(api);
  const zoom = center.zoom || 1;
  const viewportWidth = center.width / zoom;
  const isMobile = viewportWidth < 600;

  // Constrain sticky note size for narrow viewports
  const defaultWidth = isMobile ? 160 : 240;
  const defaultHeight = isMobile ? 110 : 160;
  const noteWidth = Math.min(defaultWidth, viewportWidth - 40);
  const noteHeight = Math.min(defaultHeight, noteWidth * 0.69);
  const fontSize = Math.max(isMobile ? 11 : 14, Math.floor(noteWidth / 11)); // Responsive font sizing
  
  const groupId = `sticky-${Date.now()}`;
  const skeleton: ExcalidrawElementSkeleton[] = [
    {
      type: "rectangle",
      x: center.x - noteWidth / 2,
      y: center.y - noteHeight / 2,
      width: noteWidth,
      height: noteHeight,
      strokeColor: "#f59e0b",
      backgroundColor: "#fef3c7",
      fillStyle: "solid",
      strokeWidth: 1,
      roughness: 1,
      roundness: { type: 3 },
      groupIds: [groupId],
    },
    {
      type: "text",
      x: center.x - (noteWidth - 26) / 2,
      y: center.y - (noteHeight - 32) / 2,
      width: noteWidth - 26,
      height: noteHeight - 32,
      text: "Sticky note",
      fontSize: fontSize,
      strokeColor: "#78350f",
      backgroundColor: "transparent",
      textAlign: "center",
      groupIds: [groupId],
    },
  ];

  return convertToExcalidrawElements(skeleton, { regenerateIds: true });
}

function makeDiagramElements(api: ExcalidrawImperativeAPI, diagram: DiagramResponse): OrderedExcalidrawElement[] {
  const center = getViewportCenter(api);
  const zoom = center.zoom || 1;
  const viewportWidth = center.width / zoom;
  const isMobile = viewportWidth < 600;

  const spacingX = isMobile ? Math.min(130, viewportWidth - 20) : (diagram.layout === "mindmap" ? 280 : 240);
  const spacingY = isMobile ? 85 : 150;
  const startX = center.x - Math.min(diagram.nodes.length, isMobile ? 2 : 4) * spacingX * 0.5;
  const startY = center.y - 120;

  const nodePositions = new Map<string, { x: number; y: number; width: number; height: number }>();
  const nodeSkeleton: ExcalidrawElementSkeleton[] = diagram.nodes.map((node, index) => {
    const col = isMobile ? index % 2 : (diagram.layout === "mindmap" ? index % 3 : index % 4);
    const row = isMobile ? Math.floor(index / 2) : (diagram.layout === "mindmap" ? Math.floor(index / 3) : Math.floor(index / 4));
    const x = startX + col * spacingX;
    const y = startY + row * spacingY;
    const width = isMobile ? Math.min(105, viewportWidth - 30) : 190;
    const height = isMobile ? 52 : (node.type === "diamond" ? 100 : 92);
    nodePositions.set(node.id, { x, y, width, height });

    const fontSize = isMobile ? 11 : 18;

    return {
      type: node.type,
      x,
      y,
      width,
      height,
      strokeColor: node.color || "#2563eb",
      backgroundColor: "#eff6ff",
      fillStyle: "solid",
      strokeWidth: 2,
      roughness: 1,
      roundness: node.type === "rectangle" ? { type: 3 } : null,
      label: {
        text: node.label,
        fontSize: fontSize,
        strokeColor: "#172033",
        textAlign: "center",
        verticalAlign: "middle",
      },
    };
  });

  const edgeSkeleton: ExcalidrawElementSkeleton[] = diagram.edges
    .map((edge) => {
      const from = nodePositions.get(edge.from);
      const to = nodePositions.get(edge.to);
      if (!from || !to) return null;

      return {
        type: "arrow",
        x: from.x + from.width,
        y: from.y + from.height / 2,
        width: to.x - (from.x + from.width),
        height: to.y + to.height / 2 - (from.y + from.height / 2),
        strokeColor: "#475569",
        strokeWidth: 2,
        roughness: 1,
        endArrowhead: "arrow",
        label: edge.label
          ? {
              text: edge.label,
              fontSize: isMobile ? 9 : 14,
              strokeColor: "#475569",
            }
          : undefined,
      } satisfies ExcalidrawElementSkeleton;
    })
    .filter(Boolean) as ExcalidrawElementSkeleton[];

  const titleSkeleton: ExcalidrawElementSkeleton[] = [
    {
      type: "text",
      text: diagram.title,
      x: startX,
      y: startY - (isMobile ? 36 : 72),
      width: isMobile ? Math.min(240, viewportWidth - 40) : 520,
      height: isMobile ? 24 : 42,
      fontSize: isMobile ? 14 : 28,
      strokeColor: "#0f172a",
      backgroundColor: "transparent",
    },
  ];

  return convertToExcalidrawElements([...titleSkeleton, ...nodeSkeleton, ...edgeSkeleton], {
    regenerateIds: true,
  });
}

export default function WhiteboardWorkspace({ initialBoards }: { initialBoards: Whiteboard[] }) {
  const { theme } = useTheme();
  const [boards, setBoards] = useState<Whiteboard[]>(initialBoards);
  const [activeBoardId, setActiveBoardId] = useState<number | null>(initialBoards[0]?.id ?? null);
  const [search, setSearch] = useState("");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [renamingId, setRenamingId] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [isPending, startTransition] = useTransition();
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setMoreMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const apiRef = useRef<ExcalidrawImperativeAPI | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeBoard = boards.find((board) => board.id === activeBoardId) ?? null;
  const scene = useMemo(() => getScene(activeBoard), [activeBoard]);

  const filteredBoards = boards.filter((board) =>
    board.name.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    setSaveStatus(activeBoard ? "saved" : "idle");
    setError(null);
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
  }, [activeBoardId, activeBoard]);

  const handleCreate = () => {
    startTransition(async () => {
      try {
        const board = await createWhiteboard({
          name: `Whiteboard ${boards.length + 1}`,
          color: BOARD_COLORS[boards.length % BOARD_COLORS.length],
        });
        setBoards((prev) => [board, ...prev]);
        setActiveBoardId(board.id);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create whiteboard");
      }
    });
  };

  const handleDelete = (board: Whiteboard) => {
    if (!confirm(`Delete "${board.name}"?`)) return;

    startTransition(async () => {
      try {
        await deleteWhiteboard(board.id);
        setBoards((prev) => {
          const remaining = prev.filter((item) => item.id !== board.id);
          if (activeBoardId === board.id) setActiveBoardId(remaining[0]?.id ?? null);
          return remaining;
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete whiteboard");
      }
    });
  };

  const handleDuplicate = (board: Whiteboard) => {
    startTransition(async () => {
      try {
        const duplicated = await createWhiteboard({
          name: `${board.name} (Copy)`,
          color: board.color,
        });
        const boardScene = getScene(board);
        const updated = await updateWhiteboardScene(duplicated.id, boardScene);
        setBoards((prev) => [updated, ...prev]);
        setActiveBoardId(duplicated.id);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to duplicate whiteboard");
      }
    });
  };

  const submitRename = async () => {
    if (!renamingId) return;
    try {
      const updated = await renameWhiteboard(renamingId, renameValue);
      setBoards((prev) => prev.map((board) => (board.id === updated.id ? updated : board)));
      setRenamingId(null);
      setRenameValue("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to rename whiteboard");
    }
  };

  const handleSceneChange = useCallback(
    (elements: readonly OrderedExcalidrawElement[], appState: AppState, files: BinaryFiles) => {
      if (!activeBoardId) return;
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      setSaveStatus("saving");

      const scenePayload: WhiteboardScene = {
        elements: [...elements],
        appState: serializableAppState(appState),
        files,
      };

      saveTimerRef.current = setTimeout(async () => {
        try {
          const updated = await updateWhiteboardScene(activeBoardId, scenePayload);
          setBoards((prev) => prev.map((board) => (board.id === updated.id ? updated : board)));
          setSaveStatus("saved");
          setError(null);
        } catch (err) {
          setSaveStatus("error");
          setError(err instanceof Error ? err.message : "Failed to save whiteboard");
        }
      }, 900);
    },
    [activeBoardId]
  );

  const insertElements = (elements: OrderedExcalidrawElement[]) => {
    const api = apiRef.current;
    if (!api) return;
    const existing = api.getSceneElements();
    const selectedElementIds = Object.fromEntries(
      elements.map((element) => [element.id, true as const])
    );
    api.updateScene({
      elements: [...existing, ...elements],
      appState: { selectedElementIds },
    });
    api.scrollToContent(elements);
  };

  const handleStickyNote = () => {
    const api = apiRef.current;
    if (!api) return;
    insertElements(makeStickyNote(api));
  };

  const handleExport = async () => {
    const api = apiRef.current;
    if (!api || !activeBoard) return;

    try {
      const blob = await exportToBlob({
        elements: api.getSceneElements(),
        appState: {
          ...api.getAppState(),
          exportBackground: true,
          exportScale: 2,
        },
        files: api.getFiles(),
        exportPadding: 24,
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${slugify(activeBoard.name)}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to export PNG");
    }
  };

  const handleGenerateDiagram = async () => {
    const prompt = aiPrompt.trim();
    if (!prompt) return;
    setAiLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/diagram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to generate diagram");
      const api = apiRef.current;
      if (!api) throw new Error("Canvas is still loading");
      insertElements(makeDiagramElements(api, data.diagram));
      setAiOpen(false);
      setAiPrompt("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate diagram");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="wb-workspace">
      <aside className={`wb-sidebar ${sidebarExpanded ? "wb-sidebar--expanded" : "wb-sidebar--collapsed"}`}>
        <div className="wb-sidebar-header">
          <div className="wb-sidebar-title-row" onClick={() => setSidebarExpanded(!sidebarExpanded)} style={{ cursor: "pointer" }}>
            <FilePenLine size={18} strokeWidth={1.8} />
            <span className="wb-sidebar-title">Whiteboards</span>
          </div>
          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
            <button
              className="wb-icon-btn wb-mobile-only"
              onClick={(e) => {
                e.stopPropagation();
                setSidebarExpanded(!sidebarExpanded);
              }}
              title={sidebarExpanded ? "Collapse list" : "Expand list"}
            >
              {sidebarExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            <button className="wb-icon-btn wb-icon-btn--primary" onClick={handleCreate} title="New whiteboard" disabled={isPending}>
              {isPending ? <Loader2 size={15} className="wb-spin" /> : <Plus size={16} />}
            </button>
          </div>
        </div>

        <div className="wb-sidebar-search">
          <Search size={14} className="wb-sidebar-search-icon" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search whiteboards..."
            className="wb-sidebar-search-input"
          />
        </div>

        <div className="wb-sidebar-list">
          {filteredBoards.length === 0 && (
            <div className="wb-sidebar-empty">{search ? "No whiteboards found" : "No whiteboards yet"}</div>
          )}
          {filteredBoards.map((board) => {
            const active = board.id === activeBoardId;
            const renaming = renamingId === board.id;

            return (
              <div
                key={board.id}
                className={`wb-board-row${active ? " wb-board-row--active" : ""}`}
                role="button"
                tabIndex={0}
                onClick={() => !renaming && setActiveBoardId(board.id)}
                onKeyDown={(event) => {
                  if (!renaming && (event.key === "Enter" || event.key === " ")) {
                    event.preventDefault();
                    setActiveBoardId(board.id);
                  }
                }}
              >
                <span className="wb-board-color" style={{ background: board.color }} />
                <div className="wb-board-meta">
                  {renaming ? (
                    <input
                      className="wb-rename-input"
                      value={renameValue}
                      autoFocus
                      onChange={(event) => setRenameValue(event.target.value)}
                      onClick={(event) => event.stopPropagation()}
                      onBlur={submitRename}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") void submitRename();
                        if (event.key === "Escape") setRenamingId(null);
                      }}
                    />
                  ) : (
                    <span className="wb-board-name">{board.name}</span>
                  )}
                  <span className="wb-board-time">{formatUpdatedAt(board.updatedAt)}</span>
                </div>
                <div className="wb-board-actions">
                  <button
                    className="wb-board-action"
                    title="Rename whiteboard"
                    onClick={(event) => {
                      event.stopPropagation();
                      setRenamingId(board.id);
                      setRenameValue(board.name);
                    }}
                  >
                    <FilePenLine size={13} />
                  </button>
                  <button
                    className="wb-board-action wb-board-action--danger"
                    title="Delete whiteboard"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleDelete(board);
                    }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </aside>

      <main className="wb-main">
        {activeBoard ? (
          <>
            <div className="wb-topbar">
              <div className="wb-title-wrap">
                <span className="wb-active-dot" style={{ background: activeBoard.color }} />
                <div>
                  <h1 className="wb-title">{activeBoard.name}</h1>
                  <p className="wb-subtitle">Updated {formatUpdatedAt(activeBoard.updatedAt)}</p>
                </div>
              </div>

              <div className="wb-actions" ref={moreMenuRef}>
                <span className={`wb-save-state wb-save-state--${saveStatus} wb-desktop-only`}>
                  {saveStatus === "saving" && <Loader2 size={13} className="wb-spin" />}
                  {saveStatus === "saved" && <CheckCircle2 size={13} />}
                  {saveStatus === "error" && <X size={13} />}
                  {saveStatus === "saving" ? "Saving" : saveStatus === "error" ? "Save issue" : "Saved"}
                </span>
                <button className="wb-btn wb-btn--ghost wb-desktop-only" onClick={handleStickyNote}>
                  <StickyNote size={15} />
                  <span className="wb-btn-text">Sticky</span>
                </button>
                <button className="wb-btn wb-btn--ai" onClick={() => setAiOpen(true)}>
                  <Bot size={15} />
                  <span className="wb-btn-text">AI Diagram</span>
                </button>
                <button className="wb-btn wb-btn--ghost wb-desktop-only" onClick={handleExport}>
                  <Download size={15} />
                  <span className="wb-btn-text">PNG</span>
                </button>
                <div style={{ position: "relative", display: "inline-flex" }}>
                  <button
                    className="wb-icon-btn"
                    title="More options"
                    onClick={() => setMoreMenuOpen(!moreMenuOpen)}
                  >
                    <MoreHorizontal size={16} />
                  </button>
                  {moreMenuOpen && (
                    <div className="wb-more-dropdown">
                      {/* Save Status - Mobile Only */}
                      <div className="wb-dropdown-item wb-mobile-only" style={{ cursor: "default", pointerEvents: "none" }}>
                        {saveStatus === "saving" && <Loader2 size={13} className="wb-spin" />}
                        {saveStatus === "saved" && <CheckCircle2 size={13} />}
                        {saveStatus === "error" && <X size={13} />}
                        <span>Status: {saveStatus === "saving" ? "Saving..." : saveStatus === "error" ? "Save error" : "Saved"}</span>
                      </div>
                      
                      {/* Add Sticky Note - Mobile Only */}
                      <button
                        className="wb-dropdown-item wb-mobile-only"
                        onClick={() => {
                          setMoreMenuOpen(false);
                          handleStickyNote();
                        }}
                      >
                        <StickyNote size={13} />
                        <span>Add Sticky Note</span>
                      </button>
                      
                      {/* Export PNG - Mobile Only */}
                      <button
                        className="wb-dropdown-item wb-mobile-only"
                        onClick={() => {
                          setMoreMenuOpen(false);
                          void handleExport();
                        }}
                      >
                        <Download size={13} />
                        <span>Export PNG</span>
                      </button>
                      
                      {/* Rename Board */}
                      <button
                        className="wb-dropdown-item"
                        onClick={() => {
                          setMoreMenuOpen(false);
                          setSidebarExpanded(true);
                          setRenamingId(activeBoard.id);
                          setRenameValue(activeBoard.name);
                        }}
                      >
                        <FilePenLine size={13} />
                        <span>Rename Board</span>
                      </button>
                      
                      {/* Duplicate Board */}
                      <button
                        className="wb-dropdown-item"
                        onClick={() => {
                          setMoreMenuOpen(false);
                          void handleDuplicate(activeBoard);
                        }}
                      >
                        <Plus size={13} />
                        <span>Duplicate Board</span>
                      </button>
                      
                      {/* Delete Board */}
                      <button
                        className="wb-dropdown-item"
                        onClick={() => {
                          setMoreMenuOpen(false);
                          handleDelete(activeBoard);
                        }}
                        style={{ color: "#dc2626" }}
                      >
                        <Trash2 size={13} />
                        <span>Delete Board</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {error && <div className="wb-error">{error}</div>}

            <div className="wb-canvas">
              <Excalidraw
                key={`${activeBoard.id}_${theme}`}
                excalidrawAPI={(api) => {
                  apiRef.current = api;
                }}
                initialData={{
                  elements: scene.elements as OrderedExcalidrawElement[],
                  appState: {
                    viewBackgroundColor: theme === "dark" ? "#121212" : "#ffffff",
                    gridModeEnabled: true,
                    ...scene.appState,
                  },
                  files: scene.files as BinaryFiles,
                  scrollToContent: true,
                }}
                name={activeBoard.name}
                theme={theme === "dark" ? "dark" : "light"}
                onChange={handleSceneChange}
                UIOptions={{
                  canvasActions: {
                    changeViewBackgroundColor: true,
                    clearCanvas: true,
                    export: { saveFileToDisk: true },
                    loadScene: true,
                    saveToActiveFile: false,
                    toggleTheme: false,
                  },
                }}
              />
            </div>
          </>
        ) : (
          <div className="wb-empty-state">
            <div className="wb-empty-icon">
              <FilePenLine size={34} />
            </div>
            <h2>No whiteboards yet</h2>
            <p>Create a board to sketch ideas, map flows, or generate editable diagrams.</p>
            <button className="wb-btn wb-btn--ai" onClick={handleCreate}>
              <Plus size={15} />
              New Whiteboard
            </button>
          </div>
        )}
      </main>

      {aiOpen && (
        <div className="wb-modal-backdrop" onMouseDown={() => setAiOpen(false)}>
          <div className="wb-ai-modal" onMouseDown={(event) => event.stopPropagation()}>
            <div className="wb-ai-head">
              <div>
                <h2>Generate Diagram</h2>
                <p>Describe a flowchart, mind map, system architecture, journey, or process.</p>
              </div>
              <button className="wb-icon-btn" onClick={() => setAiOpen(false)}>
                <X size={16} />
              </button>
            </div>
            <textarea
              className="wb-ai-input"
              value={aiPrompt}
              onChange={(event) => setAiPrompt(event.target.value)}
              placeholder="Example: Create a user onboarding flow from sign up to activation with decision points."
            />
            <div className="wb-ai-footer">
              <button className="wb-btn wb-btn--ghost" onClick={() => setAiOpen(false)}>Cancel</button>
              <button className="wb-btn wb-btn--ai" onClick={handleGenerateDiagram} disabled={aiLoading || !aiPrompt.trim()}>
                {aiLoading ? <Loader2 size={15} className="wb-spin" /> : <Bot size={15} />}
                Generate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
