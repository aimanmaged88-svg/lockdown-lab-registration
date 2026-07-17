"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  Building2,
  ClipboardCheck,
  HeartHandshake,
  ShieldCheck,
  Target,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { PersonAvatar } from "@/components/shared/person-avatar";
import { OutcomeLinesChart } from "@/components/charts/outcome-lines-chart";
import { GoalsBarChart } from "@/components/charts/goals-bar-chart";
import { organisation, outcomeSummary, monthlyOutcomes, goalsByCategory, teamPulse, riskHeatmap } from "@/data/organisation";
import { participants } from "@/data/participants";
import { staggerContainer, fadeUp } from "@/lib/motion";
import { cn } from "@/lib/utils";

const riskStyles = {
  low: "bg-success-soft text-success",
  medium: "bg-warning-soft text-warning",
  high: "bg-destructive-soft text-destructive",
} as const;

/** Provider dashboard: outcomes first, administration second. */
export default function ProviderPage() {
  return (
    <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-8">
      <PageHeader
        eyebrow={organisation.name}
        title="Outcomes across the organisation"
        description="86 people supported by 34 staff — and every number below is really a story about someone's life."
      >
        <Button variant="soft" asChild>
          <Link href="/reports">
            Generate board pack
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Participant outcomes index" value={String(outcomeSummary.outcomesIndex)} icon={Target} change={`+${outcomeSummary.outcomesIndexDelta}`} direction="up" detail="this quarter" />
        <StatCard label="Goals achieved this quarter" value={String(outcomeSummary.goalsAchievedThisQuarter)} icon={ClipboardCheck} change="+12" direction="up" detail="vs last quarter" />
        <StatCard label="Family engagement" value={`${outcomeSummary.familyEngagementRate}%`} icon={HeartHandshake} change="+9pts" direction="up" detail="weekly active families" />
        <StatCard label="Staff consistency" value={`${outcomeSummary.staffConsistencyScore}%`} icon={Users} change="+1pt" direction="up" detail="core-team shift coverage" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <motion.div variants={fadeUp} className="xl:col-span-3">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>The outcomes story</CardTitle>
              <CardDescription>Outcome index, family engagement and staff consistency — moving together, as they should.</CardDescription>
            </CardHeader>
            <CardContent>
              <OutcomeLinesChart
                data={monthlyOutcomes}
                xKey="month"
                series={[
                  { key: "outcomes", label: "Outcomes index", color: "--chart-1" },
                  { key: "engagement", label: "Family engagement", color: "--chart-2" },
                  { key: "consistency", label: "Staff consistency", color: "--chart-3" },
                ]}
              />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={fadeUp} className="xl:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Goals by life area</CardTitle>
              <CardDescription>Where energy is going, and where it's paying off.</CardDescription>
            </CardHeader>
            <CardContent>
              <GoalsBarChart data={goalsByCategory} />
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Quality & risk */}
        <motion.div variants={fadeUp}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" />
                Quality & risk
              </CardTitle>
              <CardDescription>Live indicators — reviewed weekly, escalated instantly.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {riskHeatmap.map((risk) => (
                <div key={risk.area} className="flex items-start gap-3 rounded-xl border bg-background/60 p-3.5">
                  <Badge className={cn("mt-0.5 shrink-0 capitalize", riskStyles[risk.level])}>{risk.level}</Badge>
                  <div>
                    <p className="text-sm font-medium">{risk.area}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{risk.detail}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Team pulse */}
        <motion.div variants={fadeUp}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-secondary" aria-hidden="true" />
                Team pulse
              </CardTitle>
              <CardDescription>The people doing the work, and what they're proud of this week.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {teamPulse.map((member) => (
                <div key={member.name} className="flex items-start gap-3 rounded-xl border bg-background/60 p-3.5">
                  <PersonAvatar
                    initials={member.name.split(" ").map((n) => n[0]).join("")}
                    gradient="from-primary to-secondary"
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold">{member.name}</p>
                      <span className="text-xs text-muted-foreground">{member.role}</span>
                    </div>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{member.highlight}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold">{member.notesQuality}%</p>
                    <p className="text-[11px] text-muted-foreground">notes quality</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Participants needing attention */}
      <motion.div variants={fadeUp}>
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" aria-hidden="true" />
                Participant snapshot
              </CardTitle>
              <CardDescription>The demo cohort — every organisation metric traces back to people like these.</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/participants">
                All participants
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {participants.map((p) => {
                const needsAttention = p.goals.filter((g) => g.status === "needs-attention").length;
                return (
                  <Link
                    key={p.id}
                    href={`/participants/${p.id}`}
                    className="flex items-center gap-3 rounded-2xl border bg-background/60 p-4 transition-all hover:-translate-y-0.5 hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <PersonAvatar initials={p.initials} gradient={p.gradient} size="md" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">{p.preferredName}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.goals.filter((g) => g.status !== "achieved").length} active goals
                      </p>
                    </div>
                    {needsAttention > 0 ? (
                      <Badge variant="warning" className="shrink-0">review {needsAttention}</Badge>
                    ) : (
                      <Badge variant="success" className="shrink-0">on track</Badge>
                    )}
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
