"use client";

import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface Series {
  key: string;
  label: string;
  color: string; // css var name
}

interface OutcomeLinesChartProps {
  data: Record<string, string | number>[];
  xKey: string;
  series: Series[];
  height?: number;
}

/** Multi-series line chart for organisation-level outcome stories. */
export function OutcomeLinesChart({ data, xKey, series, height = 280 }: OutcomeLinesChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -14 }}>
        <CartesianGrid strokeDasharray="3 6" vertical={false} stroke="hsl(var(--border))" />
        <XAxis dataKey={xKey} tickLine={false} axisLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} dy={6} />
        <YAxis tickLine={false} axisLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} width={40} />
        <Tooltip
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
        {series.map((s) => (
          <Line
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.label}
            stroke={`hsl(var(${s.color}))`}
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2, stroke: "hsl(var(--card))" }}
            animationDuration={900}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
