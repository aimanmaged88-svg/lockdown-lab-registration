"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  Ear,
  FileText,
  HeartHandshake,
  HeartPulse,
  Info,
  MapPin,
  MessageCircle,
  Moon,
  Pill,
  ShieldAlert,
  Sparkles,
  Sun,
  Utensils,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { PersonAvatar } from "@/components/shared/person-avatar";
import { MoodPill } from "@/components/shared/mood-pill";
import { GoalCard } from "@/components/participants/goal-card";
import { AiInsightCard } from "@/components/participants/ai-insight-card";
import { CareTimeline } from "@/components/timeline/care-timeline";
import { TrendAreaChart } from "@/components/charts/trend-area-chart";
import { staggerContainer, fadeUp } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { Participant, RoutineStep, TimelineEvent } from "@/types";

/* ---------------------------------- helpers ---------------------------------- */

function SectionCard({
  title,
  description,
  icon: Icon,
  children,
  className,
}: {
  title: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div variants={fadeUp}>
      <Card className={cn("h-full", className)}>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            {Icon && <Icon className="h-4 w-4 text-primary" aria-hidden="true" />}
            {title}
          </CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </motion.div>
  );
}

function ChipList({ items, variant = "muted" }: { items: string[]; variant?: "muted" | "default" | "secondary" | "success" | "warning" | "destructive" }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <Badge key={item} variant={variant} className="font-normal">
          {item}
        </Badge>
      ))}
    </div>
  );
}

function BulletList({ items, tone = "primary" }: { items: string[]; tone?: "primary" | "success" | "warning" | "destructive" }) {
  const dot = {
    primary: "bg-primary",
    success: "bg-success",
    warning: "bg-warning",
    destructive: "bg-destructive",
  }[tone];
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item} className="flex gap-2.5 text-sm leading-relaxed text-muted-foreground">
          <span className={cn("mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full", dot)} aria-hidden="true" />
          {item}
        </li>
      ))}
    </ul>
  );
}

function RoutineList({ steps }: { steps: RoutineStep[] }) {
  return (
    <ol className="space-y-2.5">
      {steps.map((step) => (
        <li key={`${step.time}-${step.title}`} className="flex gap-3 rounded-xl border bg-background/60 p-3">
          <span className="mt-0.5 shrink-0 rounded-lg bg-primary-soft px-2 py-1 text-xs font-semibold tabular-nums text-primary">
            {step.time}
          </span>
          <div>
            <p className="text-sm font-medium leading-snug">
              {step.title}
              {step.supportsGoalId && (
                <Badge variant="secondary" className="ml-2 align-middle font-normal">supports a goal</Badge>
              )}
            </p>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{step.detail}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

const alertStyles = {
  important: { icon: ShieldAlert, className: "border-destructive/25 bg-destructive-soft/50", iconClass: "text-destructive" },
  caution: { icon: AlertCircle, className: "border-warning/25 bg-warning-soft/50", iconClass: "text-warning" },
  info: { icon: Info, className: "border-border bg-muted/50", iconClass: "text-muted-foreground" },
};

/* ---------------------------------- profile ---------------------------------- */

export function ParticipantProfile({ participant: p, timeline }: { participant: Participant; timeline: TimelineEvent[] }) {
  const achievedGoals = p.goals.filter((g) => g.status === "achieved").length;
  const highlights = timeline.filter((e) => e.highlight).length;

  return (
    <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-6">
      <motion.div variants={fadeUp}>
        <Button variant="ghost" size="sm" asChild className="-ml-2 text-muted-foreground">
          <Link href="/participants">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            All participants
          </Link>
        </Button>
      </motion.div>

      {/* Hero — the person, never the file */}
      <motion.section
        variants={fadeUp}
        aria-label={`${p.preferredName}'s profile`}
        className="overflow-hidden rounded-3xl border bg-card shadow-card"
      >
        <div className={cn("h-24 bg-gradient-to-r opacity-90 md:h-28", p.gradient)} aria-hidden="true" />
        <div className="px-6 pb-6">
          {/* Avatar overlaps the banner; the name always sits on the card surface below it. */}
          <PersonAvatar initials={p.initials} gradient={p.gradient} size="xl" className="-mt-11 ring-4 ring-card" />
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">{p.preferredName}</h1>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {p.name} · {p.pronouns} · {p.age} · {p.location}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <MoodPill mood={p.mood} />
              <Badge variant="secondary">{p.yearsSupported} years together</Badge>
            </div>
          </div>

          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted-foreground md:text-base">{p.about}</p>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Active goals", value: p.goals.filter((g) => g.status !== "achieved").length },
              { label: "Goals achieved", value: achievedGoals },
              { label: "Timeline highlights", value: highlights },
              { label: "Wins today", value: p.todaysWins.length },
            ].map((stat) => (
              <div key={stat.label} className="rounded-2xl bg-muted/60 p-3.5 text-center">
                <p className="font-display text-2xl font-semibold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Care alerts are always visible, regardless of tab */}
      {p.riskAlerts.length > 0 && (
        <motion.section variants={fadeUp} aria-label="Care alerts" className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {p.riskAlerts.map((alert) => {
            const style = alertStyles[alert.level];
            const Icon = style.icon;
            return (
              <div key={alert.id} className={cn("flex gap-3 rounded-2xl border p-4", style.className)}>
                <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", style.iconClass)} aria-hidden="true" />
                <div>
                  <p className="text-sm font-semibold">{alert.title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{alert.guidance}</p>
                </div>
              </div>
            );
          })}
        </motion.section>
      )}

      <motion.div variants={fadeUp}>
        <Tabs defaultValue="overview">
          {/* Right-edge fade signals the tab strip scrolls horizontally on small screens. */}
          <div className="relative">
            <div className="overflow-x-auto pb-1 scrollbar-thin [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <TabsList className="h-11 w-max">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="dna">Care DNA</TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
                <TabsTrigger value="goals">Goals</TabsTrigger>
                <TabsTrigger value="communication">Communication</TabsTrigger>
                <TabsTrigger value="sensory">Sensory</TabsTrigger>
                <TabsTrigger value="health">Health</TabsTrigger>
                <TabsTrigger value="daily">Daily life</TabsTrigger>
                <TabsTrigger value="community">Community</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
                <TabsTrigger value="insights">AI insights</TabsTrigger>
              </TabsList>
            </div>
            <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-background to-transparent lg:hidden" aria-hidden="true" />
          </div>

          {/* -------------------------------- OVERVIEW -------------------------------- */}
          <TabsContent value="overview">
            <motion.div variants={staggerContainer} initial="initial" animate="animate" className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <SectionCard title="Today's wins" icon={Sun} description="Worth celebrating, worth sharing.">
                <BulletList items={p.todaysWins} tone="success" />
              </SectionCard>
              <SectionCard title="Progress trends" icon={Activity} description="Six months, three stories.">
                <div className="space-y-4">
                  {p.trends.slice(0, 1).map((t) => (
                    <div key={t.label}>
                      <div className="mb-1 flex items-baseline justify-between">
                        <p className="text-sm font-medium">{t.label}</p>
                        <p className="text-xs text-muted-foreground">{t.unit}</p>
                      </div>
                      <TrendAreaChart data={t.points} id={`${p.id}-overview`} height={150} />
                    </div>
                  ))}
                  <div className="grid grid-cols-2 gap-3">
                    {p.trends.slice(1).map((t) => {
                      const first = t.points[0].value;
                      const last = t.points[t.points.length - 1].value;
                      return (
                        <div key={t.label} className="rounded-xl bg-muted/60 p-3">
                          <p className="text-xs text-muted-foreground">{t.label}</p>
                          <p className="mt-1 font-display text-lg font-semibold">
                            {last} <span className="text-xs font-normal text-muted-foreground">{t.unit}</span>
                          </p>
                          <p className={cn("text-xs font-medium", t.positive ? "text-success" : "text-warning")}>
                            {first} → {last} since Jan
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </SectionCard>
              <SectionCard title="Strengths" icon={HeartHandshake} description="Who they are — before anything else.">
                <BulletList items={p.strengths} />
              </SectionCard>
              <SectionCard title="Dreams & goals on the horizon" icon={Sparkles}>
                <BulletList items={p.dreams} tone="warning" />
                <Separator className="my-4" />
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Important people</p>
                <ChipList items={p.importantPeople.map((ip) => `${ip.name} — ${ip.relationship}`)} />
              </SectionCard>
            </motion.div>
          </TabsContent>

          {/* -------------------------------- CARE DNA -------------------------------- */}
          <TabsContent value="dna">
            <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-5">
              <div className="rounded-2xl border border-primary/15 bg-gradient-to-br from-card to-primary-soft/40 p-5">
                <p className="text-sm leading-relaxed">
                  <span className="font-display font-semibold">Care DNA™</span>
                  <span className="text-muted-foreground">
                    {" "}— a living profile that grows with every shift, every observation, every win. Knowledge belongs to {p.preferredName}, not to any one staff member.
                  </span>
                </p>
              </div>
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <SectionCard title="Favourite things" icon={Sun}>
                  <dl className="space-y-3">
                    {p.favouriteThings.map((f) => (
                      <div key={f.label} className="flex gap-3 text-sm">
                        <dt className="w-20 shrink-0 font-medium text-muted-foreground">{f.label}</dt>
                        <dd className="leading-relaxed">{f.value}</dd>
                      </div>
                    ))}
                  </dl>
                </SectionCard>
                <SectionCard title="Interests" icon={Sparkles} description="Bridges to connection — never bargaining chips.">
                  <ChipList items={p.interests} variant="default" />
                  <Separator className="my-4" />
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">What helps in hard moments</p>
                  <BulletList items={p.behaviourSupport.thingsThatHelp} tone="success" />
                </SectionCard>
                <SectionCard title="Proactive support strategies" icon={HeartHandshake}>
                  <BulletList items={p.behaviourSupport.proactiveStrategies} />
                </SectionCard>
                <SectionCard title="Early signs & de-escalation" icon={AlertCircle}>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Early warning signs</p>
                  <BulletList items={p.behaviourSupport.earlyWarningSigns} tone="warning" />
                  <Separator className="my-4" />
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">What to do</p>
                  <BulletList items={p.behaviourSupport.deescalation} tone="primary" />
                </SectionCard>
              </div>
            </motion.div>
          </TabsContent>

          {/* -------------------------------- TIMELINE -------------------------------- */}
          <TabsContent value="timeline">
            <div className="mb-5 rounded-2xl border border-primary/15 bg-gradient-to-br from-card to-primary-soft/40 p-5">
              <p className="text-sm leading-relaxed text-muted-foreground">
                <span className="font-semibold text-foreground">{p.preferredName}'s story so far</span> — {timeline.length} moments across {p.yearsSupported} years. Not paperwork. A life.
              </p>
            </div>
            <CareTimeline events={timeline} />
          </TabsContent>

          {/* -------------------------------- GOALS -------------------------------- */}
          <TabsContent value="goals">
            <motion.div variants={staggerContainer} initial="initial" animate="animate" className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              {p.goals.map((goal) => (
                <GoalCard key={goal.id} goal={goal} />
              ))}
            </motion.div>
          </TabsContent>

          {/* -------------------------------- COMMUNICATION -------------------------------- */}
          <TabsContent value="communication">
            <motion.div variants={staggerContainer} initial="initial" animate="animate" className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <SectionCard title="How communication works" icon={MessageCircle} className="lg:col-span-2">
                <p className="text-sm leading-relaxed text-muted-foreground">{p.communication.style}</p>
                <Separator className="my-4" />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Tools</p>
                    <ChipList items={p.communication.tools} variant="default" />
                  </div>
                  <div>
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Processing time</p>
                    <p className="text-sm leading-relaxed text-muted-foreground">{p.communication.processingTime}</p>
                  </div>
                </div>
              </SectionCard>
              <SectionCard title="What works" icon={HeartHandshake}>
                <BulletList items={p.communication.successfulStrategies} tone="success" />
              </SectionCard>
              <SectionCard title="Please avoid" icon={AlertCircle}>
                <BulletList items={p.communication.avoid} tone="destructive" />
              </SectionCard>
              <SectionCard title="Know the signals" icon={Ear} className="lg:col-span-2" description="Small signals, big meaning.">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {p.communication.keyPhrases.map((k) => (
                    <div key={k.phrase} className="rounded-xl border bg-background/60 p-3.5">
                      <p className="text-sm font-semibold">{k.phrase}</p>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{k.meaning}</p>
                    </div>
                  ))}
                </div>
              </SectionCard>
            </motion.div>
          </TabsContent>

          {/* -------------------------------- SENSORY -------------------------------- */}
          <TabsContent value="sensory">
            <motion.div variants={staggerContainer} initial="initial" animate="animate" className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <SectionCard title="Sensory profile" icon={Ear} className="lg:col-span-2">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {p.sensory.preferences.map((s) => (
                    <div key={s.sense} className="flex items-start justify-between gap-3 rounded-xl border bg-background/60 p-3.5">
                      <div>
                        <p className="text-sm font-semibold">{s.sense}</p>
                        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{s.preference}</p>
                      </div>
                      <Badge
                        variant={s.level === "sensitive" ? "warning" : s.level === "seeks" ? "secondary" : "muted"}
                        className="shrink-0 capitalize"
                      >
                        {s.level}
                      </Badge>
                    </div>
                  ))}
                </div>
              </SectionCard>
              <SectionCard title="Early signs of overwhelm" icon={AlertCircle}>
                <BulletList items={p.sensory.earlySignsOfOverwhelm} tone="warning" />
              </SectionCard>
              <SectionCard title="What brings calm" icon={Moon}>
                <BulletList items={p.sensory.regulationStrategies} tone="success" />
                <Separator className="my-4" />
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Favourite tools</p>
                <ChipList items={p.sensory.favouriteTools} variant="secondary" />
              </SectionCard>
            </motion.div>
          </TabsContent>

          {/* -------------------------------- HEALTH -------------------------------- */}
          <TabsContent value="health">
            <motion.div variants={staggerContainer} initial="initial" animate="animate" className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <SectionCard title="Health snapshot" icon={HeartPulse}>
                <dl className="space-y-3 text-sm">
                  {[
                    ["Diagnoses", p.health.diagnoses.join(" · ")],
                    ["Allergies", p.health.allergies.join(" · ")],
                    ["Mobility", p.health.mobility],
                    ["Sleep", p.health.sleep],
                    ["Nutrition", p.health.nutrition],
                    ["Emergency contact", p.health.emergencyContact],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
                      <dd className="mt-0.5 leading-relaxed">{value}</dd>
                    </div>
                  ))}
                </dl>
              </SectionCard>
              <SectionCard title="Medication" icon={Pill} description="Administration is double-signed and audit-logged.">
                <ul className="space-y-3">
                  {p.medications.map((m) => (
                    <li key={m.id} className="rounded-xl border bg-background/60 p-3.5">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold">
                          {m.name} <span className="font-normal text-muted-foreground">{m.dose}</span>
                        </p>
                        <Badge variant={m.status === "active" ? "success" : m.status === "prn" ? "warning" : "muted"} className="uppercase">
                          {m.status}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{m.schedule} · {m.purpose}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {m.prescriber}
                        {m.lastGiven && ` · last given ${m.lastGiven}`}
                      </p>
                    </li>
                  ))}
                </ul>
              </SectionCard>
              <SectionCard title="Food & nutrition" icon={Utensils} className="lg:col-span-2">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-4">
                    <div>
                      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Loves</p>
                      <ChipList items={p.nutrition.loves} variant="success" />
                    </div>
                    <div>
                      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Avoid</p>
                      <ChipList items={p.nutrition.avoid} variant="destructive" />
                    </div>
                  </div>
                  <dl className="space-y-3 text-sm">
                    {[
                      ["Texture notes", p.nutrition.textureNotes],
                      ["Hydration", p.nutrition.hydrationTarget],
                      ["Mealtime support", p.nutrition.mealtimeSupport],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
                        <dd className="mt-0.5 leading-relaxed text-muted-foreground">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </SectionCard>
            </motion.div>
          </TabsContent>

          {/* -------------------------------- DAILY LIFE -------------------------------- */}
          <TabsContent value="daily">
            <motion.div variants={staggerContainer} initial="initial" animate="animate" className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <SectionCard title="Morning routine" icon={Sun} description="Consistency builds confidence.">
                <RoutineList steps={p.morningRoutine} />
              </SectionCard>
              <SectionCard title="Evening routine" icon={Moon}>
                <RoutineList steps={p.eveningRoutine} />
              </SectionCard>
            </motion.div>
          </TabsContent>

          {/* -------------------------------- COMMUNITY -------------------------------- */}
          <TabsContent value="community">
            <motion.div variants={staggerContainer} initial="initial" animate="animate" className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <SectionCard title="Favourite places" icon={MapPin}>
                <BulletList items={p.community.favouritePlaces} />
                <Separator className="my-4" />
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Safe places</p>
                <ChipList items={p.community.safePlaces} variant="success" />
              </SectionCard>
              <SectionCard title="Getting around & outing tips" icon={MapPin}>
                <p className="text-sm leading-relaxed text-muted-foreground">{p.community.transport}</p>
                <Separator className="my-4" />
                <BulletList items={p.community.outingTips} tone="primary" />
              </SectionCard>
              <SectionCard title="Upcoming appointments" icon={CalendarDays} className="lg:col-span-2">
                <ul className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  {p.appointments.map((a) => (
                    <li key={a.id} className="rounded-xl border bg-background/60 p-3.5">
                      <p className="text-xs font-medium text-primary">
                        {new Intl.DateTimeFormat("en-AU", { weekday: "long", day: "numeric", month: "short" }).format(new Date(a.date))} · {a.time}
                      </p>
                      <p className="mt-1 text-sm font-semibold leading-snug">{a.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{a.with} · {a.location}</p>
                      {a.sharedWithFamily && <Badge variant="secondary" className="mt-2 font-normal">Visible to family</Badge>}
                    </li>
                  ))}
                </ul>
              </SectionCard>
            </motion.div>
          </TabsContent>

          {/* -------------------------------- DOCUMENTS -------------------------------- */}
          <TabsContent value="documents">
            <motion.div variants={staggerContainer} initial="initial" animate="animate" className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <SectionCard title="Documents" icon={FileText} description="Role-based visibility. Family sharing is explicit, never accidental.">
                <ul className="space-y-2.5">
                  {p.documents.map((d) => (
                    <li key={d.id} className="flex items-center gap-3 rounded-xl border bg-background/60 p-3.5">
                      <div className="rounded-lg bg-primary-soft p-2 text-primary">
                        <FileText className="h-4 w-4" aria-hidden="true" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{d.title}</p>
                        <p className="text-xs text-muted-foreground">{d.category} · updated {d.updatedAt} · {d.author}</p>
                      </div>
                      {d.sharedWithFamily ? (
                        <Badge variant="secondary" className="shrink-0 font-normal">Shared</Badge>
                      ) : (
                        <Badge variant="muted" className="shrink-0 font-normal">Team only</Badge>
                      )}
                    </li>
                  ))}
                </ul>
              </SectionCard>
              <SectionCard title="Notes from family" icon={HeartHandshake}>
                <ul className="space-y-3">
                  {p.familyNotes.map((n) => (
                    <li key={n.id}>
                      <blockquote className="rounded-xl bg-secondary-soft/60 p-4">
                        <p className="text-sm italic leading-relaxed">“{n.note}”</p>
                        <footer className="mt-2 text-xs text-muted-foreground">
                          {n.from} · {n.relationship} · {n.date}
                        </footer>
                      </blockquote>
                    </li>
                  ))}
                </ul>
              </SectionCard>
            </motion.div>
          </TabsContent>

          {/* -------------------------------- AI INSIGHTS -------------------------------- */}
          <TabsContent value="insights">
            <div className="mb-5 flex items-start gap-3 rounded-2xl border border-primary/15 bg-primary-soft/40 p-4">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              <p className="text-sm leading-relaxed text-muted-foreground">
                The AI notices patterns across shifts and seasons — it never diagnoses and never decides.
                Every insight explains its reasoning and waits for a human to act on it.
              </p>
            </div>
            <motion.div variants={staggerContainer} initial="initial" animate="animate" className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              {p.aiInsights.map((insight) => (
                <AiInsightCard key={insight.id} insight={insight} />
              ))}
              <SectionCard title="Six-month trends" icon={Activity}>
                <div className="space-y-5">
                  {p.trends.map((t, i) => (
                    <div key={t.label}>
                      <div className="mb-1 flex items-baseline justify-between">
                        <p className="text-sm font-medium">{t.label}</p>
                        <p className="text-xs text-muted-foreground">{t.unit}</p>
                      </div>
                      <TrendAreaChart
                        data={t.points}
                        id={`${p.id}-trend-${i}`}
                        height={120}
                        color={i === 0 ? "--chart-1" : i === 1 ? "--chart-2" : "--chart-3"}
                      />
                    </div>
                  ))}
                </div>
              </SectionCard>
            </motion.div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  );
}
