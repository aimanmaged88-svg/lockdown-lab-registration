import { NextRequest, NextResponse } from "next/server";
import { seed } from "@/lib/seed-core";
import { env } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// One-time, idempotent seed for hosted deploys. Guarded by AUTH_SECRET so it
// can't be triggered by anyone. Safe to call more than once (upserts/guards).
// Usage: POST or GET /api/admin/seed?token=<AUTH_SECRET>
async function handle(req: NextRequest) {
  const token = new URL(req.url).searchParams.get("token");
  if (!token || token !== env.AUTH_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const result = await seed();
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Seed failed" }, { status: 500 });
  }
}

export const GET = handle;
export const POST = handle;
