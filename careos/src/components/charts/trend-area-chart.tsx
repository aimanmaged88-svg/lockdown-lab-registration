"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface TrendAreaChartProps {
  data: { period: string; value: number }[];
  color?: string; // css hsl var name, e.g. "--chart-1"
  unit?: string;
  height?: number;
  id: string;
}

/** Soft, story-telling area chart used for participant trends. */
export function TrendAreaChart({ data, color = "--chart-1", unit = "", height = 180, id }: TrendAreaChartProps) {
  const stroke = `hsl(var(${color}))`;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
        <defs>
          <linearGradient id={`fill-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity={0.25} />
            <stop offset="100%" stopColor={stroke} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 6" vertical={false} stroke="hsl(var(--border))" />
        <XAxis
          dataKey="period"
          tickLine={false}
          axisLine={false}
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
          dy={6}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
          width={44}
        />
        <Tooltip
          cursor={{ stroke: "hsl(var(--border))", strokeWidth: 1 }}
          contentStyle={{
            borderRadius: 12,
            border: "1px solid hsl(var(--border))",
            background: "hsl(var(--card))",
            color: "hsl(var(--foreground))",
            boxShadow: "0 8px 24px -8px rgb(16 24 40 / 0.16)",
            fontSize: 13,
          }}
          formatter={(value: number) => [`${value}${unit ? ` ${unit}` : ""}`, ""]}
          labelStyle={{ color: "hsl(var(--muted-foreground))", fontSize: 12 }}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke={stroke}
          strokeWidth={2.5}
          fill={`url(#fill-${id})`}
          animationDuration={900}
          animationEasing="ease-out"
          dot={false}
          activeDot={{ r: 4, strokeWidth: 2, stroke: "hsl(var(--card))" }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
