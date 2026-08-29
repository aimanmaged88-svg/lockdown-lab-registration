"use server";

// UNC LIVE — the member-facing half of the sessions desk.
//
// A player sees what's on, puts their hand up, and gets told how to pay. No
// card is ever taken here: he gets the money the way he already gets money
// (PayID, transfer, a payment link) and ticks the seat off when it lands. That
// keeps him earning this week instead of waiting on a payment integration.

import { prisma, getOrgId } from "./db";
import { getMemberId } from "./member";
import { requireDesk } from "./desk-auth";
import { audit } from "./audit";
import { revalidatePath } from "next/cache";
import { PAY_KEY, PAY_DEFAULT, type LiveSession } from "./live-shared";

function clean(v: unknown, max: number): string {
  return String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

// ── what the member sees ────────────────────────────────────────────────────

function dateText(d: Date | null): string | null {
  if (!d) return null;
  return d.toLocaleDateString("en-AU", {
    weekday: "long", day: "numeric", month: "long", timeZone: "Australia/Sydney",
  });
}

export async function liveSessions(): Promise<LiveSession[]> {
  const orgId = await getOrgId();
  const rows = await prisma.studioSession.findMany({
    where: { orgId, listed: true, status: "planned" },
    orderBy: [{ date: "asc" }, { createdAt: "asc" }],
    take: 24,
  });
  // A held seat is a taken seat — counting only paid ones would oversell the
  // room while people are still transferring the money.
  const taken = await prisma.seatBooking.groupBy({
    by: ["sessionId"],
    where: { sessionId: { in: rows.map((r) => r.id) }, status: { in: ["held", "paid"] } },
    _count: { _all: true },
  });
  const takenBy = new Map(taken.map((t) => [t.sessionId, t._count._all]));
  return rows.map((s) => {
    const seatsLeft = Math.max(0, s.capacity - (takenBy.get(s.id) ?? 0));
    return {
      id: s.id, title: s.title, topic: s.topic, blurb: s.blurb,
      dateText: dateText(s.date), timeText: s.timeText, ageBand: s.ageBand,
      pricePerSeat: s.pricePerSeat, seatsLeft, capacity: s.capacity, full: seatsLeft === 0,
    };
  });
}

export async function payLine(): Promise<string> {
  const orgId = await getOrgId();
  const row = await prisma.setting.findUnique({ where: { orgId_key: { orgId, key: PAY_KEY } } });
  return row?.value?.trim() || PAY_DEFAULT;
}

// Seats this device has already asked for, so the page can say "you're in"
// instead of letting someone book the same session five times.
export async function mySeats(): Promise<{ sessionId: string; status: string }[]> {
  const memberId = await getMemberId();
  if (!memberId) return [];
  const orgId = await getOrgId();
  const rows = await prisma.seatBooking.findMany({
    where: { orgId, memberId, status: { not: "cancelled" } },
    select: { sessionId: true, status: true },
    take: 50,
  });
  return rows;
}

export async function saveSeat(input: { sessionId: string; name: string; contact: string; note?: string }) {
  const orgId = await getOrgId();
  const memberId = await getMemberId();
  const name = clean(input.name, 60);
  const contact = clean(input.contact, 90);
  if (name.length < 2) throw new Error("Put your name in so UNC knows who's coming.");
  if (contact.length < 3) throw new Error("Leave a phone, email or Instagram handle so he can send you the link.");

  const s = await prisma.studioSession.findFirst({
    where: { id: input.sessionId, orgId, listed: true, status: "planned" },
  });
  if (!s) throw new Error("That session isn't taking seats right now.");

  // Count held + paid against capacity, not just the ones he's marked paid.
  const taken = await prisma.seatBooking.count({
    where: { sessionId: s.id, status: { in: ["held", "paid"] } },
  });
  if (taken >= s.capacity) throw new Error("That one just filled up. Try the next session.");

  if (memberId) {
    const already = await prisma.seatBooking.findFirst({
      where: { sessionId: s.id, memberId, status: { in: ["held", "paid"] } },
    });
    if (already) return { ok: true as const, already: true, payLine: await payLine() };
  }

  await prisma.seatBooking.create({
    data: { orgId, sessionId: s.id, memberId, name, contact, note: clean(input.note, 300) || null },
  });
  await audit("live.seat_held", { entity: "session", entityId: s.id, detail: { name } });
  revalidatePath("/member/live");
  revalidatePath("/sessions");
  return { ok: true as const, already: false, payLine: await payLine() };
}

// ── his desk ────────────────────────────────────────────────────────────────

export async function sessionSetListing(id: string, patch: {
  listed?: boolean; timeText?: string; blurb?: string; ageBand?: string; joinUrl?: string;
}) {
  await requireDesk();
  const orgId = await getOrgId();
  const s = await prisma.studioSession.findFirst({ where: { id, orgId } });
  if (!s) throw new Error("Session not found.");
  const url = clean(patch.joinUrl, 300);
  if (url && !/^https?:\/\//i.test(url)) throw new Error("The join link needs to start with https://");
  await prisma.studioSession.update({
    where: { id },
    data: {
      listed: patch.listed ?? s.listed,
      timeText: patch.timeText === undefined ? s.timeText : clean(patch.timeText, 60) || null,
      blurb: patch.blurb === undefined ? s.blurb : clean(patch.blurb, 300) || null,
      ageBand: patch.ageBand === undefined ? s.ageBand : clean(patch.ageBand, 30) || null,
      joinUrl: patch.joinUrl === undefined ? s.joinUrl : url || null,
    },
  });
  revalidatePath("/sessions");
  revalidatePath("/member/live");
  revalidatePath("/member");
}

export async function seatSetStatus(id: string, status: "held" | "paid" | "cancelled") {
  await requireDesk();
  const orgId = await getOrgId();
  const seat = await prisma.seatBooking.findFirst({ where: { id, orgId } });
  if (!seat) throw new Error("Seat not found.");
  await prisma.seatBooking.update({
    where: { id },
    data: { status, paidAt: status === "paid" ? new Date() : null },
  });
  // seatsSold is what the money tally runs on — keep it honest against paid seats.
  const paid = await prisma.seatBooking.count({ where: { sessionId: seat.sessionId, status: "paid" } });
  const s = await prisma.studioSession.findUnique({ where: { id: seat.sessionId } });
  if (s) {
    await prisma.studioSession.update({
      where: { id: s.id },
      data: { seatsSold: Math.min(s.capacity, paid) },
    });
  }
  await audit("live.seat_" + status, { entity: "seat", entityId: id });
  revalidatePath("/sessions");
  revalidatePath("/member/live");
  return { ok: true as const };
}

export async function setPayLine(value: string) {
  await requireDesk();
  const orgId = await getOrgId();
  const v = String(value ?? "").trim().slice(0, 400);
  if (!v) throw new Error("Tell them how to pay you — that line is the whole point.");
  await prisma.setting.upsert({
    where: { orgId_key: { orgId, key: PAY_KEY } },
    update: { value: v },
    create: { orgId, key: PAY_KEY, value: v },
  });
  revalidatePath("/sessions");
  revalidatePath("/member/live");
  return { ok: true as const };
}
