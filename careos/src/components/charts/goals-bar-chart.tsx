"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface GoalsBarChartProps {
  data: { category: string; achieved: number; active: number }[];
  height?: number;
}

export function GoalsBarChart({ data, height = 280 }: GoalsBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      {/* Horizontal layout keeps the life-area labels fully readable at every width. */}
      <BarChart layout="vertical" data={data} margin={{ top: 4, right: 12, bottom: 0, left: 8 }} barGap={4}>
        <CartesianGrid strokeDasharray="3 6" horizontal={false} stroke="hsl(var(--border))" />
        <XAxis type="number" tickLine={false} axisLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
        <YAxis type="category" dataKey="category" tickLine={false} axisLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} width={92} />
        <Tooltip
          cursor={{ fill: "hsl(var(--muted) / 0.6)" }}
          contentStyle={{
            borderRadius: 12,
            border: "1px solid hsl(var(--border))",
            background: "hsl(var(--card))",
            color: "hsl(var(--foreground))",
            boxShadow: "0 8px 24px -8px rgb(16 24 40 / 0.16)",
            fontSize: 13,
          }}
        />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
        <Bar dataKey="achieved" name="Achieved this quarter" fill="hsl(var(--chart-3))" radius={[0, 6, 6, 0]} animationDuration={900} />
        <Bar dataKey="active" name="Active" fill="hsl(var(--chart-1))" radius={[0, 6, 6, 0]} animationDuration={900} />
      </BarChart>
    </ResponsiveContainer>
  );
}
