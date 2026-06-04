import { pgTable, serial, text, timestamp, boolean, integer } from "drizzle-orm/pg-core";

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
