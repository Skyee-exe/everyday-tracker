"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Search,
  FileText,
  Kanban,
  NotebookPen,
  Calendar,
  Sparkles,
  Plus,
  ArrowRight,
  Clock,
  Hash,
  BookOpen,
  PenTool,
  LayoutDashboard,
  Wand2,
  Settings2,
  X,
} from "lucide-react";

/* ─────────── Data ─────────── */
const RECENT = [
  { icon: FileText, label: "Q2 Report Draft", sub: "Notes · Edited 2m ago", color: "#2563eb" },
  { icon: Kanban, label: "Sprint 4 Board", sub: "Kanban · Updated 1h ago", color: "#dc2626" },
  { icon: NotebookPen, label: "Design System Notes", sub: "Notes · Edited yesterday", color: "#0ea5e9" },
  { icon: Calendar, label: "Team Standup", sub: "Calendar · Today 09:00", color: "#2563eb" },
];

const ACTIONS = [
  { icon: Plus, label: "New Task", sub: "Add to Kanban board", color: "#dc2626", kbd: "T" },
  { icon: NotebookPen, label: "New Note", sub: "Open blank note", color: "#0ea5e9", kbd: "N" },
  { icon: Calendar, label: "New Event", sub: "Add to calendar", color: "#2563eb", kbd: "E" },
];

const NAV_PAGES = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard", color: "#2563eb" },
  { icon: Kanban, label: "Tasks & Kanban", href: "/dashboard/tasks", color: "#dc2626" },
  { icon: NotebookPen, label: "Notes", href: "/dashboard/notes", color: "#0ea5e9" },
  { icon: PenTool, label: "Whiteboard", href: "/dashboard/whiteboard", color: "#0891b2" },
  { icon: BookOpen, label: "Pages & Spaces", href: "/dashboard/pages", color: "#2563eb" },
  { icon: Wand2, label: "AI Templates", href: "/dashboard/ai-templates", color: "#7c3aed" },
  { icon: Settings2, label: "Settings", href: "/dashboard/settings", color: "#64748b" },
];

/* ─────────── Component ─────────── */
interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  /* Focus input when opened */
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelected(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  /* Keyboard navigation */
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowDown") setSelected((s) => s + 1);
      if (e.key === "ArrowUp") setSelected((s) => Math.max(0, s - 1));
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  /* Filter based on query */
  const filtered = query
    ? NAV_PAGES.filter((p) => p.label.toLowerCase().includes(query.toLowerCase()))
    : null;

  return (
    <>
      {/* Backdrop */}
      <div className="cp-backdrop" onClick={onClose} />

      {/* Panel */}
      <div className="cp-panel" role="dialog" aria-label="Command palette">

        {/* Search Input */}
        <div className="cp-search-row">
          <Search size={16} className="cp-search-ico" strokeWidth={2} />
          <input
            ref={inputRef}
            className="cp-input"
            placeholder="Search pages, tasks, notes..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelected(0); }}
            autoComplete="off"
            spellCheck={false}
          />
          {query && (
            <button className="cp-clear" onClick={() => setQuery("")} aria-label="Clear">
              <X size={14} strokeWidth={2} />
            </button>
          )}
          <kbd className="cp-esc-kbd">Esc</kbd>
        </div>

        <div className="cp-body">
          {/* Search results */}
          {filtered && filtered.length > 0 && (
            <section className="cp-section">
              <p className="cp-section-label">Navigate to</p>
              {filtered.map((item, i) => {
                const Icon = item.icon;
                return (
                  <a key={i} href={item.href} className={`cp-item${selected === i ? " cp-item--sel" : ""}`} onClick={onClose}>
                    <span className="cp-item-icon" style={{ color: item.color, background: `${item.color}14` }}>
                      <Icon size={15} strokeWidth={1.8} />
                    </span>
                    <span className="cp-item-label">{item.label}</span>
                    <ArrowRight size={13} className="cp-item-arr" />
                  </a>
                );
              })}
            </section>
          )}

          {filtered && filtered.length === 0 && (
            <div className="cp-empty">
              <Search size={28} className="cp-empty-icon" strokeWidth={1.5} />
              <p>No results for <strong>&quot;{query}&quot;</strong></p>
              <span>Try searching for pages, tasks, or notes</span>
            </div>
          )}

          {!query && (
            <>
              {/* Recent */}
              <section className="cp-section">
                <p className="cp-section-label">
                  <Clock size={11} />
                  Recent
                </p>
                {RECENT.map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <button key={i} className={`cp-item${selected === i ? " cp-item--sel" : ""}`}>
                      <span className="cp-item-icon" style={{ color: item.color, background: `${item.color}14` }}>
                        <Icon size={15} strokeWidth={1.8} />
                      </span>
                      <div className="cp-item-body">
                        <span className="cp-item-label">{item.label}</span>
                        <span className="cp-item-sub">{item.sub}</span>
                      </div>
                      <ArrowRight size={13} className="cp-item-arr" />
                    </button>
                  );
                })}
              </section>

              {/* Quick Actions */}
              <section className="cp-section">
                <p className="cp-section-label">
                  <Hash size={11} />
                  Quick Actions
                </p>
                <div className="cp-actions-grid">
                  {ACTIONS.map((item, i) => {
                    const Icon = item.icon;
                    return (
                      <button key={i} className="cp-action-card">
                        <span className="cp-action-icon" style={{ color: item.color, background: `${item.color}14` }}>
                          <Icon size={18} strokeWidth={1.8} />
                        </span>
                        <span className="cp-action-label">{item.label}</span>
                        <kbd className="cp-action-kbd">{item.kbd}</kbd>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Pages */}
              <section className="cp-section">
                <p className="cp-section-label">
                  <LayoutDashboard size={11} />
                  All Pages
                </p>
                <div className="cp-pages-row">
                  {NAV_PAGES.map((item, i) => {
                    const Icon = item.icon;
                    return (
                      <a key={i} href={item.href} className="cp-page-chip" onClick={onClose}>
                        <Icon size={13} strokeWidth={1.8} style={{ color: item.color }} />
                        {item.label}
                      </a>
                    );
                  })}
                </div>
              </section>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="cp-footer">
          <span className="cp-hint"><kbd>↑</kbd><kbd>↓</kbd> Navigate</span>
          <span className="cp-hint"><kbd>↵</kbd> Open</span>
          <span className="cp-hint"><kbd>Esc</kbd> Close</span>
          <span className="cp-hint-sep" />
          <span className="cp-hint">
            <kbd>Ctrl</kbd><kbd>K</kbd> Toggle
          </span>
        </div>
      </div>
    </>
  );
}
