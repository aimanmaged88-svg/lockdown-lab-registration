/**
 * Budget Guardian — plan budgets that never run out by surprise.
 *
 * Sector problem: participants discover mid-plan that funds are gone; providers
 * lose weeks of cash flow to rejected claims (wrong item numbers, missing
 * service agreements, plan mismatches); claim windows shrink to 90 days from
 * Dec 2026; and community-participation budgets reset sharply from Oct 2026.
 * Budget Guardian forecasts every budget forward, pre-validates every claim
 * before it leaves the building, and shows families the same truth in plain
 * language.
 */

export type BudgetForecast = "on-track" | "watch" | "will-run-short";

export interface ParticipantBudget {
  id: string;
  participantId: string;
  category: string;
  allocated: number;
  used: number;
  /** Percentage of the plan year elapsed. */
  planElapsedPct: number;
  forecast: BudgetForecast;
  forecastNote: string;
}

export const participantBudgets: ParticipantBudget[] = [
  {
    id: "bg1",
    participantId: "zayd",
    category: "Core — daily activities",
    allocated: 68400,
    used: 31900,
    planElapsedPct: 49,
    forecast: "on-track",
    forecastNote: "Burn rate matches the plan. Funds last the full plan year.",
  },
  {
    id: "bg2",
    participantId: "idris",
    category: "Capacity building — daily living",
    allocated: 22000,
    used: 14300,
    planElapsedPct: 49,
    forecast: "watch",
    forecastNote: "Tracking 16% hot — at this pace funds run out 6 weeks early. Suggested: shift one weekly session to group delivery.",
  },
  {
    id: "bg3",
    participantId: "ava",
    category: "Community participation",
    allocated: 12000,
    used: 5700,
    planElapsedPct: 49,
    forecast: "watch",
    forecastNote: "On pace now — but this category resets lower from Oct 2026. CareOS has already drafted a re-plan so nothing stops mid-program.",
  },
  {
    id: "bg4",
    participantId: "milo",
    category: "Core — daily activities",
    allocated: 41200,
    used: 18100,
    planElapsedPct: 49,
    forecast: "on-track",
    forecastNote: "Steady. Weekend loading modelled in — no end-of-plan surprise.",
  },
  {
    id: "bg5",
    participantId: "jordan",
    category: "Capacity building — employment",
    allocated: 15800,
    used: 11900,
    planElapsedPct: 49,
    forecast: "will-run-short",
    forecastNote: "Runs out ~9 weeks early at current pace. Flagged to the support coordinator with the evidence pack for a plan variation.",
  },
];

export const budgetStats = {
  plansTracked: 86,
  forecastFlags: 4,
  claimsPreChecked: "100%",
  rejectionRate: "0.4%",
};

/** Pre-claim validation — catches the errors that cause NDIA rejections BEFORE submission. */
export const claimGuardChecks = [
  {
    check: "Support item number matches the current Pricing Arrangements",
    catchExample: "Caught 3 claims this month still coded to last year's item numbers — fixed before submission.",
  },
  {
    check: "Service agreement on file and current",
    catchExample: "Blocked a claim where the agreement had lapsed — renewal e-signed by the family the same day.",
  },
  {
    check: "Claim matches the participant's plan categories and remaining funds",
    catchExample: "Mirrors the NDIA's new automated validation — if it would bounce there, it never leaves here.",
  },
  {
    check: "Claim age vs the 90-day window",
    catchExample: "Every unclaimed shift shows a countdown. Nothing quietly expires into unclaimable revenue.",
  },
];

export const budgetDifference = [
  {
    title: "Forecast, not autopsy",
    detail:
      "Most software tells you a budget ran out. Budget Guardian projects every category forward from real delivery pace and flags a shortfall months early — with a suggested fix, not just a warning.",
  },
  {
    title: "Claims that never bounce",
    detail:
      "Nearly half of providers run at a loss, and one rejected batch can mean a 30–60 day cash-flow hole. Every CareOS claim is pre-validated against the plan, the price guide and the service agreement before it's submitted.",
  },
  {
    title: "Families see the same truth",
    detail:
      "Faraz can open the boys' budgets any time — plain-language, up to date, no jargon. No more end-of-plan shock, and no awkward 'please spend the rest' scramble in the last month.",
  },
];
