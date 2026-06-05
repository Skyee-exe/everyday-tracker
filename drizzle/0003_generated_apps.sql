CREATE TABLE IF NOT EXISTS "generated_apps" (
  "id" serial PRIMARY KEY NOT NULL,
  "clerk_user_id" text NOT NULL,
  "app_name" text NOT NULL,
  "description" text NOT NULL,
  "icon" text DEFAULT 'Sparkles' NOT NULL,
  "color" text DEFAULT '#2563eb' NOT NULL,
  "layout" text DEFAULT 'single-page' NOT NULL,
  "app_json" jsonb NOT NULL,
  "last_opened_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
