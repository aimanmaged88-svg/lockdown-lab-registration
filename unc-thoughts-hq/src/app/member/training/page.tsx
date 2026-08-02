import { FlowClient } from "@/components/member/flow-client";
import { getMember } from "@/lib/member";

export const dynamic = "force-dynamic";

export default async function TrainingPage() {
  const member = await getMember();
  return (
    <div className="space-y-4">
      <h1 className="text-xl">Training today</h1>
      <p className="text-sm text-grey">Fuel sized to the time you&apos;ve got, and one thing to actually work on.</p>
      <FlowClient kind="training" allergies={member?.allergies} />
    </div>
  );
}
