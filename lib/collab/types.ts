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

export type RoomKind = "board" | "task";

export function buildRoomId(kind: RoomKind, entityId: number | string): string {
  return `${kind}_${entityId}`;
}

export function parseRoomId(
  roomId: string
): { kind: RoomKind; entityId: number } | null {
  const [kind, rawId] = roomId.split("_");
  if (kind !== "board" && kind !== "task") return null;
  const entityId = Number(rawId);
  if (!Number.isFinite(entityId)) return null;
  return { kind, entityId };
}
