"use client";
import { useMemo, useState } from "react";
import { Badge, pillarTone } from "@/components/ui";
import { QuickReply } from "./quick-reply";
import { QuestionActions } from "./widgets";
import { QUESTION_TREE } from "@/lib/member-shared";
import { Bell } from "lucide-react";
import Link from "next/link";

export type InboxQuestion = {
  id: string; text: string; pillar: string | null; subcat: string | null;
  audience: string | null; askedBy: string | null; source: string; frequency: number;
  status: string; notify: boolean; fromMember: boolean; answeredContentId: string | null;
  contributorAcknowledged: boolean; createdAt: string;
};

const STATUS_FILTERS = [
  { key: "open", label: "Open" },
  { key: "answered", label: "Answered" },
  { key: "all", label: "All" },
] as const;

// UNC's phone-first question inbox: filter by pillar → subcategory → status,
// answer in place. Big tap targets, no tables.
export function QuestionInbox({ questions }: { questions: InboxQuestion[] }) {
  const [pillar, setPillar] = useState<string>("all");
  const [subcat, setSubcat] = useState<string>("all");
  const [status, setStatus] = useState<string>("open");

  const subcats = useMemo(() => {
    const base = pillar !== "all" && QUESTION_TREE[pillar] ? [...QUESTION_TREE[pillar].subcats] : [];
    for (const q of questions) {
      if (pillar !== "all" && q.pillar !== pillar) continue;
      if (q.subcat && !base.includes(q.subcat)) base.push(q.subcat);
    }
    return base;
  }, [pillar, questions]);

  const shown = questions.filter((q) => {
    if (pillar !== "all" && q.pillar !== pillar) return false;
    if (subcat !== "all" && q.subcat !== subcat) return false;
    if (status === "open" && q.status !== "open") return false;
    if (status === "answered" && q.status !== "answered") return false;
    return true;
  });

  const count = (p: string) => questions.filter((q) => (p === "all" || q.pillar === p) && q.status === "open").length;

  return (
    <div className="space-y-3">
      {/* Layer 1: pillar chips */}
      <div className="flex flex-wrap gap-2">
        <button className={`chip ${pillar === "all" ? "btn-primary" : ""}`} onClick={() => { setPillar("all"); setSubcat("all"); }}>
          All <span className="opacity-70">({count("all")})</span>
        </button>
        {Object.entries(QUESTION_TREE).map(([p, cfg]) => (
          <button key={p} className={`chip ${pillar === p ? "btn-primary" : ""}`} onClick={() => { setPillar(p); setSubcat("all"); }}>
            {cfg.icon} {p} <span className="opacity-70">({count(p)})</span>
          </button>
        ))}
      </div>

      {/* Layer 2: subcategory + status */}
      <div className="flex flex-wrap items-center gap-2">
        {pillar !== "all" && subcats.length > 0 && (
          <select className="input w-auto text-xs py-1.5" value={subcat} onChange={(e) => setSubcat(e.target.value)} aria-label="Subcategory">
            <option value="all">Every {pillar} topic</option>
            {subcats.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        )}
        <div className="flex gap-1.5 ml-auto">
          {STATUS_FILTERS.map((s) => (
            <button key={s.key} className={`chip text-xs ${status === s.key ? "btn-primary" : ""}`} onClick={() => setStatus(s.key)}>{s.label}</button>
          ))}
        </div>
      </div>

      {shown.length === 0 && <p className="text-sm text-grey py-4">Nothing here — inbox zero on this filter. 🏆</p>}

      {shown.map((q) => (
        <div key={q.id} className="card p-4">
          <p className="text-sm">{q.text}</p>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {q.pillar && <Badge tone={pillarTone(q.pillar)}>{QUESTION_TREE[q.pillar]?.icon} {q.pillar}</Badge>}
            {q.subcat && <Badge>{q.subcat}</Badge>}
            {q.audience && <Badge>{q.audience}</Badge>}
            <Badge tone={q.fromMember ? "accent" : "default"}>{q.fromMember ? (q.askedBy || "Anonymous") : q.source}</Badge>
            {q.notify && <Badge tone="warn"><Bell size={10} className="inline mr-0.5" />wants the ping</Badge>}
            {q.frequency > 1 && <Badge>asked {q.frequency}×</Badge>}
            <Badge tone={q.status === "answered" ? "good" : q.status === "planned" ? "warn" : "default"}>{q.status}</Badge>
            {q.answeredContentId && <Link href={`/content/${q.answeredContentId}`} className="text-xs underline text-paper-dim">see the reel</Link>}
            {q.contributorAcknowledged && <Badge tone="good">loop closed</Badge>}
          </div>
          <div className="mt-3 flex flex-wrap items-start gap-2">
            {q.status === "open" && <QuickReply questionId={q.id} pillar={q.pillar} />}
            <QuestionActions id={q.id} status={q.status} />
          </div>
        </div>
      ))}
    </div>
  );
}
