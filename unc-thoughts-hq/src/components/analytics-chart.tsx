"use client";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

// Minimal, high-contrast chart. Off-white bars on ink. No decorative colour.
export function SavesChart({ data }: { data: { name: string; saves: number; reach: number }[] }) {
  if (!data.length) return <p className="text-sm text-grey">No data yet.</p>;
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: -12 }}>
          <CartesianGrid stroke="#26262a" vertical={false} />
          <XAxis dataKey="name" tick={{ fill: "#8a8a90", fontSize: 11 }} tickLine={false} axisLine={{ stroke: "#26262a" }} interval={0} angle={-20} textAnchor="end" height={50} />
          <YAxis tick={{ fill: "#8a8a90", fontSize: 11 }} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{ background: "#161618", border: "1px solid #333338", borderRadius: 12, color: "#f4f2ec" }}
            cursor={{ fill: "#ffffff08" }}
          />
          <Bar dataKey="saves" fill="#f4f2ec" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
