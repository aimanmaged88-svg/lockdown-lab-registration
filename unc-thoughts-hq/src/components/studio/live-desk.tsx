"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, Section, Badge } from "@/components/ui";
import { sessionSetListing, seatSetStatus, setPayLine } from "@/lib/live-actions";
import { Check, X, Radio, Wallet } from "lucide-react";

export type Seat = { id: string; name: string; contact: string; note: string | null; status: string; at: string };
export type Listing = {
  id: string; listed: boolean; timeText: string | null; blurb: string | null;
  ageBand: string | null; joinUrl: string | null;
};

const AGE_BANDS = ["All ages", "12 and under", "13-15", "16-18", "18+", "Parents & coaches"];

// The one line that decides whether the money actually turns up. Editable here
// so it can change without a deploy.
export function PayLineCard({ value }: { value: string }) {
  const router = useRouter();
  const [v, setV] = useState(value);
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  return (
    <Section
      title="How they pay you"
      desc="Shown to anyone who holds a seat. Put your PayID, bank details or a payment link here — exactly as you want it read."
    >
      <Card>
        <label className="block">
          <span className="text-[11px] text-grey flex items-center gap-1.5"><Wallet size={12} /> Payment line</span>
          <textarea
            className="input mt-1 text-sm" rows={3} maxLength={400}
            value={v} onChange={(e) => { setV(e.target.value); setSaved(false); }}
          />
        </label>
        {err && <p className="text-xs text-accent-soft mt-2">{err}</p>}
        <div className="flex items-center gap-2 mt-3">
          <button
            className="btn btn-primary text-sm" disabled={pending || !v.trim() || v === value}
            onClick={() => start(async () => {
              try { setErr(null); await setPayLine(v); setSaved(true); router.refresh(); }
              catch (e) { setErr(e instanceof Error ? e.message : "Failed"); }
            })}
          >{pending ? "Saving…" : "Save"}</button>
          {saved && <span className="text-xs text-grey flex items-center gap-1"><Check size={12} /> Saved</span>}
        </div>
      </Card>
    </Section>
  );
}

// Per-session: put it in front of members, and work the seat list.
export function SeatPanel({ listing, seats }: { listing: Listing; seats: Seat[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [time, setTime] = useState(listing.timeText ?? "");
  const [blurb, setBlurb] = useState(listing.blurb ?? "");
  const [age, setAge] = useState(listing.ageBand ?? "All ages");
  const [url, setUrl] = useState(listing.joinUrl ?? "");

  const act = (fn: () => Promise<unknown>) => start(async () => {
    try { setErr(null); await fn(); router.refresh(); }
    catch (e) { setErr(e instanceof Error ? e.message : "Failed"); }
  });

  const held = seats.filter((s) => s.status === "held");
  const paid = seats.filter((s) => s.status === "paid");

  return (
    <div className="mt-3 pt-3 border-t border-ink-line2 space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Radio size={14} className={listing.listed ? "text-accent" : "text-grey"} />
          <span className="text-sm">{listing.listed ? "Members can see this and book it" : "Hidden from members"}</span>
        </div>
        <button
          className={`btn text-xs ${listing.listed ? "btn-ghost" : "btn-primary"}`} disabled={pending}
          onClick={() => act(() => sessionSetListing(listing.id, { listed: !listing.listed, timeText: time, blurb, ageBand: age, joinUrl: url }))}
        >{listing.listed ? "Take it down" : "Put it up for booking"}</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="block"><span className="text-[11px] text-grey">Time (write it how you say it)</span>
          <input className="input mt-1 text-sm" placeholder="7:00pm — 8:00pm" maxLength={60} value={time} onChange={(e) => setTime(e.target.value)} /></label>
        <label className="block"><span className="text-[11px] text-grey">Who it&apos;s for</span>
          <select className="input mt-1 text-sm" value={age} onChange={(e) => setAge(e.target.value)}>
            {AGE_BANDS.map((a) => <option key={a}>{a}</option>)}
          </select></label>
        <label className="block sm:col-span-2"><span className="text-[11px] text-grey">What they walk away with</span>
          <input className="input mt-1 text-sm" maxLength={300} placeholder="One page of your own mindset plan you can use at your next game." value={blurb} onChange={(e) => setBlurb(e.target.value)} /></label>
        <label className="block sm:col-span-2"><span className="text-[11px] text-grey">Zoom link (kept private — you send it to paid seats)</span>
          <input className="input mt-1 text-sm" maxLength={300} placeholder="https://zoom.us/j/…" value={url} onChange={(e) => setUrl(e.target.value)} /></label>
      </div>
      <button
        className="btn text-xs" disabled={pending}
        onClick={() => act(() => sessionSetListing(listing.id, { timeText: time, blurb, ageBand: age, joinUrl: url }))}
      >{pending ? "Saving…" : "Save the details"}</button>

      {err && <p className="text-xs text-accent-soft">{err}</p>}

      <div>
        <div className="eyebrow mb-1.5">
          Seats · {paid.length} paid, {held.length} waiting on money
        </div>
        {seats.length === 0 ? (
          <p className="text-xs text-grey">No one&apos;s put their hand up yet.</p>
        ) : (
          <div className="space-y-1.5">
            {seats.map((b) => (
              <div key={b.id} className="flex items-center gap-2 flex-wrap text-sm rounded-lg border border-ink-line2 px-3 py-2">
                <span className="font-medium">{b.name}</span>
                <span className="text-[11px] text-grey">{b.contact}</span>
                {b.status === "paid" ? <Badge tone="good">paid</Badge> : <Badge tone="warn">waiting</Badge>}
                {b.note && <span className="text-[11px] text-grey basis-full">“{b.note}”</span>}
                <span className="ml-auto flex items-center gap-1">
                  {b.status !== "paid" && (
                    <button className="btn text-xs" disabled={pending} onClick={() => act(() => seatSetStatus(b.id, "paid"))}>
                      <Check size={12} /> Money landed
                    </button>
                  )}
                  <button aria-label={`remove ${b.name}`} className="btn btn-ghost px-2" disabled={pending} onClick={() => act(() => seatSetStatus(b.id, "cancelled"))}>
                    <X size={13} />
                  </button>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
