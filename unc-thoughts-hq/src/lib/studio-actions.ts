"use server";

// The trainer's desk: log every UNC LIVE session, track seats + money.
// Deliberately simple — add a session, mark seats as they sell, tick it done,
// and the page tallies what you've earned and what's still coming.

import { prisma, getOrgId } from "./db";
import { requireDesk } from "./desk-auth";
import { revalidatePath } from "next/cache";

function clampInt(v: unknown, min: number, max: number, dflt: number): number {
  const n = Math.round(Number(v));
  if (!Number.isFinite(n)) return dflt;
  return Math.min(max, Math.max(min, n));
}

export async function sessionAdd(input: {
  title: string; topic?: string; date?: string;
  pricePerSeat?: number; capacity?: number; seatsSold?: number; notes?: string;
}) {
  await requireDesk();
  const orgId = await getOrgId();
  const title = (input.title ?? "").trim().slice(0, 120);
  if (!title) throw new Error("Give the session a name.");
  const capacity = clampInt(input.capacity, 1, 500, 20);
  await prisma.studioSession.create({
    data: {
      orgId,
      title,
      topic: (input.topic ?? "").trim().slice(0, 40) || null,
      date: input.date ? new Date(input.date) : null,
      pricePerSeat: clampInt(input.pricePerSeat, 0, 100000, 10),
      capacity,
      seatsSold: clampInt(input.seatsSold, 0, capacity, 0),
      notes: (input.notes ?? "").trim().slice(0, 500) || null,
    },
  });
  revalidatePath("/sessions");
}

export async function sessionSetSeats(id: string, seatsSold: number) {
  await requireDesk();
  const orgId = await getOrgId();
  const s = await prisma.studioSession.findFirst({ where: { id, orgId } });
  if (!s) throw new Error("Session not found.");
  await prisma.studioSession.update({
    where: { id },
    data: { seatsSold: clampInt(seatsSold, 0, s.capacity, s.seatsSold) },
  });
  revalidatePath("/sessions");
}

export async function sessionSetStatus(id: string, status: "planned" | "done") {
  await requireDesk();
  const orgId = await getOrgId();
  const s = await prisma.studioSession.findFirst({ where: { id, orgId } });
  if (!s) throw new Error("Session not found.");
  await prisma.studioSession.update({ where: { id }, data: { status: status === "done" ? "done" : "planned" } });
  revalidatePath("/sessions");
}

export async function sessionDelete(id: string) {
  await requireDesk();
  const orgId = await getOrgId();
  const s = await prisma.studioSession.findFirst({ where: { id, orgId } });
  if (!s) throw new Error("Session not found.");
  await prisma.studioSession.delete({ where: { id } });
  revalidatePath("/sessions");
}
