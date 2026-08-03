"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { huddlePost, type HuddleFeedItem, type HuddlePostResult } from "@/lib/huddle-actions";
import { HUDDLE_TOPICS } from "@/lib/member-shared";
import { Check, Clock, LifeBuoy, MessageCircle, Send } from "lucide-react";

const TOPIC_ICON: Record<string, string> = { Basketball: "🏀", Nutrition: "🍎", Mindset: "🧠", General: "💬" };

function ago(iso: string) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 90) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export function HuddleClient({ feed }: { feed: HuddleFeedItem[] }) {
  const router = useRouter();
  const [topic, setTopic] = useState<string>("All");
  const [body, setBody] = useState("");
  const [name, setName] = useState("");
  const [postTopic, setPostTopic] = useState<string>("Basketball");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [sentNote, setSentNote] = useState(false);
  const [escalation, setEscalation] = useState<{ headline: string; body: string[] } | null>(null);
  const [pending, start] = useTransition();

  function handle(r: HuddlePostResult) {
    if (!r.ok) {
      if ("escalated" in r && r.escalated) setEscalation({ headline: r.headline, body: r.body });
      else if ("error" in r) setErr(r.error);
      return false;
    }
    return true;
  }

  function post() {
    setErr(null);
    start(async () => {
      const r = await huddlePost({ topic: postTopic, body, name: name || undefined });
      if (handle(r)) { setBody(""); setSentNote(true); router.refresh(); }
    });
  }

  function reply(parentId: string) {
    setErr(null);
    const parent = feed.find((f) => f.id === parentId);
    start(async () => {
      const r = await huddlePost({ topic: parent?.topic ?? "General", body: replyBody, name: name || undefined, parentId });
      if (handle(r)) { setReplyBody(""); setReplyTo(null); setSentNote(true); router.refresh(); }
    });
  }

  const shown = feed.filter((f) => topic === "All" || f.topic === topic);

  return (
    <div className="space-y-4">
      {escalation && (
        <div className="card p-4 space-y-2 border border-accent-soft/40">
          <div className="flex items-center gap-2 font-medium"><LifeBuoy size={16} /> {escalation.headline}</div>
          {escalation.body.map((b, i) => <p key={i} className="text-sm text-grey">{b}</p>)}
          <button className="btn text-xs" onClick={() => setEscalation(null)}>Back</button>
        </div>
      )}

      {/* Composer */}
      <div className="card p-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          {HUDDLE_TOPICS.map((t) => (
            <button key={t} type="button" className={`chip ${postTopic === t ? "btn-primary" : ""}`} onClick={() => setPostTopic(t)}>
              {TOPIC_ICON[t]} {t}
            </button>
          ))}
        </div>
        <textarea
          className="input text-sm" rows={3} maxLength={600}
          placeholder="Drop it in the huddle — a win, a question for the group, something you learned…"
          value={body} onChange={(e) => setBody(e.target.value)} aria-label="Your post"
        />
        <div className="flex gap-2">
          <input className="input text-sm flex-1" maxLength={40} placeholder="Name (optional — you'll show as Hooper)"
            value={name} onChange={(e) => setName(e.target.value)} aria-label="Display name" />
          <button className="btn btn-primary" onClick={post} disabled={pending || body.trim().length < 2}>
            <Send size={14} /> Post
          </button>
        </div>
        {err && <p className="text-sm text-accent-soft">{err}</p>}
        <p className="text-[11px] text-grey flex items-center gap-1.5">
          <Check size={12} /> UNC verifies every post before the community sees it.
        </p>
        {sentNote && <p className="text-xs text-good">Sent to UNC for the tick — it&apos;ll appear once he&apos;s checked it.</p>}
      </div>

      {/* Topic filter */}
      <div className="flex flex-wrap gap-2">
        {["All", ...HUDDLE_TOPICS].map((t) => (
          <button key={t} className={`chip ${topic === t ? "btn-primary" : ""}`} onClick={() => setTopic(t)}>
            {t === "All" ? "All" : `${TOPIC_ICON[t]} ${t}`}
          </button>
        ))}
      </div>

      {/* Feed */}
      {shown.length === 0 && (
        <p className="text-sm text-grey py-4">Nothing in this huddle yet — be the first voice in it.</p>
      )}
      {shown.map((p) => (
        <div key={p.id} className={`card p-4 space-y-2 ${p.pending ? "opacity-80 border-warn/40" : ""}`}>
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-grey">
            <span className="font-medium text-paper-dim">{p.name}{p.mine ? " (you)" : ""}</span>
            <span className="chip pointer-events-none">{TOPIC_ICON[p.topic]} {p.topic}</span>
            <span>{ago(p.createdAt)}</span>
            {p.pending && <span className="chip pointer-events-none text-warn border-warn/50"><Clock size={10} className="inline mr-0.5" />with UNC for the tick</span>}
          </div>
          <p className="text-sm whitespace-pre-wrap">{p.body}</p>

          {p.replies.map((r) => (
            <div key={r.id} className={`ml-4 pl-3 border-l border-ink-line2 space-y-1 ${r.pending ? "opacity-80" : ""}`}>
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-grey">
                <span className="font-medium text-paper-dim">{r.name}{r.mine ? " (you)" : ""}</span>
                <span>{ago(r.createdAt)}</span>
                {r.pending && <span className="text-warn"><Clock size={10} className="inline mr-0.5" />with UNC</span>}
              </div>
              <p className="text-sm whitespace-pre-wrap">{r.body}</p>
            </div>
          ))}

          {!p.pending && (
            replyTo === p.id ? (
              <div className="flex gap-2 pt-1">
                <input className="input text-sm flex-1" maxLength={600} autoFocus placeholder="Your reply…"
                  value={replyBody} onChange={(e) => setReplyBody(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && replyBody.trim().length >= 2) reply(p.id); }}
                  aria-label="Your reply" />
                <button className="btn text-xs" onClick={() => reply(p.id)} disabled={pending || replyBody.trim().length < 2}>Send</button>
                <button className="btn btn-ghost text-xs" onClick={() => setReplyTo(null)}>✕</button>
              </div>
            ) : (
              <button className="btn btn-ghost text-xs" onClick={() => { setReplyTo(p.id); setReplyBody(""); }}>
                <MessageCircle size={13} /> Reply
              </button>
            )
          )}
        </div>
      ))}
    </div>
  );
}
