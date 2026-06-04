import { pgTable, serial, text, timestamp, boolean, integer, uniqueIndex } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  clerkUserId: text("clerk_user_id").notNull().unique(),
  name: text("name"),
  imageUrl: text("image_url"),
  email: text("email").notNull().unique(),
  lastSignedInAt: timestamp("last_signed_in_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});


export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

/* ── Calendar Tasks ── */
export const calendarTasks = pgTable("calendar_tasks", {
  id: serial("id").primaryKey(),
  clerkUserId: text("clerk_user_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  startAt: timestamp("start_at"),
  endAt: timestamp("end_at"),
  durationMinutes: integer("duration_minutes").notNull().default(60),
  priority: text("priority").notNull().default("medium"),
  category: text("category").notNull().default("work"),
  type: text("type").notNull().default("task"), // "task" | "reminder"
  isDraft: boolean("is_draft").notNull().default(false),
  reminder: boolean("reminder").notNull().default(false),
  completed: boolean("completed").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type CalendarTask = typeof calendarTasks.$inferSelect;
export type NewCalendarTask = typeof calendarTasks.$inferInsert;

/* ── Kanban Boards ── */
export const kanbanBoards = pgTable("kanban_boards", {
  id: serial("id").primaryKey(),
  clerkUserId: text("clerk_user_id").notNull(),
  name: text("name").notNull(),
  color: text("color").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type KanbanBoard = typeof kanbanBoards.$inferSelect;
export type NewKanbanBoard = typeof kanbanBoards.$inferInsert;

/* ── Kanban Columns ── */
export const kanbanColumns = pgTable("kanban_columns", {
  id: serial("id").primaryKey(),
  boardId: integer("board_id")
    .references(() => kanbanBoards.id, { onDelete: "cascade" })
    .notNull(),
  name: text("name").notNull(),
  position: integer("position").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type KanbanColumn = typeof kanbanColumns.$inferSelect;
export type NewKanbanColumn = typeof kanbanColumns.$inferInsert;

/* ── Kanban Tasks ── */
export const kanbanTasks = pgTable("kanban_tasks", {
  id: serial("id").primaryKey(),
  boardId: integer("board_id")
    .references(() => kanbanBoards.id, { onDelete: "cascade" })
    .notNull(),
  columnId: integer("column_id")
    .references(() => kanbanColumns.id, { onDelete: "cascade" })
    .notNull(),
  title: text("title").notNull(),
  description: text("description"),
  priority: text("priority").notNull().default("medium"),
  category: text("category").default("work"),
  dueDate: timestamp("due_date"),
  estimatedDuration: integer("estimated_duration").default(60),
  position: integer("position").notNull(),
  completed: boolean("completed").default(false),
  linkedCalendarTaskId: integer("linked_calendar_task_id"),
  linkedNoteId: integer("linked_note_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type KanbanTask = typeof kanbanTasks.$inferSelect;
export type NewKanbanTask = typeof kanbanTasks.$inferInsert;

/* ── Board Collaborators ── */
export const boardCollaborators = pgTable(
  "board_collaborators",
  {
    id: serial("id").primaryKey(),
    boardId: integer("board_id")
      .references(() => kanbanBoards.id, { onDelete: "cascade" })
      .notNull(),
    userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
    email: text("email").notNull(),
    role: text("role").notNull().default("editor"),
    invitedByClerkUserId: text("invited_by_clerk_user_id").notNull(),
    acceptedAt: timestamp("accepted_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    uniqBoardEmail: uniqueIndex("uniq_board_collaborator_email").on(t.boardId, t.email),
  })
);

export type BoardCollaborator = typeof boardCollaborators.$inferSelect;
export type NewBoardCollaborator = typeof boardCollaborators.$inferInsert;
