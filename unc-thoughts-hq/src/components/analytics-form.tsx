"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addAnalytics, saveScreenshot } from "@/lib/actions";
import { Upload } from "lucide-react";

const FIELDS: { key: string; label: string }[] = [
  { key: "views", label: "Views" },
  { key: "reach", label: "Reach (accounts)" },
  { key: "plays", label: "Plays" },
  { key: "avgWatchSec", label: "Avg watch (s)" },
  { key: "reelSeconds", label: "Reel length (s)" },
  { key: "completionPct", label: "Completion %" },
  { key: "likes", label: "Likes" },
  { key: "comments", label: "Comments" },
  { key: "saves", label: "Saves" },
  { key: "shares", label: "Shares" },
  { key: "profileVisits", label: "Profile visits" },
  { key: "follows", label: "Follows" },
  { key: "storyShares", label: "Story shares" },
];

export function AnalyticsForm({ contentId, contentTitle }: { contentId: string; contentTitle: string }) {
  const router = useRouter();
  const [win, setWin] = useState<"24h" | "7d" | "30d">("24h");
  const [vals, setVals] = useState<Record<string, string>>({});
  const [trial, setTrial] = useState(false);
  const [sharedToAll, setSharedToAll] = useState(false);
  const [shot, setShot] = useState<{ preview: string; path?: string } | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = String(reader.result);
      setShot({ preview: dataUrl });
      setConfirmed(false);
      // Preserve the original screenshot server-side. Values are NOT auto-filled —
      // read them off the image and confirm. We never save guessed figures.
      try {
        const path = await saveScreenshot(dataUrl, file.name);
        setShot({ preview: dataUrl, path });
      } catch { /* keep preview even if save fails */ }
    };
    reader.readAsDataURL(file);
  }

  function submit() {
    setMsg(null);
    if (shot && !confirmed) { setMsg("Confirm the values from the screenshot before saving."); return; }
    const payload: Record<string, unknown> = { contentId, window: win, wasTrialReel: trial, sharedToAll };
    for (const f of FIELDS) if (vals[f.key] !== undefined && vals[f.key] !== "") payload[f.key] = vals[f.key];
    if (shot?.path) { payload.source = "screenshot_ocr"; payload.screenshotPath = shot.path; }
    payload.confirmed = true;
    start(async () => {
      try {
        await addAnalytics(payload);
        setMsg("Saved.");
        setVals({});
        setShot(null);
        router.refresh();
      } catch (e) {
        setMsg(e instanceof Error ? e.message : "Could not save");
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-grey">Recording for <span className="text-paper">{contentTitle}</span></div>

      <div className="flex gap-2">
        {(["24h", "7d", "30d"] as const).map((w) => (
          <button key={w} onClick={() => setWin(w)} className={`btn flex-1 ${win === w ? "btn-primary" : ""}`}>{w}</button>
        ))}
      </div>

      {/* Screenshot upload */}
      <div className="card p-3">
        <label className="btn cursor-pointer">
          <Upload size={15} /> Upload analytics screenshot
          <input type="file" accept="image/*" className="hidden" onChange={onFile} />
        </label>
        {shot && (
          <div className="mt-3 space-y-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={shot.preview} alt="Analytics screenshot" className="max-h-64 rounded-lg border border-ink-line" />
            <p className="text-xs text-grey">Type the figures you can see below, then tick to confirm. The original is preserved; nothing is guessed for you.</p>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
              I confirm the values below match the screenshot
            </label>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {FIELDS.map((f) => (
          <div key={f.key}>
            <label className="label" htmlFor={f.key}>{f.label}</label>
            <input id={f.key} type="number" step="any" className="input" value={vals[f.key] ?? ""} onChange={(e) => setVals((s) => ({ ...s, [f.key]: e.target.value }))} />
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-4 text-sm">
        <label className="flex items-center gap-2"><input type="checkbox" checked={trial} onChange={(e) => setTrial(e.target.checked)} /> This was a Trial Reel</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={sharedToAll} onChange={(e) => setSharedToAll(e.target.checked)} /> Later shared to everyone</label>
      </div>

      <div className="flex items-center gap-3">
        <button className="btn btn-primary" onClick={submit} disabled={pending}>{pending ? "Saving…" : "Save snapshot"}</button>
        {msg && <span className="text-sm text-grey">{msg}</span>}
      </div>
    </div>
  );
}
