export const DEFAULT_CATEGORIES = {
  calendar: [
    { scope: "calendar", name: "Work", color: "#2563eb", icon: "Briefcase", position: 0 },
    { scope: "calendar", name: "Personal", color: "#7c3aed", icon: "User", position: 1 },
    { scope: "calendar", name: "Health", color: "#16a34a", icon: "Heart", position: 2 },
  ],
  tasks: [
    { scope: "tasks", name: "Work", color: "#2563eb", icon: "Briefcase", position: 0 },
    { scope: "tasks", name: "Urgent", color: "#dc2626", icon: "Zap", position: 1 },
    { scope: "tasks", name: "Learning", color: "#0ea5e9", icon: "BookOpen", position: 2 },
  ],
  notes: [
    { scope: "notes", name: "Ideas", color: "#0891b2", icon: "Sparkles", position: 0 },
    { scope: "notes", name: "Research", color: "#7c3aed", icon: "BookOpen", position: 1 },
  ],
  reminders: [
    { scope: "reminders", name: "Follow up", color: "#d97706", icon: "Bell", position: 0 },
    { scope: "reminders", name: "Focus", color: "#16a34a", icon: "Flag", position: 1 },
  ],
} as const;
