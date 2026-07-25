"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, CheckCircle2, HeartHandshake, LineChart, Play, Users, X } from "lucide-react";
import { useRole } from "@/providers/role-provider";
import type { Role } from "@/types";
import { cn } from "@/lib/utils";

/**
 * A Day in the Life — a tiny guided-tour layer for boardroom demos.
 *
 * One floating button. Three short journeys (parent, support worker, CEO).
 * Each stop navigates to a real screen and explains WHY it matters, so a
 * first-time viewer can drive the demo themselves. No overlay walls, no
 * overhaul — just a quiet coach card in the corner.
 */

interface TourStop {
  href: string;
  title: string;
  /** The pain this screen ends — the "before CareOS" life. Optional. */
  pain?: string;
  why: string;
}

interface Journey {
  id: string;
  label: string;
  person: string;
  role: Role;
  icon: React.ComponentType<{ className?: string }>;
  stops: TourStop[];
}

const journeys: Journey[] = [
  {
    id: "parent",
    label: "A parent's story",
    person: "as Faraz — Zayd & Idris's dad",
    role: "parent",
    icon: HeartHandshake,
    stops: [
      {
        href: "/family",
        title: "7:52am — is anyone even there?",
        pain: "You used to wait by the phone, wondering if support had actually shown up today.",
        why: "“Leila has arrived — 8:26am.” The second support begins, you know. Every day, without asking.",
      },
      {
        href: "/family",
        title: "How was his day — really?",
        pain: "You asked your child questions they couldn't answer, and heard nothing from the workers. Years of wondering.",
        why: "Wins first, in plain language, updated through the day — photos and moments as they happen, not a report at pickup. Scroll down: it's all here.",
      },
      {
        href: "/family",
        title: "One truth, a door for every parent",
        pain: "When parents live apart — or things aren't civil — one parent is always out of the loop, and the child becomes the messenger.",
        why: "See “Family access”: every parent has their own private login to the same truth. Nobody waits on anybody. Nothing is filtered through anyone.",
      },
      {
        href: "/timeline",
        title: "Nothing gets lost anymore",
        pain: "His story used to live in strangers' heads — and left every time a worker resigned.",
        why: "Every shift, every win, every setback becomes part of one continuous story that belongs to him.",
      },
      {
        href: "/budgets",
        title: "Where did the plan money go?",
        pain: "Funds ran out mid-plan with no warning, and nobody could tell you where they went.",
        why: "The same budget truth the provider sees — plain language, live, shortfalls flagged months early with a fix.",
      },
      {
        href: "/review-ready",
        title: "Never walk in unarmed again",
        pain: "Funding got cut because you couldn't prove on paper what you live every single day.",
        why: "1,240 evidence items, auto-filed. A language guard stops one careless sentence costing him support.",
      },
      {
        href: "/learning",
        title: "Answers at midnight",
        pain: "2am Googling, alone, hoping a stranger's forum post applied to your child.",
        why: "Learning built around his diagnosis, his communication, his life — answers from people who actually know.",
      },
      {
        href: "/support-circle",
        title: "You're not doing this alone",
        pain: "Every question felt like a battle you had to fight solo.",
        why: "A circle of qualified people around your child, answering fast — with the office and 000 always one tap away.",
      },
      {
        href: "/timeline",
        title: "Three years from now",
        pain: "Most families end up with fragments — a few photos, half-remembered advice, restarted folders.",
        why: "Three years in, this timeline holds thousands of moments: what worked, what changed, who helped. The longer it runs, the better everyone knows your child. That's the promise.",
      },
    ],
  },
  {
    id: "worker",
    label: "A worker's shift",
    person: "as Grace — senior support worker",
    role: "support-worker",
    icon: Users,
    stops: [
      { href: "/dashboard", title: "A calm start", why: "Who you're with and what matters today — before you walk in." },
      { href: "/shift", title: "The two-minute briefing", why: "Goals, recent notes, red flags — prepared, not blind. Notes are spoken, not typed." },
      { href: "/arrivals", title: "KnockIn™ arrival", why: "Arrival stamped to the second, confirmed in one tap — and Faraz sees “arrived” instantly." },
      { href: "/availability", title: "Say when you can work", why: "Availability submitted in the window; the AI fills the gaps and protects your person." },
    ],
  },
  {
    id: "ceo",
    label: "Your view",
    person: "as the CEO",
    role: "ceo",
    icon: LineChart,
    stops: [
      { href: "/executive", title: "One honest question", why: "Are we genuinely improving people's lives? Answered from live data, not anecdotes." },
      { href: "/compliance", title: "Audit-ready today", why: "Readiness is live because evidence is a by-product of care — never a night-before scramble." },
      { href: "/incidents", title: "When it matters most", why: "The Commission's 24-hour clock, visible and escalating. The notification drafts itself." },
      { href: "/wellbeing", title: "Keep the people", why: "Burnout radar from roster data — and families' thank-yous reaching workers. People & culture, protected." },
    ],
  },
];

export function DayInTheLife() {
  const router = useRouter();
  const { setRole } = useRole();
  const [open, setOpen] = React.useState(false);
  const [journey, setJourney] = React.useState<Journey | null>(null);
  const [step, setStep] = React.useState(0);
  const [finished, setFinished] = React.useState(false);

  const start = (j: Journey) => {
    setJourney(j);
    setStep(0);
    setFinished(false);
    setOpen(false);
    setRole(j.role);
    router.push(j.stops[0].href);
  };

  const next = () => {
    if (!journey) return;
    if (step < journey.stops.length - 1) {
      const n = step + 1;
      setStep(n);
      router.push(journey.stops[n].href);
    } else {
      setFinished(true);
    }
  };

  const end = () => {
    setJourney(null);
    setFinished(false);
    setOpen(false);
  };

  const stop = journey?.stops[step];
  const last = journey ? step === journey.stops.length - 1 : false;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50">
      {/* Journey complete card */}
      <AnimatePresence>
        {journey && finished && (
          <motion.div
            key="finished"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            className="pointer-events-auto absolute bottom-20 left-3 right-3 mx-auto max-w-sm rounded-2xl border border-success/25 bg-card p-4 shadow-lifted sm:left-auto sm:right-4 sm:mx-0 lg:bottom-4 lg:right-4"
          >
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">Journey complete — {journey.label.toLowerCase()}.</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Every screen you just saw ran on one source of truth — recorded once, used everywhere.
                </p>
              </div>
              <button
                type="button"
                onClick={end}
                aria-label="Close"
                className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <div className="mt-3 space-y-2">
              {journeys.filter((j) => j.id !== journey.id).map((j) => (
                <button
                  key={j.id}
                  type="button"
                  onClick={() => start(j)}
                  className="flex w-full items-center gap-2.5 rounded-xl border bg-background/60 p-2.5 text-left transition-colors hover:border-primary/30 hover:bg-primary-soft/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
                    <j.icon className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                  <span className="flex-1 text-xs font-semibold">Next: {j.label}</span>
                  <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Coach card while touring */}
      <AnimatePresence>
        {journey && !finished && stop && (
          <motion.div
            key={journey.id + step}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            className="pointer-events-auto absolute bottom-20 left-3 right-3 mx-auto max-w-sm rounded-2xl border border-primary/20 bg-card p-4 shadow-lifted sm:left-auto sm:right-4 sm:mx-0 lg:bottom-4 lg:right-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">
                  {journey.label} · stop {step + 1} of {journey.stops.length}
                </p>
                <p className="mt-1 text-sm font-semibold">{stop.title}</p>
              </div>
              <button
                type="button"
                onClick={end}
                aria-label="End the tour"
                className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            {stop.pain && (
              <p className="mt-1.5 text-xs italic leading-relaxed text-muted-foreground/80">{stop.pain}</p>
            )}
            <p className={cn("mt-1.5 text-xs leading-relaxed", stop.pain ? "font-medium text-foreground" : "text-muted-foreground")}>{stop.why}</p>
            <div className="mt-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5" aria-hidden="true">
                {journey.stops.map((_, i) => (
                  <span key={i} className={cn("h-1.5 rounded-full transition-all", i === step ? "w-4 bg-primary" : "w-1.5 bg-muted-foreground/25")} />
                ))}
              </div>
              <button
                type="button"
                onClick={next}
                className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-primary to-secondary px-4 py-2 text-xs font-semibold text-white shadow-soft transition-transform hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {last ? "Finish" : "Next stop"}
                {last ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Journey picker */}
      <AnimatePresence>
        {open && !journey && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            className="pointer-events-auto absolute bottom-32 left-3 right-3 mx-auto max-w-sm rounded-2xl border bg-card p-4 shadow-lifted sm:left-auto sm:right-4 sm:mx-0 lg:bottom-16"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">A Day in the Life</p>
                <p className="mt-0.5 text-xs text-muted-foreground">Three short journeys. Each stop explains why it matters.</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <div className="mt-3 space-y-2">
              {journeys.map((j) => (
                <button
                  key={j.id}
                  type="button"
                  onClick={() => start(j)}
                  className="flex w-full items-center gap-3 rounded-xl border bg-background/60 p-3 text-left transition-colors hover:border-primary/30 hover:bg-primary-soft/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                    <j.icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">{j.label}</span>
                    <span className="block truncate text-xs text-muted-foreground">{j.person}</span>
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Launcher */}
      {!journey && (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="pointer-events-auto absolute bottom-20 right-3 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-secondary py-2.5 pl-3.5 pr-4 text-xs font-semibold text-white shadow-lifted transition-transform hover:scale-[1.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:bottom-4 lg:right-4"
        >
          <Play className="h-3.5 w-3.5" aria-hidden="true" />
          A Day in the Life
        </button>
      )}
    </div>
  );
}
