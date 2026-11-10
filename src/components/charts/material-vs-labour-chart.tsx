"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatINR } from "@/lib/calculations/shared";
import { CHART_COLORS } from "./chart-colors";
import { EmptyChart } from "./project-cost-chart";
import type { MaterialVsLabour } from "@/lib/data/dashboard";

export function MaterialVsLabourChart({ data }: { data: MaterialVsLabour }) {
  const total = data.materialCost + data.labourCost;
  if (total <= 0) {
    return <EmptyChart message="No BOQ line items yet to break down by material vs labour." />;
  }

  const slices = [
    { name: "Material", value: data.materialCost, color: CHART_COLORS.blue },
    { name: "Labour", value: data.labourCost, color: CHART_COLORS.bronze },
  ];

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={slices}
          dataKey="value"
          nameKey="name"
          innerRadius={60}
          outerRadius={95}
          paddingAngle={2}
          stroke="var(--background)"
          strokeWidth={2}
        >
          {slices.map((slice) => (
            <Cell key={slice.name} fill={slice.color} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => formatINR(Number(value))} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
