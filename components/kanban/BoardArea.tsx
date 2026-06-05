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
} from "lucide-react";
import type { KanbanBoard, KanbanColumn, KanbanTask } from "@/db/schema";
import {
  CollabRoom,
  CollaborationButton,
  CollaborationPanel,
  PresenceAvatars,
  PresenceBanner,
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
}

export default function BoardArea({
  board,
  columns,
  tasks,
  allTasks,
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
}: Props) {
  const [activeTask, setActiveTask] = useState<KanbanTask | null>(null);
  const [activeColId, setActiveColId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [addingColumn, setAddingColumn] = useState(false);
  const [newColName, setNewColName] = useState("");
  const [collabOpen, setCollabOpen] = useState(false);
  const { user } = useUser();

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
    if (id.startsWith("col-")) {
      setActiveColId(id);
    } else {
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
    setActiveColId(null);

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
            <span
              className="kb-board-color-dot"
              style={{ background: board.color }}
            />
            <h1 className="kb-board-title">{board.name}</h1>
            <div className="kb-board-collab-cluster">
              <PresenceAvatars
                totalCollaboratorCount={totalCollaborators}
                max={4}
                size={28}
              />
              <CollaborationButton onClick={() => setCollabOpen(true)} />
            </div>
          </div>
          <div className="kb-board-actions">
            <div className="kb-search-bar">
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
              className={`kb-filter-btn${showFilters ? " kb-filter-btn--active" : ""}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <SlidersHorizontal size={14} />
              Filter
              {hasActiveFilters && <span className="kb-filter-dot" />}
            </button>
            <button
              className="kb-btn kb-btn--primary"
              onClick={() => onOpenDrawer()}
              disabled={!canEdit}
              title={canEdit ? "Create a new task" : "Viewers can't create tasks"}
            >
              <Plus size={15} />
              New Task
            </button>
          </div>
        </div>

        {/* Insights Bar */}
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

        {/* Filter Row */}
        {showFilters && (
          <div className="kb-filter-row">
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
          <div className="kb-columns-scroll">
            <SortableContext
              items={columnIds}
              strategy={horizontalListSortingStrategy}
            >
              {columns.map((col) => (
                <Column
                  key={col.id}
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
                />
              ))}
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
      </div>
    </CollabRoom>
  );
}
