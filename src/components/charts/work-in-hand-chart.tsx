"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatINR } from "@/lib/calculations/shared";
import { CHART_AXIS_TEXT_COLOR, CHART_COLORS, CHART_GRID_COLOR } from "./chart-colors";
import { EmptyChart } from "./project-cost-chart";
import type { SiteTrackerDashboard } from "@/lib/data/site-tracker";

export function WorkInHandChart({ data }: { data: SiteTrackerDashboard["workInHandByProject"] }) {
  if (data.length === 0) {
    return <EmptyChart message="Work in hand by project will appear once active projects have BOQ estimates." />;
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 4, right: 8, bottom: 4, left: 8 }}>
        <CartesianGrid vertical={false} stroke={CHART_GRID_COLOR} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 12, fill: CHART_AXIS_TEXT_COLOR }}
          tickLine={false}
          axisLine={{ stroke: CHART_GRID_COLOR }}
        />
        <YAxis
          tick={{ fontSize: 12, fill: CHART_AXIS_TEXT_COLOR }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: number) => formatINR(v)}
          width={80}
        />
        <Tooltip formatter={(value) => formatINR(Number(value))} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
        <Bar dataKey="value" name="Work in hand" fill={CHART_COLORS.bronze} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
