import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const org = await prisma.organisation.findFirst();
const SESSIONS = [
  { title: "UNC LIVE — Mindset", topic: "Mindset",
    blurb: "How to walk onto the court with your head right — nerves, mistakes, the voice in your head. You leave with a reset you can use at your next game.", n: 1 },
  { title: "UNC LIVE — Defence", topic: "Defence",
    blurb: "Defence isn't effort, it's decisions. Stance, angles, when to help and when to stay. Film, questions and a memory game you'll actually remember.", n: 2 },
  { title: "UNC LIVE — Nutrition", topic: "Nutrition",
    blurb: "What to eat before a game, between games and after — in real food, on a real budget, for a real teenager. General education, not a meal plan.", n: 3 },
  { title: "UNC LIVE — Basketball IQ", topic: "Basketball IQ",
    blurb: "Reading the game a beat earlier. Spacing, the extra pass, what the defence is telling you. Built around plays you'll recognise from your own games.", n: 4 },
];
for (const s of SESSIONS) {
  const exists = await prisma.studioSession.findFirst({ where: { orgId: org.id, title: s.title } });
  if (exists) { console.log("skip", s.title); continue; }
  await prisma.studioSession.create({
    data: { orgId: org.id, title: s.title, topic: s.topic, blurb: s.blurb,
      pricePerSeat: 10, capacity: 20, ageBand: "All ages", listed: false,
      timeText: null, notes: `Session ${s.n} of 4 · deck built` },
  });
  console.log("added", s.title);
}
await prisma.$disconnect();
