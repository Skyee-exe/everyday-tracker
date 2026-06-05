CREATE TABLE IF NOT EXISTS "user_settings" (
  "id" serial PRIMARY KEY NOT NULL,
  "clerk_user_id" text NOT NULL,
  "theme" text DEFAULT 'system' NOT NULL,
  "notifications_enabled" boolean DEFAULT true NOT NULL,
  "default_calendar_view" text DEFAULT 'week' NOT NULL,
  "default_task_priority" text DEFAULT 'medium' NOT NULL,
  "autosave_enabled" boolean DEFAULT true NOT NULL,
  "data_export_preference" text DEFAULT 'json' NOT NULL,
  "privacy_mode_enabled" boolean DEFAULT false NOT NULL,
  "security_alerts_enabled" boolean DEFAULT true NOT NULL,
  "ai_default_model" text DEFAULT 'gemini-2.5-flash' NOT NULL,
  "ai_behavior" text DEFAULT 'balanced' NOT NULL,
  "ai_response_style" text DEFAULT 'concise' NOT NULL,
  "ai_refine_enabled" boolean DEFAULT true NOT NULL,
  "ai_assistant_enabled" boolean DEFAULT true NOT NULL,
  "ai_template_builder_enabled" boolean DEFAULT true NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "user_settings_clerk_user_id_unique" UNIQUE("clerk_user_id")
);

CREATE TABLE IF NOT EXISTS "user_categories" (
  "id" serial PRIMARY KEY NOT NULL,
  "clerk_user_id" text NOT NULL,
  "scope" text NOT NULL,
  "name" text NOT NULL,
  "color" text DEFAULT '#2563eb' NOT NULL,
  "icon" text DEFAULT 'Tag' NOT NULL,
  "position" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "uniq_user_category_scope_name"
  ON "user_categories" ("clerk_user_id", "scope", "name");
