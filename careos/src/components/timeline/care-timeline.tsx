"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Award,
  CalendarDays,
  Camera,
  FileText,
  Flag,
  GraduationCap,
  HeartPulse,
  MapPin,
  PartyPopper,
  Sparkles,
  Star,
  Briefcase,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { TimelineEvent, TimelineKind } from "@/types";

const kindConfig: Record<TimelineKind, { icon: LucideIcon; label: string; className: string }> = {
  milestone: { icon: Flag, label: "Milestone", className: "bg-primary-soft text-primary" },
  achievement: { icon: Star, label: "Achievement", className: "bg-success-soft text-success" },
  goal: { icon: Award, label: "Goal", className: "bg-secondary-soft text-secondary" },
  photo: { icon: Camera, label: "Photo", className: "bg-warning-soft text-warning" },
  report: { icon: FileText, label: "Report", className: "bg-muted text-muted-foreground" },
  appointment: { icon: CalendarDays, label: "Appointment", className: "bg-muted text-muted-foreground" },
  therapy: { icon: HeartPulse, label: "Therapy", className: "bg-destructive-soft text-destructive" },
  community: { icon: MapPin, label: "Community", className: "bg-secondary-soft text-secondary" },
  "ai-summary": { icon: Sparkles, label: "AI summary", className: "bg-primary-soft text-primary" },
  celebration: { icon: PartyPopper, label: "Celebration", className: "bg-warning-soft text-warning" },
  education: { icon: GraduationCap, label: "Education", className: "bg-primary-soft text-primary" },
  employment: { icon: Briefcase, label: "Employment", className: "bg-secondary-soft text-secondary" },
};

const dateFormat = new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short", year: "numeric" });

function TimelineEntry({ event, index }: { event: TimelineEvent; index: number }) {
  const config = kindConfig[event.kind];
  const Icon = config.icon;

  return (
    <motion.li
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1], delay: Math.min(index * 0.03, 0.2) }}
      className="relative pl-14"
    >
      {/* Node on the timeline spine */}
      <div className={cn("absolute left-0 top-0.5 flex h-10 w-10 items-center justify-center rounded-2xl shadow-soft", config.className)}>
        <Icon className="h-4 w-4" aria-hidden="true" />
      </div>

      <div
        className={cn(
          "rounded-2xl border bg-card p-4 shadow-soft transition-shadow duration-300 hover:shadow-card",
          event.highlight && "border-primary/25 bg-gradient-to-br from-card to-primary-soft/40"
        )}
      >
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="muted" className="font-normal">{config.label}</Badge>
          <time dateTime={event.date} className="text-xs text-muted-foreground">
            {dateFormat.format(new Date(event.date))}
          </time>
          {event.highlight && <Badge variant="warning">✦ Highlight</Badge>}
        </div>
        <h3 className="mt-2 font-semibold leading-snug">{event.title}</h3>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{event.description}</p>
        {event.author && <p className="mt-2 text-xs text-muted-foreground/80">— {event.author}</p>}
      </div>
    </motion.li>
  );
}

const FILTERS: { key: "all" | TimelineKind; label: string }[] = [
  { key: "all", label: "Everything" },
  { key: "milestone", label: "Milestones" },
  { key: "achievement", label: "Achievements" },
  { key: "goal", label: "Goals" },
  { key: "celebration", label: "Celebrations" },
  { key: "therapy", label: "Therapy" },
  { key: "community", label: "Community" },
  { key: "photo", label: "Photos" },
  { key: "ai-summary", label: "AI summaries" },
];

/**
 * The Care Timeline — a continuous, beautiful story of a person's journey.
 * Grouped by year, filtered by moment type, animated as you scroll.
 */
export function CareTimeline({ events }: { events: TimelineEvent[] }) {
  const [filter, setFilter] = React.useState<"all" | TimelineKind>("all");

  const filtered = filter === "all" ? events : events.filter((e) => e.kind === filter);
  const availableKinds = React.useMemo(() => new Set(events.map((e) => e.kind)), [events]);
  const byYear = filtered.reduce<Record<string, TimelineEvent[]>>((acc, event) => {
    const year = event.date.slice(0, 4);
    (acc[year] ??= []).push(event);
    return acc;
  }, {});
  const years = Object.keys(byYear).sort((a, b) => b.localeCompare(a));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter timeline by moment type">
        {FILTERS.filter((f) => f.key === "all" || availableKinds.has(f.key)).map((f) => (
          <Button
            key={f.key}
            variant={filter === f.key ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f.key)}
            aria-pressed={filter === f.key}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {years.map((year) => (
        <section key={year} aria-label={`Events from ${year}`}>
          <div className="glass sticky top-16 z-10 -mx-1 mb-4 flex items-center gap-3 rounded-lg px-2 py-2">
            <h2 className="font-display text-xl font-semibold">{year}</h2>
            <div className="h-px flex-1 bg-border" aria-hidden="true" />
            <span className="text-xs text-muted-foreground">
              {byYear[year].length} moment{byYear[year].length !== 1 ? "s" : ""}
            </span>
          </div>
          <ol className="relative space-y-4 pb-2">
            <div className="absolute bottom-2 left-5 top-1 w-px bg-gradient-to-b from-border via-border to-transparent" aria-hidden="true" />
            {byYear[year].map((event, i) => (
              <TimelineEntry key={event.id} event={event} index={i} />
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}
