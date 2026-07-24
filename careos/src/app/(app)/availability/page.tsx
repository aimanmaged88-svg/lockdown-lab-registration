"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { CalendarCheck2, CheckCircle2, Clock, Send, Sparkles, UserCheck, Users, Zap } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { PersonAvatar } from "@/components/shared/person-avatar";
import {
  workers,
  availabilityWindow,
  availabilityStats,
  shiftRows,
  dayCols,
  availabilityGrid,
  openShiftFills,
  availabilityDifference,
} from "@/data/availability";
import { staggerContainer, fadeUp } from "@/lib/motion";
import { cn } from "@/lib/utils";

const typeMeta = {
  permanent: { label: "Permanent", variant: "success" as const },
  casual: { label: "Casual", variant: "secondary" as const },
  "part-time": { label: "Part-time", variant: "muted" as const },
};

export default function AvailabilityPage() {
  const [grid, setGrid] = React.useState(availabilityGrid);
  const toggle = (r: number, c: number) =>
    setGrid((g) => g.map((row, ri) => (ri === r ? row.map((v, ci) => (ci === c ? !v : v)) : row)));

  return (
    <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-8">
      <PageHeader
        eyebrow="Smart Availability"
        title="Workers say when they can work. AI fills every spot — the right way."
        description="Support workers are prompted to submit their availability inside a window (or set it weeks ahead). The rostering team sees coverage build in real time, and the AI fills open shifts while it understands who's permanent — continuity-locked to a participant — and who's casual. People keep their person; nothing is left uncovered."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Availability submitted" value={availabilityStats.submittedLabel} icon={CalendarCheck2} detail={`window closes in ${availabilityWindow.closesIn}`} />
        <StatCard label="Open shifts" value={String(availabilityStats.openShifts)} icon={Clock} detail="AI has matches ready" />
        <StatCard label="Coverage after AI fill" value={`${availabilityStats.coverageAfterAi}%`} icon={CheckCircle2} detail="continuity protected" />
        <StatCard label="Permanent / casual" value={`${availabilityStats.permanent} / ${availabilityStats.casual}`} icon={Users} detail="workforce mix" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Worker's availability submission */}
        <motion.div variants={fadeUp} className="lg:col-span-3">
          <Card className="h-full">
            <CardHeader className="flex-col items-start gap-3 space-y-0 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-base">Your availability</CardTitle>
                <CardDescription>Tap the slots you can work. Closes {availabilityWindow.closesOn} — or set it in advance.</CardDescription>
              </div>
              <Badge variant="warning" className="font-normal">Closes in {availabilityWindow.closesIn}</Badge>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto scrollbar-thin">
                <table className="w-full min-w-[520px] border-separate border-spacing-1">
                  <thead>
                    <tr>
                      <th className="w-24" />
                      {dayCols.map((d) => (
                        <th key={d} className="pb-1 text-center text-[11px] font-semibold text-muted-foreground">{d}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {shiftRows.map((label, r) => (
                      <tr key={label}>
                        <td className="pr-2 text-right text-xs font-medium text-muted-foreground">{label}</td>
                        {dayCols.map((d, c) => {
                          const on = grid[r][c];
                          return (
                            <td key={d}>
                              <button
                                type="button"
                                onClick={() => toggle(r, c)}
                                aria-pressed={on}
                                aria-label={`${label} ${d} ${on ? "available" : "unavailable"}`}
                                className={cn(
                                  "h-9 w-full rounded-lg border text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                  on ? "border-transparent bg-primary text-white" : "border-border bg-background/60 text-muted-foreground hover:bg-muted"
                                )}
                              >
                                {on ? "✓" : ""}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <input type="checkbox" defaultChecked className="h-3.5 w-3.5 rounded accent-[hsl(var(--primary))]" />
                  Repeat this pattern each week until I change it
                </label>
                <Button onClick={() => toast.success("Availability submitted", { description: "Sent to the rostering team and factored into next week's AI draft. You'll get shift offers that fit." })}>
                  <Send className="h-4 w-4" aria-hidden="true" />
                  Submit availability
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* AI gap-fill */}
        <motion.div variants={fadeUp} className="lg:col-span-2">
          <Card className="h-full border-primary/10 bg-gradient-to-br from-card to-primary-soft/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Zap className="h-4 w-4 text-primary" aria-hidden="true" />
                AI gap-fill
              </CardTitle>
              <CardDescription>Two open shifts. The AI protects continuity first, then flexes casuals.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {openShiftFills.map((f) => (
                <div key={f.id} className="rounded-2xl bg-card/70 p-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-foreground">{f.when}</p>
                    <Badge variant="muted" className="font-normal">{f.participant}</Badge>
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{f.reason}</p>
                  <div className="mt-2.5 flex items-center gap-2">
                    <PersonAvatar initials={f.suggestedInitials} gradient="from-primary to-secondary" size="sm" className="h-7 w-7 text-[10px]" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{f.suggested}</p>
                      <p className="text-[11px] text-muted-foreground">AI's pick</p>
                    </div>
                    <Badge variant={typeMeta[f.suggestedType].variant} className="font-normal">{typeMeta[f.suggestedType].label}</Badge>
                  </div>
                </div>
              ))}
              <Button className="w-full" onClick={() => toast.success("Both shifts offered", { description: "Leila (Idris) and Priya (Jordan) notified. Coverage now 100%, continuity protected, award hours within cap." })}>
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                Offer both & reach 100%
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Workforce by employment type */}
      <motion.div variants={fadeUp}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <UserCheck className="h-4 w-4 text-primary" aria-hidden="true" />
              Your team — permanent &amp; casual
            </CardTitle>
            <CardDescription>Employment type drives the AI. Permanent workers stay with their participant; casuals flex to fill.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {workers.map((w) => {
              const t = typeMeta[w.type];
              return (
                <div key={w.id} className="flex items-center gap-3 rounded-xl border bg-background/60 p-3">
                  <PersonAvatar initials={w.initials} gradient="from-primary to-secondary" size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium">{w.name}</p>
                      <Badge variant={t.variant} className="font-normal">
                        {t.label}{w.assignedTo ? ` · ${w.assignedTo}` : ""}
                      </Badge>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">{w.note}</p>
                  </div>
                  <div className="hidden text-right sm:block">
                    <p className="text-xs tabular-nums text-muted-foreground">{w.hoursThisWeek}/{w.maxHours}h</p>
                    {w.submitted ? (
                      <Badge variant="success" className="mt-0.5 font-normal">Submitted</Badge>
                    ) : (
                      <Badge variant="warning" className="mt-0.5 font-normal">Reminder sent</Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </motion.div>

      {/* The difference */}
      <motion.div variants={fadeUp}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
              The Smart Availability difference
            </CardTitle>
            <CardDescription>Others collect availability in a separate app. CareOS turns it into a filled, continuity-safe roster in the same source of truth.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {availabilityDifference.map((d) => (
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
