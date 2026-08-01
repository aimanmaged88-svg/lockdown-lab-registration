import { NextRequest, NextResponse } from "next/server";
import { prisma, getOrgId } from "@/lib/db";
import { audit } from "@/lib/audit";

export const runtime = "nodejs";

// Restore from a JSON backup produced by /api/backup. Replaces this org's core
// user data, preserving ids so relations survive. Reference tables and derived
// rows are reloaded from the backup. Wrapped in a transaction — all or nothing.
type Backup = Record<string, unknown[]> & { _meta?: { app?: string } };

function d(v: unknown) { return v ? new Date(v as string) : null; }

export async function POST(req: NextRequest) {
  try {
    const backup = (await req.json()) as Backup;
    if (backup._meta && backup._meta.app !== "unc-thoughts-hq") {
      return NextResponse.json({ error: "This file is not a UNC Thoughts HQ backup." }, { status: 400 });
    }
    const orgId = await getOrgId();
    const rows = <T>(k: string): T[] => (Array.isArray(backup[k]) ? (backup[k] as T[]) : []);

    await prisma.$transaction(async (tx) => {
      // Delete children → parents for this org.
      await tx.analyticsSnapshot.deleteMany({ where: { content: { orgId } } });
      await tx.mediaAsset.deleteMany({ where: { content: { orgId } } });
      await tx.preflightResult.deleteMany({ where: { content: { orgId } } });
      await tx.dayTask.deleteMany({ where: { orgId } });
      await tx.batchItem.deleteMany({ where: { session: { orgId } } });
      await tx.batchSession.deleteMany({ where: { orgId } });
      await tx.talkClip.deleteMany({ where: { talk: { orgId } } });
      await tx.talkQuestion.deleteMany({ where: { talk: { orgId } } });
      await tx.experiment.deleteMany({ where: { orgId } });
      await tx.inboxItem.deleteMany({ where: { orgId } });
      await tx.content.deleteMany({ where: { orgId } });
      await tx.communityQuestion.deleteMany({ where: { orgId } });
      await tx.talk.deleteMany({ where: { orgId } });
      await tx.challenge.deleteMany({ where: { orgId } });
      await tx.collaborator.deleteMany({ where: { orgId } });
      await tx.winningPattern.deleteMany({ where: { orgId } });
      await tx.researchEntry.deleteMany({ where: { orgId } });
      await tx.practiceLesson.deleteMany({ where: { orgId } });

      // Re-insert. Coerce date fields; force orgId to the current org.
      const norm = (o: Record<string, unknown>, dates: string[]): Record<string, unknown> => {
        const c: Record<string, unknown> = { ...o, orgId };
        for (const f of dates) if (f in c) c[f] = d(c[f]);
        return c;
      };

      for (const q of rows<Record<string, unknown>>("questions")) await tx.communityQuestion.create({ data: norm(q, ["createdAt"]) as never });
      for (const c of rows<Record<string, unknown>>("collaborators")) await tx.collaborator.create({ data: norm(c, ["createdAt", "recordingDate"]) as never });
      for (const c of rows<Record<string, unknown>>("content")) await tx.content.create({ data: norm(c, ["plannedDate", "postedAt", "createdAt", "updatedAt"]) as never });
      for (const s of rows<Record<string, unknown>>("analytics")) await tx.analyticsSnapshot.create({ data: { ...s, capturedAt: d(s.capturedAt) } as never });
      for (const t of rows<Record<string, unknown>>("talks")) {
        const { clips, questions, ...rest } = t as Record<string, unknown>;
        await tx.talk.create({ data: norm(rest, ["scheduledAt", "createdAt"]) as never });
        for (const cl of (clips as Record<string, unknown>[]) ?? []) await tx.talkClip.create({ data: { ...cl, createdAt: d(cl.createdAt) } as never });
        for (const tq of (questions as Record<string, unknown>[]) ?? []) await tx.talkQuestion.create({ data: { ...tq, createdAt: d(tq.createdAt) } as never });
      }
      for (const c of rows<Record<string, unknown>>("challenges")) await tx.challenge.create({ data: norm(c, ["createdAt", "startsAt"]) as never });
      for (const e of rows<Record<string, unknown>>("experiments")) await tx.experiment.create({ data: norm(e, ["createdAt"]) as never });
      for (const p of rows<Record<string, unknown>>("patterns")) await tx.winningPattern.create({ data: norm(p, ["createdAt"]) as never });
      for (const r of rows<Record<string, unknown>>("research")) await tx.researchEntry.create({ data: norm(r, ["dateChecked", "reviewBy", "createdAt"]) as never });
      for (const l of rows<Record<string, unknown>>("practice")) await tx.practiceLesson.create({ data: norm(l, ["dateChecked", "createdAt"]) as never });
      for (const t of rows<Record<string, unknown>>("tasks")) await tx.dayTask.create({ data: norm(t, ["doneAt", "dueDate", "createdAt", "updatedAt"]) as never });
    });

    await audit("restore.apply", {});
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Restore failed" }, { status: 500 });
  }
}
