/**
 * Homes & Sites — SIL / SDA property management, tied to the people who live there.
 *
 * Beats Checkbase's siloed "SIL houses" document tracker. In CareOS a home is
 * not a folder of certificates — it's connected to the residents and their Care
 * DNA, the workers rostered there, and the incidents and checks that happen in
 * it. Property compliance becomes a by-product of everyday care, per-home audit
 * readiness is always live, and an auditor can be given a one-time, read-only
 * pack in a click.
 */

export type HomeType = "SIL" | "SDA" | "Respite";

export interface PropertyCheck {
  label: string;
  status: "ok" | "due" | "overdue";
  detail: string;
}

export interface CareHome {
  id: string;
  name: string;
  address: string;
  type: HomeType;
  residentIds: string[];
  residentInitials: string[];
  auditReadiness: number; // %
  openIssues: number;
  nextInspection: string;
  checks: PropertyCheck[];
}

export const careHomes: CareHome[] = [
  {
    id: "rossmoyne",
    name: "Rossmoyne House",
    address: "12 Rossmoyne St, Coburg",
    type: "SIL",
    residentIds: ["ava"],
    residentInitials: ["AN", "TK", "RM"],
    auditReadiness: 97,
    openIssues: 0,
    nextInspection: "in 26 days",
    checks: [
      { label: "Fire safety & evacuation plan", status: "ok", detail: "Reviewed 3 weeks ago · drill logged" },
      { label: "Smoke alarms serviced", status: "ok", detail: "Serviced this quarter" },
      { label: "Egress & accessibility", status: "ok", detail: "Ramp & rails compliant" },
      { label: "WHS inspection", status: "ok", detail: "Passed · next due Q4" },
      { label: "Restrictive-practice environment", status: "ok", detail: "No environmental RP in place" },
      { label: "Vehicle roadworthy & insured", status: "ok", detail: "Rego & insurance current" },
    ],
  },
  {
    id: "merri",
    name: "Merri House",
    address: "44 Merri Pde, Northcote",
    type: "SDA",
    residentIds: ["milo"],
    residentInitials: ["MC", "JD", "PL", "SN"],
    auditReadiness: 88,
    openIssues: 1,
    nextInspection: "in 9 days",
    checks: [
      { label: "Fire safety & evacuation plan", status: "ok", detail: "Current · drill logged" },
      { label: "Smoke alarms serviced", status: "due", detail: "Service due in 9 days — booked, contractor confirmed" },
      { label: "Egress & accessibility", status: "ok", detail: "Compliant" },
      { label: "WHS inspection", status: "ok", detail: "Passed" },
      { label: "Restrictive-practice environment", status: "ok", detail: "Locked-medication cabinet authorised in PBS plan" },
      { label: "Vehicle roadworthy & insured", status: "ok", detail: "Current" },
    ],
  },
  {
    id: "gaffney",
    name: "Gaffney Lodge",
    address: "3/19 Gaffney St, Pascoe Vale",
    type: "SIL",
    residentIds: ["jordan"],
    residentInitials: ["JW", "HB"],
    auditReadiness: 92,
    openIssues: 1,
    nextInspection: "in 17 days",
    checks: [
      { label: "Fire safety & evacuation plan", status: "ok", detail: "Current" },
      { label: "Smoke alarms serviced", status: "ok", detail: "Serviced last month" },
      { label: "Egress & accessibility", status: "ok", detail: "Compliant" },
      { label: "WHS inspection", status: "due", detail: "Annual review due in 17 days — flagged to ops" },
      { label: "Restrictive-practice environment", status: "ok", detail: "None in place" },
      { label: "Vehicle roadworthy & insured", status: "ok", detail: "Current" },
    ],
  },
  {
    id: "bell",
    name: "Bell Street SDA",
    address: "210 Bell St, Coburg North",
    type: "SDA",
    residentIds: [],
    residentInitials: ["EW", "TR", "MK"],
    auditReadiness: 99,
    openIssues: 0,
    nextInspection: "in 40 days",
    checks: [
      { label: "Fire safety & evacuation plan", status: "ok", detail: "Current · sprinklers tested" },
      { label: "Smoke alarms serviced", status: "ok", detail: "Serviced this quarter" },
      { label: "Egress & accessibility", status: "ok", detail: "High Physical Support compliant" },
      { label: "WHS inspection", status: "ok", detail: "Passed" },
      { label: "Restrictive-practice environment", status: "ok", detail: "None in place" },
      { label: "Vehicle roadworthy & insured", status: "ok", detail: "Current" },
    ],
  },
];

export const sitesStats = {
  homes: careHomes.length,
  residents: careHomes.reduce((n, h) => n + h.residentInitials.length, 0),
  avgReadiness: Math.round(careHomes.reduce((n, h) => n + h.auditReadiness, 0) / careHomes.length),
  inspectionsDue: careHomes.filter((h) => h.openIssues > 0).length,
};

export const sitesDifference = [
  {
    title: "A home, not a folder of certificates",
    detail:
      "Compliance-only tools track a property's documents in a silo. In CareOS each home is connected to the residents who live there, the workers rostered to it, and the incidents and checks that happen inside it — one record, not four.",
  },
  {
    title: "Property compliance as a by-product of care",
    detail:
      "Smoke-alarm services, WHS reviews, evacuation drills and environmental restrictive-practice authorisations are captured as work happens and auto-linked as evidence. Per-home audit readiness is always live, never a night-before scramble.",
  },
  {
    title: "Auditor-ready in one click",
    detail:
      "Generate a certification evidence pack for any home and share it with an auditor via a one-time, read-only link — scoped to exactly what they need to see, and every access logged.",
  },
];
