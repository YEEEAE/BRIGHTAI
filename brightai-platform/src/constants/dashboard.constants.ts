import type { AgentStatus, ChartPeriod, ExecutionStatus } from "../types/dashboard.types";

export const DASHBOARD_CACHE_KEY = "brightai_dashboard_cache_v2";
export const DASHBOARD_CACHE_TTL_MS = 90 * 1000;
export const DISMISSED_ALERTS_STORAGE_KEY = "brightai_dashboard_dismissed_alerts";
export const TOKENS_MONTHLY_LIMIT = 500000;

export const DASHBOARD_PERIODS: ChartPeriod[] = [
  "اليوم",
  "هذا الأسبوع",
  "هذا الشهر",
  "آخر 3 أشهر",
];

export const EXECUTION_FILTERS: Array<"الكل" | ExecutionStatus> = [
  "الكل",
  "ناجح",
  "فشل",
  "قيد التنفيذ",
];

export const AGENT_FILTERS: Array<"الكل" | AgentStatus> = [
  "الكل",
  "نشط",
  "مسودة",
  "متوقف",
  "معطل",
  "قيد المراجعة",
];
