import { Logo } from "@/components/logo";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import crypto from "crypto";

export const dynamic = "force-dynamic";

// The desk lock screen. One field, one button, remembers this device for a
// year. The member app stays open — this only guards UNC's side.
async function unlock(formData: FormData) {
  "use server";
  const attempt = String(formData.get("password") ?? "");
  const password = process.env.DESK_PASSWORD;
  if (!password) redirect("/");
  if (attempt !== password) redirect("/unlock?bad=1");
  const token = crypto.createHash("sha256").update(`${password}:${process.env.AUTH_SECRET || "dev-secret-change-me"}:desk`).digest("hex");
  (await cookies()).set("unc_desk", token, {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365, path: "/",
  });
  redirect("/");
}

export default async function UnlockPage({ searchParams }: { searchParams: Promise<{ bad?: string }> }) {
  const { bad } = await searchParams;
  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <form action={unlock} className="w-full max-w-xs text-center space-y-6">
        <div className="flex justify-center"><Logo size={34} /></div>
        <p className="eyebrow">Coach's desk</p>
        <input
          type="password"
          name="password"
          autoFocus
          autoComplete="current-password"
          placeholder="Password"
          aria-label="Desk password"
          className="input text-center text-lg tracking-widest"
        />
        {bad && <p className="text-sm text-accent-soft">Not it. Try again.</p>}
        <button type="submit" className="btn btn-primary w-full py-3 text-base">Unlock</button>
        <p className="text-[11px] text-grey">Stays unlocked on this device for a year.</p>
      </form>
    </div>
  );
}
