import { memo } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, CircleDashed, FileWarning } from "lucide-react";
import { EXECUTION_FILTERS } from "../../constants/dashboard.constants";
import type { ExecutionRow, ExecutionStatus } from "../../types/dashboard.types";
import {
  formatCurrency,
  formatDuration,
  jsonPreview,
  toDisplayDateTime,
} from "../../lib/dashboard.utils";

type ExecutionTableProps = {
  loading: boolean;
  executions: ExecutionRow[];
  executionFilter: "الكل" | ExecutionStatus;
  onExecutionFilterChange: (value: "الكل" | ExecutionStatus) => void;
  onSelectExecution: (execution: ExecutionRow) => void;
  agentNameMap: Map<string, string>;
};

const ExecutionTable = ({
  loading,
  executions,
  executionFilter,
  onExecutionFilterChange,
  onSelectExecution,
  agentNameMap,
}: ExecutionTableProps) => {
  return (
    <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-4 backdrop-blur-xl md:p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-100">التنفيذات الأخيرة</h2>
          <p className="text-xs text-slate-400">آخر 10 تنفيذات مع تحديث مباشر</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {EXECUTION_FILTERS.map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => onExecutionFilterChange(status)}
              className={`min-h-[38px] rounded-lg px-3 text-xs font-semibold ${
                executionFilter === status
                  ? "bg-emerald-500/20 text-emerald-200"
                  : "bg-slate-900 text-slate-300"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="mt-4 grid gap-2">
          {Array.from({ length: 10 }).map((_, index) => (
            <div key={`execution-loading-${index}`} className="h-12 animate-pulse rounded-lg bg-slate-800/60" />
          ))}
        </div>
      ) : executions.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-slate-700 bg-slate-900/50 p-6 text-center text-sm text-slate-400">
          لا توجد تنفيذات ضمن الفلتر الحالي.
        </div>
      ) : (
        <>
          <div className="mt-4 hidden overflow-x-auto md:block">
            <table className="w-full min-w-[900px] text-right text-xs">
              <thead className="text-slate-400">
                <tr className="border-b border-slate-800">
                  <th className="px-2 py-2">الوكيل</th>
                  <th className="px-2 py-2">الحالة</th>
                  <th className="px-2 py-2">المدخل</th>
                  <th className="px-2 py-2">المخرج</th>
                  <th className="px-2 py-2">المدة</th>
                  <th className="px-2 py-2">التكلفة</th>
                  <th className="px-2 py-2">الوقت</th>
                </tr>
              </thead>
              <tbody>
                {executions.map((item) => {
                  const retryCount = item.ai_attempts || 0;
                  return (
                  <tr
                    key={item.id}
                    className="cursor-pointer border-b border-slate-900/70 text-slate-200 transition hover:bg-slate-900/60"
                    onClick={() => onSelectExecution(item)}
                  >
                    <td className="px-2 py-2 font-semibold">
                      <div className="flex flex-col gap-1">
                        <span>{agentNameMap.get(item.agent_id) || "وكيل غير معروف"}</span>
                        {retryCount > 0 ? (
                          <span className="inline-flex w-fit rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold text-amber-200">
                            إعادة محاولة: {retryCount}
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-2 py-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-1 ${
                          item.status === "ناجح"
                            ? "bg-emerald-500/15 text-emerald-200"
                            : item.status === "فشل"
                            ? "bg-rose-500/15 text-rose-200"
                            : "bg-sky-500/15 text-sky-200"
                        }`}
                      >
                        {item.status === "ناجح" ? (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        ) : item.status === "فشل" ? (
                          <FileWarning className="h-3.5 w-3.5" />
                        ) : (
                          <CircleDashed className="h-3.5 w-3.5 animate-spin" />
                        )}
                        {item.status}
                      </span>
                    </td>
                    <td className="px-2 py-2 text-slate-300">{jsonPreview(item.input, 45)}</td>
                    <td className="px-2 py-2 text-slate-300">{jsonPreview(item.output, 45)}</td>
                    <td className="px-2 py-2">{formatDuration(item.duration_ms)}</td>
                    <td className="px-2 py-2">{formatCurrency(item.cost_usd || 0)}</td>
                    <td className="px-2 py-2 text-slate-400">{toDisplayDateTime(item.started_at)}</td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-4 grid gap-2 md:hidden">
            {executions.map((item) => {
              const retryCount = item.ai_attempts || 0;
              return (
              <button
                type="button"
                key={item.id}
                onClick={() => onSelectExecution(item)}
                className="rounded-xl border border-slate-800 bg-slate-900/50 p-3 text-right"
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-200">
                    {agentNameMap.get(item.agent_id) || "وكيل غير معروف"}
                  </p>
                  <span
                    className={`rounded-full px-2 py-1 text-[11px] font-semibold ${
                      item.status === "ناجح"
                        ? "bg-emerald-500/15 text-emerald-200"
                        : item.status === "فشل"
                        ? "bg-rose-500/15 text-rose-200"
                        : "bg-sky-500/15 text-sky-200"
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-400">{jsonPreview(item.input, 60)}</p>
                {retryCount > 0 ? (
                  <p className="mt-1 text-[11px] text-amber-300">إعادة محاولة: {retryCount}</p>
                ) : null}
                <p className="mt-1 text-[11px] text-slate-500">{toDisplayDateTime(item.started_at)}</p>
              </button>
              );
            })}
          </div>
        </>
      )}

      <div className="mt-4 text-left">
        <Link to="/analytics" className="text-xs font-semibold text-emerald-300">
          عرض كل التنفيذات
        </Link>
      </div>
    </div>
  );
};

export default memo(ExecutionTable);
