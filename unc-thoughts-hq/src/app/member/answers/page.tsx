import { getMember } from "@/lib/member";
import { prisma } from "@/lib/db";
import { decryptText } from "@/lib/crypto";
import { FollowUp } from "@/components/member/follow-up";
import { ShareDialog } from "@/components/member/share-dialog";
import { DeleteReflection } from "@/components/member/reflection-actions";
import { isEnabled } from "@/lib/flags";
import { fmt } from "@/lib/time";
import { Card, Badge, Empty } from "@/components/ui";
import { Lock } from "lucide-react";

export const dynamic = "force-dynamic";

// The member's private reflection history. Decrypted server-side for the
// owner-of-the-cookie only; sharing is a separate explicit flow per item.
export default async function AnswersPage() {
  const member = await getMember();
  const betaOn = await isEnabled("community_beta");
  const reflections = member
    ? await prisma.reflection.findMany({ where: { memberId: member.id }, orderBy: { createdAt: "desc" }, take: 50 })
    : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Lock size={16} className="text-paper-dim" />
        <h1 className="text-xl">My answers</h1>
      </div>
      <p className="text-sm text-grey">Private to this device. Encrypted at rest. Delete anything, any time.</p>

      {reflections.length === 0 ? (
        <Empty title="Nothing here yet." hint="Answer a Thought of the Day, or the private question under any UNC answer." />
      ) : (
        <div className="space-y-2.5">
          {reflections.map((r) => {
            const answer = decryptText(r.answerEnc);
            const due = !r.followUp && (r.reminderAt ? r.reminderAt <= new Date() : !!r.actionChosen && r.createdAt <= new Date(Date.now() - 864e5));
            return (
              <Card key={r.id}>
                <p className="text-xs text-grey">{fmt(r.createdAt, "EEE d MMM, h:mmaaa")}</p>
                <p className="text-sm text-paper-dim mt-1">{r.promptText}</p>
                {answer && <p className="text-sm text-paper mt-2 whitespace-pre-wrap">{answer}</p>}
                {r.voicePath && (
                  // eslint-disable-next-line jsx-a11y/media-has-caption
                  <audio controls src={`/api/voice/${r.id}`} className="mt-2 h-9 w-full" preload="none" />
                )}
                {r.actionChosen && <p className="text-sm mt-2">→ Your action: <span className="text-paper">{r.actionChosen}</span></p>}
                {r.followUp && <Badge tone={r.followUp === "yes" ? "good" : "default"} className="mt-2">{{ yes: "Followed through", partly: "Partly", not_yet: "Not yet", changed_plan: "Changed the plan" }[r.followUp] ?? r.followUp}</Badge>}
                {due && <FollowUp reflectionId={r.id} />}

                <div className="flex flex-wrap items-center gap-2 mt-2 pt-2 border-t border-ink-line">
                  {r.shareStatus === "none" && betaOn && (answer || r.actionChosen) && (
                    <ShareDialog reflectionId={r.id} defaultText={answer ?? `The action I committed to: ${r.actionChosen}`} />
                  )}
                  {r.shareStatus === "none" && !betaOn && <span className="text-[11px] text-grey">Sharing is off while the community is closed — this stays private.</span>}
                  {r.shareStatus === "pending" && <Badge tone="warn">shared — waiting for review</Badge>}
                  {r.shareStatus === "approved" && <Badge tone="good">shared with the community</Badge>}
                  {r.shareStatus === "declined" && <Badge>not shared — kept private</Badge>}
                  <span className="ml-auto"><DeleteReflection id={r.id} /></span>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
