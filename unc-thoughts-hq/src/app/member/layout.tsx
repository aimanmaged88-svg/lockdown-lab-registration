import Link from "next/link";
import { Logo } from "@/components/logo";
import { InstallNudge } from "@/components/member/install-nudge";
import { BetaGate } from "@/components/member/beta-gate";

// The member app installs as its own PWA (start screen = /member), separate
// from the owner's desk manifest.
export const metadata = { manifest: "/unk.webmanifest" };

// Member chrome: deliberately minimal. No creator nav, no feed, no noise.
export default function MemberLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-xl">
      <BetaGate />
      <header className="flex items-center justify-between py-1 mb-5">
        <Link href="/member" className="flex items-center gap-2">
          <Logo size={44} />
          <span className="eyebrow">Ask UNC</span>
        </Link>
        <Link href="/member/answers" className="text-xs text-grey underline">My answers</Link>
      </header>
      {children}
      <InstallNudge />
      <footer className="mt-10 pb-6 text-[11px] text-grey leading-relaxed space-y-1">
        <p>General education, not personal medical advice. Emergencies: call 000 (Australia).</p>
        <p>Your reflections are private by default, stored encrypted, never used to train AI, and never shared unless you explicitly choose to.</p>
        <p>
          <Link href="/member/terms" className="underline">House Rules, Terms &amp; Privacy</Link>
          <span className="mx-1.5">·</span>
          <Link href={`/member/question?q=${encodeURIComponent("Something looks off in the app: ")}`} className="underline">🐞 Report a problem (beta)</Link>
        </p>
      </footer>
    </div>
  );
}
