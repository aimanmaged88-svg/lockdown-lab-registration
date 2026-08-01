import { Card, Section, Badge } from "@/components/ui";
import { ImportTool } from "@/components/settings/import-tool";
import { BackupTool } from "@/components/settings/backup-tool";
import { FlagToggle } from "@/components/flag-toggle";
import { allFlags } from "@/lib/flags";
import { aiEnabled, env } from "@/lib/env";
import { ROLES } from "@/lib/enums";
import { prisma, getOrgId } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const flags = await allFlags();
  const orgId = await getOrgId();
  const [members, importRuns] = await Promise.all([
    prisma.user.findMany({ where: { orgId }, orderBy: { createdAt: "asc" } }),
    prisma.importRun.findMany({ where: { orgId }, orderBy: { createdAt: "desc" }, take: 5 }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <p className="eyebrow">Data, safety and configuration</p>
        <h1>Settings</h1>
      </div>

      <Section title="Import the roadmap" desc="Idempotent — re-running updates in place, never duplicates.">
        <Card><ImportTool /></Card>
        {importRuns.length > 0 && (
          <p className="text-xs text-grey mt-2">Last import: {importRuns[0].added} added, {importRuns[0].changed} changed.</p>
        )}
      </Section>

      <Section title="Exports" desc="For your records and for sending to Codex/Claude.">
        <Card>
          <div className="flex flex-wrap gap-2">
            <a className="btn" href="/api/export/weekly" download>Weekly report (.md)</a>
            <a className="btn" href="/api/export/content" download>Content calendar (.csv)</a>
            <a className="btn" href="/api/export/analytics" download>Analytics (.csv)</a>
            <a className="btn" href="/api/export/questions" download>Community questions (.csv)</a>
            <a className="btn" href="/api/export/talks" download>Talks (.csv)</a>
            <a className="btn" href="/api/export/research" download>Research library (.csv)</a>
          </div>
        </Card>
      </Section>

      <Section title="Backup & restore" desc="Complete JSON backup you can restore from.">
        <Card><BackupTool /></Card>
      </Section>

      <Section title="Feature flags" desc="Release B community stays off until you've read the safety checklist.">
        <Card className="space-y-3">
          <FlagToggle flagKey="community_beta" enabled={flags.community_beta} label="Adult community beta (Release B) — 18+ only" />
          <FlagToggle flagKey="video_inspect" enabled={flags.video_inspect} label="Local video inspection (needs ffmpeg installed)" />
        </Card>
      </Section>

      <Section title="Roles" desc="Role-based access. Expert verification is manual and records its basis.">
        <Card>
          <div className="flex flex-wrap gap-2 mb-3">
            {ROLES.map((r) => <Badge key={r}>{r}</Badge>)}
          </div>
          <div className="space-y-1 text-sm">
            {members.map((m) => (
              <div key={m.id} className="flex items-center justify-between">
                <span>{m.displayName} <span className="text-grey">· {m.email}</span></span>
                <span className="flex gap-2">
                  <Badge>{m.role}</Badge>
                  {m.isAdult && <Badge tone="good">18+</Badge>}
                  {m.verifiedExpert && <Badge tone="accent">expert</Badge>}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </Section>

      <Section title="Optional AI" desc="Everything works without it. AI only ever suggests — never sends or saves without your approval.">
        <Card>
          <p className="text-sm">
            Status: {aiEnabled ? <Badge tone="good">enabled ({env.AI_PROVIDER})</Badge> : <Badge>off (rule-based only)</Badge>}
          </p>
          <p className="text-sm text-grey mt-2">
            To enable, set <code>AI_PROVIDER</code>, <code>AI_API_KEY</code> and <code>AI_MODEL</code> in <code>.env</code>. Costs are billed by the provider.
            Generated content always requires your approval before it&apos;s saved or sent.
          </p>
        </Card>
      </Section>

      <Section title="Privacy & safety" desc="Safety by Design. Adults 18+ only for the account community.">
        <Card className="space-y-2 text-sm text-paper-dim">
          <p>• We collect the minimum needed. No exact live location, no school info, no birth dates beyond an 18+ confirmation, no health diagnoses, no body measurements.</p>
          <p>• Nutrition content is general education. The app flags restrictive/shaming/medical language and suggests safer wording.</p>
          <p>• The community is invite-only and adults-only until legal, privacy, online-safety and safeguarding reviews are complete. No private adult-to-child messaging is ever built.</p>
          <p>• Full audit trail, reporting, blocking, moderation queues, consent and data-export/delete workflows are built in.</p>
          <p className="text-grey">See <code>docs/PRIVACY.md</code>, <code>docs/COMMUNITY-SAFETY-CHECKLIST.md</code> and <code>docs/COMMUNITY-GUIDELINES.md</code>.</p>
        </Card>
      </Section>
    </div>
  );
}
