/**
 * Review Ready — walk into every plan reassessment with the evidence stacked.
 *
 * Sector problem: funding gets cut at reassessment when evidence is missing or
 * when well-meaning reports say "managing well with support" (the NDIA reads
 * that as improvement and trims hours). Families and therapists scramble for
 * weeks assembling documents. In CareOS, every shift note is already
 * timestamped evidence, an AI language guard protects reports from
 * funding-losing phrasing, and the full evidence pack builds in minutes.
 */

export const reviewStats = {
  evidenceItemsThisPlan: 1240,
  goalsWithEvidence: "100%",
  packBuildTime: "4 min",
  fundingDefended: "$412k",
};

export interface LanguageGuardExample {
  id: string;
  flagged: string;
  risk: string;
  suggested: string;
}

/** The AI language guard — protects funding from accidentally-fatal phrasing. */
export const languageGuardExamples: LanguageGuardExample[] = [
  {
    id: "lg1",
    flagged: "“Zayd is managing well with support.”",
    risk: "Reads as improvement — planners may cut the very support making it work.",
    suggested: "“Zayd requires daily 1:1 support to manage transitions; without it, he is unable to leave the house safely.”",
  },
  {
    id: "lg2",
    flagged: "“Idris is more independent with prompting.”",
    risk: "“Independent” without functional context invites a funding reduction.",
    suggested: "“Idris completes 2 of 6 morning-routine steps with continuous verbal prompting; full support remains essential for the rest.”",
  },
  {
    id: "lg3",
    flagged: "“Good progress this quarter.”",
    risk: "Progress statements without support-need links are read as reduced need.",
    suggested: "“Progress achieved because of 3 supported sessions weekly — progress is contingent on this support continuing.”",
  },
];

export const evidencePackContents = [
  { item: "Goal progress, charted", detail: "Every goal with real trend lines from daily records — not recollections." },
  { item: "Functional impact summary", detail: "Needs linked to supports linked to outcomes — the exact chain planners must see." },
  { item: "Support logs, timestamped", detail: "1,240 evidence items this plan: shift notes, KnockIn arrivals, therapy sessions." },
  { item: "Therapist reports, language-checked", detail: "Every report run through the language guard before it goes anywhere near the NDIA." },
  { item: "Incident & health history", detail: "Context that shows why supports are not optional — assembled with consent." },
];

export const reviewDifference = [
  {
    title: "Evidence is a by-product",
    detail:
      "Other providers reconstruct a year of care in a fortnight of panic. In CareOS the reassessment pack already exists — every note, arrival and outcome has been quietly filed as evidence since day one.",
  },
  {
    title: "The language guard",
    detail:
      "One wrong sentence — “managing well” — can cost a family thousands of dollars of support. CareOS reads every outgoing report like a planner would and suggests functional-impact wording that tells the truth AND protects the funding.",
  },
  {
    title: "Families walk in armed",
    detail:
      "Faraz gets the same pack, in plain language, before the meeting — what's working, what it costs, and what's at stake. No family should face a reassessment less informed than the agency across the table.",
  },
];
