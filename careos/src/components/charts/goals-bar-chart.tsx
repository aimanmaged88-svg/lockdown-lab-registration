"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface GoalsBarChartProps {
  data: { category: string; achieved: number; active: number }[];
  height?: number;
}

export function GoalsBarChart({ data, height = 280 }: GoalsBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -20 }} barGap={4}>
        <CartesianGrid strokeDasharray="3 6" vertical={false} stroke="hsl(var(--border))" />
        <XAxis dataKey="category" tickLine={false} axisLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} dy={6} interval={0} />
        <YAxis tickLine={false} axisLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} width={40} />
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
        <Bar dataKey="achieved" name="Achieved this quarter" fill="hsl(var(--chart-3))" radius={[6, 6, 0, 0]} animationDuration={900} />
        <Bar dataKey="active" name="Active" fill="hsl(var(--chart-1))" radius={[6, 6, 0, 0]} animationDuration={900} />
      </BarChart>
    </ResponsiveContainer>
  );
}
