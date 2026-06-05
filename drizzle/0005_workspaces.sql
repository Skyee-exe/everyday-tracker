CREATE TABLE IF NOT EXISTS "workspaces" (
  "id" serial PRIMARY KEY NOT NULL,
  "owner_clerk_user_id" text NOT NULL,
  "name" text NOT NULL,
  "description" text,
  "icon" text DEFAULT 'Zap' NOT NULL,
  "color" text DEFAULT '#2563eb' NOT NULL,
  "type" text DEFAULT 'personal' NOT NULL,
  "plan" text DEFAULT 'Free' NOT NULL,
  "subscription_status" text DEFAULT 'active' NOT NULL,
  "stripe_customer_id" text,
  "stripe_subscription_id" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "uniq_owner_workspace_name" ON "workspaces" ("owner_clerk_user_id", "name");

CREATE TABLE IF NOT EXISTS "workspace_members" (
  "id" serial PRIMARY KEY NOT NULL,
  "workspace_id" integer NOT NULL REFERENCES "workspaces"("id") ON DELETE cascade,
  "clerk_user_id" text,
  "email" text NOT NULL,
  "role" text DEFAULT 'Member' NOT NULL,
  "status" text DEFAULT 'active' NOT NULL,
  "invited_by_clerk_user_id" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "uniq_workspace_member_email" ON "workspace_members" ("workspace_id", "email");

CREATE TABLE IF NOT EXISTS "workspace_invites" (
  "id" serial PRIMARY KEY NOT NULL,
  "workspace_id" integer NOT NULL REFERENCES "workspaces"("id") ON DELETE cascade,
  "email" text NOT NULL,
  "role" text DEFAULT 'Member' NOT NULL,
  "token" text UNIQUE NOT NULL,
  "status" text DEFAULT 'pending' NOT NULL,
  "invited_by_clerk_user_id" text NOT NULL,
  "last_sent_at" timestamp DEFAULT now() NOT NULL,
  "accepted_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "uniq_workspace_invite_email" ON "workspace_invites" ("workspace_id", "email");

CREATE TABLE IF NOT EXISTS "workspace_preferences" (
  "id" serial PRIMARY KEY NOT NULL,
  "clerk_user_id" text UNIQUE NOT NULL,
  "active_workspace_id" integer REFERENCES "workspaces"("id") ON DELETE set null,
  "preferences" jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "product_updates" (
  "id" serial PRIMARY KEY NOT NULL,
  "title" text NOT NULL,
  "body" text NOT NULL,
  "category" text DEFAULT 'release' NOT NULL,
  "version" text,
  "published_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "product_update_reads" (
  "id" serial PRIMARY KEY NOT NULL,
  "clerk_user_id" text NOT NULL,
  "update_id" integer NOT NULL REFERENCES "product_updates"("id") ON DELETE cascade,
  "read_at" timestamp DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "uniq_user_update_read" ON "product_update_reads" ("clerk_user_id", "update_id");
