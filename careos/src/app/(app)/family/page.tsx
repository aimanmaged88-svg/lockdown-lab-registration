"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  CalendarDays,
  Camera,
  FileText,
  Heart,
  MessageCircleHeart,
  PartyPopper,
  ShieldCheck,
  Smile,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/shared/page-header";
import { PersonAvatar } from "@/components/shared/person-avatar";
import { TrendAreaChart } from "@/components/charts/trend-area-chart";
import { getParticipant } from "@/data/participants";
import { getTimeline } from "@/data/timeline";
import { staggerContainer, fadeUp } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * The Family Portal. A parent opens this and knows — within ten seconds —
 * that their person had a good day. Relief, not information overload.
 * Families see what's agreed for sharing; they never edit operational records.
 */
export default function FamilyPortalPage() {
  // Demo: Sarah (Milo's mum) is the signed-in family member.
  const milo = getParticipant("milo")!;
  const timeline = getTimeline("milo").filter((e) => e.highlight).slice(0, 4);
  const sharedDocs = milo.documents.filter((d) => d.sharedWithFamily);
  const sharedAppointments = milo.appointments.filter((a) => a.sharedWithFamily);
  const moodData = milo.moodTrend.map((m) => ({ period: m.date.slice(8), value: m.score }));

  return (
    <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-6">
      <PageHeader
        eyebrow="Family Portal"
        title="Milo had a great day 💙"
        description="Wednesday 15 July · updated 20 minutes ago by Daniel (Milo's support worker)"
      >
        <Badge variant="success" className="px-3 py-1.5 text-sm">
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
          Everything on track
        </Badge>
      </PageHeader>

      {/* Today at a glance */}
      <motion.section variants={fadeUp} aria-label="Today's summary">
        <Card className="overflow-hidden">
          <div className={cn("h-1.5 bg-gradient-to-r", milo.gradient)} aria-hidden="true" />
          <CardContent className="p-6">
            <div className="flex flex-wrap items-center gap-4">
              <PersonAvatar initials={milo.initials} gradient={milo.gradient} size="xl" />
              <div className="min-w-0 flex-1">
                <h2 className="font-display text-xl font-semibold">Today in three moments</h2>
                <ul className="mt-2 space-y-1.5">
                  {milo.todaysWins.map((win) => (
                    <li key={win} className="flex gap-2 text-sm leading-relaxed text-muted-foreground">
                      <PartyPopper className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden="true" />
                      {win}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="grid shrink-0 grid-cols-3 gap-3 text-center sm:grid-cols-3">
                {[
                  { label: "Mood", value: "😄", detail: "Great" },
                  { label: "Meals", value: "3/3", detail: "All done" },
                  { label: "Goals", value: "2", detail: "Progressed" },
                ].map((s) => (
                  <div key={s.label} className="rounded-2xl bg-muted/60 px-4 py-3">
                    <p className="font-display text-xl font-semibold">{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.label} · {s.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.section>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Goals + mood */}
        <motion.div variants={fadeUp} className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
                How Milo's goals are going
              </CardTitle>
              <CardDescription>The team updates these after every shift — you always see the latest.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {milo.goals.slice(0, 3).map((goal) => (
                <div key={goal.id} className="rounded-2xl border bg-background/60 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold">{goal.title}</p>
                    <span className="text-sm font-semibold text-primary">{goal.progress}%</span>
                  </div>
                  <Progress value={goal.progress} className="mt-2" aria-label={`${goal.title}: ${goal.progress}%`} />
                  <p className="mt-2.5 text-xs leading-relaxed text-muted-foreground">{goal.latestUpdate}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Smile className="h-4 w-4 text-secondary" aria-hidden="true" />
                Mood this week
              </CardTitle>
              <CardDescription>Logged gently by the team across the day — 5 is a brilliant day.</CardDescription>
            </CardHeader>
            <CardContent>
              <TrendAreaChart data={moodData} id="family-mood" color="--chart-2" height={160} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Heart className="h-4 w-4 text-destructive" aria-hidden="true" />
                  Recent highlights
                </CardTitle>
                <CardDescription>The moments you'd never want to miss.</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/timeline">Full story</Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {timeline.map((event) => (
                <div key={event.id} className="rounded-2xl border border-primary/15 bg-gradient-to-br from-card to-primary-soft/30 p-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="warning">✦</Badge>
                    <time dateTime={event.date} className="text-xs text-muted-foreground">
                      {new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "long", year: "numeric" }).format(new Date(event.date))}
                    </time>
                  </div>
                  <p className="mt-1.5 text-sm font-semibold">{event.title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{event.description}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Right rail */}
        <div className="space-y-6">
          <motion.div variants={fadeUp}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Camera className="h-4 w-4 text-warning" aria-hidden="true" />
                  Shared photos
                </CardTitle>
                <CardDescription>Only shared with Milo's consent plan.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2.5">
                  {["Animation frame 1", "Pool celebration", "Lego station build", "Trail bridge count"].map((caption, i) => (
                    <figure key={caption} className="overflow-hidden rounded-xl border">
                      <div
                        aria-hidden="true"
                        className={cn(
                          "flex h-20 items-center justify-center bg-gradient-to-br text-2xl",
                          ["from-sky-200 to-indigo-200 dark:from-sky-900 dark:to-indigo-900",
                           "from-teal-200 to-emerald-200 dark:from-teal-900 dark:to-emerald-900",
                           "from-amber-200 to-orange-200 dark:from-amber-900 dark:to-orange-900",
                           "from-rose-200 to-pink-200 dark:from-rose-900 dark:to-pink-900"][i]
                        )}
                      >
                        {["🎬", "🏊", "🚂", "🌉"][i]}
                      </div>
                      <figcaption className="truncate px-2 py-1.5 text-[11px] text-muted-foreground">{caption} · demo</figcaption>
                    </figure>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={fadeUp}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <CalendarDays className="h-4 w-4 text-primary" aria-hidden="true" />
                  Coming up
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {sharedAppointments.map((a) => (
                  <div key={a.id} className="rounded-xl border bg-background/60 p-3.5">
                    <p className="text-xs font-medium text-primary">
                      {new Intl.DateTimeFormat("en-AU", { weekday: "long", day: "numeric", month: "short" }).format(new Date(a.date))} · {a.time}
                    </p>
                    <p className="mt-0.5 text-sm font-semibold">{a.title}</p>
                    <p className="text-xs text-muted-foreground">{a.with} · {a.location}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={fadeUp}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  Shared with you
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {sharedDocs.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => toast("Document viewer", { description: `“${d.title}” opens in the secure viewer in the full platform.` })}
                    className="flex w-full items-center gap-3 rounded-xl border bg-background/60 p-3 text-left transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <FileText className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{d.title}</p>
                      <p className="text-xs text-muted-foreground">Updated {d.updatedAt}</p>
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={fadeUp}>
            <Card className="border-secondary/20 bg-gradient-to-br from-card to-secondary-soft/40">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <MessageCircleHeart className="h-4 w-4 text-secondary" aria-hidden="true" />
                  Send a note to the team
                </CardTitle>
                <CardDescription>Puppy arriving? Big weekend? The team reads every note before their next shift.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => toast.success("The team will see your note before the next shift starts.")}
                >
                  Write a note
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      <motion.p variants={fadeUp} className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <ShieldCheck className="h-3.5 w-3.5 text-success" aria-hidden="true" />
        You're seeing everything Milo's care plan shares with family. Operational records stay with the care team, and every view is audit-logged.
      </motion.p>
    </motion.div>
  );
}
