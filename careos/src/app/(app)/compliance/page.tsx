"use client";

import { motion } from "framer-motion";
import { AlertCircle, CalendarClock, CheckCircle2, FileCheck2, ShieldCheck, Sparkles, TriangleAlert, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/shared/page-header";
import { auditReadiness, attentionRequired, dueSoon, practiceStandards, autoEvidence, complianceFrameworks, type ControlStatus } from "@/data/compliance";
import { staggerContainer, fadeUp } from "@/lib/motion";
import { cn } from "@/lib/utils";

export default function CompliancePage() {
  return (
    <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-8">
      <PageHeader
        eyebrow="Compliance · Sunrise Support Collective"
        title="Always audit-ready — because the evidence writes itself"
        description="Worker records, participant files, sites and audit packs in one place. Every shift note, med sign-off and incident closure becomes practice-standard evidence the moment it's saved."
      >
        <Button onClick={() => toast.success("Audit pack assembling", { description: "A complete, indexed evidence pack for the NDIS Practice Standards is generating — ready to hand to an auditor." })}>
          <FileCheck2 className="h-4 w-4" aria-hidden="true" />
          Build audit pack
        </Button>
      </PageHeader>

      {/* Readiness hero */}
      <motion.section variants={fadeUp} aria-label="Audit readiness">
        <Card className="overflow-hidden border-success/20 bg-gradient-to-br from-card via-card to-success-soft/50">
          <CardContent className="flex flex-col gap-6 p-6 lg:flex-row lg:items-center lg:p-8">
            <div className="flex items-center gap-6">
              <div className="relative flex h-28 w-28 shrink-0 items-center justify-center" aria-hidden="true">
                <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
                  <circle cx="60" cy="60" r="52" fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
                  <motion.circle
                    cx="60" cy="60" r="52" fill="none"
                    stroke="hsl(var(--success))" strokeWidth="10" strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 52}
                    initial={{ strokeDashoffset: 2 * Math.PI * 52 }}
                    animate={{ strokeDashoffset: 2 * Math.PI * 52 * (1 - auditReadiness.overall / 100) }}
                    transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
                  />
                </svg>
                <div className="absolute text-center">
                  <p className="font-display text-3xl font-semibold">{auditReadiness.overall}%</p>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">ready</p>
                </div>
              </div>
              <div>
                <Badge variant="success" className="mb-2">
                  <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                  Audit-ready
                </Badge>
                <p className="font-display text-xl font-semibold">
                  {auditReadiness.documentsComplete} of {auditReadiness.documentsRequired} required documents complete
                </p>
                <p className="mt-1 max-w-md text-sm leading-relaxed text-muted-foreground">
                  Across the organisation, workers, participants and sites. Everything below is one click from its underlying evidence.
                </p>
              </div>
            </div>
            <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-4 lg:max-w-md lg:justify-self-end">
              {auditReadiness.scopes.map((s) => (
                <div key={s.name} className="rounded-2xl bg-card/80 p-4 text-center shadow-soft">
                  <p className="font-display text-2xl font-semibold">{s.percent}%</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{s.name}</p>
                  <p className="text-[11px] text-muted-foreground/70">{s.complete}/{s.required}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Attention required */}
        <motion.div variants={fadeUp}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TriangleAlert className="h-4 w-4 text-warning" aria-hidden="true" />
                Attention required
              </CardTitle>
              <CardDescription>Flagged automatically — with the fix already in motion.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {attentionRequired.map((item) => (
                <div key={item.id} className="flex items-start gap-3 rounded-xl border bg-background/60 p-3.5">
                  <AlertCircle className={cn("mt-0.5 h-4 w-4 shrink-0", item.severity === "overdue" ? "text-warning" : "text-destructive")} aria-hidden="true" />
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium">{item.title}</p>
                      <Badge variant={item.severity === "overdue" ? "warning" : "destructive"} className="capitalize">{item.severity}</Badge>
                    </div>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{item.detail}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Due in 30 days */}
        <motion.div variants={fadeUp}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CalendarClock className="h-4 w-4 text-primary" aria-hidden="true" />
                Due in the next 30 days
              </CardTitle>
              <CardDescription>Nothing expires by surprise. Renewals are booked before they lapse.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {dueSoon.map((item) => (
                <div key={item.id} className="flex items-center gap-3 rounded-xl border bg-background/60 p-3">
                  <div className="flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-xl bg-primary-soft text-primary">
                    <span className="text-sm font-bold leading-none">{item.days}</span>
                    <span className="text-[8px] uppercase">days</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.owner}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Frameworks & controls mapping */}
      <motion.div variants={fadeUp}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Frameworks & controls</CardTitle>
            <CardDescription>
              Every NDIS framework mapped to its controls — each one auto-linked to the everyday records that prove it. No spreadsheets, no scramble.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {complianceFrameworks.map((fw) => (
              <div key={fw.name} className="rounded-2xl border bg-background/60 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold">{fw.name}</p>
                    <p className="text-xs text-muted-foreground">{fw.version}</p>
                  </div>
                  <Badge variant={fw.coverage === 100 ? "success" : "warning"}>{fw.coverage}% mapped</Badge>
                </div>
                <div className="mt-3 overflow-x-auto scrollbar-thin">
                  <table className="w-full min-w-[440px] text-sm">
                    <thead>
                      <tr className="border-b text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                        <th scope="col" className="pb-2 pr-3 font-medium">Control</th>
                        <th scope="col" className="pb-2 pr-3 font-medium">Status</th>
                        <th scope="col" className="pb-2 pr-3 font-medium">Progress</th>
                        <th scope="col" className="pb-2 font-medium text-right">Evidence</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {fw.controls.map((c) => {
                        const st: Record<ControlStatus, { label: string; variant: "success" | "warning" | "muted" }> = {
                          implemented: { label: "Implemented", variant: "success" },
                          "in-progress": { label: "In progress", variant: "warning" },
                          "not-started": { label: "Not started", variant: "muted" },
                        };
                        return (
                          <tr key={c.id}>
                            <td className="py-2.5 pr-3 font-medium">{c.name}</td>
                            <td className="py-2.5 pr-3"><Badge variant={st[c.status].variant} className="font-normal">{st[c.status].label}</Badge></td>
                            <td className="py-2.5 pr-3">
                              <div className="flex items-center gap-2">
                                <Progress value={c.progress} indicatorClassName={c.status === "implemented" ? "bg-success" : "bg-warning"} className="h-1.5 w-16" />
                                <span className="text-xs tabular-nums text-muted-foreground">{c.progress}%</span>
                              </div>
                            </td>
                            <td className="py-2.5 text-right">
                              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                <FileCheck2 className="h-3.5 w-3.5" aria-hidden="true" />
                                {c.evidence}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.div>

      {/* Practice standards */}
      <motion.div variants={fadeUp}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">NDIS Practice Standards — evidence coverage</CardTitle>
            <CardDescription>Each standard, backed by real records from everyday care.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {practiceStandards.map((std) => (
              <div key={std.area} className="rounded-2xl border bg-background/60 p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">{std.area}</p>
                  {std.status === "evidenced" ? (
                    <Badge variant="success"><CheckCircle2 className="h-3 w-3" aria-hidden="true" />Evidenced</Badge>
                  ) : (
                    <Badge variant="warning">In progress</Badge>
                  )}
                </div>
                <Progress
                  value={std.status === "evidenced" ? 100 : 62}
                  indicatorClassName={std.status === "evidenced" ? "bg-success" : "bg-warning"}
                  className="mt-2.5"
                />
                <p className="mt-2 text-xs text-muted-foreground">{std.pieces} pieces of evidence linked</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.div>

      {/* The CareOS difference: auto-evidence */}
      <motion.div variants={fadeUp}>
        <Card className="border-primary/10 bg-gradient-to-br from-card to-primary-soft/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
              Compliance as a by-product of care
            </CardTitle>
            <CardDescription>
              Other tools make you gather documents. CareOS turns the work your team already does into audit evidence — automatically.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {autoEvidence.map((e) => (
              <div key={e.source} className="flex items-center gap-3 rounded-2xl bg-card/70 p-4">
                <div className="rounded-xl bg-secondary-soft p-2.5 text-secondary">
                  <FileCheck2 className="h-4 w-4" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium">{e.source}</p>
                  <p className="text-xs text-muted-foreground">
                    becomes <span className="font-medium text-foreground">{e.becomes}</span> · {e.count}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
