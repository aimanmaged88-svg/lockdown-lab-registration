import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { storage } from "@/lib/storage";
import { decryptBytes } from "@/lib/crypto";

export const runtime = "nodejs";

// Serve a private voice note to its owner only. The blob in storage is
// ciphertext; it's decrypted here after the cookie ownership check.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const memberId = (await cookies()).get("unc_member")?.value;
  if (!memberId) return NextResponse.json({ error: "Not yours" }, { status: 403 });
  const r = await prisma.reflection.findFirst({ where: { id, memberId } });
  if (!r?.voicePath) return NextResponse.json({ error: "Not found" }, { status: 404 });
  try {
    const enc = await storage.read(r.voicePath);
    const plain = decryptBytes(enc);
    if (!plain) return NextResponse.json({ error: "Cannot decrypt" }, { status: 500 });
    return new NextResponse(new Uint8Array(plain), {
      headers: { "Content-Type": "audio/webm", "Cache-Control": "private, no-store" },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
