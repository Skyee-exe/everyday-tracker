export type Presence = {
  name: string;
  email: string;
  avatar?: string;
  viewingTaskId?: number | null;
};

export type SharedCollabUser = {
  id: number | null;
  name: string;
  email: string;
  imageUrl?: string | null;
  role: "owner" | "editor" | "viewer";
  lastSignedInAt?: Date | string | null;
  isOnline?: boolean;
};

export type RoomKind = "board" | "task" | "workspace";

export function buildRoomId(kind: RoomKind, entityId: number | string): string {
  return `${kind}_${entityId}`;
}

export function parseRoomId(
  roomId: string
): { kind: RoomKind; entityId: number | string } | null {
  const [kind, rawId] = roomId.split("_");
  if (kind !== "board" && kind !== "task" && kind !== "workspace") return null;
  if (kind === "workspace") return { kind, entityId: rawId };
  const entityId = Number(rawId);
  if (!Number.isFinite(entityId)) return null;
  return { kind, entityId };
}
