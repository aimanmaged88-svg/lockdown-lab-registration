import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CareOS · Monday Kit · For Faraz",
  description:
    "Everything Faraz needs to practise tonight and present tomorrow — one page, one password.",
};

interface KitItem {
  n: string;
  href: string;
  title: string;
  desc: string;
  meta: string;
  external?: boolean;
}

const kit: KitItem[] = [
  {
    n: "01 · Learn on the go",
    href: "/proposal/CareOS-Study-Guide.pdf",
    title: "Study Guide — every feature, in order",
    desc: "Scrollable PDF. Read on your phone through the day. The whole platform, chapter by chapter, in your voice.",
    meta: "PDF · read today · phone-friendly",
  },
  {
    n: "02 · Practice guide",
    href: "/proposal/CareOS-Practice-Tonight.pdf",
    title: "Practice Tonight — 60 min",
    desc: "Step-by-step for tonight at the kitchen table.",
    meta: "PDF · 2 pages · tonight",
  },
  {
    n: "03 · Boardroom cheat sheet",
    href: "/proposal/CareOS-FAQ-Security.pdf",
    title: "FAQ + Security Card",
    desc: "15 questions Yasser will ask + the one honest security line.",
    meta: "PDF · 3 pages · keep on phone",
  },
  {
    n: "04 · Backup video",
    href: "/proposal/watch.html",
    title: "100-second walkthrough film",
    desc: "All three tour journeys, filmed end-to-end. Backup if the live demo glitches.",
    meta: "Video · 1 min 40 sec",
  },
  {
    n: "05 · Live demo",
    href: "/dashboard/",
    title: "The full demo",
    desc: "Tap “A Day in the Life” bottom-right. Same password unlocks everything.",
    meta: "Interactive · full 26 modules",
  },
  {
    n: "06 · Slide deck",
    href: "/proposal/CareOS-Board-Presentation.pptx",
    title: "Board Presentation — 25 slides",
    desc: "Speaker notes on every slide. Follow the run-of-show.",
    meta: "PPTX · with speaker notes",
  },
  {
    n: "07 · Leave-behind",
    href: "/proposal/CareOS-Executive-Brief.pdf",
    title: "Executive Brief — 1 page",
    desc: "Print this. Hand it to Yasser at the end.",
    meta: "PDF · 1 page · print it",
  },
  {
    n: "08 · Deep-dive",
    href: "/proposal/CareOS-Feature-Brief.pdf",
    title: "Feature Brief",
    desc: "Full module inventory. Reference for follow-ups.",
    meta: "PDF · reference",
  },
  {
    n: "09 · The pitch",
    href: "/proposal/CareOS-Pitch.pdf",
    title: "CareOS Pitch",
    desc: "The story on paper. Companion to the deck.",
    meta: "PDF · narrative",
  },
];

const schedule = [
  { time: "0:00 – 0:15", label: "Teach", detail: "Slides 1–11 · you talk, he listens" },
  {
    time: "0:15 – 0:24",
    label: "Hands-on",
    detail: "Slide 12: “Let's make it real.” Point to the tour button. Parent (9 stops) · Worker (4) · CEO (4)",
  },
  {
    time: "0:24 – 0:35",
    label: "Capabilities",
    detail: "Slides 13–22 · pick 3–4 modules to walk through",
  },
  {
    time: "0:35 – 0:40",
    label: "Ask",
    detail: "Slides 23–25 · partnership, not a sale",
  },
  {
    time: "0:40+",
    label: "Q&A",
    detail: "FAQ card open on your phone · use the escape hatch if stuck",
  },
];

const lines = [
  "“I built this from lived experience. My son has autism. I've been the parent waiting by the phone. Every screen you're about to see answers a pain I've felt.”",
  "“It's not a compliance tool. It's not a rostering tool. It's one platform where a shift note becomes evidence, a photo becomes a family moment, a goal becomes an outcome.”",
  "“I'm not a security expert, and I won't pretend to be. Security is the next hire. If we go forward, we co-design it with your IT team — that's what a design partner should shape.”",
  "“I'm not asking you to buy a licence. I'm asking you to be a design partner. You have the scale. I have the lived experience. Together we build the reference case.”",
];

export default function ProposalKitPage() {
  return (
    <main className="min-h-screen bg-[#0a1229] text-[#e7edfb]">
      <div className="mx-auto max-w-4xl px-6 py-12 sm:px-8">
        <p className="text-[11px] uppercase tracking-[.14em] text-[#8fa3d0]">
          CareOS · Monday Kit · Everything in one place
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Monday, 1:00pm — Dr Yasser Zaki
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-[#a7b7dc]">
          Faraz — this is your kit. Practise tonight, present tomorrow. Password unlocks everything.
        </p>

        <section className="mt-8 rounded-2xl bg-gradient-to-br from-[#4f6bff] to-[#21c7a8] p-6 shadow-2xl">
          <p className="text-[11px] font-bold uppercase tracking-[.14em] text-white/85">Two things, in this order</p>
          <h2 className="mt-2 text-xl font-semibold text-white">
            Today: read the Study Guide. Tonight: do Practice Tonight.
          </h2>
          <p className="mt-2 text-sm text-white/90">
            Study Guide is scrollable — read on your phone between meetings today. Practice Tonight is 60 min at the kitchen table this evening.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/proposal/CareOS-Study-Guide.pdf"
              className="inline-flex items-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#0a1229]"
            >
              Study Guide — read on the go
            </Link>
            <Link
              href="/proposal/CareOS-Practice-Tonight.pdf"
              className="inline-flex items-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#0a1229]"
            >
              Practice Tonight — PDF
            </Link>
            <Link
              href="/dashboard/"
              className="inline-flex items-center rounded-full border border-white/40 bg-white/15 px-4 py-2 text-sm font-semibold text-white"
            >
              Open the live demo
            </Link>
          </div>
          <p className="mt-3 text-xs text-white/85">
            Password: <code className="rounded bg-white/20 px-2 py-0.5 font-mono">TenderLovingCare2026!</code>
          </p>
        </section>

        <h2 className="mt-10 text-xs font-semibold uppercase tracking-[.14em] text-[#8fd3c7]">
          Your kit — the whole ship
        </h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {kit.map((k) => (
            <Link
              key={k.n}
              href={k.href}
              className="block rounded-xl border border-[#22315c] bg-[#101a33] p-4 transition-colors hover:border-[#4f6bff]"
            >
              <p className="text-[10px] font-semibold uppercase tracking-[.14em] text-[#8fa3d0]">{k.n}</p>
              <p className="mt-1 text-sm font-semibold text-white">{k.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-[#a7b7dc]">{k.desc}</p>
              <p className="mt-2 text-[10px] font-semibold uppercase tracking-[.08em] text-[#8fd3c7]">{k.meta}</p>
            </Link>
          ))}
        </div>

        <h2 className="mt-10 text-xs font-semibold uppercase tracking-[.14em] text-[#8fd3c7]">
          Tomorrow's shape — 40 min + Q&amp;A
        </h2>
        <ol className="mt-3 space-y-2 rounded-xl border border-[#22315c] bg-[#101a33] p-5">
          {schedule.map((s) => (
            <li key={s.time} className="text-sm text-[#d0dcf5]">
              <span className="mr-2 font-mono text-xs text-[#8fd3c7]">{s.time}</span>
              <span className="font-semibold text-white">{s.label}</span>
              <span className="text-[#a7b7dc]"> · {s.detail}</span>
            </li>
          ))}
        </ol>

        <h2 className="mt-10 text-xs font-semibold uppercase tracking-[.14em] text-[#8fd3c7]">
          Say these lines with your chest
        </h2>
        <div className="mt-3 rounded-xl border border-[#22315c] bg-[#101a33] p-4">
          {lines.map((line, i) => (
            <blockquote
              key={i}
              className="my-3 border-l-[3px] border-[#21c7a8] pl-4 text-sm italic leading-relaxed text-[#d0dcf5]"
            >
              {line}
            </blockquote>
          ))}
        </div>

        <footer className="mt-10 flex flex-wrap justify-between gap-2 border-t border-[#22315c] pt-4 text-[11px] text-[#6f83b3]">
          <span>CareOS · Monday Kit · For Faraz</span>
          <span>Meeting: Monday 1:00pm · Dr Yasser Zaki · Tender Loving Care</span>
        </footer>
      </div>
    </main>
  );
}
