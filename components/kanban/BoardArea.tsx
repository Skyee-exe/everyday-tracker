"use client";

import React, { useState, useMemo } from "react";
import { useUser } from "@clerk/nextjs";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import Column from "./Column";
import TaskCard from "./TaskCard";
import {
  Plus,
  Search,
  SlidersHorizontal,
  X,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  CalendarClock,
  BarChart3,
  Menu,
} from "lucide-react";
import type { KanbanBoard, KanbanColumn, KanbanTask } from "@/db/schema";
import {
  CollabRoom,
  CollaborationButton,
  CollaborationPanel,
  PresenceAvatars,
  PresenceBanner,
  usePresenceUsers,
  getInitials,
} from "@/lib/collab";
import { buildRoomId } from "@/lib/collab/types";
import type { CollabRole } from "@/lib/collab/permissions";

const PRIORITIES = ["low", "medium", "high", "critical"];
const SPECIALS = [
  { value: "due-today", label: "Due Today" },
  { value: "overdue", label: "Overdue" },
  { value: "completed", label: "Completed" },
  { value: "calendar-linked", label: "Calendar Linked" },
  { value: "note-linked", label: "Note Linked" },
];

interface Insights {
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  dueTodayTasks: number;
  completionRate: number;
}

interface Props {
  board: KanbanBoard;
  columns: KanbanColumn[];
  tasks: KanbanTask[];
  allTasks: KanbanTask[];
  loading: boolean;
  insights: Insights;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  filterPriority: string | null;
  onFilterPriorityChange: (p: string | null) => void;
  filterCategory: string | null;
  onFilterCategoryChange: (c: string | null) => void;
  filterSpecial: string | null;
  onFilterSpecialChange: (s: string | null) => void;
  onAddColumn: (name: string) => void;
  onRenameColumn: (id: number, name: string) => void;
  onDeleteColumn: (id: number) => void;
  onReorderColumns: (cols: KanbanColumn[]) => void;
  onOpenDrawer: (columnId?: number, task?: KanbanTask) => void;
  onMoveTask: (updates: { id: number; columnId: number; position: number }[]) => void;
  onToggleComplete: (id: number, completed: boolean) => void;
  onDeleteTask: (id: number) => void;
  myRole: CollabRole | null;
  totalCollaborators?: number;
  canEdit?: boolean;
  categories: Array<{ value: string; label: string; color: string }>;
  onToggleSidebar?: () => void;
}

function MobileCollaborators({
  totalCollaborators,
  onClick,
}: {
  totalCollaborators?: number;
  onClick: () => void;
}) {
  const { others } = usePresenceUsers();
  const online = others || [];
  if (online.length === 0) return null;
  const visible = online.slice(0, 2);
  const overflow = (totalCollaborators ?? (online.length + 1)) - visible.length;
  const text = visible.map(u => getInitials(u.name)).join(" ") + (overflow > 0 ? ` +${overflow}` : "");
  return (
    <div className="kb-collab-text" onClick={onClick}>
      {text}
    </div>
  );
}

export default function BoardArea({
  board,
  columns,
  tasks,
  loading,
  insights,
  searchQuery,
  onSearchChange,
  filterPriority,
  onFilterPriorityChange,
  filterCategory,
  onFilterCategoryChange,
  filterSpecial,
  onFilterSpecialChange,
  onAddColumn,
  onRenameColumn,
  onDeleteColumn,
  onReorderColumns,
  onOpenDrawer,
  onMoveTask,
  onToggleComplete,
  onDeleteTask,
  myRole,
  totalCollaborators,
  canEdit = true,
  categories,
  onToggleSidebar,
}: Props) {
  const [activeTask, setActiveTask] = useState<KanbanTask | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [addingColumn, setAddingColumn] = useState(false);
  const [newColName, setNewColName] = useState("");
  const [collabOpen, setCollabOpen] = useState(false);
  const { user } = useUser();

  const [searchExpanded, setSearchExpanded] = useState(false);
  const [localActiveMobileColumnId, setLocalActiveMobileColumnId] = useState<number | null>(null);
  const activeMobileColumnId = localActiveMobileColumnId ?? columns[0]?.id ?? null;
  const [statsExpanded, setStatsExpanded] = useState(false);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const scrollLeft = container.scrollLeft;
    const containerWidth = container.clientWidth;
    const center = scrollLeft + containerWidth / 2;
    
    let closestColId = activeMobileColumnId;
    let minDiff = Infinity;
    
    columns.forEach((col) => {
      const element = document.getElementById(`col-container-${col.id}`);
      if (element) {
        const elementCenter = element.offsetLeft + element.clientWidth / 2;
        const diff = Math.abs(elementCenter - center);
        if (diff < minDiff) {
          minDiff = diff;
          closestColId = col.id;
        }
      }
    });
    
    if (closestColId && closestColId !== activeMobileColumnId) {
      setLocalActiveMobileColumnId(closestColId);
    }
  };

  const handleTabClick = (colId: number) => {
    setLocalActiveMobileColumnId(colId);
    const element = document.getElementById(`col-container-${colId}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  };



  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor)
  );

  const columnIds = useMemo(() => columns.map((c) => `col-${c.id}`), [columns]);

  /* Group tasks by column */
  const tasksByColumn = useMemo(() => {
    const map: Record<number, KanbanTask[]> = {};
    for (const col of columns) map[col.id] = [];
    for (const t of tasks) {
      if (map[t.columnId]) map[t.columnId].push(t);
    }
    // sort each by position
    for (const key of Object.keys(map)) {
      map[Number(key)].sort((a, b) => a.position - b.position);
    }
    return map;
  }, [columns, tasks]);

  /* ── Drag handlers ── */
  function handleDragStart(event: DragStartEvent) {
    const { active } = event;
    const id = String(active.id);
    if (!id.startsWith("col-")) {
      const task = tasks.find((t) => t.id === Number(id));
      setActiveTask(task ?? null);
    }
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    // Only handle task drags here
    if (activeId.startsWith("col-")) return;

    const activeTaskId = Number(activeId);
    const activeTaskObj = tasks.find((t) => t.id === activeTaskId);
    if (!activeTaskObj) return;

    let overColumnId: number | null = null;

    if (overId.startsWith("col-")) {
      overColumnId = Number(overId.replace("col-", ""));
    } else {
      const overTask = tasks.find((t) => t.id === Number(overId));
      if (overTask) overColumnId = overTask.columnId;
    }

    if (overColumnId && activeTaskObj.columnId !== overColumnId) {
      // Move task to new column
      const destTasks = tasksByColumn[overColumnId] || [];
      onMoveTask([
        { id: activeTaskId, columnId: overColumnId, position: destTasks.length },
      ]);
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    // Column reorder
    if (activeId.startsWith("col-") && overId.startsWith("col-")) {
      const oldIdx = columns.findIndex(
        (c) => c.id === Number(activeId.replace("col-", ""))
      );
      const newIdx = columns.findIndex(
        (c) => c.id === Number(overId.replace("col-", ""))
      );
      if (oldIdx !== newIdx) {
        onReorderColumns(arrayMove(columns, oldIdx, newIdx));
      }
      return;
    }

    // Task reorder within same column
    if (!activeId.startsWith("col-") && !overId.startsWith("col-")) {
      const activeTaskId = Number(activeId);
      const overTaskId = Number(overId);
      const activeTaskObj = tasks.find((t) => t.id === activeTaskId);
      const overTaskObj = tasks.find((t) => t.id === overTaskId);

      if (activeTaskObj && overTaskObj && activeTaskObj.columnId === overTaskObj.columnId) {
        const colTasks = [...(tasksByColumn[activeTaskObj.columnId] || [])];
        const oldIdx = colTasks.findIndex((t) => t.id === activeTaskId);
        const newIdx = colTasks.findIndex((t) => t.id === overTaskId);
        if (oldIdx !== -1 && newIdx !== -1 && oldIdx !== newIdx) {
          const reordered = arrayMove(colTasks, oldIdx, newIdx);
          onMoveTask(
            reordered.map((t, i) => ({
              id: t.id,
              columnId: t.columnId,
              position: i,
            }))
          );
        }
      }
    }
  }

  const hasActiveFilters =
    filterPriority || filterCategory || filterSpecial || searchQuery;

  const boardRoomId = buildRoomId("board", board.id);

  return (
    <CollabRoom roomId={boardRoomId}>
      <div className="kb-board-area">
      {/* ── Board Header ── */}
      <div className="kb-board-header">
        <div className="kb-board-header-top">
          <div className="kb-board-title-section">
            {onToggleSidebar && (
              <button
                className="kb-sidebar-toggle-btn kb-mobile-only"
                onClick={onToggleSidebar}
                style={{
                  padding: "6px",
                  marginRight: "4px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  color: "hsl(222 14% 30%)"
                }}
              >
                <Menu size={20} />
              </button>
            )}
            <span
              className="kb-board-color-dot"
              style={{ background: board.color }}
            />
            <h1 className="kb-board-title">{board.name}</h1>
            <div className="kb-board-collab-cluster kb-desktop-only">
              <PresenceAvatars
                totalCollaboratorCount={totalCollaborators}
                max={4}
                size={28}
              />
              <CollaborationButton onClick={() => setCollabOpen(true)} />
            </div>
            <div className="kb-mobile-only" style={{ marginLeft: "4px" }}>
              <MobileCollaborators
                totalCollaborators={totalCollaborators}
                onClick={() => setCollabOpen(true)}
              />
            </div>
          </div>
          <div className="kb-board-actions">
            <div className="kb-search-bar kb-desktop-only">
              <Search size={14} />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
              />
              {searchQuery && (
                <button onClick={() => onSearchChange("")} className="kb-search-clear">
                  <X size={12} />
                </button>
              )}
            </div>
            <button
              className={`kb-filter-btn kb-desktop-only${showFilters ? " kb-filter-btn--active" : ""}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <SlidersHorizontal size={14} />
              Filter
              {hasActiveFilters && <span className="kb-filter-dot" />}
            </button>

            {/* Mobile search toggle button */}
            <button
              className={`kb-filter-btn kb-mobile-only ${searchExpanded ? "kb-filter-btn--active" : ""}`}
              onClick={() => setSearchExpanded(!searchExpanded)}
              style={{
                padding: "8px",
                background: "none",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                color: searchExpanded || searchQuery ? "var(--et-blue)" : "hsl(222 14% 30%)"
              }}
            >
              <Search size={18} />
            </button>

            {/* Desktop New Task button */}
            <button
              className="kb-btn kb-btn--primary kb-desktop-only"
              onClick={() => onOpenDrawer()}
              disabled={!canEdit}
              title={canEdit ? "Create a new task" : "Viewers can't create tasks"}
            >
              <Plus size={15} />
              New Task
            </button>

            {/* Mobile New Task button */}
            {canEdit && (
              <button
                className="kb-btn kb-btn--primary kb-mobile-only"
                onClick={() => onOpenDrawer()}
                style={{ padding: "6px" }}
                title="Create a new task"
              >
                <Plus size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Insights Bar (Scroll Snap on Mobile) */}
        <div className="kb-insights-bar">
          <div className="kb-insight-card">
            <BarChart3 size={14} />
            <span className="kb-insight-value">{insights.totalTasks}</span>
            <span className="kb-insight-label">Tasks</span>
          </div>
          <div className="kb-insight-card kb-insight-card--success">
            <CheckCircle2 size={14} />
            <span className="kb-insight-value">{insights.completedTasks}</span>
            <span className="kb-insight-label">Done</span>
          </div>
          <div className="kb-insight-card kb-insight-card--warning">
            <CalendarClock size={14} />
            <span className="kb-insight-value">{insights.dueTodayTasks}</span>
            <span className="kb-insight-label">Due Today</span>
          </div>
          <div className="kb-insight-card kb-insight-card--danger">
            <AlertTriangle size={14} />
            <span className="kb-insight-value">{insights.overdueTasks}</span>
            <span className="kb-insight-label">Overdue</span>
          </div>
          <div className="kb-insight-card kb-insight-card--info">
            <TrendingUp size={14} />
            <span className="kb-insight-value">{insights.completionRate}%</span>
            <span className="kb-insight-label">Rate</span>
            <div className="kb-insight-progress-bar">
              <div
                className="kb-insight-progress-fill"
                style={{ width: `${insights.completionRate}%` }}
              />
            </div>
          </div>
        </div>

        {/* Desktop Filter Row */}
        {showFilters && (
          <div className="kb-filter-row kb-desktop-only">
            <div className="kb-filter-group">
              <label>Priority</label>
              <div className="kb-filter-chips">
                {PRIORITIES.map((p) => (
                  <button
                    key={p}
                    className={`kb-chip${filterPriority === p ? " kb-chip--active" : ""}`}
                    onClick={() =>
                      onFilterPriorityChange(filterPriority === p ? null : p)
                    }
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div className="kb-filter-group">
              <label>Category</label>
              <div className="kb-filter-chips">
                {categories.map((c) => (
                  <button
                    key={c.value}
                    className={`kb-chip${filterCategory === c.value ? " kb-chip--active" : ""}`}
                    onClick={() =>
                      onFilterCategoryChange(filterCategory === c.value ? null : c.value)
                    }
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="kb-filter-group">
              <label>Special</label>
              <div className="kb-filter-chips">
                {SPECIALS.map((s) => (
                  <button
                    key={s.value}
                    className={`kb-chip${filterSpecial === s.value ? " kb-chip--active" : ""}`}
                    onClick={() =>
                      onFilterSpecialChange(filterSpecial === s.value ? null : s.value)
                    }
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
            {hasActiveFilters && (
              <button
                className="kb-clear-filters"
                onClick={() => {
                  onSearchChange("");
                  onFilterPriorityChange(null);
                  onFilterCategoryChange(null);
                  onFilterSpecialChange(null);
                }}
              >
                <X size={12} />
                Clear All
              </button>
            )}
          </div>
        )}
      </div>

      {/* Collapsible Mobile Search & Filter Panel */}
      <div className={`kb-mobile-search-panel kb-mobile-only ${searchExpanded ? "kb-mobile-search-panel--open" : ""}`}>
        <div className="kb-search-bar" style={{ width: "100%", margin: 0 }}>
          <Search size={14} />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          {searchQuery && (
            <button onClick={() => onSearchChange("")} className="kb-search-clear">
              <X size={12} />
            </button>
          )}
        </div>
        <button
          className={`kb-filter-btn ${showFilters ? "kb-filter-btn--active" : ""}`}
          onClick={() => setShowFilters(true)}
          style={{ padding: "6px 12px" }}
        >
          <SlidersHorizontal size={14} />
          Filter
          {hasActiveFilters && <span className="kb-filter-dot" />}
        </button>
      </div>

      {/* Mobile Bottom Sheet for Filters */}
      {showFilters && (
        <div className="kb-bottom-sheet-backdrop kb-mobile-only" onClick={() => setShowFilters(false)}>
          <div className="kb-bottom-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="kb-bottom-sheet-handle" />
            <div className="kb-bottom-sheet-header">
              <span className="kb-bottom-sheet-title">Filters</span>
              <button className="kb-bottom-sheet-close" onClick={() => setShowFilters(false)}>
                <X size={16} />
              </button>
            </div>
            <div className="kb-task-mobile-menu-options">
              <div className="kb-filter-group">
                <label className="kb-drawer-label">Priority</label>
                <div className="kb-filter-chips" style={{ marginTop: "6px" }}>
                  {PRIORITIES.map((p) => (
                    <button
                      key={p}
                      className={`kb-chip${filterPriority === p ? " kb-chip--active" : ""}`}
                      onClick={() =>
                        onFilterPriorityChange(filterPriority === p ? null : p)
                      }
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="kb-filter-group" style={{ marginTop: "12px" }}>
                <label className="kb-drawer-label">Category</label>
                <div className="kb-filter-chips" style={{ marginTop: "6px" }}>
                  {categories.map((c) => (
                    <button
                      key={c.value}
                      className={`kb-chip${filterCategory === c.value ? " kb-chip--active" : ""}`}
                      onClick={() =>
                        onFilterCategoryChange(filterCategory === c.value ? null : c.value)
                      }
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="kb-filter-group" style={{ marginTop: "12px" }}>
                <label className="kb-drawer-label">Special</label>
                <div className="kb-filter-chips" style={{ marginTop: "6px" }}>
                  {SPECIALS.map((s) => (
                    <button
                      key={s.value}
                      className={`kb-chip${filterSpecial === s.value ? " kb-chip--active" : ""}`}
                      onClick={() =>
                        onFilterSpecialChange(filterSpecial === s.value ? null : s.value)
                      }
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {hasActiveFilters && (
                <button
                  className="kb-clear-filters"
                  style={{ width: "100%", justifyContent: "center", padding: "10px", borderRadius: "8px", marginTop: "16px" }}
                  onClick={() => {
                    onSearchChange("");
                    onFilterPriorityChange(null);
                    onFilterCategoryChange(null);
                    onFilterSpecialChange(null);
                  }}
                >
                  <X size={14} />
                  Clear All
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Column Navigation Tabs */}
      <div className="kb-mobile-tabs kb-mobile-only">
        {columns.map((col) => {
          const colTasks = tasksByColumn[col.id] || [];
          const isActive = col.id === activeMobileColumnId;
          return (
            <button
              key={col.id}
              className={`kb-mobile-tab-btn${isActive ? " kb-mobile-tab-btn--active" : ""}`}
              onClick={() => handleTabClick(col.id)}
            >
              {col.name}
              <span className="kb-mobile-tab-count">{colTasks.length}</span>
            </button>
          );
        })}
      </div>

      {/* Mobile Collapsible Metrics/Insights Summary */}
      <div className="kb-mobile-only" style={{ borderBottom: "1px solid hsl(214 20% 93%)" }}>
        <button
          onClick={() => setStatsExpanded(!statsExpanded)}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            padding: "10px 16px",
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: "0.75rem",
            fontWeight: 650,
            color: "var(--sb-text-2)",
          }}
        >
          <span>Metrics & Insights ({insights.completionRate}% completion)</span>
          <span style={{ fontSize: "10px", color: "var(--et-blue)", fontWeight: 700 }}>
            {statsExpanded ? "Hide Stats" : "Show Stats"}
          </span>
        </button>
        {statsExpanded && (
          <div
            style={{
              display: "flex",
              gap: "10px",
              padding: "4px 16px 14px",
              overflowX: "auto",
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
          >
            <div className="kb-insight-card" style={{ flexShrink: 0, minWidth: "110px", padding: "8px 12px" }}>
              <BarChart3 size={12} />
              <span className="kb-insight-value" style={{ fontSize: "1rem" }}>{insights.totalTasks}</span>
              <span className="kb-insight-label" style={{ fontSize: "0.65rem" }}>Tasks</span>
            </div>
            <div className="kb-insight-card kb-insight-card--success" style={{ flexShrink: 0, minWidth: "110px", padding: "8px 12px" }}>
              <CheckCircle2 size={12} />
              <span className="kb-insight-value" style={{ fontSize: "1rem" }}>{insights.completedTasks}</span>
              <span className="kb-insight-label" style={{ fontSize: "0.65rem" }}>Done</span>
            </div>
            <div className="kb-insight-card kb-insight-card--warning" style={{ flexShrink: 0, minWidth: "110px", padding: "8px 12px" }}>
              <CalendarClock size={12} />
              <span className="kb-insight-value" style={{ fontSize: "1rem" }}>{insights.dueTodayTasks}</span>
              <span className="kb-insight-label" style={{ fontSize: "0.65rem" }}>Due Today</span>
            </div>
            <div className="kb-insight-card kb-insight-card--danger" style={{ flexShrink: 0, minWidth: "110px", padding: "8px 12px" }}>
              <AlertTriangle size={12} />
              <span className="kb-insight-value" style={{ fontSize: "1rem" }}>{insights.overdueTasks}</span>
              <span className="kb-insight-label" style={{ fontSize: "0.65rem" }}>Overdue</span>
            </div>
          </div>
        )}
      </div>

      <PresenceBanner entityName="board" />

      {/* ── Columns ── */}
      {loading ? (
        <div className="kb-columns-skeleton">
          {[1, 2, 3].map((i) => (
            <div key={i} className="kb-col-skeleton">
              <div className="kb-col-skeleton-header" />
              <div className="kb-col-skeleton-card" />
              <div className="kb-col-skeleton-card kb-col-skeleton-card--short" />
            </div>
          ))}
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div
            className="kb-columns-scroll"
            onScroll={handleScroll}
          >
            <SortableContext
              items={columnIds}
              strategy={horizontalListSortingStrategy}
            >
              {columns.map((col) => {
                return (
                  <Column
                    key={col.id}
                    id={`col-container-${col.id}`}
                    column={col}
                    tasks={tasksByColumn[col.id] || []}
                    onAddTask={() => onOpenDrawer(col.id)}
                    onEditTask={(task) => onOpenDrawer(col.id, task)}
                    onRename={(name) => onRenameColumn(col.id, name)}
                    onDelete={() => {
                      if (
                        confirm(
                          `Delete column "${col.name}" and all its tasks?`
                        )
                      )
                        onDeleteColumn(col.id);
                    }}
                    onToggleComplete={onToggleComplete}
                    onDeleteTask={onDeleteTask}
                    canEdit={canEdit}
                    isActiveMobile={col.id === activeMobileColumnId}
                    allColumns={columns}
                    onMoveTaskToColumn={(taskId, destColId) => {
                      onMoveTask([{ id: taskId, columnId: destColId, position: (tasksByColumn[destColId] || []).length }]);
                    }}
                  />
                );
              })}
            </SortableContext>

            {/* Add Column Button */}
            {canEdit && (
            <div className="kb-add-col-wrap">
              {addingColumn ? (
                <div className="kb-add-col-form">
                  <input
                    autoFocus
                    placeholder="Column name..."
                    value={newColName}
                    onChange={(e) => setNewColName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newColName.trim()) {
                        onAddColumn(newColName.trim());
                        setNewColName("");
                        setAddingColumn(false);
                      }
                      if (e.key === "Escape") {
                        setAddingColumn(false);
                        setNewColName("");
                      }
                    }}
                    className="kb-add-col-input"
                  />
                  <div className="kb-add-col-actions">
                    <button
                      className="kb-btn kb-btn--primary kb-btn--sm"
                      onClick={() => {
                        if (newColName.trim()) {
                          onAddColumn(newColName.trim());
                          setNewColName("");
                          setAddingColumn(false);
                        }
                      }}
                    >
                      Add
                    </button>
                    <button
                      className="kb-btn kb-btn--ghost kb-btn--sm"
                      onClick={() => {
                        setAddingColumn(false);
                        setNewColName("");
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  className="kb-add-col-btn"
                  onClick={() => setAddingColumn(true)}
                >
                  <Plus size={16} />
                  Add Column
                </button>
              )}
            </div>
            )}
          </div>

          <DragOverlay>
            {activeTask && (
              <TaskCard
                task={activeTask}
                isDragOverlay
                onEdit={() => {}}
                onToggleComplete={() => {}}
                onDelete={() => {}}
              />
            )}
          </DragOverlay>
        </DndContext>
      )}

      <CollaborationPanel
        open={collabOpen}
        onClose={() => setCollabOpen(false)}
        boardId={board.id}
        boardName={board.name}
        myRole={myRole}
        currentUserEmail={user?.emailAddresses?.[0]?.emailAddress ?? null}
      />

      {/* Floating Action Button (FAB) on Mobile */}
      {canEdit && (
        <button
          className="kb-mobile-fab kb-mobile-only"
          onClick={() => onOpenDrawer()}
          title="Create a new task"
        >
          <Plus size={24} />
        </button>
      )}
      </div>
    </CollabRoom>
  );
}
