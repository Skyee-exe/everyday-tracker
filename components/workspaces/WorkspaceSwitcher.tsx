"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  BellDot,
  Briefcase,
  Check,
  Copy,
  Crown,
  ExternalLink,
  Loader2,
  Lock,
  Mail,
  Megaphone,
  Plus,
  RefreshCw,
  Shield,
  Sparkles,
  Users,
  X,
  Zap,
} from "lucide-react";
import { useWorkspace } from "./WorkspaceProvider";
import type { WorkspacePlan, WorkspaceRole, WorkspaceType } from "@/app/dashboard/workspaces/actions";
import type { WorkspaceInvite } from "@/db/schema";
import { CheckoutButton, SubscriptionDetailsButton, useSubscription } from "@clerk/nextjs/experimental";
import { Show } from "@clerk/nextjs";

const COLORS = ["#2563eb", "#dc2626", "#0891b2", "#7c3aed", "#16a34a", "#d97706", "#0f766e", "#be123c"];
const ROLES: WorkspaceRole[] = ["Admin", "Member", "Guest", "Owner"];
const TYPES: { value: WorkspaceType; label: string }[] = [
  { value: "personal", label: "Personal" },
  { value: "team", label: "Team" },
  { value: "company", label: "Company" },
  { value: "school", label: "School" },
];
const PLAN_COPY: Record<WorkspacePlan, { price: string; yearly: string; features: string[] }> = {
  Free: {
    price: "$0",
    yearly: "$0",
    features: [
      "Unlimited boards",
      "10 notes limit",
      "2 spaces limit",
      "5 AI actions / day",
      "No AI template builder",
    ],
  },
  Pro: {
    price: "$9.99",
    yearly: "$79.99",
    features: [
      "Unlimited boards",
      "Unlimited notes",
      "Unlimited spaces",
      "Unlimited AI actions",
      "AI template builder enabled",
      "Team permissions & roles",
    ],
  },
};

type Modal = "create" | "invite" | "billing" | "updates" | null;

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function Dialog({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="workspace-dialog-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="workspace-dialog" role="dialog" aria-modal="true" aria-label={title} onMouseDown={(event) => event.stopPropagation()}>
        <header className="workspace-dialog-head">
          <h2>{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}

function CreateWorkspaceDialog({ onClose }: { onClose: () => void }) {
  const { workspaces, createWorkspace, pending } = useWorkspace();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [type, setType] = useState<WorkspaceType>("team");
  const [icon, setIcon] = useState("Zap");
  const [error, setError] = useState("");

  const duplicate = workspaces.some((workspace) => workspace.name.toLowerCase() === name.trim().toLowerCase());
  const invalid = !name.trim() || name.length > 80 || description.length > 240 || duplicate;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim()) return setError("Workspace name is required.");
    if (duplicate) return setError("A workspace with this name already exists.");
    if (name.length > 80) return setError("Workspace name must be 80 characters or fewer.");
    setError("");
    await createWorkspace({ name, description, color, type, icon });
    onClose();
  }

  return (
    <Dialog title="Create workspace" onClose={onClose}>
      <form className="workspace-form" onSubmit={submit}>
        <label>
          <span>Name</span>
          <input value={name} maxLength={80} onChange={(event) => setName(event.target.value)} placeholder="Design Studio" />
        </label>
        <label>
          <span>Description</span>
          <textarea value={description} maxLength={240} onChange={(event) => setDescription(event.target.value)} placeholder="What this workspace is for" />
        </label>
        <label>
          <span>Icon upload</span>
          <input type="file" accept="image/*" onChange={(event) => setIcon(event.target.files?.[0]?.name || "Zap")} />
        </label>
        <label>
          <span>Type</span>
          <select value={type} onChange={(event) => setType(event.target.value as WorkspaceType)}>
            {TYPES.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </select>
        </label>
        <div className="workspace-field">
          <span>Color</span>
          <div className="workspace-swatches">
            {COLORS.map((item) => (
              <button key={item} type="button" className={color === item ? "is-active" : ""} style={{ background: item }} onClick={() => setColor(item)} aria-label={`Use ${item}`}>
                {color === item && <Check size={13} />}
              </button>
            ))}
          </div>
        </div>
        {(error || duplicate) && <p className="workspace-error">{error || "A workspace with this name already exists."}</p>}
        <button className="workspace-primary-btn" type="submit" disabled={invalid || pending}>
          {pending ? <Loader2 size={15} className="settings-spin" /> : <Plus size={15} />}
          Create workspace
        </button>
      </form>
    </Dialog>
  );
}

function InviteMembersDialog({ onClose }: { onClose: () => void }) {
  const { activeWorkspace, canManageWorkspace, inviteMembers, loadInvites, resendInvite, cancelInvite, notify } = useWorkspace();
  const [emails, setEmails] = useState("");
  const [role, setRole] = useState<WorkspaceRole>("Member");
  const [invites, setInvites] = useState<WorkspaceInvite[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!activeWorkspace || !canManageWorkspace) return;
    setLoading(true);
    loadInvites(activeWorkspace.id)
      .then(setInvites)
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load invites."))
      .finally(() => setLoading(false));
  }, [activeWorkspace, canManageWorkspace, loadInvites]);

  const inviteLink = activeWorkspace && typeof window !== "undefined" ? `${window.location.origin}/dashboard?invite=${activeWorkspace.id}` : "";

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!activeWorkspace) return;
    const parsed = emails.split(/[\n,;]/).map((email) => email.trim()).filter(Boolean);
    try {
      const next = await inviteMembers(activeWorkspace.id, parsed, role);
      setInvites((current) => [...next, ...current]);
      setEmails("");
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invite failed.");
    }
  }

  if (!canManageWorkspace) {
    return (
      <Dialog title="Invite members" onClose={onClose}>
        <div className="workspace-empty">
          <Lock size={20} />
          <strong>No permission</strong>
          <p>Only owners and admins can invite members to this workspace.</p>
        </div>
      </Dialog>
    );
  }

  return (
    <Dialog title="Invite members" onClose={onClose}>
      <form className="workspace-form" onSubmit={submit}>
        <label>
          <span>Email invites</span>
          <textarea value={emails} onChange={(event) => setEmails(event.target.value)} placeholder="alex@example.com, priya@example.com" />
        </label>
        <label>
          <span>Role</span>
          <select value={role} onChange={(event) => setRole(event.target.value as WorkspaceRole)}>
            {ROLES.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </label>
        {error && <p className="workspace-error">{error}</p>}
        <div className="workspace-dialog-actions">
          <button className="workspace-secondary-btn" type="button" onClick={() => navigator.clipboard.writeText(inviteLink).then(() => notify("info", "Invite link copied"))}>
            <Copy size={14} />
            Copy link
          </button>
          <button className="workspace-primary-btn" type="submit">
            <Mail size={14} />
            Send invites
          </button>
        </div>
      </form>
      <div className="workspace-invite-list">
        {loading && <p className="workspace-muted">Loading invites...</p>}
        {!loading && invites.length === 0 && <p className="workspace-muted">No pending invites yet.</p>}
        {invites.map((invite) => (
          <div key={invite.id} className="workspace-invite-row">
            <div>
              <strong>{invite.email}</strong>
              <span>{invite.role} · {invite.status}</span>
            </div>
            <button type="button" onClick={() => {
              const specificLink = `${window.location.origin}/dashboard?invite-token=${invite.token}`;
              navigator.clipboard.writeText(specificLink).then(() => notify("info", "Token invite link copied"));
            }} title="Copy token invite link" aria-label="Copy token invite link">
              <Copy size={14} />
            </button>
            <button type="button" onClick={() => resendInvite(invite.id).then((updated) => setInvites((current) => current.map((item) => item.id === updated.id ? updated : item)))} aria-label="Resend invite">
              <RefreshCw size={14} />
            </button>
            <button type="button" onClick={() => cancelInvite(invite.id).then((updated) => setInvites((current) => current.map((item) => item.id === updated.id ? updated : item)))} aria-label="Cancel invite">
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </Dialog>
  );
}

function BillingDialog({ onClose }: { onClose: () => void }) {
  const { activeWorkspace, canManageBilling } = useWorkspace();
  const [period, setPeriod] = useState<"month" | "year">("month");

  const proPlanId = process.env.NEXT_PUBLIC_CLERK_PRO_PLAN_ID;
  const subscription = useSubscription({ for: "user" });
  const subscriptionData = subscription.data as any;
  const items = Array.isArray(subscriptionData?.subscriptionItems) ? subscriptionData.subscriptionItems : [];
  const isPaid = Boolean(proPlanId && items.some((item: any) => item?.plan?.id === proPlanId));

  return (
    <Dialog title="Upgrade plan" onClose={onClose}>
      {!canManageBilling && (
        <div className="workspace-warning">
          <Shield size={16} />
          Only owners and admins can change billing.
        </div>
      )}
      <div className="workspace-billing-head">
        <div>
          <span>Current plan</span>
          <strong>{subscription.isFetching ? "Loading..." : isPaid ? "Everyday Pro" : "Everyday Free"}</strong>
        </div>
        <div className="workspace-segment">
          <button type="button" className={period === "month" ? "is-active" : ""} onClick={() => setPeriod("month")}>Monthly</button>
          <button type="button" className={period === "year" ? "is-active" : ""} onClick={() => setPeriod("year")}>Yearly</button>
        </div>
      </div>
      <div className="workspace-plan-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
        {/* Free Plan Card */}
        <div className={`workspace-plan${!isPaid ? " is-current" : ""}`}>
          <h3>Free</h3>
          <strong>$0</strong>
          <span>per seat/month</span>
          <ul>
            {PLAN_COPY.Free.features.map((feature) => <li key={feature}>{feature}</li>)}
          </ul>
          <button type="button" disabled style={{ width: "100%" }}>
            Current
          </button>
        </div>

        {/* Pro Plan Card */}
        <div className={`workspace-plan${isPaid ? " is-current" : ""}`}>
          <h3>Pro</h3>
          <strong>{period === "month" ? PLAN_COPY.Pro.price : PLAN_COPY.Pro.yearly}</strong>
          <span>{period === "month" ? "per seat/month" : "per seat/year"}</span>
          <ul>
            {PLAN_COPY.Pro.features.map((feature) => <li key={feature}>{feature}</li>)}
          </ul>
          {isPaid ? (
            <Show when="signed-in">
              <SubscriptionDetailsButton>
                <button type="button" className="workspace-primary-btn" style={{ width: "100%" }}>
                  Manage plan
                </button>
              </SubscriptionDetailsButton>
            </Show>
          ) : proPlanId ? (
            <Show when="signed-in">
              <CheckoutButton planId={proPlanId} planPeriod={period === "year" ? "annual" : "month"}>
                <button type="button" className="workspace-primary-btn" style={{ width: "100%" }} disabled={!canManageBilling || subscription.isFetching}>
                  <Sparkles size={14} />
                  {subscription.isFetching ? "Loading..." : "Upgrade to Pro"}
                </button>
              </CheckoutButton>
            </Show>
          ) : (
            <button type="button" disabled style={{ width: "100%" }}>
              Pro plan ID missing
            </button>
          )}
        </div>
      </div>
    </Dialog>
  );
}

function UpdatesDialog({ onClose }: { onClose: () => void }) {
  const { updates, markUpdatesRead } = useWorkspace();

  useEffect(() => {
    markUpdatesRead();
  }, [markUpdatesRead]);

  return (
    <Dialog title="What's new" onClose={onClose}>
      <div className="workspace-updates">
        {updates.length === 0 && (
          <div className="workspace-empty">
            <Megaphone size={20} />
            <strong>No updates yet</strong>
            <p>Release notes and feature announcements will show up here.</p>
          </div>
        )}
        {updates.map((update) => (
          <article key={update.id} className="workspace-update-row">
            <span>{update.version || update.category}</span>
            <h3>{update.title}</h3>
            <p>{update.body}</p>
          </article>
        ))}
      </div>
    </Dialog>
  );
}

export default function WorkspaceSwitcher({ onClose, collapsed }: { onClose: () => void; collapsed: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const {
    activeWorkspace,
    workspaces,
    loading,
    switchingId,
    unreadUpdates,
    canManageWorkspace,
    switchWorkspace,
    error,
  } = useWorkspace();
  const [modal, setModal] = useState<Modal>(null);

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) onClose();
    };
    window.setTimeout(() => window.addEventListener("mousedown", handler), 0);
    return () => window.removeEventListener("mousedown", handler);
  }, [onClose]);

  const visibleName = activeWorkspace?.name || (loading ? "Loading workspace" : "No workspace");
  const plan = activeWorkspace?.plan || "Free";
  const activeRole = activeWorkspace?.role || "Guest";
  const activeColor = activeWorkspace?.color || "#2563eb";
  const roleHint = useMemo(() => {
    if (activeRole === "Guest") return "Guests can view shared areas only.";
    if (activeRole === "Member") return "Members can work, but cannot manage invites or billing.";
    return "You can manage workspace settings.";
  }, [activeRole]);

  return (
    <>
      <div ref={ref} className={`logo-dropdown workspace-switcher${collapsed ? " logo-dropdown--collapsed" : ""}`} role="menu">
        <div className="logo-dd-header workspace-switcher-header">
          <span className="logo-dd-ws-dot" style={{ background: activeColor }}>{initials(visibleName)}</span>
          <div className="workspace-header-copy">
            <div className="logo-dd-ws-name">{visibleName}</div>
            <span>{activeRole} · {roleHint}</span>
          </div>
          <span className={`logo-dd-plan logo-dd-plan--${plan.toLowerCase()}`}>
            <Crown size={10} fill="currentColor" strokeWidth={0} />
            {plan}
          </span>
        </div>
        <div className="logo-dd-divider" />

        <p className="logo-dd-section">Workspaces</p>
        {loading && <div className="workspace-skeleton">Loading workspaces...</div>}
        {!loading && workspaces.length === 0 && (
          <div className="workspace-empty workspace-empty--compact">
            <Briefcase size={18} />
            <strong>No workspaces</strong>
            <button type="button" onClick={() => setModal("create")}>Create one</button>
          </div>
        )}
        {workspaces.map((workspace) => (
          <button key={workspace.id} className={`logo-dd-item logo-dd-item--ws${workspace.active ? " is-active" : ""}`} onClick={() => switchWorkspace(workspace.id)} disabled={switchingId !== null} type="button">
            <span className="logo-dd-ws-dot" style={{ background: workspace.color }}>{initials(workspace.name)}</span>
            <div className="logo-dd-ws-info">
              <span className="logo-dd-ws-label">{workspace.name}</span>
              <span className="logo-dd-ws-plan">{workspace.plan} · {workspace.role}</span>
            </div>
            {switchingId === workspace.id ? <Loader2 size={13} className="settings-spin logo-dd-check" /> : workspace.active && <Check size={13} className="logo-dd-check" strokeWidth={2.5} />}
          </button>
        ))}

        <button className="logo-dd-item logo-dd-item--muted" onClick={() => setModal("create")} type="button">
          <span className="logo-dd-icon-wrap logo-dd-icon-wrap--dashed"><Plus size={13} strokeWidth={2.5} /></span>
          <span>Add workspace</span>
        </button>

        <div className="logo-dd-divider" />
        <p className="logo-dd-section">Manage</p>
        <button className="logo-dd-item" onClick={() => setModal("invite")} type="button">
          <span className="logo-dd-icon-wrap" style={{ background: "rgba(37,99,235,0.1)", color: "#2563eb" }}><Users size={13} /></span>
          <span>Invite members</span>
          {!canManageWorkspace && <Lock size={11} className="logo-dd-ext" />}
          {canManageWorkspace && <ExternalLink size={11} className="logo-dd-ext" />}
        </button>
        <button className="logo-dd-item" onClick={() => setModal("billing")} type="button">
          <span className="logo-dd-icon-wrap" style={{ background: "rgba(124,58,237,0.1)", color: "#7c3aed" }}><Crown size={13} /></span>
          <span>{plan === "Pro" ? "Billing & Subscription" : "Upgrade plan"}</span>
          {plan !== "Pro" && <span className="logo-dd-badge-tag">Save 30%</span>}
        </button>
        <button className="logo-dd-item" onClick={() => setModal("updates")} type="button">
          <span className="logo-dd-icon-wrap" style={{ background: "rgba(14,165,233,0.1)", color: "#0ea5e9" }}><Megaphone size={13} /></span>
          <span>What&apos;s new</span>
          {unreadUpdates > 0 ? <span className="logo-dd-new-dot" /> : <BellDot size={12} className="logo-dd-ext" />}
        </button>
        {error && <p className="workspace-error workspace-error--dropdown">{error}</p>}
        <div className="logo-dd-footer">
          <span>Everyday Workspace</span>
          <span>v1.1.0</span>
        </div>
      </div>
      {modal === "create" && <CreateWorkspaceDialog onClose={() => setModal(null)} />}
      {modal === "invite" && <InviteMembersDialog onClose={() => setModal(null)} />}
      {modal === "billing" && <BillingDialog onClose={() => setModal(null)} />}
      {modal === "updates" && <UpdatesDialog onClose={() => setModal(null)} />}
    </>
  );
}
