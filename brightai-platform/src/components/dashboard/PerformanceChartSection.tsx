import { lazy, memo, Suspense } from "react";
import type {
  ChartMetricKey,
  DashboardChartPoint,
} from "./MainPerformanceChart";
import { DASHBOARD_PERIODS } from "../../constants/dashboard.constants";
import type { ChartPeriod } from "../../types/dashboard.types";

type PerformanceChartSectionProps = {
  loading: boolean;
  chartPeriod: ChartPeriod;
  onChartPeriodChange: (value: ChartPeriod) => void;
  chartMetric: ChartMetricKey;
  onChartMetricChange: (value: ChartMetricKey) => void;
  chartData: DashboardChartPoint[];
};

const MainPerformanceChart = lazy(() => import("./MainPerformanceChart"));

const metrics: Array<{ key: ChartMetricKey; label: string }> = [
  { key: "executions", label: "تنفيذات" },
  { key: "successRate", label: "نسبة نجاح" },
  { key: "cost", label: "تكلفة" },
  { key: "tokens", label: "الرموز" },
];

const PerformanceChartSection = ({
  loading,
  chartPeriod,
  onChartPeriodChange,
  chartMetric,
  onChartMetricChange,
  chartData,
}: PerformanceChartSectionProps) => {
  return (
    <section className="rounded-3xl border border-white/10 bg-slate-950/70 p-4 backdrop-blur-xl md:p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-100">أداء التنفيذات</h2>
          <p className="text-xs text-slate-400">عرض تحليلي ديناميكي حسب الفترة ونوع القياس</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {DASHBOARD_PERIODS.map((period) => (
            <button
              key={period}
              type="button"
              onClick={() => onChartPeriodChange(period)}
              className={`min-h-[40px] rounded-xl px-3 py-2 text-xs font-semibold transition ${
                chartPeriod === period
                  ? "bg-emerald-500/20 text-emerald-200"
                  : "bg-slate-900 text-slate-300 hover:bg-slate-800"
              }`}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {metrics.map((metric) => (
          <button
            key={metric.key}
            type="button"
            onClick={() => onChartMetricChange(metric.key)}
            className={`min-h-[40px] rounded-xl border px-3 py-2 text-xs font-semibold transition ${
              chartMetric === metric.key
                ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-200"
                : "border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500"
            }`}
          >
            {metric.label}
          </button>
        ))}
      </div>

      <div className="mt-4 h-[340px]">
        {loading ? (
          <div className="h-full animate-pulse rounded-2xl bg-slate-800/60" />
        ) : (
          <Suspense fallback={<div className="h-full animate-pulse rounded-2xl bg-slate-800/60" />}>
            <MainPerformanceChart data={chartData} metric={chartMetric} />
          </Suspense>
        )}
      </div>
    </section>
  );
};

export default memo(PerformanceChartSection);
