"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatINR } from "@/lib/calculations/shared";
import { CHART_AXIS_TEXT_COLOR, CHART_COLORS, CHART_GRID_COLOR } from "./chart-colors";
import type { ProjectCostPoint } from "@/lib/data/dashboard";

export function ProjectCostChart({ data }: { data: ProjectCostPoint[] }) {
  if (data.length === 0) {
    return <EmptyChart message="No BOQ estimates yet — costs will appear here once a project has BOQ line items." />;
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 4, right: 8, bottom: 4, left: 8 }}>
        <CartesianGrid vertical={false} stroke={CHART_GRID_COLOR} />
        <XAxis
          dataKey="projectName"
          tick={{ fontSize: 12, fill: CHART_AXIS_TEXT_COLOR }}
          tickLine={false}
          axisLine={{ stroke: CHART_GRID_COLOR }}
          interval={0}
          angle={-20}
          textAnchor="end"
          height={50}
        />
        <YAxis
          tick={{ fontSize: 12, fill: CHART_AXIS_TEXT_COLOR }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: number) => formatINR(v)}
          width={80}
        />
        <Tooltip
          formatter={(value) => formatINR(Number(value))}
          contentStyle={{ fontSize: 12, borderRadius: 8 }}
        />
        <Bar dataKey="estimatedCost" fill={CHART_COLORS.blue} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex h-[260px] items-center justify-center rounded-md border border-dashed text-center text-sm text-muted-foreground">
      <p className="max-w-xs px-4">{message}</p>
    </div>
  );
}
