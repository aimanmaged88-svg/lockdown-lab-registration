"use client";
import { useState } from "react";
import { saveSeat } from "@/lib/live-actions";
import type { LiveSession } from "@/lib/live-shared";
import { Check, Users } from "lucide-react";

// Each session is a card. Tap "Save my seat", leave a name + a way to reach
// you, and the payment line appears — that's the whole flow.
export function LiveClient({
  sessions, payLine, mine,
}: { sessions: LiveSession[]; payLine: string; mine: { sessionId: string; status: string }[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState<Record<string, boolean>>({});

  const held = new Set(mine.map((m) => m.sessionId));
  const paidFor = new Set(mine.filter((m) => m.status === "paid").map((m) => m.sessionId));

  async function submit(sessionId: string) {
    setBusy(true); setErr(null);
    try {
      await saveSeat({ sessionId, name, contact, note });
      setDone((d) => ({ ...d, [sessionId]: true }));
      setOpenId(null);
      setNote("");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "That didn't go through. Try again.");
    } finally {
      setBusy(false);
    }
  }

  if (sessions.length === 0) {
    return (
      <div className="card p-4">
        <p className="text-sm text-paper">The next block of sessions is being locked in.</p>
        <p className="text-xs text-grey mt-1">
          Keep an eye here — dates go up as soon as they&apos;re set, and seats are capped
          on purpose so everyone gets a turn to talk.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sessions.map((s) => {
        const isIn = held.has(s.id) || done[s.id];
        const isPaid = paidFor.has(s.id);
        const open = openId === s.id;
        return (
          <div key={s.id} className="card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium">{s.title}</p>
                <p className="text-xs text-grey mt-0.5">
                  {[s.dateText, s.timeText, s.ageBand].filter(Boolean).join(" · ") || "Date to be locked in"}
                </p>
              </div>
              <p className="text-lg font-semibold shrink-0">${s.pricePerSeat}</p>
            </div>

            {s.blurb && <p className="text-sm text-grey mt-2">{s.blurb}</p>}

            <div className="flex items-center gap-2 mt-3 text-[11px] text-grey">
              <Users size={13} />
              {s.full ? "Full — no seats left" : `${s.seatsLeft} of ${s.capacity} seats left`}
            </div>

            {isIn ? (
              <div className="mt-3 rounded-lg border border-ink-line2 p-3">
                <p className="text-sm flex items-center gap-1.5">
                  <Check size={15} /> {isPaid ? "You're in — seat confirmed." : "Seat held for you."}
                </p>
                {!isPaid && <p className="text-xs text-grey mt-1.5">{payLine}</p>}
                <p className="text-xs text-grey mt-1.5">
                  {isPaid
                    ? "UNC will send the link before it starts."
                    : "UNC confirms your seat and sends the link once it lands."}
                </p>
              </div>
            ) : s.full ? (
              <p className="text-xs text-grey mt-3">This one&apos;s full. Take a seat in the next session.</p>
            ) : !open ? (
              <button className="btn btn-primary w-full mt-3" onClick={() => { setOpenId(s.id); setErr(null); }}>
                Save my seat
              </button>
            ) : (
              <div className="mt-3 space-y-2">
                <div>
                  <label className="label" htmlFor={`n-${s.id}`}>Your name</label>
                  <input id={`n-${s.id}`} className="input text-sm" maxLength={60}
                    value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div>
                  <label className="label" htmlFor={`c-${s.id}`}>Phone, email or Instagram</label>
                  <input id={`c-${s.id}`} className="input text-sm" maxLength={90}
                    placeholder="So UNC can send you the link"
                    value={contact} onChange={(e) => setContact(e.target.value)} />
                </div>
                <div>
                  <label className="label" htmlFor={`q-${s.id}`}>Anything you want covered? (optional)</label>
                  <input id={`q-${s.id}`} className="input text-sm" maxLength={300}
                    value={note} onChange={(e) => setNote(e.target.value)} />
                </div>
                {err && <p className="text-xs text-warn">{err}</p>}
                <div className="flex gap-2">
                  <button className="btn btn-primary flex-1" disabled={busy} onClick={() => submit(s.id)}>
                    {busy ? "Holding it…" : "Hold my seat"}
                  </button>
                  <button className="btn" onClick={() => setOpenId(null)}>Cancel</button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
