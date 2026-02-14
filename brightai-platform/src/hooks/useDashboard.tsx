import {
  type Dispatch,
  type SetStateAction,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  Bot,
  CheckCircle2,
  Coins,
  Hash,
  Zap,
} from "lucide-react";
import type {
  ChartMetricKey,
  DashboardChartPoint,
} from "../components/dashboard/MainPerformanceChart";
import { MiniSparkline, ProgressRing } from "../components/dashboard";
import {
  DISMISSED_ALERTS_STORAGE_KEY,
  TOKENS_MONTHLY_LIMIT,
} from "../constants/dashboard.constants";
import useAppToast from "../hooks/useAppToast";
import {
  formatCompactNumber,
  formatCurrency,
  getCache,
  getGreeting,
  normalizeAgentStatus,
  normalizeExecutionStatus,
  setCache,
} from "../lib/dashboard.utils";
import supabase from "../lib/supabase";
import type {
  ActivityItem,
  AgentRow,
  AgentStatus,
  AlertItem,
  ApiKeyRow,
  ChartPeriod,
  ExecutionRow,
  ExecutionStatus,
  LoadingState,
  StatCardItem,
} from "../types/dashboard.types";

type UseDashboardResult = {
  loadingSections: LoadingState;
  userName: string;
  userAvatar: string;
  greeting: string;
  summaryText: string;
  smartBannerMessages: string[];
  statsCards: StatCardItem[];
  chartPeriod: ChartPeriod;
  setChartPeriod: Dispatch<SetStateAction<ChartPeriod>>;
  chartMetric: ChartMetricKey;
  setChartMetric: Dispatch<SetStateAction<ChartMetricKey>>;
  chartData: DashboardChartPoint[];
  agentSearch: string;
  setAgentSearch: Dispatch<SetStateAction<string>>;
  agentStatusFilter: "الكل" | AgentStatus;
  setAgentStatusFilter: Dispatch<SetStateAction<"الكل" | AgentStatus>>;
  filteredAgents: AgentRow[];
  executionFilter: "الكل" | ExecutionStatus;
  setExecutionFilter: Dispatch<SetStateAction<"الكل" | ExecutionStatus>>;
  visibleExecutions: ExecutionRow[];
  selectedExecution: ExecutionRow | null;
  setSelectedExecution: Dispatch<SetStateAction<ExecutionRow | null>>;
  agentNameMap: Map<string, string>;
  activities: ActivityItem[];
  alerts: AlertItem[];
  dismissAlert: (id: string) => void;
  handleAgentEdit: (agentId: string) => void;
  handleAgentToggle: (agent: AgentRow) => Promise<void>;
  handleAgentClone: (agent: AgentRow) => Promise<void>;
  handleAgentDelete: (agent: AgentRow) => Promise<void>;
};

const supabaseClient = supabase as unknown as {
  from: (table: string) => any;
  channel: (name: string) => any;
  removeChannel: (channel: unknown) => void;
  auth: {
    getSession: () => Promise<{
      data: {
        session: {
          user: {
            id: string;
            user_metadata?: {
              full_name?: string;
            };
          };
        } | null;
      };
    }>;
  };
};

export const useDashboard = (): UseDashboardResult => {
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
      const raw = window.localStorage.getItem(DISMISSED_ALERTS_STORAGE_KEY);
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
      DISMISSED_ALERTS_STORAGE_KEY,
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
    void loadDashboard();
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
        void loadDashboard(true, true);
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
      (item) => item.status === "نشط" && new Date(item.updated_at).getTime() >= weekStart
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

  const statsCards: StatCardItem[] = [
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

  return {
    loadingSections,
    userName,
    userAvatar,
    greeting,
    summaryText,
    smartBannerMessages,
    statsCards,
    chartPeriod,
    setChartPeriod,
    chartMetric,
    setChartMetric,
    chartData,
    agentSearch,
    setAgentSearch,
    agentStatusFilter,
    setAgentStatusFilter,
    filteredAgents,
    executionFilter,
    setExecutionFilter,
    visibleExecutions,
    selectedExecution,
    setSelectedExecution,
    agentNameMap,
    activities,
    alerts,
    dismissAlert,
    handleAgentEdit,
    handleAgentToggle,
    handleAgentClone,
    handleAgentDelete,
  };
};

export default useDashboard;
