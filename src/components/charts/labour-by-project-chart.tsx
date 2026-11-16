"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatINR } from "@/lib/calculations/shared";
import { CHART_AXIS_TEXT_COLOR, CHART_COLORS, CHART_GRID_COLOR } from "./chart-colors";
import { EmptyChart } from "./project-cost-chart";
import type { LabourPaymentDashboard } from "@/lib/data/labour-payment";

export function LabourByProjectChart({ data }: { data: LabourPaymentDashboard["byProject"] }) {
  if (data.length === 0) {
    return <EmptyChart message="Labour by project will appear once attendance is linked to a project." />;
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 4, right: 8, bottom: 4, left: 8 }}>
        <CartesianGrid vertical={false} stroke={CHART_GRID_COLOR} />
        <XAxis dataKey="label" tick={{ fontSize: 12, fill: CHART_AXIS_TEXT_COLOR }} tickLine={false} axisLine={{ stroke: CHART_GRID_COLOR }} />
        <YAxis tick={{ fontSize: 12, fill: CHART_AXIS_TEXT_COLOR }} tickLine={false} axisLine={false} tickFormatter={(v: number) => formatINR(v)} width={80} />
        <Tooltip formatter={(value) => formatINR(Number(value))} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="allTime" name="All Time" fill={CHART_COLORS.blue} radius={[4, 4, 0, 0]} />
        <Bar dataKey="lastWeek" name="Last Week" fill={CHART_COLORS.plum} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
