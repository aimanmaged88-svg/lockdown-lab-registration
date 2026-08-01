import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/lib/storage";
import path from "path";

export const runtime = "nodejs";

const MIME: Record<string, string> = {
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp",
  ".gif": "image/gif", ".mp4": "video/mp4", ".webm": "video/webm", ".pdf": "application/pdf",
};

// Serve stored files (analytics screenshots, media). Path is sanitised in storage.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ key: string[] }> }) {
  const { key } = await params;
  const rel = key.join("/");
  // guard against traversal
  if (rel.includes("..")) return NextResponse.json({ error: "Bad path" }, { status: 400 });
  try {
    const buf = await storage.read(rel);
    const ext = path.extname(rel).toLowerCase();
    return new NextResponse(new Uint8Array(buf), {
      headers: { "Content-Type": MIME[ext] ?? "application/octet-stream", "Cache-Control": "private, max-age=3600" },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
