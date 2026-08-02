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
  const orgId = await getOrgId();
  return prisma.member.upsert({
    where: { id },
    update: { lastSeenAt: new Date() },
    create: { id, orgId },
  });
}

export async function getMember() {
  const id = await getMemberId();
  if (!id) return null;
  return prisma.member.findUnique({ where: { id } });
}

export { AGE_BANDS, isYouthBand } from "./member-shared";
