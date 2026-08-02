import { NextRequest, NextResponse } from "next/server";

// Member identity: an anonymous device id in an httpOnly cookie. No account,
// no password, no personal data — the minimum needed so private reflections
// belong to this device and nobody else. Set on first visit to /member.
export function middleware(req: NextRequest) {
  const res = NextResponse.next();
  if (!req.cookies.get("unc_member")?.value) {
    res.cookies.set("unc_member", crypto.randomUUID(), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
    });
  }
  return res;
}

export const config = {
  matcher: ["/member/:path*", "/member"],
};
