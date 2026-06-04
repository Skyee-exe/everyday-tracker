"use client";

import React, { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import TaskCard from "./TaskCard";
import { Plus, MoreHorizontal, GripVertical, Pencil, Trash2 } from "lucide-react";
import type { KanbanColumn, KanbanTask } from "@/db/schema";

interface Props {
  column: KanbanColumn;
  tasks: KanbanTask[];
  onAddTask: () => void;
  onEditTask: (task: KanbanTask) => void;
  onRename: (name: string) => void;
  onDelete: () => void;
  onToggleComplete: (id: number, completed: boolean) => void;
  onDeleteTask: (id: number) => void;
}

export default function Column({
  column,
  tasks,
  onAddTask,
  onEditTask,
  onRename,
  onDelete,
  onToggleComplete,
  onDeleteTask,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(column.name);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `col-${column.id}`,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const taskIds = tasks.map((t) => String(t.id));

  return (
    <div ref={setNodeRef} style={style} className="kb-column">
      {/* Column Header */}
      <div className="kb-column-header">
        <div className="kb-column-header-left">
          <button
            className="kb-column-drag"
            {...attributes}
            {...listeners}
          >
            <GripVertical size={14} />
          </button>
          {editing ? (
            <input
              autoFocus
              className="kb-column-rename-input"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={() => {
                if (editName.trim() && editName !== column.name) {
                  onRename(editName.trim());
                }
                setEditing(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  if (editName.trim() && editName !== column.name) {
                    onRename(editName.trim());
                  }
                  setEditing(false);
                }
                if (e.key === "Escape") {
                  setEditName(column.name);
                  setEditing(false);
                }
              }}
            />
          ) : (
            <span className="kb-column-name">{column.name}</span>
          )}
          <span className="kb-column-count">{tasks.length}</span>
        </div>
        <div className="kb-column-header-right">
          <button className="kb-column-add-btn" onClick={onAddTask} title="Add task">
            <Plus size={14} />
          </button>
          <div className="kb-column-menu-wrap">
            <button
              className="kb-column-menu-btn"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <MoreHorizontal size={14} />
            </button>
            {menuOpen && (
              <div className="kb-column-menu">
                <button
                  onClick={() => {
                    setEditing(true);
                    setMenuOpen(false);
                  }}
                >
                  <Pencil size={13} />
                  Rename
                </button>
                <button
                  className="kb-column-menu-danger"
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete();
                  }}
                >
                  <Trash2 size={13} />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tasks */}
      <div className="kb-column-body">
        <SortableContext
          items={taskIds}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={() => onEditTask(task)}
              onToggleComplete={(completed) =>
                onToggleComplete(task.id, completed)
              }
              onDelete={() => onDeleteTask(task.id)}
            />
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <div className="kb-column-empty">
            <p>No tasks</p>
            <button className="kb-column-empty-add" onClick={onAddTask}>
              <Plus size={13} />
              Add a task
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
