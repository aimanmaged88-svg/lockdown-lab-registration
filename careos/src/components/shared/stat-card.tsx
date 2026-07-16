"use client";

import { motion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight, Minus, type LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { fadeUp } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  icon?: LucideIcon;
  change?: string;
  direction?: "up" | "down" | "steady";
  /** Whether the direction represents a good outcome (colours follow meaning, not direction). */
  positive?: boolean;
  detail?: string;
  className?: string;
}

export function StatCard({ label, value, icon: Icon, change, direction, positive = true, detail, className }: StatCardProps) {
  const DirectionIcon = direction === "up" ? ArrowUpRight : direction === "down" ? ArrowDownRight : Minus;
  return (
    <motion.div variants={fadeUp}>
      <Card className={cn("h-full", className)}>
        <CardContent className="flex h-full flex-col justify-between gap-3 p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            {Icon && (
              <div className="rounded-xl bg-primary-soft p-2 text-primary">
                <Icon className="h-4 w-4" aria-hidden="true" />
              </div>
            )}
          </div>
          <div>
            <p className="font-display text-3xl font-semibold tracking-tight">{value}</p>
            {(change || detail) && (
              <p className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
                {change && (
                  <span
                    className={cn(
                      "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-medium",
                      positive ? "bg-success-soft text-success" : "bg-warning-soft text-warning"
                    )}
                  >
                    <DirectionIcon className="h-3 w-3" aria-hidden="true" />
                    {change}
                  </span>
                )}
                {detail && <span>{detail}</span>}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
