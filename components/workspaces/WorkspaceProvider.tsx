"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useSubscription } from "@clerk/nextjs/experimental";
import {
  cancelInvite as cancelInviteAction,
  createWorkspace as createWorkspaceAction,
  getWorkspaceInvites,
  getWorkspaceState,
  inviteMembers as inviteMembersAction,
  markProductUpdatesRead,
  resendInvite as resendInviteAction,
  switchWorkspace as switchWorkspaceAction,
  upgradeWorkspacePlan,
  acceptInvite as acceptInviteAction,
  acceptInviteForWorkspace,
  type WorkspacePlan,
  type WorkspaceRole,
  type WorkspaceState,
  type WorkspaceSummary,
  type WorkspaceType,
} from "@/app/dashboard/workspaces/actions";
import type { WorkspaceInvite } from "@/db/schema";

type ToastKind = "success" | "error" | "warning" | "info";

type Toast = {
  id: number;
  kind: ToastKind;
  title: string;
  message?: string;
};

type CreateWorkspaceInput = {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  type?: WorkspaceType;
};

type WorkspaceContextValue = WorkspaceState & {
  loading: boolean;
  switchingId: number | null;
  pending: boolean;
  error: string;
  toasts: Toast[];
  canManageWorkspace: boolean;
  canManageBilling: boolean;
  refresh: () => Promise<void>;
  switchWorkspace: (workspaceId: number) => Promise<void>;
  createWorkspace: (input: CreateWorkspaceInput) => Promise<void>;
  loadInvites: (workspaceId: number) => Promise<WorkspaceInvite[]>;
  inviteMembers: (workspaceId: number, emails: string[], role: WorkspaceRole) => Promise<WorkspaceInvite[]>;
  resendInvite: (inviteId: number) => Promise<WorkspaceInvite>;
  cancelInvite: (inviteId: number) => Promise<WorkspaceInvite>;
  upgradePlan: (workspaceId: number, plan: WorkspacePlan, period: "month" | "year") => Promise<void>;
  markUpdatesRead: () => Promise<void>;
  notify: (kind: ToastKind, title: string, message?: string) => void;
  dismissToast: (id: number) => void;
};

const emptyState: WorkspaceState = {
  workspaces: [],
  activeWorkspace: null,
  unreadUpdates: 0,
  updates: [],
};

const WorkspaceContext = createContext<WorkspaceContextValue | undefined>(undefined);

function canManage(role?: WorkspaceRole) {
  return role === "Owner" || role === "Admin";
}

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState<WorkspaceState>(emptyState);
  const [loading, setLoading] = useState(true);
  const [switchingId, setSwitchingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [pending, startTransition] = useTransition();
  
  const proPlanId = process.env.NEXT_PUBLIC_CLERK_PRO_PLAN_ID;
  const subscription = useSubscription({ for: "user" });

  const isPaid = useMemo(() => {
    if (!proPlanId || subscription.isFetching) return null;
    const subscriptionData = subscription.data as any;
    const items = Array.isArray(subscriptionData?.subscriptionItems) ? subscriptionData.subscriptionItems : [];
    return items.some((item: any) => item?.plan?.id === proPlanId);
  }, [subscription, proPlanId]);

  const notify = useCallback((kind: ToastKind, title: string, message?: string) => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((current) => [...current, { id, kind, title, message }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 4200);
  }, []);

  const refresh = useCallback(async () => {
    try {
      setError("");
      const next = await getWorkspaceState();
      setState(next);
      if (next.activeWorkspace) {
        localStorage.setItem("everyday.activeWorkspaceId", String(next.activeWorkspace.id));
        localStorage.setItem("everyday.workspaceRole", next.activeWorkspace.role);
        localStorage.setItem("everyday.subscriptionTier", next.activeWorkspace.plan);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not load workspaces.";
      setError(message);
      notify("error", "Workspace load failed", message);
    } finally {
      setLoading(false);
    }
  }, [notify]);

  const broadcastRefresh = useCallback(() => {
    window.dispatchEvent(new Event("workspace-switch"));
    window.dispatchEvent(new Event("sidebar-update"));
    router.refresh();
  }, [router]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const token = params.get("invite-token");
    const workspaceIdParam = params.get("invite");
    
    if (token || workspaceIdParam) {
      // Clear query params
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
      
      setLoading(true);
      const promise = token 
        ? acceptInviteAction(token)
        : acceptInviteForWorkspace(Number(workspaceIdParam));
        
      promise
        .then(async () => {
          notify("success", "Joined workspace", "You successfully joined the workspace.");
          await refresh();
          broadcastRefresh();
        })
        .catch((err) => {
          const message = err instanceof Error ? err.message : "Failed to join workspace.";
          notify("error", "Invite failed", message);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [refresh, broadcastRefresh, notify]);

  const switchWorkspace = useCallback(
    async (workspaceId: number) => {
      const previous = state;
      const target = state.workspaces.find((workspace) => workspace.id === workspaceId);
      if (!target || target.id === state.activeWorkspace?.id) return;

      setSwitchingId(workspaceId);
      setState((current) => ({
        ...current,
        activeWorkspace: target,
        workspaces: current.workspaces.map((workspace) => ({ ...workspace, active: workspace.id === workspaceId })),
      }));
      localStorage.setItem("everyday.activeWorkspaceId", String(workspaceId));
      localStorage.setItem("everyday.workspaceRole", target.role);
      localStorage.setItem("everyday.subscriptionTier", target.plan);

      try {
        await switchWorkspaceAction(workspaceId);
        notify("success", "Workspace switched", `Now viewing ${target.name}.`);
        await refresh();
        broadcastRefresh();
      } catch (err) {
        setState(previous);
        const message = err instanceof Error ? err.message : "Could not switch workspace.";
        notify("error", "Switch failed", message);
      } finally {
        setSwitchingId(null);
      }
    },
    [broadcastRefresh, notify, refresh, state]
  );

  const createWorkspace = useCallback(
    async (input: CreateWorkspaceInput) => {
      try {
        const created = await createWorkspaceAction(input);
        notify("success", "Workspace created", `${created.name} is now active.`);
        await refresh();
        broadcastRefresh();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Could not create workspace.";
        notify("error", "Create failed", message);
        throw err;
      }
    },
    [broadcastRefresh, notify, refresh]
  );

  const loadInvites = useCallback(async (workspaceId: number) => getWorkspaceInvites(workspaceId), []);

  const inviteMembers = useCallback(
    async (workspaceId: number, emails: string[], role: WorkspaceRole) => {
      try {
        const invites = await inviteMembersAction({ workspaceId, emails, role });
        notify("success", "Invite sent", `${invites.length} invite${invites.length === 1 ? "" : "s"} created.`);
        await refresh();
        return invites;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Could not invite members.";
        notify("error", "Invite failed", message);
        throw err;
      }
    },
    [notify, refresh]
  );

  const resendInvite = useCallback(
    async (inviteId: number) => {
      const invite = await resendInviteAction(inviteId);
      notify("info", "Invite resent", invite.email);
      return invite;
    },
    [notify]
  );

  const cancelInvite = useCallback(
    async (inviteId: number) => {
      const invite = await cancelInviteAction(inviteId);
      notify("warning", "Invite cancelled", invite.email);
      return invite;
    },
    [notify]
  );

  const upgradePlan = useCallback(
    async (workspaceId: number, plan: WorkspacePlan, period: "month" | "year") => {
      try {
        const result = await upgradeWorkspacePlan(workspaceId, plan, period);
        if (result.checkoutUrl) {
          window.location.assign(result.checkoutUrl);
          return;
        }
        notify("success", "Plan upgraded", `${plan} is active.`);
        await refresh();
        broadcastRefresh();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Billing could not be updated.";
        notify("error", "Billing failed", message);
        throw err;
      }
    },
    [broadcastRefresh, notify, refresh]
  );

  useEffect(() => {
    if (isPaid === null || loading) return;
    const dbPlan = state.activeWorkspace?.plan;
    if (!dbPlan || !state.activeWorkspace) return;

    const role = state.activeWorkspace.role;
    if (role !== "Owner" && role !== "Admin") return;

    const expectedPlan = isPaid ? "Pro" : "Free";
    if (dbPlan !== expectedPlan) {
      console.log(`Syncing workspace plan to match Clerk subscription: expected ${expectedPlan}, DB has ${dbPlan}`);
      upgradePlan(state.activeWorkspace.id, expectedPlan, "month").catch((err) => {
        console.error("Failed to sync workspace plan with Clerk subscription:", err);
      });
    }
  }, [isPaid, state.activeWorkspace, loading, upgradePlan]);

  const markUpdatesRead = useCallback(async () => {
    await markProductUpdatesRead();
    setState((current) => ({
      ...current,
      unreadUpdates: 0,
      updates: current.updates.map((update) => ({ ...update, isRead: true })),
    }));
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      ...state,
      loading,
      switchingId,
      pending,
      error,
      toasts,
      canManageWorkspace: canManage(state.activeWorkspace?.role),
      canManageBilling: canManage(state.activeWorkspace?.role),
      refresh,
      switchWorkspace,
      createWorkspace: (input) =>
        new Promise((resolve, reject) => {
          startTransition(() => {
            createWorkspace(input).then(resolve).catch(reject);
          });
        }),
      loadInvites,
      inviteMembers,
      resendInvite,
      cancelInvite,
      upgradePlan,
      markUpdatesRead,
      notify,
      dismissToast,
    }),
    [
      state,
      loading,
      switchingId,
      pending,
      error,
      toasts,
      refresh,
      switchWorkspace,
      createWorkspace,
      loadInvites,
      inviteMembers,
      resendInvite,
      cancelInvite,
      upgradePlan,
      markUpdatesRead,
      notify,
      dismissToast,
    ]
  );

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
      <div className="workspace-toast-stack" aria-live="polite">
        {toasts.map((toast) => (
          <button key={toast.id} className={`workspace-toast workspace-toast--${toast.kind}`} onClick={() => dismissToast(toast.id)} type="button">
            <strong>{toast.title}</strong>
            {toast.message && <span>{toast.message}</span>}
          </button>
        ))}
      </div>
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) throw new Error("useWorkspace must be used inside WorkspaceProvider");
  return context;
}
