export type CollabRole = "owner" | "editor" | "viewer";

export const ROLE_RANK: Record<CollabRole, number> = {
  owner: 3,
  editor: 2,
  viewer: 1,
};

export function meetsRole(actual: CollabRole, min: CollabRole): boolean {
  return ROLE_RANK[actual] >= ROLE_RANK[min];
}

export const ROLE_LABELS: Record<CollabRole, string> = {
  owner: "Owner",
  editor: "Editor",
  viewer: "Viewer",
};

export const ALL_ROLES: CollabRole[] = ["owner", "editor", "viewer"];

export function isCollabRole(value: string | null | undefined): value is CollabRole {
  return value === "owner" || value === "editor" || value === "viewer";
}
