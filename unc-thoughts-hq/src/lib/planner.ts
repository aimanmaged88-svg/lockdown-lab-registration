"use server";

import { prisma, getOrgId } from "./db";
import { approvedItems } from "./unk/knowledge";
import { parseSections } from "./unk/knowledge";
import { sydneyCalendar, sydneyAt } from "./seed-core";
import { WEEKLY_RHYTHM } from "./enums";
import { isoDate } from "./time";
import { audit } from "./audit";
import { revalidatePath } from "next/cache";

// "Plan my week": one tap fills the NEXT 7 empty days with real ideas —
// the weekly rhythm for structure, Unk's Brain + open community questions for
// substance. Never overwrites a day that already has something planned, and
// never reuses teaching that's already been turned into content.

const firstSentence = (s: string) => s.split(/\n/)[0].split(/(?<=[.!?])\s/)[0].trim();

function rhythmSeconds(label: string): number | null {
  const m = label.match(/(\d+)/g);
  if (!m) return null;
  return m.length > 1 ? Math.round((Number(m[0]) + Number(m[1])) / 2) : Number(m[0]);
}

export async function planNextWeek(): Promise<{ created: number; skipped: number; from: string }> {
  const orgId = await getOrgId();
  const owner = await prisma.user.findFirst({ where: { orgId, role: "owner" } });

  const existing = await prisma.content.findMany({
    where: { orgId, plannedDate: { not: null } },
    select: { plannedDate: true, title: true, notes: true },
  });
  const plannedDays = new Set(existing.map((c) => isoDate(c.plannedDate!)));
  const usedTeaching = new Set(
    existing.flatMap((c) => [c.title.toLowerCase(), ...(c.notes?.toLowerCase().match(/from: ([^\n]+)/)?.[1]?.split(", ") ?? [])]),
  );

  const items = await approvedItems();
  const pool = (pillar: string) =>
    items.filter(
      (i) => i.pillar === pillar &&
        ["playbook", "lesson", "teaching_note", "faq", "mindset", "nutrition"].includes(i.kind) &&
        !usedTeaching.has(i.title.toLowerCase()),
    );

  const openQs = await prisma.communityQuestion.findMany({ where: { orgId, status: "open" }, orderBy: { frequency: "desc" }, take: 3 });

  // Start from tomorrow; plan the next 7 calendar days on the rhythm.
  const weekNo = Math.floor(Date.now() / (7 * 864e5));
  const rotating = ["Basketball", "Nutrition", "Mindset"];
  let created = 0;
  let skipped = 0;
  let qIdx = 0;

  for (let offset = 1; offset <= 7; offset++) {
    const { ymd, weekday } = sydneyCalendar(offset);
    if (plannedDays.has(ymd)) { skipped++; continue; }
    const rhythm = WEEKLY_RHYTHM.find((r) => r.day === weekday)!;

    // Which pillar does this slot want?
    let pillar: string;
    if (weekday === "Monday") pillar = "Mindset";
    else if (weekday === "Tuesday") pillar = weekNo % 2 === 0 ? "Basketball" : "Nutrition";
    else if (weekday === "Sunday") pillar = "Community";
    else pillar = rotating[(weekNo + offset) % rotating.length];

    // Thursday = Comment Reply from a real open question when we have one.
    if (weekday === "Thursday" && openQs[qIdx]) {
      const q = openQs[qIdx++];
      await prisma.content.create({
        data: {
          orgId, ownerId: owner?.id,
          title: `Reply: ${q.text.slice(0, 60)}`,
          pillar: q.pillar ?? "Community", series: rhythm.series, format: "ReplyReel",
          audience: q.audience ?? "General",
          reelSeconds: rhythmSeconds(rhythm.seconds),
          hook: "A coach asked this—here is the short answer.",
          question: "What would you add?",
          plannedDate: sydneyAt(ymd, 17, 30), status: "Planned",
          sourceQuestionId: q.id, inspirationSource: "Plan my week",
          notes: `Planned from the weekly rhythm · answers "${q.text.slice(0, 80)}"`,
        },
      });
      await prisma.communityQuestion.update({ where: { id: q.id }, data: { status: "planned" } });
      created++;
      continue;
    }

    if (weekday === "Sunday") {
      await prisma.content.create({
        data: {
          orgId, ownerId: owner?.id,
          title: "Community reset — 3 Story frames",
          pillar: "Community", series: rhythm.series, format: "Story", audience: "General",
          hook: "Reset for the week.",
          question: "One thing you'll work on this week?",
          plannedDate: sydneyAt(ymd, 17, 30), status: "Planned",
          inspirationSource: "Plan my week",
        },
      });
      created++;
      continue;
    }

    // Pull a fresh piece of teaching for this pillar (fall back across pillars).
    const source = pool(pillar)[0] ?? pool("Mindset")[0] ?? pool("Basketball")[0] ?? pool("Nutrition")[0];
    if (!source) { skipped++; continue; }
    usedTeaching.add(source.title.toLowerCase());
    const s = parseSections(source.body);
    await prisma.content.create({
      data: {
        orgId, ownerId: owner?.id,
        title: `${rhythm.series}: ${source.title.replace(/—.*/, "").trim()}`.slice(0, 120),
        pillar: source.pillar, series: rhythm.series, format: "Reel",
        audience: pillar === "Basketball" ? "Players13-17" : "General",
        reelSeconds: rhythmSeconds(rhythm.seconds),
        hook: firstSentence(s.mindset ?? s.doNow ?? source.title),
        script: [s.doNow && `- ${firstSentence(s.doNow)}`, s.food && `- ${firstSentence(s.food)}`, s.careful && `- Careful: ${firstSentence(s.careful)}`].filter(Boolean).join("\n"),
        question: s.privateQ ?? "What's your version of this?",
        plannedDate: sydneyAt(ymd, 17, 30), status: "Planned",
        inspirationSource: "Plan my week",
        notes: `Planned from the weekly rhythm · from: ${source.title}`,
      },
    });
    created++;
  }

  await audit("planner.week", { detail: { created, skipped } });
  revalidatePath("/calendar");
  revalidatePath("/");
  const { ymd } = sydneyCalendar(1);
  return { created, skipped, from: ymd };
}
