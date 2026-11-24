"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCad } from "@ookf/shared";

type ChartPoint = {
  date: string;
  revenue: number;
  orders?: number;
};

export function DashboardRevenueChart({ data }: { data: ChartPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <defs>
          <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#003F2D" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#003F2D" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#E8E2D6" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} minTickGap={24} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip
          formatter={(value, _name, item) => {
            const orders = Number(
              (item?.payload as { orders?: number } | undefined)?.orders ?? 0
            );
            return [
              `${formatCad(Math.round(Number(value ?? 0) * 100))} · ${orders} paid`,
              "Revenue",
            ];
          }}
          labelFormatter={(label) => `Date ${label}`}
        />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="#003F2D"
          fill="url(#revFill)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
