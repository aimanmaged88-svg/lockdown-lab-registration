import { approvedItems, parseSections } from "@/lib/unk/knowledge";
import { ReflectionComposer } from "@/components/member/reflection-composer";
import { PRIVACY_LINE } from "@/lib/unk/safety";
import { isoDate } from "@/lib/time";
import { Card } from "@/components/ui";

export const dynamic = "force-dynamic";

// One useful cue and one action — rotates daily through approved Mindset items.
export default async function MindsetPage() {
  const items = (await approvedItems()).filter((i) => i.pillar === "Mindset" && (i.kind === "playbook" || i.kind === "lesson"));
  if (items.length === 0) {
    return <p className="text-sm text-grey">No approved mindset teaching yet — UNC is on it.</p>;
  }
  const day = isoDate(new Date());
  const idx = [...day].reduce((a, c) => a + c.charCodeAt(0), 0) % items.length;
  const item = items[idx];
  const s = parseSections(item.body);

  return (
    <div className="space-y-4">
      <h1 className="text-xl">Mindset reset</h1>
      <Card className="space-y-4">
        <div>
          <div className="eyebrow">Today&apos;s cue</div>
          <p className="text-base text-paper mt-1 whitespace-pre-wrap">{s.mindset ?? item.title}</p>
        </div>
        {s.doNow && (
          <div>
            <div className="eyebrow">One action</div>
            <p className="text-sm text-paper mt-0.5 whitespace-pre-wrap">{s.doNow}</p>
          </div>
        )}
        {s.privateQ && (
          <div className="rounded-xl border border-ink-line2 bg-ink-soft p-3">
            <div className="eyebrow">Answer this privately</div>
            <p className="text-sm text-paper mt-0.5">{s.privateQ}</p>
            <p className="text-xs text-grey mt-1.5">{PRIVACY_LINE}</p>
            <ReflectionComposer promptText={s.privateQ} compact />
          </div>
        )}
      </Card>
    </div>
  );
}
