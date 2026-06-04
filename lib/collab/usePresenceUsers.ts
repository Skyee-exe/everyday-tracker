"use client";

import { useOthers } from "./liveblocks.config";
import type { Presence } from "./types";

export function usePresenceUsers(): {
  others: Array<Presence & { connectionId: number }>;
  onlineCount: number;
} {
  const others = useOthers();
  const list = others.map((o) => ({
    connectionId: o.connectionId,
    name: (o.presence?.name as string) || "Anonymous",
    email: (o.presence?.email as string) || "",
    avatar: o.presence?.avatar as string | undefined,
    viewingTaskId:
      (o.presence?.viewingTaskId as number | null | undefined) ?? null,
  }));
  return { others: list, onlineCount: list.length };
}
