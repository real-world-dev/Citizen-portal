"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from "recharts";
import type { AdminStats } from "@/types";
import { PROPOSAL_CATEGORIES, PROPOSAL_STATUSES } from "@/types";

const CATEGORY_COLORS = [
  "#16294a", // navy-700
  "#c88a1c", // ochre-500
  "#2f4d87", // navy-500
  "#edbc4f", // ochre-300
  "#7b91c0", // navy-300
  "#a36c16", // ochre-600
  "#4f6dab", // navy-400
  "#9ca3af", // gray-400 (other)
];

const STATUS_COLORS: Record<string, string> = {
  received: "#9ca3af",
  in_review: "#e2a52c",
  scheduled: "#38bdf8",
  in_progress: "#2f4d87",
  done: "#22c55e",
  declined: "#ef4444",
};

const tooltipStyle = {
  borderRadius: 8,
  border: "1px solid #d3daea",
  fontSize: 13,
  fontFamily: "var(--font-public-sans)",
};

export function CategoryBarChart({ byCategory }: { byCategory: AdminStats["byCategory"] }) {
  const data = PROPOSAL_CATEGORIES.map((c) => ({ name: c.label, value: byCategory[c.value] }));
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} layout="vertical" margin={{ left: 20, right: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eef1f6" horizontal={false} />
        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} stroke="#7b91c0" />
        <YAxis
          type="category"
          dataKey="name"
          width={150}
          tick={{ fontSize: 12 }}
          stroke="#7b91c0"
        />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#f7f3ea" }} />
        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function StatusPieChart({ byStatus }: { byStatus: AdminStats["byStatus"] }) {
  const data = PROPOSAL_STATUSES.map((s) => ({ name: s.label, key: s.value, value: byStatus[s.value] })).filter(
    (d) => d.value > 0
  );
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={2}>
          {data.map((d) => (
            <Cell key={d.key} fill={STATUS_COLORS[d.key]} />
          ))}
        </Pie>
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Tooltip contentStyle={tooltipStyle} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function TrendLineChart({ trend }: { trend: AdminStats["trend"] }) {
  const data = trend.map((t) => ({
    ...t,
    label: new Date(t.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
  }));
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ left: 0, right: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eef1f6" />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#7b91c0" />
        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="#7b91c0" width={30} />
        <Tooltip contentStyle={tooltipStyle} />
        <Line type="monotone" dataKey="count" stroke="#c88a1c" strokeWidth={2.5} dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
