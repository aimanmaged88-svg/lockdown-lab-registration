import { EatClient } from "@/components/member/eat-client";

export const dynamic = "force-dynamic";

export default function EatPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl">What should I eat?</h1>
      <p className="text-sm text-grey">General education from approved guidance — not a personal plan. Allergies or medical stuff? That&apos;s a parent/guardian + professional conversation.</p>
      <EatClient />
    </div>
  );
}
