"use client";

import { createClient } from "@liveblocks/client";
import { createRoomContext } from "@liveblocks/react";
import type { Presence } from "./types";

export type ThreadMetadata = {
  taskId?: number;
  boardId?: number;
  resolved?: boolean;
};

// In Liveblocks v3, we export standard hooks directly from the package
export {
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
} from "@liveblocks/react";
