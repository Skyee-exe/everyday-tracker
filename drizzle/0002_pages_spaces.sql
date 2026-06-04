CREATE TABLE IF NOT EXISTS "spaces" (
  "id" serial PRIMARY KEY NOT NULL,
  "clerk_user_id" text NOT NULL,
  "name" text NOT NULL,
  "description" text,
  "color" text DEFAULT '#2563eb' NOT NULL,
  "is_favorite" boolean DEFAULT false NOT NULL,
  "is_archived" boolean DEFAULT false NOT NULL,
  "last_opened_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "space_pages" (
  "id" serial PRIMARY KEY NOT NULL,
  "space_id" integer NOT NULL,
  "clerk_user_id" text NOT NULL,
  "title" text DEFAULT 'Untitled page' NOT NULL,
  "type" text DEFAULT 'Blank Page' NOT NULL,
  "summary" text,
  "content" jsonb,
  "is_favorite" boolean DEFAULT false NOT NULL,
  "is_archived" boolean DEFAULT false NOT NULL,
  "linked_task_count" integer DEFAULT 0 NOT NULL,
  "last_opened_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

DO $$ BEGIN
 ALTER TABLE "space_pages" ADD CONSTRAINT "space_pages_space_id_spaces_id_fk" FOREIGN KEY ("space_id") REFERENCES "public"."spaces"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
