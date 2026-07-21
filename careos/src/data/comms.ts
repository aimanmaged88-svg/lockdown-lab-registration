/**
 * Communications Hub — every conversation, one place, tied to the person.
 *
 * Answers Titus CRM's "unified inbox" + "Andy AI" call answering. In CareOS the
 * inbox isn't a separate channel silo: every SMS, call, email and chat is linked
 * to the participant or family it's about, so a message can become a note, a task
 * or an alert in one tap. An AI receptionist answers when no one can, transcribes
 * the call, extracts the action items and drafts a reply — which a person approves.
 */

export type Channel = "sms" | "call" | "email" | "chat";

export interface Thread {
  id: string;
  name: string;
  initials: string;
  about: string; // participant this concerns
  channel: Channel;
  preview: string;
  time: string;
  unread: boolean;
}

export const inboxThreads: Thread[] = [
  { id: "t1", name: "Faraz Normani", initials: "FN", about: "re: Zayd", channel: "sms", preview: "Thank you for the update — Zayd loved the park today.", time: "9m", unread: true },
  { id: "t2", name: "Missed call · 02 9xxx", initials: "AI", about: "AI-answered", channel: "call", preview: "AI receptionist took a message — plan review question. Action item created.", time: "24m", unread: true },
  { id: "t3", name: "Northcote Physio", initials: "NP", about: "re: Milo", channel: "email", preview: "Milo's next session is confirmed for Thursday 2pm.", time: "1h", unread: false },
  { id: "t4", name: "Jordan Wells", initials: "JW", about: "re: Jordan", channel: "chat", preview: "Can we move Friday's shift to the morning?", time: "2h", unread: false },
  { id: "t5", name: "Support Coordinator", initials: "SC", about: "re: Ava", channel: "email", preview: "Sharing Ava's updated goals ahead of the planning meeting.", time: "3h", unread: false },
];

export const commsStats = {
  unified: 4, // channels
  handledByAI: 38, // % of first contacts
  avgResponse: "6 min",
  openThreads: 2,
};

/** The AI receptionist — one worked example. */
export const aiReception = {
  caller: "Faraz Normani",
  about: "Zayd",
  when: "24 minutes ago · 47 seconds",
  transcript:
    "“Hi, it's Faraz, Zayd's dad. Just wondering if the OT report is ready for the plan review next week, and whether Leila is on for Thursday. Thanks.”",
  summary:
    "Faraz (Zayd's father) is asking whether the OT report is ready for next week's plan review, and confirming Leila's Thursday shift.",
  actions: [
    "Check OT report status for Zayd's plan review",
    "Confirm Leila is rostered Thursday and reply",
  ],
  draftReply:
    "Hi Faraz, thanks for calling. Leila is confirmed for Thursday. The OT report is with the therapist and we'll have it to you before the review — I'll send it the moment it's ready.",
};

export const commsDifference = [
  {
    title: "One inbox, tied to the person",
    detail:
      "SMS, calls, email and chat land in one place — and every message is linked to the participant or family it's about. Open a thread and their Care DNA, goals and shifts are one tap away. No copying between apps.",
  },
  {
    title: "An AI receptionist, not an answering machine",
    detail:
      "When no one can pick up, the AI answers 24/7, transcribes the call, extracts the action items and drafts a reply. A person reviews and sends. Nothing is missed at 7pm on a Friday, and no family is left on hold.",
  },
  {
    title: "A message becomes work — in one tap",
    detail:
      "Turn any message into a progress note, a task or an alert, routed to the right person. The conversation and the action live on the same record, so nothing falls through the cracks between the phone and the file.",
  },
];
