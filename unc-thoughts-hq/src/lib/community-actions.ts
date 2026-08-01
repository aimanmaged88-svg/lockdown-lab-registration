"use server";

import { prisma, getOrgId } from "./db";
import { audit } from "./audit";
import { revalidatePath } from "next/cache";
import { isEnabled } from "./flags";
import { containsRestricted } from "./nutrition-safety";
import crypto from "crypto";

async function requireBeta() {
  if (!(await isEnabled("community_beta"))) {
    throw new Error("Community beta is off. Enable it in Settings after reading the safety checklist.");
  }
}

async function ownerUser() {
  const u = await prisma.user.findFirst({ where: { role: "owner" } });
  if (!u) throw new Error("No owner");
  return u;
}

// ── Invites (adults 18+ only) ───────────────────────────────────
export async function createInvite(input: { email?: string; role?: string }) {
  await requireBeta();
  const orgId = await getOrgId();
  const owner = await ownerUser();
  const code = "UNC-" + crypto.randomBytes(4).toString("hex");
  const invite = await prisma.invite.create({
    data: {
      code,
      email: input.email,
      role: input.role ?? "member",
      adultOnly: true,
      invitedById: owner.id,
      expiresAt: new Date(Date.now() + 14 * 864e5),
    },
  });
  await audit("invite.create", { actorId: owner.id, entity: "Invite", entityId: invite.id });
  revalidatePath("/community");
  void orgId;
  return invite;
}

// Accept an invite → create an adult member account (must confirm 18+).
export async function acceptInvite(input: { code: string; email: string; displayName: string; is18: boolean }) {
  await requireBeta();
  const orgId = await getOrgId();
  if (!input.is18) throw new Error("This community is restricted to adults aged 18 and over.");
  const invite = await prisma.invite.findUnique({ where: { code: input.code } });
  if (!invite || invite.acceptedAt || invite.expiresAt < new Date()) throw new Error("Invalid or expired invite.");
  const user = await prisma.user.create({
    data: {
      orgId,
      email: input.email,
      displayName: input.displayName,
      role: invite.role,
      isAdult: true,
      adultConfirmedAt: new Date(),
    },
  });
  await prisma.invite.update({ where: { id: invite.id }, data: { acceptedAt: new Date() } });
  await prisma.consentRecord.create({ data: { userId: user.id, kind: "adult_18", detail: "Confirmed 18+ at signup" } });
  await prisma.consentRecord.create({ data: { userId: user.id, kind: "community_guidelines" } });
  await audit("invite.accept", { actorId: user.id, entity: "User", entityId: user.id });
  revalidatePath("/community");
  return user;
}

// ── Posts & replies ─────────────────────────────────────────────
export async function createPost(input: { spaceId: string; body: string; authorId?: string; parentId?: string; tags?: string[] }) {
  await requireBeta();
  const orgId = await getOrgId();
  const author = input.authorId ? await prisma.user.findUnique({ where: { id: input.authorId } }) : await ownerUser();
  if (!author) throw new Error("Author not found");
  if (!author.isAdult) throw new Error("Only adult (18+) members can post.");

  // Anti-spam: restricted words + a simple rate limit (5 / 5 min / author).
  const restricted = containsRestricted(input.body);
  if (restricted.length) throw new Error(`Blocked term(s): ${restricted.join(", ")}`);
  const recent = await prisma.post.count({
    where: { authorId: author.id, createdAt: { gte: new Date(Date.now() - 5 * 60_000) } },
  });
  if (recent >= 5) throw new Error("Slow down — you're posting too quickly.");

  const space = await prisma.space.findUnique({ where: { id: input.spaceId } });
  if (space?.readOnly && author.role !== "owner" && author.role !== "admin") throw new Error("This space is announcements-only.");
  if (space?.locked) throw new Error("This discussion is locked.");

  const post = await prisma.post.create({
    data: {
      orgId,
      spaceId: input.spaceId,
      authorId: author.id,
      parentId: input.parentId,
      body: input.body.trim(),
      tags: input.tags ? JSON.stringify(input.tags) : null,
    },
  });
  await audit("post.create", { actorId: author.id, entity: "Post", entityId: post.id });
  revalidatePath("/community");
  return post;
}

export async function reactUseful(postId: string) {
  await requireBeta();
  await prisma.post.update({ where: { id: postId }, data: { usefulCount: { increment: 1 } } });
  revalidatePath("/community");
}

export async function pinPost(postId: string, pinned: boolean) {
  await requireBeta();
  await prisma.post.update({ where: { id: postId }, data: { pinned } });
  await audit("post.pin", { entity: "Post", entityId: postId, detail: { pinned } });
  revalidatePath("/community");
}

// ── Reporting & moderation ──────────────────────────────────────
export async function reportPost(input: { postId: string; reporterId?: string; reason: string; detail?: string }) {
  await requireBeta();
  const orgId = await getOrgId();
  const reporter = input.reporterId ? await prisma.user.findUnique({ where: { id: input.reporterId } }) : await ownerUser();
  if (!reporter) throw new Error("Reporter not found");
  const report = await prisma.report.create({
    data: { orgId, postId: input.postId, reporterId: reporter.id, reason: input.reason, detail: input.detail },
  });
  await prisma.inboxItem.create({
    data: { orgId, type: "report", title: `Report: ${input.reason}`, body: input.detail, refId: report.id, priority: 5 },
  });
  await audit("report.create", { actorId: reporter.id, entity: "Report", entityId: report.id });
  revalidatePath("/community");
  return report;
}

// Resolve a report as a moderator, with a transparent enforcement reason.
export async function resolveReport(input: { reportId: string; action: "hide" | "remove" | "dismiss"; resolution: string; moderatorId?: string; moderatorNote?: string }) {
  await requireBeta();
  const mod = input.moderatorId ? await prisma.user.findUnique({ where: { id: input.moderatorId } }) : await ownerUser();
  if (!mod) throw new Error("Moderator not found");
  const report = await prisma.report.findUnique({ where: { id: input.reportId } });
  if (!report) throw new Error("Report not found");

  if (input.action !== "dismiss" && report.postId) {
    await prisma.post.update({
      where: { id: report.postId },
      data: { status: input.action === "remove" ? "removed" : "hidden", removalReason: input.resolution },
    });
  }
  await prisma.report.update({
    where: { id: input.reportId },
    data: {
      status: input.action === "dismiss" ? "dismissed" : "actioned",
      handlerId: mod.id,
      resolution: input.resolution,
      moderatorNote: input.moderatorNote,
      resolvedAt: new Date(),
    },
  });
  // close the matching inbox item
  await prisma.inboxItem.updateMany({ where: { refId: input.reportId, type: "report" }, data: { status: "done" } });
  await audit("report.resolve", { actorId: mod.id, entity: "Report", entityId: input.reportId, detail: { action: input.action, resolution: input.resolution } });
  revalidatePath("/community");
}

// ── Roles / contributor verification ────────────────────────────
export async function setUserRole(userId: string, role: string) {
  await requireBeta();
  const owner = await ownerUser();
  await prisma.user.update({ where: { id: userId }, data: { role } });
  await audit("user.role", { actorId: owner.id, entity: "User", entityId: userId, detail: { role } });
  revalidatePath("/community");
}

export async function verifyExpert(userId: string, basis: string) {
  await requireBeta();
  const owner = await ownerUser();
  if (!basis.trim()) throw new Error("Record the basis for verification.");
  await prisma.user.update({ where: { id: userId }, data: { verifiedExpert: true, verificationBasis: basis, role: "contributor" } });
  await audit("user.verify_expert", { actorId: owner.id, entity: "User", entityId: userId, detail: { basis } });
  revalidatePath("/community");
}

export async function setSpaceControls(spaceId: string, patch: { locked?: boolean; readOnly?: boolean; slowModeSec?: number }) {
  await requireBeta();
  await prisma.space.update({ where: { id: spaceId }, data: patch });
  await audit("space.controls", { entity: "Space", entityId: spaceId, detail: patch });
  revalidatePath("/community");
}
