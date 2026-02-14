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
          </div>

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
