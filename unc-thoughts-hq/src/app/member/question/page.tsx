import { QuestionClient } from "@/components/member/question-client";
import Link from "next/link";

// This is where the Instagram link lands people, so it does no database work
// before painting: the ask form is fully static and the visitor's own
// question history loads client-side once the form is already up.
export const dynamic = "force-static";

// Ask UNC himself — not the AI. Categorised so his inbox stays sane, anonymous
// by default, optional ping when the answer lands.
export default async function QuestionPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl">Ask UNC himself</h1>
        <p className="text-sm text-grey mt-1">
          A real question to the real person — answered from lived experience, not a script.
          You don&apos;t have to say who you are. Good answers get added to UNC&apos;s brain, always anonymously.
        </p>
      </div>

      <Link href="/member/library" className="card p-3 flex items-center gap-2.5 hover:bg-ink-soft transition-colors">
        <span aria-hidden>📚</span>
        <span className="text-xs text-paper-dim">
          <span className="font-medium text-paper">Check the Library first</span> — your question might already be answered. Browse what&apos;s been asked →
        </span>
      </Link>

      <QuestionClient prefill={q?.slice(0, 500) ?? ""} />

      <p className="text-[11px] text-grey leading-relaxed">
        By sending a question you agree to the <Link href="/member/terms" className="underline">House Rules &amp; Terms</Link>.
        Every question is read by a human. Answers are general education — not medical, dietary or professional advice.
      </p>
    </div>
  );
}
