"use client";

import React, { useState } from "react";
import {
  Flame,
  Clock,
  CheckCircle2,
  Circle,
  Sparkles,
  CalendarDays,
  ArrowRight,
  Plus,
  Zap,
  AlertTriangle,
  FileText,
  MessageSquare,
  GitPullRequest,
  Coffee,
  Users,
  Video,
  MoreHorizontal,
  ChevronRight,
} from "lucide-react";

/* ─────── Data ─────── */
const FOCUS_ITEM = {
  title: "Sprint Review",
  subtitle: "Team meeting · Engineering",
  urgency: "In 2 hours",
  color: "#7c5cfc",
  type: "Meeting",
};

const UP_NEXT = [
  { label: "Deploy Frontend v2.1", time: "4h", urgency: "today", color: "#f43f5e" },
  { label: "Q2 Report Draft", time: "Tomorrow", urgency: "soon", color: "#f59e0b" },
  { label: "Review Aditi's PR #52", time: "Wed", urgency: "upcoming", color: "#6366f1" },
];

const IN_PROGRESS = [
  { label: "Design system mockups", pct: 65, color: "#7c5cfc", category: "Design" },
  { label: "API rate limiting integration", pct: 40, color: "#0ea5e9", category: "Engineering" },
  { label: "Q2 Strategy document", pct: 22, color: "#f59e0b", category: "Writing" },
];

const DONE_TODAY = [
  { label: "Morning standup", icon: Users, time: "8:45am" },
  { label: "Reviewed PR #47 and #48", icon: GitPullRequest, time: "9:30am" },
  { label: "Updated product roadmap", icon: FileText, time: "10:15am" },
  { label: "Replied to Aditi's thread", icon: MessageSquare, time: "11:00am" },
];

const SCHEDULE = [
  { time: "09:00", label: "Morning Standup", done: true, icon: Users, color: "#10b981" },
  { time: "11:00", label: "Design Review", active: true, icon: Video, color: "#7c5cfc" },
  { time: "13:00", label: "Lunch Break", icon: Coffee, color: "#f59e0b" },
  { time: "14:00", label: "Sprint Review", icon: Users, color: "#f43f5e", focus: true },
  { time: "16:00", label: "1:1 with Aditi", icon: MessageSquare, color: "#0ea5e9" },
];

const RECENT = [
  { label: "Q2 Report", action: "edited", icon: FileText, color: "#f59e0b", time: "2m ago" },
  { label: "PR #52 opened", action: "new", icon: GitPullRequest, color: "#10b981", time: "18m ago" },
  { label: "Sprint Review added", action: "event", icon: CalendarDays, color: "#7c5cfc", time: "1h ago" },
  { label: "Design mockups v3", action: "updated", icon: FileText, color: "#0ea5e9", time: "2h ago" },
  { label: "Standup notes", action: "created", icon: MessageSquare, color: "#6366f1", time: "3h ago" },
];

/* ─────── Sub-components ─────── */
function ProgressBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="ds-pbar-track">
      <div
        className="ds-pbar-fill"
        style={{ width: `${pct}%`, background: color }}
      />
    </div>
  );
}

function ScheduleDot({ done, active, focus }: { done?: boolean; active?: boolean; focus?: boolean }) {
  if (done) return <span className="ds-sched-dot ds-sched-dot--done" />;
  if (focus) return <span className="ds-sched-dot ds-sched-dot--focus" />;
  if (active) return <span className="ds-sched-dot ds-sched-dot--active" />;
  return <span className="ds-sched-dot" />;
}

/* ─────── Main Dashboard ─────── */
export default function DashboardPage() {
  const [captureValue, setCaptureValue] = useState("");

  const now = new Date();
  const dayName = now.toLocaleDateString("en-US", { weekday: "long" });
  const dateStr = now.toLocaleDateString("en-US", { month: "long", day: "numeric" });
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="ds-page">


      {/* ════ TOP BAR ════ */}
      <header className="ds-topbar">
        <div className="ds-topbar-left">
          <span className="ds-day">{dayName}, {dateStr}</span>
          <span className="ds-topbar-sep">·</span>
          <span className="ds-tasks-due">
            <AlertTriangle size={11} className="ds-warn-icon" />
            7 tasks due today
          </span>
        </div>
        <div className="ds-topbar-right">
          <div className="ds-streak">
            <Flame size={13} color="#f97316" fill="#f97316" />
            <span>7-day streak</span>
          </div>
          <button className="ds-new-btn">
            <Plus size={13} strokeWidth={2.5} />
            New
          </button>
        </div>
      </header>

      {/* ════ HERO ZONE ════ */}
      <section className="ds-hero">

        {/* LEFT: Focus now */}
        <div className="ds-focus">
          <div className="ds-focus-eyebrow">
            <Flame size={13} fill="#f97316" color="#f97316" />
            <span>Focus now</span>
          </div>

          <div className="ds-focus-content">
            <h1 className="ds-focus-title">{FOCUS_ITEM.title}</h1>
            <p className="ds-focus-meta">
              <Clock size={13} />
              {FOCUS_ITEM.urgency}
              <span className="ds-focus-sep" />
              {FOCUS_ITEM.subtitle}
            </p>
          </div>

          <div className="ds-focus-actions">
            <button className="ds-action-primary">
              <Video size={14} strokeWidth={2} />
              Join Meeting
            </button>
            <button className="ds-action-ghost">
              Prep notes
              <ArrowRight size={13} strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* RIGHT: Up next */}
        <div className="ds-upnext">
          <p className="ds-upnext-heading">Up next</p>
          <div className="ds-upnext-list">
            {UP_NEXT.map((item, i) => (
              <div key={i} className="ds-upnext-item">
                <span
                  className="ds-upnext-dot"
                  style={{ background: item.color }}
                />
                <span className="ds-upnext-label">{item.label}</span>
                <span
                  className={`ds-upnext-time ds-upnext-time--${item.urgency}`}
                >
                  {item.time}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════ AI NUDGE ════ */}
      <div className="ds-ai-nudge">
        <Sparkles size={13} className="ds-ai-icon" />
        <p className="ds-ai-text">
          You have back-to-back meetings from 11:00–15:00.{" "}
          <strong>Consider blocking focus time before your sprint review.</strong>
        </p>
        <button className="ds-ai-action">Block 30min <ChevronRight size={11} /></button>
        <button className="ds-ai-dismiss">Dismiss</button>
      </div>

      {/* ════ WORK STREAM ════ */}
      <div className="ds-stream">

        {/* LEFT: Tasks */}
        <div className="ds-stream-main">

          {/* In Progress */}
          <div className="ds-section">
            <div className="ds-section-head">
              <span className="ds-section-label">In progress</span>
              <span className="ds-section-count">{IN_PROGRESS.length}</span>
            </div>
            <div className="ds-task-list">
              {IN_PROGRESS.map((t, i) => (
                <div key={i} className="ds-task">
                  <div className="ds-task-top">
                    <Circle size={14} style={{ color: t.color, flexShrink: 0 }} strokeWidth={2} />
                    <span className="ds-task-label">{t.label}</span>
                    <span className="ds-task-tag">{t.category}</span>
                    <span className="ds-task-pct" style={{ color: t.color }}>{t.pct}%</span>
                  </div>
                  <ProgressBar pct={t.pct} color={t.color} />
                </div>
              ))}
            </div>
          </div>

          {/* Done today */}
          <div className="ds-section">
            <div className="ds-section-head">
              <span className="ds-section-label">Completed today</span>
              <span className="ds-section-count done">{DONE_TODAY.length}</span>
            </div>
            <div className="ds-done-list">
              {DONE_TODAY.map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className="ds-done-item">
                    <CheckCircle2 size={14} className="ds-done-check" strokeWidth={2} />
                    <Icon size={13} className="ds-done-type-icon" />
                    <span className="ds-done-label">{item.label}</span>
                    <span className="ds-done-time">{item.time}</span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* RIGHT: Schedule */}
        <div className="ds-stream-aside">
          <div className="ds-section-head">
            <span className="ds-section-label">Today&apos;s schedule</span>
            <button className="ds-aside-link">
              <CalendarDays size={12} />
              Full calendar
            </button>
          </div>

          <div className="ds-schedule">
            {SCHEDULE.map((ev, i) => {
              const Icon = ev.icon;
              return (
                <div
                  key={i}
                  className={`ds-sched-item${ev.focus ? " ds-sched-item--focus" : ""}${ev.done ? " ds-sched-item--done" : ""}`}
                >
                  <span className="ds-sched-time">{ev.time}</span>
                  <div className="ds-sched-line">
                    <ScheduleDot done={ev.done} active={ev.active} focus={ev.focus} />
                    {i < SCHEDULE.length - 1 && <span className="ds-sched-connector" />}
                  </div>
                  <div className="ds-sched-content">
                    <Icon size={12} style={{ color: ev.color, flexShrink: 0 }} />
                    <span className="ds-sched-label">{ev.label}</span>
                    {ev.focus && <span className="ds-sched-badge">Now</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* ════ ACTIVITY RIBBON ════ */}
      <div className="ds-ribbon">
        <span className="ds-ribbon-label">Recent</span>
        <div className="ds-ribbon-items">
          {RECENT.map((r, i) => {
            const Icon = r.icon;
            return (
              <div key={i} className="ds-ribbon-item">
                <span className="ds-ribbon-icon" style={{ color: r.color, background: `${r.color}12` }}>
                  <Icon size={12} />
                </span>
                <span className="ds-ribbon-text">
                  <span className="ds-ribbon-action">{r.action}</span>
                  &nbsp;{r.label}
                </span>
                <span className="ds-ribbon-time">{r.time}</span>
              </div>
            );
          })}
          <button className="ds-ribbon-more">
            <MoreHorizontal size={14} />
          </button>
        </div>
      </div>

      {/* ════ QUICK CAPTURE ════ */}
      <div className="ds-capture-wrap">
        <div className="ds-capture">
          <Zap size={14} className="ds-capture-icon" />
          <input
            className="ds-capture-input"
            placeholder="Add task, note, or ask AI anything..."
            value={captureValue}
            onChange={(e) => setCaptureValue(e.target.value)}
          />
          <div className="ds-capture-right">
            {captureValue ? (
              <button className="ds-capture-send">
                <ArrowRight size={14} strokeWidth={2.5} />
              </button>
            ) : (
              <span className="ds-capture-hint">
                <Sparkles size={11} />
                AI
                <span className="ds-capture-kbd">⌘K</span>
              </span>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
