"use client";
import { useState } from "react";
import { RECORDING_GUIDES, SETUP_COACH, SPEAKING } from "@/lib/coach-content";
import { GuidedRecorder } from "./guided-recorder";
import { Preflight } from "./preflight";
import { HookCoach } from "./hook-coach";
import { BatchDay } from "./batch-day";
import { cn } from "@/lib/cn";
import { Card, Badge } from "@/components/ui";

type Item = { id: string; title: string; pillar: string; format: string; recordingLocation: string | null; equipmentUsed: string | null };

export function StudioTabs({
  selected,
  batchCandidates,
  nutritionFlags,
  defaultTab,
}: {
  selected?: { id: string; title: string; hook?: string | null; script?: string | null } | null;
  batchCandidates: Item[];
  nutritionFlags?: { category: string; message: string; suggestion: string }[];
  defaultTab?: string;
}) {
  const TABS = ["Setup", "Types", "Guided", "Speaking & Hooks", "Batch Day", "Preflight"];
  const [tab, setTab] = useState(defaultTab && TABS.includes(defaultTab) ? defaultTab : "Guided");
  const [guideIdx, setGuideIdx] = useState(0);
  const guide = RECORDING_GUIDES[guideIdx];

  return (
    <div className="space-y-5">
      {selected && (
        <Card className="flex items-center justify-between gap-3">
          <div>
            <div className="eyebrow">Recording for</div>
            <div className="font-medium">{selected.title}</div>
          </div>
          <Badge tone="accent">linked</Badge>
        </Card>
      )}

      <div role="tablist" className="flex flex-wrap gap-1 border-b border-ink-line">
        {TABS.map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={cn("px-3 py-2 text-sm border-b-2 -mb-px", tab === t ? "border-paper text-paper" : "border-transparent text-grey hover:text-paper")}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Setup" && (
        <div className="grid md:grid-cols-2 gap-3">
          <Card>
            <div className="eyebrow mb-2">Pre-shoot setup coach</div>
            <ul className="space-y-1.5 text-sm text-paper-dim">
              {SETUP_COACH.map((s) => <li key={s} className="flex gap-2"><span className="text-grey">□</span>{s}</li>)}
            </ul>
          </Card>
          <Card>
            <div className="eyebrow mb-2">Note</div>
            <p className="text-sm text-paper-dim">
              Instagram&apos;s exact technical requirements (safe caption areas, resolution) change over time. The app records the source and a review date in the Research Library — check there before relying on any fixed number.
            </p>
          </Card>
        </div>
      )}

      {tab === "Types" && (
        <div className="grid md:grid-cols-[220px_1fr] gap-4">
          <div className="flex md:flex-col gap-1 overflow-x-auto">
            {RECORDING_GUIDES.map((g, i) => (
              <button key={g.type} onClick={() => setGuideIdx(i)} className={cn("btn justify-start whitespace-nowrap", i === guideIdx && "btn-primary")}>
                {g.type}
              </button>
            ))}
          </div>
          <Card className="space-y-4">
            <h3 className="text-lg">{guide.type}</h3>
            <GuideList title="Quick setup" items={guide.quickSetup} />
            <GuideList title="Professional setup" items={guide.proSetup} />
            <GuideList title="Shot list" items={guide.shotList} />
            <p className="text-sm"><span className="label">Camera position</span>{guide.cameraPosition}</p>
            <p className="text-sm"><span className="label">Lighting</span>{guide.lighting}</p>
            <p className="text-sm"><span className="label">Audio</span>{guide.audio}</p>
            <GuideList title="Example structure" items={guide.structure} ordered />
            <GuideList title="Common mistakes" items={guide.mistakes} />
            <GuideList title="Safety" items={guide.safety} />
            <GuideList title="Final preflight" items={guide.preflight} />
          </Card>
        </div>
      )}

      {tab === "Guided" && (
        <Card>
          <div className="eyebrow mb-3">Guided recording mode</div>
          <GuidedRecorder hook={selected?.hook ?? undefined} script={selected?.script ?? undefined} />
        </Card>
      )}

      {tab === "Speaking & Hooks" && (
        <div className="space-y-4">
          <Card>
            <div className="eyebrow mb-2">Three take modes</div>
            <div className="grid sm:grid-cols-3 gap-2">
              {SPEAKING.takeModes.map((m) => (
                <div key={m.key} className="rounded-lg border border-ink-line p-3">
                  <div className="font-medium text-sm">{m.name}</div>
                  <div className="text-xs text-grey mt-1">{m.note}</div>
                </div>
              ))}
            </div>
          </Card>
          <Card><HookCoach /></Card>
        </div>
      )}

      {tab === "Batch Day" && (
        <Card><BatchDay candidates={batchCandidates} /></Card>
      )}

      {tab === "Preflight" && (
        <Card>
          <div className="eyebrow mb-3">Reel preflight {selected ? `— ${selected.title}` : "(open from a content item to save)"}</div>
          <Preflight contentId={selected?.id} nutritionFlags={nutritionFlags} />
        </Card>
      )}
    </div>
  );
}

function GuideList({ title, items, ordered }: { title: string; items: readonly string[]; ordered?: boolean }) {
  const List = ordered ? "ol" : "ul";
  return (
    <div>
      <div className="label">{title}</div>
      <List className={cn("text-sm text-paper-dim space-y-1", ordered ? "list-decimal list-inside" : "")}>
        {items.map((s) => <li key={s}>{ordered ? s : `• ${s}`}</li>)}
      </List>
    </div>
  );
}
