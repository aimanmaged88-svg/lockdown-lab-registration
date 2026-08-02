import { AskClient } from "@/components/member/ask-client";

export const dynamic = "force-dynamic";

export default async function AskPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  return (
    <div className="space-y-4">
      <h1 className="text-xl">Ask Unk</h1>
      <AskClient initialQuestion={q} autorun={!!q} />
    </div>
  );
}
