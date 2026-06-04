"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useUser } from "@clerk/nextjs";
import { LiveblocksProvider, RoomProvider } from "@liveblocks/react";
import { useSelf, useUpdateMyPresence } from "./liveblocks.config";
import type { Presence } from "./types";

function PresenceSeeder() {
  const [seeded, setSeeded] = useState(false);
  const updateMyPresence = useUpdateMyPresence();
  const myPresence = useSelf((s) => s.presence);
  const { user, isLoaded } = useUser();

  useEffect(() => {
    if (!isLoaded) return;
    if (seeded) return;
    if (!user) return;
    const name =
      [user.firstName, user.lastName].filter(Boolean).join(" ") ||
      user.username ||
      user.emailAddresses?.[0]?.emailAddress ||
      "Anonymous";
    const email = user.emailAddresses?.[0]?.emailAddress || "";
    const avatar = user.imageUrl || undefined;
    const next: Partial<Presence> = {
      name,
      email,
      avatar,
      viewingTaskId: (myPresence?.viewingTaskId as number | null) ?? null,
    };
    updateMyPresence(next);
    setSeeded(true);
  }, [isLoaded, user, updateMyPresence, myPresence?.viewingTaskId, seeded]);

  return null;
}

export function CollabRoom({
  roomId,
  children,
  fallback = null,
}: {
  roomId: string;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  if (!roomId) return <>{fallback}</>;
  return (
    <LiveblocksProvider 
      authEndpoint="/api/liveblocks/auth"
      resolveUsers={async ({ userIds }) => {
        try {
          const searchParams = new URLSearchParams();
          userIds.forEach((id) => searchParams.append("userIds", id));
          const response = await fetch(`/api/liveblocks/users?${searchParams}`);
          return await response.json();
        } catch {
          return [];
        }
      }}
    >
      <RoomProvider
        id={roomId}
        initialPresence={{ name: "", email: "", viewingTaskId: null }}
      >
        <PresenceSeeder />
        {children}
      </RoomProvider>
    </LiveblocksProvider>
  );
}
