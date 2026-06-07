"use client";

import React, { useState } from "react";
import {
  Search,
  Plus,
  Trash2,
  LayoutGrid,
} from "lucide-react";
import type { KanbanBoard, KanbanTask } from "@/db/schema";

interface Props {
  boards: KanbanBoard[];
  activeBoardId: number | null;
  tasks: KanbanTask[];
  onSelectBoard: (id: number) => void;
  onCreateBoard: () => void;
  onDeleteBoard: (id: number) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function BoardSidebar({
  boards,
  activeBoardId,
  tasks,
  onSelectBoard,
  onCreateBoard,
  onDeleteBoard,
  isOpen = false,
  onClose,
}: Props) {
  const [search, setSearch] = useState("");

  const filtered = boards.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelectBoard = (id: number) => {
    onSelectBoard(id);
    if (onClose) onClose();
  };

  return (
    <>
      {isOpen && <div className="kb-sidebar-backdrop" onClick={onClose} />}
      <aside className={`kb-sidebar${isOpen ? " kb-sidebar--open" : ""}`}>
        {/* Header */}
        <div className="kb-sidebar-header">
          <div className="kb-sidebar-title-row">
            <LayoutGrid size={18} strokeWidth={1.8} />
            <span className="kb-sidebar-title">Boards</span>
          </div>
          <button
            className="kb-sidebar-add-btn"
            onClick={() => {
              onCreateBoard();
              if (onClose) onClose();
            }}
            title="Create board"
          >
            <Plus size={16} strokeWidth={2} />
          </button>
        </div>

        {/* Search */}
        <div className="kb-sidebar-search">
          <Search size={14} className="kb-sidebar-search-icon" />
          <input
            type="text"
            placeholder="Search boards..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="kb-sidebar-search-input"
          />
        </div>

        {/* Board List */}
        <div className="kb-sidebar-list">
          {filtered.length === 0 && (
            <div className="kb-sidebar-empty">
              {search ? "No boards found" : "No boards yet"}
            </div>
          )}
          {filtered.map((board) => {
            const taskCount = tasks.length; // count relevant when board is active
            const isActive = board.id === activeBoardId;
            return (
              <div
                key={board.id}
                role="button"
                tabIndex={0}
                className={`kb-sidebar-item${isActive ? " kb-sidebar-item--active" : ""}`}
                onClick={() => handleSelectBoard(board.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleSelectBoard(board.id);
                  }
                }}
              >
                <span
                  className="kb-sidebar-item-dot"
                  style={{ background: board.color }}
                />
                <span className="kb-sidebar-item-name">{board.name}</span>
                {isActive && (
                  <span className="kb-sidebar-item-count">{taskCount}</span>
                )}
                <button
                  className="kb-sidebar-item-delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Delete "${board.name}"?`)) onDeleteBoard(board.id);
                  }}
                  title="Delete board"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            );
          })}
        </div>
      </aside>
    </>
  );
}
