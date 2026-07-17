"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CalendarClock,
  CloudSun,
  HeartHandshake,
  PartyPopper,
  Sparkles,
  Sun,
  Target,
  TriangleAlert,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { PersonAvatar } from "@/components/shared/person-avatar";
import { MoodPill } from "@/components/shared/mood-pill";
import { AiBadge } from "@/components/shared/ai-badge";
import { participants } from "@/data/participants";
import { shifts } from "@/data/shifts";
import { getRecentTimeline } from "@/data/timeline";
import { notifications } from "@/data/notifications";
import { useRole } from "@/providers/role-provider";
import { staggerContainer, fadeUp } from "@/lib/motion";

const shiftStatusBadge = {
  active: { label: "In progress", variant: "success" as const },
  upcoming: { label: "Upcoming", variant: "default" as const },
  complete: { label: "Complete", variant: "muted" as const },
};

export default function DashboardPage() {
  const { definition } = useRole();
  const recentMoments = getRecentTimeline(5);
  const familyNotes = participants.flatMap((p) =>
    p.familyNotes.slice(0, 1).map((n) => ({ ...n, participant: p }))
  );
  const importantAlerts = participants.flatMap((p) =>
    p.riskAlerts.filter((r) => r.level === "important").map((r) => ({ ...r, participant: p }))
  );
  const firstName = definition.demoUser.name.split(" ")[0];

  return (
    <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-8">
      <PageHeader
        eyebrow="Wednesday 15 July 2026"
        title={`Good morning, ${firstName}`}
        description="Three people are counting on the team today. Here's everything you need to make their day a little better."
      >
        <div className="flex items-center gap-2 rounded-xl border bg-card px-3.5 py-2 text-sm shadow-soft">
          <CloudSun className="h-4 w-4 text-warning" aria-hidden="true" />
          <span className="font-medium">14°</span>
          <span className="text-muted-foreground">Partly cloudy · good outing weather</span>
        </div>
      </PageHeader>

      {/* Key numbers */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Participants today" value="3" icon={HeartHandshake} detail="All core-team shifts" />
        <StatCard label="Goals progressed this week" value="9" icon={Target} change="+3" direction="up" detail="vs last week" />
        <StatCard label="Milestones this month" value="4" icon={PartyPopper} change="+2" direction="up" detail="worth celebrating" />
        <StatCard label="Care alerts" value={String(importantAlerts.length)} icon={TriangleAlert} detail="reviewed & current" positive={false} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Today's shifts */}
        <motion.div variants={fadeUp} className="xl:col-span-2">
          <Card className="h-full">
            <CardHeader className="flex-col items-start gap-3 space-y-0 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Today's shifts</CardTitle>
                <CardDescription>Every shift starts prepared — briefing, goals and alerts loaded.</CardDescription>
              </div>
              <Button variant="soft" size="sm" asChild>
                <Link href="/shift">
                  Open Smart Shift
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {shifts.map((shift) => {
                const participant = participants.find((p) => p.id === shift.participantId)!;
                const status = shiftStatusBadge[shift.status];
                const done = shift.checklist.filter((c) => c.done).length;
                return (
                  <Link
                    key={shift.id}
                    href="/shift"
                    className="flex items-center gap-4 rounded-2xl border bg-background/60 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <PersonAvatar initials={participant.initials} gradient={participant.gradient} size="md" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{participant.preferredName}</p>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </div>
                      <p className="mt-0.5 truncate text-sm text-muted-foreground">
                        {shift.start} – {shift.end} · {shift.focus}
                      </p>
                    </div>
                    <div className="hidden text-right sm:block">
                      <p className="text-sm font-semibold">{done}/{shift.checklist.length}</p>
                      <p className="text-xs text-muted-foreground">checklist</p>
                    </div>
                  </Link>
                );
              })}
            </CardContent>
          </Card>
        </motion.div>

        {/* AI briefing */}
        <motion.div variants={fadeUp}>
          <Card className="h-full border-primary/10 bg-gradient-to-br from-card to-primary-soft/40">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
                  Morning briefing
                </CardTitle>
              </div>
              <AiBadge label="AI summary — verified by team leader" />
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-relaxed">
              <p>
                <strong>Milo</strong> is one morning away from a five-day independence streak — today's 7am shift matters more than it looks.
              </p>
              <p>
                <strong>Ava</strong> rehearses her conference talk at 2pm. Sparky to 100% and the room to herself.
              </p>
              <p>
                <strong>Jordan</strong> ran this morning completely solo. Tonight, keep the cooking session light — peer group is tomorrow.
              </p>
              <Button variant="outline" size="sm" className="mt-2 w-full" asChild>
                <Link href="/assistant">Ask the assistant anything</Link>
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Participants snapshot */}
      <motion.section variants={fadeUp} aria-labelledby="today-participants">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="today-participants" className="font-display text-xl font-semibold">Today's participants</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/participants">
              View all
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {participants.map((p) => (
            <Link
              key={p.id}
              href={`/participants/${p.id}`}
              className="group rounded-2xl border bg-card p-5 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lifted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="flex items-center gap-3">
                <PersonAvatar initials={p.initials} gradient={p.gradient} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{p.preferredName}</p>
                  <MoodPill mood={p.mood} className="mt-1" />
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden="true" />
              </div>
              <div className="mt-4 space-y-1.5">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Today's wins</p>
                <ul className="space-y-1">
                  {p.todaysWins.slice(0, 2).map((win) => (
                    <li key={win} className="flex gap-2 text-sm leading-snug text-muted-foreground">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-success" aria-hidden="true" />
                      {win}
                    </li>
                  ))}
                </ul>
              </div>
            </Link>
          ))}
        </div>
      </motion.section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Recent moments */}
        <motion.div variants={fadeUp} className="xl:col-span-2">
          <Card>
            <CardHeader className="flex-col items-start gap-3 space-y-0 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Recent moments</CardTitle>
                <CardDescription>The latest from every timeline.</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/timeline">
                  Full timeline
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-1">
              {recentMoments.map((moment) => {
                const p = participants.find((x) => x.id === moment.participantId)!;
                return (
                  <Link
                    key={moment.id}
                    href={`/participants/${p.id}?tab=timeline`}
                    className="flex items-start gap-3 rounded-xl p-3 transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <PersonAvatar initials={p.initials} gradient={p.gradient} size="sm" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium leading-snug">{moment.title}</p>
                      <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{moment.description}</p>
                    </div>
                    <time dateTime={moment.date} className="ml-auto shrink-0 text-xs text-muted-foreground">
                      {new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short" }).format(new Date(moment.date))}
                    </time>
                  </Link>
                );
              })}
            </CardContent>
          </Card>
        </motion.div>

        {/* Right rail: family notes + appointments */}
        <div className="space-y-6">
          <motion.div variants={fadeUp}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HeartHandshake className="h-4 w-4 text-secondary" aria-hidden="true" />
                  From families
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {familyNotes.slice(0, 2).map((note) => (
                  <blockquote key={note.id} className="rounded-xl bg-secondary-soft/60 p-3.5">
                    <p className="text-sm italic leading-relaxed">“{note.note.length > 120 ? `${note.note.slice(0, 120)}…` : note.note}”</p>
                    <footer className="mt-2 text-xs text-muted-foreground">
                      {note.from} · {note.participant.preferredName}'s {note.relationship.toLowerCase()}
                    </footer>
                  </blockquote>
                ))}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={fadeUp}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarClock className="h-4 w-4 text-primary" aria-hidden="true" />
                  Coming up
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {participants
                  .flatMap((p) => p.appointments.slice(0, 1).map((a) => ({ ...a, participant: p })))
                  .map((a) => (
                    <div key={a.id} className="flex items-center gap-3 rounded-xl border p-3">
                      <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-xl bg-primary-soft text-primary">
                        <Sun className="h-4 w-4" aria-hidden="true" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{a.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {a.participant.preferredName} · {new Intl.DateTimeFormat("en-AU", { weekday: "short", day: "numeric", month: "short" }).format(new Date(a.date))}, {a.time}
                        </p>
                      </div>
                    </div>
                  ))}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Unread notifications strip */}
      <motion.div variants={fadeUp}>
        <Link
          href="/notifications"
          className="flex items-center gap-3 rounded-2xl border border-primary/15 bg-primary-soft/50 p-4 transition-colors hover:bg-primary-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
            {notifications.filter((n) => !n.read).length}
          </span>
          <p className="text-sm">
            <span className="font-medium">unread notifications</span>
            <span className="text-muted-foreground"> — a milestone, a family note and an AI insight are waiting.</span>
          </p>
          <ArrowRight className="ml-auto h-4 w-4 text-primary" aria-hidden="true" />
        </Link>
      </motion.div>
    </motion.div>
  );
}
