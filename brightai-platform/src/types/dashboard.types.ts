import type { ReactNode } from "react";

export type AgentStatus = "نشط" | "متوقف" | "قيد المراجعة" | "مسودة" | "معطل";
export type ExecutionStatus = "ناجح" | "فشل" | "قيد التنفيذ";
export type ChartPeriod = "اليوم" | "هذا الأسبوع" | "هذا الشهر" | "آخر 3 أشهر";

export type AgentRow = {
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

export type ExecutionRow = {
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

export type ApiKeyRow = {
  id: string;
  provider: string;
  is_active: boolean;
  usage_count: number | null;
  rate_limit_per_day: number | null;
  created_at: string;
  last_used_at: string | null;
};

export type ActivityItem = {
  id: string;
  title: string;
  subtitle: string;
  type: "وكيل" | "تنفيذ" | "مفتاح";
  created_at: string;
};

export type AlertItem = {
  id: string;
  title: string;
  description: string;
  type: "تحذير" | "خطر" | "توصية";
};

export type LoadingState = {
  welcome: boolean;
  stats: boolean;
  chart: boolean;
  agents: boolean;
  executions: boolean;
  activity: boolean;
  alerts: boolean;
};

export type DashboardCache = {
  userId: string;
  timestamp: number;
  userName: string;
  userAvatar: string;
  agents: AgentRow[];
  executions: ExecutionRow[];
  apiKeys: ApiKeyRow[];
};

export type StatCardProps = {
  title: string;
  value: string;
  delta: number;
  subtitle: string;
  to: string;
  icon: ReactNode;
  extra?: ReactNode;
};

export type StatCardItem = {
  key: string;
  title: string;
  value: string;
  delta: number;
  subtitle: string;
  to: string;
  icon: ReactNode;
  extra?: ReactNode | null;
};

export type ExecutionPoint = {
  executions: number;
  success: number;
  cost: number;
  tokens: number;
};

export type ExecutionAnalytics = {
  todayExecutions: number;
  failedToday: number;
  monthCost: number;
  monthTokens: number;
  thisWeekExecutions: number;
  thisWeekSuccess: number;
  thisWeekCost: number;
  thisWeekTokens: number;
  prevWeekExecutions: number;
  prevWeekSuccess: number;
  prevWeekCost: number;
  prevWeekTokens: number;
  byHour: Map<string, ExecutionPoint>;
  byDay: Map<string, ExecutionPoint>;
  byAgent: Map<string, { total: number; failed: number }>;
};
