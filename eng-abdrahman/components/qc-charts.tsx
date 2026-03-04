"use client"

import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  LineChart,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import {
  ParetoPoint,
  TrendPoint,
  DonutPoint,
  CRITICAL_THRESHOLD,
} from "@/lib/dataProcessor"

// ── Shared colour palette ─────────────────────────────────────────────────────
const CHART_COLORS = ["#3b6fd4", "#2ca6a4", "#27ae60", "#f39c12", "#e74c3c", "#8e44ad"]

// ── Pareto Chart ─────────────────────────────────────────────────────────────
interface ParetoChartProps {
  data: ParetoPoint[]
}

export function ParetoChart({ data }: ParetoChartProps) {
  return (
    <div className="bg-card border border-border rounded-lg p-5">
      <p className="text-sm font-semibold text-foreground mb-1">
        Pareto Analysis — Rejection by Item
      </p>
      <p className="text-xs text-muted-foreground mb-4">
        Sorted by rejected quantity descending with cumulative %
      </p>
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={data} margin={{ top: 8, right: 32, left: 0, bottom: 40 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey="itemCode"
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            angle={-35}
            textAnchor="end"
            interval={0}
          />
          <YAxis
            yAxisId="left"
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            label={{
              value: "Rejected Qty",
              angle: -90,
              position: "insideLeft",
              offset: 10,
              style: { fontSize: 11, fill: "var(--muted-foreground)" },
            }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            domain={[0, 100]}
            tickFormatter={(v) => `${v}%`}
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            label={{
              value: "Cumulative %",
              angle: 90,
              position: "insideRight",
              offset: 10,
              style: { fontSize: 11, fill: "var(--muted-foreground)" },
            }}
          />
          <Tooltip
            contentStyle={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              fontSize: 12,
            }}
            formatter={(val: number, name: string) =>
              name === "cumulativePct" ? [`${val}%`, "Cumulative %"] : [val, "Rejected Qty"]
            }
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar yAxisId="left" dataKey="rejected" name="Rejected Qty" fill={CHART_COLORS[0]} radius={[3, 3, 0, 0]} />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="cumulativePct"
            name="Cumulative %"
            stroke={CHART_COLORS[4]}
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

// ── Trend Chart ───────────────────────────────────────────────────────────────
interface TrendChartProps {
  data: TrendPoint[]
}

export function TrendChart({ data }: TrendChartProps) {
  return (
    <div className="bg-card border border-border rounded-lg p-5">
      <p className="text-sm font-semibold text-foreground mb-1">
        Reject % Trend Over Time
      </p>
      <p className="text-xs text-muted-foreground mb-4">
        Daily average reject rate — red line marks the 5% critical threshold
      </p>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ top: 8, right: 24, left: 0, bottom: 40 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            angle={-35}
            textAnchor="end"
            interval={0}
          />
          <YAxis
            tickFormatter={(v) => `${v}%`}
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          />
          <Tooltip
            contentStyle={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              fontSize: 12,
            }}
            formatter={(val: number) => [`${val}%`, "Avg Reject %"]}
          />
          <ReferenceLine
            y={CRITICAL_THRESHOLD}
            stroke="#e74c3c"
            strokeDasharray="5 3"
            label={{
              value: "5% Threshold",
              position: "right",
              fill: "#e74c3c",
              fontSize: 11,
            }}
          />
          <Line
            type="monotone"
            dataKey="rejectPct"
            name="Avg Reject %"
            stroke={CHART_COLORS[0]}
            strokeWidth={2.5}
            dot={{ r: 3, fill: CHART_COLORS[0] }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

// ── Donut Chart ───────────────────────────────────────────────────────────────
interface DonutChartProps {
  data: DonutPoint[]
  title: string
  subtitle: string
}

const RADIAN = Math.PI / 180
function renderCustomLabel({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  name,
  percent,
}: {
  cx: number
  cy: number
  midAngle: number
  innerRadius: number
  outerRadius: number
  name: string
  percent: number
}) {
  if (percent < 0.05) return null
  const radius = innerRadius + (outerRadius - innerRadius) * 1.4
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)
  return (
    <text
      x={x}
      y={y}
      fill="var(--foreground)"
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
      fontSize={11}
    >
      {name} ({(percent * 100).toFixed(0)}%)
    </text>
  )
}

export function DonutChart({ data, title, subtitle }: DonutChartProps) {
  return (
    <div className="bg-card border border-border rounded-lg p-5 flex-1">
      <p className="text-sm font-semibold text-foreground mb-1">{title}</p>
      <p className="text-xs text-muted-foreground mb-4">{subtitle}</p>
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={3}
            dataKey="value"
            labelLine={false}
            label={renderCustomLabel}
          >
            {data.map((_, i) => (
              <Cell key={`cell-${i}`} fill={CHART_COLORS[i % CHART_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              fontSize: 12,
            }}
            formatter={(val: number) => [val, "Rejected Units"]}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
