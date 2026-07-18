/**
 * Team Pulse — keep the people who keep everyone else going.
 *
 * Sector problem: 43% of NDIS workers report burnout at least half the time;
 * turnover runs ~26% for casuals (roughly 3× the national churn) and refilling
 * a role takes ~8 weeks — a cost the sector puts in the tens of millions for
 * onboarding alone. Team Pulse reads the roster like a wellbeing instrument:
 * load fairness, rest patterns and quiet warning signs, plus a recognition
 * loop that lets families say thank you where workers actually see it.
 */

export type PulseFlag = "thriving" | "steady" | "check-in";

export interface WorkerPulse {
  id: string;
  worker: string;
  initials: string;
  hoursThisFortnight: number;
  preferredHours: number;
  daysSinceProperBreak: number;
  flag: PulseFlag;
  note: string;
}

export const workerPulses: WorkerPulse[] = [
  {
    id: "wp1",
    worker: "Grace Whitfield",
    initials: "GW",
    hoursThisFortnight: 42,
    preferredHours: 38,
    daysSinceProperBreak: 11,
    flag: "check-in",
    note: "11 days without 2 consecutive days off. Roster has auto-drafted a swap with Tess for Sunday.",
  },
  {
    id: "wp2",
    worker: "Leila Haddad",
    initials: "LH",
    hoursThisFortnight: 13,
    preferredHours: 20,
    daysSinceProperBreak: 2,
    flag: "steady",
    note: "Under preferred hours and declined 3 offers — pattern flagged gently: might be study season, might be drift. Priya is checking in.",
  },
  {
    id: "wp3",
    worker: "Daniel Okafor",
    initials: "DO",
    hoursThisFortnight: 36,
    preferredHours: 38,
    daysSinceProperBreak: 3,
    flag: "thriving",
    note: "Balanced load, regular rest, 2 kudos this fortnight. His Milo sessions rate as the week's highlight — both directions.",
  },
  {
    id: "wp4",
    worker: "Amira Chen",
    initials: "AC",
    hoursThisFortnight: 30,
    preferredHours: 30,
    daysSinceProperBreak: 4,
    flag: "thriving",
    note: "Six months in, retention risk low. Mentoring pathway with Grace suggested as the next growth step.",
  },
];

export const wellbeingStats = {
  teamPulse: "8.1 / 10",
  onWatch: 2,
  turnover: "9%",
  kudosThisMonth: 47,
};

export const kudosFeed = [
  {
    id: "k1",
    from: "Faraz Normani",
    to: "Leila Haddad",
    message: "Zayd ran to the door when he saw it was you today. That has never happened before. Thank you.",
    when: "Yesterday",
  },
  {
    id: "k2",
    from: "Priya Sharma",
    to: "Daniel Okafor",
    message: "Your incident report on Tuesday was textbook — fast, calm, and Milo felt safe the whole time.",
    when: "2 days ago",
  },
  {
    id: "k3",
    from: "Ava Nguyen",
    to: "Grace Whitfield",
    message: "Grace helped me send my first article pitch. She believed it was possible before I did.",
    when: "This week",
  },
];

export const wellbeingDifference = [
  {
    title: "The roster is a wellbeing instrument",
    detail:
      "Burnout hides in plain sight: stacked sleepovers, skipped breaks, declined offers. Team Pulse reads the same roster data that runs payroll and surfaces the pattern before the resignation letter — with a fix drafted, not just a flag.",
  },
  {
    title: "Fairness you can see",
    detail:
      "Hours vs preferences, weekend spread, travel load — visible per worker. The quiet driver of churn isn't pay, it's feeling like the roster happens TO you. Here it's negotiated with you.",
  },
  {
    title: "Recognition that reaches workers",
    detail:
      "When Faraz says “Zayd ran to the door,” Leila sees it — and so does her team leader at review time. In a sector losing 1 in 4 workers a year, being seen is retention infrastructure.",
  },
];
