import type { Shift } from "@/types";

/** Today's demo shifts — Wednesday 15 July 2026. */
export const shifts: Shift[] = [
  {
    id: "shift-milo-am",
    participantId: "milo",
    workerName: "Daniel Okafor",
    date: "2026-07-15",
    start: "7:00am",
    end: "9:00am",
    status: "complete",
    focus: "Independent morning routine + school departure",
    briefing: {
      headline: "Milo is on a four-day independent-morning streak. Today could make five — stay hands-off, eyes-on.",
      remember: ["He packs the school bag himself; you only verify iPad charge", "Preview tonight's dinner at breakfast (menu card on fridge)", "Count level crossings on the walk — it's the routine"],
      communicationTips: ["First/Then language", "10–15s processing time", "Choices of two, shown visually"],
      sensoryNotes: ["Kitchen blender before 8am is a known trigger — don't", "Weighted blanket stays on the bed, not packed"],
      alerts: ["Platform safety rule applies at the crossing: hand on rail or in pocket"],
    },
    checklist: [
      { id: "c1", time: "7:00", title: "Visual schedule review", detail: "Milo leads. Observe only.", category: "routine", done: true },
      { id: "c2", time: "7:15", title: "Breakfast", detail: "Toast triangles, honey, separate fruit plate", category: "routine", done: true },
      { id: "c3", time: "7:45", title: "Teeth + dressing (independent)", detail: "Picture sequence on mirror — goal step, no prompts", category: "goal", done: true },
      { id: "c4", time: "8:00", title: "Fluoxetine 20mg", detail: "With breakfast. Double-sign in med record", category: "medication", done: true },
      { id: "c5", time: "8:15", title: "Bag check", detail: "iPad charged ≥80%, headphones, chewy pendant", category: "routine", done: true },
      { id: "c6", time: "8:30", title: "Walk to bus", detail: "Same route. Note crossing count in shift log", category: "community", done: true },
      { id: "c7", time: "8:50", title: "Handover note", detail: "AI draft, review, send to afternoon team + Mum's portal", category: "handover", done: true },
    ],
  },
  {
    id: "shift-ava-day",
    participantId: "ava",
    workerName: "Grace Whitfield",
    date: "2026-07-15",
    start: "8:00am",
    end: "4:00pm",
    status: "active",
    focus: "Conference talk rehearsal + seating pre-check",
    briefing: {
      headline: "Big writing energy this week — essay hit 2,100 views. Protect the morning block; rehearsal at 2pm is the day's anchor.",
      remember: ["Repositioning at 10am, 12pm, 2pm — she'll confirm timing", "Sparky to 100% before the 2pm rehearsal", "Seating review is next week: photograph current setup today"],
      communicationTips: ["Eye level, one question at a time", "Never finish sentences", "Read the screen back to confirm"],
      sensoryNotes: ["Heat pack for hands — it's a cold morning", "She'll want the balcony door open while writing, blanket on"],
      alerts: ["Mealtime plan exactly as written — IDDSI 5, fluids level 2", "Report any mealtime coughing same-day"],
    },
    checklist: [
      { id: "c1", time: "8:00", title: "Pain check on Sparky", detail: "0–10 before anything else. Log the number", category: "wellbeing", done: true },
      { id: "c2", time: "8:20", title: "Shower + transfer (2 staff)", detail: "Hoist per manual handling plan. Her playlist", category: "routine", done: true },
      { id: "c3", time: "9:00", title: "Baclofen 10mg + Vitamin D", detail: "With breakfast per MAR", category: "medication", done: true },
      { id: "c4", time: "9:15", title: "Breakfast — mealtime plan", detail: "Upright 90°, her pace, conversation on", category: "routine", done: true },
      { id: "c5", time: "10:30", title: "Protected writing block", detail: "90 min. Interruptions: building fires only", category: "goal", done: true },
      { id: "c6", time: "12:00", title: "Reposition + lunch", detail: "Positioning chart. Photograph seating setup for AT clinic", category: "routine", done: false },
      { id: "c7", time: "14:00", title: "Conference talk rehearsal", detail: "Full run-through with slide timings — goal session", category: "goal", done: false },
      { id: "c8", time: "14:00", title: "Baclofen 10mg", detail: "Afternoon dose per MAR", category: "medication", done: false },
      { id: "c9", time: "15:30", title: "Handover + family update", detail: "AI draft, Ava approves what's shared with Mum", category: "handover", done: false },
    ],
  },
  {
    id: "shift-jordan-pm",
    participantId: "jordan",
    workerName: "Tess Nguyen-Park",
    date: "2026-07-15",
    start: "4:30pm",
    end: "7:30pm",
    status: "upcoming",
    focus: "Dinner prep (they lead) + peer group logistics for tomorrow",
    briefing: {
      headline: "Jordan ran this morning solo — bike, breakfast, meds. Energy budget likely mid-range by 4:30; keep the evening light.",
      remember: ["You are the kitchen-hand, not the chef", "Whiteboard for tomorrow: peer group 6pm, Mo drives home", "EpiPen backpack check is due 1 Aug — flag, don't do"],
      communicationTips: ["Wait through word-finding pauses — watch for the finger snap", "One thing at a time; text anything with steps", "Recap decisions at the end"],
      sensoryNotes: ["If 'brain's cooked' is declared, dinner becomes leftovers — that's the plan working", "Kitchen playlist: 70s soul, their phone"],
      alerts: ["ALL shellfish is anaphylaxis-level — check any new ingredients", "Timers on, phone in sight for anything on heat"],
    },
    checklist: [
      { id: "c1", time: "16:30", title: "Arrival + fatigue check-in", detail: "Ask where the wall is today. Plan accordingly", category: "wellbeing", done: false },
      { id: "c2", time: "17:00", title: "Dinner prep — Jordan leads", detail: "Tonight: laksa (chicken — shellfish-free stock verified)", category: "goal", done: false },
      { id: "c3", time: "18:15", title: "Dinner + wins recap", detail: "Name today's three wins out loud — it matters", category: "wellbeing", done: false },
      { id: "c4", time: "19:00", title: "Tomorrow's whiteboard", detail: "Peer group 6pm, neuropsych review 23rd, photo + reminders", category: "routine", done: false },
      { id: "c5", time: "19:20", title: "Handover note", detail: "AI draft, Jordan reads and approves before it sends", category: "handover", done: false },
    ],
  },
];

export function getShift(id: string): Shift | undefined {
  return shifts.find((s) => s.id === id);
}

export function getActiveShift(): Shift {
  return shifts.find((s) => s.status === "active") ?? shifts[0];
}
