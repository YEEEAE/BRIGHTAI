import {
  Suspense,
  lazy,
  memo,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  Bot,
  CheckCircle2,
  CircleDashed,
  Coins,
  Copy,
  FileWarning,
  Hash,
  PauseCircle,
  Pencil,
  PlayCircle,
  Plus,
  Settings2,
  Sparkles,
  Trash2,
  TrendingDown,
  TrendingUp,
  Workflow,
  Wrench,
  X,
  Zap,
} from "lucide-react";
import Modal from "../components/ui/Modal";
import supabase from "../lib/supabase";
import useAppToast from "../hooks/useAppToast";
import type {
  ChartMetricKey,
  DashboardChartPoint,
} from "../components/dashboard/MainPerformanceChart";

const MainPerformanceChart = lazy(
  () => import("../components/dashboard/MainPerformanceChart")
);

type AgentStatus = "نشط" | "متوقف" | "قيد المراجعة" | "مسودة" | "معطل";
type ExecutionStatus = "ناجح" | "فشل" | "قيد التنفيذ";
type ChartPeriod = "اليوم" | "هذا الأسبوع" | "هذا الشهر" | "آخر 3 أشهر";

type AgentRow = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  status: AgentStatus;
  execution_count: number;
  success_rate: number | null;
  updated_at: string;
  created_at: string;
};

type ExecutionRow = {
  id: string;
  agent_id: string;
  user_id: string;
  status: ExecutionStatus;
  input: Record<string, unknown> | null;
  output: Record<string, unknown> | null;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  duration_ms: number | null;
  tokens_used: number | null;
  cost_usd: number | null;
};

type ApiKeyRow = {
  id: string;
  provider: string;
  is_active: boolean;
  usage_count: number | null;
  rate_limit_per_day: number | null;
  created_at: string;
  last_used_at: string | null;
};

type ActivityItem = {
  id: string;
  title: string;
  subtitle: string;
  type: "وكيل" | "تنفيذ" | "مفتاح";
  created_at: string;
};

type AlertItem = {
  id: string;
  title: string;
  description: string;
  type: "تحذير" | "خطر" | "توصية";
};

type LoadingState = {
  welcome: boolean;
  stats: boolean;
  chart: boolean;
  agents: boolean;
  executions: boolean;
  activity: boolean;
  alerts: boolean;
};

type DashboardCache = {
  userId: string;
  timestamp: number;
  userName: string;
  userAvatar: string;
  agents: AgentRow[];
  executions: ExecutionRow[];
  apiKeys: ApiKeyRow[];
};

type StatCardProps = {
  title: string;
  value: string;
  delta: number;
  subtitle: string;
  to: string;
  icon: React.ReactNode;
  extra?: React.ReactNode;
};

const supabaseClient = supabase as unknown as {
  from: (table: string) => any;
  channel: (name: string) => any;
  removeChannel: (channel: unknown) => void;
};

const CACHE_KEY = "brightai_dashboard_cache_v2";
const CACHE_TTL_MS = 90 * 1000;
const TOKENS_MONTHLY_LIMIT = 500000;

const normalizeAgentStatus = (value: string | null): AgentStatus => {
  if (!value) {
    return "مسودة";
  }

  const raw = value.trim().toLowerCase();
  if (raw === "نشط" || raw === "active") {
    return "نشط";
  }
  if (raw === "متوقف" || raw === "paused") {
    return "متوقف";
  }
  if (raw === "قيد المراجعة" || raw === "review") {
    return "قيد المراجعة";
  }
  if (raw === "معطل" || raw === "disabled") {
    return "معطل";
  }
  if (raw === "مسودة" || raw === "draft") {
    return "مسودة";
  }
  return "مسودة";
};

const normalizeExecutionStatus = (value: string | null): ExecutionStatus => {
  if (!value) {
    return "قيد التنفيذ";
  }

  const raw = value.trim().toLowerCase();
  if (raw === "ناجح" || raw === "completed" || raw === "success") {
    return "ناجح";
  }
  if (raw === "فشل" || raw === "failed" || raw === "error") {
    return "فشل";
  }
  return "قيد التنفيذ";
};

const getGreeting = (date: Date) => {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) {
    return "صباح الخير";
  }
  if (hour >= 12 && hour < 20) {
    return "مساء الخير";
  }
  return "أهلاً";
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("ar-SA", {
    style: "currency",
    currency: "SAR",
    maximumFractionDigits: 2,
  }).format(value);
};

const formatCompactNumber = (value: number) => {
  return new Intl.NumberFormat("ar-SA", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
};

const toDisplayDateTime = (value: string | null) => {
  if (!value) {
    return "غير متاح";
  }
  return new Date(value).toLocaleString("ar-SA", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const toRelativeTime = (value: string) => {
  const date = new Date(value);
  const now = new Date();
  const diffMinutes = Math.round((date.getTime() - now.getTime()) / 60000);
  const absMinutes = Math.abs(diffMinutes);
  const formatter = new Intl.RelativeTimeFormat("ar-SA", { numeric: "auto" });

  if (absMinutes < 60) {
    return formatter.format(diffMinutes, "minute");
  }

  const diffHours = Math.round(diffMinutes / 60);
  const absHours = Math.abs(diffHours);
  if (absHours < 24) {
    return formatter.format(diffHours, "hour");
  }

  const diffDays = Math.round(diffHours / 24);
  return formatter.format(diffDays, "day");
};

const formatDuration = (durationMs: number | null) => {
  if (!durationMs || durationMs <= 0) {
    return "-";
  }

  if (durationMs < 1000) {
    return `${Math.round(durationMs)} مللي ثانية`;
  }

  const seconds = durationMs / 1000;
  if (seconds < 60) {
    return `${seconds.toFixed(1)} ثانية`;
  }

  return `${(seconds / 60).toFixed(1)} دقيقة`;
};

const truncateText = (value: string, length: number) => {
  if (value.length <= length) {
    return value;
  }
  return `${value.slice(0, length)}...`;
};

const jsonPreview = (value: Record<string, unknown> | null, max = 70) => {
  if (!value) {
    return "-";
  }
  const text = JSON.stringify(value);
  return truncateText(text, max);
};

const getCache = (userId: string): DashboardCache | null => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as DashboardCache;
    const validUser = parsed.userId === userId;
    const validAge = Date.now() - parsed.timestamp <= CACHE_TTL_MS;

    if (!validUser || !validAge) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
};

const setCache = (payload: DashboardCache) => {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
};

const MiniSparkline = memo(({ values }: { values: number[] }) => {
  if (values.length === 0) {
    return <div className="h-10 w-full rounded-lg bg-slate-800/40" />;
  }

  const width = 140;
  const height = 40;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = Math.max(max - min, 1);

  const points = values
    .map((value, index) => {
      const x = (index / Math.max(values.length - 1, 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-10 w-full">
      <polyline
        points={points}
        fill="none"
        stroke="#34d399"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
});

MiniSparkline.displayName = "MiniSparkline";

const ProgressRing = memo(({ value }: { value: number }) => {
  const normalized = Math.max(0, Math.min(100, value));
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (normalized / 100) * circumference;

  return (
    <svg viewBox="0 0 64 64" className="h-16 w-16">
      <circle cx="32" cy="32" r={radius} fill="none" stroke="#1e293b" strokeWidth="6" />
      <circle
        cx="32"
        cy="32"
        r={radius}
        fill="none"
        stroke="#34d399"
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform="rotate(-90 32 32)"
      />
      <text
        x="32"
        y="36"
        textAnchor="middle"
        className="fill-emerald-200 text-[12px] font-bold"
      >
        {`${Math.round(normalized)}%`}
      </text>
    </svg>
  );
});

ProgressRing.displayName = "ProgressRing";

const StatusBadge = memo(({ status }: { status: AgentStatus }) => {
  const classes: Record<AgentStatus, string> = {
    "نشط": "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
    "مسودة": "border-slate-600 bg-slate-700/20 text-slate-200",
    "متوقف": "border-amber-500/30 bg-amber-500/10 text-amber-200",
    "معطل": "border-rose-500/30 bg-rose-500/10 text-rose-200",
    "قيد المراجعة": "border-sky-500/30 bg-sky-500/10 text-sky-200",
  };

  return (
    <span className={`rounded-full border px-2 py-1 text-xs font-semibold ${classes[status]}`}>
      {status}
    </span>
  );
});

StatusBadge.displayName = "StatusBadge";

const StatCard = memo(
  ({ title, value, delta, subtitle, to, icon, extra }: StatCardProps) => {
    const positive = delta >= 0;

    return (
      <Link
        to={to}
        className="group rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl transition hover:-translate-y-1 hover:border-emerald-400/40 hover:shadow-xl hover:shadow-emerald-900/20"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-2 text-emerald-300 transition group-hover:scale-105">
            {icon}
          </div>
          <div
            className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${
              positive ? "bg-emerald-500/15 text-emerald-200" : "bg-rose-500/15 text-rose-200"
            }`}
          >
            {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {`${Math.abs(delta).toFixed(1)}%`}
          </div>
        </div>
        <p className="mt-3 text-xs text-slate-400">{title}</p>
        <p className="mt-1 text-2xl font-extrabold text-slate-100">{value}</p>
        <p className="mt-1 text-xs text-slate-400">{subtitle}</p>
        {extra ? <div className="mt-3">{extra}</div> : null}
      </Link>
    );
  }
);

StatCard.displayName = "StatCard";

const Dashboard = () => {
  const navigate = useNavigate();
  const { showError, showSuccess } = useAppToast();

  const [userId, setUserId] = useState("");
  const [userName, setUserName] = useState("مستخدم Bright AI");
  const [userAvatar, setUserAvatar] = useState("");
  const [agents, setAgents] = useState<AgentRow[]>([]);
  const [executions, setExecutions] = useState<ExecutionRow[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKeyRow[]>([]);

  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>("هذا الشهر");
  const [chartMetric, setChartMetric] = useState<ChartMetricKey>("executions");
  const [agentSearch, setAgentSearch] = useState("");
  const [agentStatusFilter, setAgentStatusFilter] = useState<"الكل" | AgentStatus>("الكل");
  const [executionFilter, setExecutionFilter] = useState<"الكل" | ExecutionStatus>("الكل");
  const [selectedExecution, setSelectedExecution] = useState<ExecutionRow | null>(null);
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>(() => {
    if (typeof window === "undefined") {
      return [];
    }

    try {
      const raw = window.localStorage.getItem("brightai_dashboard_dismissed_alerts");
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  });

  const [loadingSections, setLoadingSections] = useState<LoadingState>({
    welcome: true,
    stats: true,
    chart: true,
    agents: true,
    executions: true,
    activity: true,
    alerts: true,
  });

  const channelRef = useRef<any>(null);
  const refreshTimerRef = useRef<number | null>(null);
  const loadInFlightRef = useRef(false);
  const reloadRequestedRef = useRef(false);
  const lastLoadAtRef = useRef(0);
  const executionLimitRef = useRef(180);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(
      "brightai_dashboard_dismissed_alerts",
      JSON.stringify(dismissedAlerts)
    );
  }, [dismissedAlerts]);

  useEffect(() => {
    const connection = (
      navigator as Navigator & {
        connection?: {
          effectiveType?: string;
          saveData?: boolean;
        };
      }
    ).connection;

    if (connection?.saveData) {
      executionLimitRef.current = 90;
      return;
    }

    if (connection?.effectiveType === "2g" || connection?.effectiveType === "3g") {
      executionLimitRef.current = 120;
      return;
    }

    executionLimitRef.current = 180;
  }, []);

  const setSectionLoading = useCallback(
    (keys: (keyof LoadingState)[], loading: boolean) => {
      setLoadingSections((prev) => {
        const next = { ...prev };
        keys.forEach((key) => {
          next[key] = loading;
        });
        return next;
      });
    },
    []
  );

  const resolveSession = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      navigate("/login", { replace: true });
      return null;
    }

    return data.session.user;
  }, [navigate]);

  const loadDashboard = useCallback(
    async (force = false, silent = false) => {
      if (loadInFlightRef.current) {
        reloadRequestedRef.current = true;
        return;
      }

      const now = Date.now();
      if (silent && now - lastLoadAtRef.current < 600) {
        return;
      }

      loadInFlightRef.current = true;
      try {
        const sessionUser = await resolveSession();
        if (!sessionUser) {
          return;
        }

        setUserId(sessionUser.id);
        const cached = force ? null : getCache(sessionUser.id);

        if (cached) {
          setUserName(cached.userName);
          setUserAvatar(cached.userAvatar);
          setAgents(cached.agents);
          setExecutions(cached.executions);
          setApiKeys(cached.apiKeys);
        }

        if (!silent && !cached) {
          setLoadingSections({
            welcome: true,
            stats: true,
            chart: true,
            agents: true,
            executions: true,
            activity: true,
            alerts: true,
          });
        }

        const profilePromise = supabaseClient
          .from("profiles")
          .select("full_name, avatar_url")
          .eq("id", sessionUser.id)
          .maybeSingle()
          .then(({ data }: { data: { full_name?: string; avatar_url?: string } | null }) => {
            const resolvedName =
              data?.full_name || sessionUser.user_metadata?.full_name || "مستخدم Bright AI";
            setUserName(resolvedName);
            setUserAvatar(data?.avatar_url || "");
            if (!silent && !cached) {
              setSectionLoading(["welcome"], false);
            }
            return {
              userName: resolvedName,
              userAvatar: data?.avatar_url || "",
            };
          })
          .catch(() => {
            if (!silent && !cached) {
              setSectionLoading(["welcome"], false);
            }
            return {
              userName: sessionUser.user_metadata?.full_name || "مستخدم Bright AI",
              userAvatar: "",
            };
          });

        const agentsPromise = supabaseClient
          .from("agents")
          .select(
            "id, name, description, category, status, execution_count, success_rate, updated_at, created_at"
          )
          .eq("user_id", sessionUser.id)
          .order("updated_at", { ascending: false })
          .then(({ data }: { data: any[] | null }) => {
            const nextAgents: AgentRow[] = (data || []).map((item) => ({
              id: item.id,
              name: item.name || "وكيل بدون اسم",
              description: item.description || null,
              category: item.category || null,
              status: normalizeAgentStatus(item.status || null),
              execution_count: Number(item.execution_count || 0),
              success_rate:
                item.success_rate === null || item.success_rate === undefined
                  ? null
                  : Number(item.success_rate),
              updated_at: item.updated_at || new Date().toISOString(),
              created_at: item.created_at || new Date().toISOString(),
            }));

            setAgents(nextAgents);
            if (!silent && !cached) {
              setSectionLoading(["stats", "chart", "agents", "activity", "alerts"], false);
            }
            return nextAgents;
          })
          .catch(() => {
            if (!silent && !cached) {
              setSectionLoading(["stats", "chart", "agents", "activity", "alerts"], false);
            }
            return [] as AgentRow[];
          });

        const executionsPromise = supabaseClient
          .from("executions")
          .select(
            "id, agent_id, user_id, status, input, output, error_message, started_at, completed_at, duration_ms, tokens_used, cost_usd"
          )
          .eq("user_id", sessionUser.id)
          .order("started_at", { ascending: false })
          .limit(executionLimitRef.current)
          .then(({ data }: { data: any[] | null }) => {
            const nextExecutions: ExecutionRow[] = (data || []).map((item) => ({
              id: item.id,
              agent_id: item.agent_id,
              user_id: item.user_id,
              status: normalizeExecutionStatus(item.status || null),
              input: (item.input || null) as Record<string, unknown> | null,
              output: (item.output || null) as Record<string, unknown> | null,
              error_message: item.error_message || null,
              started_at: item.started_at || null,
              completed_at: item.completed_at || null,
              duration_ms: item.duration_ms === null ? null : Number(item.duration_ms),
              tokens_used: item.tokens_used === null ? null : Number(item.tokens_used),
              cost_usd: item.cost_usd === null ? null : Number(item.cost_usd),
            }));

            setExecutions(nextExecutions);
            if (!silent && !cached) {
              setSectionLoading(["stats", "chart", "executions", "activity", "alerts"], false);
            }
            return nextExecutions;
          })
          .catch(() => {
            if (!silent && !cached) {
              setSectionLoading(["stats", "chart", "executions", "activity", "alerts"], false);
            }
            return [] as ExecutionRow[];
          });

        const apiKeysPromise = supabaseClient
          .from("api_keys")
          .select("id, provider, is_active, usage_count, rate_limit_per_day, created_at, last_used_at")
          .eq("user_id", sessionUser.id)
          .order("created_at", { ascending: false })
          .limit(20)
          .then(({ data }: { data: any[] | null }) => {
            const nextApiKeys: ApiKeyRow[] = (data || []).map((item) => ({
              id: item.id,
              provider: item.provider || "غير محدد",
              is_active: Boolean(item.is_active),
              usage_count: item.usage_count === null ? null : Number(item.usage_count),
              rate_limit_per_day:
                item.rate_limit_per_day === null ? null : Number(item.rate_limit_per_day),
              created_at: item.created_at || new Date().toISOString(),
              last_used_at: item.last_used_at || null,
            }));
            setApiKeys(nextApiKeys);
            if (!silent && !cached) {
              setSectionLoading(["activity", "alerts"], false);
            }
            return nextApiKeys;
          })
          .catch(() => {
            if (!silent && !cached) {
              setSectionLoading(["activity", "alerts"], false);
            }
            return [] as ApiKeyRow[];
          });

        const [profilePayload, agentsPayload, executionsPayload, apiPayload] = await Promise.all([
          profilePromise,
          agentsPromise,
          executionsPromise,
          apiKeysPromise,
        ]);

        setCache({
          userId: sessionUser.id,
          timestamp: Date.now(),
          userName: profilePayload.userName,
          userAvatar: profilePayload.userAvatar,
          agents: agentsPayload,
          executions: executionsPayload,
          apiKeys: apiPayload,
        });

        if (!silent && !cached) {
          setLoadingSections({
            welcome: false,
            stats: false,
            chart: false,
            agents: false,
            executions: false,
            activity: false,
            alerts: false,
          });
        }

        lastLoadAtRef.current = Date.now();
      } finally {
        loadInFlightRef.current = false;
        if (reloadRequestedRef.current) {
          reloadRequestedRef.current = false;
          void loadDashboard(true, true);
        }
      }
    },
    [resolveSession, setSectionLoading]
  );

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    if (!userId) {
      return;
    }

    if (channelRef.current) {
      supabaseClient.removeChannel(channelRef.current);
    }

    const scheduleRefresh = () => {
      if (document.visibilityState !== "visible") {
        reloadRequestedRef.current = true;
        return;
      }

      if (refreshTimerRef.current) {
        window.clearTimeout(refreshTimerRef.current);
      }

      refreshTimerRef.current = window.setTimeout(() => {
        loadDashboard(true, true);
      }, 700);
    };

    channelRef.current = supabaseClient
      .channel(`dashboard-stream-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "agents", filter: `user_id=eq.${userId}` },
        scheduleRefresh
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "executions", filter: `user_id=eq.${userId}` },
        scheduleRefresh
      )
      .subscribe();

    const handleVisibility = () => {
      if (document.visibilityState === "visible" && reloadRequestedRef.current) {
        reloadRequestedRef.current = false;
        void loadDashboard(true, true);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      if (refreshTimerRef.current) {
        window.clearTimeout(refreshTimerRef.current);
      }
      if (channelRef.current) {
        supabaseClient.removeChannel(channelRef.current);
      }
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [userId, loadDashboard]);

  const greeting = useMemo(() => getGreeting(new Date()), []);

  const activeAgentsCount = useMemo(
    () => agents.filter((item) => item.status === "نشط").length,
    [agents]
  );

  const pausedAgentsCount = useMemo(
    () => agents.filter((item) => item.status === "متوقف").length,
    [agents]
  );

  const deferredAgentSearch = useDeferredValue(agentSearch);

  const executionAnalytics = useMemo(() => {
    const now = new Date();
    const todayKey = now.toISOString().slice(0, 10);
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const nowMs = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const weekStart = nowMs - 7 * dayMs;
    const prevWeekStart = nowMs - 14 * dayMs;

    const byHour = new Map<
      string,
      { executions: number; success: number; cost: number; tokens: number }
    >();
    const byDay = new Map<
      string,
      { executions: number; success: number; cost: number; tokens: number }
    >();
    const byAgent = new Map<string, { total: number; failed: number }>();

    let todayExecutions = 0;
    let failedToday = 0;
    let monthCost = 0;
    let monthTokens = 0;

    let thisWeekExecutions = 0;
    let thisWeekSuccess = 0;
    let thisWeekCost = 0;
    let thisWeekTokens = 0;

    let prevWeekExecutions = 0;
    let prevWeekSuccess = 0;
    let prevWeekCost = 0;
    let prevWeekTokens = 0;

    executions.forEach((item) => {
      const agentEntry = byAgent.get(item.agent_id) || { total: 0, failed: 0 };
      agentEntry.total += 1;
      if (item.status === "فشل") {
        agentEntry.failed += 1;
      }
      byAgent.set(item.agent_id, agentEntry);

      if (!item.started_at) {
        return;
      }

      const date = new Date(item.started_at);
      const timestamp = date.getTime();
      if (Number.isNaN(timestamp)) {
        return;
      }

      const dayKey = date.toISOString().slice(0, 10);
      const hourKey = date.toISOString().slice(0, 13);
      const cost = item.cost_usd || 0;
      const tokens = item.tokens_used || 0;
      const isSuccess = item.status === "ناجح";

      const dayPoint = byDay.get(dayKey) || {
        executions: 0,
        success: 0,
        cost: 0,
        tokens: 0,
      };
      dayPoint.executions += 1;
      dayPoint.cost += cost;
      dayPoint.tokens += tokens;
      if (isSuccess) {
        dayPoint.success += 1;
      }
      byDay.set(dayKey, dayPoint);

      if (dayKey === todayKey) {
        todayExecutions += 1;
        if (item.status === "فشل") {
          failedToday += 1;
        }
        const hourPoint = byHour.get(hourKey) || {
          executions: 0,
          success: 0,
          cost: 0,
          tokens: 0,
        };
        hourPoint.executions += 1;
        hourPoint.cost += cost;
        hourPoint.tokens += tokens;
        if (isSuccess) {
          hourPoint.success += 1;
        }
        byHour.set(hourKey, hourPoint);
      }

      if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
        monthCost += cost;
        monthTokens += tokens;
      }

      if (timestamp >= weekStart) {
        thisWeekExecutions += 1;
        thisWeekCost += cost;
        thisWeekTokens += tokens;
        if (isSuccess) {
          thisWeekSuccess += 1;
        }
        return;
      }

      if (timestamp >= prevWeekStart && timestamp < weekStart) {
        prevWeekExecutions += 1;
        prevWeekCost += cost;
        prevWeekTokens += tokens;
        if (isSuccess) {
          prevWeekSuccess += 1;
        }
      }
    });

    return {
      todayExecutions,
      failedToday,
      monthCost,
      monthTokens,
      thisWeekExecutions,
      thisWeekSuccess,
      thisWeekCost,
      thisWeekTokens,
      prevWeekExecutions,
      prevWeekSuccess,
      prevWeekCost,
      prevWeekTokens,
      byHour,
      byDay,
      byAgent,
    };
  }, [executions]);

  const todayExecutionsCount = executionAnalytics.todayExecutions;
  const failedTodayCount = executionAnalytics.failedToday;

  const chartData = useMemo<DashboardChartPoint[]>(() => {
    const now = new Date();

    if (chartPeriod === "اليوم") {
      const points = Array.from({ length: 24 }).map((_, hourIndex) => {
        const marker = new Date(now);
        marker.setHours(hourIndex, 0, 0, 0);
        return {
          label: marker.toLocaleTimeString("ar-SA", { hour: "2-digit" }),
          key: marker.toISOString().slice(0, 13),
          executions: 0,
          success: 0,
          cost: 0,
          tokens: 0,
        };
      });

      return points.map((point) => {
        const pointData = executionAnalytics.byHour.get(point.key) || {
          executions: 0,
          success: 0,
          cost: 0,
          tokens: 0,
        };
        return {
          label: point.label,
          executions: pointData.executions,
          successRate:
            pointData.executions > 0 ? (pointData.success / pointData.executions) * 100 : 0,
          cost: Number(pointData.cost.toFixed(2)),
          tokens: pointData.tokens,
        };
      });
    }

    const days = chartPeriod === "هذا الأسبوع" ? 7 : chartPeriod === "هذا الشهر" ? 30 : 90;

    const points = Array.from({ length: days }).map((_, index) => {
      const marker = new Date(now);
      marker.setHours(0, 0, 0, 0);
      marker.setDate(marker.getDate() - (days - index - 1));
      return {
        label: marker.toLocaleDateString("ar-SA", { day: "2-digit", month: "short" }),
        key: marker.toISOString().slice(0, 10),
        executions: 0,
        success: 0,
        cost: 0,
        tokens: 0,
        };
      });

    return points.map((point) => {
      const pointData = executionAnalytics.byDay.get(point.key) || {
        executions: 0,
        success: 0,
        cost: 0,
        tokens: 0,
      };
      return {
        label: point.label,
        executions: pointData.executions,
        successRate:
          pointData.executions > 0 ? (pointData.success / pointData.executions) * 100 : 0,
        cost: Number(pointData.cost.toFixed(2)),
        tokens: pointData.tokens,
      };
    });
  }, [chartPeriod, executionAnalytics.byDay, executionAnalytics.byHour]);

  const sparklineValues = useMemo(() => {
    return chartData.slice(-14).map((item) => item.executions);
  }, [chartData]);

  const monthMetrics = useMemo(
    () => ({
      cost: executionAnalytics.monthCost,
      tokens: executionAnalytics.monthTokens,
    }),
    [executionAnalytics.monthCost, executionAnalytics.monthTokens]
  );

  const weekComparisons = useMemo(() => {
    const thisWeekSuccessRate = executionAnalytics.thisWeekExecutions
      ? (executionAnalytics.thisWeekSuccess / executionAnalytics.thisWeekExecutions) * 100
      : 0;

    const prevWeekSuccessRate = executionAnalytics.prevWeekExecutions
      ? (executionAnalytics.prevWeekSuccess / executionAnalytics.prevWeekExecutions) * 100
      : 0;
    const now = Date.now();
    const weekStart = now - 7 * 24 * 60 * 60 * 1000;

    const newAgentsThisWeek = agents.filter(
      (item) => new Date(item.created_at).getTime() >= weekStart
    ).length;

    const activeAgentsUpdatedThisWeek = agents.filter(
      (item) =>
        item.status === "نشط" && new Date(item.updated_at).getTime() >= weekStart
    ).length;

    const previousTotalAgents = Math.max(agents.length - newAgentsThisWeek, 0);
    const previousActiveAgents = Math.max(activeAgentsCount - activeAgentsUpdatedThisWeek, 0);

    const delta = (current: number, previous: number) => {
      if (previous <= 0) {
        return current > 0 ? 100 : 0;
      }
      return ((current - previous) / previous) * 100;
    };

    return {
      totalAgentsDelta: delta(agents.length, previousTotalAgents),
      activeAgentsDelta: delta(activeAgentsCount, previousActiveAgents),
      executionsDelta: delta(
        executionAnalytics.thisWeekExecutions,
        executionAnalytics.prevWeekExecutions
      ),
      successRateDelta: delta(thisWeekSuccessRate, prevWeekSuccessRate),
      costDelta: delta(executionAnalytics.thisWeekCost, executionAnalytics.prevWeekCost),
      tokensDelta: delta(executionAnalytics.thisWeekTokens, executionAnalytics.prevWeekTokens),
      successRateValue: thisWeekSuccessRate,
    };
  }, [
    agents,
    activeAgentsCount,
    executionAnalytics.prevWeekCost,
    executionAnalytics.prevWeekExecutions,
    executionAnalytics.prevWeekSuccess,
    executionAnalytics.prevWeekTokens,
    executionAnalytics.thisWeekCost,
    executionAnalytics.thisWeekExecutions,
    executionAnalytics.thisWeekSuccess,
    executionAnalytics.thisWeekTokens,
  ]);

  const filteredAgents = useMemo(() => {
    const query = deferredAgentSearch.trim().toLowerCase();
    return agents
      .filter((item) => (agentStatusFilter === "الكل" ? true : item.status === agentStatusFilter))
      .filter((item) => {
        if (!query) {
          return true;
        }
        return (
          item.name.toLowerCase().includes(query) ||
          (item.description || "").toLowerCase().includes(query)
        );
      })
      .slice(0, 8);
  }, [agents, agentStatusFilter, deferredAgentSearch]);

  const executionByAgent = executionAnalytics.byAgent;

  const agentNameMap = useMemo(() => {
    const map = new Map<string, string>();
    agents.forEach((item) => {
      map.set(item.id, item.name);
    });
    return map;
  }, [agents]);

  const visibleExecutions = useMemo(() => {
    return executions
      .filter((item) => (executionFilter === "الكل" ? true : item.status === executionFilter))
      .slice(0, 10);
  }, [executions, executionFilter]);

  const activities = useMemo<ActivityItem[]>(() => {
    const agentActivities = agents.slice(0, 4).map((item) => ({
      id: `agent-${item.id}`,
      type: "وكيل" as const,
      title: `قمت بإنشاء وكيل جديد: ${item.name}`,
      subtitle: "إدارة الوكلاء",
      created_at: item.created_at,
    }));

    const executionActivities = executions.slice(0, 4).map((item) => ({
      id: `execution-${item.id}`,
      type: "تنفيذ" as const,
      title:
        item.status === "ناجح"
          ? `تم تنفيذ ${agentNameMap.get(item.agent_id) || "وكيل"} بنجاح`
          : item.status === "فشل"
          ? `فشل تنفيذ ${agentNameMap.get(item.agent_id) || "وكيل"}`
          : `جارٍ تنفيذ ${agentNameMap.get(item.agent_id) || "وكيل"}`,
      subtitle: "سجل التنفيذات",
      created_at: item.started_at || new Date().toISOString(),
    }));

    const apiActivities = apiKeys.slice(0, 3).map((item) => ({
      id: `key-${item.id}`,
      type: "مفتاح" as const,
      title: `تمت إضافة مفتاح جديد لمزوّد ${item.provider}`,
      subtitle: "إعدادات التكامل",
      created_at: item.created_at,
    }));

    return [...agentActivities, ...executionActivities, ...apiActivities]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10);
  }, [agents, apiKeys, executions, agentNameMap]);

  const alerts = useMemo<AlertItem[]>(() => {
    const items: AlertItem[] = [];

    if (pausedAgentsCount > 0) {
      items.push({
        id: "paused-agents",
        type: "تحذير",
        title: "لديك وكلاء متوقفون",
        description: `يوجد ${pausedAgentsCount} وكلاء بحالة متوقف وقد تؤثر على التدفق التشغيلي.`,
      });
    }

    const riskyAgents = agents.filter((item) => {
      const stats = executionByAgent.get(item.id);
      if (!stats || stats.total < 5) {
        return false;
      }
      return stats.failed / stats.total >= 0.4;
    });

    if (riskyAgents.length > 0) {
      items.push({
        id: "high-failure-rate",
        type: "خطر",
        title: "نسبة فشل مرتفعة",
        description: `يوجد ${riskyAgents.length} وكلاء تتجاوز نسبة فشلهم 40% وتحتاج مراجعة فورية.`,
      });
    }

    const keyNearLimit = apiKeys.find((item) => {
      if (!item.rate_limit_per_day || !item.usage_count) {
        return false;
      }
      return item.usage_count / item.rate_limit_per_day >= 0.8;
    });

    if (keyNearLimit) {
      items.push({
        id: "api-key-near-limit",
        type: "تحذير",
        title: "مفتاح API يقترب من الحد اليومي",
        description: `المزود ${keyNearLimit.provider} تجاوز 80% من حد الاستخدام اليومي.`,
      });
    }

    if (monthMetrics.tokens / TOKENS_MONTHLY_LIMIT >= 0.8) {
      items.push({
        id: "plan-upgrade",
        type: "توصية",
        title: "اقتربت من حد الرموز الشهري",
        description: "فكر في ترقية الخطة لتجنب توقف التنفيذات عند نهاية الشهر.",
      });
    }

    items.push({
      id: "template-recommendation",
      type: "توصية",
      title: "توصية بتحسين النمو",
      description: "جرّب قالب وكيل خدمة العملاء لزيادة التحويلات من الزيارات الواردة.",
    });

    return items.filter((item) => !dismissedAlerts.includes(item.id));
  }, [agents, apiKeys, dismissedAlerts, executionByAgent, monthMetrics.tokens, pausedAgentsCount]);

  const dismissAlert = (id: string) => {
    setDismissedAlerts((prev) => (prev.includes(id) ? prev : [...prev, id]));
  };

  const handleAgentEdit = (agentId: string) => {
    navigate(`/agents/${agentId}/builder`);
  };

  const handleAgentToggle = async (agent: AgentRow) => {
    const nextStatus: AgentStatus = agent.status === "نشط" ? "متوقف" : "نشط";
    const { error } = await supabaseClient
      .from("agents")
      .update({ status: nextStatus })
      .eq("id", agent.id)
      .eq("user_id", userId);

    if (error) {
      showError("تعذر تحديث حالة الوكيل.");
      return;
    }

    setAgents((prev) =>
      prev.map((item) => (item.id === agent.id ? { ...item, status: nextStatus } : item))
    );
    showSuccess(nextStatus === "نشط" ? "تم تشغيل الوكيل." : "تم إيقاف الوكيل.");
  };

  const handleAgentClone = async (agent: AgentRow) => {
    const payload = {
      user_id: userId,
      name: `${agent.name} - نسخة`,
      description: agent.description,
      category: agent.category,
      status: "مسودة",
      execution_count: 0,
      success_rate: null,
    };

    const { data, error } = await supabaseClient
      .from("agents")
      .insert(payload)
      .select(
        "id, name, description, category, status, execution_count, success_rate, updated_at, created_at"
      )
      .maybeSingle();

    if (error || !data) {
      showError("تعذر نسخ الوكيل.");
      return;
    }

    const clonedAgent: AgentRow = {
      id: data.id,
      name: data.name,
      description: data.description || null,
      category: data.category || null,
      status: normalizeAgentStatus(data.status || null),
      execution_count: Number(data.execution_count || 0),
      success_rate:
        data.success_rate === null || data.success_rate === undefined
          ? null
          : Number(data.success_rate),
      updated_at: data.updated_at || new Date().toISOString(),
      created_at: data.created_at || new Date().toISOString(),
    };

    setAgents((prev) => [clonedAgent, ...prev]);
    showSuccess("تم إنشاء نسخة جديدة من الوكيل.");
  };

  const handleAgentDelete = async (agent: AgentRow) => {
    const confirmed = window.confirm(`هل تريد حذف الوكيل: ${agent.name}؟`);
    if (!confirmed) {
      return;
    }

    const { error } = await supabaseClient
      .from("agents")
      .delete()
      .eq("id", agent.id)
      .eq("user_id", userId);

    if (error) {
      showError("تعذر حذف الوكيل.");
      return;
    }

    setAgents((prev) => prev.filter((item) => item.id !== agent.id));
    showSuccess("تم حذف الوكيل.");
  };

  const summaryText = `${activeAgentsCount} وكلاء نشطين و ${todayExecutionsCount} تنفيذ اليوم`;

  const smartBannerMessages = [
    pausedAgentsCount > 0 ? `يوجد ${pausedAgentsCount} وكلاء متوقفين` : "",
    failedTodayCount > 0 ? `يوجد ${failedTodayCount} أخطاء تنفيذ اليوم` : "",
  ].filter(Boolean);

  const statsCards = [
    {
      key: "total-agents",
      title: "إجمالي الوكلاء",
      value: formatCompactNumber(agents.length),
      delta: weekComparisons.totalAgentsDelta,
      subtitle: "مقارنة بالأسبوع الماضي",
      to: "/agents/new",
      icon: <Bot className="h-5 w-5 animate-pulse" />,
      extra: null,
    },
    {
      key: "active-agents",
      title: "الوكلاء النشطون",
      value: formatCompactNumber(activeAgentsCount),
      delta: weekComparisons.activeAgentsDelta,
      subtitle: "حالة حية عبر المنصة",
      to: "/agents/new",
      icon: <Activity className="h-5 w-5" />,
      extra: (
        <div className="inline-flex items-center gap-2 text-xs text-emerald-200">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
          تحديث مباشر
        </div>
      ),
    },
    {
      key: "total-executions",
      title: "إجمالي التنفيذات",
      value: formatCompactNumber(executions.length),
      delta: weekComparisons.executionsDelta,
      subtitle: "آخر 7 أيام مقابل السابق",
      to: "/analytics",
      icon: <Zap className="h-5 w-5" />,
      extra: <MiniSparkline values={sparklineValues} />,
    },
    {
      key: "success-rate",
      title: "نسبة النجاح",
      value: `${Math.round(weekComparisons.successRateValue)}%`,
      delta: weekComparisons.successRateDelta,
      subtitle: "معدل نجاح التنفيذات الأسبوعية",
      to: "/analytics",
      icon: <CheckCircle2 className="h-5 w-5" />,
      extra: <ProgressRing value={weekComparisons.successRateValue} />,
    },
    {
      key: "monthly-cost",
      title: "التكلفة هذا الشهر",
      value: formatCurrency(monthMetrics.cost),
      delta: weekComparisons.costDelta,
      subtitle: "إجمالي التكلفة التشغيلية",
      to: "/analytics",
      icon: <Coins className="h-5 w-5" />,
      extra: null,
    },
    {
      key: "tokens-usage",
      title: "الرموز المستخدمة",
      value: formatCompactNumber(monthMetrics.tokens),
      delta: weekComparisons.tokensDelta,
      subtitle: `الحد الشهري: ${formatCompactNumber(TOKENS_MONTHLY_LIMIT)}`,
      to: "/analytics",
      icon: <Hash className="h-5 w-5" />,
      extra: (
        <div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-emerald-400"
              style={{
                width: `${Math.min((monthMetrics.tokens / TOKENS_MONTHLY_LIMIT) * 100, 100)}%`,
              }}
            />
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-6 px-3 py-4 md:px-5 md:py-6">
      <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/40 p-4 shadow-2xl shadow-slate-950/30 md:p-6">
        {loadingSections.welcome ? (
          <div className="grid gap-4">
            <div className="h-6 w-40 animate-pulse rounded-lg bg-slate-800" />
            <div className="h-10 w-72 animate-pulse rounded-lg bg-slate-800" />
            <div className="h-5 w-64 animate-pulse rounded-lg bg-slate-800" />
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-4">
                {userAvatar ? (
                  <img
                    src={userAvatar}
                    alt="صورة المستخدم"
                    className="h-14 w-14 rounded-2xl border border-emerald-400/30 object-cover"
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-400/30 bg-emerald-400/15 text-lg font-bold text-emerald-200">
                    {userName.charAt(0)}
                  </div>
                )}
                <div>
                  <p className="text-sm text-emerald-300">{greeting}</p>
                  <h1 className="text-2xl font-extrabold text-slate-100 md:text-3xl">
                    {`${userName}`}
                  </h1>
                  <p className="text-sm text-slate-300">{summaryText}</p>
                </div>
              </div>

              <Link
                to="/agents/new"
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-5 py-3 text-sm font-bold text-slate-950 transition hover:-translate-y-0.5 hover:bg-emerald-300"
              >
                <Plus className="h-4 w-4" />
                إنشاء وكيل جديد
              </Link>
            </div>

            {smartBannerMessages.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-100">
                <AlertTriangle className="h-4 w-4" />
                {smartBannerMessages.map((message) => (
                  <span key={message} className="rounded-full bg-slate-950/50 px-2 py-1 text-xs">
                    {message}
                  </span>
                ))}
              </div>
            ) : null}
          </>
        )}
      </section>

      <section className="overflow-x-auto pb-1">
        {loadingSections.stats ? (
          <div className="grid min-w-[1150px] grid-flow-col auto-cols-[220px] gap-3 md:min-w-0 md:grid-flow-row md:grid-cols-3 xl:grid-cols-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={`stats-skeleton-${index}`} className="h-44 animate-pulse rounded-2xl bg-slate-800/60" />
            ))}
          </div>
        ) : (
          <div className="grid min-w-[1150px] grid-flow-col auto-cols-[220px] gap-3 md:min-w-0 md:grid-flow-row md:grid-cols-3 xl:grid-cols-6">
            {statsCards.map((item) => (
              <StatCard
                key={item.key}
                title={item.title}
                value={item.value}
                delta={item.delta}
                subtitle={item.subtitle}
                to={item.to}
                icon={item.icon}
                extra={item.extra}
              />
            ))}
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-white/10 bg-slate-950/70 p-4 backdrop-blur-xl md:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-100">أداء التنفيذات</h2>
            <p className="text-xs text-slate-400">عرض تحليلي ديناميكي حسب الفترة ونوع القياس</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {["اليوم", "هذا الأسبوع", "هذا الشهر", "آخر 3 أشهر"].map((period) => (
              <button
                key={period}
                type="button"
                onClick={() => setChartPeriod(period as ChartPeriod)}
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
          {[
            { key: "executions" as ChartMetricKey, label: "تنفيذات" },
            { key: "successRate" as ChartMetricKey, label: "نسبة نجاح" },
            { key: "cost" as ChartMetricKey, label: "تكلفة" },
            { key: "tokens" as ChartMetricKey, label: "الرموز" },
          ].map((metric) => (
            <button
              key={metric.key}
              type="button"
              onClick={() => setChartMetric(metric.key)}
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
          {loadingSections.chart ? (
            <div className="h-full animate-pulse rounded-2xl bg-slate-800/60" />
          ) : (
            <Suspense fallback={<div className="h-full animate-pulse rounded-2xl bg-slate-800/60" />}>
              <MainPerformanceChart data={chartData} metric={chartMetric} />
            </Suspense>
          )}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[2fr_1fr]">
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
              onChange={(event) => setAgentSearch(event.target.value)}
              placeholder="ابحث عن وكيل"
              className="min-h-[44px] flex-1 rounded-xl border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100"
            />
            <select
              value={agentStatusFilter}
              onChange={(event) =>
                setAgentStatusFilter(event.target.value as "الكل" | AgentStatus)
              }
              className="min-h-[44px] rounded-xl border border-slate-700 bg-slate-900 px-3 text-sm text-slate-200"
            >
              <option value="الكل">الكل</option>
              <option value="نشط">نشط</option>
              <option value="مسودة">مسودة</option>
              <option value="متوقف">متوقف</option>
              <option value="معطل">معطل</option>
              <option value="قيد المراجعة">قيد المراجعة</option>
            </select>
          </div>

          {loadingSections.agents ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={`agent-loading-${index}`} className="h-48 animate-pulse rounded-2xl bg-slate-800/60" />
              ))}
            </div>
          ) : filteredAgents.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-slate-700 bg-slate-900/50 p-6 text-center text-sm text-slate-400">
              لا توجد وكلاء حالياً. ابدأ بإنشاء وكيل جديد لتحريك العمليات.
            </div>
          ) : (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {filteredAgents.map((agent) => (
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
                    <button
                      type="button"
                      onClick={() => handleAgentEdit(agent.id)}
                      className="inline-flex min-h-[36px] items-center gap-1 rounded-lg border border-slate-700 px-2 text-xs text-slate-200 hover:border-emerald-400/40"
                      aria-label="تعديل"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      تعديل
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAgentToggle(agent)}
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
                      onClick={() => handleAgentClone(agent)}
                      className="inline-flex min-h-[36px] items-center gap-1 rounded-lg border border-slate-700 px-2 text-xs text-slate-200 hover:border-emerald-400/40"
                      aria-label="نسخ"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      نسخ
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAgentDelete(agent)}
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

        <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-4 backdrop-blur-xl md:p-5">
          <h2 className="text-lg font-bold text-slate-100">الإجراءات السريعة</h2>
          <p className="mt-1 text-xs text-slate-400">تنقل سريع لأهم المهام التشغيلية</p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <Link
              to="/agents/new"
              className="group rounded-2xl bg-gradient-to-br from-emerald-500/25 to-emerald-900/20 p-4 transition hover:-translate-y-1"
            >
              <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-400/20 text-emerald-200">
                <Plus className="h-4 w-4" />
              </div>
              <p className="mt-3 text-sm font-bold text-slate-100">إنشاء وكيل جديد</p>
              <p className="text-xs text-slate-300">ابدأ تدفق أتمتة جديد خلال دقائق</p>
            </Link>

            <Link
              to="/templates"
              className="group rounded-2xl bg-gradient-to-br from-sky-500/25 to-sky-900/20 p-4 transition hover:-translate-y-1"
            >
              <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-sky-400/20 text-sky-200">
                <Sparkles className="h-4 w-4" />
              </div>
              <p className="mt-3 text-sm font-bold text-slate-100">استعراض القوالب</p>
              <p className="text-xs text-slate-300">اختر قالب جاهز للتشغيل الفوري</p>
            </Link>

            <Link
              to="/settings"
              className="group rounded-2xl bg-gradient-to-br from-violet-500/25 to-violet-900/20 p-4 transition hover:-translate-y-1"
            >
              <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-violet-400/20 text-violet-200">
                <Settings2 className="h-4 w-4" />
              </div>
              <p className="mt-3 text-sm font-bold text-slate-100">إعدادات واجهات البرمجة</p>
              <p className="text-xs text-slate-300">أضف المفاتيح واضبط حدود الاستخدام</p>
            </Link>

            <Link
              to="/workflow"
              className="group rounded-2xl bg-gradient-to-br from-amber-500/25 to-amber-900/20 p-4 transition hover:-translate-y-1"
            >
              <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-amber-400/20 text-amber-200">
                <Workflow className="h-4 w-4" />
              </div>
              <p className="mt-3 text-sm font-bold text-slate-100">مصمم سير العمل</p>
              <p className="text-xs text-slate-300">صمّم تدفقات مرئية مع عقد ذكية</p>
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[2fr_1fr]">
        <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-4 backdrop-blur-xl md:p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-100">التنفيذات الأخيرة</h2>
              <p className="text-xs text-slate-400">آخر 10 تنفيذات مع تحديث مباشر</p>
            </div>

            <div className="flex flex-wrap gap-2">
              {(["الكل", "ناجح", "فشل", "قيد التنفيذ"] as const).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setExecutionFilter(status)}
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

          {loadingSections.executions ? (
            <div className="mt-4 grid gap-2">
              {Array.from({ length: 10 }).map((_, index) => (
                <div key={`execution-loading-${index}`} className="h-12 animate-pulse rounded-lg bg-slate-800/60" />
              ))}
            </div>
          ) : visibleExecutions.length === 0 ? (
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
                    {visibleExecutions.map((item) => (
                      <tr
                        key={item.id}
                        className="cursor-pointer border-b border-slate-900/70 text-slate-200 transition hover:bg-slate-900/60"
                        onClick={() => setSelectedExecution(item)}
                      >
                        <td className="px-2 py-2 font-semibold">
                          {agentNameMap.get(item.agent_id) || "وكيل غير معروف"}
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
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 grid gap-2 md:hidden">
                {visibleExecutions.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => setSelectedExecution(item)}
                    className="rounded-xl border border-slate-800 bg-slate-900/50 p-3 text-right"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-slate-200">
                        {agentNameMap.get(item.agent_id) || "وكيل غير معروف"}
                      </p>
                      <StatusBadge status={item.status === "ناجح" ? "نشط" : item.status === "فشل" ? "معطل" : "قيد المراجعة"} />
                    </div>
                    <p className="mt-1 text-xs text-slate-400">{jsonPreview(item.input, 60)}</p>
                    <p className="mt-1 text-[11px] text-slate-500">{toDisplayDateTime(item.started_at)}</p>
                  </button>
                ))}
              </div>
            </>
          )}

          <div className="mt-4 text-left">
            <Link to="/analytics" className="text-xs font-semibold text-emerald-300">
              عرض كل التنفيذات
            </Link>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-4 backdrop-blur-xl md:p-5">
            <h2 className="text-lg font-bold text-slate-100">النشاط الأخير</h2>
            {loadingSections.activity ? (
              <div className="mt-4 grid gap-2">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={`activity-loading-${index}`} className="h-10 animate-pulse rounded-lg bg-slate-800/60" />
                ))}
              </div>
            ) : activities.length === 0 ? (
              <p className="mt-4 text-sm text-slate-400">لا يوجد نشاط حديث.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {activities.map((item) => (
                  <div key={item.id} className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-full ${
                        item.type === "وكيل"
                          ? "bg-emerald-500/15 text-emerald-200"
                          : item.type === "تنفيذ"
                          ? "bg-sky-500/15 text-sky-200"
                          : "bg-violet-500/15 text-violet-200"
                      }`}
                    >
                      {item.type === "وكيل" ? (
                        <Bot className="h-4 w-4" />
                      ) : item.type === "تنفيذ" ? (
                        <Activity className="h-4 w-4" />
                      ) : (
                        <Wrench className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex-1 border-r border-slate-800 pr-3">
                      <p className="text-xs font-semibold text-slate-200">{item.title}</p>
                      <p className="text-[11px] text-slate-400">{item.subtitle}</p>
                      <p className="text-[11px] text-slate-500">{toRelativeTime(item.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-4 backdrop-blur-xl md:p-5">
            <h2 className="text-lg font-bold text-slate-100">التنبيهات والتوصيات</h2>
            {loadingSections.alerts ? (
              <div className="mt-4 grid gap-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={`alert-loading-${index}`} className="h-20 animate-pulse rounded-xl bg-slate-800/60" />
                ))}
              </div>
            ) : alerts.length === 0 ? (
              <p className="mt-4 text-sm text-slate-400">لا توجد تنبيهات حالياً.</p>
            ) : (
              <div className="mt-4 space-y-2">
                {alerts.map((item) => (
                  <article
                    key={item.id}
                    className={`rounded-xl border p-3 ${
                      item.type === "خطر"
                        ? "border-rose-500/30 bg-rose-500/10"
                        : item.type === "تحذير"
                        ? "border-amber-500/30 bg-amber-500/10"
                        : "border-sky-500/30 bg-sky-500/10"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2">
                        {item.type === "خطر" ? (
                          <FileWarning className="mt-0.5 h-4 w-4 text-rose-200" />
                        ) : item.type === "تحذير" ? (
                          <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-200" />
                        ) : (
                          <Sparkles className="mt-0.5 h-4 w-4 text-sky-200" />
                        )}
                        <div>
                          <p className="text-xs font-semibold text-slate-100">{item.title}</p>
                          <p className="text-xs text-slate-200/90">{item.description}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => dismissAlert(item.id)}
                        className="rounded-md p-1 text-slate-300 hover:bg-slate-900/40"
                        aria-label="إخفاء"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <Modal
        open={Boolean(selectedExecution)}
        onClose={() => setSelectedExecution(null)}
        size="xl"
        title="تفاصيل التنفيذ"
        header="تفاصيل المدخلات والمخرجات والتكلفة والمدة"
      >
        {selectedExecution ? (
          <div className="grid gap-4 text-sm">
            <div className="grid gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 md:grid-cols-3">
              <div>
                <p className="text-xs text-slate-400">الوكيل</p>
                <p className="font-semibold text-slate-100">
                  {agentNameMap.get(selectedExecution.agent_id) || "وكيل غير معروف"}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">الحالة</p>
                <p className="font-semibold text-slate-100">{selectedExecution.status}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">الوقت</p>
                <p className="font-semibold text-slate-100">
                  {toDisplayDateTime(selectedExecution.started_at)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">المدة</p>
                <p className="font-semibold text-slate-100">
                  {formatDuration(selectedExecution.duration_ms)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">التكلفة</p>
                <p className="font-semibold text-slate-100">
                  {formatCurrency(selectedExecution.cost_usd || 0)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">الرموز</p>
                <p className="font-semibold text-slate-100">
                  {formatCompactNumber(selectedExecution.tokens_used || 0)}
                </p>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
                <p className="mb-2 text-xs text-slate-400">المدخل</p>
                <pre className="max-h-72 overflow-auto whitespace-pre-wrap break-words text-xs text-slate-200">
                  {JSON.stringify(selectedExecution.input || {}, null, 2)}
                </pre>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
                <p className="mb-2 text-xs text-slate-400">المخرج</p>
                <pre className="max-h-72 overflow-auto whitespace-pre-wrap break-words text-xs text-slate-200">
                  {JSON.stringify(selectedExecution.output || {}, null, 2)}
                </pre>
              </div>
            </div>

            {selectedExecution.error_message ? (
              <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-100">
                {selectedExecution.error_message}
              </div>
            ) : null}
          </div>
        ) : null}
      </Modal>

      <Link
        to="/agents/new"
        className="fixed bottom-6 left-6 z-30 inline-flex min-h-[52px] items-center gap-2 rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-bold text-slate-950 shadow-xl shadow-emerald-900/30 transition hover:-translate-y-1 hover:bg-emerald-300"
      >
        <Plus className="h-4 w-4" />
        إنشاء وكيل
      </Link>
    </div>
  );
};

export default Dashboard;
