"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { ChevronDown, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fadeUp } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { AiInsight } from "@/types";

const confidenceLabel = {
  emerging: { text: "Emerging pattern", variant: "muted" as const },
  moderate: { text: "Moderate confidence", variant: "secondary" as const },
  strong: { text: "Strong pattern", variant: "success" as const },
};

/**
 * An AI observation with its reasoning always one tap away.
 * AI never diagnoses and never acts alone — it surfaces, people decide.
 */
export function AiInsightCard({ insight }: { insight: AiInsight }) {
  const [open, setOpen] = React.useState(false);
  const confidence = confidenceLabel[insight.confidence];
  const reasonsId = `insight-reasons-${insight.id}`;

  return (
    <motion.div variants={fadeUp}>
      <Card className="h-full border-primary/10 bg-gradient-to-br from-card to-primary-soft/30">
        <CardContent className="flex h-full flex-col gap-3 p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-primary-soft p-1.5 text-primary">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              </div>
              <Badge variant={confidence.variant}>{confidence.text}</Badge>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold leading-snug">{insight.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{insight.summary}</p>
          </div>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls={reasonsId}
            className="flex items-center gap-1 self-start text-xs font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
          >
            Why the AI thinks this
            <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-200", open && "rotate-180")} aria-hidden="true" />
          </button>

          {open && (
            <ul id={reasonsId} className="space-y-1.5 rounded-xl bg-card/80 p-3 text-xs leading-relaxed text-muted-foreground">
              {insight.because.map((reason) => (
                <li key={reason} className="flex gap-2">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                  {reason}
                </li>
              ))}
            </ul>
          )}

          {insight.suggestedAction && (
            <p className="mt-auto rounded-xl bg-secondary-soft p-3 text-xs leading-relaxed text-secondary">
              <span className="font-semibold">For the team to consider: </span>
              {insight.suggestedAction}
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
