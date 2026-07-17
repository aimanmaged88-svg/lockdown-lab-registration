/**
 * Fictional compliance & audit-readiness demo data.
 *
 * The CareOS difference: audit evidence assembles itself from everyday care
 * records. Notes, med sign-offs and incident closures become audit artefacts
 * the moment they're written — compliance as a by-product of good care.
 */

export const auditReadiness = {
  overall: 96,
  documentsComplete: 143,
  documentsRequired: 149,
  scopes: [
    { name: "Organisation", complete: 24, required: 24, percent: 100 },
    { name: "Workers", complete: 62, required: 65, percent: 95 },
    { name: "Participants", complete: 47, required: 49, percent: 96 },
    { name: "Homes & sites", complete: 10, required: 11, percent: 91 },
  ],
};

export const attentionRequired = [
  {
    id: "att1",
    severity: "overdue" as const,
    title: "First Aid certificate — Leila Haddad",
    detail: "Expires in 12 days. Renewal booked for the 22 Jul training session; roster auto-flags her shifts until verified.",
  },
  {
    id: "att2",
    severity: "missing" as const,
    title: "Service agreement — new participant intake",
    detail: "One signed agreement outstanding from last week's intake. Family has the e-sign link; reminder scheduled for tomorrow 9am.",
  },
];

export const dueSoon = [
  { id: "due1", title: "NDIS Worker Screening — 2 staff", days: 21, owner: "People team" },
  { id: "due2", title: "CPR refreshers — 4 staff", days: 26, owner: "Booked · 22 Jul session" },
  { id: "due3", title: "Vehicle insurance — community van", days: 28, owner: "Operations" },
  { id: "due4", title: "Fire safety check — Fairfield site", days: 30, owner: "Site lead" },
];

export const practiceStandards = [
  { area: "Rights & responsibilities", status: "evidenced", pieces: 34 },
  { area: "Governance & operations", status: "evidenced", pieces: 41 },
  { area: "Provision of supports", status: "evidenced", pieces: 52 },
  { area: "Support environment", status: "gap", pieces: 16 },
];

export const autoEvidence = [
  { source: "Shift notes (same-day rate 93%)", becomes: "Service delivery evidence", count: "1,240 this quarter" },
  { source: "Medication sign-offs (double-signed)", becomes: "Safe medication management", count: "312 this quarter" },
  { source: "Incident reports + closures", becomes: "Incident management evidence", count: "14 closed, avg 6.2 days" },
  { source: "Goal progress records", becomes: "Outcomes evidence for plan reviews", count: "165 goals tracked" },
];
