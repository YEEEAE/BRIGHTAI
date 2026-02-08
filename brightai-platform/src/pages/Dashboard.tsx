import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import supabase from "../lib/supabase";

type AgentRow = {
  id: string;
  name: string;
  description: string | null;
  status: "نشط" | "متوقف" | "قيد المراجعة";
  updated_at: string;
  created_at: string;
};

type ExecutionRow = {
  id: string;
  agent_id: string;
  status: "ناجح" | "فشل" | "قيد التنفيذ";
  started_at: string | null;
  duration_ms: number | null;
  tokens_used: number | null;
  cost_usd: number | null;
};

const supabaseClient = supabase as unknown as {
  from: (table: string) => any;
  channel: (name: string) => any;
  removeChannel: (channel: unknown) => void;
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [agents, setAgents] = useState<AgentRow[]>([]);
  const [executions, setExecutions] = useState<ExecutionRow[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("الكل");
  const [sortKey, setSortKey] = useState("الأحدث");

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.auth.getSession();
    const session = data.session;
    if (!session) {
      navigate("/login", { replace: true });
      return;
    }

    const userId = session.user.id;
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("full_name")
      .eq("id", userId)
      .maybeSingle();

    const { data: agentsData } = await supabaseClient
      .from("agents")
      .select("id, name, description, status, updated_at, created_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });

    const { data: executionsData } = await supabaseClient
      .from("executions")
      .select("id, agent_id, status, started_at, duration_ms, tokens_used, cost_usd")
      .eq("user_id", userId)
      .order("started_at", { ascending: false })
      .limit(50);

    setUserName(profile?.full_name || session.user.user_metadata?.full_name || "مستخدم برايت أي آي");
    setAgents((agentsData || []) as AgentRow[]);
    setExecutions((executionsData || []) as ExecutionRow[]);
    setLoading(false);

    return userId;
  }, [navigate]);

  useEffect(() => {
    let channel: any;
    let active = true;

    const load = async () => {
      const userId = await fetchDashboard();
      if (!userId || !active) {
        return;
      }
      channel = supabaseClient
        .channel("dashboard-updates")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "agents", filter: `user_id=eq.${userId}` },
          () => {
            fetchDashboard();
          }
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "executions", filter: `user_id=eq.${userId}` },
          () => {
            fetchDashboard();
          }
        )
        .subscribe();
    };

    load();
    return () => {
      active = false;
      if (channel) {
        supabaseClient.removeChannel(channel);
      }
    };
  }, [fetchDashboard]);

  const filteredAgents = useMemo(() => {
    return agents
      .filter((agent) =>
        statusFilter === "الكل" ? true : agent.status === statusFilter
      )
      .filter((agent) => {
        if (!search) {
          return true;
        }
        const query = search.toLowerCase();
        return (
          agent.name.toLowerCase().includes(query) ||
          agent.description?.toLowerCase().includes(query)
        );
      })
      .sort((a, b) => {
        if (sortKey === "الأقدم") {
          return new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
        }
        if (sortKey === "الاسم") {
          return a.name.localeCompare(b.name, "ar");
        }
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      });
  }, [agents, search, sortKey, statusFilter]);

  const recentAgents = filteredAgents.slice(0, 6);
  const recentExecutions = executions.slice(0, 8);
  const agentNameMap = useMemo(() => {
    return new Map(agents.map((agent) => [agent.id, agent.name]));
  }, [agents]);

  const stats = useMemo(() => {
    const totalAgents = agents.length;
    const activeAgents = agents.filter((agent) => agent.status === "نشط").length;
    const totalExecutions = executions.length;
    const successCount = executions.filter((item) => item.status === "ناجح").length;
    const successRate = totalExecutions ? Math.round((successCount / totalExecutions) * 100) : 0;

    return [
      { label: "إجمالي الوكلاء", value: totalAgents },
      { label: "الوكلاء النشطون", value: activeAgents },
      { label: "إجمالي التنفيذات", value: totalExecutions },
      { label: "نسبة النجاح", value: `${successRate}%` },
    ];
  }, [agents, executions]);

  const usageData = useMemo(() => {
    const days = Array.from({ length: 7 }).map((_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - index));
      return {
        label: date.toLocaleDateString("ar-SA", { day: "numeric", month: "short" }),
        dateKey: date.toISOString().slice(0, 10),
        count: 0,
        cost: 0,
      };
    });

    executions.forEach((execution) => {
      if (!execution.started_at) {
        return;
      }
      const dateKey = new Date(execution.started_at).toISOString().slice(0, 10);
      const target = days.find((item) => item.dateKey === dateKey);
      if (target) {
        target.count += 1;
        target.cost += execution.cost_usd || 0;
      }
    });

    return days;
  }, [executions]);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-emerald-300">مرحباً بعودتك</p>
          <h1 className="text-2xl font-bold text-slate-100">{userName}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="ابحث عن وكيل"
            className="auth-field w-56 rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-2 text-sm text-slate-100"
          />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-2 text-sm text-slate-200"
          >
            <option>الكل</option>
            <option>نشط</option>
            <option>متوقف</option>
            <option>قيد المراجعة</option>
          </select>
          <select
            value={sortKey}
            onChange={(event) => setSortKey(event.target.value)}
            className="rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-2 text-sm text-slate-200"
          >
            <option>الأحدث</option>
            <option>الأقدم</option>
            <option>الاسم</option>
          </select>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, index) => (
              <div
                key={`stat-${index}`}
                className="h-24 animate-pulse rounded-2xl bg-slate-800"
              />
            ))
          : stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4"
              >
                <p className="text-xs text-slate-400">{stat.label}</p>
                <p className="mt-2 text-2xl font-bold text-emerald-200">
                  {stat.value}
                </p>
              </div>
            ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-200">نظرة الاستخدام</h2>
            <span className="text-xs text-slate-400">آخر ٧ أيام</span>
          </div>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={usageData}>
                <defs>
                  <linearGradient id="usageFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34d399" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#0f172a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: "#0f172a",
                    border: "1px solid #1e293b",
                    color: "#e2e8f0",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#34d399"
                  fill="url(#usageFill)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
          <h2 className="text-sm font-semibold text-slate-200">إجراءات سريعة</h2>
          <div className="mt-4 grid gap-3 text-sm text-slate-200">
            <Link
              to="/agents/new"
              className="rounded-xl border border-emerald-400/40 bg-emerald-400/10 px-4 py-3 text-emerald-200"
            >
              إنشاء وكيل جديد
            </Link>
            <Link
              to="/templates"
              className="rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 hover:border-emerald-400/40"
            >
              استكشاف القوالب
            </Link>
            <Link
              to="/analytics"
              className="rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 hover:border-emerald-400/40"
            >
              عرض التحليلات
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-200">الوكلاء الأخيرة</h2>
            <Link to="/agents/new" className="text-xs text-emerald-300">
              إنشاء وكيل
            </Link>
          </div>
          {loading ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={`agent-skel-${index}`} className="h-24 animate-pulse rounded-xl bg-slate-800" />
              ))}
            </div>
          ) : recentAgents.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-slate-700 p-4 text-sm text-slate-400">
              لا توجد وكلاء حتى الآن.
            </div>
          ) : (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {recentAgents.map((agent) => (
                <div
                  key={agent.id}
                  className="rounded-xl border border-slate-800 bg-slate-950/60 p-4"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-200">
                      {agent.name}
                    </p>
                    <span className="text-xs text-emerald-300">{agent.status}</span>
                  </div>
                  <p className="mt-2 text-xs text-slate-400">
                    {agent.description || "بدون وصف"}
                  </p>
                  <div className="mt-3 text-xs text-slate-500">
                    آخر تحديث: {new Date(agent.updated_at).toLocaleDateString("ar-SA")}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
          <h2 className="text-sm font-semibold text-slate-200">التنفيذات الأخيرة</h2>
          {loading ? (
            <div className="mt-4 grid gap-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={`exec-skel-${index}`} className="h-16 animate-pulse rounded-xl bg-slate-800" />
              ))}
            </div>
          ) : recentExecutions.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-slate-700 p-4 text-sm text-slate-400">
              لا توجد تنفيذات حديثة.
            </div>
          ) : (
            <div className="mt-4 grid gap-3">
              {recentExecutions.map((execution) => (
                <div
                  key={execution.id}
                  className="rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">
                      {agentNameMap.get(execution.agent_id) || "وكيل غير معروف"}
                    </span>
                    <span className="text-xs text-emerald-300">{execution.status}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                    <span>
                      {execution.started_at
                        ? new Date(execution.started_at).toLocaleString("ar-SA")
                        : "غير محدد"}
                    </span>
                    <span>{execution.tokens_used || 0} رمز</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-200">التكلفة اليومية</h2>
          <span className="text-xs text-slate-400">ر.س</span>
        </div>
        <div className="mt-4 h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={usageData}>
              <XAxis dataKey="label" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip
                contentStyle={{
                  background: "#0f172a",
                  border: "1px solid #1e293b",
                  color: "#e2e8f0",
                }}
              />
              <Bar dataKey="cost" fill="#38bdf8" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <Link
        to="/agents/new"
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-400 text-xl font-bold text-slate-950 shadow-lg shadow-emerald-400/40"
        aria-label="إنشاء وكيل جديد"
      >
        +
      </Link>
    </div>
  );
};

export default Dashboard;
