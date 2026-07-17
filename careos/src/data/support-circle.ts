/**
 * Support Circle — the provider's peer-support Q&A community.
 *
 * A support worker (or family member) asks a general question. An AI
 * first-responder replies instantly with grounded, general guidance, then any
 * QUALIFIED colleague who supports that participant can jump in with real,
 * lived advice. Because answerers are employees with permissioned access, they
 * can open the participant's Care DNA and recent updates to answer well.
 *
 * Not for emergencies. In an emergency: call 000, or the participant's
 * provider on-call line. This is general advice and shared learning only.
 */

export interface CircleAnswer {
  id: string;
  author: string;
  role: string; // "Support worker · 6 yrs"
  credentials: string[]; // badges: "Verified", "Works with Zayd", "AAC trained"
  time: string;
  body: string;
  helpful: number;
  aiAssist?: boolean; // the AI first-responder
  accepted?: boolean; // marked most helpful by the asker
}

export interface CircleThread {
  id: string;
  author: string;
  authorRole: string; // "Support worker" | "Parent" | "Team leader"
  time: string;
  participantId?: string; // tagged participant — answerers can view their context
  topic: string;
  title: string;
  body: string;
  answers: CircleAnswer[];
  resolved: boolean;
}

export const circleThreads: CircleThread[] = [
  {
    id: "sc1",
    author: "Sam O.",
    authorRole: "Support worker",
    time: "35 min ago",
    participantId: "zayd",
    topic: "Communication",
    title: "Zayd's talker keeps getting left in the bag on pool days — tips?",
    body: "Covering a Saturday swim with Zayd for the first time. I know his talker should be poolside but I'm nervous about it near water. How do the regular team manage it?",
    resolved: true,
    answers: [
      {
        id: "sc1a1",
        author: "CareOS Assist",
        role: "AI first-responder",
        credentials: ["AI · review with a person"],
        time: "35 min ago",
        aiAssist: true,
        helpful: 4,
        body: "General guidance: an AAC user's device is their voice, so it should stay within reach — including the pool deck. Common approach is a waterproof case on a mount at the water's edge. Model language on it during the fun (e.g. press MORE, SWIM). This is general advice — check Zayd's Communication Plan and confirm with his key worker before the shift.",
      },
      {
        id: "sc1a2",
        author: "Leila Haddad",
        role: "Support worker · 5 yrs",
        credentials: ["Verified", "Works with Zayd", "Water-safety trained"],
        time: "22 min ago",
        accepted: true,
        helpful: 9,
        body: "Hey Sam — I'm Zayd's Saturday regular. His waterproof case + the poolside mount are in the blue kit bag, front pocket. Clip it to the lane rope mount so it's at his eye line but away from the edge. He asked for KICKBOARD on it twice last week — massive win, so keep modelling. And honestly, he'll show you where he wants it. Text me if anything's unclear, I'm on til 1.",
      },
    ],
  },
  {
    id: "sc2",
    author: "Priya S.",
    authorRole: "Support worker",
    time: "2 hours ago",
    participantId: "idris",
    topic: "Sensory",
    title: "Best way to get Idris past the shopping-centre hand dryers?",
    body: "New to Idris. We've got a community outing planned and I know dryers are a big trigger. What's actually worked for the team?",
    resolved: true,
    answers: [
      {
        id: "sc2a1",
        author: "CareOS Assist",
        role: "AI first-responder",
        credentials: ["AI · review with a person"],
        time: "2 hours ago",
        aiAssist: true,
        helpful: 3,
        body: "General guidance: for a known sound trigger, plan the route to avoid it where possible, have ear defenders on before entering, and pair the moment with a preferred regulating input. Idris's profile lists a sleeve chewy and a favourite nasheed — worth having ready. Please confirm with his key worker and PBS plan; this is general advice only.",
      },
      {
        id: "sc2a2",
        author: "Amira Chen",
        role: "Support worker · 4 yrs",
        credentials: ["Verified", "Works with Idris", "PBS informed"],
        time: "1 hour ago",
        accepted: true,
        helpful: 7,
        body: "Hi Priya! Ear defenders ON before you walk in — don't wait. We route around the food court dryers entirely (map's in his outing tips). If we can't avoid, I hum his track (the one on repeat in the car) and hold his hand past it. He walked past the Coburg Square ones last week holding hands, no tears — huge. End on the ducks and he'll forgive anything.",
      },
      {
        id: "sc2a3",
        author: "Tom R.",
        role: "Team leader",
        credentials: ["Verified", "PBS practitioner"],
        time: "48 min ago",
        helpful: 4,
        body: "Adding to Amira — if it does go sideways, that's fine, it's not a failure. Lower demands, get to the quiet spot, wrap the plan for the day. Log what happened so we can tune the outing plan. You've got this.",
      },
    ],
  },
  {
    id: "sc3",
    author: "Faraz Normani",
    authorRole: "Parent",
    time: "Yesterday",
    participantId: "zayd",
    topic: "Routines",
    title: "Any gentle ideas for teeth brushing? It's our hardest 5 minutes.",
    body: "Not urgent at all — just after ideas from people who know this stuff. Mornings are going well except teeth. Zayd tolerates it but it's clearly hard for him.",
    resolved: false,
    answers: [
      {
        id: "sc3a1",
        author: "CareOS Assist",
        role: "AI first-responder",
        credentials: ["AI · review with a person"],
        time: "Yesterday",
        aiAssist: true,
        helpful: 5,
        body: "General ideas that help many autistic kids: a predictable count/song so there's a clear end point, letting them hold a second brush, trying a softer or vibrating brush, and doing it at the calmest point of the routine. Zayd's plan already uses a timer + counting song — building on that consistency usually beats changing it. Not medical advice — his OT is the best person to tailor this.",
      },
      {
        id: "sc3a2",
        author: "Grace Whitfield",
        role: "Senior support worker · 8 yrs",
        credentials: ["Verified", "Autism specialist"],
        time: "Yesterday",
        helpful: 6,
        body: "Faraz — the counting song is gold, keep it. Two things that help a lot of the kids I've supported: let him do the first 5 seconds himself (control), then you finish; and warm the brush under the tap first, the cold sets some kids off. If he's got an OT, mention it at the next session — they can do a proper desensitisation plan. You're doing brilliantly.",
      },
    ],
  },
  {
    id: "sc4",
    author: "Jordan's cover worker",
    authorRole: "Support worker",
    time: "Yesterday",
    participantId: "jordan",
    topic: "Independence",
    title: "Covering Jordan tonight — how hands-off should I be in the kitchen?",
    body: "First shift with Jordan. I know they cook and I'm kitchen-hand only, but where's the line if they get tired mid-cook?",
    resolved: true,
    answers: [
      {
        id: "sc4a1",
        author: "CareOS Assist",
        role: "AI first-responder",
        credentials: ["AI · review with a person"],
        time: "Yesterday",
        aiAssist: true,
        helpful: 2,
        body: "General guidance: honour the person's independence, step in only when asked or on safety. Jordan's profile flags cognitive fatigue — if they say 'brain's cooked', that's the cue to lower demands, not push through. Their fatigue plan has the detail. Confirm specifics with their key worker.",
      },
      {
        id: "sc4a2",
        author: "Tess Nguyen-Park",
        role: "Support worker · 6 yrs",
        credentials: ["Verified", "Works with Jordan", "ABI experienced"],
        time: "Yesterday",
        accepted: true,
        helpful: 8,
        body: "You'll be great. Timers are running for every parallel step — your job is passing and prepping, they lead. If they snap their fingers mid-sentence, wait, don't supply the word. If 'brain's cooked' comes out, dinner becomes leftovers and that's the plan WORKING, not failing. Name the day's wins at dinner — it matters to them. I'm on WhatsApp if you need me.",
      },
    ],
  },
  {
    id: "sc5",
    author: "Dana K.",
    authorRole: "Support worker",
    time: "2 days ago",
    topic: "General practice",
    title: "Go-to sensory-friendly cafés in the inner north? Building an outings list.",
    body: "General one for the team — collecting cafés that are genuinely good for our participants (quiet-ish, step-free, patient staff). What are your reliable ones?",
    resolved: false,
    answers: [
      {
        id: "sc5a1",
        author: "CareOS Assist",
        role: "AI first-responder",
        credentials: ["AI · review with a person"],
        time: "2 days ago",
        aiAssist: true,
        helpful: 1,
        body: "Tip: the Community Planner already lists verified accessible + sensory-friendly venues with quiet-hour notes — worth starting there and adding your finds. General advice only; always check current access before promising an outing.",
      },
      {
        id: "sc5a2",
        author: "Daniel Okafor",
        role: "Support worker · 7 yrs",
        credentials: ["Verified"],
        time: "2 days ago",
        helpful: 5,
        body: "Little Duck in Thornbury before 8:30am is dead quiet and the staff are lovely — Jordan's spot. Brunswick Bowl has a wheelchair table by the window if you book it. Both in the Community Planner now with notes.",
      },
    ],
  },
];

export const circleTopics = ["All", "Communication", "Sensory", "Routines", "Independence", "General practice"];

export const circleStats = {
  activeMembers: 34,
  answeredThisWeek: 27,
  avgFirstReply: "4 min",
  resolvedRate: 92,
};
