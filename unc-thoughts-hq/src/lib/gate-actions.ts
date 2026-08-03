"use server";

// First-open gate: beta notice + age check + explicit terms acceptance.
// The acceptance is recorded server-side (who/when/what version/which age
// path) so there is provable consent, not just a client flag.

import { requireMember } from "./member";
import { prisma } from "./db";
import { audit } from "./audit";

export type GateAge = "16+" | "13-15" | "u13_parent";

export async function acceptTerms(input: { age: GateAge; parentConfirmed?: boolean }): Promise<{ ok: boolean }> {
  const member = await requireMember();
  const age: GateAge | null = ["16+", "13-15", "u13_parent"].includes(input.age) ? input.age : null;
  if (!age) return { ok: false };
  // Under-13 acceptance is only valid FROM a parent/guardian.
  if (age === "u13_parent" && !input.parentConfirmed) return { ok: false };

  if (age === "13-15") await prisma.member.update({ where: { id: member.id }, data: { ageBand: "13-15" } });
  if (age === "u13_parent") await prisma.member.update({ where: { id: member.id }, data: { ageBand: "u13" } });

  await audit("terms.accepted", {
    entity: "Member",
    entityId: member.id,
    detail: { version: 1, age, parentConfirmed: !!input.parentConfirmed },
  });
  return { ok: true };
}
