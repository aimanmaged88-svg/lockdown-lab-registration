"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Banknote, CheckCircle2, Clock, MapPin, Play, Send, Sparkles, Square, Users, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { PersonAvatar } from "@/components/shared/person-avatar";
import { clockEntries, timepayStats, timesheets, payRun, timepayDifference } from "@/data/timepay";
import { getParticipant } from "@/data/participants";
import { staggerContainer, fadeUp } from "@/lib/motion";
import { cn } from "@/lib/utils";

const money = (n: number) => `$${n.toLocaleString("en-AU")}`;

export default function TimePayPage() {
  const [clockedIn, setClockedIn] = React.useState(false);

  return (
    <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-8">
      <PageHeader
        eyebrow="Time & Pay"
        title="Clock in once. Timesheets, claims and pay do the rest."
        description="Tap to clock in from your phone — GPS-verified, no hardware. The same tap opens your Smart Shift briefing and flows your hours into the timesheet, the NDIS claim and the pay run. Payroll that took half a day now takes minutes."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="On shift now" value={String(timepayStats.onShiftNow)} icon={Users} detail="clocked in, GPS-verified" />
        <StatCard label="Hours this fortnight" value={String(timepayStats.hoursThisFortnight)} icon={Clock} detail="auto-captured" />
        <StatCard label="Timesheets auto-built" value={String(timepayStats.timesheetsAutoBuilt)} icon={CheckCircle2} detail="from verified shifts" />
        <StatCard label="Pay run ready" value={money(timepayStats.payRunReady)} icon={Wallet} detail="review & approve" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Your clock */}
        <motion.div variants={fadeUp}>
          <Card className={cn("h-full", clockedIn ? "border-success/20 bg-gradient-to-br from-card to-success-soft/40" : "border-primary/10 bg-gradient-to-br from-card to-primary-soft/40")}>
            <CardHeader>
              <CardTitle className="text-base">Your clock</CardTitle>
              <CardDescription>{clockedIn ? "You're on shift — briefing is open." : "Tap in when you arrive."}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4 py-6">
              <button
                type="button"
                onClick={() => {
                  setClockedIn((v) => !v);
                  if (!clockedIn) toast.success("Clocked in · location verified", { description: "Ava's Smart Shift briefing is open. Your hours are recording." });
                  else toast("Clocked out", { description: "2h 06m added to your timesheet and this fortnight's pay run." });
                }}
                className={cn(
                  "flex h-32 w-32 flex-col items-center justify-center rounded-full text-white shadow-lifted transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/40",
                  clockedIn ? "bg-gradient-to-br from-destructive to-rose-600" : "bg-gradient-to-br from-primary to-secondary"
                )}
                aria-label={clockedIn ? "Clock out" : "Clock in"}
              >
                {clockedIn ? <Square className="h-8 w-8" aria-hidden="true" /> : <Play className="ml-1 h-9 w-9" aria-hidden="true" />}
                <span className="mt-1.5 text-sm font-semibold">{clockedIn ? "Clock out" : "Clock in"}</span>
              </button>
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 text-success" aria-hidden="true" />
                Location verified · 12 Rossmoyne St, Coburg
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Who's on shift */}
        <motion.div variants={fadeUp} className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-base">Live now & today</CardTitle>
              <CardDescription>Every clock event is GPS-verified and flows straight to pay.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {clockEntries.map((e) => {
                const p = getParticipant(e.participantId)!;
                return (
                  <div key={e.id} className="flex items-center gap-3 rounded-xl border bg-background/60 p-3">
                    <PersonAvatar initials={e.initials} gradient="from-primary to-secondary" size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{e.worker}</p>
                      <p className="text-xs text-muted-foreground">with {p.preferredName}</p>
                    </div>
                    {e.locationVerified && (
                      <span className="hidden items-center gap-1 text-xs text-success sm:inline-flex">
                        <MapPin className="h-3 w-3" aria-hidden="true" />
                        verified
                      </span>
                    )}
                    <div className="text-right">
                      <p className="text-xs tabular-nums text-muted-foreground">
                        {e.clockIn}{e.clockOut ? ` – ${e.clockOut}` : ""}
                      </p>
                      {e.status === "on-shift" ? (
                        <Badge variant="success" className="mt-0.5">On shift</Badge>
                      ) : (
                        <Badge variant="muted" className="mt-0.5">Complete</Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Timesheets */}
      <motion.div variants={fadeUp}>
        <Card>
          <CardHeader className="flex-col items-start gap-3 space-y-0 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base">Timesheets · this fortnight</CardTitle>
              <CardDescription>Built automatically from verified shifts. Awards already applied.</CardDescription>
            </div>
            <Badge variant="secondary">Auto-built from {timepayStats.timesheetsAutoBuilt} shifts</Badge>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full min-w-[520px] text-sm">
                <thead>
                  <tr className="border-b text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                    <th scope="col" className="pb-2.5 pr-3 font-medium">Worker</th>
                    <th scope="col" className="pb-2.5 pr-3 font-medium">Shifts</th>
                    <th scope="col" className="pb-2.5 pr-3 font-medium">Ordinary</th>
                    <th scope="col" className="pb-2.5 pr-3 font-medium">Weekend</th>
                    <th scope="col" className="pb-2.5 pr-3 font-medium">Total</th>
                    <th scope="col" className="pb-2.5 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {timesheets.map((t) => (
                    <tr key={t.id}>
                      <td className="py-2.5 pr-3">
                        <div className="flex items-center gap-2">
                          <PersonAvatar initials={t.initials} gradient="from-primary to-secondary" size="sm" className="h-6 w-6 text-[10px]" />
                          <span className="font-medium">{t.worker}</span>
                        </div>
                      </td>
                      <td className="py-2.5 pr-3 tabular-nums text-muted-foreground">{t.shifts}</td>
                      <td className="py-2.5 pr-3 tabular-nums text-muted-foreground">{t.ordinaryHours}h</td>
                      <td className="py-2.5 pr-3 tabular-nums text-muted-foreground">{t.weekendHours}h</td>
                      <td className="py-2.5 pr-3 font-semibold tabular-nums">{t.total}h</td>
                      <td className="py-2.5">
                        <Badge variant={t.status === "verified" ? "success" : "warning"} className="font-normal">
                          {t.status === "verified" ? "Verified" : "Review"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Pay run */}
      <motion.div variants={fadeUp}>
        <Card className="border-primary/10 bg-gradient-to-br from-card to-primary-soft/40">
          <CardHeader className="flex-col items-start gap-3 space-y-0 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <Banknote className="h-4 w-4 text-primary" aria-hidden="true" />
                Pay run — {payRun.period}
              </CardTitle>
              <CardDescription>Drafted from verified timesheets. Review, approve, run.</CardDescription>
            </div>
            <Button onClick={() => toast.success("Pay run approved", { description: `${payRun.workers} workers · ${money(payRun.net)} net. ABA file and payslips generated; super lodged. Total time: a few minutes.` })}>
              <Send className="h-4 w-4" aria-hidden="true" />
              Review & run pay
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: "Workers", value: String(payRun.workers) },
                { label: "Gross", value: money(payRun.gross) },
                { label: "PAYG + super", value: money(payRun.tax + payRun.superAmount) },
                { label: "Net pay", value: money(payRun.net) },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl bg-card/70 p-4 text-center shadow-soft">
                  <p className="font-display text-xl font-semibold">{s.value}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* The difference */}
      <motion.div variants={fadeUp}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
              One source of truth, three chores gone
            </CardTitle>
            <CardDescription>Standalone time clocks capture hours. Standalone payroll re-enters them. CareOS does neither — it's all one flow.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {timepayDifference.map((d) => (
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
