import { memo, useMemo } from "react";
import {
  Area,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type ChartMetricKey = "executions" | "successRate" | "cost" | "tokens";

export type DashboardChartPoint = {
  label: string;
  executions: number;
  successRate: number;
  cost: number;
  tokens: number;
};

type MainPerformanceChartProps = {
  data: DashboardChartPoint[];
  metric: ChartMetricKey;
};

type MetricConfig = {
  label: string;
  color: string;
  suffix: string;
  decimals: number;
};

const metricConfig: Record<ChartMetricKey, MetricConfig> = {
  executions: {
    label: "عدد التنفيذات",
    color: "#34d399",
    suffix: "",
    decimals: 0,
  },
  successRate: {
    label: "نسبة النجاح",
    color: "#38bdf8",
    suffix: "%",
    decimals: 1,
  },
  cost: {
    label: "التكلفة",
    color: "#f59e0b",
    suffix: " ر.س",
    decimals: 2,
  },
  tokens: {
    label: "عدد الرموز",
    color: "#a78bfa",
    suffix: "",
    decimals: 0,
  },
};

const formatNumber = (value: number, decimals = 0) => {
  return new Intl.NumberFormat("ar-SA", {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals > 0 ? Math.min(decimals, 1) : 0,
  }).format(value);
};

const MainPerformanceChart = ({ data, metric }: MainPerformanceChartProps) => {
  const config = metricConfig[metric];

  const safeData = useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) {
      return [{ label: "لا توجد بيانات", executions: 0, successRate: 0, cost: 0, tokens: 0 }];
    }
    return data;
  }, [data]);

  const maxValue = useMemo(() => {
    const value = Math.max(...safeData.map((item) => item[metric]), 1);
    if (metric === "successRate") {
      return Math.max(100, Math.ceil(value));
    }
    return Math.ceil(value * 1.15);
  }, [metric, safeData]);

  return (
    <div className="h-full w-full rounded-2xl border border-white/10 bg-slate-950/40 p-3" dir="rtl">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={safeData} margin={{ top: 14, right: 12, left: 0, bottom: 8 }}>
          <defs>
            <linearGradient id="brightai-main-chart-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={config.color} stopOpacity={0.45} />
              <stop offset="100%" stopColor={config.color} stopOpacity={0.03} />
            </linearGradient>
          </defs>

          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
            tick={{ fill: "#94a3b8", fontSize: 11 }}
            dy={10}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#94a3b8", fontSize: 11 }}
            tickFormatter={(value) => formatNumber(Number(value), metric === "cost" ? 1 : 0)}
            width={50}
            domain={[0, maxValue]}
          />

          <Tooltip
            cursor={{ stroke: "#334155", strokeDasharray: "4 4" }}
            contentStyle={{
              background: "rgba(2, 6, 23, 0.95)",
              border: "1px solid rgba(148, 163, 184, 0.35)",
              borderRadius: "12px",
              color: "#e2e8f0",
              direction: "rtl",
              textAlign: "right",
            }}
            labelStyle={{ color: "#cbd5e1", marginBottom: "6px" }}
            formatter={(value: number | string | undefined) => {
              const numeric = Number(value) || 0;
              const formatted = `${formatNumber(numeric, config.decimals)}${config.suffix}`;
              return [formatted, config.label];
            }}
            labelFormatter={(label) => `الفترة: ${label}`}
          />

          <Area
            type="monotone"
            dataKey={metric}
            stroke={config.color}
            fill="url(#brightai-main-chart-fill)"
            strokeWidth={2.4}
            activeDot={{
              r: 5,
              fill: config.color,
              stroke: "#0f172a",
              strokeWidth: 2,
            }}
            dot={false}
            animationDuration={500}
            isAnimationActive
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default memo(MainPerformanceChart);
