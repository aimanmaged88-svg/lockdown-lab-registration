import { myQuestions } from "@/lib/unk/question-actions";
import { QuestionClient } from "@/components/member/question-client";
import Link from "next/link";

export const dynamic = "force-dynamic";

// Ask UNC himself — not the AI. Categorised so his inbox stays sane, anonymous
// by default, optional ping when the answer lands.
export default async function QuestionPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const mine = await myQuestions();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl">Ask UNC himself</h1>
        <p className="text-sm text-grey mt-1">
          A real question to the real person — answered from lived experience, not a script.
          You don&apos;t have to say who you are. Good answers get added to Unk&apos;s brain, always anonymously.
        </p>
      </div>

      <QuestionClient prefill={q?.slice(0, 500) ?? ""} mine={mine} />

      <p className="text-[11px] text-grey leading-relaxed">
        By sending a question you agree to the <Link href="/member/terms" className="underline">House Rules &amp; Terms</Link>.
        Every question is read by a human. Answers are general education — not medical, dietary or professional advice.
      </p>
    </div>
  );
}
