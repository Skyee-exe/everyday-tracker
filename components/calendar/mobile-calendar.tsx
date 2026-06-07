"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  AlertCircle,
  Flag,
  Tag,
  CalendarDays,
  MoreVertical,
  Calendar as CalendarIcon,
  ListTodo,
} from "lucide-react";
import type { CalendarTask } from "@/db/schema";

interface MobileCalendarProps {
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
  tasks: CalendarTask[];
  loading: boolean;
  openPanel: (ds?: string, h?: number, task?: CalendarTask) => void;
  prevPeriod: () => void;
  nextPeriod: () => void;
  goToday: () => void;
  categories: any[];
}

const DAYS_OF_WEEK_SHORT = ["S", "M", "T", "W", "T", "F", "S"];
const DAYS_OF_WEEK_FULL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const SLOT_H = 64; // Generous height for touch targets

function toDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function todayStr(): string {
  return toDateStr(new Date());
}

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

const PRIORITIES = [
  { id: "low",      label: "Low",      color: "#94a3b8" },
  { id: "medium",   label: "Medium",   color: "#eab308" },
  { id: "high",     label: "High",     color: "#f97316" },
  { id: "critical", label: "Critical", color: "#ef4444" },
] as const;

function getPri(pri: string) {
  return PRIORITIES.find((p) => p.id === pri) ?? PRIORITIES[1];
}

export default function MobileCalendar({
  currentDate,
  setCurrentDate,
  tasks,
  loading,
  openPanel,
  prevPeriod,
  nextPeriod,
  goToday,
  categories,
}: MobileCalendarProps) {
  const [mobileView, setMobileView] = useState<"today" | "calendar" | "upcoming">("today");
  const [nowPct, setNowPct] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Time tracker for Red indicator line
  useEffect(() => {
    const update = () => {
      const now = new Date();
      setNowPct((now.getHours() * 60 + now.getMinutes()) / (24 * 60));
    };
    update();
    const iv = setInterval(update, 60000);
    return () => clearInterval(iv);
  }, []);

  // Auto-scroll timeline to 8 AM on mount / view load
  useEffect(() => {
    if (mobileView === "today" && scrollContainerRef.current) {
      setTimeout(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = 8 * SLOT_H - 40;
        }
      }, 100);
    }
  }, [mobileView, currentDate]);

  const getCat = (catId: string) => {
    return (
      categories.find((c) => c.id === catId.toLowerCase()) || {
        id: catId,
        color: "#94a3b8",
        bg: "#f1f5f9",
        Icon: Tag,
      }
    );
  };

  // Week strip centered on currentDate
  const weekDaysStrip = useMemo(() => {
    const days: Date[] = [];
    const base = new Date(currentDate);
    // Get starting Sunday
    base.setDate(currentDate.getDate() - currentDate.getDay());
    for (let i = 0; i < 7; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      days.push(d);
    }
    return days;
  }, [currentDate]);

  // Calendar month days
  const monthDays = useMemo(() => {
    const y = currentDate.getFullYear();
    const m = currentDate.getMonth();
    const first = new Date(y, m, 1);
    const last = new Date(y, m + 1, 0);
    const days: Date[] = [];
    
    // Previous month filler days
    const prevFiller = first.getDay();
    for (let i = prevFiller - 1; i >= 0; i--) {
      days.push(new Date(y, m, -i));
    }
    
    // Active month days
    for (let d = 1; d <= last.getDate(); d++) {
      days.push(new Date(y, m, d));
    }
    
    // Next month filler days
    const nextFiller = 42 - days.length; // standard 6-week layout
    for (let i = 1; i <= nextFiller; i++) {
      days.push(new Date(y, m + 1, i));
    }
    
    return days;
  }, [currentDate]);

  // Daily Tasks
  const activeDateStr = toDateStr(currentDate);
  const dailyTasks = useMemo(() => {
    return tasks.filter((t) => t.startAt && toDateStr(new Date(t.startAt)) === activeDateStr);
  }, [tasks, activeDateStr]);

  // Agenda Groups (Upcoming view)
  const agendaGroups = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const grouped: Record<string, { label: string; date: Date; items: CalendarTask[] }> = {};

    tasks
      .filter((t) => t.startAt && !t.completed && new Date(t.startAt).getTime() >= today.getTime())
      .sort((a, b) => new Date(a.startAt!).getTime() - new Date(b.startAt!).getTime())
      .forEach((t) => {
        const ds = toDateStr(new Date(t.startAt!));
        if (!grouped[ds]) {
          const itemDate = new Date(t.startAt!);
          let label = itemDate.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
          if (ds === todayStr()) {
            label = "Today";
          } else {
            const tomorrow = new Date(today);
            tomorrow.setDate(today.getDate() + 1);
            if (ds === toDateStr(tomorrow)) {
              label = "Tomorrow";
            }
          }
          grouped[ds] = { label, date: itemDate, items: [] };
        }
        grouped[ds].items.push(t);
      });

    return Object.values(grouped).sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [tasks]);

  const monthLabel = currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const dayLabel = currentDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

  const prevDay = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 1);
    setCurrentDate(d);
  };

  const nextDay = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + 1);
    setCurrentDate(d);
  };

  return (
    <div className="flex flex-col h-full bg-background select-none font-sans overflow-hidden text-foreground">
      {/* ── Mobile Compact Header ── */}
      <header className="flex items-center justify-between px-4 h-12 border-b border-border bg-card flex-shrink-0">
        <div className="flex items-center gap-1.5">
          <CalendarDays size={18} className="text-primary" />
          <span className="font-display font-extrabold text-sm tracking-tight text-foreground">
            {mobileView === "calendar" ? monthLabel : dayLabel}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={mobileView === "calendar" ? prevPeriod : prevDay}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-accent border border-border text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Previous"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={goToday}
            className="px-3 py-1.5 h-8 flex items-center justify-center text-xs font-bold rounded-lg border border-border bg-card hover:bg-accent text-foreground transition-colors"
          >
            Today
          </button>
          <button
            onClick={mobileView === "calendar" ? nextPeriod : nextDay}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-accent border border-border text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Next"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </header>

      {/* ── View Segmented Control (Tabs) ── */}
      <div className="px-4 py-2 border-b border-border bg-card flex-shrink-0">
        <div className="flex bg-muted p-1 rounded-xl gap-1 relative">
          {(["today", "calendar", "upcoming"] as const).map((viewId) => (
            <button
              key={viewId}
              onClick={() => setMobileView(viewId)}
              className={`flex-1 text-center py-2 text-xs font-bold rounded-lg transition-all relative z-10 ${
                mobileView === viewId
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {viewId === "today" ? "Today" : viewId === "calendar" ? "Calendar" : "Upcoming"}
            </button>
          ))}
        </div>
      </div>

      {/* ── Main View Panel ── */}
      <div className="flex-1 overflow-hidden relative bg-background">
        <AnimatePresence mode="wait">
          {mobileView === "today" && (
            <motion.div
              key="today"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.15 }}
              className="h-full flex flex-col overflow-hidden"
            >
              {/* Horizontal 7-Day strip */}
              <div className="flex justify-between px-3 py-2 border-b border-border bg-card">
                {weekDaysStrip.map((day, idx) => {
                  const ds = toDateStr(day);
                  const isSelected = ds === activeDateStr;
                  const isCurrentDay = ds === todayStr();
                  const isSunday = day.getDay() === 0;

                  return (
                    <button
                      key={idx}
                      onClick={() => setCurrentDate(day)}
                      className={`flex flex-col items-center justify-center w-11 py-1.5 rounded-xl transition-all ${
                        isSelected
                          ? "bg-primary text-primary-foreground shadow-md font-bold"
                          : "hover:bg-accent text-muted-foreground"
                      }`}
                    >
                      <span className={`text-[10px] uppercase font-semibold ${isSunday && !isSelected ? "text-rose-500" : ""}`}>
                        {DAYS_OF_WEEK_SHORT[day.getDay()]}
                      </span>
                      <span className={`text-sm font-bold mt-1 ${isCurrentDay && !isSelected ? "text-primary border-b-2 border-primary leading-none" : ""}`}>
                        {day.getDate()}
                      </span>
                      {/* Has Task dot indicator */}
                      {tasks.some((t) => t.startAt && toDateStr(new Date(t.startAt)) === ds) && (
                        <span className={`w-1 h-1 rounded-full mt-1 ${isSelected ? "bg-white" : "bg-primary"}`} />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* 1-Day hourly timeline with drag-to-swipe navigation */}
              <motion.div
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.4}
                onDragEnd={(e, info) => {
                  if (info.offset.x < -80) {
                    nextDay();
                  } else if (info.offset.x > 80) {
                    prevDay();
                  }
                }}
                ref={scrollContainerRef}
                className="flex-1 overflow-y-auto scrollbar-none relative"
              >
                {/* Hourly slots */}
                <div className="relative w-full" style={{ height: HOURS.length * SLOT_H }}>
                  {HOURS.map((h) => (
                    <div
                      key={h}
                      onClick={() => openPanel(activeDateStr, h)}
                      className="absolute left-0 right-0 border-b border-border/60 flex items-start"
                      style={{ top: h * SLOT_H, height: SLOT_H }}
                    >
                      {/* Hour labels */}
                      <span className="w-14 text-right pr-3 pt-1.5 text-[10px] font-bold text-muted-foreground select-none">
                        {h !== 0 && formatHour(h)}
                      </span>
                      <div className="flex-1 h-full border-l border-border/80" />
                    </div>
                  ))}

                  {/* Red Current Time Line */}
                  {activeDateStr === todayStr() && (
                    <div
                      className="absolute left-14 right-0 flex items-center z-10 pointer-events-none"
                      style={{ top: nowPct * SLOT_H * 24 - 1 }}
                    >
                      <div className="w-2.5 h-2.5 rounded-full bg-rose-500 -ml-1.5 shadow-md" />
                      <div className="flex-1 h-0.5 bg-rose-500/80" />
                    </div>
                  )}

                  {/* Daily Tasks Layer */}
                  {dailyTasks.map((t) => {
                    const start = new Date(t.startAt!);
                    const startHours = start.getHours() + start.getMinutes() / 60;
                    const top = startHours * SLOT_H;
                    const height = Math.max((t.durationMinutes / 60) * SLOT_H, 44); // 44px min touch hitbox
                    const cat = getCat(t.category);
                    const pri = getPri(t.priority);

                    return (
                      <div
                        key={t.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          openPanel(undefined, undefined, t);
                        }}
                        className="absolute left-16 right-3 rounded-xl p-2.5 border-l-[4px] shadow-sm select-none cursor-pointer overflow-hidden transition-all active:scale-[0.98]"
                        style={{
                          top: top + 2,
                          height: height - 4,
                          borderColor: cat.color,
                          backgroundColor: cat.bg || `${cat.color}18`,
                        }}
                      >
                        <div className="flex items-start justify-between gap-1 h-full">
                          <div className="flex-1 min-w-0 flex flex-col justify-between h-full">
                            <span className="text-[11px] font-bold leading-tight text-foreground truncate select-none">
                              {t.title}
                            </span>
                            <span className="text-[9px] font-bold text-muted-foreground select-none">
                              {formatTime(start)} ({t.durationMinutes}m)
                            </span>
                          </div>
                          {t.priority === "critical" && (
                            <AlertCircle size={12} className="text-rose-500 mt-0.5 flex-shrink-0" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            </motion.div>
          )}

          {mobileView === "calendar" && (
            <motion.div
              key="calendar"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.12 }}
              className="h-full flex flex-col bg-card"
            >
              {/* Day Name header */}
              <div className="grid grid-cols-7 gap-1 px-4 py-2 border-b border-border bg-card">
                {DAYS_OF_WEEK_SHORT.map((d, i) => (
                  <span
                    key={i}
                    className={`text-center text-[10px] font-extrabold tracking-wider ${
                      i === 0 ? "text-rose-500" : "text-muted-foreground"
                    }`}
                  >
                    {d}
                  </span>
                ))}
              </div>

              {/* Month dates grid */}
              <div className="grid grid-cols-7 gap-1.5 p-4 flex-1 overflow-y-auto">
                {monthDays.map((day, idx) => {
                  const ds = toDateStr(day);
                  const isSelected = ds === activeDateStr;
                  const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                  const isCurrentDay = ds === todayStr();
                  const dayTasks = tasks.filter(
                    (t) => t.startAt && toDateStr(new Date(t.startAt)) === ds
                  );

                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        setCurrentDate(day);
                        setMobileView("today");
                      }}
                      className={`relative flex flex-col items-center justify-between py-2.5 min-h-[52px] rounded-xl border border-transparent transition-all ${
                        isSelected
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : isCurrentDay
                          ? "bg-accent border-primary/20"
                          : "hover:bg-accent/40"
                      } ${isCurrentMonth ? "opacity-100" : "opacity-35"}`}
                    >
                      <span className={`text-xs font-bold ${isCurrentDay && !isSelected ? "text-primary font-extrabold" : ""}`}>
                        {day.getDate()}
                      </span>
                      
                      {/* Mini dot indicators */}
                      <div className="flex gap-0.5 justify-center w-full min-h-[4px] mt-1 select-none">
                        {dayTasks.slice(0, 3).map((t, dotIdx) => {
                          const cat = getCat(t.category);
                          return (
                            <span
                              key={dotIdx}
                              className="w-1 h-1 rounded-full flex-shrink-0"
                              style={{ backgroundColor: isSelected ? "#fff" : cat.color }}
                            />
                          );
                        })}
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {mobileView === "upcoming" && (
            <motion.div
              key="upcoming"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
              className="h-full overflow-y-auto p-4 space-y-4"
            >
              {agendaGroups.length > 0 ? (
                agendaGroups.map((group) => (
                  <div key={group.label} className="space-y-2">
                    <h3 className="text-xs font-extrabold text-primary uppercase tracking-widest pl-1 mt-1">
                      {group.label}
                    </h3>
                    <div className="space-y-2">
                      {group.items.map((t) => {
                        const cat = getCat(t.category);
                        const pri = getPri(t.priority);
                        const start = t.startAt ? new Date(t.startAt) : null;

                        return (
                          <div
                            key={t.id}
                            onClick={() => openPanel(undefined, undefined, t)}
                            className="flex items-center gap-3 p-3.5 rounded-xl border border-border bg-card shadow-sm active:scale-[0.99] transition-all cursor-pointer"
                            style={{ borderLeft: `4px solid ${cat.color}` }}
                          >
                            <div className="flex-1 min-w-0">
                              <h4 className="text-xs font-bold text-foreground leading-tight truncate">
                                {t.title}
                              </h4>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1">
                                  <Clock size={10} />
                                  {start ? formatTime(start) : "Draft"} ({t.durationMinutes}m)
                                </span>
                                <span
                                  className="text-[9px] font-bold px-1.5 py-0.5 rounded-md"
                                  style={{ backgroundColor: cat.bg || `${cat.color}15`, color: cat.color }}
                                >
                                  {cat.label}
                                </span>
                              </div>
                            </div>
                            {t.priority === "critical" && (
                              <span className="flex-shrink-0 text-rose-500 bg-rose-50 dark:bg-rose-950/20 p-1.5 rounded-lg border border-rose-100 dark:border-rose-950/40">
                                <AlertCircle size={13} />
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-48 flex flex-col items-center justify-center text-center text-muted-foreground">
                  <CalendarIcon size={32} className="text-muted/80 mb-2" />
                  <p className="text-sm font-semibold">No upcoming events scheduled</p>
                  <p className="text-xs text-muted-foreground/80 mt-1 max-w-[240px]">
                    Create a task and schedule a date/time to see it here.
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Mobile FAB ── */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => openPanel(activeDateStr)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-tr from-primary to-blue-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-primary/20 border border-primary/20 z-40 active:shadow-md cursor-pointer"
        aria-label="Create event"
      >
        <Plus size={24} strokeWidth={2.5} />
      </motion.button>
    </div>
  );
}
