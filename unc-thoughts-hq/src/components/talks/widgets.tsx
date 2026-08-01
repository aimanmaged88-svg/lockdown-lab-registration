"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createTalk, addTalkClip, clipToContent, addTalkQuestion, voteTalkQuestion } from "@/lib/actions";
import { TALK_TEMPLATES, PILLARS } from "@/lib/enums";
import { Film, Plus } from "lucide-react";

export function CreateTalkForm() {
  const router = useRouter();
  const [v, setV] = useState<{ title: string; template: string; pillar: string; guestName: string; scheduledAt: string; externalLink: string }>({ title: "", template: TALK_TEMPLATES[0], pillar: "Mindset", guestName: "", scheduledAt: "", externalLink: "" });
  const [pending, start] = useTransition();
  const set = (k: string, val: string) => setV((s) => ({ ...s, [k]: val }));
  return (
    <div className="space-y-2">
      <input className="input" placeholder="Talk title" value={v.title} onChange={(e) => set("title", e.target.value)} />
      <div className="grid sm:grid-cols-2 gap-2">
        <select className="input" value={v.template} onChange={(e) => set("template", e.target.value)}>
          {TALK_TEMPLATES.map((t) => <option key={t}>{t}</option>)}
        </select>
        <select className="input" value={v.pillar} onChange={(e) => set("pillar", e.target.value)}>
          {PILLARS.map((p) => <option key={p}>{p}</option>)}
        </select>
        <input className="input" placeholder="Guest name (optional)" value={v.guestName} onChange={(e) => set("guestName", e.target.value)} />
        <input className="input" type="datetime-local" value={v.scheduledAt} onChange={(e) => set("scheduledAt", e.target.value)} />
        <input className="input sm:col-span-2" placeholder="External live link (Zoom/IG Live/etc.)" value={v.externalLink} onChange={(e) => set("externalLink", e.target.value)} />
      </div>
      {v.pillar === "Nutrition" && <p className="text-xs text-warn">Nutrition talks show a general-education (not individual medical advice) disclaimer automatically.</p>}
      <button className="btn btn-primary" disabled={pending || !v.title.trim()} onClick={() => start(async () => {
        await createTalk({ ...v, scheduledAt: v.scheduledAt || undefined, isMedical: v.pillar === "Nutrition" });
        setV({ title: "", template: TALK_TEMPLATES[0], pillar: "Mindset", guestName: "", scheduledAt: "", externalLink: "" });
        router.refresh();
      })}><Plus size={15} /> Create talk</button>
    </div>
  );
}

export function ClipTools({ talkId }: { talkId: string }) {
  const router = useRouter();
  const [idea, setIdea] = useState("");
  const [pending, start] = useTransition();
  return (
    <div className="flex gap-2">
      <input className="input" placeholder="Clip idea (a punchy 15s moment)…" value={idea} onChange={(e) => setIdea(e.target.value)} />
      <button className="btn btn-primary" disabled={pending || !idea.trim()} onClick={() => start(async () => { await addTalkClip(talkId, idea); setIdea(""); router.refresh(); })}><Plus size={15} /> Add clip</button>
    </div>
  );
}

export function ClipToContentButton({ clipId, done }: { clipId: string; done: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  if (done) return <span className="chip"><Film size={12} /> made into a Reel</span>;
  return (
    <button className="btn text-xs" disabled={pending} onClick={() => start(async () => { await clipToContent(clipId); router.refresh(); })}>
      <Film size={13} /> Turn into a Reel task
    </button>
  );
}

export function TalkQuestionTools({ talkId }: { talkId: string }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [pending, start] = useTransition();
  return (
    <div className="flex gap-2">
      <input className="input" placeholder="Add a question for adult members to vote on…" value={text} onChange={(e) => setText(e.target.value)} />
      <button className="btn" disabled={pending || !text.trim()} onClick={() => start(async () => { await addTalkQuestion(talkId, text); setText(""); router.refresh(); })}>Add</button>
    </div>
  );
}

export function VoteButton({ id, votes }: { id: string; votes: number }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return <button className="btn btn-ghost text-xs" disabled={pending} onClick={() => start(async () => { await voteTalkQuestion(id); router.refresh(); })}>▲ {votes}</button>;
}
