/**
 * KnockIn™ — Smart Arrivals.
 *
 * The moment a worker's phone enters the geofence around the participant's
 * home, KnockIn fires a full-screen, alarm-grade prompt: "You've arrived —
 * confirm you're starting your shift." It sounds even on silent, it can't be
 * swiped away, and it records the exact second of arrival separately from the
 * second of confirmation. Arrival truth for families, payroll and audit —
 * captured automatically, disputed never.
 */

export type ArrivalStatus = "confirmed" | "awaiting" | "escalated" | "upcoming";

export interface ArrivalEvent {
  id: string;
  worker: string;
  initials: string;
  participantId: string;
  address: string;
  /** Exact second the phone crossed the geofence. */
  geofenceEntry: string;
  /** Exact second the worker confirmed the shift start. */
  confirmedAt?: string;
  secondsToConfirm?: number;
  scheduledStart: string;
  status: ArrivalStatus;
}

export const arrivalEvents: ArrivalEvent[] = [
  {
    id: "ar1",
    worker: "Grace Whitfield",
    initials: "GW",
    participantId: "ava",
    address: "12 Rossmoyne St, Coburg",
    geofenceEntry: "7:52:41am",
    confirmedAt: "7:53:04am",
    secondsToConfirm: 23,
    scheduledStart: "8:00am",
    status: "confirmed",
  },
  {
    id: "ar2",
    worker: "Leila Haddad",
    initials: "LH",
    participantId: "zayd",
    address: "8 Wattlebird Ct, Fawkner",
    geofenceEntry: "8:26:03am",
    confirmedAt: "8:26:19am",
    secondsToConfirm: 16,
    scheduledStart: "8:30am",
    status: "confirmed",
  },
  {
    id: "ar3",
    worker: "Daniel Okafor",
    initials: "DO",
    participantId: "milo",
    address: "44 Merri Pde, Northcote",
    geofenceEntry: "6:55:12am",
    confirmedAt: "6:55:31am",
    secondsToConfirm: 19,
    scheduledStart: "7:00am",
    status: "confirmed",
  },
  {
    id: "ar4",
    worker: "Amira Chen",
    initials: "AC",
    participantId: "idris",
    address: "8 Wattlebird Ct, Fawkner",
    geofenceEntry: "1:28:47pm",
    scheduledStart: "1:30pm",
    status: "awaiting",
  },
  {
    id: "ar5",
    worker: "Tess Nguyen-Park",
    initials: "TN",
    participantId: "jordan",
    address: "3/19 Gaffney St, Pascoe Vale",
    geofenceEntry: "—",
    scheduledStart: "3:00pm",
    status: "upcoming",
  },
];

export const knockinStats = {
  arrivalsToday: 11,
  avgConfirmSeconds: 21,
  onTimeRate: 98.4,
  escalationsThisMonth: 2,
};

/** What happens if the prompt is ignored — the ladder that makes it unmissable. */
export const escalationLadder = [
  {
    at: "0 sec",
    title: "Full-screen KnockIn alert",
    detail:
      "Fires the second the phone enters the geofence. Alarm-grade sound and vibration — it plays through silent mode and Do Not Disturb, exactly like a morning alarm.",
  },
  {
    at: "60 sec",
    title: "Repeat + persistent banner",
    detail:
      "The alert re-fires and pins itself to the top of the screen. It cannot be swiped away or muted in the app — the only way to clear it is to confirm or decline the shift.",
  },
  {
    at: "3 min",
    title: "Team leader pinged",
    detail:
      "Still unconfirmed? The team leader sees it live on their board with the exact arrival time, and can call the worker with one tap.",
  },
  {
    at: "5 min",
    title: "On-call escalation",
    detail:
      "The provider's on-call line is notified and the shift is flagged for follow-up. The full timeline — geofence entry, every alert, every response — is kept for audit.",
  },
];

export const knockinDifference = [
  {
    title: "Exact truth, to the second",
    detail:
      "Geofence entry and shift confirmation are stamped separately, to the second. No more \"I was there at 9\" disputes — arrival is a recorded fact, for payroll, claims and families alike.",
  },
  {
    title: "Impossible to miss, impossible to mute",
    detail:
      "This is not a notification a worker can turn off in settings. While they hold a rostered shift, KnockIn is alarm-class and non-dismissible — confirming the shift is the only way through.",
  },
  {
    title: "Families feel it instantly",
    detail:
      "The moment Leila confirms at Zayd's door, Faraz's Family Portal shows \"Leila has arrived — 8:26am\". Peace of mind delivered in real time, not at the end-of-day note.",
  },
];
