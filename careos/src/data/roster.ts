/**
 * Fictional rostering demo data — week of Mon 13 → Sun 19 July 2026.
 * CareOS rostering is outcome-aware: every shift knows the participant's
 * goals, alerts and preferred workers, and the AI flags quality — not just
 * coverage gaps.
 */

export interface RosterShift {
  id: string;
  day: string; // "Mon" …
  date: string; // "13 Jul"
  time: string;
  participantId: string;
  worker: string | null; // null = open shift
  status: "confirmed" | "open" | "attention";
  note?: string;
  clockIn?: string;
  credentials?: "current" | "expiring" | "issue";
}

export const rosterWeek: RosterShift[] = [
  { id: "rs1", day: "Mon", date: "13 Jul", time: "7:00–9:00", participantId: "milo", worker: "Daniel Okafor", status: "confirmed", clockIn: "6:57am", credentials: "current" },
  { id: "rs2", day: "Mon", date: "13 Jul", time: "8:00–16:00", participantId: "ava", worker: "Grace Whitfield", status: "confirmed", clockIn: "7:54am", credentials: "current" },
  { id: "rs3", day: "Mon", date: "13 Jul", time: "15:30–18:30", participantId: "zayd", worker: "Leila Haddad", status: "confirmed", clockIn: "3:26pm", credentials: "current" },
  { id: "rs4", day: "Tue", date: "14 Jul", time: "7:00–9:00", participantId: "milo", worker: "Daniel Okafor", status: "confirmed", clockIn: "6:59am", credentials: "current" },
  { id: "rs5", day: "Tue", date: "14 Jul", time: "15:30–18:30", participantId: "idris", worker: "Amira Chen", status: "confirmed", clockIn: "3:29pm", credentials: "current" },
  { id: "rs6", day: "Tue", date: "14 Jul", time: "16:30–19:30", participantId: "jordan", worker: "Tess Nguyen-Park", status: "confirmed", clockIn: "4:27pm", credentials: "current" },
  { id: "rs7", day: "Wed", date: "15 Jul", time: "7:00–9:00", participantId: "milo", worker: "Daniel Okafor", status: "confirmed", clockIn: "6:58am", credentials: "current" },
  { id: "rs8", day: "Wed", date: "15 Jul", time: "8:00–16:00", participantId: "ava", worker: "Grace Whitfield", status: "confirmed", clockIn: "7:56am", credentials: "current" },
  { id: "rs9", day: "Wed", date: "15 Jul", time: "16:30–19:30", participantId: "jordan", worker: "Tess Nguyen-Park", status: "confirmed", credentials: "current" },
  { id: "rs10", day: "Thu", date: "16 Jul", time: "15:30–18:30", participantId: "zayd", worker: "Leila Haddad", status: "attention", note: "Leila's First Aid renewal due in 12 days — booked for the 22 Jul session", credentials: "expiring" },
  { id: "rs11", day: "Thu", date: "16 Jul", time: "17:30–19:30", participantId: "jordan", worker: "Tess Nguyen-Park", status: "confirmed", note: "Peer group night — pickup support only", credentials: "current" },
  { id: "rs12", day: "Fri", date: "17 Jul", time: "7:00–9:00", participantId: "milo", worker: "Daniel Okafor", status: "confirmed", credentials: "current" },
  { id: "rs13", day: "Fri", date: "17 Jul", time: "15:30–18:30", participantId: "idris", worker: null, status: "open", note: "Amira on leave — AI suggests Leila (knows the boys' routines, 96% match)" },
  { id: "rs14", day: "Sat", date: "18 Jul", time: "8:30–12:30", participantId: "zayd", worker: "Leila Haddad", status: "confirmed", note: "Swim lesson 9am — waterproof talker case packed", credentials: "expiring" },
  { id: "rs15", day: "Sat", date: "18 Jul", time: "10:00–14:00", participantId: "ava", worker: "Grace Whitfield", status: "confirmed", note: "Conference rehearsal block", credentials: "current" },
  { id: "rs16", day: "Sun", date: "19 Jul", time: "9:00–13:00", participantId: "idris", worker: "Amira Chen", status: "confirmed", note: "Ducks + sandpit, quiet morning", credentials: "current" },
  { id: "rs17", day: "Sun", date: "19 Jul", time: "16:00–19:00", participantId: "jordan", worker: null, status: "open", note: "Meal-prep support — AI suggests Priya (worked Jordan's kitchen sessions in May)" },
];

export const rosterStats = {
  shiftsThisWeek: 17,
  coverage: 88, // % of shifts filled
  openShifts: 2,
  credentialAlerts: 1,
  clashesPrevented: 3,
  awardFlagsResolved: 2,
};

export const rosterAiNotes = [
  {
    title: "Two open shifts, two strong matches ready",
    detail: "Fri (Idris) → Leila Haddad: knows both brothers' routines, credential-current, no award conflicts. Sun (Jordan) → Priya Sharma: prior kitchen-session history, within weekly hours cap. One tap to offer both.",
  },
  {
    title: "Consistency protected this week",
    detail: "100% of filled shifts are core-team workers. Milo keeps Daniel for all three mornings — his independence streak correlates strongly with familiar-worker mornings.",
  },
  {
    title: "Award compliance clean",
    detail: "No broken-shift or minimum-engagement violations this week. Two potential clashes were blocked at draft time before they reached the roster.",
  },
];
