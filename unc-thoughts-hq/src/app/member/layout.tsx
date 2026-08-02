import Link from "next/link";
import { Logo } from "@/components/logo";

// Member chrome: deliberately minimal. No creator nav, no feed, no noise.
export default function MemberLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-xl">
      <header className="flex items-center justify-between py-1 mb-5">
        <Link href="/member" className="flex items-center gap-2">
          <Logo size={22} />
          <span className="eyebrow">Ask Unk</span>
        </Link>
        <Link href="/member/answers" className="text-xs text-grey underline">My answers</Link>
      </header>
      {children}
      <footer className="mt-10 pb-6 text-[11px] text-grey leading-relaxed space-y-1">
        <p>General education, not personal medical advice. Emergencies: call 000 (Australia).</p>
        <p>Your reflections are private by default, stored encrypted, never used to train AI, and never shared unless you explicitly choose to.</p>
      </footer>
    </div>
  );
}
