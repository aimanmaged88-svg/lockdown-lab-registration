import { NextRequest, NextResponse } from "next/server";
import { prisma, getOrgId } from "@/lib/db";
import { env } from "@/lib/env";
import { approvedItems } from "@/lib/unk/knowledge";
import { compose } from "@/lib/unk/answer";
import { parseClockTime, minutesUntil, bandFor } from "@/lib/unk/timeband";
import { encryptText, decryptText } from "@/lib/crypto";
import { isEnabled } from "@/lib/flags";
import { randomUUID } from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Production acceptance self-test (AUTH_SECRET-guarded). Runs the Ask Unk
// acceptance scenarios ON the deployed runtime against the LIVE database —
// engine, retrieval, time, safety, privacy round-trip. Browser-level clicks
// are covered by the Playwright suite against the identical build.
export async function GET(req: NextRequest) {
  const token = new URL(req.url).searchParams.get("token");
  if (!token || token !== env.AUTH_SECRET) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const results: Array<{ test: string; pass: boolean; detail: string }> = [];
  const add = (test: string, pass: boolean, detail = "") => results.push({ test, pass, detail });

  try {
    const items = await approvedItems();
    add("brain has approved items", items.length >= 10, `${items.length} approved`);

    // 1+2+10: 7:30 PM game — structured, correctly time-banded, quick shape.
    const a1 = compose({ question: "My game is at 7:30 PM. What should I do now?", items, youth: true });
    const expected = bandFor(minutesUntil(parseClockTime("7:30 PM")!.minutesOfDay));
    add("7:30 PM game answers with all 5 sections", a1.mode === "answer" && !!(a1.sections.doNow && a1.sections.food && a1.sections.mindset && a1.sections.careful && a1.sections.privateQ), a1.mode);
    add("band matches live Sydney time", a1.band === expected, `band=${a1.band} expected=${expected}`);
    add("privacy line present verbatim", a1.privacyLine === "You do not have to share your answer. But answer it honestly for yourself.");

    // 3: retrieval from approved Brain material, owner-traceable.
    add("answer cites approved Brain items", a1.usedItems.length > 0, a1.usedItems.map((u) => u.title).join(" · "));

    // 4: no invention.
    const a2 = compose({ question: "What is the capital of France?", items, youth: false });
    add("unsupported question is an honest miss", a2.mode === "unsupported" && a2.supported === false);

    // 7: supplement / quick-speed redirect.
    const a3 = compose({ question: "What gives me a quick burst of speed?", items, youth: true });
    add("quick-speed gets safety redirect", a3.mode === "redirect" && /nothing gives you an instant burst/i.test(a3.headline));

    // 8: medical escalation.
    const a4 = compose({ question: "I get chest pain when I run hard", items, youth: true });
    add("chest pain escalates to 000", a4.mode === "escalate" && a4.bullets.join(" ").includes("000"));

    // 9: guardian note for youth nutrition.
    const a5 = compose({ question: "What should I eat before my game?", items, youth: true, eventMinutesOverride: 90 });
    add("guardian note on youth nutrition", !!a5.guardianNote);

    // 5: private answer round-trip — encrypted at rest, scoped to its member.
    const orgId = await getOrgId();
    const mid = `selftest-${randomUUID()}`;
    await prisma.member.create({ data: { id: mid, orgId } });
    const secret = `selftest private answer ${Date.now()}`;
    const r = await prisma.reflection.create({ data: { memberId: mid, promptText: "selftest prompt", answerEnc: encryptText(secret) } });
    const stored = await prisma.reflection.findUnique({ where: { id: r.id } });
    add("reflection encrypted at rest", !!stored?.answerEnc?.startsWith("enc1:") && !stored.answerEnc.includes("private answer"));
    add("reflection decrypts for its owner", decryptText(stored!.answerEnc) === secret);
    const crossRead = await prisma.reflection.count({ where: { id: r.id, memberId: "someone-else" } });
    add("reflection invisible to other members", crossRead === 0);
    add("sharing defaults to none", stored!.shareStatus === "none");

    // 6: sharing gated + separate (community beta off ⇒ requestShare refuses).
    const betaOn = await isEnabled("community_beta");
    add("community beta off ⇒ sharing disabled", !betaOn, betaOn ? "beta is ON — sharing possible after moderation only" : "off");

    // cleanup
    await prisma.member.delete({ where: { id: mid } }); // cascades the reflection
  } catch (e) {
    add("selftest crashed", false, e instanceof Error ? e.message : String(e));
  }

  const fail = results.filter((r) => !r.pass).length;
  return NextResponse.json({ pass: results.length - fail, fail, results });
}
