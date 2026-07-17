/**
 * Time & Pay — clock in/out, timesheets and payroll from ONE source.
 *
 * Beats standalone time clocks (tap-in, GPS-verified, no hardware) AND
 * standalone NDIS payroll: the same clock event that starts a worker's Smart
 * Shift briefing also fills their timesheet, the NDIS claim line and the pay
 * run. Enter once, use everywhere. "Half a day of payroll" becomes minutes.
 */

export interface ClockEntry {
  id: string;
  worker: string;
  initials: string;
  participantId: string;
  clockIn: string; // "6:57am"
  clockOut?: string; // undefined = still on shift
  locationVerified: boolean;
  status: "on-shift" | "complete";
}

export const clockEntries: ClockEntry[] = [
  { id: "ck1", worker: "Grace Whitfield", initials: "GW", participantId: "ava", clockIn: "7:54am", locationVerified: true, status: "on-shift" },
  { id: "ck2", worker: "Leila Haddad", initials: "LH", participantId: "zayd", clockIn: "8:26am", locationVerified: true, status: "on-shift" },
  { id: "ck3", worker: "Daniel Okafor", initials: "DO", participantId: "milo", clockIn: "6:57am", clockOut: "9:03am", locationVerified: true, status: "complete" },
  { id: "ck4", worker: "Amira Chen", initials: "AC", participantId: "idris", clockIn: "9:28am", clockOut: "1:02pm", locationVerified: true, status: "complete" },
];

export const timepayStats = {
  onShiftNow: 2,
  hoursThisFortnight: 486,
  timesheetsAutoBuilt: 34,
  payRunReady: 41280,
};

export interface TimesheetRow {
  id: string;
  worker: string;
  initials: string;
  shifts: number;
  ordinaryHours: number;
  weekendHours: number;
  total: number;
  status: "verified" | "review";
}

export const timesheets: TimesheetRow[] = [
  { id: "ts1", worker: "Grace Whitfield", initials: "GW", shifts: 5, ordinaryHours: 38, weekendHours: 4, total: 42, status: "verified" },
  { id: "ts2", worker: "Daniel Okafor", initials: "DO", shifts: 5, ordinaryHours: 10, weekendHours: 0, total: 10, status: "verified" },
  { id: "ts3", worker: "Leila Haddad", initials: "LH", shifts: 4, ordinaryHours: 9, weekendHours: 4, total: 13, status: "review" },
  { id: "ts4", worker: "Tess Nguyen-Park", initials: "TN", shifts: 4, ordinaryHours: 12, weekendHours: 0, total: 12, status: "verified" },
  { id: "ts5", worker: "Amira Chen", initials: "AC", shifts: 4, ordinaryHours: 11, weekendHours: 4, total: 15, status: "verified" },
];

export const payRun = {
  period: "Fortnight ending 19 Jul 2026",
  workers: 34,
  gross: 41280,
  tax: 9890,
  superAmount: 4747,
  net: 31390,
  status: "ready" as const,
};

export const timepayDifference = [
  { title: "Tap in — no hardware, GPS-verified", detail: "Workers clock in from their phone at the participant's address. Location confirms it, and their Smart Shift briefing opens the moment they do." },
  { title: "One clock event, every output", detail: "That single tap fills the timesheet, the NDIS claim line and the pay run at once. Nobody re-keys hours into three systems." },
  { title: "Payroll in minutes, not half a day", detail: "Timesheets are pre-built from verified shifts and awards are applied automatically. Review, approve, run — done." },
];
