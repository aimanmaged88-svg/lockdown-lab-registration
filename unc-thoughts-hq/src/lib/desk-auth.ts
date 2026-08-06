import { cookies } from "next/headers";

// Server actions are invokable from any route, so owner-only actions must
// verify the desk cookie themselves — mirrors the middleware's token
// derivation. No DESK_PASSWORD (local dev/tests) = unlocked, same as middleware.
export async function requireDesk(): Promise<void> {
  const password = process.env.DESK_PASSWORD;
  if (!password) return;
  const data = new TextEncoder().encode(`${password}:${process.env.AUTH_SECRET || "dev-secret-change-me"}:desk`);
  const hash = await crypto.subtle.digest("SHA-256", data);
  const expected = Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
  const jar = await cookies();
  if (jar.get("unc_desk")?.value !== expected) throw new Error("Desk only.");
}
