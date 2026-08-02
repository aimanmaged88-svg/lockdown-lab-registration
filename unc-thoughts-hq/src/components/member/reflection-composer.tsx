"use client";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveReflection } from "@/lib/unk/actions";
import { Mic, Square, Check } from "lucide-react";
import { cn } from "@/lib/cn";

// Private-first reflection composer. Options, all optional:
// think only (nothing saved) · type a private answer · record a private voice
// note · pick one action · set a reminder. Sharing is a SEPARATE flow later.
export function ReflectionComposer({
  promptText,
  actions = [],
  compact,
}: {
  promptText: string;
  actions?: string[];
  compact?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(!compact);
  const [text, setText] = useState("");
  const [action, setAction] = useState("");
  const [reminder, setReminder] = useState(false);
  const [voice, setVoice] = useState<string | null>(null); // data URL
  const [recording, setRecording] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  async function toggleRecord() {
    if (recording) {
      recRef.current?.stop();
      setRecording(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const reader = new FileReader();
        reader.onload = () => setVoice(String(reader.result));
        reader.readAsDataURL(blob);
      };
      rec.start();
      recRef.current = rec;
      setRecording(true);
    } catch {
      setErr("Microphone unavailable — type your answer instead.");
    }
  }

  function save() {
    setErr(null);
    start(async () => {
      try {
        const reminderAt = reminder ? new Date(Date.now() + 24 * 3600_000).toISOString() : undefined;
        await saveReflection({ promptText, answer: text || undefined, voiceBase64: voice ?? undefined, actionChosen: action || undefined, reminderAt });
        setDone("Saved — private to you. Find it under My answers.");
        setText(""); setVoice(null); setAction(""); setReminder(false);
        router.refresh();
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Could not save");
      }
    });
  }

  if (done) return <p className="text-xs text-good mt-2 flex items-center gap-1"><Check size={13} /> {done}</p>;

  if (!open) {
    return (
      <div className="mt-2 flex flex-wrap gap-2">
        <button className="btn text-xs" onClick={() => setOpen(true)}>Write a private answer</button>
        <button className="btn btn-ghost text-xs" onClick={() => setDone("Good. Nothing was saved.")}>I&apos;ve thought about it — save nothing</button>
      </div>
    );
  }

  return (
    <div className="mt-3 space-y-2">
      {err && <p className="text-xs text-accent-soft">{err}</p>}
      <textarea
        className="input text-sm"
        rows={3}
        placeholder="Private — only you can read this."
        value={text}
        onChange={(e) => setText(e.target.value)}
        aria-label="Private answer"
      />
      <div className="flex flex-wrap items-center gap-2">
        <button className={cn("btn text-xs", recording && "btn-danger")} onClick={toggleRecord} type="button">
          {recording ? <><Square size={13} /> Stop</> : <><Mic size={13} /> {voice ? "Re-record voice note" : "Record a private voice note"}</>}
        </button>
        {voice && !recording && <audio controls src={voice} className="h-8" />}
      </div>
      {actions.length > 0 && (
        <div>
          <div className="text-xs text-grey mb-1">Pick one action (optional):</div>
          <div className="flex flex-wrap gap-1.5">
            {actions.map((a) => (
              <button key={a} type="button" onClick={() => setAction(action === a ? "" : a)} className={cn("chip hover:text-paper text-left", action === a && "border-paper/60 text-paper")}>
                {a}
              </button>
            ))}
          </div>
        </div>
      )}
      <input className="input text-sm" placeholder="Or write your own one action (optional)" value={actions.includes(action) ? "" : action} onChange={(e) => setAction(e.target.value)} aria-label="Your own action" />
      <label className="flex items-center gap-2 text-xs text-grey">
        <input type="checkbox" checked={reminder} onChange={(e) => setReminder(e.target.checked)} />
        Ask me tomorrow whether I followed through (shows next time you open this — no notifications)
      </label>
      <div className="flex flex-wrap gap-2">
        <button className="btn btn-primary text-sm" onClick={save} disabled={pending}>{pending ? "Saving…" : "Save privately"}</button>
        <button className="btn btn-ghost text-xs" onClick={() => setDone("Good. Nothing was saved.")}>Thought about it — save nothing</button>
      </div>
      <p className="text-[11px] text-grey">Private by default. Stored encrypted. Never shared unless you choose to share it later, and never used to train AI.</p>
    </div>
  );
}
