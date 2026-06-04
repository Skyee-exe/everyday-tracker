"use client";

import React from "react";
import { colorFromName, getInitials } from "../utils";

export function Avatar({
  name,
  email,
  imageUrl,
  size = 28,
  showOnlineDot = false,
  isOnline = false,
  title,
}: {
  name?: string | null;
  email?: string | null;
  imageUrl?: string | null;
  size?: number;
  showOnlineDot?: boolean;
  isOnline?: boolean;
  title?: string;
}) {
  const initials = getInitials(name, email);
  const color = colorFromName(name || email);
  return (
    <span
      className={`collab-avatar${isOnline ? " collab-avatar--online" : ""}`}
      style={{ width: size, height: size }}
      title={title}
    >
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt={name || email || "user"} />
      ) : (
        <span
          className="collab-avatar-initials"
          style={{ background: color }}
        >
          {initials}
        </span>
      )}
      {showOnlineDot && (
        <span
          className="collab-avatar-dot"
          style={{
            background: isOnline ? "#10b981" : "#cbd5e1",
            width: Math.max(7, size * 0.28),
            height: Math.max(7, size * 0.28),
          }}
        />
      )}
    </span>
  );
}
