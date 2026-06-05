"use server";

import { randomBytes } from "crypto";
import { auth, currentUser } from "@clerk/nextjs/server";
import { and, desc, eq, inArray, or, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import {
  notifications,
  productUpdateReads,
  productUpdates,
  users,
  workspaceInvites,
  workspaceMembers,
  workspacePreferences,
  workspaces,
  type WorkspaceInvite,
} from "@/db/schema";

export type WorkspaceRole = "Owner" | "Admin" | "Member" | "Guest";
export type WorkspacePlan = "Free" | "Pro";
export type WorkspaceType = "personal" | "team" | "company" | "school";

const ROLES: WorkspaceRole[] = ["Owner", "Admin", "Member", "Guest"];
const PLANS: WorkspacePlan[] = ["Free", "Pro"];
const TYPES: WorkspaceType[] = ["personal", "team", "company", "school"];

export type WorkspaceSummary = {
  id: number;
  name: string;
  description: string | null;
  icon: string;
  color: string;
  type: string;
  plan: WorkspacePlan;
  subscriptionStatus: string;
  role: WorkspaceRole;
  active: boolean;
};

export type WorkspaceState = {
  workspaces: WorkspaceSummary[];
  activeWorkspace: WorkspaceSummary | null;
  unreadUpdates: number;
  updates: Array<{
    id: number;
    title: string;
    body: string;
    category: string;
    version: string | null;
    publishedAt: Date;
    isRead: boolean;
  }>;
};

type CreateWorkspacePayload = {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  type?: WorkspaceType;
};

type InvitePayload = {
  workspaceId: number;
  emails: string[];
  role: WorkspaceRole;
};

async function requireUser() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthenticated");

  const clerkUser = await currentUser();
  const email = clerkUser?.emailAddresses[0]?.emailAddress?.toLowerCase();
  if (!email) throw new Error("Your account needs an email address before using workspaces.");

  return { userId, email, name: clerkUser?.fullName || email };
}

function normalizeName(name: string) {
  return name.trim().replace(/\s+/g, " ");
}

function assertRole(role: string): asserts role is WorkspaceRole {
  if (!ROLES.includes(role as WorkspaceRole)) throw new Error("Invalid workspace role.");
}

function assertPlan(plan: string): asserts plan is WorkspacePlan {
  if (!PLANS.includes(plan as WorkspacePlan)) throw new Error("Invalid subscription plan.");
}

function canManage(role: WorkspaceRole) {
  return role === "Owner" || role === "Admin";
}

function canBill(role: WorkspaceRole) {
  return role === "Owner" || role === "Admin";
}

function validEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function createAppNotification(userId: string, title: string, message: string, entityId?: string) {
  await db.insert(notifications).values({
    userId,
    type: "system",
    title,
    message,
    entityType: "workspace",
    entityId,
    isRead: false,
  });
}

async function ensureDefaultUpdates() {
  const existing = await db.select({ id: productUpdates.id }).from(productUpdates).limit(1);
  if (existing.length > 0) return;

  await db.insert(productUpdates).values([
    {
      title: "Workspace Switcher",
      body: "Workspace creation, switching, member invites, plan management, and release notes are now available from the sidebar.",
      category: "feature",
      version: "1.1.0",
    },
    {
      title: "Productivity Surfaces Refresh",
      body: "Dashboard, notes, tasks, pages, AI templates, calendar, and whiteboards refresh when the active workspace changes.",
      category: "release",
      version: "1.1.0",
    },
  ]);
}

async function getRoleForWorkspace(workspaceId: number, userId: string, email: string) {
  const workspace = await db.query.workspaces.findFirst({
    where: eq(workspaces.id, workspaceId),
  });
  if (!workspace) throw new Error("Workspace not found.");

  const membership = await db.query.workspaceMembers.findFirst({
    where: and(
      eq(workspaceMembers.workspaceId, workspaceId),
      eq(workspaceMembers.status, "active"),
      or(eq(workspaceMembers.clerkUserId, userId), eq(sql`LOWER(${workspaceMembers.email})`, email))
    ),
  });

  if (!membership) throw new Error("You do not have access to this workspace.");
  assertRole(membership.role);
  return { workspace, role: membership.role };
}

async function ensurePersonalWorkspace(userId: string, email: string, name: string) {
  const memberships = await db
    .select({ id: workspaceMembers.id })
    .from(workspaceMembers)
    .where(or(eq(workspaceMembers.clerkUserId, userId), eq(sql`LOWER(${workspaceMembers.email})`, email)))
    .limit(1);

  if (memberships.length > 0) return;

  const baseName = `${name.split("@")[0]}'s Workspace`.slice(0, 80);
  const [workspace] = await db
    .insert(workspaces)
    .values({
      ownerClerkUserId: userId,
      name: baseName,
      description: "Your personal Everyday workspace.",
      icon: "Zap",
      color: "#2563eb",
      type: "personal",
      plan: "Free",
    })
    .returning();

  await db.insert(workspaceMembers).values({
    workspaceId: workspace.id,
    clerkUserId: userId,
    email,
    role: "Owner",
    status: "active",
  });

  await db
    .insert(workspacePreferences)
    .values({
      clerkUserId: userId,
      activeWorkspaceId: workspace.id,
      preferences: { compactSwitcher: false },
    })
    .onConflictDoUpdate({
      target: workspacePreferences.clerkUserId,
      set: { activeWorkspaceId: workspace.id, updatedAt: new Date() },
    });
}

export async function getWorkspaceState(): Promise<WorkspaceState> {
  const { userId, email, name } = await requireUser();
  await ensureDefaultUpdates();
  await ensurePersonalWorkspace(userId, email, name);

  const preference = await db.query.workspacePreferences.findFirst({
    where: eq(workspacePreferences.clerkUserId, userId),
  });

  const rows = await db
    .select({
      id: workspaces.id,
      name: workspaces.name,
      description: workspaces.description,
      icon: workspaces.icon,
      color: workspaces.color,
      type: workspaces.type,
      plan: workspaces.plan,
      subscriptionStatus: workspaces.subscriptionStatus,
      role: workspaceMembers.role,
    })
    .from(workspaces)
    .innerJoin(workspaceMembers, eq(workspaceMembers.workspaceId, workspaces.id))
    .where(
      and(
        eq(workspaceMembers.status, "active"),
        or(eq(workspaceMembers.clerkUserId, userId), eq(sql`LOWER(${workspaceMembers.email})`, email))
      )
    )
    .orderBy(desc(workspaces.updatedAt));

  const summaries = rows.map((row) => {
    assertRole(row.role);
    assertPlan(row.plan);
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      icon: row.icon,
      color: row.color,
      type: row.type,
      plan: row.plan,
      subscriptionStatus: row.subscriptionStatus,
      role: row.role,
      active: row.id === preference?.activeWorkspaceId,
    };
  });

  const active = summaries.find((workspace) => workspace.active) ?? summaries[0] ?? null;
  if (active && active.id !== preference?.activeWorkspaceId) {
    await switchWorkspace(active.id);
    active.active = true;
  }

  const updates = await db.select().from(productUpdates).orderBy(desc(productUpdates.publishedAt));
  const reads = updates.length
    ? await db
        .select()
        .from(productUpdateReads)
        .where(and(eq(productUpdateReads.clerkUserId, userId), inArray(productUpdateReads.updateId, updates.map((u) => u.id))))
    : [];
  const readIds = new Set(reads.map((read) => read.updateId));

  return {
    workspaces: summaries.map((workspace) => ({ ...workspace, active: workspace.id === active?.id })),
    activeWorkspace: active,
    unreadUpdates: updates.filter((update) => !readIds.has(update.id)).length,
    updates: updates.map((update) => ({ ...update, isRead: readIds.has(update.id) })),
  };
}

export async function switchWorkspace(workspaceId: number) {
  const { userId, email } = await requireUser();
  const { workspace, role } = await getRoleForWorkspace(workspaceId, userId, email);

  await db
    .insert(workspacePreferences)
    .values({
      clerkUserId: userId,
      activeWorkspaceId: workspaceId,
      preferences: { lastRole: role, subscriptionTier: workspace.plan },
    })
    .onConflictDoUpdate({
      target: workspacePreferences.clerkUserId,
      set: {
        activeWorkspaceId: workspaceId,
        preferences: { lastRole: role, subscriptionTier: workspace.plan },
        updatedAt: new Date(),
      },
    });

  await createAppNotification(userId, "Workspace switched", `You switched to ${workspace.name}.`, String(workspaceId));
  revalidatePath("/dashboard");
  return { ok: true, workspaceId, role, plan: workspace.plan };
}

export async function createWorkspace(payload: CreateWorkspacePayload) {
  const { userId, email } = await requireUser();
  const name = normalizeName(payload.name || "");
  if (!name) throw new Error("Workspace name is required.");
  if (name.length > 80) throw new Error("Workspace name must be 80 characters or fewer.");
  if ((payload.description || "").length > 240) throw new Error("Description must be 240 characters or fewer.");
  if (payload.type && !TYPES.includes(payload.type)) throw new Error("Invalid workspace type.");

  const existing = await db.query.workspaces.findFirst({
    where: and(eq(workspaces.ownerClerkUserId, userId), eq(sql`LOWER(${workspaces.name})`, name.toLowerCase())),
  });
  if (existing) throw new Error("You already have a workspace with that name.");

  const [workspace] = await db
    .insert(workspaces)
    .values({
      ownerClerkUserId: userId,
      name,
      description: payload.description?.trim() || null,
      icon: payload.icon || "Zap",
      color: payload.color || "#2563eb",
      type: payload.type || "team",
      plan: "Free",
    })
    .returning();

  await db.insert(workspaceMembers).values({
    workspaceId: workspace.id,
    clerkUserId: userId,
    email,
    role: "Owner",
    status: "active",
  });
  await switchWorkspace(workspace.id);
  await createAppNotification(userId, "Workspace created", `${workspace.name} is ready.`, String(workspace.id));

  revalidatePath("/dashboard");
  return workspace;
}

export async function getWorkspaceInvites(workspaceId: number): Promise<WorkspaceInvite[]> {
  const { userId, email } = await requireUser();
  const { role } = await getRoleForWorkspace(workspaceId, userId, email);
  if (!canManage(role)) throw new Error("Only owners and admins can view invites.");

  return db
    .select()
    .from(workspaceInvites)
    .where(eq(workspaceInvites.workspaceId, workspaceId))
    .orderBy(desc(workspaceInvites.createdAt));
}

export async function inviteMembers(payload: InvitePayload) {
  const { userId, email } = await requireUser();
  const { workspace, role } = await getRoleForWorkspace(payload.workspaceId, userId, email);
  if (!canManage(role)) throw new Error("Only owners and admins can invite members.");
  assertRole(payload.role);
  if (payload.role === "Owner" && role !== "Owner") throw new Error("Only owners can invite another owner.");

  const emails = Array.from(new Set(payload.emails.map((item) => item.trim().toLowerCase()).filter(Boolean)));
  if (emails.length === 0) throw new Error("Enter at least one email address.");
  if (emails.length > 20) throw new Error("You can invite up to 20 members at once.");
  const invalid = emails.find((item) => !validEmail(item));
  if (invalid) throw new Error(`${invalid} is not a valid email address.`);

  const created = [];
  for (const inviteEmail of emails) {
    const existingMember = await db.query.workspaceMembers.findFirst({
      where: and(eq(workspaceMembers.workspaceId, workspace.id), eq(sql`LOWER(${workspaceMembers.email})`, inviteEmail)),
    });
    if (existingMember) throw new Error(`${inviteEmail} is already a workspace member.`);

    const existingInvite = await db.query.workspaceInvites.findFirst({
      where: and(eq(workspaceInvites.workspaceId, workspace.id), eq(sql`LOWER(${workspaceInvites.email})`, inviteEmail)),
    });
    if (existingInvite && existingInvite.status === "pending") throw new Error(`${inviteEmail} already has a pending invite.`);

    const token = randomBytes(24).toString("hex");
    const [invite] = await db
      .insert(workspaceInvites)
      .values({
        workspaceId: workspace.id,
        email: inviteEmail,
        role: payload.role,
        token,
        status: "pending",
        invitedByClerkUserId: userId,
      })
      .onConflictDoUpdate({
        target: [workspaceInvites.workspaceId, workspaceInvites.email],
        set: {
          role: payload.role,
          token,
          status: "pending",
          invitedByClerkUserId: userId,
          lastSentAt: new Date(),
          updatedAt: new Date(),
        },
      })
      .returning();
    created.push(invite);
  }

  await createAppNotification(userId, "Member invited", `${created.length} invite${created.length === 1 ? "" : "s"} sent for ${workspace.name}.`, String(workspace.id));
  revalidatePath("/dashboard");
  return created;
}

export async function resendInvite(inviteId: number) {
  const { userId, email } = await requireUser();
  const invite = await db.query.workspaceInvites.findFirst({ where: eq(workspaceInvites.id, inviteId) });
  if (!invite) throw new Error("Invite not found.");
  const { workspace, role } = await getRoleForWorkspace(invite.workspaceId, userId, email);
  if (!canManage(role)) throw new Error("Only owners and admins can resend invites.");

  const [updated] = await db
    .update(workspaceInvites)
    .set({ lastSentAt: new Date(), updatedAt: new Date(), status: "pending" })
    .where(eq(workspaceInvites.id, inviteId))
    .returning();

  await createAppNotification(userId, "Invite resent", `Invite resent to ${invite.email} for ${workspace.name}.`, String(workspace.id));
  return updated;
}

export async function cancelInvite(inviteId: number) {
  const { userId, email } = await requireUser();
  const invite = await db.query.workspaceInvites.findFirst({ where: eq(workspaceInvites.id, inviteId) });
  if (!invite) throw new Error("Invite not found.");
  const { role } = await getRoleForWorkspace(invite.workspaceId, userId, email);
  if (!canManage(role)) throw new Error("Only owners and admins can cancel invites.");

  const [updated] = await db
    .update(workspaceInvites)
    .set({ status: "cancelled", updatedAt: new Date() })
    .where(eq(workspaceInvites.id, inviteId))
    .returning();
  return updated;
}

export async function acceptInvite(token: string) {
  const { userId, email } = await requireUser();
  const invite = await db.query.workspaceInvites.findFirst({
    where: and(eq(workspaceInvites.token, token), eq(workspaceInvites.status, "pending")),
  });
  if (!invite) throw new Error("Invite not found or already used.");
  if (invite.email.toLowerCase() !== email) throw new Error("This invite belongs to a different email address.");

  await db.insert(workspaceMembers).values({
    workspaceId: invite.workspaceId,
    clerkUserId: userId,
    email,
    role: invite.role,
    status: "active",
    invitedByClerkUserId: invite.invitedByClerkUserId,
  });
  await db
    .update(workspaceInvites)
    .set({ status: "accepted", acceptedAt: new Date(), updatedAt: new Date() })
    .where(eq(workspaceInvites.id, invite.id));
  await switchWorkspace(invite.workspaceId);
  await createAppNotification(userId, "Invite accepted", "You joined a workspace.", String(invite.workspaceId));
  return { ok: true };
}

export async function upgradeWorkspacePlan(workspaceId: number, plan: WorkspacePlan, period: "month" | "year") {
  const { userId, email } = await requireUser();
  assertPlan(plan);
  const { workspace, role } = await getRoleForWorkspace(workspaceId, userId, email);
  if (!canBill(role)) throw new Error("Only owners and admins can manage billing.");

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const priceLookup = process.env[`STRIPE_${plan.toUpperCase()}_${period.toUpperCase()}_PRICE_ID`];

  if (stripeKey && priceLookup) {
    const body = new URLSearchParams({
      mode: "subscription",
      "line_items[0][price]": priceLookup,
      "line_items[0][quantity]": "1",
      success_url: `${appUrl}/dashboard?billing=success&workspace=${workspaceId}`,
      cancel_url: `${appUrl}/dashboard?billing=cancelled&workspace=${workspaceId}`,
      client_reference_id: String(workspaceId),
      "metadata[workspaceId]": String(workspaceId),
      "metadata[plan]": plan,
      "metadata[period]": period,
    });

    const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });
    if (!response.ok) throw new Error("Stripe checkout could not be started.");
    const session = await response.json();
    return { checkoutUrl: session.url as string };
  }

  const [updated] = await db
    .update(workspaces)
    .set({ plan, subscriptionStatus: "active", updatedAt: new Date() })
    .where(eq(workspaces.id, workspace.id))
    .returning();

  await createAppNotification(userId, "Plan upgraded", `${updated.name} is now on ${plan}.`, String(workspace.id));
  revalidatePath("/dashboard");
  return { checkoutUrl: null, workspace: updated };
}

export async function markProductUpdatesRead() {
  const { userId } = await requireUser();
  await ensureDefaultUpdates();
  const updates = await db.select({ id: productUpdates.id }).from(productUpdates);
  for (const update of updates) {
    await db
      .insert(productUpdateReads)
      .values({ clerkUserId: userId, updateId: update.id })
      .onConflictDoNothing();
  }
  return { ok: true };
}

export async function acceptInviteForWorkspace(workspaceId: number) {
  const { userId, email } = await requireUser();
  const invite = await db.query.workspaceInvites.findFirst({
    where: and(
      eq(workspaceInvites.workspaceId, workspaceId),
      eq(sql`LOWER(${workspaceInvites.email})`, email.toLowerCase()),
      eq(workspaceInvites.status, "pending")
    ),
  });
  if (!invite) throw new Error("No pending invitation found for your email in this workspace.");

  await db.insert(workspaceMembers).values({
    workspaceId,
    clerkUserId: userId,
    email,
    role: invite.role,
    status: "active",
    invitedByClerkUserId: invite.invitedByClerkUserId,
  });
  await db
    .update(workspaceInvites)
    .set({ status: "accepted", acceptedAt: new Date(), updatedAt: new Date() })
    .where(eq(workspaceInvites.id, invite.id));
  await switchWorkspace(workspaceId);
  await createAppNotification(userId, "Invite accepted", "You joined a workspace.", String(workspaceId));
  return { ok: true };
}

export async function getActiveWorkspacePlan(userId: string): Promise<WorkspacePlan> {
  const pref = await db.query.workspacePreferences.findFirst({
    where: eq(workspacePreferences.clerkUserId, userId),
  });
  if (!pref || !pref.activeWorkspaceId) return "Free";
  const ws = await db.query.workspaces.findFirst({
    where: eq(workspaces.id, pref.activeWorkspaceId),
  });
  return (ws?.plan || "Free") as WorkspacePlan;
}
