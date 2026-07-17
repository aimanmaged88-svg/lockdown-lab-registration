/**
 * Fictional billing & NDIS claims demo data.
 * CareOS billing is downstream of care: a confirmed shift is a claim line,
 * already coded to the right NDIS support item — no re-keying, no leakage.
 */

export const billingStats = {
  readyToClaim: 18420,
  claimedThisMonth: 61240,
  awaitingPayment: 12880,
  claimAccuracy: 99.4, // % accepted first time
};

export interface ClaimBatch {
  id: string;
  period: string;
  lines: number;
  value: number;
  status: "ready" | "submitted" | "paid";
  note: string;
}

export const claimBatches: ClaimBatch[] = [
  { id: "cb1", period: "Week 13–19 Jul", lines: 34, value: 18420, status: "ready", note: "Auto-built from confirmed shifts · all items coded & price-checked" },
  { id: "cb2", period: "Week 6–12 Jul", lines: 41, value: 22160, status: "submitted", note: "Bulk-submitted to NDIA · awaiting remittance" },
  { id: "cb3", period: "Week 29 Jun–5 Jul", lines: 38, value: 20980, status: "paid", note: "Paid in full · reconciled automatically" },
  { id: "cb4", period: "Week 22–28 Jun", lines: 36, value: 18100, status: "paid", note: "Paid in full · reconciled automatically" },
];

export const supportItems = [
  { code: "01_011_0107_1_1", name: "Assistance with self-care — weekday", used: 42, value: 3980 },
  { code: "04_104_0125_6_1", name: "Access community, social & rec — standard", used: 31, value: 4120 },
  { code: "01_013_0117_1_1", name: "Assistance with self-care — Saturday", used: 12, value: 1680 },
  { code: "15_038_0117_1_3", name: "Assistance with daily life tasks (group/shared)", used: 18, value: 2240 },
];

export const billingDifference = [
  { title: "Zero double entry", detail: "A confirmed shift already carries the support item, price and participant. The claim line exists before anyone opens a spreadsheet." },
  { title: "Leakage caught before it happens", detail: "Unclaimed delivered hours and price-guide mismatches are flagged the moment they occur — not discovered at month-end." },
  { title: "Payslips from the same source", detail: "The hours that bill the NDIA also run payroll. One truth, two outputs — no reconciliation between systems." },
];
