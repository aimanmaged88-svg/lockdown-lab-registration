"use server";

// The Huddle: conversational community by topic, safe for a young audience
// because NOTHING goes live until UNC verifies it. Anonymous by default —
// same device identity as questions, an optional display name, no accounts.

import { cookies } from "next/headers";
import { prisma, getOrgId } from "./db";
import { audit } from "./audit";
import { requireMember } from "./member";
import { assess, escalationMessage } from "./unk/safety";
import { isYouthBand, HUDDLE_TOPICS } from "./member-shared";
import { sendToOwnerDevices, sendToMemberDevices } from "./push";
import { revalidatePath } from "next/cache";

// Server actions are invokable from any route, so owner-only moderation must
// verify the desk cookie itself — mirrors the middleware's token derivation.
async function requireDesk(): Promise<void> {
  const password = process.env.DESK_PASSWORD;
  if (!password) return; // local dev runs unlocked, same as middleware
  const data = new TextEncoder().encode(`${password}:${process.env.AUTH_SECRET || "dev-secret-change-me"}:desk`);
  const hash = await crypto.subtle.digest("SHA-256", data);
  const expected = Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
  const jar = await cookies();
  if (jar.get("unc_desk")?.value !== expected) throw new Error("Desk only.");
}

export type HuddlePostResult =
  | { ok: true }
  | { ok: false; escalated: true; headline: string; body: string[] }
  | { ok: false; escalated?: false; error: string };

export async function huddlePost(input: { topic: string; body: string; name?: string; parentId?: string }): Promise<HuddlePostResult> {
  const member = await requireMember();
  const orgId = await getOrgId();

  const topic = (HUDDLE_TOPICS as readonly string[]).includes(input.topic) ? input.topic : null;
  if (!topic) return { ok: false, error: "Pick a topic first." };
  const body = (input.body ?? "").trim().slice(0, 600);
  if (body.length < 2) return { ok: false, error: "Write something first." };

  const safety = assess(body);
  if (safety.kind === "escalate") {
    const youth = !member.ageBand || isYouthBand(member.ageBand);
    const msg = escalationMessage(safety.topic, safety.emergency, youth);
    await audit("huddle.escalated", { detail: { topic: safety.topic } });
    return { ok: false, escalated: true, ...msg };
  }

  const today = await prisma.huddlePost.count({
    where: { memberId: member.id, createdAt: { gte: new Date(Date.now() - 864e5) } },
  });
  if (today >= 10) return { ok: false, error: "That's 10 posts today — quality over quantity. Back tomorrow." };

  let parentId: string | null = null;
  if (input.parentId) {
    const parent = await prisma.huddlePost.findFirst({ where: { id: input.parentId, orgId, status: "live", parentId: null } });
    if (!parent) return { ok: false, error: "That conversation isn't open." };
    parentId = parent.id;
  }

  const post = await prisma.huddlePost.create({
    data: { orgId, memberId: member.id, parentId, topic, body, name: input.name?.trim().slice(0, 40) || null },
  });

  await sendToOwnerDevices({
    title: `Huddle ${parentId ? "reply" : "post"} to check · ${topic}`,
    body: body.slice(0, 120),
    url: "/community",
    tag: "unc-huddle",
  }).catch(() => {});

  await audit("huddle.posted", { entity: "HuddlePost", entityId: post.id, detail: { topic, reply: !!parentId } });
  revalidatePath("/member/huddle");
  revalidatePath("/community");
  return { ok: true };
}

export type HuddleFeedItem = {
  id: string; topic: string; body: string; name: string; mine: boolean;
  pending: boolean; createdAt: string;
  replies: { id: string; body: string; name: string; mine: boolean; pending: boolean; createdAt: string }[];
};

// Live posts for everyone + the member's own pending ones (marked), so they see
// their words are with UNC rather than vanished.
export async function huddleFeed(): Promise<HuddleFeedItem[]> {
  const member = await requireMember();
  const orgId = await getOrgId();
  const rows = await prisma.huddlePost.findMany({
    where: { orgId, OR: [{ status: "live" }, { status: "pending", memberId: member.id }] },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  const roots = rows.filter((p) => !p.parentId);
  const map = new Map(roots.map((p) => [p.id, { ...p, replyList: [] as typeof rows }]));
  for (const p of rows) {
    if (p.parentId && map.has(p.parentId)) map.get(p.parentId)!.replyList.push(p);
  }
  return roots.map((p) => ({
    id: p.id,
    topic: p.topic,
    body: p.body,
    name: p.name || "Hooper",
    mine: p.memberId === member.id,
    pending: p.status === "pending",
    createdAt: p.createdAt.toISOString(),
    replies: (map.get(p.id)?.replyList ?? [])
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .map((r) => ({
        id: r.id, body: r.body, name: r.name || "Hooper", mine: r.memberId === member.id,
        pending: r.status === "pending", createdAt: r.createdAt.toISOString(),
      })),
  }));
}

// ── Owner moderation ────────────────────────────────────────────────
export async function huddleModerate(id: string, action: "approve" | "hide") {
  await requireDesk();
  const post = await prisma.huddlePost.findUnique({ where: { id } });
  if (!post) throw new Error("Post not found.");
  await prisma.huddlePost.update({ where: { id }, data: { status: action === "approve" ? "live" : "hidden" } });
  if (action === "approve") {
    await sendToMemberDevices(post.memberId, {
      title: "Your Huddle post is up 🤝",
      body: post.body.slice(0, 120),
      url: "/member/huddle",
      tag: "unc-huddle-live",
    }).catch(() => {});
  }
  await audit("huddle.moderated", { entity: "HuddlePost", entityId: id, detail: { action } });
  revalidatePath("/member/huddle");
  revalidatePath("/community");
}

export async function huddleQueue() {
  const orgId = await getOrgId();
  const [pending, recentLive] = await Promise.all([
    prisma.huddlePost.findMany({ where: { orgId, status: "pending" }, orderBy: { createdAt: "asc" } }),
    prisma.huddlePost.findMany({ where: { orgId, status: "live" }, orderBy: { createdAt: "desc" }, take: 20 }),
  ]);
  const shape = (p: (typeof pending)[number]) => ({
    id: p.id, topic: p.topic, body: p.body, name: p.name || "Hooper",
    reply: !!p.parentId, createdAt: p.createdAt.toISOString(),
  });
  return { pending: pending.map(shape), recentLive: recentLive.map(shape) };
}
