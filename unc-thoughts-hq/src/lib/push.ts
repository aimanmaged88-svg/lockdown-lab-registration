import webpush from "web-push";
import { prisma, getOrgId } from "./db";
import { formatInTimeZone } from "date-fns-tz";
import { TZ, isoDate } from "./time";

// Owner phone notifications. Deliberately calm: at most a morning brief and an
// evening nudge, each once per Sydney day, only when there's something to say.
// No streaks, no manufactured urgency.

function configured(): boolean {
  return !!(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
}

function setup() {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:owner@example.com",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );
}

export type PushPayload = { title: string; body: string; url?: string; tag?: string };

export async function sendToOwnerDevices(payload: PushPayload): Promise<{ sent: number; pruned: number }> {
  if (!configured()) return { sent: 0, pruned: 0 };
  setup();
  const orgId = await getOrgId();
  const subs = await prisma.pushSub.findMany({ where: { orgId, role: "owner" } });
  let sent = 0;
  let pruned = 0;
  for (const s of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        JSON.stringify(payload),
        { TTL: 3600 },
      );
      sent++;
      await prisma.pushSub.update({ where: { id: s.id }, data: { lastOkAt: new Date() } }).catch(() => {});
    } catch (e: unknown) {
      const code = (e as { statusCode?: number }).statusCode;
      if (code === 404 || code === 410) {
        await prisma.pushSub.delete({ where: { id: s.id } }).catch(() => {});
        pruned++;
      }
    }
  }
  return { sent, pruned };
}

// Once-per-Sydney-day dedupe, recorded in the audit trail.
async function alreadySentToday(kind: string): Promise<boolean> {
  const orgId = await getOrgId();
  const today = isoDate(new Date());
  const recent = await prisma.auditEvent.findFirst({
    where: { orgId, action: `push.${kind}`, createdAt: { gte: new Date(Date.now() - 26 * 3600_000) } },
    orderBy: { createdAt: "desc" },
  });
  return !!recent && isoDate(recent.createdAt) === today;
}

async function markSent(kind: string, detail: unknown) {
  const orgId = await getOrgId();
  await prisma.auditEvent.create({
    data: { orgId, action: `push.${kind}`, detail: JSON.stringify(detail) },
  });
}

// Called hourly by the Netlify scheduled function; decides what (if anything)
// is worth a ping right now.
export async function dispatch(): Promise<Record<string, unknown>> {
  if (!configured()) return { ok: false, reason: "VAPID not configured" };
  const orgId = await getOrgId();
  const hour = parseInt(formatInTimeZone(new Date(), TZ, "H"), 10);
  const out: Record<string, unknown> = { hour, sydney: formatInTimeZone(new Date(), TZ, "HH:mm") };

  const subs = await prisma.pushSub.count({ where: { orgId, role: "owner" } });
  out.devices = subs;
  if (subs === 0) return { ...out, ok: true, sent: 0 };

  // ── Morning brief: 7–10am Sydney, once ─────────────────────────
  if (hour >= 7 && hour < 10 && !(await alreadySentToday("morning"))) {
    const today = isoDate(new Date());
    const all = await prisma.content.findMany({ where: { orgId, plannedDate: { not: null } } });
    const todays = all.filter((c) => c.plannedDate && isoDate(c.plannedDate) === today && !c.postedAt);
    const ready = await prisma.content.count({ where: { orgId, status: "Ready", postedAt: null } });
    const title = todays[0] ? `Today: ${todays[0].title}` : ready > 0 ? "Nothing planned — but you've got posts ready" : "Quiet day — bank one idea";
    const body = todays[0]?.hook
      ? `Hook: “${todays[0].hook}” · ${ready} ready in the bank. 20 minutes and done.`
      : `${ready} ready-to-go post${ready === 1 ? "" : "s"} in the bank. Open Today and pick one.`;
    const r = await sendToOwnerDevices({ title, body, url: "/", tag: "unc-morning" });
    await markSent("morning", { title, ...r });
    out.morning = r;
  }

  // ── Evening nudge: 5–8pm Sydney, once, only if there's a reason ──
  if (hour >= 17 && hour < 20 && !(await alreadySentToday("evening"))) {
    const posted = await prisma.content.findMany({
      where: { orgId, postedAt: { gte: new Date(Date.now() - 3 * 864e5), lte: new Date(Date.now() - 864e5) } },
      include: { analytics: true },
    });
    const analyticsDue = posted.filter((c) => c.analytics.length === 0).length;
    const newQs = await prisma.communityQuestion.count({
      where: { orgId, status: "open", createdAt: { gte: new Date(Date.now() - 864e5) } },
    });
    const asks = await prisma.askLog.count({ where: { orgId, createdAt: { gte: new Date(Date.now() - 864e5) } } });
    if (analyticsDue > 0 || newQs > 0 || asks > 0) {
      const bits = [
        analyticsDue > 0 ? `${analyticsDue} post${analyticsDue === 1 ? "" : "s"} need numbers` : "",
        newQs > 0 ? `${newQs} new question${newQs === 1 ? "" : "s"}` : "",
        asks > 0 ? `${asks} Ask Unk chat${asks === 1 ? "" : "s"} today` : "",
      ].filter(Boolean);
      const r = await sendToOwnerDevices({
        title: "Evening check-in (5 minutes)",
        body: bits.join(" · "),
        url: analyticsDue > 0 ? "/analytics" : "/brain?tab=insights",
        tag: "unc-evening",
      });
      await markSent("evening", { bits, ...r });
      out.evening = r;
    } else {
      out.evening = "nothing worth a ping";
    }
  }

  return { ...out, ok: true };
}
