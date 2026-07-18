import type { Role } from "@/types";

/**
 * Role definitions and the permission matrix.
 *
 * In production these are enforced server-side via Supabase Row Level
 * Security; the client uses them only to shape navigation and views.
 */

export interface RoleDefinition {
  id: Role;
  label: string;
  description: string;
  homePath: string;
  demoUser: { name: string; detail: string; initials: string };
}

export const roles: RoleDefinition[] = [
  {
    id: "parent",
    label: "Parent / Guardian",
    description: "See how their day went and celebrate every win.",
    homePath: "/family",
    demoUser: { name: "Faraz Normani", detail: "Zayd & Idris's dad", initials: "FN" },
  },
  {
    id: "support-worker",
    label: "Support Worker",
    description: "Start prepared and spend your energy on people, not paperwork.",
    homePath: "/dashboard",
    demoUser: { name: "Grace Whitfield", detail: "Senior support worker", initials: "GW" },
  },
  {
    id: "participant",
    label: "Participant",
    description: "Your goals, your story, your team — in your own space.",
    homePath: "/participants/ava",
    demoUser: { name: "Ava Nguyen", detail: "Writer & advocate", initials: "AN" },
  },
  {
    id: "team-leader",
    label: "Team Leader",
    description: "Keep every shift, participant and worker supported and on track.",
    homePath: "/dashboard",
    demoUser: { name: "Priya Sharma", detail: "Team leader, north team", initials: "PS" },
  },
  {
    id: "therapist",
    label: "Therapist",
    description: "Follow therapy goals between sessions with the team's notes.",
    homePath: "/participants",
    demoUser: { name: "Dr. Priya Raman", detail: "Speech pathologist", initials: "PR" },
  },
  {
    id: "provider-admin",
    label: "Provider Administrator",
    description: "Outcomes, quality and workforce — the whole organisation at a glance.",
    homePath: "/provider",
    demoUser: { name: "Amelia Torres", detail: "Operations director", initials: "AT" },
  },
  {
    id: "ceo",
    label: "CEO",
    description: "One question, answered honestly: are we genuinely improving people's lives?",
    homePath: "/executive",
    demoUser: { name: "Dr. Yasser Zaki", detail: "Founder & CEO, Tender Loving Care Disability Services", initials: "YZ" },
  },
  {
    id: "system-admin",
    label: "System Administrator",
    description: "Permissions, audit logs, integrations and platform health.",
    homePath: "/settings",
    demoUser: { name: "Ray Kaur", detail: "Platform administrator", initials: "RK" },
  },
];

export function getRole(id: Role): RoleDefinition {
  return roles.find((r) => r.id === id) ?? roles[1];
}

/** Which navigation sections each role can see. */
export const rolePermissions: Record<Role, string[]> = {
  parent: ["family", "timeline", "budgets", "review-ready", "support-circle", "marketplace", "learning", "notifications", "settings", "help"],
  participant: ["participants", "timeline", "budgets", "support-circle", "marketplace", "learning", "community", "notifications", "settings", "help"],
  "support-worker": ["dashboard", "participants", "shift", "timeline", "roster", "timepay", "arrivals", "incidents", "assistant", "support-circle", "marketplace", "learning", "community", "wellbeing", "notifications", "settings", "help"],
  "team-leader": ["dashboard", "participants", "shift", "timeline", "roster", "timepay", "arrivals", "incidents", "compliance", "billing", "budgets", "assistant", "support-circle", "marketplace", "learning", "community", "review-ready", "wellbeing", "reports", "notifications", "settings", "help"],
  therapist: ["dashboard", "participants", "timeline", "assistant", "support-circle", "learning", "review-ready", "reports", "notifications", "settings", "help"],
  "provider-admin": ["provider", "dashboard", "participants", "timeline", "roster", "timepay", "arrivals", "incidents", "compliance", "billing", "budgets", "assistant", "support-circle", "marketplace", "learning", "community", "review-ready", "wellbeing", "reports", "notifications", "settings", "help"],
  ceo: ["executive", "provider", "participants", "timeline", "timepay", "arrivals", "incidents", "compliance", "billing", "budgets", "support-circle", "marketplace", "review-ready", "wellbeing", "reports", "notifications", "settings", "help"],
  "system-admin": ["dashboard", "participants", "roster", "timepay", "arrivals", "incidents", "compliance", "billing", "budgets", "reports", "notifications", "settings", "help"],
};

export function canSee(role: Role, navKey: string): boolean {
  return rolePermissions[role]?.includes(navKey) ?? false;
}
