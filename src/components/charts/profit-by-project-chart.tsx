"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatINR } from "@/lib/calculations/shared";
import { CHART_AXIS_TEXT_COLOR, CHART_COLORS, CHART_GRID_COLOR } from "./chart-colors";
import { EmptyChart } from "./project-cost-chart";
import type { ProfitBillingDashboard } from "@/lib/data/profit-billing";

export function ProfitByProjectChart({ data }: { data: ProfitBillingDashboard["profitByProject"] }) {
  if (data.length === 0) {
    return <EmptyChart message="Profit by project will appear once a project is billed." />;
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 4, right: 8, bottom: 4, left: 8 }}>
        <CartesianGrid vertical={false} stroke={CHART_GRID_COLOR} />
        <XAxis dataKey="label" tick={{ fontSize: 12, fill: CHART_AXIS_TEXT_COLOR }} tickLine={false} axisLine={{ stroke: CHART_GRID_COLOR }} />
        <YAxis tick={{ fontSize: 12, fill: CHART_AXIS_TEXT_COLOR }} tickLine={false} axisLine={false} tickFormatter={(v: number) => formatINR(v)} width={80} />
        <Tooltip formatter={(value) => formatINR(Number(value))} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="billed" name="Billed" fill={CHART_COLORS.blue} radius={[4, 4, 0, 0]} />
        <Bar dataKey="profit" name="Profit" fill={CHART_COLORS.green} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
