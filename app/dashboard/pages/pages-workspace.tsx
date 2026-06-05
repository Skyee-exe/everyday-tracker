"use client";

import React, { useMemo, useState, useTransition } from "react";
import {
  Archive,
  ArrowLeft,
  BookOpen,
  Check,
  ChevronRight,
  Copy,
  Download,
  FileText,
  Folder,
  Grid2X2,
  Heart,
  Inbox,
  List,
  MoreHorizontal,
  MoveRight,
  Palette,
  Plus,
  Search,
  Share2,
  Sparkles,
  Star,
  Trash2,
  Users,
  X,
} from "lucide-react";
import type { SpacePage } from "@/db/schema";
import {
  createPage,
  createSpace,
  deletePage,
  deleteSpace,
  duplicatePage,
  duplicateSpace,
  getPagesForSpace,
  getSpaces,
  updatePage,
  updateSpace,
  type PageTemplate,
  type SpaceWithStats,
} from "./actions";
import PageEditor from "@/components/pages/page-editor";
import { convertTiptapToMarkdown } from "@/lib/markdown-export";

type SpaceFilter = "all" | "favorites" | "recent" | "archived";
type SpaceSort = "updated" | "name" | "pages" | "favorites";
type ViewMode = "grid" | "list";

const SPACE_COLORS = ["#2563eb", "#0891b2", "#16a34a", "#d97706", "#dc2626", "#7c3aed"];
const PAGE_TEMPLATES: PageTemplate[] = [
  "Blank Page",
  "Project Plan",
  "Meeting Notes",
  "PRD",
  "Research Notes",
  "Task Plan",
];

function formatTime(value: Date | string | null) {
  if (!value) return "Never opened";
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function matchesSpace(space: SpaceWithStats, pages: SpacePage[], query: string) {
  if (!query.trim()) return true;
  const q = query.toLowerCase();
  return (
    space.name.toLowerCase().includes(q) ||
    (space.description ?? "").toLowerCase().includes(q) ||
    pages.some((page) => page.title.toLowerCase().includes(q))
  );
}

function initialSpaceForm(space?: SpaceWithStats | null) {
  return {
    name: space?.name ?? "",
    description: space?.description ?? "",
    color: space?.color ?? SPACE_COLORS[0],
  };
}

function initialPageForm(page?: SpacePage | null, spaceId?: number | null) {
  return {
    title: page?.title ?? "",
    type: (page?.type as PageTemplate | undefined) ?? "Blank Page",
    summary: page?.summary ?? "",
    spaceId: page?.spaceId ?? spaceId ?? 0,
  };
}

export default function PagesWorkspace({
  initialSpaces,
}: {
  initialSpaces: SpaceWithStats[];
}) {
  const [spaces, setSpaces] = useState(initialSpaces);
  const [pagesBySpace, setPagesBySpace] = useState<Record<number, SpacePage[]>>({});
  const [selectedSpaceId, setSelectedSpaceId] = useState<number | null>(null);
  const [editingSpaceId, setEditingSpaceId] = useState<number | null>(null);
  const [selectedPageId, setSelectedPageId] = useState<number | null>(null);
  const [openedPageId, setOpenedPageId] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };
  const [spaceQuery, setSpaceQuery] = useState("");
  const [pageQuery, setPageQuery] = useState("");
  const [spaceFilter, setSpaceFilter] = useState<SpaceFilter>("all");
  const [spaceSort, setSpaceSort] = useState<SpaceSort>("updated");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [spacePanel, setSpacePanel] = useState<"new" | "edit" | null>(null);
  const [pagePanel, setPagePanel] = useState<"new" | "edit" | null>(null);
  const [spaceForm, setSpaceForm] = useState(initialSpaceForm());
  const [pageForm, setPageForm] = useState(initialPageForm());
  const [isPending, startTransition] = useTransition();

  const selectedSpace = spaces.find((space) => space.id === selectedSpaceId) ?? null;
  const editingSpace = spaces.find((space) => space.id === editingSpaceId) ?? selectedSpace;
  const currentPages = selectedSpaceId ? pagesBySpace[selectedSpaceId] ?? [] : [];
  const selectedPage = currentPages.find((page) => page.id === selectedPageId) ?? null;
  const totalPages = spaces.reduce((sum, space) => sum + space.activePageCount, 0);

  const filteredSpaces = useMemo(() => {
    return spaces
      .filter((space) => {
        const knownPages = pagesBySpace[space.id] ?? [];
        if (!matchesSpace(space, knownPages, spaceQuery)) return false;
        if (spaceFilter === "favorites") return space.isFavorite && !space.isArchived;
        if (spaceFilter === "archived") return space.isArchived;
        if (spaceFilter === "recent") return !space.isArchived && Boolean(space.lastOpenedAt);
        return !space.isArchived;
      })
      .sort((a, b) => {
        if (spaceSort === "name") return a.name.localeCompare(b.name);
        if (spaceSort === "pages") return b.activePageCount - a.activePageCount;
        if (spaceSort === "favorites") return Number(b.isFavorite) - Number(a.isFavorite);
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
  }, [pagesBySpace, spaceFilter, spaceQuery, spaceSort, spaces]);

  const filteredPages = useMemo(() => {
    const q = pageQuery.toLowerCase();
    return currentPages.filter((page) => {
      if (!q) return !page.isArchived;
      return (
        !page.isArchived &&
        (page.title.toLowerCase().includes(q) ||
          page.type.toLowerCase().includes(q) ||
          (page.summary ?? "").toLowerCase().includes(q))
      );
    });
  }, [currentPages, pageQuery]);

  const refreshSpaces = () => {
    startTransition(async () => {
      const fresh = await getSpaces();
      setSpaces(fresh);
    });
  };

  const refreshPages = (spaceId: number) => {
    startTransition(async () => {
      const fresh = await getPagesForSpace(spaceId);
      setPagesBySpace((prev) => ({ ...prev, [spaceId]: fresh }));
      setSelectedPageId((current) =>
        current && fresh.some((page) => page.id === current) ? current : fresh[0]?.id ?? null
      );
    });
  };

  const openSpace = (space: SpaceWithStats) => {
    setSelectedSpaceId(space.id);
    setSelectedPageId(null);
    setPageQuery("");
    refreshPages(space.id);
    refreshSpaces();
  };

  const closeSpace = () => {
    setSelectedSpaceId(null);
    setSelectedPageId(null);
    setOpenedPageId(null);
    setPageQuery("");
  };

  const submitSpace = () => {
    if (!spaceForm.name.trim()) return;
    startTransition(async () => {
      if (spacePanel === "edit" && editingSpace) {
        await updateSpace(editingSpace.id, spaceForm);
      } else {
        const space = await createSpace(spaceForm);
        setSelectedSpaceId(space.id);
      }
      setSpacePanel(null);
      setEditingSpaceId(null);
      setSpaceForm(initialSpaceForm());
      const fresh = await getSpaces();
      setSpaces(fresh);
    });
  };

  const submitPage = () => {
    if (!pageForm.title.trim() || !pageForm.spaceId) return;
    startTransition(async () => {
      if (pagePanel === "edit" && selectedPage) {
        const previousSpaceId = selectedPage.spaceId;
        const updated = await updatePage(selectedPage.id, pageForm);
        refreshPages(updated.spaceId);
        if (previousSpaceId !== updated.spaceId) {
          refreshPages(previousSpaceId);
          setSelectedSpaceId(updated.spaceId);
        }
      } else {
        const page = await createPage(pageForm);
        setSelectedPageId(page.id);
        refreshPages(page.spaceId);
      }
      setPagePanel(null);
      setPageForm(initialPageForm(null, selectedSpaceId));
      refreshSpaces();
    });
  };

  const archiveSelectedSpace = (space: SpaceWithStats) => {
    startTransition(async () => {
      await updateSpace(space.id, { isArchived: true });
      if (selectedSpaceId === space.id) closeSpace();
      refreshSpaces();
    });
  };

  const removeSelectedSpace = (space: SpaceWithStats) => {
    startTransition(async () => {
      await deleteSpace(space.id);
      if (selectedSpaceId === space.id) closeSpace();
      refreshSpaces();
    });
  };

  const archivePage = (page: SpacePage) => {
    startTransition(async () => {
      await updatePage(page.id, { isArchived: true });
      refreshPages(page.spaceId);
      refreshSpaces();
    });
  };

  const removePage = (page: SpacePage) => {
    startTransition(async () => {
      await deletePage(page.id);
      refreshPages(page.spaceId);
      refreshSpaces();
    });
  };

  const handleShare = (page: SpacePage) => {
    const shareUrl = `${window.location.origin}/dashboard/pages`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      showNotification("Workspace link copied to clipboard!");
    }).catch((err) => {
      console.error(err);
      showNotification("Failed to copy link");
    });
  };

  const handleExport = (page: SpacePage) => {
    try {
      const markdownContent = page.content
        ? convertTiptapToMarkdown(page.content)
        : page.summary || "";
      const blob = new Blob([markdownContent], { type: "text/markdown;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${page.title.toLowerCase().replace(/\s+/g, "-") || "untitled"}.md`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showNotification("Page exported and downloaded successfully!");
    } catch (e) {
      console.error(e);
      showNotification("Failed to export page");
    }
  };

  return (
    <div className="ps-workspace">
      <style>{`
        /* Custom CSS extensions for reactive & immersive Pages Workspace */
        .ps-space-card {
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
          cursor: pointer;
        }
        .ps-space-card:hover {
          transform: translateY(-4px) scale(1.01);
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.08);
          border-color: var(--space-color, #2563eb) !important;
        }
        .ps-space-card:active {
          transform: translateY(-1px) scale(0.995);
        }
        .ps-space-card .ps-folder {
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
        }
        .ps-space-card:hover .ps-folder {
          transform: scale(1.1) rotate(-3deg);
          color: var(--space-color, #2563eb) !important;
        }
        
        .ps-card-open {
          width: 100%;
          text-align: left;
          background: transparent;
          border: none;
          padding: 0;
          cursor: pointer;
        }

        .ps-page-row {
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1) !important;
          border-left: 3px solid transparent !important;
          position: relative;
          cursor: pointer;
        }
        .ps-page-row:hover {
          background-color: var(--sb-hover-bg) !important;
          padding-left: 18px !important;
        }
        .ps-page-row--active {
          border-left-color: var(--space-color, #2563eb) !important;
          background-color: color-mix(in srgb, var(--space-color, #2563eb) 6%, transparent) !important;
          font-weight: 600 !important;
        }
        .ps-page-row--active .ps-page-name {
          color: var(--space-color, #2563eb) !important;
        }
        .ps-page-row .ps-page-name svg {
          transition: all 0.2s ease;
        }
        .ps-page-row:hover .ps-page-name svg {
          color: var(--space-color, #2563eb) !important;
          transform: scale(1.15);
        }

        .ps-breadcrumb button {
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .ps-breadcrumb button:hover {
          color: var(--foreground) !important;
          transform: translateX(-3px);
        }

        .ps-actions-row button {
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .ps-actions-row button:hover {
          transform: translateY(-1px);
        }
        .ps-actions-row button:active {
          transform: translateY(1px);
        }

        .ps-sheet {
          animation: slideInSheet 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          box-shadow: -10px 0 30px rgba(0, 0, 0, 0.05);
        }
        @keyframes slideInSheet {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        
        .ps-sheet-backdrop {
          animation: fadeInBackdrop 0.3s ease-out forwards;
          backdrop-filter: blur(5px) !important;
          background: rgba(0, 0, 0, 0.5) !important;
        }
        @keyframes fadeInBackdrop {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .animate-fade-in-up {
          animation: fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-slide-in-right {
          animation: slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .ps-preview-animate {
          animation: fadeInUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
      {!selectedSpace ? (
        <main className="ps-main animate-fade-in-up">
          <header className="ps-header">
            <div>
              <div className="ps-kicker">
                <BookOpen size={14} />
                Content Library
              </div>
              <h1>All Spaces</h1>
              <p>
                {spaces.filter((space) => !space.isArchived).length} spaces · {totalPages} pages
              </p>
            </div>
            <button
              className="ps-btn ps-btn--primary"
              onClick={() => {
                setSpaceForm(initialSpaceForm());
                setSpacePanel("new");
              }}
            >
              <Plus size={16} />
              New Space
            </button>
          </header>

          <section className="ps-toolbar">
            <label className="ps-search">
              <Search size={15} />
              <input
                value={spaceQuery}
                onChange={(event) => setSpaceQuery(event.target.value)}
                placeholder="Search spaces or pages..."
              />
            </label>
            <div className="ps-segments" aria-label="Space filters">
              {[
                ["all", "All Spaces"],
                ["favorites", "Favorites"],
                ["recent", "Recently Opened"],
                ["archived", "Archived"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  className={spaceFilter === value ? "ps-segment ps-segment--active" : "ps-segment"}
                  onClick={() => setSpaceFilter(value as SpaceFilter)}
                >
                  {label}
                </button>
              ))}
            </div>
            <select
              className="ps-select"
              value={spaceSort}
              onChange={(event) => setSpaceSort(event.target.value as SpaceSort)}
              aria-label="Sort spaces"
            >
              <option value="updated">Recently Updated</option>
              <option value="name">Name</option>
              <option value="pages">Most Pages</option>
              <option value="favorites">Favorites</option>
            </select>
            <div className="ps-view-toggle" aria-label="View mode">
              <button
                className={viewMode === "grid" ? "ps-icon-btn ps-icon-btn--active" : "ps-icon-btn"}
                onClick={() => setViewMode("grid")}
                aria-label="Grid view"
              >
                <Grid2X2 size={15} />
              </button>
              <button
                className={viewMode === "list" ? "ps-icon-btn ps-icon-btn--active" : "ps-icon-btn"}
                onClick={() => setViewMode("list")}
                aria-label="List view"
              >
                <List size={15} />
              </button>
            </div>
          </section>

          {filteredSpaces.length ? (
            <section className={viewMode === "grid" ? "ps-space-grid" : "ps-space-list"}>
              {filteredSpaces.map((space) => (
                <article
                  key={space.id}
                  className={viewMode === "grid" ? "ps-space-card" : "ps-space-card ps-space-card--row"}
                  style={{ "--space-color": space.color } as React.CSSProperties}
                >
                  <button className="ps-card-open" onClick={() => openSpace(space)}>
                    <span className="ps-folder">
                      <Folder size={22} fill="currentColor" strokeWidth={1.6} />
                    </span>
                    <span className="ps-card-body">
                      <span className="ps-card-title">{space.name}</span>
                      <span className="ps-card-desc">
                        {space.description || "No description yet"}
                      </span>
                    </span>
                    <ChevronRight size={16} className="ps-card-chevron" />
                  </button>
                  <div className="ps-card-meta">
                    <span>{space.activePageCount} pages</span>
                    <span>Updated {formatTime(space.updatedAt)}</span>
                  </div>
                  <div className="ps-card-foot">
                    <div className="ps-avatars" aria-label="Members">
                      <span>S</span>
                    </div>
                    <div className="ps-card-actions">
                      <button
                        className="ps-icon-btn"
                        onClick={() =>
                          startTransition(async () => {
                            await updateSpace(space.id, { isFavorite: !space.isFavorite });
                            refreshSpaces();
                          })
                        }
                        aria-label={space.isFavorite ? "Remove favorite" : "Favorite space"}
                      >
                        <Star size={15} fill={space.isFavorite ? "currentColor" : "none"} />
                      </button>
                      <button
                        className="ps-icon-btn"
                        onClick={() => {
                          setEditingSpaceId(space.id);
                          setSpaceForm(initialSpaceForm(space));
                          setSpacePanel("edit");
                        }}
                        aria-label="Space actions"
                      >
                        <MoreHorizontal size={15} />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </section>
          ) : (
            <section className="ps-empty">
              <div className="ps-empty-icon">
                <Inbox size={32} />
              </div>
              <h2>{spaceFilter === "archived" ? "No archived spaces" : "Create your first space"}</h2>
              <p>
                Spaces collect related pages for projects, planning, research, and everyday work.
              </p>
              <button
                className="ps-btn ps-btn--primary"
                onClick={() => {
                  setSpaceForm(initialSpaceForm());
                  setSpacePanel("new");
                }}
              >
                <Plus size={16} />
                New Space
              </button>
            </section>
          )}
        </main>
      ) : (
        <main className="ps-main ps-main--detail animate-slide-in-right">
          {openedPageId && currentPages.some((p) => p.id === openedPageId) ? (
            <div className="flex-1 flex flex-col h-full overflow-hidden rounded-xl border border-border shadow-sm bg-card text-card-foreground animate-fade-in-up">
              {(() => {
                const page = currentPages.find((p) => p.id === openedPageId);
                if (!page) return null;
                return (
                  <PageEditor
                    page={page}
                    spaceName={selectedSpace.name}
                    onClose={() => setOpenedPageId(null)}
                    onSave={() => refreshPages(selectedSpace.id)}
                  />
                );
              })()}
            </div>
          ) : (
            <>
              <header className="ps-detail-header">
                <div>
                  <nav className="ps-breadcrumb">
                    <button onClick={closeSpace}>
                      <ArrowLeft size={14} />
                      All Spaces
                    </button>
                    <ChevronRight size={13} />
                    <span>{selectedSpace.name}</span>
                  </nav>
                  <div className="ps-detail-title">
                    <span
                      className="ps-folder ps-folder--large"
                      style={{ "--space-color": selectedSpace.color } as React.CSSProperties}
                    >
                      <Folder size={24} fill="currentColor" strokeWidth={1.6} />
                    </span>
                    <div>
                      <h1>{selectedSpace.name}</h1>
                      <p>{selectedSpace.description || "No description yet"} · {currentPages.length} pages</p>
                    </div>
                  </div>
                </div>
                <div className="ps-actions-row">
                  <button
                    className="ps-btn ps-btn--ghost"
                    onClick={() => {
                      setEditingSpaceId(selectedSpace.id);
                      setSpaceForm(initialSpaceForm(selectedSpace));
                      setSpacePanel("edit");
                    }}
                  >
                    <Palette size={15} />
                    Space
                  </button>
                  <button
                    className="ps-btn ps-btn--primary"
                    onClick={() => {
                      setPageForm(initialPageForm(null, selectedSpace.id));
                      setPagePanel("new");
                    }}
                  >
                    <Plus size={16} />
                    New Page
                  </button>
                </div>
              </header>

              <section className="ps-detail-layout">
                <div className="ps-pages-panel">
                  <label className="ps-search ps-search--compact">
                    <Search size={15} />
                    <input
                      value={pageQuery}
                      onChange={(event) => setPageQuery(event.target.value)}
                      placeholder="Search pages..."
                    />
                  </label>
                  {filteredPages.length ? (
                    <div className="ps-page-table">
                      <div className="ps-page-row ps-page-row--head">
                        <span>Page Name</span>
                        <span>Type</span>
                        <span>Last Updated</span>
                        <span>Updated By</span>
                        <span>Status</span>
                      </div>
                      {filteredPages.map((page) => (
                        <button
                          key={page.id}
                          className={
                            selectedPageId === page.id
                              ? "ps-page-row ps-page-row--active"
                              : "ps-page-row"
                          }
                          onClick={() => {
                            setSelectedPageId(page.id);
                            startTransition(async () => {
                              await updatePage(page.id, { lastOpenedAt: new Date() });
                              refreshPages(page.spaceId);
                            });
                          }}
                          onDoubleClick={() => {
                            setOpenedPageId(page.id);
                          }}
                        >
                          <span className="ps-page-name">
                            <FileText size={16} />
                            {page.title}
                          </span>
                          <span>{page.type}</span>
                          <span>{formatTime(page.updatedAt)}</span>
                          <span>You</span>
                          <span>{page.isFavorite ? "Favorite" : "Active"}</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="ps-empty ps-empty--inline">
                      <FileText size={28} />
                      <h2>No pages yet</h2>
                      <p>Create a page inside this space to start organizing details.</p>
                    </div>
                  )}
                </div>

                <aside className="ps-preview">
                  {selectedPage ? (
                    <div key={selectedPage.id} className="ps-preview-animate flex flex-col h-full justify-between">
                      <div className="ps-preview-head">
                        <span className="ps-preview-icon">
                          <FileText size={20} />
                        </span>
                        <div>
                          <h2>{selectedPage.title}</h2>
                          <p>{selectedPage.type}</p>
                        </div>
                      </div>
                      <p className="ps-preview-summary">
                        {selectedPage.summary || "No preview summary has been added yet."}
                      </p>
                      <dl className="ps-preview-list">
                        <div><dt>Space</dt><dd>{selectedSpace.name}</dd></div>
                        <div><dt>Comments</dt><dd>0</dd></div>
                        <div><dt>Linked tasks</dt><dd>{selectedPage.linkedTaskCount}</dd></div>
                        <div><dt>Last edited</dt><dd>{formatTime(selectedPage.updatedAt)}</dd></div>
                      </dl>
                      <div className="ps-preview-actions">
                        <button
                          className="ps-btn ps-btn--primary"
                          onClick={() => setOpenedPageId(selectedPage.id)}
                        >
                          <BookOpen size={14} />
                          Open Page
                        </button>
                        <button
                          className="ps-btn ps-btn--ghost"
                          onClick={() => {
                            setPageForm(initialPageForm(selectedPage, selectedSpace.id));
                            setPagePanel("edit");
                          }}
                        >
                          Rename
                        </button>
                        <button
                          className="ps-icon-btn"
                          onClick={() =>
                            startTransition(async () => {
                              await updatePage(selectedPage.id, {
                                isFavorite: !selectedPage.isFavorite,
                              });
                              refreshPages(selectedPage.spaceId);
                            })
                          }
                          aria-label="Favorite page"
                        >
                          <Heart size={15} fill={selectedPage.isFavorite ? "currentColor" : "none"} />
                        </button>
                        <button
                          className="ps-icon-btn"
                          onClick={() =>
                            startTransition(async () => {
                              await duplicatePage(selectedPage.id);
                              refreshPages(selectedPage.spaceId);
                              refreshSpaces();
                            })
                          }
                          aria-label="Duplicate page"
                        >
                          <Copy size={15} />
                        </button>
                        <button
                          className="ps-icon-btn"
                          aria-label="Share page"
                          onClick={() => handleShare(selectedPage)}
                        >
                          <Share2 size={15} />
                        </button>
                        <button
                          className="ps-icon-btn"
                          aria-label="Export page"
                          onClick={() => handleExport(selectedPage)}
                        >
                          <Download size={15} />
                        </button>
                        <button
                          className="ps-icon-btn"
                          onClick={() => archivePage(selectedPage)}
                          aria-label="Archive page"
                        >
                          <Archive size={15} />
                        </button>
                        <button
                          className="ps-icon-btn ps-icon-btn--danger"
                          onClick={() => removePage(selectedPage)}
                          aria-label="Delete page"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="ps-preview-empty">
                      <Sparkles size={24} />
                      <h2>Select a page</h2>
                      <p>Open a page from the list to see its quick preview and actions.</p>
                    </div>
                  )}
                </aside>
              </section>
            </>
          )}
        </main>
      )}

      {spacePanel && (
        <aside className="ps-sheet">
          <div className="ps-sheet-head">
            <h2>{spacePanel === "new" ? "Create New Space" : "Space Actions"}</h2>
            <button
              className="ps-icon-btn"
              onClick={() => {
                setSpacePanel(null);
                setEditingSpaceId(null);
              }}
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>
          <label className="ps-field">
            <span>Space name</span>
            <input
              value={spaceForm.name}
              onChange={(event) => setSpaceForm((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="Work Projects"
            />
          </label>
          <label className="ps-field">
            <span>Description</span>
            <textarea
              value={spaceForm.description}
              onChange={(event) =>
                setSpaceForm((prev) => ({ ...prev, description: event.target.value }))
              }
              placeholder="Plans, notes, and documentation for this area."
            />
          </label>
          <div className="ps-field">
            <span>Color selector</span>
            <div className="ps-swatches">
              {SPACE_COLORS.map((color) => (
                <button
                  key={color}
                  className={spaceForm.color === color ? "ps-swatch ps-swatch--active" : "ps-swatch"}
                  style={{ background: color }}
                  onClick={() => setSpaceForm((prev) => ({ ...prev, color }))}
                  aria-label={`Choose ${color}`}
                >
                  {spaceForm.color === color && <Check size={14} />}
                </button>
              ))}
            </div>
          </div>
          <button className="ps-btn ps-btn--primary ps-sheet-submit" onClick={submitSpace} disabled={isPending}>
            {spacePanel === "new" ? "Create Space" : "Save Space"}
          </button>
          {spacePanel === "edit" && editingSpace && (
            <div className="ps-sheet-actions">
              <button
                className="ps-btn ps-btn--ghost"
                onClick={() => {
                  setSelectedSpaceId(editingSpace.id);
                  setPageForm(initialPageForm(null, editingSpace.id));
                  setPagePanel("new");
                }}
              >
                <Plus size={15} />
                Add Page
              </button>
              <button className="ps-btn ps-btn--ghost">
                <Users size={15} />
                Invite
              </button>
              <button
                className="ps-btn ps-btn--ghost"
                onClick={() =>
                  startTransition(async () => {
                    await duplicateSpace(editingSpace.id);
                    setSpacePanel(null);
                    setEditingSpaceId(null);
                    refreshSpaces();
                  })
                }
              >
                <Copy size={15} />
                Duplicate
              </button>
              <button className="ps-btn ps-btn--ghost" onClick={() => archiveSelectedSpace(editingSpace)}>
                <Archive size={15} />
                Archive
              </button>
              <button className="ps-btn ps-btn--danger" onClick={() => removeSelectedSpace(editingSpace)}>
                <Trash2 size={15} />
                Delete
              </button>
            </div>
          )}
        </aside>
      )}

      {pagePanel && selectedSpace && (
        <aside className="ps-sheet">
          <div className="ps-sheet-head">
            <h2>{pagePanel === "new" ? "Create New Page" : "Page Actions"}</h2>
            <button className="ps-icon-btn" onClick={() => setPagePanel(null)} aria-label="Close">
              <X size={16} />
            </button>
          </div>
          <label className="ps-field">
            <span>Page name</span>
            <input
              value={pageForm.title}
              onChange={(event) => setPageForm((prev) => ({ ...prev, title: event.target.value }))}
              placeholder="Project roadmap"
            />
          </label>
          <label className="ps-field">
            <span>Add to space</span>
            <select
              value={pageForm.spaceId}
              onChange={(event) =>
                setPageForm((prev) => ({ ...prev, spaceId: Number(event.target.value) }))
              }
            >
              {spaces
                .filter((space) => !space.isArchived)
                .map((space) => (
                  <option key={space.id} value={space.id}>
                    {space.name}
                  </option>
                ))}
            </select>
          </label>
          <label className="ps-field">
            <span>Template</span>
            <select
              value={pageForm.type}
              onChange={(event) =>
                setPageForm((prev) => ({ ...prev, type: event.target.value as PageTemplate }))
              }
            >
              {PAGE_TEMPLATES.map((template) => (
                <option key={template}>{template}</option>
              ))}
            </select>
          </label>
          <label className="ps-field">
            <span>Preview summary</span>
            <textarea
              value={pageForm.summary}
              onChange={(event) => setPageForm((prev) => ({ ...prev, summary: event.target.value }))}
              placeholder="Short context for this page."
            />
          </label>
          <button className="ps-btn ps-btn--primary ps-sheet-submit" onClick={submitPage} disabled={isPending}>
            {pagePanel === "new" ? "Create Page" : "Save Page"}
          </button>
          {pagePanel === "edit" && selectedPage && (
            <div className="ps-sheet-actions">
              <button className="ps-btn ps-btn--ghost" onClick={() => submitPage()}>
                <MoveRight size={15} />
                Move
              </button>
              <button
                className="ps-btn ps-btn--ghost"
                onClick={() =>
                  startTransition(async () => {
                    await duplicatePage(selectedPage.id);
                    setPagePanel(null);
                    refreshPages(selectedPage.spaceId);
                    refreshSpaces();
                  })
                }
              >
                <Copy size={15} />
                Duplicate
              </button>
              <button
                className="ps-btn ps-btn--ghost"
                onClick={() => {
                  setPagePanel(null);
                  handleShare(selectedPage);
                }}
              >
                <Share2 size={15} />
                Share
              </button>
              <button
                className="ps-btn ps-btn--ghost"
                onClick={() => {
                  setPagePanel(null);
                  handleExport(selectedPage);
                }}
              >
                <Download size={15} />
                Export
              </button>
              <button className="ps-btn ps-btn--ghost" onClick={() => archivePage(selectedPage)}>
                <Archive size={15} />
                Archive
              </button>
              <button className="ps-btn ps-btn--danger" onClick={() => removePage(selectedPage)}>
                <Trash2 size={15} />
                Delete
              </button>
            </div>
          )}
        </aside>
      )}

      {(spacePanel || pagePanel) && (
        <button
          className="ps-sheet-backdrop"
          aria-label="Close panel"
          onClick={() => {
            setSpacePanel(null);
            setPagePanel(null);
            setEditingSpaceId(null);
          }}
        />
      )}

      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-250 bg-slate-900/90 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 border border-white/10 backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-300">
          <Sparkles size={14} className="text-blue-400 animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
