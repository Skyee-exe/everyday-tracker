"use client";

import React from "react";
import { usePresenceUsers } from "../usePresenceUsers";

export function PresenceBanner({ entityName }: { entityName: string }) {
  const { others } = usePresenceUsers();
  if (others.length === 0) return null;

  const first = others[0];
  const rest = others.length - 1;

  let message: string;
  if (others.length === 1) {
    message = `${first.name} is viewing this ${entityName}`;
  } else if (others.length === 2) {
    message = `${first.name} and ${others[1].name} are viewing this ${entityName}`;
  } else {
    message = `${first.name} and ${rest} other${rest > 1 ? "s" : ""} are viewing this ${entityName}`;
  }

  return (
    <div className="collab-presence-banner" aria-live="polite">
      <span className="collab-presence-pulse" />
      <span>{message}</span>
    </div>
  );
}
