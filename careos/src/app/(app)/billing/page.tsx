"use client";

import { motion } from "framer-motion";
import { Banknote, CheckCircle2, Receipt, Send, Sparkles, TrendingUp, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { billingStats, claimBatches, supportItems, billingDifference } from "@/data/billing";
import { staggerContainer, fadeUp } from "@/lib/motion";
import { cn } from "@/lib/utils";

const money = (n: number) => `$${n.toLocaleString("en-AU")}`;

const statusStyles = {
  ready: { badge: "default" as const, label: "Ready to claim" },
  submitted: { badge: "warning" as const, label: "Submitted" },
  paid: { badge: "success" as const, label: "Paid" },
};

export default function BillingPage() {
  return (
    <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-8">
      <PageHeader
        eyebrow="Billing & NDIS Claims"
        title="The shift you delivered is the claim you submit"
        description="No re-keying, no leakage. Confirmed shifts arrive pre-coded to the right NDIS support item and price. Bulk-claim to the NDIA and run payslips from the same single source of truth."
      >
        <Button onClick={() => toast.success("Bulk claim ready", { description: "34 lines · $18,420 built from this week's confirmed shifts, all price-guide checked. Review and submit to the NDIA." })}>
          <Send className="h-4 w-4" aria-hidden="true" />
          Build this week's claim
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Ready to claim" value={money(billingStats.readyToClaim)} icon={Receipt} detail="this week, pre-coded" />
        <StatCard label="Claimed this month" value={money(billingStats.claimedThisMonth)} icon={Banknote} change="+8%" direction="up" detail="vs last month" />
        <StatCard label="Awaiting payment" value={money(billingStats.awaitingPayment)} icon={Wallet} detail="submitted to NDIA" />
        <StatCard label="Claim accuracy" value={`${billingStats.claimAccuracy}%`} icon={CheckCircle2} change="+1.2%" direction="up" detail="accepted first time" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Claim batches */}
        <motion.div variants={fadeUp} className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-base">Claim batches</CardTitle>
              <CardDescription>Built automatically from confirmed shifts, week by week.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {claimBatches.map((batch) => {
                const style = statusStyles[batch.status];
                return (
                  <button
                    key={batch.id}
                    type="button"
                    onClick={() => toast(batch.period, { description: batch.note })}
                    className="flex w-full items-center gap-4 rounded-2xl border bg-background/60 p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold">{batch.period}</p>
                        <Badge variant={style.badge}>{style.label}</Badge>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">{batch.lines} lines · {batch.note}</p>
                    </div>
                    <p className="shrink-0 font-display text-lg font-semibold">{money(batch.value)}</p>
                  </button>
                );
              })}
            </CardContent>
          </Card>
        </motion.div>

        {/* Support items */}
        <motion.div variants={fadeUp}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-base">Top support items</CardTitle>
              <CardDescription>This week, auto-coded.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {supportItems.map((item) => (
                <div key={item.code} className="rounded-xl border bg-background/60 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium leading-snug">{item.name}</p>
                    <p className="shrink-0 text-sm font-semibold">{money(item.value)}</p>
                  </div>
                  <p className="mt-1 font-mono text-[11px] text-muted-foreground">{item.code} · {item.used} claims</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* The difference */}
      <motion.div variants={fadeUp}>
        <Card className="border-primary/10 bg-gradient-to-br from-card to-primary-soft/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
              Why this beats bolt-on billing
            </CardTitle>
            <CardDescription>Other tools bill from a separate system you have to feed. CareOS bills from the care itself.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {billingDifference.map((d) => (
              <div key={d.title} className="rounded-2xl bg-card/70 p-4">
                <div className="mb-2 w-fit rounded-lg bg-success-soft p-2 text-success">
                  <TrendingUp className="h-4 w-4" aria-hidden="true" />
                </div>
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
