"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Lightbulb } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { fadeUp } from "@/lib/motion";
import type { Goal } from "@/types";
import { cn } from "@/lib/utils";

const statusConfig = {
  "on-track": { label: "On track", variant: "secondary" as const, bar: "bg-secondary" },
  achieved: { label: "Achieved", variant: "success" as const, bar: "bg-success" },
  "needs-attention": { label: "Needs attention", variant: "warning" as const, bar: "bg-warning" },
  new: { label: "New goal", variant: "default" as const, bar: "bg-primary" },
};

export function GoalCard({ goal, compact = false }: { goal: Goal; compact?: boolean }) {
  const status = statusConfig[goal.status];

  return (
    <motion.div variants={fadeUp}>
      <Card className="h-full">
        <CardContent className={cn("flex h-full flex-col gap-3", compact ? "p-4" : "p-5")}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{goal.category}</p>
              <h3 className={cn("mt-0.5 font-semibold leading-snug", compact ? "text-sm" : "text-base")}>{goal.title}</h3>
            </div>
            <Badge variant={status.variant} className="shrink-0">
              {goal.status === "achieved" && <CheckCircle2 className="h-3 w-3" aria-hidden="true" />}
              {status.label}
            </Badge>
          </div>

          {!compact && <p className="text-sm leading-relaxed text-muted-foreground">{goal.why}</p>}

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-semibold">{goal.progress}%</span>
            </div>
            <Progress value={goal.progress} indicatorClassName={status.bar} aria-label={`${goal.title}: ${goal.progress}% complete`} />
          </div>

          <div className="mt-auto flex items-start gap-2 rounded-xl bg-muted/60 p-3">
            <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" aria-hidden="true" />
            <p className="text-xs leading-relaxed text-muted-foreground">{goal.latestUpdate}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
