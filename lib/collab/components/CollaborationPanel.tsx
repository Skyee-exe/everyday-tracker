"use client";

import React, { useEffect, useState } from "react";
import { X, Users, Share2, Settings2, Mail, Shield, Trash2 } from "lucide-react";
import { Avatar } from "./Avatar";
import { ROLE_LABELS, ALL_ROLES, isCollabRole, type CollabRole } from "../permissions";
import { timeAgo } from "../utils";
import type { SharedCollabUser } from "../types";

type Collaborator = {
  id: number;
  email: string;
  role: string;
  acceptedAt?: string | Date | null;
  createdAt?: string | Date | null;
  user?: {
    id: number;
    name?: string | null;
    email: string;
    imageUrl?: string | null;
    lastSignedInAt?: string | Date | null;
  } | null;
};

export function CollaborationPanel({
  open,
  onClose,
  boardId,
  boardName,
  myRole,
  currentUserEmail,
}: {
  open: boolean;
  onClose: () => void;
  boardId: number;
  boardName: string;
  myRole: CollabRole | null;
  currentUserEmail?: string | null;
}) {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<CollabRole>("editor");
  const [inviting, setInviting] = useState(false);
  const [onlinePresence, setOnlinePresence] = useState<Set<string>>(new Set());

  const isOwner = myRole === "owner";
  const canEdit = isOwner;

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(null);
    fetch(`/api/boards/${boardId}/collaborators`, { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) throw new Error("Failed to load collaborators");
        return r.json();
      })
      .then((data) => setCollaborators(data.collaborators ?? []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [open, boardId]);

  useEffect(() => {
    if (!open) return;
    const interval = setInterval(async () => {
      try {
        const r = await fetch(`/api/boards/${boardId}/presence`, {
          cache: "no-store",
        });
        if (r.ok) {
          const data = await r.json();
          setOnlinePresence(new Set(data.onlineEmails ?? []));
        }
      } catch {
        // ignore
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [open, boardId]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;
    const email = inviteEmail.trim().toLowerCase();
    if (!email || !email.includes("@")) return;
    setInviting(true);
    setError(null);
    try {
      const r = await fetch(`/api/boards/${boardId}/collaborators`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, role: inviteRole }),
      });
      if (!r.ok) {
        const t = await r.json().catch(() => ({}));
        throw new Error(t.error || "Invite failed");
      }
      const data = await r.json();
      setCollaborators((prev) => {
        const filtered = prev.filter(
          (c) => c.email.toLowerCase() !== email
        );
        return [...filtered, data.collaborator];
      });
      setInviteEmail("");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setInviting(false);
    }
  };

  const handleRoleChange = async (id: number, role: CollabRole) => {
    if (!canEdit) return;
    const r = await fetch(`/api/boards/${boardId}/collaborators/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ role }),
    });
    if (r.ok) {
      const data = await r.json();
      setCollaborators((prev) =>
        prev.map((c) => (c.id === id ? { ...c, role: data.collaborator.role } : c))
      );
    }
  };

  const handleRemove = async (id: number) => {
    if (!canEdit) return;
    if (!confirm("Remove this collaborator?")) return;
    const r = await fetch(`/api/boards/${boardId}/collaborators/${id}`, {
      method: "DELETE",
    });
    if (r.ok) {
      setCollaborators((prev) => prev.filter((c) => c.id !== id));
    }
  };

  if (!open) return null;

  const sorted = [...collaborators].sort((a, b) => {
    const order: Record<string, number> = { owner: 0, editor: 1, viewer: 2 };
    return (order[a.role] ?? 9) - (order[b.role] ?? 9);
  });

  return (
    <>
      <div className="collab-sheet-backdrop" onClick={onClose} />
      <aside
        className="collab-sheet"
        role="dialog"
        aria-modal="true"
        aria-label="Collaboration"
      >
        <div className="collab-sheet-header">
          <div className="collab-sheet-title-row">
            <Users size={18} strokeWidth={2} />
            <h2>Collaboration</h2>
          </div>
          <button
            className="collab-sheet-close"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="collab-sheet-body">
          <p className="collab-sheet-subtitle">
            Sharing <strong>{boardName}</strong>
          </p>

          <section className="collab-section">
            <div className="collab-section-head">
              <span className="collab-section-label">
                Current Collaborators
              </span>
              <span className="collab-section-count">
                {sorted.length}
              </span>
            </div>

            {loading ? (
              <div className="collab-skeleton-list">
                <div className="collab-skeleton-row" />
                <div className="collab-skeleton-row" />
              </div>
            ) : sorted.length === 0 ? (
              <div className="collab-empty">
                <p className="collab-empty-title">This board is private.</p>
                <p className="collab-empty-desc">
                  Invite teammates to collaborate.
                </p>
              </div>
            ) : (
              <ul className="collab-list">
                {sorted.map((c) => {
                  const isOnline = c.user
                    ? onlinePresence.has(c.user.email.toLowerCase())
                    : false;
                  const name = c.user?.name || c.email.split("@")[0];
                  return (
                    <li key={c.id} className="collab-row">
                      <Avatar
                        name={name}
                        email={c.email}
                        imageUrl={c.user?.imageUrl}
                        size={36}
                        showOnlineDot
                        isOnline={isOnline}
                      />
                      <div className="collab-row-meta">
                        <div className="collab-row-line">
                          <span className="collab-row-name">
                            {name}
                            {c.user?.email === currentUserEmail && " (you)"}
                          </span>
                          <span
                            className={`collab-role-badge collab-role-badge--${c.role}`}
                          >
                            {isCollabRole(c.role)
                              ? ROLE_LABELS[c.role]
                              : c.role}
                          </span>
                        </div>
                        <div className="collab-row-sub">
                          <span className="collab-row-email">{c.email}</span>
                          <span className="collab-row-sep">·</span>
                          <span
                            className={`collab-row-status${
                              isOnline ? " collab-row-status--online" : ""
                            }`}
                          >
                            <span
                              className="collab-row-status-dot"
                              style={{
                                background: isOnline ? "#10b981" : "#cbd5e1",
                              }}
                            />
                            {isOnline
                              ? "Online"
                              : c.user?.lastSignedInAt
                              ? `Active ${timeAgo(c.user.lastSignedInAt)}`
                              : c.acceptedAt
                              ? `Joined ${timeAgo(c.acceptedAt)}`
                              : "Pending invite"}
                          </span>
                        </div>
                      </div>
                      {canEdit && c.role !== "owner" && (
                        <div className="collab-row-actions">
                          <select
                            className="collab-row-role-select"
                            value={c.role}
                            onChange={(e) =>
                              handleRoleChange(
                                c.id,
                                e.target.value as CollabRole
                              )
                            }
                            aria-label="Change role"
                          >
                            {ALL_ROLES.filter((r) => r !== "owner").map(
                              (r) => (
                                <option key={r} value={r}>
                                  {ROLE_LABELS[r]}
                                </option>
                              )
                            )}
                          </select>
                          <button
                            className="collab-row-remove"
                            onClick={() => handleRemove(c.id)}
                            title="Remove"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {canEdit ? (
            <section className="collab-section">
              <div className="collab-section-head">
                <span className="collab-section-label">
                  <Share2 size={13} />
                  Invite User
                </span>
              </div>
              <form className="collab-invite" onSubmit={handleInvite}>
                <div className="collab-invite-field">
                  <Mail size={14} className="collab-invite-icon" />
                  <input
                    type="email"
                    required
                    placeholder="teammate@email.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="collab-invite-input"
                  />
                </div>
                <div className="collab-invite-row">
                  <div className="collab-invite-role">
                    <Shield size={13} />
                    <select
                      value={inviteRole}
                      onChange={(e) =>
                        setInviteRole(e.target.value as CollabRole)
                      }
                      aria-label="Invite role"
                    >
                      <option value="editor">Editor</option>
                      <option value="viewer">Viewer</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    className="collab-invite-btn"
                    disabled={inviting || !inviteEmail}
                  >
                    {inviting ? "Inviting…" : "Invite"}
                  </button>
                </div>
                {error && <p className="collab-invite-error">{error}</p>}
              </form>
            </section>
          ) : (
            <p className="collab-readonly-note">
              <Settings2 size={12} />
              Only the board owner can manage collaborators.
            </p>
          )}
        </div>
      </aside>
    </>
  );
}
