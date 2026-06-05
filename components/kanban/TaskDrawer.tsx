"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Calendar as CalendarIcon,
  Clock,
  Flag,
  Tag,
  FileText,
  Link2,
  MessageSquare,
} from "lucide-react";
import type { KanbanColumn, KanbanTask } from "@/db/schema";
import { CollabRoom, CommentThread } from "@/lib/collab";
import { buildRoomId } from "@/lib/collab/types";

const PRIORITIES = [
  { value: "low", label: "Low", color: "#64748b" },
  { value: "medium", label: "Medium", color: "#2563eb" },
  { value: "high", label: "High", color: "#f59e0b" },
  { value: "critical", label: "Critical", color: "#ef4444" },
];



const DURATIONS = [
  { value: 15, label: "15 min" },
  { value: 30, label: "30 min" },
  { value: 60, label: "1 hour" },
  { value: 120, label: "2 hours" },
  { value: 240, label: "4 hours" },
];

interface Props {
  columns: KanbanColumn[];
  columnId: number | null;
  task: KanbanTask | null;
  onClose: () => void;
  onCreate: (data: {
    title: string;
    description?: string;
    priority?: string;
    category?: string;
    dueDate?: Date | null;
    estimatedDuration?: number;
    syncCalendar?: boolean;
    columnId: number;
  }) => void;
  onUpdate: (
    id: number,
    data: Partial<{
      title: string;
      description: string | null;
      priority: string;
      category: string;
      dueDate: Date | null;
      estimatedDuration: number;
      completed: boolean;
    }>
  ) => void;
  canEdit?: boolean;
  categories: { value: string; label: string; color: string }[];
}

export default function TaskDrawer({
  columns,
  columnId,
  task,
  onClose,
  onCreate,
  onUpdate,
  canEdit = true,
  categories,
}: Props) {
  const isEditing = !!task;
  const titleRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState(task?.title || "");
  const [description, setDescription] = useState(task?.description || "");
  const [priority, setPriority] = useState(task?.priority || "medium");
  const [category, setCategory] = useState(task?.category || "work");
  const [dueDate, setDueDate] = useState(
    task?.dueDate
      ? new Date(task.dueDate).toISOString().split("T")[0]
      : ""
  );
  const [duration, setDuration] = useState(task?.estimatedDuration || 60);
  const [syncCalendar, setSyncCalendar] = useState(false);
  const [selectedColumnId, setSelectedColumnId] = useState(
    columnId ?? columns[0]?.id ?? 0
  );

  useEffect(() => {
    setTimeout(() => titleRef.current?.focus(), 100);
  }, []);

  const handleSubmit = () => {
    if (!title.trim()) return;
    if (!canEdit) return;

    if (isEditing && task) {
      onUpdate(task.id, {
        title: title.trim(),
        description: description || null,
        priority,
        category,
        dueDate: dueDate ? new Date(dueDate) : null,
        estimatedDuration: duration,
      });
    } else {
      onCreate({
        title: title.trim(),
        description: description || undefined,
        priority,
        category,
        dueDate: dueDate ? new Date(dueDate) : null,
        estimatedDuration: duration,
        syncCalendar,
        columnId: selectedColumnId,
      });
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div className="kb-drawer-backdrop" onClick={onClose} />

      {/* Drawer */}
      <div className="kb-drawer">
        {/* Header */}
        <div className="kb-drawer-header">
          <h2>{isEditing ? "Edit Task" : "Create Task"}</h2>
          <button className="kb-drawer-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="kb-drawer-body">
          {/* Column Selector (only for creation) */}
          {!isEditing && (
            <div className="kb-drawer-field">
              <label className="kb-drawer-label">
                <Tag size={14} />
                Column
              </label>
              <div className="kb-drawer-select-wrap">
                <select
                  value={selectedColumnId}
                  onChange={(e) => setSelectedColumnId(Number(e.target.value))}
                  className="kb-drawer-select"
                >
                  {columns.map((col) => (
                    <option key={col.id} value={col.id}>
                      {col.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Title */}
          <div className="kb-drawer-field">
            <label className="kb-drawer-label">Title</label>
            <input
              ref={titleRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title..."
              className="kb-drawer-input kb-drawer-input--title"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmit();
              }}
              readOnly={!canEdit}
            />
          </div>

          {/* Description */}
          <div className="kb-drawer-field">
            <label className="kb-drawer-label">
              <FileText size={14} />
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description..."
              className="kb-drawer-textarea"
              rows={3}
              readOnly={!canEdit}
            />
          </div>

          <div className="kb-drawer-divider" />

          {/* Due Date */}
          <div className="kb-drawer-field">
            <label className="kb-drawer-label">
              <CalendarIcon size={14} />
              Due Date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="kb-drawer-input"
            />
          </div>

          {/* Priority */}
          <div className="kb-drawer-field">
            <label className="kb-drawer-label">
              <Flag size={14} />
              Priority
            </label>
            <div className="kb-drawer-option-grid">
              {PRIORITIES.map((p) => (
                <button
                  key={p.value}
                  className={`kb-drawer-option${priority === p.value ? " kb-drawer-option--active" : ""}`}
                  style={
                    priority === p.value
                      ? { borderColor: p.color, background: `${p.color}12` }
                      : {}
                  }
                  onClick={() => setPriority(p.value)}
                >
                  <span
                    className="kb-drawer-option-dot"
                    style={{ background: p.color }}
                  />
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div className="kb-drawer-field">
            <label className="kb-drawer-label">
              <Tag size={14} />
              Category
            </label>
            <div className="kb-drawer-option-grid kb-drawer-option-grid--3">
              {categories.map((c) => (
                <button
                  key={c.value}
                  className={`kb-drawer-option${category === c.value ? " kb-drawer-option--active" : ""}`}
                  style={
                    category === c.value
                      ? { borderColor: c.color, background: `${c.color}12` }
                      : {}
                  }
                  onClick={() => setCategory(c.value)}
                >
                  <span
                    className="kb-drawer-option-dot"
                    style={{ background: c.color }}
                  />
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Duration */}
          <div className="kb-drawer-field">
            <label className="kb-drawer-label">
              <Clock size={14} />
              Estimated Duration
            </label>
            <div className="kb-drawer-chip-row">
              {DURATIONS.map((d) => (
                <button
                  key={d.value}
                  className={`kb-chip${duration === d.value ? " kb-chip--active" : ""}`}
                  onClick={() => setDuration(d.value)}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <div className="kb-drawer-divider" />

          {/* Calendar Sync */}
          {!isEditing && (
            <div className="kb-drawer-field">
              <label className="kb-drawer-label">
                <Link2 size={14} />
                Integrations
              </label>
              <label className="kb-drawer-toggle">
                <input
                  type="checkbox"
                  checked={syncCalendar}
                  onChange={(e) => setSyncCalendar(e.target.checked)}
                />
                <span className="kb-drawer-toggle-slider" />
                <span className="kb-drawer-toggle-text">
                  📅 Sync with Calendar
                </span>
              </label>
              <label className="kb-drawer-toggle kb-drawer-toggle--disabled">
                <input type="checkbox" disabled />
                <span className="kb-drawer-toggle-slider" />
                <span className="kb-drawer-toggle-text">
                  📝 Attach Note <span className="kb-soon">Coming soon</span>
                </span>
              </label>
            </div>
          )}

          {/* Discussion */}
          {isEditing && task && (
            <>
              <div className="kb-drawer-divider" />
              <div className="kb-drawer-field">
                <label className="kb-drawer-label">
                  <MessageSquare size={14} />
                  Discussion
                </label>
                <CollabRoom
                  roomId={buildRoomId("task", task.id)}
                  key={`thread-${task.id}`}
                >
                  <CommentThread taskId={task.id} />
                </CollabRoom>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="kb-drawer-footer">
          <button className="kb-btn kb-btn--ghost" onClick={onClose}>
            {canEdit ? "Cancel" : "Close"}
          </button>
          {canEdit && (
            <button
              className="kb-btn kb-btn--primary"
              onClick={handleSubmit}
              disabled={!title.trim()}
            >
              {isEditing ? "Save Changes" : "Create Task"}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
