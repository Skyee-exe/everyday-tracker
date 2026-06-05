import { pgTable, serial, text, timestamp, boolean, integer, uniqueIndex, jsonb } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  clerkUserId: text("clerk_user_id").notNull().unique(),
  name: text("name"),
  imageUrl: text("image_url"),
  email: text("email").notNull().unique(),
  lastSignedInAt: timestamp("last_signed_in_at"),
  hasOnboardedPages: boolean("has_onboarded_pages").notNull().default(false),
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

/* ── Notes ── */
export const notes = pgTable("notes", {
  id: serial("id").primaryKey(),
  clerkUserId: text("clerk_user_id").notNull(),
  title: text("title").notNull().default("Untitled"),
  content: jsonb("content"),
  icon: text("icon"),
  color: text("color"),
  category: text("category"),
  folderId: integer("folder_id"),
  isFavorite: boolean("is_favorite").notNull().default(false),
  isPinned: boolean("is_pinned").notNull().default(false),
  isTrash: boolean("is_trash").notNull().default(false),
  linkedTaskId: integer("linked_task_id"),
  linkedBoardId: integer("linked_board_id"),
  linkedCalendarTaskId: integer("linked_calendar_task_id"),
  lastOpenedAt: timestamp("last_opened_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Note = typeof notes.$inferSelect;
export type NewNote = typeof notes.$inferInsert;

/* ── Whiteboards ── */
export const whiteboards = pgTable("whiteboards", {
  id: serial("id").primaryKey(),
  clerkUserId: text("clerk_user_id").notNull(),
  name: text("name").notNull().default("Untitled whiteboard"),
  color: text("color").notNull().default("#2563eb"),
  scene: jsonb("scene"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Whiteboard = typeof whiteboards.$inferSelect;
export type NewWhiteboard = typeof whiteboards.$inferInsert;

/* Pages & Spaces */
export const spaces = pgTable("spaces", {
  id: serial("id").primaryKey(),
  clerkUserId: text("clerk_user_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  color: text("color").notNull().default("#2563eb"),
  isFavorite: boolean("is_favorite").notNull().default(false),
  isArchived: boolean("is_archived").notNull().default(false),
  lastOpenedAt: timestamp("last_opened_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Space = typeof spaces.$inferSelect;
export type NewSpace = typeof spaces.$inferInsert;

export const spacePages = pgTable("space_pages", {
  id: serial("id").primaryKey(),
  spaceId: integer("space_id")
    .references(() => spaces.id, { onDelete: "cascade" })
    .notNull(),
  clerkUserId: text("clerk_user_id").notNull(),
  title: text("title").notNull().default("Untitled page"),
  type: text("type").notNull().default("Blank Page"),
  summary: text("summary"),
  content: jsonb("content"),
  isFavorite: boolean("is_favorite").notNull().default(false),
  isArchived: boolean("is_archived").notNull().default(false),
  linkedTaskCount: integer("linked_task_count").notNull().default(0),
  lastOpenedAt: timestamp("last_opened_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type SpacePage = typeof spacePages.$inferSelect;
export type NewSpacePage = typeof spacePages.$inferInsert;

/* AI Generated Apps */
export const generatedApps = pgTable("generated_apps", {
  id: serial("id").primaryKey(),
  clerkUserId: text("clerk_user_id").notNull(),
  appName: text("app_name").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull().default("Sparkles"),
  color: text("color").notNull().default("#2563eb"),
  layout: text("layout").notNull().default("single-page"),
  appJson: jsonb("app_json").notNull(),
  inSidebar: boolean("in_sidebar").notNull().default(false),
  lastOpenedAt: timestamp("last_opened_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type GeneratedApp = typeof generatedApps.$inferSelect;
export type NewGeneratedApp = typeof generatedApps.$inferInsert;

/* User Settings */
export const userSettings = pgTable("user_settings", {
  id: serial("id").primaryKey(),
  clerkUserId: text("clerk_user_id").notNull().unique(),
  theme: text("theme").notNull().default("system"),
  notificationsEnabled: boolean("notifications_enabled").notNull().default(true),
  defaultCalendarView: text("default_calendar_view").notNull().default("week"),
  defaultTaskPriority: text("default_task_priority").notNull().default("medium"),
  autosaveEnabled: boolean("autosave_enabled").notNull().default(true),
  dataExportPreference: text("data_export_preference").notNull().default("json"),
  privacyModeEnabled: boolean("privacy_mode_enabled").notNull().default(false),
  securityAlertsEnabled: boolean("security_alerts_enabled").notNull().default(true),
  aiDefaultModel: text("ai_default_model").notNull().default("gemini-2.5-flash"),
  aiBehavior: text("ai_behavior").notNull().default("balanced"),
  aiResponseStyle: text("ai_response_style").notNull().default("concise"),
  aiRefineEnabled: boolean("ai_refine_enabled").notNull().default(true),
  aiAssistantEnabled: boolean("ai_assistant_enabled").notNull().default(true),
  aiTemplateBuilderEnabled: boolean("ai_template_builder_enabled").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type UserSettings = typeof userSettings.$inferSelect;
export type NewUserSettings = typeof userSettings.$inferInsert;

/* User Categories */
export const userCategories = pgTable(
  "user_categories",
  {
    id: serial("id").primaryKey(),
    clerkUserId: text("clerk_user_id").notNull(),
    scope: text("scope").notNull(),
    name: text("name").notNull(),
    color: text("color").notNull().default("#2563eb"),
    icon: text("icon").notNull().default("Tag"),
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({
    uniqUserCategoryScopeName: uniqueIndex("uniq_user_category_scope_name").on(
      t.clerkUserId,
      t.scope,
      t.name
    ),
  })
);

export type UserCategory = typeof userCategories.$inferSelect;
export type NewUserCategory = typeof userCategories.$inferInsert;

/* Notifications Table */
export const notifications = pgTable(
  "notifications",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull(),
    type: text("type").notNull(), // 'task' | 'comment' | 'mention' | 'calendar' | 'note' | 'system'
    title: text("title").notNull(),
    message: text("message").notNull(),
    entityType: text("entity_type"), // 'task' | 'board' | 'note' | 'calendar' | 'whiteboard' | 'page' | 'comment'
    entityId: text("entity_id"), // string identifier for target route params
    isRead: boolean("is_read").notNull().default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  }
);

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
