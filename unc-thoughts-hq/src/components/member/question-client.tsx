"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { sendQuestionToUnc, type SendQuestionResult } from "@/lib/unk/question-actions";
import { QUESTION_TREE, WHO_OPTIONS } from "@/lib/member-shared";
import { Check, Bell, Send, LifeBuoy } from "lucide-react";

type Mine = {
  id: string; text: string; pillar: string | null; subcat: string | null;
  status: string; answerText: string | null; answeredAt: string | null; createdAt: string;
};

function b64ToU8(b64: string) {
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

// Best-effort push opt-in: returns the subscription, or null with a reason the
// UI can explain gently. Never blocks sending the question itself.
async function getPushSub(): Promise<{ sub: PushSubscriptionJSON | null; note: string | null }> {
  const pubKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !pubKey) {
    return { sub: null, note: "This browser can't do pings — on iPhone, save the app to your home screen first (Share → Add to Home Screen)." };
  }
  try {
    const reg = await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;
    const perm = await Notification.requestPermission();
    if (perm !== "granted") return { sub: null, note: "No worries — your answer will still show up right here." };
    const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToU8(pubKey) as BufferSource });
    return { sub: sub.toJSON(), note: null };
  } catch {
    return { sub: null, note: "Couldn't set up the ping on this device — your answer will still show up right here." };
  }
}

export function QuestionClient({ prefill, mine }: { prefill: string; mine: Mine[] }) {
  const router = useRouter();
  const [pillar, setPillar] = useState<string | null>(null);
  const [subcat, setSubcat] = useState<string | null>(null);
  const [who, setWho] = useState<string | null>(null);
  const [text, setText] = useState(prefill);
  const [askedBy, setAskedBy] = useState("");
  const [notify, setNotify] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [escalation, setEscalation] = useState<{ headline: string; body: string[] } | null>(null);
  const [pending, start] = useTransition();

  function send() {
    setErr(null); setEscalation(null);
    start(async () => {
      let pushSub: { endpoint: string; keys: { p256dh: string; auth: string } } | null = null;
      if (notify) {
        const { sub, note: n } = await getPushSub();
        setNote(n);
        if (sub?.endpoint && sub.keys?.p256dh && sub.keys?.auth) {
          pushSub = { endpoint: sub.endpoint, keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth } };
        }
      }
      let r: SendQuestionResult;
      try {
        r = await sendQuestionToUnc({
          question: text, pillar: pillar ?? "", subcat: subcat ?? undefined,
          who: who ?? undefined, askedBy: askedBy || undefined, notify, pushSub,
        });
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Couldn't send — try again.");
        return;
      }
      if (!r.ok) {
        if ("escalated" in r && r.escalated) setEscalation({ headline: r.headline, body: r.body });
        else if ("error" in r) setErr(r.error);
        return;
      }
      setSent(true);
      router.refresh();
    });
  }

  const subcats = pillar ? QUESTION_TREE[pillar].subcats : [];

  return (
    <div className="space-y-5">
      {escalation ? (
        <div className="card p-4 space-y-2 border border-accent-soft/40">
          <div className="flex items-center gap-2 font-medium"><LifeBuoy size={16} /> {escalation.headline}</div>
          {escalation.body.map((b, i) => <p key={i} className="text-sm text-grey">{b}</p>)}
          <p className="text-xs text-grey">This one's bigger than a Q&amp;A inbox — the people above are the right hands for it. UNC's corner is always open for the basketball stuff.</p>
          <button className="btn text-xs" onClick={() => setEscalation(null)}>Back</button>
        </div>
      ) : sent ? (
        <div className="card p-4 space-y-2">
          <div className="flex items-center gap-2 text-good font-medium"><Check size={16} /> Sent straight to UNC.</div>
          <p className="text-sm text-grey">
            He reads every one. The answer lands below on this page{notify ? " — and this phone gets a ping" : ""}.
            If it&apos;s a question that helps everyone, it also teaches Unk&apos;s brain — always anonymously.
          </p>
          {note && <p className="text-xs text-grey">{note}</p>}
          <button className="btn text-xs" onClick={() => { setSent(false); setText(""); setSubcat(null); setWho(null); }}>Ask another</button>
        </div>
      ) : (
        <div className="card p-4 space-y-4">
          {/* Layer 1: pillar */}
          <div className="space-y-2">
            <span className="label">What&apos;s it about?</span>
            <div className="flex gap-2">
              {Object.entries(QUESTION_TREE).map(([p, cfg]) => (
                <button key={p} type="button" className={`btn flex-1 ${pillar === p ? "btn-primary" : ""}`}
                  onClick={() => { setPillar(p); setSubcat(null); }}>
                  {cfg.icon} {p}
                </button>
              ))}
            </div>
          </div>

          {/* Layer 2: subcategory */}
          {pillar && (
            <div className="space-y-2">
              <span className="label">Narrow it down</span>
              <div className="flex flex-wrap gap-2">
                {subcats.map((s) => (
                  <button key={s} type="button" className={`chip ${subcat === s ? "btn-primary" : ""}`} onClick={() => setSubcat(subcat === s ? null : s)}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Layer 3: optional */}
          {pillar && (
            <div className="space-y-2">
              <span className="label">Who&apos;s asking? (optional)</span>
              <div className="flex flex-wrap gap-2">
                {WHO_OPTIONS.map((w) => (
                  <button key={w} type="button" className={`chip ${who === w ? "btn-primary" : ""}`} onClick={() => setWho(who === w ? null : w)}>
                    {w}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="label" htmlFor="qtext">Your question</label>
            <textarea id="qtext" className="input text-sm" rows={4} maxLength={500}
              placeholder="Ask it how you'd say it. No personal details needed — no full names, school or address."
              value={text} onChange={(e) => setText(e.target.value)} />
          </div>

          <div className="space-y-2">
            <label className="label" htmlFor="qname">Name or IG handle (optional — anonymous is fine)</label>
            <input id="qname" className="input text-sm" maxLength={60} placeholder="Leave blank to stay anonymous"
              value={askedBy} onChange={(e) => setAskedBy(e.target.value)} />
          </div>

          <label className="flex items-start gap-2 text-sm text-grey cursor-pointer">
            <input type="checkbox" className="mt-0.5" checked={notify} onChange={(e) => setNotify(e.target.checked)} />
            <span><Bell size={13} className="inline mr-1" />Ping this phone when UNC answers. No account needed — this device is your ticket.</span>
          </label>

          {err && <p className="text-sm text-accent-soft">{err}</p>}
          <button className="btn btn-primary w-full" onClick={send} disabled={pending || !pillar || text.trim().length < 5}>
            <Send size={14} /> {pending ? "Sending…" : "Send it to UNC"}
          </button>
        </div>
      )}

      {/* Your questions + answers */}
      {mine.length > 0 && (
        <div className="space-y-2">
          <span className="label">Your questions</span>
          {mine.map((q) => (
            <div key={q.id} className="card p-4 space-y-2">
              <p className="text-sm">{q.text}</p>
              <div className="flex flex-wrap gap-1.5 text-[11px] text-grey">
                {q.pillar && <span className="chip pointer-events-none">{QUESTION_TREE[q.pillar]?.icon} {q.pillar}</span>}
                {q.subcat && <span className="chip pointer-events-none">{q.subcat}</span>}
                <span className={`chip pointer-events-none ${q.status === "answered" ? "text-good" : ""}`}>
                  {q.status === "answered" ? "✓ answered" : q.status === "open" ? "with UNC" : q.status}
                </span>
              </div>
              {q.answerText && (
                <div className="rounded-lg bg-ink-soft border border-ink-line2 p-3">
                  <p className="text-[11px] text-grey mb-1">UNC says:</p>
                  <p className="text-sm whitespace-pre-wrap">{q.answerText}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
