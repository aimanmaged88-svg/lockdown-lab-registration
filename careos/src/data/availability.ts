/**
 * Smart Availability — workers submit when they can work; AI fills every spot.
 *
 * Answers Medinex/ShiftCare's availability feature and goes further. Workers are
 * prompted to submit recurring availability inside a window (with an advance
 * option). The rostering team sees a live coverage picture, and the AI fills open
 * shifts while understanding employment type: permanent workers are continuity-
 * locked to their participant and protected first; casuals flex to fill the rest.
 */

export type EmploymentType = "permanent" | "casual" | "part-time";

export interface WorkerAvailability {
  id: string;
  name: string;
  initials: string;
  type: EmploymentType;
  /** For permanent workers: the participant they're continuity-locked to. */
  assignedTo?: string;
  submitted: boolean;
  hoursThisWeek: number;
  maxHours: number;
  note: string;
}

export const workers: WorkerAvailability[] = [
  { id: "w-grace", name: "Grace Whitfield", initials: "GW", type: "permanent", assignedTo: "Ava", submitted: true, hoursThisWeek: 38, maxHours: 38, note: "Locked to Ava's weekdays — continuity protected." },
  { id: "w-daniel", name: "Daniel Okafor", initials: "DO", type: "permanent", assignedTo: "Milo", submitted: true, hoursThisWeek: 15, maxHours: 25, note: "Milo's three mornings, every week." },
  { id: "w-leila", name: "Leila Haddad", initials: "LH", type: "permanent", assignedTo: "Zayd & Idris", submitted: true, hoursThisWeek: 22, maxHours: 30, note: "Knows both brothers' routines — can pick up Idris on Fri." },
  { id: "w-amira", name: "Amira Chen", initials: "AC", type: "part-time", assignedTo: "Idris", submitted: true, hoursThisWeek: 12, maxHours: 20, note: "On leave Fri 17 Jul — creates one open shift." },
  { id: "w-tess", name: "Tess Nguyen-Park", initials: "TN", type: "casual", submitted: true, hoursThisWeek: 9, maxHours: 38, note: "Flexible pool — available most evenings." },
  { id: "w-priya", name: "Priya Sharma", initials: "PS", type: "casual", submitted: false, hoursThisWeek: 6, maxHours: 38, note: "Not submitted yet — reminder auto-sent, 2 days left." },
];

export const availabilityWindow = {
  closesIn: "2 days",
  closesOn: "Wed 23 Jul",
  submitted: workers.filter((w) => w.submitted).length,
  total: workers.length,
};

export const availabilityStats = {
  submittedLabel: `${availabilityWindow.submitted}/${availabilityWindow.total}`,
  openShifts: 2,
  coverageAfterAi: 100,
  permanent: workers.filter((w) => w.type === "permanent").length,
  casual: workers.filter((w) => w.type !== "permanent").length,
};

/** The worker's own recurring grid — rows are shift types, columns are days. */
export const shiftRows = ["Morning", "Afternoon", "Evening", "Sleepover"];
export const dayCols = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
/** true = marked available (this is Leila's submitted pattern). */
export const availabilityGrid: boolean[][] = [
  [true, true, true, true, true, false, false], // Morning
  [true, true, true, true, true, true, false], // Afternoon
  [false, false, true, true, true, true, false], // Evening
  [false, false, false, false, false, true, true], // Sleepover
];

export interface OpenShiftFill {
  id: string;
  when: string;
  participant: string;
  reason: string;
  suggested: string;
  suggestedInitials: string;
  suggestedType: EmploymentType;
}

export const openShiftFills: OpenShiftFill[] = [
  {
    id: "of1",
    when: "Fri 17 Jul · 15:30–18:30",
    participant: "Idris",
    reason: "Amira (part-time) on leave. AI protects continuity → offers the boys' permanent worker first.",
    suggested: "Leila Haddad",
    suggestedInitials: "LH",
    suggestedType: "permanent",
  },
  {
    id: "of2",
    when: "Sun 19 Jul · 16:00–19:00",
    participant: "Jordan",
    reason: "No permanent worker free. AI picks the best-matched casual who has history with Jordan's kitchen sessions.",
    suggested: "Priya Sharma",
    suggestedInitials: "PS",
    suggestedType: "casual",
  },
];

export const availabilityDifference = [
  {
    title: "Prompted, not chased",
    detail:
      "Workers get a nudge to submit availability inside a set window — with an option to set it weeks in advance. Coordinators stop chasing texts; the picture fills itself before the roster is even drafted.",
  },
  {
    title: "The AI knows permanent from casual",
    detail:
      "Every worker is tagged permanent (continuity-locked to a participant) or casual (flexible pool). When a spot opens, the AI protects the permanent pairing first and only reaches for a casual when it has to — so people keep their person.",
  },
  {
    title: "Every spot filled, in one source of truth",
    detail:
      "Availability, employment type, award hours and participant continuity all live in the same CareOS record as the roster, pay and claims. Fill a shift and it flows straight through — no re-keying into a separate rostering tool.",
  },
];
