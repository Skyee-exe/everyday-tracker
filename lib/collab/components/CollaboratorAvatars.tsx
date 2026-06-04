"use client";

import React from "react";
import { Avatar } from "./Avatar";
import type { Presence } from "../types";

export function CollaboratorAvatars({
  online,
  totalCount,
  size = 28,
  max = 4,
  onlineOnly = false,
}: {
  online: Array<Presence & { connectionId: number }>;
  totalCount?: number;
  size?: number;
  max?: number;
  onlineOnly?: boolean;
}) {
  const visible = online.slice(0, max);
  const overflow =
    (totalCount ?? online.length) - visible.length;

  return (
    <div className="collab-avatars" aria-label="Collaborators">
      {visible.map((p) => (
        <Avatar
          key={p.connectionId}
          name={p.name}
          email={p.email}
          imageUrl={p.avatar}
          size={size}
          showOnlineDot
          isOnline
          title={`${p.name}${p.email ? ` · ${p.email}` : ""}`}
        />
      ))}
      {!onlineOnly && overflow > 0 && (
        <span
          className="collab-avatar collab-avatar--overflow"
          style={{ width: size, height: size }}
          title={`${overflow} more`}
        >
          <span className="collab-avatar-initials">+{overflow}</span>
        </span>
      )}
    </div>
  );
}
