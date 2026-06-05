"use server";

import { db } from "@/db";
import {
  kanbanBoards,
  kanbanTasks,
  calendarTasks,
  notes,
  whiteboards,
  spacePages,
  spaces,
  boardCollaborators,
  users
} from "@/db/schema";
import { eq, and, or, desc, asc, gte, lte, inArray, sql } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";

export async function getDashboardData() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const localUser = await db.query.users.findFirst({
    where: eq(users.clerkUserId, userId),
  });

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  // 1. Fetch user boards (owned + collaborator)
  const userBoards = await db
    .select({
      id: kanbanBoards.id,
      name: kanbanBoards.name,
      color: kanbanBoards.color,
      updatedAt: kanbanBoards.updatedAt,
      clerkUserId: kanbanBoards.clerkUserId,
    })
    .from(kanbanBoards)
    .leftJoin(boardCollaborators, eq(boardCollaborators.boardId, kanbanBoards.id))
    .where(
      or(
        eq(kanbanBoards.clerkUserId, userId),
        localUser
          ? or(
              eq(boardCollaborators.userId, localUser.id),
              eq(sql`LOWER(${boardCollaborators.email})`, localUser.email.toLowerCase())
            )
          : undefined
      )
    )
    .orderBy(desc(kanbanBoards.updatedAt));

  // Deduplicate boards by ID
  const uniqueBoardsMap = new Map<number, typeof userBoards[number]>();
  for (const b of userBoards) {
    uniqueBoardsMap.set(b.id, b);
  }
  const boardsList = Array.from(uniqueBoardsMap.values());
  const boardIds = boardsList.map((b) => b.id);

  // 2. Fetch Kanban tasks
  let activeKanbanTasks: typeof kanbanTasks.$inferSelect[] = [];
  if (boardIds.length > 0) {
    activeKanbanTasks = await db
      .select()
      .from(kanbanTasks)
      .where(inArray(kanbanTasks.boardId, boardIds));
  }

  // 3. Fetch Calendar Tasks (events, reminders, etc.)
  const activeCalendarTasks = await db
    .select()
    .from(calendarTasks)
    .where(eq(calendarTasks.clerkUserId, userId));

  // 4. Fetch Notes
  const userNotes = await db
    .select()
    .from(notes)
    .where(and(eq(notes.clerkUserId, userId), eq(notes.isTrash, false)))
    .orderBy(desc(notes.updatedAt));

  // 5. Fetch Whiteboards
  const userWhiteboards = await db
    .select()
    .from(whiteboards)
    .where(eq(whiteboards.clerkUserId, userId))
    .orderBy(desc(whiteboards.updatedAt));

  // 6. Fetch Space Pages
  const userSpaces = await db
    .select()
    .from(spaces)
    .where(and(eq(spaces.clerkUserId, userId), eq(spaces.isArchived, false)));
  
  const spaceIds = userSpaces.map(s => s.id);
  let userPages: typeof spacePages.$inferSelect[] = [];
  if (spaceIds.length > 0) {
    userPages = await db
      .select()
      .from(spacePages)
      .where(and(inArray(spacePages.spaceId, spaceIds), eq(spacePages.isArchived, false)))
      .orderBy(desc(spacePages.updatedAt));
  }

  // Map spaces for easy parent space resolution
  const spaceMap = new Map(userSpaces.map(s => [s.id, s]));

  // --- STATS STRIP ---
  // Tasks Due Today: Kanban tasks due today (incomplete) + Calendar tasks scheduled for today (incomplete)
  const kanbanDueToday = activeKanbanTasks.filter(
    (t) => !t.completed && t.dueDate && new Date(t.dueDate) >= startOfToday && new Date(t.dueDate) <= endOfToday
  ).length;

  const calendarDueToday = activeCalendarTasks.filter(
    (t) => !t.completed && t.startAt && new Date(t.startAt) >= startOfToday && new Date(t.startAt) <= endOfToday
  ).length;

  const tasksDueToday = kanbanDueToday + calendarDueToday;

  // Completed This Week: Completed in the last 7 days
  const kanbanCompletedThisWeek = activeKanbanTasks.filter(
    (t) => t.completed && t.updatedAt && new Date(t.updatedAt) >= oneWeekAgo
  ).length;

  const calendarCompletedThisWeek = activeCalendarTasks.filter(
    (t) => t.completed && t.updatedAt && new Date(t.updatedAt) >= oneWeekAgo
  ).length;

  const completedThisWeek = kanbanCompletedThisWeek + calendarCompletedThisWeek;

  const activeProjects = boardsList.length;
  const notesCreated = userNotes.length;

  // Events Scheduled: upcoming calendar events/tasks
  const eventsScheduled = activeCalendarTasks.filter(
    (t) => t.startAt && new Date(t.startAt) >= startOfToday
  ).length;

  // Focus Time: sum estimatedDuration/durationMinutes of tasks completed in the last 7 days
  const kanbanFocusMinutes = activeKanbanTasks
    .filter((t) => t.completed && t.updatedAt && new Date(t.updatedAt) >= oneWeekAgo)
    .reduce((sum, t) => sum + (t.estimatedDuration || 0), 0);

  const calendarFocusMinutes = activeCalendarTasks
    .filter((t) => t.completed && t.updatedAt && new Date(t.updatedAt) >= oneWeekAgo)
    .reduce((sum, t) => sum + (t.durationMinutes || 0), 0);

  const focusTimeHours = Math.round((kanbanFocusMinutes + calendarFocusMinutes) / 60);

  // --- FOCUS NOW ---
  // The single next incomplete calendar event or task scheduled for today
  const todayIncompleteEvents = activeCalendarTasks
    .filter((t) => !t.completed && t.startAt && new Date(t.startAt) >= new Date() && new Date(t.startAt) <= endOfToday)
    .sort((a, b) => new Date(a.startAt!).getTime() - new Date(b.startAt!).getTime());

  let focusNow = null;
  if (todayIncompleteEvents.length > 0) {
    const nextEvent = todayIncompleteEvents[0];
    focusNow = {
      id: nextEvent.id,
      title: nextEvent.title,
      subtitle: nextEvent.description || `Event · ${nextEvent.category}`,
      urgency: formatUrgency(nextEvent.startAt!),
      color: getCategoryColor(nextEvent.category),
      type: "event",
      startAt: nextEvent.startAt,
    };
  } else {
    // Fallback to top incomplete task due today
    const todayIncompleteTasks = activeKanbanTasks
      .filter((t) => !t.completed && t.dueDate && new Date(t.dueDate) >= startOfToday && new Date(t.dueDate) <= endOfToday)
      .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());
    if (todayIncompleteTasks.length > 0) {
      const nextTask = todayIncompleteTasks[0];
      focusNow = {
        id: nextTask.id,
        title: nextTask.title,
        subtitle: `Kanban Task · ${nextTask.category || "General"}`,
        urgency: "Due today",
        color: "#dc2626",
        type: "task",
        dueDate: nextTask.dueDate,
      };
    }
  }

  // --- UP NEXT ---
  // Next 3 upcoming tasks/events after Focus Now
  const allUpcoming = [
    ...activeCalendarTasks
      .filter((t) => !t.completed && t.startAt && new Date(t.startAt) >= new Date())
      .map((t) => ({
        label: t.title,
        time: formatUpcomingTime(t.startAt!),
        urgency: getUrgencyLevel(t.startAt!),
        color: getCategoryColor(t.category),
        date: t.startAt!,
      })),
    ...activeKanbanTasks
      .filter((t) => !t.completed && t.dueDate && new Date(t.dueDate) >= new Date())
      .map((t) => ({
        label: t.title,
        time: formatUpcomingTime(t.dueDate!),
        urgency: getUrgencyLevel(t.dueDate!),
        color: "#3b82f6",
        date: t.dueDate!,
      })),
  ]
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    // Exclude the item that is currently in Focus Now if it exists
    .filter((item) => !focusNow || item.label !== focusNow.title)
    .slice(0, 3);

  // --- IN PROGRESS ---
  // Kanban tasks not completed, sorted by updatedAt desc, limit 3
  const inProgressTasks = activeKanbanTasks
    .filter((t) => !t.completed)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 3)
    .map((t) => {
      // Find board color
      const board = boardsList.find(b => b.id === t.boardId);
      // Let's invent a progress percentage for the UI based on priority/due state or random mock
      let pct = 25;
      if (t.priority === "high") pct = 65;
      if (t.priority === "critical") pct = 85;
      if (t.priority === "low") pct = 15;
      return {
        id: t.id,
        label: t.title,
        pct,
        color: board?.color || "#3b82f6",
        category: t.category || "Task",
        boardId: t.boardId,
      };
    });

  // --- COMPLETED TODAY ---
  // Tasks completed today (Kanban + Calendar)
  const completedToday = [
    ...activeKanbanTasks
      .filter((t) => t.completed && t.updatedAt && new Date(t.updatedAt) >= startOfToday)
      .map((t) => ({
        label: t.title,
        type: "kanban",
        time: formatTimeOnly(t.updatedAt),
        date: t.updatedAt,
      })),
    ...activeCalendarTasks
      .filter((t) => t.completed && t.updatedAt && new Date(t.updatedAt) >= startOfToday)
      .map((t) => ({
        label: t.title,
        type: "calendar",
        time: formatTimeOnly(t.updatedAt),
        date: t.updatedAt,
      })),
  ]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 5);

  // --- TODAY'S SCHEDULE ---
  // Hour-by-hour schedule for today
  const todaysSchedule = activeCalendarTasks
    .filter((t) => t.startAt && new Date(t.startAt) >= startOfToday && new Date(t.startAt) <= endOfToday)
    .sort((a, b) => new Date(a.startAt!).getTime() - new Date(b.startAt!).getTime())
    .map((t) => ({
      id: t.id,
      time: formatTimeOnly(t.startAt!),
      label: t.title,
      done: t.completed,
      active: !t.completed && new Date(t.startAt!) <= new Date() && new Date(t.endAt || new Date()) >= new Date(),
      focus: focusNow?.id === t.id && focusNow?.type === "event",
      color: getCategoryColor(t.category),
    }));

  // --- RECENT NOTES ---
  const recentNotes = userNotes.slice(0, 5).map((n) => ({
    id: n.id,
    title: n.title || "Untitled Note",
    category: n.category || "General",
    color: n.color || "#0ea5e9",
    icon: n.icon || "NotebookPen",
    isFavorite: n.isFavorite,
    updatedAtStr: formatTimeAgo(n.updatedAt),
  }));

  // --- RECENT WHITEBOARDS ---
  const recentWhiteboards = userWhiteboards.slice(0, 5).map((w) => ({
    id: w.id,
    name: w.name || "Untitled whiteboard",
    color: w.color || "#2563eb",
    updatedAtStr: formatTimeAgo(w.updatedAt),
  }));

  // --- RECENT PAGES ---
  const recentPages = userPages.slice(0, 5).map((p) => {
    const space = spaceMap.get(p.spaceId);
    return {
      id: p.id,
      title: p.title || "Untitled page",
      spaceId: p.spaceId,
      spaceName: space?.name || "Workspace",
      spaceColor: space?.color || "#2563eb",
      updatedAtStr: formatTimeAgo(p.updatedAt),
    };
  });

  // --- UNIFIED ACTIVITY FEED ---
  // Merge active notes, whiteboards, page updates, and tasks updates
  const activityList = [
    ...userNotes.map((n) => ({
      label: n.title || "Untitled note",
      action: new Date(n.updatedAt).getTime() - new Date(n.createdAt).getTime() < 5000 ? "created" : "edited",
      type: "note",
      color: n.color || "#0ea5e9",
      time: formatTimeAgo(n.updatedAt),
      date: n.updatedAt,
      href: `/dashboard/notes?noteId=${n.id}`,
    })),
    ...userWhiteboards.map((w) => ({
      label: w.name || "Untitled whiteboard",
      action: new Date(w.updatedAt).getTime() - new Date(w.createdAt).getTime() < 5000 ? "created" : "updated",
      type: "whiteboard",
      color: w.color || "#7c3aed",
      time: formatTimeAgo(w.updatedAt),
      date: w.updatedAt,
      href: `/dashboard/whiteboard?id=${w.id}`,
    })),
    ...userPages.map((p) => ({
      label: p.title || "Untitled page",
      action: new Date(p.updatedAt).getTime() - new Date(p.createdAt).getTime() < 5000 ? "created" : "edited",
      type: "page",
      color: spaceMap.get(p.spaceId)?.color || "#3b82f6",
      time: formatTimeAgo(p.updatedAt),
      date: p.updatedAt,
      href: `/dashboard/pages?spaceId=${p.spaceId}&pageId=${p.id}`,
    })),
    ...activeKanbanTasks.map((t) => ({
      label: t.title,
      action: t.completed ? "completed" : "updated",
      type: "task",
      color: "#f43f5e",
      time: formatTimeAgo(t.updatedAt),
      date: t.updatedAt,
      href: `/dashboard/tasks?boardId=${t.boardId}`,
    })),
    ...activeCalendarTasks.map((t) => ({
      label: t.title,
      action: "event",
      type: "calendar",
      color: "#10b981",
      time: formatTimeAgo(t.updatedAt),
      date: t.updatedAt,
      href: `/dashboard/calendar`,
    })),
  ]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 10);

  // Calculate streak from activity dates
  const activityDates: Date[] = [];
  userNotes.forEach((n) => activityDates.push(new Date(n.updatedAt)));
  userWhiteboards.forEach((w) => activityDates.push(new Date(w.updatedAt)));
  userPages.forEach((p) => activityDates.push(new Date(p.updatedAt)));
  activeCalendarTasks.forEach((t) => activityDates.push(new Date(t.updatedAt)));
  activeKanbanTasks.forEach((t) => activityDates.push(new Date(t.updatedAt)));
  if (localUser) {
    if (localUser.lastSignedInAt) activityDates.push(new Date(localUser.lastSignedInAt));
    activityDates.push(new Date(localUser.updatedAt));
    activityDates.push(new Date(localUser.createdAt));
  }
  const streak = calculateStreak(activityDates);

  return {
    streak,
    stats: {
      tasksDueToday,
      completedThisWeek,
      activeProjects,
      notesCreated,
      eventsScheduled,
      focusTimeHours,
    },
    focusNow,
    upNext: allUpcoming,
    inProgressTasks,
    completedToday,
    todaysSchedule,
    recentNotes,
    recentWhiteboards,
    recentPages,
    activityList,
    boards: boardsList.map(b => ({ id: b.id, name: b.name })),
    spaces: userSpaces.map(s => ({ id: s.id, name: s.name })),
  };
}

// Helper functions for formatting
function calculateStreak(dates: Date[]): number {
  if (dates.length === 0) return 0;

  // Convert to local YYYY-MM-DD date strings
  const dateStrings = dates.map((d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  });

  const uniqueDates = new Set(dateStrings);

  const getLocalDateString = (offsetDays: number) => {
    const d = new Date();
    d.setDate(d.getDate() - offsetDays);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const todayStr = getLocalDateString(0);
  const yesterdayStr = getLocalDateString(1);

  let startStr = "";
  if (uniqueDates.has(todayStr)) {
    startStr = todayStr;
  } else if (uniqueDates.has(yesterdayStr)) {
    startStr = yesterdayStr;
  } else {
    return 0; // Streak is broken
  }

  let streak = 0;
  let currentOffset = startStr === todayStr ? 0 : 1;

  while (true) {
    const checkStr = getLocalDateString(currentOffset);
    if (uniqueDates.has(checkStr)) {
      streak++;
      currentOffset++;
    } else {
      break;
    }
  }

  return streak;
}

function formatUrgency(date: Date): string {
  const diffMs = date.getTime() - Date.now();
  if (diffMs < 0) return "Started";
  const diffHours = Math.floor(diffMs / 3600000);
  if (diffHours < 1) {
    const diffMins = Math.floor(diffMs / 60000);
    return `In ${diffMins} min`;
  }
  if (diffHours < 24) {
    return `In ${diffHours} hours`;
  }
  return "Upcoming";
}

function formatUpcomingTime(date: Date): string {
  const diffMs = date.getTime() - Date.now();
  if (diffMs < 0) return "Now";
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / 3600000);
    if (diffHours === 0) return "Soon";
    return `${diffHours}h`;
  }
  if (diffDays === 1) return "Tomorrow";
  if (diffDays < 7) {
    return date.toLocaleDateString("en-US", { weekday: "short" });
  }
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// Get urgency level string matching original mockup classes
function getUrgencyLevel(date: Date): string {
  const diffMs = date.getTime() - Date.now();
  if (diffMs < 86400000) return "today";
  if (diffMs < 86400000 * 2) return "soon";
  return "upcoming";
}

function getCategoryColor(cat: string): string {
  const lower = cat?.toLowerCase() || "";
  if (lower.includes("work")) return "#10b981";
  if (lower.includes("meeting")) return "#7c5cfc";
  if (lower.includes("study")) return "#f59e0b";
  if (lower.includes("personal")) return "#0ea5e9";
  return "#6366f1";
}

function formatTimeOnly(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).toLowerCase();
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}
