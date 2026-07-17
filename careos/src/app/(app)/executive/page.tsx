"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, CircleDot, Eye, FileDown, Quote, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { OutcomeLinesChart } from "@/components/charts/outcome-lines-chart";
import { organisation, outcomeSummary, ceoQuestions, familyEngagementSeries } from "@/data/organisation";
import { participants } from "@/data/participants";
import { useRole } from "@/providers/role-provider";
import { staggerContainer, fadeUp } from "@/lib/motion";
import { cn } from "@/lib/utils";

const statusConfig = {
  positive: { icon: CheckCircle2, className: "border-success/20 bg-success-soft/40", iconClass: "text-success", label: "Strong" },
  watch: { icon: Eye, className: "border-warning/20 bg-warning-soft/40", iconClass: "text-warning", label: "Watching" },
  action: { icon: CircleDot, className: "border-primary/25 bg-primary-soft/50", iconClass: "text-primary", label: "Your move" },
};

/**
 * The CEO dashboard answers one question first:
 * "Are we genuinely improving people's lives?"
 */
export default function ExecutivePage() {
  const { definition } = useRole();
  const firstName = definition.demoUser.name.split(" ")[0];

  return (
    <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-8">
      <PageHeader
        eyebrow={`Prepared for ${definition.demoUser.name} · ${organisation.name} · Wednesday 15 July 2026`}
        title={`Good morning, ${firstName}. Are we genuinely improving people's lives?`}
        description="Yes — and here is the evidence, the honest caveats, and the one decision that needs you today."
      >
        <Button variant="soft" asChild>
          <a href="/executive-brief.pdf" download>
            <FileDown className="h-4 w-4" aria-hidden="true" />
            Board brief (PDF)
          </a>
        </Button>
      </PageHeader>

      {/* Organisation health hero */}
      <motion.section variants={fadeUp} aria-label="Organisation health">
        <Card className="overflow-hidden border-primary/15 bg-gradient-to-br from-card via-card to-primary-soft/50">
          <CardContent className="flex flex-col gap-6 p-6 md:flex-row md:items-center md:p-8">
            <div className="flex items-center gap-6">
              <div className="relative flex h-28 w-28 shrink-0 items-center justify-center" aria-hidden="true">
                <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
                  <circle cx="60" cy="60" r="52" fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
                  <motion.circle
                    cx="60" cy="60" r="52" fill="none"
                    stroke="hsl(var(--primary))" strokeWidth="10" strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 52}
                    initial={{ strokeDashoffset: 2 * Math.PI * 52 }}
                    animate={{ strokeDashoffset: 2 * Math.PI * 52 * (1 - outcomeSummary.outcomesIndex / 100) }}
                    transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
                  />
                </svg>
                <div className="absolute text-center">
                  <p className="font-display text-3xl font-semibold">{outcomeSummary.outcomesIndex}</p>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">of 100</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Organisation health score</p>
                <p className="mt-1 font-display text-xl font-semibold">
                  Strong, and improving
                </p>
                <p className="mt-1 max-w-md text-sm leading-relaxed text-muted-foreground">
                  Composite of participant outcomes, family engagement, staff consistency and safeguarding quality. Up {outcomeSummary.outcomesIndexDelta} points this quarter.
                </p>
              </div>
            </div>
            <div className="grid flex-1 grid-cols-2 gap-3 md:max-w-sm md:justify-self-end">
              {[
                { label: "People supported", value: organisation.participants },
                { label: "Goals achieved (Q)", value: outcomeSummary.goalsAchievedThisQuarter },
                { label: "Families active weekly", value: `${outcomeSummary.familyEngagementRate}%` },
                { label: "Open incidents", value: outcomeSummary.incidentsOpen },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl bg-card/80 p-4 text-center shadow-soft">
                  <p className="font-display text-2xl font-semibold">{s.value}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.section>

      {/* The five questions */}
      <motion.section variants={fadeUp} aria-label="The five questions every CEO asks">
        <h2 className="mb-4 font-display text-xl font-semibold">Five questions, answered honestly</h2>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {ceoQuestions.map((q) => {
            const config = statusConfig[q.status];
            const Icon = config.icon;
            return (
              <div key={q.question} className={cn("flex h-full flex-col gap-2 rounded-2xl border p-5", config.className)}>
                <div className="flex items-center justify-between gap-2">
                  <Icon className={cn("h-4 w-4", config.iconClass)} aria-hidden="true" />
                  <Badge variant="muted" className="font-normal">{config.label}</Badge>
                </div>
                <p className="font-semibold leading-snug">{q.question}</p>
                <p className="text-sm leading-relaxed text-muted-foreground">{q.answer}</p>
              </div>
            );
          })}
          <div className="flex h-full flex-col justify-between gap-3 rounded-2xl border border-dashed p-5">
            <p className="text-sm leading-relaxed text-muted-foreground">
              Every answer above links to its underlying data — no number in CareOS is more than two clicks from the people behind it.
            </p>
            <Button variant="soft" size="sm" asChild>
              <Link href="/provider">
                Open the operational view
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </div>
      </motion.section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <motion.div variants={fadeUp} className="xl:col-span-3">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Family engagement is compounding</CardTitle>
              <CardDescription>Portal visits and family notes since February — trust, measured monthly.</CardDescription>
            </CardHeader>
            <CardContent>
              <OutcomeLinesChart
                data={familyEngagementSeries}
                xKey="month"
                series={[
                  { key: "visits", label: "Portal visits", color: "--chart-2" },
                  { key: "notes", label: "Family notes", color: "--chart-5" },
                ]}
              />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={fadeUp} className="xl:col-span-2">
          <Card className="h-full border-secondary/20 bg-gradient-to-br from-card to-secondary-soft/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Quote className="h-4 w-4 text-secondary" aria-hidden="true" />
                Why we do this
              </CardTitle>
              <CardDescription>This month, from the people and families we support.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <blockquote className="rounded-2xl bg-card/80 p-4 shadow-soft">
                <p className="text-sm italic leading-relaxed">
                  “Jordan cooked us dinner Saturday — three courses. They looked so proud. Whatever you're all doing, keep doing it.”
                </p>
                <footer className="mt-2 text-xs text-muted-foreground">Kate, Jordan's sister</footer>
              </blockquote>
              <blockquote className="rounded-2xl bg-card/80 p-4 shadow-soft">
                <p className="text-sm italic leading-relaxed">
                  “Milo showed Freya his animation frames and narrated the whole thing with his iPad. We were in tears.”
                </p>
                <footer className="mt-2 text-xs text-muted-foreground">Sarah, Milo's mum</footer>
              </blockquote>
              <div className="flex items-center gap-2 rounded-xl bg-card/60 p-3 text-xs text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
                AI surfaces these from consented family notes — a monthly reminder that the metrics are people.
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* People behind the numbers */}
      <motion.section variants={fadeUp} aria-label="The people behind the numbers">
        <Card>
          <CardHeader>
            <CardTitle>The people behind the numbers</CardTitle>
            <CardDescription>Three of the 86 lives your organisation is changing right now.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {participants.map((p) => (
                <Link
                  key={p.id}
                  href={`/participants/${p.id}`}
                  className="group rounded-2xl border bg-background/60 p-4 transition-all hover:-translate-y-0.5 hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <p className="text-sm font-semibold">{p.preferredName}, {p.age}</p>
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{p.tagline}</p>
                  <p className="mt-3 flex items-center gap-1 text-xs font-medium text-primary">
                    {p.goals.filter((g) => g.status === "achieved").length ? "Goal achieved this year" : "New goal underway"}
                    <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                  </p>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.section>
    </motion.div>
  );
}
