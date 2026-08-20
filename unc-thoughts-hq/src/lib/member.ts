import { cookies } from "next/headers";
import { prisma, getOrgId } from "./db";

// Resolve the anonymous member for this device (cookie set by middleware).
// Creates the Member row lazily on first use. Returns null only if the cookie
// is somehow absent (e.g. cookies disabled) — callers show a gentle notice.
export async function getMemberId(): Promise<string | null> {
  const jar = await cookies();
  return jar.get("unc_member")?.value ?? null;
}

export async function requireMember() {
  const id = await getMemberId();
  if (!id) throw new Error("No member cookie — enable cookies to save private answers.");
  // Read-first: the old upsert issued a WRITE on every page view, which is a
  // whole extra DB round trip per request. Touch lastSeenAt at most hourly.
  const existing = await prisma.member.findUnique({ where: { id } });
  if (existing) {
    if (!existing.lastSeenAt || Date.now() - existing.lastSeenAt.getTime() > 36e5) {
      await prisma.member.update({ where: { id }, data: { lastSeenAt: new Date() } }).catch(() => {});
    }
    return existing;
  }
  const orgId = await getOrgId();
  return prisma.member
    .create({ data: { id, orgId, lastSeenAt: new Date() } })
    .catch(async () => {
      // Two first-requests racing: the loser re-reads the winner's row.
      const row = await prisma.member.findUnique({ where: { id } });
      if (!row) throw new Error("Member create failed.");
      return row;
    });
}

export async function getMember() {
  const id = await getMemberId();
  if (!id) return null;
  return prisma.member.findUnique({ where: { id } });
}

export { AGE_BANDS, isYouthBand } from "./member-shared";
