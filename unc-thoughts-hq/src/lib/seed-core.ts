import { addDays } from "date-fns";
import { CHECKLIST_STEPS, SPACES, WEEKLY_RHYTHM } from "./enums";
import { CHALLENGE_TEMPLATES } from "./coach-content";
import { PRACTICE_LESSONS } from "../../prisma/data/practice";
import researchRaw from "../../prisma/data/research.json";
import { prisma as sharedPrisma } from "./db";
import type { PrismaClient } from "@prisma/client";

const ORG_SLUG = "unc-thoughts";

function at(d: Date, h: number, m = 0): Date {
  const x = new Date(d);
  x.setHours(h, m, 0, 0);
  return x;
}

// Idempotent seed shared by the CLI (prisma/seed.ts) and the guarded
// /api/admin/seed route (used once after a hosted deploy). Safe to re-run.
export async function seed(prisma: PrismaClient = sharedPrisma): Promise<{ ok: true; org: string }> {
  const org = await prisma.organisation.upsert({
    where: { slug: ORG_SLUG },
    update: {},
    create: { slug: ORG_SLUG, name: "UNC Thoughts" },
  });

  const owner = await prisma.user.upsert({
    where: { email: "owner@unc-thoughts.local" },
    update: {},
    create: {
      orgId: org.id, email: "owner@unc-thoughts.local", displayName: "UNC",
      handle: "unc.thoughts", role: "owner", isAdult: true, adultConfirmedAt: new Date(),
    },
  });

  for (const key of ["community_beta", "video_inspect"]) {
    await prisma.featureFlag.upsert({
      where: { orgId_key: { orgId: org.id, key } },
      update: {},
      create: { orgId: org.id, key, enabled: false },
    });
  }

  // Reference data — delete + bulk insert (fast, one round-trip each). Safe to
  // re-run: it's reference content, not user data.
  const research = researchRaw as Array<Record<string, string | boolean>>;
  await prisma.researchEntry.deleteMany({ where: { orgId: org.id } });
  await prisma.researchEntry.createMany({
    data: research.map((r) => ({
      orgId: org.id, recommendation: String(r.recommendation), platform: String(r.platform),
      category: String(r.category), sourceName: String(r.sourceName), sourceUrl: String(r.sourceUrl),
      dateChecked: new Date(String(r.dateChecked)), ruleType: String(r.ruleType),
      whyForUnc: String(r.whyForUnc), confidence: String(r.confidence),
      reviewBy: new Date(String(r.reviewBy)), verified: Boolean(r.verified),
    })),
  });

  await prisma.practiceLesson.deleteMany({ where: { orgId: org.id } });
  await prisma.practiceLesson.createMany({
    data: PRACTICE_LESSONS.map((l) => ({
      orgId: org.id, topic: l.topic, title: l.title, quickVersion: l.quickVersion, deep: l.deep,
      whyMatters: l.whyMatters, checklist: JSON.stringify(l.checklist), exercise: l.exercise,
      sourceName: l.sourceName, sourceUrl: l.sourceUrl,
      dateChecked: l.sourceUrl ? new Date("2026-08-01") : null, confidence: l.confidence ?? "medium",
    })),
  });

  const existingSpaces = new Set((await prisma.space.findMany({ where: { orgId: org.id }, select: { key: true } })).map((s) => s.key));
  await prisma.space.createMany({
    data: SPACES.filter((s) => !existingSpaces.has(s.key)).map((s, i) => ({ orgId: org.id, key: s.key, name: s.name, order: i })),
  });

  for (const c of CHALLENGE_TEMPLATES) {
    const existing = await prisma.challenge.findFirst({ where: { orgId: org.id, title: c.title } });
    if (!existing) {
      await prisma.challenge.create({
        data: {
          orgId: org.id, title: c.title,
          description: `${c.title} — a simple, opt-in ${c.days}-day challenge.`,
          days: c.days, safetyNote: c.safetyNote, conversationPrompt: c.conversationPrompt,
          status: c.title.includes("Preparation Reset") ? "active" : "draft",
          startsAt: c.title.includes("Preparation Reset") ? new Date() : null,
        },
      });
    }
  }

  const today0 = new Date();
  today0.setHours(0, 0, 0, 0);
  const rhythmIdeas: Record<string, { title: string; pillar: string; hook: string; question: string; seconds: number }> = {
    Monday: { title: "The next-play reset", pillar: "Mindset", hook: "After a mistake, your next job is this.", question: "What's your reset after a bad play?", seconds: 10 },
    Tuesday: { title: "Pre-game fuel, kept simple", pillar: "Nutrition", hook: "Before training, keep this simple.", question: "What's your pre-game meal?", seconds: 12 },
    Wednesday: { title: "Why your handle breaks down under pressure", pillar: "Basketball", hook: "Most players make this harder than it needs to be.", question: "Where does your handle let you down?", seconds: 18 },
    Thursday: { title: "Reply: what to eat after a late game", pillar: "Nutrition", hook: "A coach asked this—here is the short answer.", question: "How late do your games finish?", seconds: 12 },
    Friday: { title: "Three-step free-throw routine", pillar: "Basketball", hook: "Stop guessing. Use this three-step routine.", question: "What's your free-throw routine?", seconds: 16 },
    Saturday: { title: "Confidence: same principle, different stage", pillar: "Mindset", hook: "Same principle. Different stage.", question: "Where do you need this most?", seconds: 12 },
    Sunday: { title: "Community reset — 3 frames", pillar: "Community", hook: "Reset for the week.", question: "One thing you'll work on this week?", seconds: 0 },
  };
  const daysToSeed: Array<{ offset: number; posted: boolean }> = [
    { offset: -6, posted: true }, { offset: -5, posted: true }, { offset: -4, posted: true },
    { offset: -3, posted: true }, { offset: -2, posted: true }, { offset: 0, posted: false },
    { offset: 1, posted: false }, { offset: 2, posted: false }, { offset: 3, posted: false },
    { offset: 4, posted: false }, { offset: 7, posted: false }, { offset: 8, posted: false }, { offset: 9, posted: false },
  ];
  const dayName = (d: Date) => WEEKLY_RHYTHM[(d.getDay() + 6) % 7].day;

  for (const { offset, posted } of daysToSeed) {
    const date = addDays(today0, offset);
    const dn = dayName(date);
    const idea = rhythmIdeas[dn];
    if (!idea) continue;
    const rhythm = WEEKLY_RHYTHM.find((r) => r.day === dn)!;
    const importKey = `seed_${date.toISOString().slice(0, 10)}`;
    const content = await prisma.content.upsert({
      where: { importKey },
      update: {},
      create: {
        orgId: org.id, ownerId: owner.id, title: idea.title, pillar: idea.pillar, series: rhythm.series,
        audience: idea.pillar === "Basketball" ? "Players13-17" : "General",
        format: dn === "Sunday" ? "Story" : "Reel", reelSeconds: idea.seconds || null,
        hook: idea.hook, question: idea.question, highlight: posted ? idea.pillar : null,
        plannedDate: at(date, 17, 30), postedAt: posted ? at(date, 17, 45) : null,
        status: posted ? "Complete" : "Planned", importKey, isTrialReel: offset === -4,
      },
    });

    if (posted) {
      const has = await prisma.analyticsSnapshot.count({ where: { contentId: content.id } });
      if (has === 0) {
        const base = 800 + Math.abs(offset) * 120;
        const saves = idea.pillar === "Nutrition" ? 60 + Math.abs(offset) * 6 : 24 + Math.abs(offset) * 3;
        await prisma.analyticsSnapshot.create({
          data: {
            contentId: content.id, window: "24h", reach: base, views: base + 300, plays: base + 260,
            avgWatchSec: (idea.seconds || 10) * 0.7, reelSeconds: idea.seconds || 10,
            completionPct: 62 + (offset % 3) * 4, likes: Math.round(base * 0.06), comments: 8 + Math.abs(offset),
            saves, shares: Math.round(saves * 0.4), profileVisits: Math.round(base * 0.05),
            follows: 4 + Math.abs(offset), wasTrialReel: offset === -4, source: "manual", confirmed: true,
          },
        });
      }
    }

    if (offset === 0 && (await prisma.dayTask.count({ where: { contentId: content.id } })) === 0) {
      await prisma.dayTask.createMany({
        data: CHECKLIST_STEPS.map((step, idx) => ({
          orgId: org.id, contentId: content.id, kind: step.kind, label: step.label,
          done: idx < 4, doneAt: idx < 4 ? new Date() : null, dueDate: at(date, 17, 30), priority: idx < 7 ? 2 : 1,
        })),
      });
    }
  }

  const questions = [
    { text: "What should my 14-year-old eat before a Saturday morning game?", pillar: "Nutrition", audience: "Parents", problem: "pre-game fuel", frequency: 4, source: "comment" },
    { text: "How do I stop rushing my free throws when I'm tired?", pillar: "Basketball", audience: "Players13-17", problem: "free-throw routine", frequency: 3, source: "comment" },
    { text: "My son gets down on himself after mistakes — what can I say?", pillar: "Mindset", audience: "Parents", problem: "next-play mindset", frequency: 2, source: "dm" },
    { text: "Best ball-handling drill for small spaces at home?", pillar: "Basketball", audience: "Players13-17", problem: "ball-handling", frequency: 2, source: "comment" },
    { text: "Is it OK to eat pasta the night before?", pillar: "Nutrition", audience: "General", problem: "pre-game fuel", frequency: 1, source: "comment" },
  ];
  for (const q of questions) {
    const existing = await prisma.communityQuestion.findFirst({ where: { orgId: org.id, text: q.text } });
    if (!existing) {
      const created = await prisma.communityQuestion.create({ data: { orgId: org.id, ...q, status: "open" } });
      await prisma.inboxItem.create({
        data: {
          orgId: org.id, type: "question", title: q.text, body: `From ${q.source} · asked ${q.frequency}×`,
          priority: q.frequency, questionId: created.id, tags: JSON.stringify([q.pillar]),
        },
      });
    }
  }

  if (!(await prisma.talk.findFirst({ where: { orgId: org.id, title: "Ask UNC — Pre-season nutrition" } }))) {
    await prisma.talk.create({
      data: {
        orgId: org.id, title: "Ask UNC — Pre-season nutrition", template: "Nutrition Professional Q&A",
        pillar: "Nutrition", guestName: "(invite an accredited dietitian)", scheduledAt: addDays(new Date(), 10),
        status: "planned", isMedicalDisclaimer: true, externalLink: "",
        runSheet: JSON.stringify([
          { seg: "Welcome + house rules", min: 3 }, { seg: "General pre-season fuel (education only)", min: 12 },
          { seg: "Community questions", min: 12 }, { seg: "Wrap + one action", min: 3 },
        ]),
        questions: { create: [{ text: "What does a simple game-day plate look like?", votes: 6 }, { text: "How much water is 'enough' for a teenager?", votes: 4 }] },
        clips: { create: [{ idea: "The simple game-day plate (15s)", caption: "Keep it simple: colour, carbs, protein, water.", script: "" }] },
      },
    });
  }

  if (!(await prisma.collaborator.findFirst({ where: { orgId: org.id, name: "Local accredited dietitian" } }))) {
    await prisma.collaborator.create({
      data: {
        orgId: org.id, name: "Local accredited dietitian", expertise: "Dietitian",
        topic: "Youth game-day nutrition (general education)", proposed: "Nutrition Professional Q&A talk",
        contactStatus: "prospect", permission: false, releaseForm: false,
      },
    });
  }
  if (!(await prisma.winningPattern.findFirst({ where: { orgId: org.id } }))) {
    await prisma.winningPattern.create({
      data: {
        orgId: org.id, topic: "Pre-game fuel", format: "Reel", hook: "Before training, keep this simple.",
        duration: 12, audience: "Parents", evidence: "Nutrition prep Reels are saving above the recent median.",
      },
    });
  }

  return { ok: true, org: org.slug };
}
