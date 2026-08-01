"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addQuestion, commentToReel, closeLoop, bumpQuestionFrequency, updateInboxItem } from "@/lib/actions";
import { PILLARS, AUDIENCES } from "@/lib/enums";
import { Film, Plus, Check, TrendingUp } from "lucide-react";

export function AddQuestionForm() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [pillar, setPillar] = useState("");
  const [audience, setAudience] = useState("");
  const [source, setSource] = useState("comment");
  const [pending, start] = useTransition();

  function submit() {
    if (!text.trim()) return;
    start(async () => {
      await addQuestion({ text, pillar: pillar || undefined, audience: audience || undefined, source });
      setText(""); setPillar(""); setAudience("");
      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      <textarea className="input" rows={2} placeholder="Paste a real comment or question from your audience…" value={text} onChange={(e) => setText(e.target.value)} />
      <div className="flex flex-wrap gap-2">
        <select className="input w-auto" value={pillar} onChange={(e) => setPillar(e.target.value)}>
          <option value="">Pillar…</option>
          {PILLARS.map((p) => <option key={p}>{p}</option>)}
        </select>
        <select className="input w-auto" value={audience} onChange={(e) => setAudience(e.target.value)}>
          <option value="">Audience…</option>
          {AUDIENCES.map((a) => <option key={a}>{a}</option>)}
        </select>
        <select className="input w-auto" value={source} onChange={(e) => setSource(e.target.value)}>
          <option value="comment">Comment</option>
          <option value="dm">DM</option>
          <option value="talk">Talk</option>
          <option value="member">Member</option>
        </select>
        <button className="btn btn-primary" onClick={submit} disabled={pending || !text.trim()}><Plus size={15} /> Add question</button>
      </div>
    </div>
  );
}

export function QuestionActions({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<unknown>) => start(async () => { await fn(); router.refresh(); });
  return (
    <div className="flex flex-wrap gap-2">
      <button className="btn" onClick={() => run(() => commentToReel(id))} disabled={pending}><Film size={14} /> Turn into Reply Reel</button>
      <button className="btn btn-ghost" onClick={() => run(() => bumpQuestionFrequency(id))} disabled={pending}><TrendingUp size={14} /> +1 asked</button>
      {status !== "answered" && (
        <button className="btn btn-ghost" onClick={() => run(() => closeLoop(id, true))} disabled={pending}><Check size={14} /> Mark answered + credited</button>
      )}
    </div>
  );
}

export function InboxActions({ id }: { id: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<unknown>) => start(async () => { await fn(); router.refresh(); });
  return (
    <div className="flex gap-2">
      <button className="btn btn-ghost text-xs" onClick={() => run(() => updateInboxItem(id, { status: "done" }))} disabled={pending}>Done</button>
      <button className="btn btn-ghost text-xs" onClick={() => run(() => updateInboxItem(id, { status: "snoozed", snoozeUntil: new Date(Date.now() + 864e5).toISOString() }))} disabled={pending}>Snooze 1d</button>
    </div>
  );
}
