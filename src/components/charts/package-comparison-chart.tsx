"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatINR } from "@/lib/calculations/shared";
import { CATEGORICAL_SEQUENCE, CHART_AXIS_TEXT_COLOR, CHART_GRID_COLOR } from "./chart-colors";
import { EmptyChart } from "./project-cost-chart";
import type { PackageComparisonPoint } from "@/lib/data/dashboard";

const TIER_LABEL: Record<PackageComparisonPoint["tier"], string> = {
  basic: "Basic",
  premium: "Premium",
  luxury: "Luxury",
};

export function PackageComparisonChart({ data }: { data: PackageComparisonPoint[] }) {
  if (data.length === 0) {
    return <EmptyChart message="No package comparisons created yet." />;
  }

  const chartData = data.map((d) => ({ tier: TIER_LABEL[d.tier], avgRatePerSqFt: d.avgRatePerSqFt }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={chartData} margin={{ top: 4, right: 8, bottom: 4, left: 8 }}>
        <CartesianGrid vertical={false} stroke={CHART_GRID_COLOR} />
        <XAxis
          dataKey="tier"
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
        <Tooltip
          formatter={(value) => `${formatINR(Number(value))} / sqft`}
          contentStyle={{ fontSize: 12, borderRadius: 8 }}
        />
        <Bar dataKey="avgRatePerSqFt" radius={[4, 4, 0, 0]}>
          {chartData.map((entry, i) => (
            <Cell key={entry.tier} fill={CATEGORICAL_SEQUENCE[i % CATEGORICAL_SEQUENCE.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
