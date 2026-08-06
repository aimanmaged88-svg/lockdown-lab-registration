"use server";

// The owner's two quick banks: topic ideas and Instagram post drafts.
// Deliberately tiny — jot, save, tick off, delete.

import { prisma, getOrgId } from "./db";
import { requireDesk } from "./desk-auth";
import { revalidatePath } from "next/cache";

const KINDS = ["topic", "igpost"] as const;
export type NoteKind = (typeof KINDS)[number];

function pathFor(kind: NoteKind) {
  return kind === "topic" ? "/topics" : "/instagram";
}

export async function noteAdd(kind: NoteKind, body: string, title?: string, pillar?: string) {
  await requireDesk();
  if (!KINDS.includes(kind)) throw new Error("Unknown bank.");
  const text = body.trim().slice(0, 3000);
  if (!text) throw new Error("Write it first.");
  const orgId = await getOrgId();
  await prisma.deskNote.create({
    data: { orgId, kind, body: text, title: title?.trim().slice(0, 120) || null, pillar: pillar || null },
  });
  revalidatePath(pathFor(kind));
}

export async function noteSetStatus(id: string, status: "saved" | "used") {
  await requireDesk();
  await prisma.deskNote.update({ where: { id }, data: { status } });
  revalidatePath("/topics");
  revalidatePath("/instagram");
}

export async function noteDelete(id: string) {
  await requireDesk();
  await prisma.deskNote.delete({ where: { id } });
  revalidatePath("/topics");
  revalidatePath("/instagram");
}
