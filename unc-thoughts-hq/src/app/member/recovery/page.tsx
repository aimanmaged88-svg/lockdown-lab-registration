import { AskClient } from "@/components/member/ask-client";

export const dynamic = "force-dynamic";

export default function RecoveryPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl">Recovery</h1>
      <p className="text-sm text-grey">The unglamorous stuff that decides how tomorrow feels.</p>
      <AskClient initialQuestion="What should I do after training?" autorun />
    </div>
  );
}
