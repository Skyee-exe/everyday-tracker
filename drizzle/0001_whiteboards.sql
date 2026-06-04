CREATE TABLE IF NOT EXISTS "whiteboards" (
  "id" serial PRIMARY KEY NOT NULL,
  "clerk_user_id" text NOT NULL,
  "name" text DEFAULT 'Untitled whiteboard' NOT NULL,
  "color" text DEFAULT '#2563eb' NOT NULL,
  "scene" jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
