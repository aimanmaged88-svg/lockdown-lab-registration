import { huddleFeed } from "@/lib/huddle-actions";
import { HuddleClient } from "@/components/member/huddle-client";
import Link from "next/link";

export const dynamic = "force-dynamic";

// The Huddle: topic conversation, anonymous by default, human-verified —
// nothing appears until UNC has checked it.
export default async function HuddlePage() {
  const feed = await huddleFeed();
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl">The Huddle</h1>
        <p className="text-sm text-grey mt-1">
          Talk ball, food and headspace with the community. UNC checks every post
          before it goes up — that&apos;s why it stays good in here.
        </p>
      </div>
      <HuddleClient feed={feed} />
      <p className="text-[11px] text-grey leading-relaxed">
        Anonymous by default — a name is optional. No personal details (full names, schools, socials of others).
        <Link href="/member/terms" className="underline ml-1">House Rules</Link> apply; zero tolerance for tearing people down.
      </p>
    </div>
  );
}
