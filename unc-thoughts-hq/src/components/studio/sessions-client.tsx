"use client";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, Section, Badge, Empty } from "@/components/ui";
import { sessionAdd, sessionSetSeats, sessionSetStatus, sessionDelete } from "@/lib/studio-actions";
import { Calculator, Plus, Minus, Check, Trash2, Undo2, ChevronDown } from "lucide-react";
import { PayLineCard, SeatPanel, type Seat, type Listing } from "./live-desk";

type S = {
  id: string; title: string; topic: string | null; date: string | null;
  pricePerSeat: number; capacity: number; seatsSold: number; status: string;
  listed: boolean; timeText: string | null; blurb: string | null; ageBand: string | null; joinUrl: string | null;
  seats: Seat[];
};
const money = (n: number) => "$" + Math.round(n).toLocaleString("en-AU");
const TOPICS = ["Mindset", "Defence", "Nutrition", "Basketball IQ", "Other"];

export function SessionsClient({ sessions, payLine }: { sessions: S[]; payLine: string }) {
  return (
    <div className="space-y-8">
      <Tracker sessions={sessions} />
      <PayLineCard value={payLine} />
      <MoneyCalc />
    </div>
  );
}

// ── What a run makes ────────────────────────────────────────────────────────
function MoneyCalc() {
  const [price, setPrice] = useState(10);
  const [seats, setSeats] = useState(15);
  const [spw, setSpw] = useState(1);

  const perSession = price * seats;
  const perWeek = perSession * spw;
  const tiles = [
    ["Per session", perSession],
    ["Per week", perWeek],
    ["Per month", perWeek * 4],
    ["Per year", perWeek * 52],
  ] as const;
  const scenarios = useMemo(() => {
    const marks = Array.from(new Set([5, 10, 15, 20].filter((n) => true))).sort((a, b) => a - b);
    return marks.map((n) => ({ n, per: price * n, month: price * n * spw * 4 }));
  }, [price, spw]);

  return (
    <Section title="What a run makes" desc="Play with the numbers — it updates live. AUD.">
      <Card>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Field label="Price per seat" prefix="$" value={price} set={setPrice} min={0} max={100000} />
          <Field label="Seats per session" value={seats} set={setSeats} min={1} max={500} />
          <Field label="Sessions per week" value={spw} set={setSpw} min={1} max={40} />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          {tiles.map(([label, val]) => (
            <div key={label} className="rounded-xl bg-ink-soft border border-ink-line2 p-3">
              <div className="text-[11px] text-grey">{label}</div>
              <div className="text-2xl font-semibold mt-0.5 flex items-center gap-1.5"><Calculator size={15} className="text-grey" />{money(val)}</div>
            </div>
          ))}
        </div>

        <div className="mt-5">
          <div className="eyebrow mb-2">Fill the seats — at {money(price)} a head</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {scenarios.map((s) => (
              <div key={s.n} className="rounded-lg bg-ink-soft border border-ink-line2 p-3">
                <div className="text-sm font-medium">{s.n} people</div>
                <div className="text-lg font-semibold mt-0.5">{money(s.per)}<span className="text-[11px] text-grey font-normal"> / session</span></div>
                <div className="text-[11px] text-grey">{money(s.month)} / month</div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </Section>
  );
}

function Field({ label, value, set, min, max, prefix }: { label: string; value: number; set: (n: number) => void; min: number; max: number; prefix?: string }) {
  return (
    <label className="block">
      <span className="text-[11px] text-grey">{label}</span>
      <div className="flex items-center gap-1 mt-1">
        {prefix && <span className="text-grey">{prefix}</span>}
        <input
          type="number" inputMode="numeric" className="input" value={value} min={min} max={max}
          onChange={(e) => set(Math.min(max, Math.max(min, Math.round(Number(e.target.value) || 0))))}
        />
      </div>
    </label>
  );
}

// ── Session tracker ─────────────────────────────────────────────────────────
function Tracker({ sessions }: { sessions: S[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(sessions.length === 0);
  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState("Mindset");
  const [date, setDate] = useState("");
  const [price, setPrice] = useState(10);
  const [capacity, setCapacity] = useState(20);
  const [err, setErr] = useState<string | null>(null);

  const act = (fn: () => Promise<void>) => start(async () => { try { setErr(null); await fn(); router.refresh(); } catch (e) { setErr(e instanceof Error ? e.message : "Failed"); } });

  const upcoming = sessions.filter((s) => s.status === "planned");
  const done = sessions.filter((s) => s.status === "done");

  return (
    <Section
      title="Your sessions"
      desc="Log each one, tap seats as they sell, tick it done when it's run."
      action={<button className="btn text-sm" onClick={() => setOpen((v) => !v)}><Plus size={14} /> New session</button>}
    >
      {err && <p className="text-xs text-accent-soft mb-2">{err}</p>}

      {open && (
        <Card className="mb-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block sm:col-span-2"><span className="text-[11px] text-grey">Session name</span>
              <input className="input mt-1" placeholder="UNC LIVE — Mindset" value={title} onChange={(e) => setTitle(e.target.value)} /></label>
            <label className="block"><span className="text-[11px] text-grey">Topic</span>
              <select className="input mt-1" value={topic} onChange={(e) => setTopic(e.target.value)}>{TOPICS.map((t) => <option key={t}>{t}</option>)}</select></label>
            <label className="block"><span className="text-[11px] text-grey">Date</span>
              <input type="date" className="input mt-1" value={date} onChange={(e) => setDate(e.target.value)} /></label>
            <label className="block"><span className="text-[11px] text-grey">Price / seat</span>
              <input type="number" inputMode="numeric" className="input mt-1" value={price} onChange={(e) => setPrice(Math.max(0, Math.round(Number(e.target.value) || 0)))} /></label>
            <label className="block"><span className="text-[11px] text-grey">Seats (capacity)</span>
              <input type="number" inputMode="numeric" className="input mt-1" value={capacity} onChange={(e) => setCapacity(Math.max(1, Math.round(Number(e.target.value) || 1)))} /></label>
          </div>
          <div className="flex gap-2 mt-3">
            <button className="btn btn-primary text-sm" disabled={pending || !title.trim()}
              onClick={() => act(async () => { await sessionAdd({ title, topic, date: date || undefined, pricePerSeat: price, capacity }); setTitle(""); setDate(""); setOpen(false); })}>
              {pending ? "Saving…" : "Add session"}
            </button>
            <button className="btn btn-ghost text-sm" onClick={() => setOpen(false)}>Cancel</button>
          </div>
        </Card>
      )}

      {sessions.length === 0 && !open && (
        <Empty title="No sessions logged yet." hint="Add your first UNC LIVE session and the tally starts." />
      )}

      {upcoming.length > 0 && <div className="eyebrow mb-2">Upcoming</div>}
      <div className="space-y-2">
        {upcoming.map((s) => <Row key={s.id} s={s} act={act} pending={pending} />)}
      </div>

      {done.length > 0 && <div className="eyebrow mt-5 mb-2">Done</div>}
      <div className="space-y-2">
        {done.map((s) => <Row key={s.id} s={s} act={act} pending={pending} />)}
      </div>
    </Section>
  );
}

function Row({ s, act, pending }: { s: S; act: (fn: () => Promise<void>) => void; pending: boolean }) {
  const rev = s.seatsSold * s.pricePerSeat;
  const full = s.seatsSold >= s.capacity;
  const [openSeats, setOpenSeats] = useState(false);
  const waiting = s.seats.filter((b) => b.status === "held").length;
  const listing: Listing = {
    id: s.id, listed: s.listed, timeText: s.timeText, blurb: s.blurb,
    ageBand: s.ageBand, joinUrl: s.joinUrl,
  };
  return (
    <Card>
     <div className="flex flex-wrap items-center gap-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm truncate">{s.title}</span>
          {s.topic && <Badge>{s.topic}</Badge>}
          {s.listed && <Badge tone="good">live</Badge>}
          {waiting > 0 && <Badge tone="warn">{waiting} waiting on money</Badge>}
          {s.status === "done" && <Badge tone="accent">done</Badge>}
        </div>
        <div className="text-[11px] text-grey mt-0.5">
          {s.date ? new Date(s.date).toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" }) : "no date"} · {money(s.pricePerSeat)}/seat
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <button aria-label="one less seat" className="btn btn-ghost px-2" disabled={pending || s.seatsSold <= 0} onClick={() => act(() => sessionSetSeats(s.id, s.seatsSold - 1))}><Minus size={14} /></button>
        <div className="text-center">
          <div className="flex items-baseline justify-center gap-0.5">
            <input
              key={s.seatsSold}
              type="number" inputMode="numeric" aria-label="seats sold"
              className="input w-12 text-center px-1 py-1 text-sm font-semibold" defaultValue={s.seatsSold} min={0} max={s.capacity}
              onBlur={(e) => { const v = Math.min(s.capacity, Math.max(0, Math.round(Number(e.target.value) || 0))); if (v !== s.seatsSold) act(() => sessionSetSeats(s.id, v)); }}
              onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
            />
            <span className="text-grey text-sm">/{s.capacity}</span>
          </div>
          <div className="text-[10px] text-grey">seats sold</div>
        </div>
        <button aria-label="one more seat" className="btn btn-ghost px-2" disabled={pending || full} onClick={() => act(() => sessionSetSeats(s.id, s.seatsSold + 1))}><Plus size={14} /></button>
      </div>

      <div className="text-right w-20">
        <div className="text-base font-semibold">{money(rev)}</div>
        <div className="text-[10px] text-grey">{s.status === "done" ? "earned" : "booked"}</div>
      </div>

      <div className="flex items-center gap-1">
        {s.status === "planned" ? (
          <button className="btn text-xs" disabled={pending} onClick={() => act(() => sessionSetStatus(s.id, "done"))}><Check size={13} /> Done</button>
        ) : (
          <button className="btn btn-ghost text-xs" disabled={pending} onClick={() => act(() => sessionSetStatus(s.id, "planned"))}><Undo2 size={13} /> Reopen</button>
        )}
        <button aria-label="delete" className="btn btn-ghost px-2" disabled={pending} onClick={() => act(() => sessionDelete(s.id))}><Trash2 size={14} /></button>
      </div>
     </div>

      <button
        className="btn btn-ghost text-xs mt-2" aria-expanded={openSeats}
        onClick={() => setOpenSeats((v) => !v)}
      >
        <ChevronDown size={13} className={openSeats ? "rotate-180 transition-transform" : "transition-transform"} />
        {openSeats ? "Hide seats & listing" : `Seats & listing${s.seats.length ? ` (${s.seats.length})` : ""}`}
      </button>
      {openSeats && <SeatPanel listing={listing} seats={s.seats} />}
    </Card>
  );
}
