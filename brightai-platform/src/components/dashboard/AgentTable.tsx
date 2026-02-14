import { memo } from "react";
import { Link } from "react-router-dom";
import { Bot, Copy, PauseCircle, Pencil, PlayCircle, Trash2 } from "lucide-react";
import { AGENT_FILTERS } from "../../constants/dashboard.constants";
import type { AgentRow, AgentStatus } from "../../types/dashboard.types";

type AgentTableProps = {
  loading: boolean;
  agents: AgentRow[];
  agentSearch: string;
  agentStatusFilter: "الكل" | AgentStatus;
  onAgentSearchChange: (value: string) => void;
  onAgentStatusFilterChange: (value: "الكل" | AgentStatus) => void;
  onAgentEdit: (agentId: string) => void;
  onAgentToggle: (agent: AgentRow) => void;
  onAgentClone: (agent: AgentRow) => void;
  onAgentDelete: (agent: AgentRow) => void;
  formatCompactNumber: (value: number) => string;
  toDisplayDateTime: (value: string | null) => string;
};

const statusClasses: Record<AgentStatus, string> = {
  "نشط": "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
  "مسودة": "border-slate-600 bg-slate-700/20 text-slate-200",
  "متوقف": "border-amber-500/30 bg-amber-500/10 text-amber-200",
  "معطل": "border-rose-500/30 bg-rose-500/10 text-rose-200",
  "قيد المراجعة": "border-sky-500/30 bg-sky-500/10 text-sky-200",
};

const StatusBadge = ({ status }: { status: AgentStatus }) => (
  <span className={`rounded-full border px-2 py-1 text-xs font-semibold ${statusClasses[status]}`}>
    {status}
  </span>
);

const AgentTable = ({
  loading,
  agents,
  agentSearch,
  agentStatusFilter,
  onAgentSearchChange,
  onAgentStatusFilterChange,
  onAgentEdit,
  onAgentToggle,
  onAgentClone,
  onAgentDelete,
  formatCompactNumber,
  toDisplayDateTime,
}: AgentTableProps) => {
  return (
    <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-4 backdrop-blur-xl md:p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-100">الوكلاء الحديثون</h2>
          <p className="text-xs text-slate-400">إدارة سريعة للوكلاء الأكثر نشاطًا</p>
        </div>
        <Link to="/agents/new" className="text-xs font-semibold text-emerald-300">
          عرض الكل
        </Link>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <input
          value={agentSearch}
          onChange={(event) => onAgentSearchChange(event.target.value)}
          placeholder="ابحث عن وكيل"
          className="min-h-[44px] flex-1 rounded-xl border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100"
        />
        <select
          value={agentStatusFilter}
          onChange={(event) => onAgentStatusFilterChange(event.target.value as "الكل" | AgentStatus)}
          className="min-h-[44px] rounded-xl border border-slate-700 bg-slate-900 px-3 text-sm text-slate-200"
        >
          {AGENT_FILTERS.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={`agent-loading-${index}`} className="h-48 animate-pulse rounded-2xl bg-slate-800/60" />
          ))}
        </div>
      ) : agents.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-slate-700 bg-slate-900/50 p-6 text-center text-sm text-slate-400">
          لا توجد وكلاء حالياً. ابدأ بإنشاء وكيل جديد لتحريك العمليات.
        </div>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {agents.map((agent) => (
            <article
              key={agent.id}
              className="group rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl transition hover:-translate-y-1 hover:border-emerald-400/40"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-300">
                  <Bot className="h-4 w-4" />
                </div>
                <StatusBadge status={agent.status} />
              </div>

              <h3 className="mt-3 text-sm font-bold text-slate-100">{agent.name}</h3>
              <p
                className="mt-2 min-h-[42px] text-xs text-slate-400"
                style={{
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {agent.description || "لا يوجد وصف لهذا الوكيل."}
              </p>

              <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-300">
                <div className="rounded-xl bg-slate-900/70 p-2">
                  <p className="text-slate-400">التنفيذات</p>
                  <p className="font-semibold">{formatCompactNumber(agent.execution_count)}</p>
                </div>
                <div className="rounded-xl bg-slate-900/70 p-2">
                  <p className="text-slate-400">نسبة النجاح</p>
                  <p className="font-semibold">{`${Math.round(agent.success_rate || 0)}%`}</p>
                </div>
              </div>

              <p className="mt-3 text-[11px] text-slate-500">
                آخر تعديل: {toDisplayDateTime(agent.updated_at)}
              </p>

              <div className="mt-3 flex flex-wrap gap-1">
                <Link
                  to={`/agents/${agent.id}`}
                  className="inline-flex min-h-[36px] items-center gap-1 rounded-lg border border-slate-700 px-2 text-xs text-slate-200 hover:border-emerald-400/40"
                  aria-label="تفاصيل"
                >
                  تفاصيل
                </Link>
                <button
                  type="button"
                  onClick={() => onAgentEdit(agent.id)}
                  className="inline-flex min-h-[36px] items-center gap-1 rounded-lg border border-slate-700 px-2 text-xs text-slate-200 hover:border-emerald-400/40"
                  aria-label="تعديل"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  تعديل
                </button>
                <button
                  type="button"
                  onClick={() => onAgentToggle(agent)}
                  className="inline-flex min-h-[36px] items-center gap-1 rounded-lg border border-slate-700 px-2 text-xs text-slate-200 hover:border-emerald-400/40"
                  aria-label="تشغيل أو إيقاف"
                >
                  {agent.status === "نشط" ? (
                    <PauseCircle className="h-3.5 w-3.5" />
                  ) : (
                    <PlayCircle className="h-3.5 w-3.5" />
                  )}
                  {agent.status === "نشط" ? "إيقاف" : "تشغيل"}
                </button>
                <button
                  type="button"
                  onClick={() => onAgentClone(agent)}
                  className="inline-flex min-h-[36px] items-center gap-1 rounded-lg border border-slate-700 px-2 text-xs text-slate-200 hover:border-emerald-400/40"
                  aria-label="نسخ"
                >
                  <Copy className="h-3.5 w-3.5" />
                  نسخ
                </button>
                <button
                  type="button"
                  onClick={() => onAgentDelete(agent)}
                  className="inline-flex min-h-[36px] items-center gap-1 rounded-lg border border-rose-700/60 px-2 text-xs text-rose-200 hover:border-rose-400/60"
                  aria-label="حذف"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  حذف
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default memo(AgentTable);
