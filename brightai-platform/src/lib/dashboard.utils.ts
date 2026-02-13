import {
  DASHBOARD_CACHE_KEY,
  DASHBOARD_CACHE_TTL_MS,
} from "../constants/dashboard.constants";
import type {
  AgentStatus,
  DashboardCache,
  ExecutionStatus,
} from "../types/dashboard.types";

export const normalizeAgentStatus = (value: string | null): AgentStatus => {
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

export const normalizeExecutionStatus = (value: string | null): ExecutionStatus => {
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

export const getGreeting = (date: Date) => {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) {
    return "صباح الخير";
  }
  if (hour >= 12 && hour < 20) {
    return "مساء الخير";
  }
  return "أهلاً";
};

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("ar-SA", {
    style: "currency",
    currency: "SAR",
    maximumFractionDigits: 2,
  }).format(value);
};

export const formatCompactNumber = (value: number) => {
  return new Intl.NumberFormat("ar-SA", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
};

export const toDisplayDateTime = (value: string | null) => {
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

export const toRelativeTime = (value: string) => {
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

export const formatDuration = (durationMs: number | null) => {
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

export const truncateText = (value: string, length: number) => {
  if (value.length <= length) {
    return value;
  }
  return `${value.slice(0, length)}...`;
};

export const jsonPreview = (value: Record<string, unknown> | null, max = 70) => {
  if (!value) {
    return "-";
  }
  const text = JSON.stringify(value);
  return truncateText(text, max);
};

export const getCache = (userId: string): DashboardCache | null => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(DASHBOARD_CACHE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as DashboardCache;
    const validUser = parsed.userId === userId;
    const validAge = Date.now() - parsed.timestamp <= DASHBOARD_CACHE_TTL_MS;

    if (!validUser || !validAge) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
};

export const setCache = (payload: DashboardCache) => {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(DASHBOARD_CACHE_KEY, JSON.stringify(payload));
};
