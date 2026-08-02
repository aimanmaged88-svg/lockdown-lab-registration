import { prisma, getOrgId } from "@/lib/db";
import { getMember } from "@/lib/member";
import { ReflectionComposer } from "@/components/member/reflection-composer";
import { FollowUp } from "@/components/member/follow-up";
import { PRIVACY_LINE } from "@/lib/unk/safety";
import { isoDate, fmt } from "@/lib/time";
import { Card } from "@/components/ui";

export const dynamic = "force-dynamic";

// Thought of the Day: one private accountability prompt, rotating daily.
export default async function ThoughtPage() {
  const orgId = await getOrgId();
  const prompts = await prisma.thoughtPrompt.findMany({ where: { orgId, active: true }, orderBy: { order: "asc" } });
  const member = await getMember();

  const day = isoDate(new Date());
  const prompt = prompts.length ? prompts[[...day].reduce((a, c) => a + c.charCodeAt(0), 0) % prompts.length] : null;
  const actions = prompt?.actions ? (JSON.parse(prompt.actions) as string[]) : [];

  const due = member
    ? await prisma.reflection.findMany({
        where: {
          memberId: member.id,
          followUp: null,
          OR: [{ reminderAt: { lte: new Date() } }, { actionChosen: { not: null }, createdAt: { lte: new Date(Date.now() - 864e5) } }],
        },
        orderBy: { createdAt: "asc" },
        take: 3,
      })
    : [];

  return (
    <div className="space-y-4">
      <h1 className="text-xl">Thought of the Day</h1>

      {prompt ? (
        <Card className="space-y-3">
          <p className="text-base text-paper leading-relaxed">{prompt.text}</p>
          <p className="text-xs text-grey">{PRIVACY_LINE}</p>
          <ReflectionComposer promptText={prompt.text} actions={actions} />
        </Card>
      ) : (
        <p className="text-sm text-grey">No prompts loaded yet.</p>
      )}

      {due.length > 0 && (
        <div className="space-y-2">
          <div className="eyebrow">Checking in</div>
          {due.map((r) => (
            <Card key={r.id}>
              <p className="text-xs text-grey">{fmt(r.createdAt)} · {r.promptText.slice(0, 90)}</p>
              {r.actionChosen && <p className="text-sm text-paper mt-1">Your action: {r.actionChosen}</p>}
              <FollowUp reflectionId={r.id} />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
