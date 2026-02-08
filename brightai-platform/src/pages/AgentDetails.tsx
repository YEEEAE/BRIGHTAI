import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ComponentType,
} from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { List, type CellComponentProps } from "react-window";
import supabase from "../lib/supabase";

const supabaseClient = supabase as unknown as {
  from: (table: string) => any;
  channel: (name: string) => any;
  removeChannel: (channel: unknown) => void;
};

type AgentRow = {
  id: string;
  name: string;
  description: string | null;
  status: "نشط" | "متوقف" | "قيد المراجعة";
  is_public: boolean;
  category: string | null;
  workflow: Record<string, unknown> | null;
  settings: Record<string, unknown> | null;
  created_at: string;
};

type ExecutionRow = {
  id: string;
  status: "ناجح" | "فشل" | "قيد التنفيذ";
  started_at: string | null;
  duration_ms: number | null;
  tokens_used: number | null;
  cost_usd: number | null;
};

const tabs = ["نظرة عامة", "التنفيذات", "الإعدادات", "التحليلات"];
const VirtualList = List as unknown as ComponentType<any>;

const AgentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [agent, setAgent] = useState<AgentRow | null>(null);
  const [executions, setExecutions] = useState<ExecutionRow[]>([]);
  const [activeTab, setActiveTab] = useState("نظرة عامة");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [executionFilter, setExecutionFilter] = useState("الكل");
  const [userId, setUserId] = useState<string | null>(null);

  const loadAgent = useCallback(async () => {
    if (!id) {
      navigate("/dashboard", { replace: true });
      return null;
    }
    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData.session;
    if (!session) {
      navigate("/login", { replace: true });
      return null;
    }
    setUserId(session.user.id);
    setLoading(true);
    const { data: agentData } = await supabaseClient
      .from("agents")
      .select("id, name, description, status, is_public, category, workflow, settings, created_at")
      .eq("id", id)
      .eq("user_id", session.user.id)
      .maybeSingle();
    if (!agentData) {
      setErrorMessage("لا تملك صلاحية الوصول إلى هذا الوكيل.");
      setLoading(false);
      window.setTimeout(() => {
        navigate("/dashboard", { replace: true });
      }, 1200);
      return session.user.id;
    }
    const { data: executionsData } = await supabaseClient
      .from("executions")
      .select("id, status, started_at, duration_ms, tokens_used, cost_usd")
      .eq("agent_id", id)
      .eq("user_id", session.user.id)
      .order("started_at", { ascending: false });

    setAgent(agentData as AgentRow);
    setExecutions((executionsData || []) as ExecutionRow[]);
    setLoading(false);
    return session.user.id;
  }, [id, navigate]);

  useEffect(() => {
    document.title = "تفاصيل الوكيل | منصة برايت أي آي";
    loadAgent();
  }, [loadAgent]);

  useEffect(() => {
    let channel: any;
    let active = true;

    const init = async () => {
      const currentUserId = await loadAgent();
      if (!currentUserId || !id || !active) {
        return;
      }
      channel = supabaseClient
        .channel(`agent-${id}-updates`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "agents", filter: `id=eq.${id}` },
          () => {
            loadAgent();
          }
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "executions", filter: `agent_id=eq.${id}` },
          () => {
            loadAgent();
          }
        )
        .subscribe();
    };

    init();

    return () => {
      active = false;
      if (channel) {
        supabaseClient.removeChannel(channel);
      }
    };
  }, [id, loadAgent]);

  const filteredExecutions = useMemo(() => {
    return executions.filter((execution) =>
      executionFilter === "الكل" ? true : execution.status === executionFilter
    );
  }, [executionFilter, executions]);

  const ExecutionRow = useCallback(
    ({
      index,
      style,
      ariaAttributes,
    }: CellComponentProps & {
      index: number;
      style: CSSProperties;
      ariaAttributes?: Record<string, string | number>;
    }) => {
      const execution = filteredExecutions[index];
      if (!execution) {
        return null;
      }
      const attrs =
        (ariaAttributes as Record<string, string | number>) || {};
      return (
        <div style={style} className="px-2" {...attrs}>
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">{execution.id}</span>
              <span className="text-xs text-emerald-300">{execution.status}</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-400">
              <span>
                {execution.started_at
                  ? new Date(execution.started_at).toLocaleString("ar-SA")
                  : "غير محدد"}
              </span>
              <span>
                المدة: {Math.round((execution.duration_ms || 0) / 1000)} ثانية
              </span>
              <span>الرموز: {execution.tokens_used || 0}</span>
            </div>
          </div>
        </div>
      );
    },
    [filteredExecutions]
  );

  const stats = useMemo(() => {
    const total = executions.length;
    const success = executions.filter((item) => item.status === "ناجح").length;
    const failure = executions.filter((item) => item.status === "فشل").length;
    return {
      total,
      successRate: total ? Math.round((success / total) * 100) : 0,
      failure,
    };
  }, [executions]);

  const chartData = useMemo(() => {
    return executions
      .filter((execution) => execution.started_at)
      .slice(0, 12)
      .map((execution) => ({
        label: new Date(execution.started_at as string).toLocaleDateString("ar-SA", {
          day: "numeric",
          month: "short",
        }),
        duration: Math.round((execution.duration_ms || 0) / 1000),
        cost: Number((execution.cost_usd || 0).toFixed(2)),
      }))
      .reverse();
  }, [executions]);

  const handleToggleStatus = async () => {
    if (!agent) {
      return;
    }
    const nextStatus = agent.status === "نشط" ? "متوقف" : "نشط";
    await supabaseClient
      .from("agents")
      .update({ status: nextStatus })
      .eq("id", agent.id)
      .eq("user_id", userId);
    setAgent({ ...agent, status: nextStatus });
  };

  const handleDelete = async () => {
    if (!agent) {
      return;
    }
    if (!window.confirm("هل أنت متأكد من حذف الوكيل؟")) {
      return;
    }
    await supabaseClient.from("agents").delete().eq("id", agent.id).eq("user_id", userId);
    navigate("/dashboard", { replace: true });
  };

  const handleClone = async () => {
    if (!agent) {
      return;
    }
    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData.session;
    if (!session) {
      navigate("/login", { replace: true });
      return;
    }
    const { data } = await supabaseClient
      .from("agents")
      .insert({
        name: `نسخة من ${agent.name}`,
        description: agent.description,
        category: agent.category,
        workflow: agent.workflow,
        settings: agent.settings,
        status: "نشط",
        is_public: false,
        user_id: session.user.id,
      })
      .select("id")
      .single();
    if (data?.id) {
      navigate(`/agents/${data.id}`, { replace: true });
    }
  };

  const handleExport = () => {
    if (!agent) {
      return;
    }
    const payload = {
      name: agent.name,
      description: agent.description,
      category: agent.category,
      workflow: agent.workflow,
      settings: agent.settings,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${agent.name || "وكيل"}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    if (!agent) {
      return;
    }
    const next = !agent.is_public;
    await supabaseClient
      .from("agents")
      .update({ is_public: next })
      .eq("id", agent.id)
      .eq("user_id", userId);
    setAgent({ ...agent, is_public: next });
  };

  if (loading || !agent) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-10">
        <div className="h-40 animate-pulse rounded-2xl bg-slate-800" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8">
      <header className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs text-emerald-300">تفاصيل الوكيل</p>
            <h1 className="text-2xl font-bold text-slate-100">{agent.name}</h1>
            <p className="mt-1 text-sm text-slate-400">{agent.description || "بدون وصف"}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              to={`/agents/${agent.id}/builder`}
              className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-200"
            >
              تعديل
            </Link>
            <button
              type="button"
              onClick={handleToggleStatus}
              className="rounded-xl border border-emerald-500/40 px-4 py-2 text-sm text-emerald-200"
            >
              {agent.status === "نشط" ? "إيقاف" : "تشغيل"}
            </button>
            <button
              type="button"
              onClick={handleClone}
              className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-200"
            >
              نسخ
            </button>
            <button
              type="button"
              onClick={handleExport}
              className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-200"
            >
              تصدير
            </button>
            <button
              type="button"
              onClick={handleShare}
              className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-200"
            >
              {agent.is_public ? "إلغاء المشاركة" : "مشاركة"}
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="rounded-xl border border-red-500/40 px-4 py-2 text-sm text-red-200"
            >
              حذف
            </button>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-400">
          <span>الحالة: {agent.status}</span>
          <span>·</span>
          <span>التصنيف: {agent.category || "غير محدد"}</span>
          <span>·</span>
          <span>تاريخ الإنشاء: {new Date(agent.created_at).toLocaleDateString("ar-SA")}</span>
        </div>
      </header>

      <nav className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold ${
              activeTab === tab
                ? "bg-emerald-400/20 text-emerald-200"
                : "text-slate-300"
            }`}
          >
            {tab}
          </button>
        ))}
      </nav>

      {statusMessage || errorMessage ? (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            errorMessage
              ? "border-red-500/30 bg-red-500/10 text-red-200"
              : "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
          }`}
        >
          {errorMessage || statusMessage}
        </div>
      ) : null}

      {activeTab === "نظرة عامة" && (
        <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
            <h2 className="text-sm font-semibold text-slate-200">ملخص الوكيل</h2>
            <p className="mt-2 text-sm text-slate-400">{agent.description || "بدون وصف"}</p>
            <div className="mt-4 grid gap-2 text-xs text-slate-400">
              <span>إجمالي التنفيذات: {stats.total}</span>
              <span>نسبة النجاح: {stats.successRate}%</span>
              <span>إجمالي الإخفاقات: {stats.failure}</span>
            </div>
            <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-xs text-slate-400">
              معاينة سير العمل
              <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap">
                {JSON.stringify(agent.workflow || {}, null, 2)}
              </pre>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
            <h2 className="text-sm font-semibold text-slate-200">أداء التنفيذ</h2>
            <div className="mt-4 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis dataKey="label" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      background: "#0f172a",
                      border: "1px solid #1e293b",
                      color: "#e2e8f0",
                    }}
                  />
                  <Line type="monotone" dataKey="duration" stroke="#38bdf8" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>
      )}

      {activeTab === "التنفيذات" && (
        <section className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-slate-200">سجل التنفيذ</h2>
            <select
              value={executionFilter}
              onChange={(event) => setExecutionFilter(event.target.value)}
              className="rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-2 text-sm text-slate-200"
            >
              <option>الكل</option>
              <option>ناجح</option>
              <option>فشل</option>
              <option>قيد التنفيذ</option>
            </select>
          </div>
          <div className="mt-4 grid gap-3">
            {filteredExecutions.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-700 p-4 text-sm text-slate-400">
                لا توجد تنفيذات مطابقة.
              </div>
            ) : filteredExecutions.length > 8 ? (
              <VirtualList
                rowCount={filteredExecutions.length}
                rowHeight={88}
                rowComponent={ExecutionRow}
                rowProps={{}}
                style={{
                  height: Math.min(filteredExecutions.length * 88, 520),
                  width: "100%",
                }}
              />
            ) : (
              filteredExecutions.map((execution) => (
                <div
                  key={execution.id}
                  className="rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">{execution.id}</span>
                    <span className="text-xs text-emerald-300">{execution.status}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-400">
                    <span>
                      {execution.started_at
                        ? new Date(execution.started_at).toLocaleString("ar-SA")
                        : "غير محدد"}
                    </span>
                    <span>
                      المدة: {Math.round((execution.duration_ms || 0) / 1000)} ثانية
                    </span>
                    <span>الرموز: {execution.tokens_used || 0}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      )}

      {activeTab === "الإعدادات" && (
        <section className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
          <div className="grid gap-3">
            <label className="text-sm text-slate-200">الوصف</label>
            <textarea
              className="auth-field min-h-[110px] rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-slate-100"
              value={agent.description || ""}
              onChange={(event) =>
                setAgent({ ...agent, description: event.target.value })
              }
            />
            <label className="text-sm text-slate-200">التصنيف</label>
            <input
              className="auth-field rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-slate-100"
              value={agent.category || ""}
              onChange={(event) => setAgent({ ...agent, category: event.target.value })}
            />
            <button
              type="button"
              onClick={async () => {
                await supabaseClient
                  .from("agents")
                  .update({ description: agent.description, category: agent.category })
                  .eq("id", agent.id)
                  .eq("user_id", userId);
                setStatusMessage("تم حفظ الإعدادات.");
              }}
              className="rounded-xl bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950"
            >
              حفظ الإعدادات
            </button>
          </div>
        </section>
      )}

      {activeTab === "التحليلات" && (
        <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
            <h2 className="text-sm font-semibold text-slate-200">اتجاه الأداء</h2>
            <div className="mt-4 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis dataKey="label" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      background: "#0f172a",
                      border: "1px solid #1e293b",
                      color: "#e2e8f0",
                    }}
                  />
                  <Line type="monotone" dataKey="cost" stroke="#fbbf24" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
            <h2 className="text-sm font-semibold text-slate-200">تحليل مختصر</h2>
            <div className="mt-4 grid gap-2 text-sm text-slate-300">
              <p>متوسط التنفيذ: {stats.total ? Math.round(stats.successRate) : 0}% نجاح</p>
              <p>إجمالي الإخفاقات: {stats.failure}</p>
              <p>إجمالي التنفيذات: {stats.total}</p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default AgentDetails;
