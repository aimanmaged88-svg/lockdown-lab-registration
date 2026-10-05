"use server";

// The expression-of-interest list for UNC's Thoughts online coaching.
// Public submit, desk-only read. No payment, no account — a name and a way to
// reach them, saved with the time it came in.

import { prisma, getOrgId } from "./db";
import { requireDesk } from "./desk-auth";
import { audit } from "./audit";
import {
  checkInterest, normEmail, normMobile, isMinor,
  INTERESTS, FOCUS,
  type InterestInput, type InterestRow,
} from "./eoi-shared";

function one(v: unknown, max: number): string {
  return String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}
function many(v: unknown, allowed: readonly string[]): string[] {
  if (!Array.isArray(v)) return [];
  const keep = v.filter((x): x is string => typeof x === "string" && allowed.includes(x));
  return Array.from(new Set(keep));
}
function parseList(v: string | null): string[] {
  try {
    const out = JSON.parse(v ?? "[]");
    return Array.isArray(out) ? out.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export type SubmitResult =
  | { ok: true }
  | { ok: false; errors: Record<string, string> };

export async function submitInterest(input: InterestInput): Promise<SubmitResult> {
  const orgId = await getOrgId();

  // The browser checks the same rules, but the browser can be skipped.
  const f: InterestInput = {
    fullName: one(input.fullName, 80),
    age: one(input.age, 3),
    guardianName: one(input.guardianName, 80),
    guardianPhone: one(input.guardianPhone, 30),
    mobile: one(input.mobile, 30),
    email: one(input.email, 120),
    instagram: one(input.instagram, 40).replace(/^@+/, ""),
    suburb: one(input.suburb, 60),
    level: one(input.level, 20),
    position: one(input.position, 20),
    interest: many(input.interest, INTERESTS),
    focus: many(input.focus, FOCUS),
    focusOther: one(input.focusOther, 120),
    bestTime: one(input.bestTime, 30),
    notes: String(input.notes ?? "").trim().slice(0, 1000),
  };
  const errors = checkInterest(f);
  if (Object.keys(errors).length) return { ok: false, errors };

  const age = Number(f.age);
  const emailNorm = normEmail(f.email);
  const mobileNorm = normMobile(f.mobile);

  // Block the same person landing on the list twice — by either handle.
  const clash = await prisma.coachingInterest.findFirst({
    where: { orgId, OR: [{ emailNorm }, { mobileNorm }] },
    select: { emailNorm: true, mobileNorm: true },
  });
  if (clash) {
    return {
      ok: false,
      errors: clash.emailNorm === emailNorm
        ? { email: "You're already on the list with this email. Nothing else to do." }
        : { mobile: "You're already on the list with this number. Nothing else to do." },
    };
  }

  try {
    await prisma.coachingInterest.create({
      data: {
        orgId,
        fullName: f.fullName,
        age,
        guardianName: isMinor(age) ? f.guardianName : null,
        guardianPhone: isMinor(age) ? f.guardianPhone : null,
        mobile: f.mobile,
        mobileNorm,
        email: f.email,
        emailNorm,
        instagram: f.instagram || null,
        suburb: f.suburb || null,
        level: f.level,
        position: f.position,
        interest: JSON.stringify(f.interest),
        focus: JSON.stringify(f.focus),
        focusOther: f.focus.includes("Other") ? f.focusOther || null : null,
        bestTime: f.bestTime,
        notes: f.notes || null,
      },
    });
  } catch {
    // Two submissions racing the duplicate check hit the unique index instead.
    return { ok: false, errors: { email: "You're already on the list. Nothing else to do." } };
  }

  await audit("coaching.interest_registered", { entity: "coaching_interest" });
  return { ok: true };
}

export async function listInterest(): Promise<InterestRow[]> {
  await requireDesk();
  const orgId = await getOrgId();
  const rows = await prisma.coachingInterest.findMany({
    where: { orgId },
    orderBy: { createdAt: "desc" },
    take: 2000,
  });
  return rows.map((r) => ({
    id: r.id,
    at: r.createdAt.toISOString(),
    fullName: r.fullName,
    age: r.age,
    guardianName: r.guardianName,
    guardianPhone: r.guardianPhone,
    mobile: r.mobile,
    email: r.email,
    instagram: r.instagram,
    suburb: r.suburb,
    level: r.level,
    position: r.position,
    interest: parseList(r.interest),
    focus: parseList(r.focus),
    focusOther: r.focusOther,
    bestTime: r.bestTime,
    notes: r.notes,
  }));
}
