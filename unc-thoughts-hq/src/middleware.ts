import { NextRequest, NextResponse } from "next/server";

// Two jobs:
// 1. Desk lock — when DESK_PASSWORD is set, every creator screen needs the
//    unlock cookie. The member app (/member, Ask Unk) stays public by design,
//    as do token-guarded admin routes and PWA assets. Unset the env var and
//    the lock disappears (local dev + tests run unlocked).
// 2. Member identity — anonymous device cookie for /member.

const PUBLIC_PREFIXES = [
  "/member",
  "/unlock",
  "/api/voice",       // member voice notes (cookie-scoped inside the route)
  "/api/admin",       // AUTH_SECRET-guarded
  "/api/notify",      // AUTH_SECRET-guarded
  "/manifest.webmanifest",
  "/unk.webmanifest",
  "/sw.js",
  "/brand",
  "/favicon",
];

async function deskToken(password: string, secret: string): Promise<string> {
  const data = new TextEncoder().encode(`${password}:${secret}:desk`);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const res = NextResponse.next();

  // Member device identity.
  if (pathname === "/member" || pathname.startsWith("/member/")) {
    if (!req.cookies.get("unc_member")?.value) {
      res.cookies.set("unc_member", crypto.randomUUID(), {
        httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 365, path: "/",
      });
    }
    return res;
  }

  // Desk lock (only when configured).
  const password = process.env.DESK_PASSWORD;
  if (!password) return res;
  if (PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/") || pathname.startsWith(p + "."))) return res;

  const expected = await deskToken(password, process.env.AUTH_SECRET || "dev-secret-change-me");
  if (req.cookies.get("unc_desk")?.value === expected) return res;

  const url = req.nextUrl.clone();
  // The bare domain is the public front door: visitors without the desk cookie
  // get the member app, not a lock screen. The owner unlocks at /unlock.
  if (pathname === "/") {
    url.pathname = "/member";
    url.search = "";
    return NextResponse.redirect(url);
  }
  url.pathname = "/unlock";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  // Everything except Next internals + static files with extensions.
  matcher: ["/((?!_next/|.*\\..*).*)", "/manifest.webmanifest", "/unk.webmanifest", "/sw.js"],
};
