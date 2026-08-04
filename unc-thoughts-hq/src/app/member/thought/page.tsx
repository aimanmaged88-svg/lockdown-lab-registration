import { prisma, getOrgId } from "@/lib/db";
import { getMember } from "@/lib/member";
import { ReflectionComposer } from "@/components/member/reflection-composer";
import { FollowUp } from "@/components/member/follow-up";
import { SaveThoughtButton, LibraryList } from "@/components/member/thought-library";
import { PRIVACY_LINE } from "@/lib/unk/safety";
import { fmt } from "@/lib/time";
import { currentSlot, pickThought } from "@/lib/thought-slots";
import { Card } from "@/components/ui";

export const dynamic = "force-dynamic";

// Thoughts through the day (morning / afternoon / evening), tuned by the
// member's own library: save what hits, get more of what sounds like you.
export default async function ThoughtPage() {
  const orgId = await getOrgId();
  const [bank, answered] = await Promise.all([
    prisma.thoughtPrompt.findMany({ where: { orgId, active: true }, orderBy: { order: "asc" } }),
    // UNC's brain as a wisdom feed: short real answers he's given become
    // servable thoughts — the rotation literally grows every time he replies.
    prisma.communityQuestion.findMany({
      where: { orgId, status: "answered", answerText: { not: null } },
      orderBy: { answeredAt: "desc" },
      take: 120,
    }),
  ]);
  const answerThoughts = answered
    .filter((q) => (q.answerText ?? "").length >= 30 && (q.answerText ?? "").length <= 300)
    .map((q) => ({ id: `q_${q.id}`, text: q.answerText!, pillar: q.pillar ?? "Mindset", actions: "[]" }));
  const prompts = [...bank, ...answerThoughts];
  const member = await getMember();

  const slot = currentSlot();
  const saved = member
    ? await prisma.savedThought.findMany({ where: { memberId: member.id }, orderBy: { createdAt: "desc" } })
    : [];
  const pillarCounts: Record<string, number> = {};
  for (const s of saved) pillarCounts[s.pillar] = (pillarCounts[s.pillar] ?? 0) + 1;

  const prompt = member ? pickThought(prompts, pillarCounts, member.id, slot.key) : prompts[0] ?? null;
  const actions = prompt?.actions ? (JSON.parse(prompt.actions) as string[]) : [];
  const savedIds = new Set(saved.map((s) => s.promptId));

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
      <div>
        <h1 className="text-xl">{slot.label}</h1>
        <p className="text-xs text-grey mt-0.5">A new one each morning, afternoon and evening — shaped by what you save.</p>
      </div>

      {prompt ? (
        <Card className="space-y-3">
          {prompt.id.startsWith("q_") && (
            <p className="text-[11px] text-grey">🧠 From UNC&apos;s brain — a real answer to a real question from the community.</p>
          )}
          <p className="text-base text-paper leading-relaxed">{prompt.text}</p>
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-grey">{PRIVACY_LINE}</p>
            <SaveThoughtButton promptId={prompt.id} saved={savedIds.has(prompt.id)} />
          </div>
          <ReflectionComposer promptText={prompt.text} actions={actions} />
        </Card>
      ) : (
        <p className="text-sm text-grey">No prompts loaded yet.</p>
      )}

      <div className="space-y-2">
        <div className="eyebrow">Your library ({saved.length})</div>
        <LibraryList items={saved.map((s) => ({ id: s.id, text: s.text, pillar: s.pillar }))} />
      </div>

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
