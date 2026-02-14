import { memo } from "react";
import Modal from "../ui/Modal";
import type { ExecutionRow } from "../../types/dashboard.types";
import {
  formatCompactNumber,
  formatCurrency,
  formatDuration,
  toDisplayDateTime,
} from "../../lib/dashboard.utils";

type ExecutionDetailsModalProps = {
  execution: ExecutionRow | null;
  agentNameMap: Map<string, string>;
  onClose: () => void;
};

const ExecutionDetailsModal = ({
  execution,
  agentNameMap,
  onClose,
}: ExecutionDetailsModalProps) => {
  const retryCount = execution?.ai_attempts || 0;
  const retryReasons = execution?.ai_retry_reasons || [];

  return (
    <Modal
      open={Boolean(execution)}
      onClose={onClose}
      size="xl"
      title="تفاصيل التنفيذ"
      header="تفاصيل المدخلات والمخرجات والتكلفة والمدة"
    >
      {execution ? (
        <div className="grid gap-4 text-sm">
          <div className="grid gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 md:grid-cols-3">
            <div>
              <p className="text-xs text-slate-400">الوكيل</p>
              <p className="font-semibold text-slate-100">
                {agentNameMap.get(execution.agent_id) || "وكيل غير معروف"}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400">الحالة</p>
              <p className="font-semibold text-slate-100">{execution.status}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">الوقت</p>
              <p className="font-semibold text-slate-100">{toDisplayDateTime(execution.started_at)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">المدة</p>
              <p className="font-semibold text-slate-100">{formatDuration(execution.duration_ms)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">التكلفة</p>
              <p className="font-semibold text-slate-100">{formatCurrency(execution.cost_usd || 0)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">الرموز</p>
              <p className="font-semibold text-slate-100">
                {formatCompactNumber(execution.tokens_used || 0)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400">الموديل</p>
              <p className="font-semibold text-slate-100">{execution.model_used || "غير محدد"}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">رقم التتبع</p>
              <p className="font-semibold text-slate-100">{execution.ai_trace_id || "-"}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">إعادات المحاولة</p>
              <p className="font-semibold text-slate-100">{retryCount}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">درجة الجودة</p>
              <p className="font-semibold text-slate-100">
                {execution.ai_quality_score === null
                  ? "-"
                  : `${Math.round(execution.ai_quality_score * 100)}%`}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400">اجتياز الجودة</p>
              <p className="font-semibold text-slate-100">
                {execution.ai_quality_passed === null
                  ? "-"
                  : execution.ai_quality_passed
                  ? "نعم"
                  : "لا"}
              </p>
            </div>
          </div>

          {retryReasons.length > 0 ? (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-100">
              <p className="mb-1 font-semibold">أسباب إعادة المحاولة</p>
              <ul className="list-inside list-disc space-y-1">
                {retryReasons.map((reason, index) => (
                  <li key={`${execution.id}-reason-${index}`}>{reason}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
              <p className="mb-2 text-xs text-slate-400">المدخل</p>
              <pre className="max-h-72 overflow-auto whitespace-pre-wrap break-words text-xs text-slate-200">
                {JSON.stringify(execution.input || {}, null, 2)}
              </pre>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
              <p className="mb-2 text-xs text-slate-400">المخرج</p>
              <pre className="max-h-72 overflow-auto whitespace-pre-wrap break-words text-xs text-slate-200">
                {JSON.stringify(execution.output || {}, null, 2)}
              </pre>
            </div>
          </div>

          {execution.error_message ? (
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-100">
              {execution.error_message}
            </div>
          ) : null}
        </div>
      ) : null}
    </Modal>
  );
};

export default memo(ExecutionDetailsModal);
