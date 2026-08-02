import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { dispatch } from "@/lib/push";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

// Hourly hook for the Netlify scheduled function. Token-guarded; the dispatch
// logic itself decides whether anything is actually worth sending.
export async function GET(req: NextRequest) {
  const token = new URL(req.url).searchParams.get("token");
  if (!token || token !== env.AUTH_SECRET) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    return NextResponse.json(await dispatch());
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "dispatch failed" }, { status: 500 });
  }
}
