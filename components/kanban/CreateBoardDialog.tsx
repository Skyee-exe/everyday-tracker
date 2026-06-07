"use client";

import React, { useState } from "react";
import {
  X,
  User,
  BookOpen,
  Briefcase,
  Zap,
  Laptop,
  FileText,
} from "lucide-react";

const BOARD_COLORS = [
  "#2563eb",
  "#7c3aed",
  "#0891b2",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#ec4899",
  "#6366f1",
  "#14b8a6",
  "#f97316",
];

const TEMPLATES = [
  { id: "personal-planner", label: "Personal Planner", icon: User, desc: "Todo → In Progress → Done → Someday" },
  { id: "study-tracker", label: "Study Tracker", icon: BookOpen, desc: "To Study → Studying → Review → Mastered" },
  { id: "project-management", label: "Project Management", icon: Briefcase, desc: "Backlog → Todo → In Progress → Review → Done" },
  { id: "sprint-board", label: "Sprint Board", icon: Zap, desc: "Sprint Backlog → Dev → Testing → Done" },
  { id: "work-tasks", label: "Work Tasks", icon: Laptop, desc: "Todo → In Progress → Blocked → Done" },
  { id: "blank", label: "Blank Board", icon: FileText, desc: "Todo → In Progress → Done" },
];

interface Props {
  onClose: () => void;
  onCreate: (data: { name: string; color: string; template: string }) => void;
}

export default function CreateBoardDialog({ onClose, onCreate }: Props) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(BOARD_COLORS[0]);
  const [template, setTemplate] = useState("blank");

  const handleSubmit = () => {
    if (!name.trim()) return;
    onCreate({ name: name.trim(), color, template });
  };

  return (
    <>
      <div className="kb-dialog-backdrop" onClick={onClose} />
      <div className="kb-dialog">
        <div className="kb-bottom-sheet-handle kb-mobile-only" style={{ marginTop: "12px", marginBottom: "-4px" }} />
        {/* Header */}
        <div className="kb-dialog-header">
          <h2>Create Board</h2>
          <button className="kb-dialog-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="kb-dialog-body">
          {/* Name */}
          <div className="kb-drawer-field">
            <label className="kb-drawer-label">Board Name</label>
            <input
              autoFocus
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. My Project"
              className="kb-drawer-input kb-drawer-input--title"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmit();
              }}
            />
          </div>

          {/* Color */}
          <div className="kb-drawer-field">
            <label className="kb-drawer-label">Board Color</label>
            <div className="kb-color-picker">
              {BOARD_COLORS.map((c) => (
                <button
                  key={c}
                  className={`kb-color-swatch${color === c ? " kb-color-swatch--active" : ""}`}
                  style={{ background: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </div>

          {/* Template */}
          <div className="kb-drawer-field">
            <label className="kb-drawer-label">Template</label>
            <div className="kb-template-grid">
              {TEMPLATES.map((t) => {
                const Icon = t.icon;
                const isActive = template === t.id;
                return (
                  <button
                    key={t.id}
                    className={`kb-template-card${isActive ? " kb-template-card--active" : ""}`}
                    onClick={() => setTemplate(t.id)}
                  >
                    <div className="kb-template-icon">
                      <Icon size={18} />
                    </div>
                    <span className="kb-template-name">{t.label}</span>
                    <span className="kb-template-desc">{t.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="kb-dialog-footer">
          <button className="kb-btn kb-btn--ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            className="kb-btn kb-btn--primary"
            onClick={handleSubmit}
            disabled={!name.trim()}
          >
            Create Board
          </button>
        </div>
      </div>
    </>
  );
}
