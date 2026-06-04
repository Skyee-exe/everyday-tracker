"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  GripVertical,
  CheckSquare,
  Bell,
  Briefcase,
  User,
  Heart,
  BookOpen,
  TrendingUp,
  Zap,
  Trash2,
  CalendarDays,
  Clock,
  Check,
  Loader2,
  ListTodo,
  Sparkles,
  PanelRightClose,
  PanelRightOpen,
  AlertCircle,
  Flag,
} from "lucide-react";
import { getTasks, createTask, updateTask, deleteTask } from "./actions";
import type { CalendarTask } from "@/db/schema";

/* ══════════════════════════════════════════════
   CONSTANTS & HELPERS
══════════════════════════════════════════════ */
const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const SLOT_H = 56; // px per hour

const CATEGORIES = [
  { id: "work",     label: "Work",     color: "#2563eb", bg: "rgba(37,99,235,0.12)",   Icon: Briefcase },
  { id: "personal", label: "Personal", color: "#7c3aed", bg: "rgba(124,58,237,0.12)",  Icon: User },
  { id: "health",   label: "Health",   color: "#16a34a", bg: "rgba(22,163,74,0.12)",   Icon: Heart },
  { id: "learning", label: "Learning", color: "#0ea5e9", bg: "rgba(14,165,233,0.12)",  Icon: BookOpen },
  { id: "finance",  label: "Finance",  color: "#d97706", bg: "rgba(217,119,6,0.12)",   Icon: TrendingUp },
  { id: "urgent",   label: "Urgent",   color: "#dc2626", bg: "rgba(220,38,38,0.12)",   Icon: Zap },
] as const;

type CategoryId = typeof CATEGORIES[number]["id"];

const PRIORITIES = [
  { id: "low",      label: "Low",      color: "#94a3b8" },
  { id: "medium",   label: "Medium",   color: "#eab308" },
  { id: "high",     label: "High",     color: "#f97316" },
  { id: "critical", label: "Critical", color: "#ef4444" },
] as const;

type PriorityId = typeof PRIORITIES[number]["id"];

function getCat(cat: string) { return CATEGORIES.find((c) => c.id === cat) ?? CATEGORIES[0]; }
function getPri(pri: string) { return PRIORITIES.find((p) => p.id === pri) ?? PRIORITIES[1]; }

function toDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function todayStr(): string { return toDateStr(new Date()); }

function formatHour(h: number): string {
  if (h === 0) return "12 AM";
  if (h < 12) return `${h} AM`;
  if (h === 12) return "12 PM";
  return `${h - 12} PM`;
}

function formatTime(date: Date | null): string {
  if (!date) return "";
  const h = date.getHours();
  const m = String(date.getMinutes()).padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}

function getMonthDays(year: number, month: number): Date[] {
  const first = new Date(year, month, 1);
  const last  = new Date(year, month + 1, 0);
  const days: Date[] = [];
  for (let i = 0; i < first.getDay(); i++)
    days.push(new Date(year, month, 1 - (first.getDay() - i)));
  for (let d = 1; d <= last.getDate(); d++)
    days.push(new Date(year, month, d));
  const rem = 7 - (days.length % 7);
  if (rem < 7) for (let i = 1; i <= rem; i++) days.push(new Date(year, month + 1, i));
  return days;
}

function getWeekDays(base: Date): Date[] {
  const sun = new Date(base);
  sun.setDate(base.getDate() - base.getDay());
  return Array.from({ length: 7 }, (_, i) => { const d = new Date(sun); d.setDate(sun.getDate() + i); return d; });
}

function parseQuickCapture(input: string): { title: string, startAt: Date | null, category: CategoryId } {
  // Very basic NLP simulation
  const lower = input.toLowerCase();
  let title = input;
  let startAt: Date | null = null;
  let category: CategoryId = "work";

  if (lower.includes("tomorrow")) {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    startAt = d;
    title = title.replace(/tomorrow/i, "").trim();
  } else if (lower.includes("today")) {
    startAt = new Date();
    title = title.replace(/today/i, "").trim();
  }

  if (lower.match(/\b(9|10|11|12|1|2|3|4|5|6|7|8)\s*(am|pm)\b/)) {
    const match = lower.match(/\b(9|10|11|12|1|2|3|4|5|6|7|8)\s*(am|pm)\b/);
    if (match && startAt) {
      let h = parseInt(match[1]);
      if (match[2] === "pm" && h !== 12) h += 12;
      if (match[2] === "am" && h === 12) h = 0;
      startAt.setHours(h, 0, 0, 0);
    }
  }

  if (lower.includes("meeting") || lower.includes("call")) category = "work";
  if (lower.includes("workout") || lower.includes("gym")) category = "health";
  if (lower.includes("pay") || lower.includes("buy")) category = "finance";
  if (lower.includes("study") || lower.includes("read")) category = "learning";

  return { title, startAt, category };
}

/* ══════════════════════════════════════════════
   SLIDE-OVER TASK PANEL
══════════════════════════════════════════════ */
interface SlideOverProps {
  initialDate?: string;
  initialHour?: number;
  initialTask?: CalendarTask;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    title: string; description: string; startAt: Date | null; endAt: Date | null;
    durationMinutes: number; priority: string; category: CategoryId; type: "task" | "reminder";
    isDraft: boolean; reminder: boolean;
  }, taskId?: number) => Promise<void>;
  onDelete?: (taskId: number) => Promise<void>;
}

function SlideOverPanel({ initialDate, initialHour, initialTask, isOpen, onClose, onSave, onDelete }: SlideOverProps) {
  const [title, setTitle]             = useState("");
  const [description, setDescription]   = useState("");
  const [dateStr, setDateStr]         = useState("");
  const [timeStr, setTimeStr]         = useState("");
  const [duration, setDuration]       = useState(60);
  const [priority, setPriority]       = useState<PriorityId>("medium");
  const [category, setCategory]       = useState<CategoryId>("work");
  const [type, setType]               = useState<"task" | "reminder">("task");
  const [reminder, setReminder]       = useState(false);
  const [saving, setSaving]           = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTitle(initialTask?.title ?? "");
      setDescription(initialTask?.description ?? "");
      
      let dStr = initialDate ?? "";
      let tStr = initialHour !== undefined ? `${String(initialHour).padStart(2, "0")}:00` : "";
      
      if (initialTask?.startAt) {
        const d = new Date(initialTask.startAt);
        dStr = toDateStr(d);
        tStr = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
      }
      
      setDateStr(dStr);
      setTimeStr(tStr);
      setDuration(initialTask?.durationMinutes ?? 60);
      setPriority((initialTask?.priority as PriorityId) ?? "medium");
      setCategory((initialTask?.category as CategoryId) ?? "work");
      setType((initialTask?.type as "task" | "reminder") ?? "task");
      setReminder(initialTask?.reminder ?? false);
      setShowAdvanced(!!initialTask?.description || initialTask?.priority !== "medium" || initialTask?.durationMinutes !== 60);
    }
  }, [isOpen, initialTask, initialDate, initialHour]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape" && isOpen) onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    
    let startAt: Date | null = null;
    let endAt: Date | null = null;
    
    if (dateStr) {
      startAt = new Date(`${dateStr}T${timeStr || "00:00"}:00`);
      endAt = new Date(startAt.getTime() + duration * 60000);
    }

    const isDraft = !startAt;

    await onSave({
      title: title.trim(),
      description: description.trim(),
      startAt,
      endAt,
      durationMinutes: duration,
      priority,
      category,
      type,
      isDraft,
      reminder
    }, initialTask?.id);
    
    setSaving(false);
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        onClick={onClose}
        style={{ 
          position: "fixed", inset: 0, background: "rgba(10,16,30,0.3)", 
          backdropFilter: "blur(4px)", zIndex: 300, 
          opacity: isOpen ? 1 : 0, pointerEvents: isOpen ? "auto" : "none",
          transition: "opacity 300ms cubic-bezier(0.4, 0, 0.2, 1)"
        }} 
      />
      
      {/* Panel */}
      <div 
        style={{ 
          position: "fixed", top: 0, right: 0, bottom: 0, width: "100%", maxWidth: 440, 
          background: "#fff", zIndex: 301, display: "flex", flexDirection: "column",
          boxShadow: "-8px 0 32px rgba(0,0,0,0.08)", borderLeft: "1px solid hsl(214 20% 90%)",
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 350ms cubic-bezier(0.16, 1, 0.3, 1)"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", borderBottom: "1px solid hsl(214 20% 92%)" }}>
          <span style={{ fontFamily: "var(--font-display)", fontSize: "1.05rem", fontWeight: 700, color: "hsl(222 22% 12%)" }}>
            {initialTask ? "Edit Task" : "New Task"}
          </span>
          <div style={{ display: "flex", gap: 8 }}>
            {initialTask && onDelete && (
              <button type="button" onClick={() => { onDelete(initialTask.id); onClose(); }} style={{ width: 32, height: 32, borderRadius: 8, border: "none", background: "transparent", color: "hsl(222 10% 60%)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 150ms" }} onMouseEnter={e => { e.currentTarget.style.color = "#dc2626"; e.currentTarget.style.background = "hsl(0 80% 96%)"; }} onMouseLeave={e => { e.currentTarget.style.color = "hsl(222 10% 60%)"; e.currentTarget.style.background = "transparent"; }}>
                <Trash2 size={16} />
              </button>
            )}
            <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, border: "none", background: "hsl(214 24% 94%)", color: "hsl(222 14% 40%)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 150ms" }} onMouseEnter={e => e.currentTarget.style.background = "hsl(214 30% 90%)"} onMouseLeave={e => e.currentTarget.style.background = "hsl(214 24% 94%)"}>
              <PanelRightClose size={16} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ flex: 1, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: 20 }}>
            
            {/* Title */}
            <div>
              <input
                autoFocus required
                value={title} onChange={(e) => setTitle(e.target.value)}
                placeholder="What needs to be done?"
                style={{ width: "100%", padding: 0, border: "none", fontFamily: "var(--font-sans)", fontSize: "1.4rem", fontWeight: 600, color: "hsl(222 22% 12%)", background: "transparent", outline: "none" }}
              />
            </div>

            {/* Type toggle */}
            <div style={{ display: "flex", background: "hsl(214 24% 92%)", borderRadius: 10, padding: 4, gap: 4, width: "fit-content" }}>
              {(["task", "reminder"] as const).map((t) => (
                <button key={t} type="button" onClick={() => setType(t)} style={{ padding: "6px 16px", borderRadius: 6, border: "none", background: type === t ? "#fff" : "transparent", color: type === t ? "hsl(222 22% 14%)" : "hsl(222 12% 50%)", fontFamily: "var(--font-sans)", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", boxShadow: type === t ? "0 1px 4px rgba(0,0,0,0.1)" : "none", display: "flex", alignItems: "center", gap: 6, transition: "all 150ms" }}>
                  {t === "task" ? <CheckSquare size={14} /> : <Bell size={14} />}
                  {t === "task" ? "Task" : "Reminder"}
                </button>
              ))}
            </div>

            {/* Scheduling */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "hsl(222 14% 36%)", display: "block", marginBottom: 6 }}>Date</label>
                <input type="date" value={dateStr} onChange={(e) => setDateStr(e.target.value)}
                  style={{ width: "100%", padding: "10px 14px", border: "1px solid hsl(214 20% 88%)", borderRadius: 10, fontFamily: "var(--font-sans)", fontSize: "0.85rem", color: "hsl(222 22% 12%)", background: "hsl(216 20% 98%)", outline: "none", boxSizing: "border-box", cursor: "pointer" }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "#2563eb"; e.currentTarget.style.background = "#fff"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "hsl(214 20% 88%)"; e.currentTarget.style.background = "hsl(216 20% 98%)"; }}
                />
              </div>
              <div>
                <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "hsl(222 14% 36%)", display: "block", marginBottom: 6 }}>Time</label>
                <input type="time" value={timeStr} onChange={(e) => setTimeStr(e.target.value)} disabled={!dateStr}
                  style={{ width: "100%", padding: "10px 14px", border: "1px solid hsl(214 20% 88%)", borderRadius: 10, fontFamily: "var(--font-sans)", fontSize: "0.85rem", color: "hsl(222 22% 12%)", background: dateStr ? "hsl(216 20% 98%)" : "hsl(214 20% 94%)", outline: "none", boxSizing: "border-box", cursor: dateStr ? "pointer" : "not-allowed", opacity: dateStr ? 1 : 0.6 }}
                  onFocus={(e) => { if (dateStr) { e.currentTarget.style.borderColor = "#2563eb"; e.currentTarget.style.background = "#fff"; } }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "hsl(214 20% 88%)"; e.currentTarget.style.background = "hsl(216 20% 98%)"; }}
                />
              </div>
            </div>

            {/* Category */}
            <div>
              <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "hsl(222 14% 36%)", display: "block", marginBottom: 8 }}>Category</label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                {CATEGORIES.map((cat) => {
                  const CatIcon = cat.Icon;
                  const sel = category === cat.id;
                  return (
                    <button key={cat.id} type="button" onClick={() => setCategory(cat.id as CategoryId)}
                      style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 10, border: sel ? `2px solid ${cat.color}` : "2px solid transparent", background: sel ? cat.bg : "hsl(214 24% 96%)", cursor: "pointer", fontFamily: "var(--font-sans)", fontSize: "0.8rem", fontWeight: 600, color: sel ? cat.color : "hsl(222 14% 36%)", transition: "all 150ms" }}
                      onMouseEnter={e => { if (!sel) e.currentTarget.style.background = "hsl(214 24% 92%)"; }}
                      onMouseLeave={e => { if (!sel) e.currentTarget.style.background = "hsl(214 24% 96%)"; }}
                    >
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: cat.color, flexShrink: 0, display: "inline-block" }} />
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Advanced Toggle */}
            <button type="button" onClick={() => setShowAdvanced(!showAdvanced)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 0", border: "none", background: "transparent", color: "#2563eb", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", width: "fit-content" }}>
              {showAdvanced ? "Hide advanced options" : "Show advanced options"}
            </button>

            {/* Advanced Section */}
            {showAdvanced && (
              <div style={{ display: "flex", flexDirection: "column", gap: 20, paddingTop: 8, borderTop: "1px dashed hsl(214 20% 90%)", animation: "cal-fade-in 200ms ease-out" }}>
                
                {/* Priority */}
                <div>
                  <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "hsl(222 14% 36%)", display: "block", marginBottom: 8 }}>Priority</label>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {PRIORITIES.map((pri) => {
                      const sel = priority === pri.id;
                      return (
                        <button key={pri.id} type="button" onClick={() => setPriority(pri.id as PriorityId)}
                          style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 8, border: sel ? `2px solid ${pri.color}` : "2px solid hsl(214 20% 92%)", background: sel ? `${pri.color}15` : "transparent", cursor: "pointer", fontFamily: "var(--font-sans)", fontSize: "0.75rem", fontWeight: 600, color: sel ? pri.color : "hsl(222 14% 36%)", transition: "all 150ms" }}
                        >
                          <Flag size={12} strokeWidth={sel ? 3 : 2} />
                          {pri.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Duration */}
                <div>
                  <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "hsl(222 14% 36%)", display: "block", marginBottom: 8 }}>Duration (minutes)</label>
                  <div style={{ display: "flex", gap: 8 }}>
                    {[15, 30, 60, 120].map(dur => (
                      <button key={dur} type="button" onClick={() => setDuration(dur)}
                        style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid hsl(214 20% 88%)", background: duration === dur ? "#2563eb" : "#fff", color: duration === dur ? "#fff" : "hsl(222 14% 36%)", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer" }}
                      >
                        {dur}m
                      </button>
                    ))}
                    <input type="number" value={duration} onChange={(e) => setDuration(parseInt(e.target.value) || 60)} style={{ width: 80, padding: "6px 12px", borderRadius: 8, border: "1px solid hsl(214 20% 88%)", fontSize: "0.75rem", fontWeight: 600, color: "hsl(222 22% 12%)", outline: "none" }} />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "hsl(222 14% 36%)", display: "block", marginBottom: 6 }}>Description</label>
                  <textarea
                    rows={3}
                    value={description} onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add notes, links, or context..."
                    style={{ width: "100%", padding: "10px 14px", border: "1px solid hsl(214 20% 88%)", borderRadius: 10, fontFamily: "var(--font-sans)", fontSize: "0.85rem", color: "hsl(222 22% 12%)", background: "hsl(216 20% 98%)", outline: "none", resize: "vertical", minHeight: 80, lineHeight: 1.5, boxSizing: "border-box" }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = "#2563eb"; e.currentTarget.style.background = "#fff"; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = "hsl(214 20% 88%)"; e.currentTarget.style.background = "hsl(216 20% 98%)"; }}
                  />
                </div>

              </div>
            )}
            
          </div>

          {/* Footer */}
          <div style={{ padding: "16px 24px", borderTop: "1px solid hsl(214 20% 92%)", display: "flex", alignItems: "center", justifyContent: "space-between", background: "hsl(214 30% 98%)" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
              <input type="checkbox" checked={reminder} onChange={(e) => setReminder(e.target.checked)} style={{ width: 16, height: 16, cursor: "pointer" }} />
              <span style={{ fontSize: "0.8rem", fontWeight: 500, color: "hsl(222 14% 36%)" }}>Set reminder</span>
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              <button type="button" onClick={onClose}
                style={{ padding: "10px 16px", borderRadius: 10, border: "1px solid hsl(214 20% 88%)", background: "#fff", color: "hsl(222 14% 40%)", fontFamily: "var(--font-sans)", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer" }}>
                Cancel
              </button>
              <button type="submit" disabled={!title.trim() || saving}
                style={{ padding: "10px 20px", borderRadius: 10, border: "none", background: title.trim() ? "#2563eb" : "hsl(214 20% 88%)", color: "#fff", fontFamily: "var(--font-sans)", fontSize: "0.85rem", fontWeight: 600, cursor: title.trim() ? "pointer" : "not-allowed", boxShadow: title.trim() ? "0 4px 12px rgba(37,99,235,0.25)" : "none", display: "flex", alignItems: "center", gap: 8, transition: "all 150ms" }}>
                {saving ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <Check size={16} strokeWidth={2.5} />}
                {initialTask ? "Save Changes" : !dateStr ? "Save Draft" : "Schedule"}
              </button>
            </div>
          </div>
        </form>
      </div>
      <style>{`@keyframes cal-fade-in { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </>
  );
}

/* ══════════════════════════════════════════════
   TASK CHIP — month view
══════════════════════════════════════════════ */
function TaskChip({ task, onDragStart, onClick }: { task: CalendarTask; onDragStart: (e: React.DragEvent, id: number) => void; onClick?: () => void }) {
  const cat = getCat(task.category);
  const pri = getPri(task.priority);
  
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, task.id)}
      onClick={(e) => { e.stopPropagation(); onClick?.(); }}
      title={`${task.title} (${pri.label} Priority)`}
      style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 8px", borderRadius: 6, background: "hsl(214 30% 98%)", border: `1px solid ${task.completed ? "hsl(214 20% 90%)" : "hsl(214 20% 90%)"}`, color: "hsl(222 22% 14%)", fontSize: "0.7rem", fontWeight: 600, cursor: "grab", userSelect: "none", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", opacity: task.completed ? 0.5 : 1, textDecoration: task.completed ? "line-through" : "none", transition: "all 150ms" }}
      onMouseEnter={(e) => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = "hsl(214 20% 80%)"; e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.05)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "hsl(214 30% 98%)"; e.currentTarget.style.borderColor = "hsl(214 20% 90%)"; e.currentTarget.style.boxShadow = "none"; }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
        {task.priority === "critical" && <AlertCircle size={10} color={pri.color} strokeWidth={3} />}
        {task.priority === "high" && <Flag size={10} color={pri.color} strokeWidth={3} />}
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: cat.color, display: "inline-block" }} />
      </div>
      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{task.title}</span>
      {task.startAt && <span style={{ color: "hsl(222 10% 50%)", fontSize: "0.6rem", fontWeight: 500 }}>{formatTime(new Date(task.startAt))}</span>}
    </div>
  );
}

/* ══════════════════════════════════════════════
   MONTH GRID (High Density)
══════════════════════════════════════════════ */
function MonthGrid({ year, month, tasks, onCellClick, onDragStart, onDrop, onTaskClick }:
  { year: number; month: number; tasks: CalendarTask[]; onCellClick: (ds: string) => void; onDragStart: (e: React.DragEvent, id: number) => void; onDrop: (ds: string) => void; onTaskClick: (task: CalendarTask) => void }) {
  const [dropTarget, setDropTarget] = useState<string|null>(null);
  const days  = getMonthDays(year, month);
  const today = todayStr();

  return (
    <div style={{ padding: "16px 24px 32px" }}>
      {/* DOW header */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 8, marginBottom: 8 }}>
        {DAYS_OF_WEEK.map((d) => (
          <div key={d} style={{ textAlign: "center", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: "hsl(222 14% 40%)", padding: "4px 0" }}>{d}</div>
        ))}
      </div>
      {/* Day grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 8 }}>
        {days.map((day, idx) => {
          const ds = toDateStr(day);
          const isToday        = ds === today;
          const isCurrMonth    = day.getMonth() === month;
          const isDropTarget   = dropTarget === ds;
          
          const dayTasks       = tasks.filter((t) => t.startAt && toDateStr(new Date(t.startAt)) === ds);
          const shown          = dayTasks.slice(0, 4);
          const overflow       = dayTasks.length - shown.length;
          
          const hasOverdue     = dayTasks.some(t => t.priority === "critical" && !t.completed);
          const allCompleted   = dayTasks.length > 0 && dayTasks.every(t => t.completed);

          // Heatmap density bar (0-5 scale)
          const density = Math.min(dayTasks.length, 5);
          const opacity = density > 0 ? 0.15 + (density * 0.1) : 0;

          return (
            <div key={idx}
              onClick={() => onCellClick(ds)}
              onDragOver={(e) => { e.preventDefault(); setDropTarget(ds); }}
              onDragLeave={() => setDropTarget(null)}
              onDrop={(e) => { e.preventDefault(); setDropTarget(null); onDrop(ds); }}
              style={{
                minHeight: 120,
                border: isDropTarget ? "2px solid #2563eb" : isToday ? "2px solid #2563eb" : "1px solid hsl(214 20% 88%)",
                borderLeft: hasOverdue && !isDropTarget && !isToday ? "3px solid #ef4444" : undefined,
                borderRadius: 12, padding: "8px", cursor: "pointer",
                display: "flex", flexDirection: "column", gap: 4, position: "relative",
                opacity: isCurrMonth ? 1 : 0.4,
                background: isDropTarget ? "hsl(221 90% 97%)" : isToday ? "hsl(221 90% 99%)" : allCompleted ? "hsl(142 60% 99%)" : "#fff",
                boxShadow: isDropTarget ? "0 0 0 4px rgba(37,99,235,0.15)" : "0 1px 2px rgba(0,0,0,0.02)",
                transition: "all 150ms",
                overflow: "hidden"
              }}
              onMouseEnter={e => { if(!isDropTarget && !isToday) e.currentTarget.style.borderColor = "hsl(214 20% 80%)"; }}
              onMouseLeave={e => { if(!isDropTarget && !isToday) e.currentTarget.style.borderColor = "hsl(214 20% 88%)"; }}
            >
              {/* Density Bar */}
              {density > 0 && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: "#2563eb", opacity, pointerEvents: "none" }} />}

              {/* Day number */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2, padding: "0 2px" }}>
                <span style={{
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  width: 24, height: 24, borderRadius: "50%", fontSize: "0.8rem", fontWeight: 700,
                  color: isToday ? "#fff" : "hsl(222 22% 22%)",
                  background: isToday ? "#2563eb" : "transparent",
                  boxShadow: isToday ? "0 2px 6px rgba(37,99,235,0.3)" : "none",
                }}>{day.getDate()}</span>
                {hasOverdue && <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: "#ef4444" }} />}
              </div>
              
              {/* Chips */}
              <div style={{ display: "flex", flexDirection: "column", gap: 3, flex: 1 }}>
                {shown.map((t) => <TaskChip key={t.id} task={t} onDragStart={onDragStart} onClick={() => onTaskClick(t)} />)}
                {overflow > 0 && <div style={{ fontSize: "0.65rem", color: "hsl(222 14% 40%)", fontWeight: 600, padding: "2px 6px", background: "hsl(214 24% 96%)", borderRadius: 4, width: "fit-content" }}>+{overflow} more</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   WEEK GRID (Duration Aware)
══════════════════════════════════════════════ */
function WeekGrid({ baseDate, tasks, onSlotClick, onDragStart, onDropOnSlot, onTaskClick }:
  { baseDate: Date; tasks: CalendarTask[]; onSlotClick: (ds: string, h: number) => void; onDragStart: (e: React.DragEvent, id: number) => void; onDropOnSlot: (ds: string, h: number) => void; onTaskClick: (task: CalendarTask) => void }) {
  const weekDays = getWeekDays(baseDate);
  const today    = todayStr();
  const [dropTarget, setDropTarget] = useState<string|null>(null);
  const [nowPct, setNowPct]         = useState(0);

  useEffect(() => {
    const update = () => { const now = new Date(); setNowPct((now.getHours() * 60 + now.getMinutes()) / (24 * 60)); };
    update();
    const iv = setInterval(update, 60000);
    return () => clearInterval(iv);
  }, []);

  const tasksForDay = (ds: string) => tasks.filter((t) => t.startAt && toDateStr(new Date(t.startAt)) === ds);

  return (
    <div style={{ flex: 1, overflowY: "auto", overflowX: "auto" }}>
      <div style={{ minWidth: 800, fontFamily: "var(--font-sans)", position: "relative" }}>

        {/* Week header row */}
        <div style={{ display: "grid", gridTemplateColumns: "60px repeat(7,1fr)", borderBottom: "1px solid hsl(214 20% 90%)", background: "rgba(255,255,255,0.95)", backdropFilter: "blur(8px)", position: "sticky", top: 0, zIndex: 10 }}>
          <div style={{ borderRight: "1px solid hsl(214 20% 90%)", padding: "8px" }} />
          {weekDays.map((day, i) => {
            const ds = toDateStr(day);
            const isToday = ds === today;
            return (
              <div key={i} onClick={() => onSlotClick(ds, 9)}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "12px 8px", borderLeft: i === 0 ? "none" : "1px solid hsl(214 20% 94%)", cursor: "pointer", background: isToday ? "hsl(221 90% 99%)" : "transparent" }}>
                <span style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: isToday ? "#2563eb" : "hsl(222 14% 40%)" }}>{DAYS_OF_WEEK[day.getDay()]}</span>
                <span style={{ width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem", fontWeight: 700, color: isToday ? "#fff" : "hsl(222 22% 14%)", background: isToday ? "#2563eb" : "transparent", marginTop: 4, boxShadow: isToday ? "0 2px 8px rgba(37,99,235,0.3)" : "none" }}>{day.getDate()}</span>
              </div>
            );
          })}
        </div>

        {/* Body — time + columns */}
        <div style={{ display: "grid", gridTemplateColumns: "60px repeat(7,1fr)", background: "#fff" }}>
          
          {/* Time labels (Sticky left) */}
          <div style={{ display: "flex", flexDirection: "column", borderRight: "1px solid hsl(214 20% 90%)", background: "#fff", position: "sticky", left: 0, zIndex: 5 }}>
            {HOURS.map((h) => (
              <div key={h} style={{ height: SLOT_H, display: "flex", alignItems: "flex-start", justifyContent: "flex-end", padding: "8px 12px 0 0", fontSize: "0.65rem", fontWeight: 600, color: "hsl(222 14% 50%)" }}>
                {formatHour(h)}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {weekDays.map((day, dayIdx) => {
            const ds = toDateStr(day);
            const isToday = ds === today;
            const dayTasks = tasksForDay(ds);
            
            return (
              <div key={dayIdx} style={{ borderLeft: dayIdx === 0 ? "none" : "1px solid hsl(214 20% 94%)", display: "flex", flexDirection: "column", position: "relative", background: isToday ? "hsl(221 90% 99.5%)" : "#fff" }}>
                
                {/* Now line */}
                {isToday && (
                  <div style={{ position: "absolute", left: 0, right: 0, top: `${nowPct * SLOT_H * 24}px`, height: 2, background: "#ef4444", zIndex: 5, pointerEvents: "none" }}>
                    <span style={{ position: "absolute", left: -5, top: "50%", transform: "translateY(-50%)", width: 10, height: 10, borderRadius: "50%", background: "#ef4444", display: "block", boxShadow: "0 0 0 3px rgba(239,68,68,0.2)" }} />
                  </div>
                )}
                
                {/* Background slots for clicking/dropping */}
                {HOURS.map((h) => {
                  const slotKey = `${ds}-${h}`;
                  const isDrop  = dropTarget === slotKey;
                  return (
                    <div key={h}
                      style={{ height: SLOT_H, borderBottom: "1px solid hsl(214 14% 96%)", background: isDrop ? "hsl(221 90% 96%)" : "transparent", cursor: "pointer" }}
                      onClick={() => onSlotClick(ds, h)}
                      onDragOver={(e) => { e.preventDefault(); setDropTarget(slotKey); }}
                      onDragLeave={() => setDropTarget(null)}
                      onDrop={(e) => { e.preventDefault(); setDropTarget(null); onDropOnSlot(ds, h); }}
                    />
                  );
                })}

                {/* Absolute positioned task blocks (Duration Aware) */}
                {dayTasks.map((t) => {
                  if (!t.startAt) return null;
                  const startDate = new Date(t.startAt);
                  const startHours = startDate.getHours() + (startDate.getMinutes() / 60);
                  const top = startHours * SLOT_H;
                  const height = Math.max((t.durationMinutes / 60) * SLOT_H, 24); // min 24px
                  const cat = getCat(t.category);
                  const pri = getPri(t.priority);
                  
                  // Simple overlap logic: check how many overlap and adjust width/left. 
                  // For a true implementation, you'd calculate a complex layout matrix.
                  // For now, keeping them full width but layered visually.
                  
                  return (
                    <div key={t.id} draggable
                      onDragStart={(e) => { e.stopPropagation(); onDragStart(e, t.id); }}
                      onClick={(e) => { e.stopPropagation(); onTaskClick(t); }}
                      title={`${t.title} (${pri.label} Priority, ${t.durationMinutes}m)`}
                      style={{ 
                        position: "absolute", left: 4, right: 8, top, height: `calc(${height}px - 2px)`, 
                        borderRadius: 8, padding: "6px 10px", background: cat.bg, borderLeft: `3px solid ${cat.color}`,
                        color: "hsl(222 22% 14%)", cursor: "grab", zIndex: 2, 
                        boxShadow: "0 2px 8px rgba(0,0,0,0.04)", overflow: "hidden",
                        opacity: t.completed ? 0.5 : 1, transition: "all 150ms",
                        border: `1px solid ${cat.color}30`, borderLeftWidth: 3
                      }}
                      onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)"}
                      onMouseLeave={e => e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)"}
                    >
                      <div style={{ fontSize: "0.7rem", fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", textDecoration: t.completed ? "line-through" : "none" }}>{t.title}</div>
                      {height >= 40 && (
                        <div style={{ fontSize: "0.65rem", fontWeight: 500, color: "hsl(222 14% 40%)", marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
                          {formatTime(startDate)} 
                          {t.priority === "critical" && <span style={{ color: pri.color, fontWeight: 700 }}>• Urgent</span>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   COMMAND SIDEBAR (Replaces Draft Panel)
══════════════════════════════════════════════ */
function CommandSidebar({ tasks, onQuickCapture, onDragStart, onTaskClick, onDropToDraft }:
  { tasks: CalendarTask[]; onQuickCapture: (input: string) => void; onDragStart: (e: React.DragEvent, id: number) => void; onTaskClick: (t: CalendarTask) => void; onDropToDraft: () => void }) {
  
  const [captureText, setCaptureText] = useState("");
  const [dropActive, setDropActive] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  // Derived data
  const todayStrDate = todayStr();
  const drafts = tasks.filter(t => t.isDraft || !t.startAt);
  const todayTasks = tasks.filter(t => t.startAt && toDateStr(new Date(t.startAt)) === todayStrDate && !t.completed).sort((a, b) => new Date(a.startAt!).getTime() - new Date(b.startAt!).getTime());
  const overdueTasks = tasks.filter(t => t.startAt && toDateStr(new Date(t.startAt)) < todayStrDate && !t.completed);

  if (collapsed) {
    return (
      <div style={{ width: 64, minWidth: 64, background: "#fff", borderLeft: "1px solid hsl(214 20% 90%)", display: "flex", flexDirection: "column", alignItems: "center", padding: "16px 0", position: "relative", zIndex: 20 }}>
        <button onClick={() => setCollapsed(false)} style={{ width: 40, height: 40, borderRadius: 10, border: "none", background: "hsl(214 24% 96%)", color: "hsl(222 14% 40%)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }} title="Expand Sidebar">
          <PanelRightOpen size={18} />
        </button>
        
        <div style={{ marginTop: 32, display: "flex", flexDirection: "column", gap: 24, alignItems: "center" }}>
          <div title={`Today's Agenda: ${todayTasks.length}`} style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", width: 40, height: 40, borderRadius: 10, background: "hsl(221 90% 97%)", color: "#2563eb" }}>
            <ListTodo size={18} />
            {todayTasks.length > 0 && <span style={{ position: "absolute", top: -4, right: -4, background: "#2563eb", color: "#fff", fontSize: "0.6rem", fontWeight: 700, width: 18, height: 18, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>{todayTasks.length}</span>}
          </div>
          
          <div title={`Drafts: ${drafts.length}`} style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", width: 40, height: 40, borderRadius: 10, background: "hsl(214 24% 96%)", color: "hsl(222 14% 40%)" }}>
            <CalendarDays size={18} />
            {drafts.length > 0 && <span style={{ position: "absolute", top: -4, right: -4, background: "hsl(222 14% 40%)", color: "#fff", fontSize: "0.6rem", fontWeight: 700, width: 18, height: 18, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>{drafts.length}</span>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: 340, minWidth: 340, background: "#fff", borderLeft: "1px solid hsl(214 20% 90%)", display: "flex", flexDirection: "column", position: "relative", zIndex: 20 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid hsl(214 20% 92%)" }}>
        <span style={{ fontFamily: "var(--font-display)", fontSize: "1rem", fontWeight: 700, color: "hsl(222 22% 12%)" }}>Command Center</span>
        <button onClick={() => setCollapsed(true)} style={{ width: 28, height: 28, borderRadius: 8, border: "none", background: "transparent", color: "hsl(222 14% 50%)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }} onMouseEnter={e => e.currentTarget.style.background = "hsl(214 24% 94%)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
          <PanelRightClose size={16} />
        </button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: 32 }}>
        
        {/* Quick Capture */}
        <div>
          <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "hsl(222 14% 40%)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>Quick Capture</div>
          <form onSubmit={(e) => { e.preventDefault(); if (captureText.trim()) { onQuickCapture(captureText); setCaptureText(""); } }}>
            <input 
              value={captureText} onChange={e => setCaptureText(e.target.value)}
              placeholder="e.g., Team meeting tomorrow 4pm" 
              style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid hsl(214 20% 88%)", background: "hsl(216 20% 98%)", fontSize: "0.85rem", color: "hsl(222 22% 14%)", outline: "none" }}
              onFocus={e => { e.currentTarget.style.borderColor = "#2563eb"; e.currentTarget.style.background = "#fff"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.1)"; }}
              onBlur={e => { e.currentTarget.style.borderColor = "hsl(214 20% 88%)"; e.currentTarget.style.background = "hsl(216 20% 98%)"; e.currentTarget.style.boxShadow = "none"; }}
            />
          </form>
        </div>

        {/* AI Suggestions (Rule based) */}
        {(overdueTasks.length > 0 || todayTasks.length > 5) && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.75rem", fontWeight: 700, color: "#7c3aed", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>
              <Sparkles size={14} /> AI Insights
            </div>
            <div style={{ padding: "12px 16px", borderRadius: 10, background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)", display: "flex", flexDirection: "column", gap: 8 }}>
              {overdueTasks.length > 0 && <span style={{ fontSize: "0.8rem", color: "hsl(222 22% 22%)", fontWeight: 500 }}>You have {overdueTasks.length} overdue task{overdueTasks.length > 1 ? "s" : ""}. Consider rescheduling them.</span>}
              {todayTasks.length > 5 && <span style={{ fontSize: "0.8rem", color: "hsl(222 22% 22%)", fontWeight: 500 }}>Your agenda is heavy today ({todayTasks.length} tasks). Want to move some to tomorrow?</span>}
            </div>
          </div>
        )}

        {/* Today's Agenda */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "hsl(222 14% 40%)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Today's Agenda</div>
            <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "#2563eb", background: "hsl(221 90% 96%)", padding: "2px 8px", borderRadius: 10 }}>{todayTasks.length} pending</span>
          </div>
          {todayTasks.length === 0 ? (
            <div style={{ padding: "16px", borderRadius: 10, border: "1px dashed hsl(214 20% 86%)", textAlign: "center", fontSize: "0.8rem", color: "hsl(222 14% 50%)" }}>No tasks scheduled for today.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {todayTasks.slice(0, 5).map(t => {
                const cat = getCat(t.category);
                return (
                  <div key={t.id} onClick={() => onTaskClick(t)} style={{ padding: "10px 12px", borderRadius: 8, background: "#fff", border: "1px solid hsl(214 20% 90%)", display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", transition: "all 150ms", boxShadow: "0 1px 2px rgba(0,0,0,0.02)" }} onMouseEnter={e => e.currentTarget.style.borderColor = "hsl(214 20% 80%)"}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: cat.color, marginTop: 4, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "hsl(222 22% 14%)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.title}</div>
                      <div style={{ fontSize: "0.7rem", color: "hsl(222 14% 50%)", marginTop: 2 }}>{formatTime(new Date(t.startAt!))} • {t.durationMinutes}m</div>
                    </div>
                  </div>
                )
              })}
              {todayTasks.length > 5 && <div style={{ fontSize: "0.75rem", color: "#2563eb", fontWeight: 600, textAlign: "center", padding: "8px", cursor: "pointer" }}>+ {todayTasks.length - 5} more</div>}
            </div>
          )}
        </div>

        {/* Drafts Dropzone */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "hsl(222 14% 40%)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Unscheduled Drafts</div>
            <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "hsl(222 14% 50%)", background: "hsl(214 24% 94%)", padding: "2px 8px", borderRadius: 10 }}>{drafts.length} total</span>
          </div>
          
          <div
            onDragOver={(e) => { e.preventDefault(); setDropActive(true); }}
            onDragLeave={() => setDropActive(false)}
            onDrop={(e) => { e.preventDefault(); setDropActive(false); onDropToDraft(); }}
            style={{ minHeight: 100, borderRadius: 10, border: dropActive ? "2px dashed #2563eb" : "2px dashed hsl(214 20% 86%)", background: dropActive ? "hsl(221 90% 98%)" : "transparent", padding: 8, transition: "all 200ms", display: "flex", flexDirection: "column", gap: 8 }}
          >
            {drafts.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "20px 10px", gap: 8 }}>
                <CalendarDays size={20} color="hsl(222 14% 60%)" />
                <span style={{ fontSize: "0.75rem", color: "hsl(222 14% 60%)" }}>Drag tasks here to unschedule</span>
              </div>
            ) : (
              drafts.map((t) => {
                const cat = getCat(t.category);
                return (
                  <div key={t.id} draggable onDragStart={(e) => onDragStart(e, t.id)} onClick={() => onTaskClick(t)}
                    style={{ background: "#fff", border: "1px solid hsl(214 20% 90%)", borderRadius: 8, padding: "10px", cursor: "grab", display: "flex", alignItems: "flex-start", gap: 8, position: "relative", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
                  >
                    <span style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, background: cat.color }} />
                    <GripVertical size={14} style={{ color: "hsl(222 14% 60%)", flexShrink: 0, marginTop: 1, marginLeft: 2 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "hsl(222 22% 14%)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.title}</div>
                      <div style={{ fontSize: "0.7rem", color: "hsl(222 14% 50%)", marginTop: 2 }}>{cat.label} • {t.durationMinutes}m</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════ */
export default function CalendarPage() {
  const today = new Date();
  const [view, setView]               = useState<"month"|"week">("week"); // Default to week for productivity focus
  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), today.getDate()));
  const [tasks, setTasks]             = useState<CalendarTask[]>([]);
  const [loading, setLoading]         = useState(true);
  
  const [panelOpen, setPanelOpen]     = useState(false);
  const [panelDate, setPanelDate]     = useState<string|undefined>(undefined);
  const [panelHour, setPanelHour]     = useState<number|undefined>(undefined);
  const [editTask, setEditTask]       = useState<CalendarTask|undefined>(undefined);
  
  const [dragTaskId, setDragTaskId]   = useState<number|null>(null);

  const year  = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthLabel = currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const loadTasks = useCallback(async () => {
    try { const d = await getTasks(); setTasks(d); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  const prevPeriod = () => {
    if (view === "month") setCurrentDate(new Date(year, month - 1, 1));
    else { const d = new Date(currentDate); d.setDate(d.getDate() - 7); setCurrentDate(d); }
  };
  const nextPeriod = () => {
    if (view === "month") setCurrentDate(new Date(year, month + 1, 1));
    else { const d = new Date(currentDate); d.setDate(d.getDate() + 7); setCurrentDate(d); }
  };
  const goToday = () => setCurrentDate(new Date(today.getFullYear(), today.getMonth(), today.getDate()));

  const openPanel = (ds?: string, h?: number, task?: CalendarTask) => { 
    setPanelDate(ds); 
    setPanelHour(h); 
    setEditTask(task); 
    setPanelOpen(true); 
  };

  const handleSaveTask = async (data: Parameters<SlideOverProps["onSave"]>[0], taskId?: number) => {
    if (taskId) {
      await updateTask(taskId, data);
    } else {
      await createTask(data as any); // Type cast due to strict schema inference limits in client
    }
    await loadTasks();
    setPanelOpen(false);
  };
  
  const handleDeleteTask = async (id: number) => {
    await deleteTask(id); 
    await loadTasks();
  };

  const handleQuickCapture = async (input: string) => {
    const { title, startAt, category } = parseQuickCapture(input);
    let endAt = startAt ? new Date(startAt.getTime() + 60 * 60000) : null;
    await createTask({
      title,
      description: "",
      startAt,
      endAt,
      durationMinutes: 60,
      priority: "medium",
      category,
      type: "task",
      isDraft: !startAt,
      reminder: false
    });
    await loadTasks();
  };

  const handleDragStart = (e: React.DragEvent, id: number) => {
    setDragTaskId(id);
    e.dataTransfer.setData("text/plain", String(id));
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDropOnDate = async (ds: string) => {
    if (dragTaskId == null) return;
    const task = tasks.find(t => t.id === dragTaskId);
    if (!task) return;
    
    // Default to 9am if dragging draft to month view
    const newStart = new Date(`${ds}T09:00:00`);
    const newEnd = new Date(newStart.getTime() + task.durationMinutes * 60000);
    
    await updateTask(dragTaskId, { startAt: newStart, endAt: newEnd, isDraft: false });
    await loadTasks();
    setDragTaskId(null);
  };

  const handleDropOnSlot = async (ds: string, h: number) => {
    if (dragTaskId == null) return;
    const task = tasks.find(t => t.id === dragTaskId);
    if (!task) return;
    
    const newStart = new Date(`${ds}T${String(h).padStart(2,"0")}:00:00`);
    const newEnd = new Date(newStart.getTime() + task.durationMinutes * 60000);
    
    await updateTask(dragTaskId, { startAt: newStart, endAt: newEnd, isDraft: false });
    await loadTasks();
    setDragTaskId(null);
  };

  const handleDropToDraft = async () => {
    if (dragTaskId == null) return;
    await updateTask(dragTaskId, { startAt: null, endAt: null, isDraft: true });
    await loadTasks();
    setDragTaskId(null);
  };

  // Week label
  const weekDays  = getWeekDays(view === "week" ? currentDate : today);
  const wStart    = weekDays[0];
  const wEnd      = weekDays[6];
  const weekLabel = wStart.getMonth() === wEnd.getMonth()
    ? `${wStart.toLocaleDateString("en-US", { month: "long" })} ${wStart.getDate()}–${wEnd.getDate()}, ${wStart.getFullYear()}`
    : `${wStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${wEnd.toLocaleDateString("en-US", { month: "short", day: "numeric" })}, ${wEnd.getFullYear()}`;

  return (
    <>
      <div style={{ position: "fixed", inset: 0, paddingLeft: "var(--sb-width, 220px)", display: "flex", background: "hsl(216 20% 98%)", fontFamily: "var(--font-sans)", zIndex: 1, transition: "padding-left var(--dur, 200ms) var(--ease-std)" }}>

        {/* ── Left: Calendar Workspace ── */}
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", overflow: "hidden", background: "#fff", margin: 16, borderRadius: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.03)", border: "1px solid hsl(214 20% 92%)" }}>

          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", borderBottom: "1px solid hsl(214 20% 92%)", background: "rgba(255,255,255,0.8)", backdropFilter: "blur(12px)", zIndex: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <button onClick={prevPeriod} style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid hsl(214 20% 90%)", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 150ms" }} onMouseEnter={e => e.currentTarget.style.background = "hsl(214 30% 96%)"} onMouseLeave={e => e.currentTarget.style.background = "#fff"}><ChevronLeft size={16} /></button>
                <button onClick={nextPeriod} style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid hsl(214 20% 90%)", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 150ms" }} onMouseEnter={e => e.currentTarget.style.background = "hsl(214 30% 96%)"} onMouseLeave={e => e.currentTarget.style.background = "#fff"}><ChevronRight size={16} /></button>
              </div>
              <span style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", fontWeight: 700, color: "hsl(222 30% 12%)", letterSpacing: "-0.02em", minWidth: 180 }}>
                {view === "month" ? monthLabel : weekLabel}
              </span>
              <button onClick={goToday} style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid hsl(214 20% 90%)", background: "#fff", color: "hsl(222 14% 30%)", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", transition: "all 150ms" }} onMouseEnter={e => e.currentTarget.style.background = "hsl(214 30% 96%)"} onMouseLeave={e => e.currentTarget.style.background = "#fff"}>Today</button>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              {/* View Toggle */}
              <div style={{ display: "flex", background: "hsl(214 24% 94%)", borderRadius: 10, padding: 4, gap: 2 }}>
                {(["month", "week"] as const).map((v) => (
                  <button key={v} onClick={() => { setView(v); if (v === "week") setCurrentDate(new Date(today.getFullYear(), today.getMonth(), today.getDate())); }}
                    style={{ padding: "6px 16px", borderRadius: 8, border: "none", background: view === v ? "#fff" : "transparent", color: view === v ? "hsl(222 22% 14%)" : "hsl(222 14% 50%)", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", boxShadow: view === v ? "0 2px 8px rgba(0,0,0,0.06)" : "none", textTransform: "capitalize", transition: "all 150ms" }}>
                    {v}
                  </button>
                ))}
              </div>
              {/* Add Button */}
              <button onClick={() => openPanel()}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 18px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #2563eb, #1d4ed8)", color: "#fff", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", boxShadow: "0 4px 12px rgba(37,99,235,0.25)", transition: "all 150ms" }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 6px 16px rgba(37,99,235,0.35)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(37,99,235,0.25)"; }}>
                <Plus size={16} strokeWidth={2.5} /> Add Task
              </button>
            </div>
          </div>

          {/* Body */}
          {loading ? (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 12, color: "hsl(222 14% 50%)" }}>
              <Loader2 size={24} style={{ color: "#2563eb", animation: "spin 1s linear infinite" }} />
              <span style={{ fontSize: "0.9rem", fontWeight: 600 }}>Loading workspace...</span>
            </div>
          ) : view === "month" ? (
            <div style={{ flex: 1, overflowY: "auto" }}>
              <MonthGrid year={year} month={month} tasks={tasks} onCellClick={(ds) => openPanel(ds)} onDragStart={handleDragStart} onDrop={handleDropOnDate} onTaskClick={(t) => openPanel(undefined, undefined, t)} />
            </div>
          ) : (
            <WeekGrid baseDate={currentDate} tasks={tasks} onSlotClick={(ds, h) => openPanel(ds, h)} onDragStart={handleDragStart} onDropOnSlot={handleDropOnSlot} onTaskClick={(t) => openPanel(undefined, undefined, t)} />
          )}
        </div>

        {/* ── Right: Command Sidebar ── */}
        <CommandSidebar 
          tasks={tasks}
          onQuickCapture={handleQuickCapture}
          onDragStart={handleDragStart}
          onTaskClick={(t) => openPanel(undefined, undefined, t)}
          onDropToDraft={handleDropToDraft}
        />
      </div>

      {/* Slide-Over Task Editor */}
      <SlideOverPanel
        isOpen={panelOpen}
        initialDate={panelDate}
        initialHour={panelHour}
        initialTask={editTask}
        onClose={() => setPanelOpen(false)}
        onSave={handleSaveTask}
        onDelete={handleDeleteTask}
      />

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
