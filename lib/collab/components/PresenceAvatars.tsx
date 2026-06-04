"use client";

import React from "react";
import { usePresenceUsers } from "../usePresenceUsers";
import { CollaboratorAvatars } from "./CollaboratorAvatars";

export function PresenceAvatars({
  totalCollaboratorCount,
  max = 4,
  size = 28,
}: {
  totalCollaboratorCount?: number;
  max?: number;
  size?: number;
}) {
  const { others } = usePresenceUsers();
  if (others.length === 0) return null;
  return (
    <CollaboratorAvatars
      online={others}
      totalCount={totalCollaboratorCount}
      max={max}
      size={size}
    />
  );
}
