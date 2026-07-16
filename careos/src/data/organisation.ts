/**
 * Fictional organisation-level demo data for the Provider and CEO dashboards.
 * "Sunrise Support Collective" is an entirely fictional provider.
 */

export const organisation = {
  name: "Sunrise Support Collective",
  participants: 86,
  staff: 34,
  activeShiftsNow: 12,
  familyAccounts: 71,
};

export const outcomeSummary = {
  outcomesIndex: 82, // composite 0–100
  outcomesIndexDelta: +6,
  goalsAchievedThisQuarter: 47,
  goalsOnTrack: 118,
  goalsNeedingAttention: 14,
  familyEngagementRate: 78, // % of family accounts active weekly
  staffConsistencyScore: 84, // % of shifts by a participant's core team
  documentationSameDay: 93, // % of shift notes completed same day
  incidentsOpen: 3,
  incidentsClosedThisMonth: 11,
};

export const ceoQuestions = [
  {
    question: "Are participants improving?",
    answer: "Yes — outcome index 82 (+6 this quarter). 47 goals achieved, independence trends positive for 71% of participants.",
    status: "positive" as const,
  },
  {
    question: "Are families engaged?",
    answer: "78% of family accounts active weekly (+9pts since portal redesign). Family notes up 34% quarter-on-quarter.",
    status: "positive" as const,
  },
  {
    question: "Are staff consistent?",
    answer: "84% of shifts delivered by core teams. Two programs below 70% — Fairfield day program is the priority.",
    status: "watch" as const,
  },
  {
    question: "Where are our biggest risks?",
    answer: "3 open incidents (all on track for closure), mealtime plan refresher training 81% complete, winter staffing pinch forecast for August.",
    status: "watch" as const,
  },
  {
    question: "What should I focus on today?",
    answer: "Approve the Fairfield roster proposal — modelling suggests it lifts consistency 11pts and touches 14 participants.",
    status: "action" as const,
  },
];

export const monthlyOutcomes = [
  { month: "Feb", outcomes: 71, engagement: 64, consistency: 78 },
  { month: "Mar", outcomes: 73, engagement: 67, consistency: 80 },
  { month: "Apr", outcomes: 75, engagement: 70, consistency: 79 },
  { month: "May", outcomes: 78, engagement: 72, consistency: 82 },
  { month: "Jun", outcomes: 80, engagement: 75, consistency: 83 },
  { month: "Jul", outcomes: 82, engagement: 78, consistency: 84 },
];

export const goalsByCategory = [
  { category: "Independence", achieved: 14, active: 38 },
  { category: "Communication", achieved: 9, active: 26 },
  { category: "Community", achieved: 11, active: 31 },
  { category: "Health", achieved: 7, active: 22 },
  { category: "Employment", achieved: 3, active: 9 },
  { category: "Skills", achieved: 3, active: 6 },
];

export const riskHeatmap = [
  { area: "Documentation quality", level: "low", detail: "93% same-day completion, audit pass rate 97%" },
  { area: "Staff consistency — Fairfield", level: "high", detail: "Core-team coverage at 64%. Roster proposal awaiting approval" },
  { area: "Mealtime plan training", level: "medium", detail: "81% of required staff current. 6 staff booked for the 22 Jul session" },
  { area: "Incident follow-up", level: "low", detail: "3 open, none overdue. Average closure 6.2 days" },
  { area: "Winter staffing", level: "medium", detail: "August leave overlaps forecast a 7% capacity gap in the north team" },
  { area: "Medication administration", level: "low", detail: "Zero missed-dose incidents in 60 days. PRN documentation improved" },
] as const;

export const teamPulse = [
  { name: "Daniel Okafor", role: "Support worker", participants: ["milo"], shiftsThisWeek: 5, notesQuality: 98, highlight: "Milo's café goal owner — 3 independent orders this fortnight" },
  { name: "Grace Whitfield", role: "Senior support worker", participants: ["ava"], shiftsThisWeek: 4, notesQuality: 96, highlight: "Leading conference logistics; mentoring two new staff" },
  { name: "Tess Nguyen-Park", role: "Support worker", participants: ["jordan"], shiftsThisWeek: 4, notesQuality: 94, highlight: "Built the Rosie's Café employment proposal with Jordan" },
  { name: "Priya Sharma", role: "Team leader", participants: ["milo", "ava", "jordan"], shiftsThisWeek: 2, notesQuality: 97, highlight: "Quarterly reviews complete a week early" },
];

export const familyEngagementSeries = [
  { month: "Feb", visits: 410, notes: 58 },
  { month: "Mar", visits: 445, notes: 61 },
  { month: "Apr", visits: 480, notes: 70 },
  { month: "May", visits: 530, notes: 74 },
  { month: "Jun", visits: 585, notes: 82 },
  { month: "Jul", visits: 640, notes: 91 },
];
