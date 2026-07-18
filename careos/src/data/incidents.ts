/**
 * Incident Manager — from first awareness to Commission-ready, on the clock.
 *
 * Sector problem: reportable incidents must reach the NDIS Commission within
 * 24 hours of ANY worker becoming aware (5 business days for unauthorised
 * restrictive practices). Missing the window invites audits, enforcement and
 * even deregistration — and most providers run it on paper forms and phone
 * tag. In CareOS, capture IS awareness: the clock, the classification, the
 * escalation and the Commission draft all start from the worker's first tap.
 */

export type IncidentSeverity = "reportable-24h" | "reportable-5d" | "internal";
export type IncidentState = "notified" | "clock-running" | "investigating" | "closed";

export interface IncidentRecord {
  id: string;
  title: string;
  participantId: string;
  category: string;
  severity: IncidentSeverity;
  state: IncidentState;
  raisedBy: string;
  raisedAt: string;
  clockNote: string;
}

export const incidentRecords: IncidentRecord[] = [
  {
    id: "in1",
    title: "Fall with injury during community access",
    participantId: "milo",
    category: "Serious injury",
    severity: "reportable-24h",
    state: "notified",
    raisedBy: "Daniel Okafor",
    raisedAt: "Tue 9:41am",
    clockNote: "Commission notified 3h 12m after first awareness — auto-drafted from Daniel's shift record, reviewed and submitted by Priya.",
  },
  {
    id: "in2",
    title: "Unplanned physical guidance during transition",
    participantId: "zayd",
    category: "Possible unauthorised restrictive practice",
    severity: "reportable-5d",
    state: "clock-running",
    raisedBy: "Leila Haddad",
    raisedAt: "Thu 2:18pm",
    clockNote: "5-business-day clock: 3 days remaining. PBS practitioner looped in; draft notification 80% complete.",
  },
  {
    id: "in3",
    title: "Missed 8am medication — caught at 9:15am",
    participantId: "ava",
    category: "Medication error",
    severity: "internal",
    state: "investigating",
    raisedBy: "Grace Whitfield",
    raisedAt: "Mon 9:20am",
    clockNote: "Not Commission-reportable. GP informed, family notified, root-cause review booked — all logged for audit.",
  },
  {
    id: "in4",
    title: "Near miss — loose handrail at pool entrance",
    participantId: "jordan",
    category: "Near miss / hazard",
    severity: "internal",
    state: "closed",
    raisedBy: "Tess Nguyen-Park",
    raisedAt: "Last Fri 4:02pm",
    clockNote: "Venue notified, alternative entrance added to Jordan's community plan. Closed with improvement action recorded.",
  },
];

export const incidentStats = {
  openNow: 3,
  reportableThisQuarter: 2,
  medianTimeToNotify: "3h 12m",
  onTimeRate: "100%",
};

/** The pathway auditors look for under Module 2A — built in, not bolted on. */
export const incidentPathway = [
  {
    step: "Capture is awareness",
    detail:
      "A worker logs what happened in two taps from their Smart Shift screen — even offline. The Commission's clock starts at first awareness, so CareOS makes awareness and capture the same moment.",
  },
  {
    step: "Auto-classified, clock started",
    detail:
      "The incident is checked against the six reportable categories. If it's reportable, the 24-hour (or 5-business-day) countdown starts instantly and the right people are paged — no judgement call left to a tired worker at 11pm.",
  },
  {
    step: "Commission draft, pre-written",
    detail:
      "The notification is auto-drafted from the shift record, timeline and Care DNA context. A human reviews and submits — minutes of review instead of hours of reconstruction.",
  },
  {
    step: "Root cause → real change",
    detail:
      "Every incident closes with a root-cause review and an improvement action that flows back into rosters, training or the participant's plan — the continuous-improvement loop auditors ask to see.",
  },
];

export const incidentDifference = [
  {
    title: "The deadline can't sneak past",
    detail:
      "Missing the 24-hour window is one of the fastest ways to attract Commission enforcement. In CareOS the clock is visible to everyone who needs to act, escalating as it runs down — like KnockIn, it gets louder, not quieter.",
  },
  {
    title: "Paperwork already written",
    detail:
      "The worker's note, the timestamps, the witnesses and the participant context are already in the system — so the Commission notification drafts itself and the evidence pack for any follow-up is one click.",
  },
  {
    title: "Audit-ready by default",
    detail:
      "Certification audits assess incident management against Module 2A. CareOS's pathway — capture, classify, notify, investigate, improve — IS that module, with every step timestamped.",
  },
];
