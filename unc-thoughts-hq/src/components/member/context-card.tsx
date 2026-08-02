"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateMemberContext } from "@/lib/unk/actions";
import { AGE_BANDS } from "@/lib/member-shared";

// Minimal context, all optional. Age BAND (never a birth date), allergies,
// diet notes. Nothing else — no weight, no measurements, no school, no location.
export function ContextCard({ ageBand, allergies }: { ageBand: string | null; allergies: string | null }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [band, setBand] = useState(ageBand ?? "");
  const [alg, setAlg] = useState(allergies ?? "");
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(false);

  if (!open) {
    return (
      <button className="w-full text-left card p-3 hover:bg-ink-soft transition-colors" onClick={() => setOpen(true)}>
        <span className="text-sm text-paper-dim">
          {ageBand ? `Age band: ${AGE_BANDS.find((a) => a.key === ageBand)?.label ?? ageBand}` : "Tell Unk the basics (optional, 10 seconds)"}
          {allergies ? ` · allergies noted` : ""}
        </span>
        <span className="block text-[11px] text-grey mt-0.5">Only an age band and optional allergies — never your birth date, weight, school or location.</span>
      </button>
    );
  }

  return (
    <div className="card p-4 space-y-3">
      <div>
        <span className="label">Age band</span>
        <div className="flex flex-wrap gap-1.5">
          {AGE_BANDS.map((a) => (
            <button key={a.key} type="button" onClick={() => setBand(a.key)} className={`chip hover:text-paper ${band === a.key ? "border-paper/60 text-paper" : ""}`}>
              {a.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="label" htmlFor="alg">Allergies or restrictions (optional)</label>
        <input id="alg" className="input" placeholder="e.g. peanuts; lactose" value={alg} onChange={(e) => setAlg(e.target.value)} />
      </div>
      <div className="flex gap-2 items-center">
        <button className="btn btn-primary text-sm" disabled={pending} onClick={() => start(async () => {
          await updateMemberContext({ ageBand: band || null, allergies: alg || null });
          setSaved(true); setOpen(false); router.refresh();
        })}>Save</button>
        <button className="btn btn-ghost text-sm" onClick={() => setOpen(false)}>Close</button>
        {saved && <span className="text-xs text-good">Saved.</span>}
      </div>
    </div>
  );
}
