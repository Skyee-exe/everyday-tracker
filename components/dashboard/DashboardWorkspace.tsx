"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  ListTodo,
  Kanban,
  PenTool,
  Star,
  X,
  Loader2,
  PlusCircle,
} from "lucide-react";
import { usePresenceUsers } from "@/lib/collab/usePresenceUsers";
import { ClientSideSuspense } from "@liveblocks/react";
import { useThreads } from "@/lib/collab";

// Import actions from all workspaces
import { createNote } from "@/app/dashboard/notes/actions";
import { createWhiteboard } from "@/app/dashboard/whiteboard/actions";
import { createPage } from "@/app/dashboard/pages/actions";
import { createTask as createKanbanTask, getColumns } from "@/app/dashboard/tasks/actions";
import { createTask as createCalendarTask } from "@/app/dashboard/calendar/actions";

interface DashboardData {
  streak: number;
  stats: {
    tasksDueToday: number;
    completedThisWeek: number;
    activeProjects: number;
    notesCreated: number;
    eventsScheduled: number;
    focusTimeHours: number;
  };
  focusNow: {
    id: number;
    title: string;
    subtitle: string;
    urgency: string;
    color: string;
    type: string;
    startAt?: Date | null;
    dueDate?: Date | null;
  } | null;
  upNext: Array<{
    label: string;
    time: string;
    urgency: string;
    color: string;
    date: Date;
  }>;
  inProgressTasks: Array<{
    id: number;
    label: string;
    pct: number;
    color: string;
    category: string;
    boardId: number;
  }>;
  completedToday: Array<{
    label: string;
    type: string;
    time: string;
    date: Date;
  }>;
  todaysSchedule: Array<{
    id: number;
    time: string;
    label: string;
    done: boolean;
    active: boolean;
    focus: boolean;
    color: string;
  }>;
  recentNotes: Array<{
    id: number;
    title: string;
    category: string;
    color: string;
    icon: string;
    isFavorite: boolean;
    updatedAtStr: string;
  }>;
  recentWhiteboards: Array<{
    id: number;
    name: string;
    color: string;
    updatedAtStr: string;
  }>;
  recentPages: Array<{
    id: number;
    title: string;
    spaceId: number;
    spaceName: string;
    spaceColor: string;
    updatedAtStr: string;
  }>;
  activityList: Array<{
    label: string;
    action: string;
    type: string;
    color: string;
    time: string;
    date: Date;
    href: string;
  }>;
  boards: Array<{ id: number; name: string }>;
  spaces: Array<{ id: number; name: string }>;
}

function CollabInner() {
  const { others } = usePresenceUsers();
  const { threads } = useThreads();

  return (
    <div className="flex flex-col gap-4 mt-3">
      <div>
        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Active Collaborators</h4>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="relative w-6 h-6 flex items-center justify-center rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-bold">
              <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 border border-white" />
              S
            </span>
            <span className="text-xs font-medium text-gray-700">You (Online)</span>
          </div>
          {others.map((other, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="relative w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 text-gray-700 text-[10px] font-bold">
                <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 border border-white" />
                {other.avatar ? (
                  <img src={other.avatar} alt={other.name} className="w-full h-full rounded-full object-cover" />
                ) : (
                  <span>{other.name[0]?.toUpperCase() || "A"}</span>
                )}
              </span>
              <span className="text-xs font-medium text-gray-700">{other.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-gray-100 pt-3">
        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Collaboration Activity</h4>
        <div className="flex flex-col gap-1.5">
          <div className="text-xs text-gray-500 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            <span>{threads?.length || 0} active comment threads</span>
          </div>
          <div className="text-xs text-gray-500 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            <span>Real-time collaboration active</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function CollabFallback() {
  return (
    <div className="flex items-center justify-center gap-2 py-6 text-xs text-gray-400">
      <Loader2 size={13} className="animate-spin" />
      <span>Loading collaboration presence...</span>
    </div>
  );
}

export default function DashboardWorkspace({ initialData }: { initialData: DashboardData }) {
  const router = useRouter();
  const [data, setData] = useState<DashboardData>(initialData);
  const [captureValue, setCaptureValue] = useState("");
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [aiResponse, setAiResponse] = useState<string | null>(null);

  // Modals state
  const [activeModal, setActiveModal] = useState<"task" | "event" | "page" | null>(null);

  // Modal Form States
  const [taskForm, setTaskForm] = useState({
    title: "",
    boardId: data.boards[0]?.id || 0,
    columnId: 0,
    priority: "medium",
    category: "work",
    dueDate: "",
    estimatedDuration: 60,
  });
  const [columnsList, setColumnsList] = useState<Array<{ id: number; name: string }>>([]);

  const [eventForm, setEventForm] = useState({
    title: "",
    startAt: "",
    endAt: "",
    category: "meeting",
    priority: "medium",
  });

  const [pageForm, setPageForm] = useState({
    title: "",
    spaceId: data.spaces[0]?.id || 0,
    template: "Blank Page",
  });

  // Load columns when task board selection changes
  useEffect(() => {
    if (taskForm.boardId) {
      getColumns(Number(taskForm.boardId)).then((cols) => {
        setColumnsList(cols);
        if (cols.length > 0) {
          setTaskForm((prev) => ({ ...prev, columnId: cols[0].id }));
        }
      });
    }
  }, [taskForm.boardId]);

  const handleCreateNote = async () => {
    try {
      setLoadingAction("note");
      const note = await createNote({ title: "Untitled Note", content: null });
      router.push(`/dashboard/notes?noteId=${note.id}`);
    } catch (err) {
      console.error(err);
      setLoadingAction(null);
    }
  };

  const handleCreateWhiteboard = async () => {
    try {
      setLoadingAction("whiteboard");
      const board = await createWhiteboard({ name: "Untitled whiteboard" });
      router.push(`/dashboard/whiteboard?id=${board.id}`);
    } catch (err) {
      console.error(err);
      setLoadingAction(null);
    }
  };

  const handleTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.title) return;
    try {
      setLoadingAction("task-create");
      await createKanbanTask({
        boardId: Number(taskForm.boardId),
        columnId: Number(taskForm.columnId),
        title: taskForm.title,
        priority: taskForm.priority,
        category: taskForm.category,
        dueDate: taskForm.dueDate ? new Date(taskForm.dueDate) : null,
        estimatedDuration: Number(taskForm.estimatedDuration),
        syncCalendar: !!taskForm.dueDate,
      });
      setActiveModal(null);
      setTaskForm((p) => ({ ...p, title: "", dueDate: "" }));
      router.refresh();
      window.location.reload();
    } catch (err) {
      console.error(err);
      setLoadingAction(null);
    }
  };

  const handleEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventForm.title) return;
    try {
      setLoadingAction("event-create");
      await createCalendarTask({
        title: eventForm.title,
        startAt: eventForm.startAt ? new Date(eventForm.startAt) : null,
        endAt: eventForm.endAt ? new Date(eventForm.endAt) : null,
        category: eventForm.category,
        priority: eventForm.priority,
        type: "task",
        isDraft: false,
        reminder: false,
      });
      setActiveModal(null);
      setEventForm((p) => ({ ...p, title: "", startAt: "", endAt: "" }));
      window.location.reload();
    } catch (err) {
      console.error(err);
      setLoadingAction(null);
    }
  };

  const handlePageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pageForm.title) return;
    try {
      setLoadingAction("page-create");
      const page = await createPage({
        spaceId: Number(pageForm.spaceId),
        title: pageForm.title,
        type: pageForm.template as any,
      });
      setActiveModal(null);
      router.push(`/dashboard/pages?spaceId=${pageForm.spaceId}&pageId=${page.id}`);
    } catch (err) {
      console.error(err);
      setLoadingAction(null);
    }
  };

  // Bottom Command Input Handler
  const handleCommandSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = captureValue.trim().toLowerCase();
    if (!query) return;

    setCaptureValue("");
    setAiResponse(null);

    if (query.includes("note") && (query.includes("create") || query.includes("new"))) {
      setAiResponse("Creating note and opening editor...");
      handleCreateNote();
      return;
    }

    if (query.includes("whiteboard") && (query.includes("create") || query.includes("new"))) {
      setAiResponse("Initializing a new whiteboard scene...");
      handleCreateWhiteboard();
      return;
    }

    if (query.includes("task") && (query.includes("create") || query.includes("new"))) {
      setAiResponse("Opening quick task creation panel...");
      setActiveModal("task");
      return;
    }

    if (query.includes("event") || query.includes("schedule") || query.includes("meeting")) {
      setAiResponse("Opening calendar event scheduling tool...");
      setActiveModal("event");
      return;
    }

    if (query.includes("board") && query.includes("open")) {
      const found = data.boards.find((b) => query.includes(b.name.toLowerCase()));
      if (found) {
        setAiResponse(`Navigating to ${found.name} Kanban board...`);
        router.push(`/dashboard/tasks?boardId=${found.id}`);
      } else {
        setAiResponse("Opening task boards dashboard...");
        router.push("/dashboard/tasks");
      }
      return;
    }

    if (query.includes("page") && (query.includes("create") || query.includes("new"))) {
      setAiResponse("Opening new page creator...");
      setActiveModal("page");
      return;
    }

    if (query.includes("calendar") || query.includes("schedule")) {
      setAiResponse("Opening Calendar page...");
      router.push("/dashboard/calendar");
      return;
    }
    if (query.includes("notes") || query.includes("document")) {
      setAiResponse("Opening Notes organizer...");
      router.push("/dashboard/notes");
      return;
    }
    if (query.includes("pages") || query.includes("spaces")) {
      setAiResponse("Opening Pages & Spaces workspace...");
      router.push("/dashboard/pages");
      return;
    }
    if (query.includes("whiteboard") || query.includes("canvas")) {
      setAiResponse("Opening Whiteboards section...");
      router.push("/dashboard/whiteboard");
      return;
    }

    setAiResponse(`Searching workspace files for "${captureValue}"...`);
    setTimeout(() => {
      setAiResponse(`Command "${captureValue}" parsed. Use standard Quick Actions above or create a specific page link.`);
    }, 1500);
  };

  const now = new Date();
  const dayName = now.toLocaleDateString("en-US", { weekday: "long" });
  const dateStr = now.toLocaleDateString("en-US", { month: "long", day: "numeric" });

  const statsList = [
    { label: "Tasks Due Today", value: data.stats.tasksDueToday, icon: ListTodo, color: "#f43f5e", bg: "#f43f5e12" },
    { label: "Completed This Week", value: data.stats.completedThisWeek, icon: CheckCircle2, color: "#10b981", bg: "#10b98112" },
    { label: "Active Projects", value: data.stats.activeProjects, icon: Kanban, color: "#7c5cfc", bg: "#7c5cfc12" },
    { label: "Notes Created", value: data.stats.notesCreated, icon: FileText, color: "#0ea5e9", bg: "#0ea5e912" },
    { label: "Events Scheduled", value: data.stats.eventsScheduled, icon: CalendarDays, color: "#f59e0b", bg: "#f59e0b12" },
    { label: "Focus Time", value: `${data.stats.focusTimeHours}h`, icon: Clock, color: "#6366f1", bg: "#6366f112" },
  ];

  return (
    <div className="ds-page">
      {/* Loading Overlay */}
      {loadingAction && (
        <div className="fixed inset-0 bg-slate-900/15 backdrop-blur-xs flex flex-col items-center justify-center gap-3 text-slate-800 font-semibold z-[9999]">
          <Loader2 className="animate-spin text-indigo-600" size={32} />
          <span>Processing action...</span>
        </div>
      )}

      {/* TOP HEADER */}
      <header className="ds-topbar animate-fade-in">
        <div className="ds-topbar-left">
          <span className="ds-day">{dayName}, {dateStr}</span>
          <span className="ds-topbar-sep">·</span>
          <span className="ds-tasks-due">
            <AlertTriangle size={12} className="ds-warn-icon" />
            {data.stats.tasksDueToday} tasks due today
          </span>
        </div>
        <div className="ds-topbar-right">
          <div className="ds-streak">
            <Flame size={13} color="#f97316" fill="#f97316" />
            <span>{data.streak}-day streak</span>
          </div>
          <button className="ds-new-btn" onClick={handleCreateNote}>
            <Plus size={13} strokeWidth={2.5} />
            New Note
          </button>
        </div>
      </header>

      {/* WORKSPACE STATS STRIP */}
      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mx-7 mt-4 animate-slide-up">
        {statsList.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="flex items-center justify-between bg-white border border-gray-100 rounded-xl p-3.5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ color: stat.color, background: stat.bg }}>
                  <Icon size={14} />
                </span>
                <span className="text-xs font-semibold text-gray-500 truncate">{stat.label}</span>
              </div>
              <span className="text-base font-bold text-gray-900 ml-2 shrink-0">{stat.value}</span>
            </div>
          );
        })}
      </section>

      {/* HERO GRID */}
      <section className="ds-hero animate-slide-up">
        {/* FOCUS NOW */}
        <div className="ds-focus">
          <div className="ds-focus-eyebrow">
            <Flame size={13} fill="#f97316" color="#f97316" />
            <span>Focus now</span>
          </div>
          {data.focusNow ? (
            <div className="ds-focus-content">
              <h1 className="ds-focus-title">{data.focusNow.title}</h1>
              <p className="ds-focus-meta">
                <Clock size={13} />
                {data.focusNow.urgency}
                <span className="ds-focus-sep" />
                {data.focusNow.subtitle}
              </p>
              <div className="ds-focus-actions">
                {data.focusNow.type === "event" ? (
                  <button className="ds-action-primary" onClick={() => router.push("/dashboard/calendar")}>
                    <Video size={14} strokeWidth={2} />
                    Open Event
                  </button>
                ) : (
                  <button className="ds-action-primary" onClick={() => router.push(`/dashboard/tasks?boardId=${data.focusNow?.id}`)}>
                    <Kanban size={14} strokeWidth={2} />
                    Go to Board
                  </button>
                )}
                <button className="ds-action-ghost" onClick={handleCreateNote}>
                  Prep notes
                  <ArrowRight size={13} strokeWidth={2} />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center gap-3 py-6 text-gray-500 w-full">
              <Sparkles size={24} className="text-yellow-500 animate-pulse" />
              <p className="text-sm max-w-[320px] leading-relaxed">Nothing scheduled right now. Ready to start something new?</p>
              <button className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors" onClick={() => setActiveModal("task")}>Create task</button>
            </div>
          )}
        </div>

        {/* UP NEXT */}
        <div className="ds-upnext">
          <p className="ds-upnext-heading">Up next</p>
          <div className="ds-upnext-list">
            {data.upNext.length > 0 ? (
              data.upNext.map((item, i) => (
                <div key={i} className="ds-upnext-item">
                  <span className="ds-upnext-dot" style={{ background: item.color }} />
                  <span className="ds-upnext-label">{item.label}</span>
                  <span className={`ds-upnext-time ds-upnext-time--${item.urgency}`}>{item.time}</span>
                </div>
              ))
            ) : (
              <span className="block text-center text-xs text-gray-400 py-3 font-medium">No upcoming deadlines</span>
            )}
          </div>
        </div>
      </section>

      {/* QUICK ACTIONS SECTION */}
      <section className="flex items-center gap-4 mx-7 p-3.5 bg-white border border-gray-100 rounded-xl shadow-sm animate-slide-up">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider border-r border-gray-100 pr-4 shrink-0">Quick Actions</span>
        <div className="flex items-center gap-2 flex-wrap">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-100 text-gray-700 text-xs font-semibold hover:bg-indigo-50 hover:border-indigo-100 hover:text-indigo-600 hover:-translate-y-0.5 transition-all duration-150 cursor-pointer" onClick={() => setActiveModal("task")}>
            <ListTodo size={13} className="text-rose-500 shrink-0" />
            + Task
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-100 text-gray-700 text-xs font-semibold hover:bg-indigo-50 hover:border-indigo-100 hover:text-indigo-600 hover:-translate-y-0.5 transition-all duration-150 cursor-pointer" onClick={handleCreateNote}>
            <FileText size={13} className="text-cyan-500 shrink-0" />
            + Note
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-100 text-gray-700 text-xs font-semibold hover:bg-indigo-50 hover:border-indigo-100 hover:text-indigo-600 hover:-translate-y-0.5 transition-all duration-150 cursor-pointer" onClick={() => setActiveModal("event")}>
            <CalendarDays size={13} className="text-amber-500 shrink-0" />
            + Event
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-100 text-gray-700 text-xs font-semibold hover:bg-indigo-50 hover:border-indigo-100 hover:text-indigo-600 hover:-translate-y-0.5 transition-all duration-150 cursor-pointer" onClick={() => router.push("/dashboard/tasks")}>
            <Kanban size={13} className="text-purple-500 shrink-0" />
            + Board
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-100 text-gray-700 text-xs font-semibold hover:bg-indigo-50 hover:border-indigo-100 hover:text-indigo-600 hover:-translate-y-0.5 transition-all duration-150 cursor-pointer" onClick={handleCreateWhiteboard}>
            <PenTool size={13} className="text-teal-500 shrink-0" />
            + Whiteboard
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-100 text-gray-700 text-xs font-semibold hover:bg-indigo-50 hover:border-indigo-100 hover:text-indigo-600 hover:-translate-y-0.5 transition-all duration-150 cursor-pointer" onClick={() => setActiveModal("page")}>
            <PlusCircle size={13} className="text-blue-500 shrink-0" />
            + Page
          </button>
        </div>
      </section>

      {/* CONTEXT AI NUDGE */}
      <div className="ds-ai-nudge animate-fade-in">
        <Sparkles size={13} className="ds-ai-icon" />
        <p className="ds-ai-text">
          Excellent job! You completed <strong>{data.stats.completedThisWeek} tasks</strong> this week. Keep the momentum going!
        </p>
        <button className="ds-ai-action" onClick={() => router.push("/dashboard/help")}>
          View Help docs <ChevronRight size={11} />
        </button>
      </div>

      {/* MAIN CONTENT ROW */}
      <div className="ds-stream animate-slide-up">
        {/* LEFT STREAM: In Progress, Completed Today, Activity Feed */}
        <div className="ds-stream-main">
          {/* IN PROGRESS */}
          <div className="ds-section">
            <div className="ds-section-head">
              <span className="ds-section-label">In progress</span>
              <span className="ds-section-count">{data.inProgressTasks.length}</span>
            </div>
            <div className="ds-task-list">
              {data.inProgressTasks.length > 0 ? (
                data.inProgressTasks.map((t, i) => (
                  <div key={i} className="ds-task cursor-pointer" onClick={() => router.push(`/dashboard/tasks?boardId=${t.boardId}`)}>
                    <div className="ds-task-top">
                      <Circle size={14} style={{ color: t.color, flexShrink: 0 }} strokeWidth={2} />
                      <span className="ds-task-label">{t.label}</span>
                      <span className="ds-task-tag">{t.category}</span>
                      <span className="ds-task-pct" style={{ color: t.color }}>{t.pct}%</span>
                    </div>
                    <div className="ds-pbar-track">
                      <div className="ds-pbar-fill" style={{ width: `${t.pct}%`, background: t.color }} />
                    </div>
                  </div>
                ))
              ) : (
                <span className="block text-center text-xs text-gray-400 py-3.5 font-medium">No active in-progress tasks</span>
              )}
            </div>
          </div>

          {/* COMPLETED TODAY */}
          <div className="ds-section">
            <div className="ds-section-head">
              <span className="ds-section-label">Completed today</span>
              <span className="ds-section-count done">{data.completedToday.length}</span>
            </div>
            <div className="ds-done-list">
              {data.completedToday.length > 0 ? (
                data.completedToday.map((item, i) => (
                  <div key={i} className="ds-done-item">
                    <CheckCircle2 size={14} className="ds-done-check" strokeWidth={2} />
                    <span className="ds-done-label">{item.label}</span>
                    <span className="ds-done-time">{item.time}</span>
                  </div>
                ))
              ) : (
                <span className="block text-center text-xs text-gray-400 py-3.5 font-medium">No completed items today yet</span>
              )}
            </div>
          </div>

          {/* DYNAMIC EXPANDED ACTIVITY FEED */}
          <div className="ds-section">
            <div className="ds-section-head">
              <span className="ds-section-label">Workspace activity</span>
            </div>
            <div className="flex flex-col gap-1.5 mt-1">
              {data.activityList.length > 0 ? (
                data.activityList.map((item, i) => (
                  <div key={i} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors duration-150" onClick={() => router.push(item.href)}>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded shrink-0" style={{ color: item.color, background: `${item.color}14` }}>
                      {item.type}
                    </span>
                    <span className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider shrink-0">{item.action}</span>
                    <span className="text-xs font-semibold text-gray-700 flex-1 truncate">{item.label}</span>
                    <span className="text-[11px] text-gray-400 font-medium shrink-0">{item.time}</span>
                  </div>
                ))
              ) : (
                <span className="block text-center text-xs text-gray-400 py-3.5 font-medium">No recent workspace activity logs</span>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT STREAM: Schedule, Recent Notes, Whiteboards, Pages, Collaboration */}
        <div className="ds-stream-aside flex flex-col gap-4 bg-white border border-gray-100 rounded-xl p-4">
          {/* SCHEDULE */}
          <div>
            <div className="ds-section-head">
              <span className="ds-section-label">Today&apos;s schedule</span>
              <button className="ds-aside-link" onClick={() => router.push("/dashboard/calendar")}>
                <CalendarDays size={12} />
                Full calendar
              </button>
            </div>
            <div className="ds-schedule">
              {data.todaysSchedule.length > 0 ? (
                data.todaysSchedule.map((ev, i) => (
                  <div key={i} className={`ds-sched-item${ev.focus ? " ds-sched-item--focus" : ""}${ev.done ? " ds-sched-item--done" : ""}`}>
                    <span className="ds-sched-time">{ev.time}</span>
                    <div className="ds-sched-content cursor-pointer" onClick={() => router.push("/dashboard/calendar")}>
                      <span className="ds-sched-label">{ev.label}</span>
                      {ev.focus && <span className="ds-sched-badge">Now</span>}
                    </div>
                  </div>
                ))
              ) : (
                <span className="block text-center text-xs text-gray-400 py-3.5 font-medium">No calendar items today</span>
              )}
            </div>
          </div>

          {/* RECENT NOTES WIDGET */}
          <div className="border-t border-gray-100 pt-3">
            <div className="ds-section-head">
              <span className="ds-section-label">Recent Notes</span>
              <button className="ds-aside-link" onClick={() => router.push("/dashboard/notes")}>
                See all
              </button>
            </div>
            <div className="flex flex-col gap-1.5 mt-1">
              {data.recentNotes.length > 0 ? (
                data.recentNotes.map((n) => (
                  <div key={n.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors duration-150" onClick={() => router.push(`/dashboard/notes?noteId=${n.id}`)}>
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText size={13} style={{ color: n.color }} className="shrink-0" />
                      <span className="text-xs font-semibold text-gray-700 truncate">{n.title}</span>
                      {n.isFavorite && <Star size={11} fill="#eab308" color="#eab308" className="shrink-0" />}
                    </div>
                    <span className="text-[11px] text-gray-400 font-medium shrink-0 ml-4">{n.updatedAtStr}</span>
                  </div>
                ))
              ) : (
                <span className="block text-center text-xs text-gray-400 py-3.5 font-medium">No notes created yet</span>
              )}
            </div>
          </div>

          {/* RECENT WHITEBOARDS WIDGET */}
          <div className="border-t border-gray-100 pt-3">
            <div className="ds-section-head">
              <span className="ds-section-label">Recent Whiteboards</span>
              <button className="ds-aside-link" onClick={() => router.push("/dashboard/whiteboard")}>
                See all
              </button>
            </div>
            <div className="flex flex-col gap-1.5 mt-1">
              {data.recentWhiteboards.length > 0 ? (
                data.recentWhiteboards.map((w) => (
                  <div key={w.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors duration-150" onClick={() => router.push(`/dashboard/whiteboard?id=${w.id}`)}>
                    <div className="flex items-center gap-2 min-w-0">
                      <PenTool size={13} style={{ color: w.color }} className="shrink-0" />
                      <span className="text-xs font-semibold text-gray-700 truncate">{w.name}</span>
                    </div>
                    <span className="text-[11px] text-gray-400 font-medium shrink-0 ml-4">{w.updatedAtStr}</span>
                  </div>
                ))
              ) : (
                <span className="block text-center text-xs text-gray-400 py-3.5 font-medium">No whiteboards created yet</span>
              )}
            </div>
          </div>

          {/* RECENT PAGES WIDGET */}
          <div className="border-t border-gray-100 pt-3">
            <div className="ds-section-head">
              <span className="ds-section-label">Recent Pages</span>
              <button className="ds-aside-link" onClick={() => router.push("/dashboard/pages")}>
                See all
              </button>
            </div>
            <div className="flex flex-col gap-1.5 mt-1">
              {data.recentPages.length > 0 ? (
                data.recentPages.map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors duration-150" onClick={() => router.push(`/dashboard/pages?spaceId=${p.spaceId}&pageId=${p.id}`)}>
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText size={13} style={{ color: p.spaceColor }} className="shrink-0" />
                      <span className="text-xs font-semibold text-gray-700 truncate">{p.title}</span>
                      <span className="text-[9px] font-bold uppercase border px-1.5 py-0.5 rounded shrink-0 ml-2 truncate max-w-[80px]" style={{ borderColor: p.spaceColor, color: p.spaceColor }}>
                        {p.spaceName}
                      </span>
                    </div>
                    <span className="text-[11px] text-gray-400 font-medium shrink-0 ml-4">{p.updatedAtStr}</span>
                  </div>
                ))
              ) : (
                <span className="block text-center text-xs text-gray-400 py-3.5 font-medium">No pages created yet</span>
              )}
            </div>
          </div>

          {/* LIVEBLOCKS COLLABORATION PRESENCE WIDGET */}
          <div className="border-t border-gray-100 pt-3">
            <div className="ds-section-head">
              <span className="ds-section-label">Workspace Collaboration</span>
            </div>
            <ClientSideSuspense fallback={<CollabFallback />}>
              <CollabInner />
            </ClientSideSuspense>
          </div>
        </div>
      </div>

      {/* QUICK COMMAND BAR */}
      <div className="ds-capture-wrap animate-slide-up">
        <form className="ds-capture" onSubmit={handleCommandSubmit}>
          <Zap size={14} className="ds-capture-icon" />
          <input
            className="ds-capture-input"
            placeholder="Add task, note, or ask anything (e.g. 'create note', 'open calendar')..."
            value={captureValue}
            onChange={(e) => setCaptureValue(e.target.value)}
          />
          <div className="ds-capture-right">
            {captureValue ? (
              <button type="submit" className="ds-capture-send">
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
        </form>
        {aiResponse && (
          <div className="absolute bottom-14 left-0 right-0 bg-white border border-gray-200 rounded-lg p-2.5 shadow-md flex items-center gap-2 text-xs font-semibold text-gray-700 z-10 animate-fade-in">
            <Sparkles size={12} className="text-indigo-500" />
            <span>{aiResponse}</span>
            <button className="ml-auto p-1 text-gray-400 hover:bg-gray-50 rounded" onClick={() => setAiResponse(null)}>
              <X size={10} />
            </button>
          </div>
        )}
      </div>

      {/* MODALS */}
      {activeModal === "task" && (
        <div className="ds-modal-overlay">
          <div className="ds-modal animate-scale-up">
            <div className="ds-modal-header">
              <h3>Create New Task</h3>
              <button className="ds-modal-close" onClick={() => setActiveModal(null)}><X size={16} /></button>
            </div>
            <form onSubmit={handleTaskSubmit}>
              <div className="ds-modal-body">
                <div className="ds-form-group">
                  <label>Task Title</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter task name..."
                    value={taskForm.title}
                    onChange={(e) => setTaskForm((p) => ({ ...p, title: e.target.value }))}
                  />
                </div>
                <div className="ds-form-row">
                  <div className="ds-form-group">
                    <label>Board</label>
                    <select
                      value={taskForm.boardId}
                      onChange={(e) => setTaskForm((p) => ({ ...p, boardId: Number(e.target.value) }))}
                    >
                      {data.boards.map((b) => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="ds-form-group">
                    <label>Column</label>
                    <select
                      value={taskForm.columnId}
                      onChange={(e) => setTaskForm((p) => ({ ...p, columnId: Number(e.target.value) }))}
                    >
                      {columnsList.map((col) => (
                        <option key={col.id} value={col.id}>{col.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="ds-form-row">
                  <div className="ds-form-group">
                    <label>Category</label>
                    <input
                      type="text"
                      placeholder="work, personal, study..."
                      value={taskForm.category}
                      onChange={(e) => setTaskForm((p) => ({ ...p, category: e.target.value }))}
                    />
                  </div>
                  <div className="ds-form-group">
                    <label>Priority</label>
                    <select
                      value={taskForm.priority}
                      onChange={(e) => setTaskForm((p) => ({ ...p, priority: e.target.value }))}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                </div>
                <div className="ds-form-row">
                  <div className="ds-form-group">
                    <label>Due Date (Syncs Calendar)</label>
                    <input
                      type="datetime-local"
                      value={taskForm.dueDate}
                      onChange={(e) => setTaskForm((p) => ({ ...p, dueDate: e.target.value }))}
                    />
                  </div>
                  <div className="ds-form-group">
                    <label>Estimated Duration (mins)</label>
                    <input
                      type="number"
                      value={taskForm.estimatedDuration}
                      onChange={(e) => setTaskForm((p) => ({ ...p, estimatedDuration: Number(e.target.value) }))}
                    />
                  </div>
                </div>
              </div>
              <div className="ds-modal-footer">
                <button type="button" className="ds-btn-sec" onClick={() => setActiveModal(null)}>Cancel</button>
                <button type="submit" className="ds-btn-pri">Create Task</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeModal === "event" && (
        <div className="ds-modal-overlay">
          <div className="ds-modal animate-scale-up">
            <div className="ds-modal-header">
              <h3>Schedule Event</h3>
              <button className="ds-modal-close" onClick={() => setActiveModal(null)}><X size={16} /></button>
            </div>
            <form onSubmit={handleEventSubmit}>
              <div className="ds-modal-body">
                <div className="ds-form-group">
                  <label>Event Title</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g. Weekly Standup meeting..."
                    value={eventForm.title}
                    onChange={(e) => setEventForm((p) => ({ ...p, title: e.target.value }))}
                  />
                </div>
                <div className="ds-form-row">
                  <div className="ds-form-group">
                    <label>Start Date & Time</label>
                    <input
                      type="datetime-local"
                      required
                      value={eventForm.startAt}
                      onChange={(e) => setEventForm((p) => ({ ...p, startAt: e.target.value }))}
                    />
                  </div>
                  <div className="ds-form-group">
                    <label>End Date & Time</label>
                    <input
                      type="datetime-local"
                      required
                      value={eventForm.endAt}
                      onChange={(e) => setEventForm((p) => ({ ...p, endAt: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="ds-form-row">
                  <div className="ds-form-group">
                    <label>Category</label>
                    <select
                      value={eventForm.category}
                      onChange={(e) => setEventForm((p) => ({ ...p, category: e.target.value }))}
                    >
                      <option value="meeting">Meeting</option>
                      <option value="work">Work</option>
                      <option value="study">Study</option>
                      <option value="personal">Personal</option>
                    </select>
                  </div>
                  <div className="ds-form-group">
                    <label>Priority</label>
                    <select
                      value={eventForm.priority}
                      onChange={(e) => setEventForm((p) => ({ ...p, priority: e.target.value }))}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="ds-modal-footer">
                <button type="button" className="ds-btn-sec" onClick={() => setActiveModal(null)}>Cancel</button>
                <button type="submit" className="ds-btn-pri">Schedule</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeModal === "page" && (
        <div className="ds-modal-overlay">
          <div className="ds-modal animate-scale-up">
            <div className="ds-modal-header">
              <h3>Create Space Page</h3>
              <button className="ds-modal-close" onClick={() => setActiveModal(null)}><X size={16} /></button>
            </div>
            <form onSubmit={handlePageSubmit}>
              <div className="ds-modal-body">
                <div className="ds-form-group">
                  <label>Page Title</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter page title..."
                    value={pageForm.title}
                    onChange={(e) => setPageForm((p) => ({ ...p, title: e.target.value }))}
                  />
                </div>
                <div className="ds-form-group">
                  <label>Select Space</label>
                  <select
                    value={pageForm.spaceId}
                    onChange={(e) => setPageForm((p) => ({ ...p, spaceId: Number(e.target.value) }))}
                  >
                    {data.spaces.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div className="ds-form-group">
                  <label>Template</label>
                  <select
                    value={pageForm.template}
                    onChange={(e) => setPageForm((p) => ({ ...p, template: e.target.value }))}
                  >
                    <option value="Blank Page">Blank Page</option>
                    <option value="Project Plan">Project Plan</option>
                    <option value="Meeting Notes">Meeting Notes</option>
                    <option value="PRD">PRD</option>
                    <option value="Research Notes">Research Notes</option>
                    <option value="Task Plan">Task Plan</option>
                  </select>
                </div>
              </div>
              <div className="ds-modal-footer">
                <button type="button" className="ds-btn-sec" onClick={() => setActiveModal(null)}>Cancel</button>
                <button type="submit" className="ds-btn-pri">Create Page</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
