"use client";

import { motion } from "framer-motion";
import { PiggyBank, ShieldCheck, Sparkles, TrendingUp, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { participantBudgets, budgetStats, claimGuardChecks, budgetDifference } from "@/data/budgets";
import { getParticipant } from "@/data/participants";
import { staggerContainer, fadeUp } from "@/lib/motion";
import { cn } from "@/lib/utils";

const money = (n: number) => `$${n.toLocaleString("en-AU")}`;

const forecastBadge = {
  "on-track": { label: "On track", variant: "success" as const },
  watch: { label: "Watch", variant: "warning" as const },
  "will-run-short": { label: "Will run short", variant: "destructive" as const },
};

export default function BudgetsPage() {
  return (
    <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-8">
      <PageHeader
        eyebrow="Budget Guardian"
        title="No plan runs out by surprise. No claim ever bounces."
        description="Across the sector, participants discover mid-plan that funds are gone, and providers lose 30–60 days of cash flow to rejected claims. Budget Guardian forecasts every budget forward from real delivery pace, pre-validates every claim before submission, and shows families the same truth in plain language."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Plans tracked live" value={String(budgetStats.plansTracked)} icon={Wallet} detail="every category, every day" />
        <StatCard label="Forecast flags" value={String(budgetStats.forecastFlags)} icon={TrendingUp} detail="raised months early, with a fix" />
        <StatCard label="Claims pre-checked" value={budgetStats.claimsPreChecked} icon={ShieldCheck} detail="validated before submission" />
        <StatCard label="Rejection rate" value={budgetStats.rejectionRate} icon={PiggyBank} detail="sector norm is far higher" />
      </div>

      {/* Budget forecasts */}
      <motion.div variants={fadeUp}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Every budget, forecast forward</CardTitle>
            <CardDescription>
              We're ~49% through these plan years. Green means the pace holds; anything else comes with a suggested fix — months before it becomes a crisis.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {participantBudgets.map((b) => {
              const p = getParticipant(b.participantId)!;
              const usedPct = Math.round((b.used / b.allocated) * 100);
              const badge = forecastBadge[b.forecast];
              return (
                <div key={b.id} className="rounded-2xl border bg-background/60 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold">
                        {p.preferredName} · <span className="font-normal text-muted-foreground">{b.category}</span>
                      </p>
                      <p className="mt-0.5 text-xs tabular-nums text-muted-foreground">
                        {money(b.used)} of {money(b.allocated)} used ({usedPct}%)
                      </p>
                    </div>
                    <Badge variant={badge.variant} className="font-normal">{badge.label}</Badge>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted" role="img" aria-label={`${usedPct}% of budget used`}>
                    <div
                      className={cn(
                        "h-full rounded-full",
                        b.forecast === "on-track" && "bg-success",
                        b.forecast === "watch" && "bg-warning",
                        b.forecast === "will-run-short" && "bg-destructive"
                      )}
                      style={{ width: `${usedPct}%` }}
                    />
                  </div>
                  <p className="mt-2.5 text-xs leading-relaxed text-muted-foreground">{b.forecastNote}</p>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </motion.div>

      {/* Claim guard */}
      <motion.div variants={fadeUp}>
        <Card className="border-primary/10 bg-gradient-to-br from-card to-primary-soft/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" />
              Claim Guard — rejections caught before they happen
            </CardTitle>
            <CardDescription>
              The NDIA is moving to automated claim validation and a 90-day claim window. Claim Guard runs the same checks first — so a rejection can't take your cash flow hostage.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {claimGuardChecks.map((c) => (
              <div key={c.check} className="rounded-2xl border bg-card/70 p-4">
                <p className="text-sm font-semibold">{c.check}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{c.catchExample}</p>
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
              The Budget Guardian difference
            </CardTitle>
            <CardDescription>Half the sector's providers run at a loss and families carry the end-of-plan anxiety. Neither has to be true.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {budgetDifference.map((d) => (
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
