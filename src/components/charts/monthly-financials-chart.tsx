"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatINR } from "@/lib/calculations/shared";
import { CHART_AXIS_TEXT_COLOR, CHART_COLORS, CHART_GRID_COLOR, STATUS_COLORS } from "./chart-colors";
import { EmptyChart } from "./project-cost-chart";
import type { MonthlyFinancials } from "@/lib/data/dashboard";

const hasAnyData = (data: MonthlyFinancials[]) =>
  data.some((d) => d.revenue !== 0 || d.expenses !== 0);

export function MonthlyRevenueExpensesChart({ data }: { data: MonthlyFinancials[] }) {
  if (!hasAnyData(data)) {
    return <EmptyChart message="No sent/approved quotations or recorded expenses yet." />;
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 4, right: 8, bottom: 4, left: 8 }}>
        <CartesianGrid vertical={false} stroke={CHART_GRID_COLOR} />
        <XAxis
          dataKey="month"
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
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="revenue" name="Revenue" fill={CHART_COLORS.blue} radius={[4, 4, 0, 0]} />
        <Bar dataKey="expenses" name="Expenses" fill={CHART_COLORS.bronze} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ProfitabilityTrendChart({ data }: { data: MonthlyFinancials[] }) {
  if (!hasAnyData(data)) {
    return <EmptyChart message="Profitability trends will appear once quotations and expenses are recorded." />;
  }

  const allNonNegative = data.every((d) => d.profit >= 0);

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 4, right: 8, bottom: 4, left: 8 }}>
        <CartesianGrid vertical={false} stroke={CHART_GRID_COLOR} />
        <XAxis
          dataKey="month"
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
        <Line
          type="monotone"
          dataKey="profit"
          name="Profit"
          stroke={allNonNegative ? STATUS_COLORS.positive : STATUS_COLORS.negative}
          strokeWidth={2}
          dot={{ r: 3 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
