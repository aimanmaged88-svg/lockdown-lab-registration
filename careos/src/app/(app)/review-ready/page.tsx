"use client";

import { motion } from "framer-motion";
import { FileCheck, FileText, ShieldCheck, Sparkles, Target, Timer } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { reviewStats, languageGuardExamples, evidencePackContents, reviewDifference } from "@/data/review-ready";
import { staggerContainer, fadeUp } from "@/lib/motion";

export default function ReviewReadyPage() {
  return (
    <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-8">
      <PageHeader
        eyebrow="Review Ready"
        title="Walk into every plan reassessment with the evidence stacked."
        description="Funding gets cut when evidence is missing — or when a well-meaning report says 'managing well with support' and a planner reads it as improvement. In CareOS, every shift note has been quietly filed as timestamped evidence since day one, an AI language guard protects reports from funding-losing phrasing, and the full pack builds in minutes."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Evidence items this plan" value={reviewStats.evidenceItemsThisPlan.toLocaleString("en-AU")} icon={FileText} detail="auto-captured from daily care" />
        <StatCard label="Goals with evidence" value={reviewStats.goalsWithEvidence} icon={Target} detail="every goal, real trend lines" />
        <StatCard label="Pack build time" value={reviewStats.packBuildTime} icon={Timer} detail="vs weeks of scrambling" />
        <StatCard label="Funding defended" value={reviewStats.fundingDefended} icon={ShieldCheck} detail="across reassessments this year" />
      </div>

      {/* Language guard */}
      <motion.div variants={fadeUp}>
        <Card className="border-primary/10 bg-gradient-to-br from-card to-primary-soft/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" />
              The language guard — one sentence can cost a family thousands
            </CardTitle>
            <CardDescription>
              CareOS reads every outgoing report the way a planner would, and suggests wording that tells the truth AND shows the functional need. The author always decides.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {languageGuardExamples.map((e) => (
              <div key={e.id} className="rounded-2xl border bg-card/70 p-4">
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-wide text-destructive">Flagged phrasing</p>
                    <p className="mt-1 text-sm">{e.flagged}</p>
                    <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{e.risk}</p>
                  </div>
                  <div className="rounded-xl bg-success-soft/50 p-3">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-success">Suggested instead</p>
                    <p className="mt-1 text-sm leading-relaxed">{e.suggested}</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.div>

      {/* Evidence pack */}
      <motion.div variants={fadeUp}>
        <Card>
          <CardHeader className="flex-col items-start gap-3 space-y-0 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base">The evidence pack — one click, consent-gated</CardTitle>
              <CardDescription>The exact chain planners must see: needs → supports → outcomes, with a year of timestamps behind it.</CardDescription>
            </div>
            <Button onClick={() => toast.success("Evidence pack built — 4 minutes", { description: "Zayd's reassessment pack: 5 sections, 1,240 evidence items, language-checked. Shared with Faraz and the support coordinator." })}>
              <FileCheck className="h-4 w-4" aria-hidden="true" />
              Build Zayd's pack
            </Button>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {evidencePackContents.map((c) => (
              <div key={c.item} className="rounded-2xl border bg-background/60 p-4">
                <p className="text-sm font-semibold">{c.item}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{c.detail}</p>
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
              The Review Ready difference
            </CardTitle>
            <CardDescription>Reassessments decide whether support continues. Nobody should face one armed with recollections.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {reviewDifference.map((d) => (
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
