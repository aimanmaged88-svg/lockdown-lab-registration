"use client";

import { motion } from "framer-motion";
import { Heart, HeartPulse, Sparkles, TrendingDown, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { PersonAvatar } from "@/components/shared/person-avatar";
import { workerPulses, wellbeingStats, kudosFeed, wellbeingDifference } from "@/data/wellbeing";
import { staggerContainer, fadeUp } from "@/lib/motion";

const flagBadge = {
  thriving: { label: "Thriving", variant: "success" as const },
  steady: { label: "Steady", variant: "secondary" as const },
  "check-in": { label: "Check in", variant: "warning" as const },
};

export default function WellbeingPage() {
  return (
    <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-8">
      <PageHeader
        eyebrow="Team Pulse"
        title="Keep the people who keep everyone else going."
        description="43% of NDIS workers report burnout at least half the time, and the sector loses roughly 1 in 4 workers a year — with 8 weeks to refill each role. Team Pulse reads the roster like a wellbeing instrument: load fairness, rest patterns and quiet warning signs, plus a recognition loop that lets families say thank you where workers actually see it."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Team pulse" value={wellbeingStats.teamPulse} icon={HeartPulse} detail="fortnightly 2-tap check-in" />
        <StatCard label="On watch" value={String(wellbeingStats.onWatch)} icon={TrendingDown} detail="patterns flagged, fixes drafted" />
        <StatCard label="Turnover, rolling year" value={wellbeingStats.turnover} icon={Trophy} detail="sector runs ~26% for casuals" />
        <StatCard label="Kudos this month" value={String(wellbeingStats.kudosThisMonth)} icon={Heart} detail="from families, peers & leads" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Pulse board */}
        <motion.div variants={fadeUp} className="lg:col-span-3">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-base">Pulse board — patterns, not surveillance</CardTitle>
              <CardDescription>
                Built from the roster data that already runs payroll: hours vs preferences, rest between shifts, declined offers. Workers see their own pulse first.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {workerPulses.map((w) => {
                const badge = flagBadge[w.flag];
                return (
                  <div key={w.id} className="rounded-2xl border bg-background/60 p-4">
                    <div className="flex items-center gap-3">
                      <PersonAvatar initials={w.initials} gradient="from-primary to-secondary" size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{w.worker}</p>
                        <p className="text-xs tabular-nums text-muted-foreground">
                          {w.hoursThisFortnight}h of {w.preferredHours}h preferred · {w.daysSinceProperBreak} days since a proper break
                        </p>
                      </div>
                      <Badge variant={badge.variant} className="font-normal">{badge.label}</Badge>
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{w.note}</p>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </motion.div>

        {/* Kudos */}
        <motion.div variants={fadeUp} className="lg:col-span-2">
          <Card className="h-full border-primary/10 bg-gradient-to-br from-card to-primary-soft/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Heart className="h-4 w-4 text-primary" aria-hidden="true" />
                Kudos — recognition that reaches workers
              </CardTitle>
              <CardDescription>Families and colleagues say thank you in the app; it lands on the worker's phone and in their review file.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {kudosFeed.map((k) => (
                <div key={k.id} className="rounded-2xl border bg-card/70 p-4">
                  <p className="text-sm leading-relaxed">“{k.message}”</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {k.from} → {k.to} · {k.when}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* The difference */}
      <motion.div variants={fadeUp}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
              The Team Pulse difference
            </CardTitle>
            <CardDescription>Retention isn't a perk program — it's roster design, fairness and being seen. All three live in the same system here.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {wellbeingDifference.map((d) => (
              <div key={d.title} className="rounded-2xl border bg-background/60 p-4">
                <p className="text-sm font-semibold">{d.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{d.detail}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
