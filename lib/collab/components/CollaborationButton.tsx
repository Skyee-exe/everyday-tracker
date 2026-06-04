"use client";

import React from "react";
import { Users } from "lucide-react";

export function CollaborationButton({
  onClick,
  onlineCount,
}: {
  onClick: () => void;
  onlineCount?: number;
}) {
  return (
    <button
      className="collab-button"
      onClick={onClick}
      type="button"
      title="Share & collaborate"
    >
      <Users size={14} />
      <span>Share</span>
      {typeof onlineCount === "number" && onlineCount > 0 && (
        <span className="collab-button-dot" />
      )}
    </button>
  );
}
