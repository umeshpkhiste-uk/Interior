"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CHART_AXIS_TEXT_COLOR, CHART_COLORS, CHART_GRID_COLOR } from "./chart-colors";
import { EmptyChart } from "./project-cost-chart";
import type { SiteTrackerDashboard } from "@/lib/data/site-tracker";

export function SiteVisitsByWeekChart({ data }: { data: SiteTrackerDashboard["siteVisitsByWeek"] }) {
  if (data.every((d) => d.visits === 0)) {
    return <EmptyChart message="Site visits by week will appear once you log visits." />;
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 4, right: 8, bottom: 4, left: 8 }}>
        <CartesianGrid vertical={false} stroke={CHART_GRID_COLOR} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: CHART_AXIS_TEXT_COLOR }}
          tickLine={false}
          axisLine={{ stroke: CHART_GRID_COLOR }}
        />
        <YAxis tick={{ fontSize: 12, fill: CHART_AXIS_TEXT_COLOR }} tickLine={false} axisLine={false} width={32} />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
        <Bar dataKey="visits" name="Site visits" fill={CHART_COLORS.green} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
