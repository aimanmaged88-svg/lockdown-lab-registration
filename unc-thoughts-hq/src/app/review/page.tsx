import { Card, Section, Stat } from "@/components/ui";
import { weeklyMarkdown } from "@/lib/exports";
import { getWeekProgress } from "@/lib/queries";
import { CopyButton } from "@/components/copy-button";
import { fmt, weekStart } from "@/lib/time";

export const dynamic = "force-dynamic";

export default async function ReviewPage() {
  const [md, week] = await Promise.all([weeklyMarkdown(), getWeekProgress()]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Week of {fmt(weekStart(), "d MMM yyyy")}</p>
          <h1>Weekly Review</h1>
        </div>
        <div className="flex gap-2">
          <a className="btn" href="/api/export/weekly" download>Download .md</a>
          <CopyButton text={md} label="Copy for AI" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Planned" value={week.planned} />
        <Stat label="Posted" value={week.posted} />
        <Stat label="Completed" value={week.complete} />
      </div>

      <Section title="Report" desc="Clean enough to paste straight into Codex or Claude for analysis.">
        <Card>
          <pre className="whitespace-pre-wrap text-sm text-paper-dim font-mono leading-relaxed overflow-x-auto">{md}</pre>
        </Card>
      </Section>
    </div>
  );
}
