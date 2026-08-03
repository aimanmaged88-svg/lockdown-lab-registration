import { FlowClient } from "@/components/member/flow-client";
import { getMember } from "@/lib/member";

export const dynamic = "force-dynamic";

export default async function GamePage() {
  const member = await getMember();
  return (
    <div className="space-y-4">
      <h1 className="text-xl">Game today</h1>
      <p className="text-sm text-grey">Tell UNC the time and you&apos;ll get the right move for the window you&apos;re in. Familiar beats fancy on game day.</p>
      <FlowClient kind="game" allergies={member?.allergies} />
    </div>
  );
}
