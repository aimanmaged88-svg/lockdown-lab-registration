import type { Role } from "./enums";

// Role-based access control. A small, explicit capability map beats scattered
// role string checks and makes Release B moderation auditable.
export type Capability =
  | "content.manage"
  | "analytics.manage"
  | "research.manage"
  | "community.post"
  | "community.moderate"
  | "community.invite"
  | "roles.manage"
  | "settings.manage"
  | "expert.verify";

const MATRIX: Record<Role, Capability[]> = {
  owner: [
    "content.manage",
    "analytics.manage",
    "research.manage",
    "community.post",
    "community.moderate",
    "community.invite",
    "roles.manage",
    "settings.manage",
    "expert.verify",
  ],
  admin: [
    "content.manage",
    "analytics.manage",
    "research.manage",
    "community.post",
    "community.moderate",
    "community.invite",
    "expert.verify",
  ],
  moderator: ["community.post", "community.moderate"],
  contributor: ["community.post"],
  member: ["community.post"],
  guest: [],
};

export function can(role: Role, cap: Capability): boolean {
  return MATRIX[role]?.includes(cap) ?? false;
}

export function assert(role: Role, cap: Capability): void {
  if (!can(role, cap)) {
    throw new Error(`Forbidden: role "${role}" lacks capability "${cap}".`);
  }
}
