"use client";

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Calendar,
  Clock,
  CheckCircle2,
  Circle,
  Trash2,
  MoreHorizontal,
  Pencil,
  X,
} from "lucide-react";
import type { KanbanTask, KanbanColumn } from "@/db/schema";
import {
  CollabRoom,
  CommentCountBadge,
  LazyOnVisible,
} from "@/lib/collab";
import { buildRoomId } from "@/lib/collab/types";

const PRIORITY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  low: { label: "Low", color: "#64748b", bg: "rgba(100,116,139,0.1)" },
  medium: { label: "Medium", color: "#2563eb", bg: "rgba(37,99,235,0.1)" },
  high: { label: "High", color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
  critical: { label: "Critical", color: "#ef4444", bg: "rgba(239,68,68,0.1)" },
};

const CATEGORY_COLORS: Record<string, string> = {
  work: "#2563eb",
  personal: "#7c3aed",
  health: "#10b981",
  learning: "#f59e0b",
  finance: "#0891b2",
  urgent: "#ef4444",
};

function formatDuration(mins: number): string {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function formatDate(date: Date | string | null): string {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function isOverdue(date: Date | string | null): boolean {
  if (!date) return false;
  return new Date(date) < new Date() ;
}

interface Props {
  task: KanbanTask;
  isDragOverlay?: boolean;
  onEdit: () => void;
  onToggleComplete: (completed: boolean) => void;
  onDelete: () => void;
  canEdit?: boolean;
  allColumns?: KanbanColumn[];
  onMoveToColumn?: (taskId: number, columnId: number) => void;
}

export default function TaskCard({
  task,
  isDragOverlay,
  onEdit,
  onToggleComplete,
  onDelete,
  canEdit = true,
  allColumns = [],
  onMoveToColumn,
}: Props) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: String(task.id),
    disabled: isDragOverlay || !canEdit,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const pri = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
  const catColor = CATEGORY_COLORS[task.category ?? "work"] || "#64748b";
  const overdue = !task.completed && isOverdue(task.dueDate);

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className={`kb-task-card${isDragOverlay ? " kb-task-card--overlay" : ""}${
          task.completed ? " kb-task-card--done" : ""
        }${overdue ? " kb-task-card--overdue" : ""}`}
        onClick={(e) => {
          // Don't open edit if clicking complete, delete, or touch menu
          const target = e.target as HTMLElement;
          if (
            target.closest(".kb-task-complete-btn") ||
            target.closest(".kb-task-delete-btn") ||
            target.closest(".kb-task-menu-btn")
          )
            return;
          onEdit();
        }}
      >
      {/* Priority strip */}
      <div
        className="kb-task-priority-strip"
        style={{ background: pri.color }}
      />

      <div className="kb-task-content">
        {/* Top row: complete toggle + title */}
        <div className="kb-task-top">
          <button
            className="kb-task-complete-btn"
            onClick={(e) => {
              e.stopPropagation();
              onToggleComplete(!task.completed);
            }}
            title={task.completed ? "Mark incomplete" : "Mark complete"}
          >
            {task.completed ? (
              <CheckCircle2 size={16} className="kb-task-check--done" />
            ) : (
              <Circle size={16} className="kb-task-check" />
            )}
          </button>
          <span className={`kb-task-title${task.completed ? " kb-task-title--done" : ""}`}>
            {task.title}
          </span>
          {canEdit && (
            <>
              <button
                className="kb-task-delete-btn kb-desktop-only"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                title="Delete task"
              >
                <Trash2 size={12} />
              </button>
              <button
                className="kb-task-menu-btn kb-mobile-only"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(true);
                }}
                title="Task Actions"
              >
                <MoreHorizontal size={14} />
              </button>
            </>
          )}
        </div>

        {/* Meta row */}
        <div className="kb-task-meta">
          {/* Priority badge */}
          <span
            className="kb-task-badge"
            style={{ color: pri.color, background: pri.bg }}
          >
            {pri.label}
          </span>

          {/* Category badge */}
          {task.category && (
            <span
              className="kb-task-badge"
              style={{
                color: catColor,
                background: `${catColor}15`,
              }}
            >
              {task.category}
            </span>
          )}
        </div>

        {/* Bottom row: date, duration, links */}
        <div className="kb-task-bottom">
          {task.dueDate && (
            <span className={`kb-task-date${overdue ? " kb-task-date--overdue" : ""}`}>
              <Calendar size={11} />
              {formatDate(task.dueDate)}
            </span>
          )}
          {task.estimatedDuration && (
            <span className="kb-task-duration">
              <Clock size={11} />
              {formatDuration(task.estimatedDuration)}
            </span>
          )}
          {task.linkedCalendarTaskId && (
            <span className="kb-task-link-badge" title="Calendar synced">
              📅
            </span>
          )}
          {task.linkedNoteId && (
            <span className="kb-task-link-badge" title="Note attached">
              📝
            </span>
          )}
          <span className="kb-task-comment-wrap">
            <LazyOnVisible
              fallback={
                <span
                  className="kb-task-comment-count kb-task-comment-count--loading"
                  title="Loading comments…"
                >
                  <svg
                    width="11"
                    height="11"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                  </svg>
                </span>
              }
            >
              <CollabRoom roomId={buildRoomId("task", task.id)}>
                <CommentCountBadge />
              </CollabRoom>
            </LazyOnVisible>
          </span>
        </div>
      </div>
    </div>
    {menuOpen && (
        <div
          className="kb-bottom-sheet-backdrop kb-mobile-only"
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen(false);
          }}
        >
          <div className="kb-bottom-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="kb-bottom-sheet-handle" />
            <div className="kb-bottom-sheet-header">
              <span className="kb-bottom-sheet-title">{task.title}</span>
              <button
                className="kb-bottom-sheet-close"
                onClick={() => setMenuOpen(false)}
              >
                <X size={16} />
              </button>
            </div>
            <div className="kb-task-mobile-menu-options">
              <button
                className="kb-task-mobile-menu-option"
                onClick={() => {
                  setMenuOpen(false);
                  onEdit();
                }}
              >
                <Pencil size={16} />
                Edit Task Details
              </button>

              {allColumns.length > 1 && onMoveToColumn && (
                <>
                  <span className="kb-task-mobile-menu-sublabel">
                    Move to Column
                  </span>
                  {allColumns
                    .filter((c) => c.id !== task.columnId)
                    .map((c) => (
                      <button
                        key={c.id}
                        className="kb-task-mobile-menu-option"
                        style={{ paddingLeft: "24px" }}
                        onClick={() => {
                          onMoveToColumn(task.id, c.id);
                          setMenuOpen(false);
                        }}
                      >
                        👉 {c.name}
                      </button>
                    ))}
                </>
              )}

              <button
                className="kb-task-mobile-menu-option kb-task-mobile-menu-option-danger"
                onClick={() => {
                  setMenuOpen(false);
                  onDelete();
                }}
              >
                <Trash2 size={16} />
                Delete Task
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
