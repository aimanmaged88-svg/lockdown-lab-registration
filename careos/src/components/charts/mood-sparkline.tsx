"use client";

import { Area, AreaChart, ResponsiveContainer, YAxis } from "recharts";
import type { MoodPoint } from "@/types";

/** Tiny 7-day mood line used inside participant cards. */
export function MoodSparkline({ data, id }: { data: MoodPoint[]; id: string }) {
  return (
    <ResponsiveContainer width="100%" height={36}>
      <AreaChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={`spark-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--secondary))" stopOpacity={0.3} />
            <stop offset="100%" stopColor="hsl(var(--secondary))" stopOpacity={0} />
          </linearGradient>
        </defs>
        <YAxis domain={[1, 5]} hide />
        <Area
          type="monotone"
          dataKey="score"
          stroke="hsl(var(--secondary))"
          strokeWidth={2}
          fill={`url(#spark-${id})`}
          dot={false}
          animationDuration={700}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
