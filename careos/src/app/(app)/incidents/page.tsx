"use client";

import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Siren, Sparkles, Timer } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { incidentRecords, incidentStats, incidentPathway, incidentDifference } from "@/data/incidents";
import { getParticipant } from "@/data/participants";
import { staggerContainer, fadeUp } from "@/lib/motion";

const severityBadge = {
  "reportable-24h": { label: "Reportable · 24h clock", variant: "destructive" as const },
  "reportable-5d": { label: "Reportable · 5-day clock", variant: "warning" as const },
  internal: { label: "Internal", variant: "muted" as const },
};

const stateBadge = {
  notified: { label: "Commission notified", variant: "success" as const },
  "clock-running": { label: "Clock running", variant: "warning" as const },
  investigating: { label: "Investigating", variant: "secondary" as const },
  closed: { label: "Closed + improved", variant: "muted" as const },
};

export default function IncidentsPage() {
  return (
    <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-8">
      <PageHeader
        eyebrow="Incident Manager"
        title="From first awareness to Commission-ready — on the clock."
        description="The Commission's 24-hour window starts the moment ANY worker becomes aware of a reportable incident — and missing it is one of the fastest routes to enforcement. In CareOS, capture is awareness: the classification, the countdown, the escalation and the Commission draft all start from the worker's first tap."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Open now" value={String(incidentStats.openNow)} icon={AlertTriangle} detail="all with owners and clocks" />
        <StatCard label="Reportable this quarter" value={String(incidentStats.reportableThisQuarter)} icon={Siren} detail="both notified in time" />
        <StatCard label="Median time to notify" value={incidentStats.medianTimeToNotify} icon={Timer} detail="vs a 24-hour requirement" />
        <StatCard label="On-time notifications" value={incidentStats.onTimeRate} icon={CheckCircle2} detail="since going live" />
      </div>

      {/* Incident feed */}
      <motion.div variants={fadeUp}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Live incident register</CardTitle>
            <CardDescription>
              Auto-classified against the Commission's six reportable categories. Clocks are visible to everyone who has to act — and they get louder as they run down.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {incidentRecords.map((r) => {
              const p = getParticipant(r.participantId)!;
              const sev = severityBadge[r.severity];
              const st = stateBadge[r.state];
              return (
                <div key={r.id} className="rounded-2xl border bg-background/60 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{r.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {p.preferredName} · {r.category} · raised by {r.raisedBy}, {r.raisedAt}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <Badge variant={sev.variant} className="font-normal">{sev.label}</Badge>
                      <Badge variant={st.variant} className="font-normal">{st.label}</Badge>
                    </div>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{r.clockNote}</p>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </motion.div>

      {/* Pathway */}
      <motion.div variants={fadeUp}>
        <Card className="border-primary/10 bg-gradient-to-br from-card to-primary-soft/40">
          <CardHeader>
            <CardTitle className="text-base">The pathway auditors ask to see — built in</CardTitle>
            <CardDescription>
              Certification audits assess incident management against Practice Standards Module 2A. This workflow is that module, with every step timestamped.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {incidentPathway.map((s, i) => (
              <div key={s.step} className="rounded-2xl border bg-card/70 p-4">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-soft text-xs font-semibold text-primary">
                    {i + 1}
                  </span>
                  <p className="text-sm font-semibold">{s.step}</p>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{s.detail}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.div>

      {/* The difference */}
      <motion.div variants={fadeUp}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
              The Incident Manager difference
            </CardTitle>
            <CardDescription>Most providers run this on paper forms and phone tag, with the registration on the line. CareOS runs it on the record that already exists.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {incidentDifference.map((d) => (
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
