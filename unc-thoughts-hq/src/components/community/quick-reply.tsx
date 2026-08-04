"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { replyToQuestion } from "@/lib/unk/actions";
import { Reply, Check } from "lucide-react";

// Owner's cover for out-of-lane questions: one tap drops the honest
// "I'm not a professional" reply, pointed at the RIGHT professional, editable
// before sending. The right pro depends on the question's pillar.
function proTemplate(pillar?: string | null): string {
  const pro =
    pillar === "Nutrition"
      ? "your GP or an Accredited Sports Dietitian — especially with allergies or anything medical in the mix"
      : pillar === "Mindset"
        ? "a psychologist or counsellor. If you're under 25, Kids Helpline is free, 24/7: 1800 55 1800"
        : pillar === "Basketball"
          ? "a qualified coach or physio who can actually see you play"
          : "a qualified professional";
  return `Real talk: I'm not a professional — just a man sharing what lived experience taught him. This one deserves better than my opinion, so please take it to ${pro}. What I can tell you in general: stick to what's familiar, look after the basics (food, sleep, water, warm-up), and never push through something that feels wrong. Sort it with the pros first — the game will wait for you. 🤝`;
}

// One box, one tap: the answer teaches UNC forever, closes the question, and
// (optionally) drops a ready-to-post answer into the bank.
export function QuickReply({ questionId, pillar }: { questionId: string; pillar?: string | null }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [alsoPost, setAlsoPost] = useState(true);
  const [done, setDone] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (done) return <p className="text-sm text-good flex items-center gap-1.5 mt-2"><Check size={14} /> {done}</p>;
  if (!open) return <button className="btn text-xs" onClick={() => setOpen(true)}><Reply size={13} /> Reply</button>;

  return (
    <div className="mt-2 w-full space-y-2">
      {err && <p className="text-xs text-accent-soft">{err}</p>}
      <button type="button" className="btn btn-ghost text-[11px]" onClick={() => setText(proTemplate(pillar))}>
        🩺 Not my lane → insert &quot;see a professional&quot; reply (edit before sending)
      </button>
      <textarea
        className="input text-sm"
        rows={3}
        autoFocus
        placeholder="Your straight answer — short, honest, uncle voice…"
        value={text}
        onChange={(e) => setText(e.target.value)}
        aria-label="Your reply"
      />
      <label className="flex items-center gap-2 text-xs text-grey">
        <input type="checkbox" checked={alsoPost} onChange={(e) => setAlsoPost(e.target.checked)} />
        Also drop it in the Post Bank as a Ready text post
      </label>
      <div className="flex gap-2">
        <button
          className="btn btn-primary text-sm"
          disabled={pending || !text.trim()}
          onClick={() => start(async () => {
            try {
              const r = await replyToQuestion(questionId, text, alsoPost);
              const bits = ["UNC knows the answer now"];
              if (r.postId) bits.push("it's in your Post Bank");
              if (r.pinged > 0) bits.push("the asker's phone got the ping");
              setDone(`Done — ${bits.join(", ")}.`);
              router.refresh();
            } catch (e) { setErr(e instanceof Error ? e.message : "Failed"); }
          })}
        >
          {pending ? "Saving…" : "Send it"}
        </button>
        <button className="btn btn-ghost text-sm" onClick={() => setOpen(false)}>Cancel</button>
      </div>
    </div>
  );
}
