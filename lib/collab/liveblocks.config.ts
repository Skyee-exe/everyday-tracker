"use client";

import { createClient } from "@liveblocks/client";
import { createRoomContext } from "@liveblocks/react";
import type { Presence } from "./types";

export const liveblocksClient = createClient({
  authEndpoint: "/api/liveblocks/auth",
});

export type ThreadMetadata = {
  taskId?: number;
  boardId?: number;
  resolved?: boolean;
};

export const {
  RoomProvider,
  useRoom,
  useOthers,
  useSelf,
  useThreads,
  useStorage,
  useMutation,
  useStatus,
  useUpdateMyPresence,
  useCreateThread,
  useEditComment,
  useDeleteComment,
} = createRoomContext<Presence, never, never, ThreadMetadata>(liveblocksClient);
