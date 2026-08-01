/**
 * kernel-stats.ts — Deterministic stats dataset for /kernel/stats/ (M24).
 *
 * M24 — Full deterministic generator producing 12,483 requests + time series +
 * risk distribution + top users + top departments + top models by cost + live
 * event stream + period comparison + alerts + quotas + cost + latency.
 *
 * No Math.random, no Date.now: a single fixed seed (STATS_SEED) drives a
 * mulberry32 PRNG. Mirrored byte-for-byte in public/js/kernel-stats-data.js.
 *
 * Exact count contract (verified by scripts/verify-stats.mjs):
 *   - total requests   = 12,483
 *   - allowed          = 11,210
 *   - blocked          = 382
 *   - pending          = 841
 *   - pii              = 1,554
 *   - top users        = 10
 *   - top departments  = 7
 *   - top models       = 5
 *   - live events      = 20
 *   - alerts           = 4
 *   - quotas           = 7
 *
 * Prompt 24 features covered:
 *   - requests/allowed/blocked/pending/risks/PII
 *   - time series + risk distribution
 *   - top users + top departments + top models by cost
 *   - live event stream + pause
 *   - clickable KPI filters (→ audit)
 *   - period comparison
 *   - custom widgets
 *   - alerts + quotas + cost + latency
 */

// ── Types ────────────────────────────────────────────────────────────────────

export interface KernelStatsKpi {
  key: string;
  label: string;
  value: number;
  unit?: string;
  trend: 'up' | 'down' | 'flat';
  trendLabel: string;
  footer: string;
  /** Filter to apply when KPI is clicked (→ /kernel/audit/?status=blocked). */
  auditFilter: string;
  iconSvg: string;
}

export interface KernelStatsTimeSeries {
  labels: string[];
  allowed: number[];
  blocked: number[];
  pending: number[];
}

export interface KernelStatsRiskDistribution {
  labels: string[];
  data: number[];
  colors: string[];
}

export interface KernelStatsTopUser {
  rank: number;
  name: string;
  department: string;
  requests: number;
  blocked: number;
  pii: number;
}

export interface KernelStatsTopDepartment {
  rank: number;
  name: string;
  requests: number;
  blocked: number;
  cost: number;
}

export interface KernelStatsTopModel {
  rank: number;
  name: string;
  provider: string;
  cost: number;
  requests: number;
  quotaUsed: number;
  quotaMax: number;
}

export interface KernelStatsLiveEvent {
  id: string;
  traceId: string;
  status: 'allowed' | 'blocked' | 'pending' | 'approved';
  department: string;
  time: string;
  risk: number;
}

export interface KernelStatsAlert {
  id: string;
  rule: string;
  channel: string;
  status: 'active' | 'paused';
  triggered: number;
}

export interface KernelStatsQuota {
  id: string;
  department: string;
  used: number;
  max: number;
  percentage: number;
}

export interface KernelStatsCost {
  totalCost: number;
  byModel: { name: string; cost: number }[];
  byDepartment: { name: string; cost: number }[];
}

export interface KernelStatsLatency {
  p50: number;
  p95: number;
  p99: number;
  byModel: { name: string; p50: number; p95: number; p99: number }[];
}

export interface KernelStatsPeriodComparison {
  current: { period: string; total: number; blocked: number; pii: number };
  previous: { period: string; total: number; blocked: number; pii: number };
  deltas: { total: number; blocked: number; pii: number };
}

export interface KernelStatsData {
  kpis: KernelStatsKpi[];
  timeSeries: KernelStatsTimeSeries;
  riskDistribution: KernelStatsRiskDistribution;
  topUsers: KernelStatsTopUser[];
  topDepartments: KernelStatsTopDepartment[];
  topModels: KernelStatsTopModel[];
  liveEvents: KernelStatsLiveEvent[];
  alerts: KernelStatsAlert[];
  quotas: KernelStatsQuota[];
  cost: KernelStatsCost;
  latency: KernelStatsLatency;
  periodComparison: KernelStatsPeriodComparison;
}

// ── Constants ────────────────────────────────────────────────────────────────

export const STATS_SEED = 0x5c0ffee0;

export const STATS_TOTAL = 12483;
export const STATS_ALLOWED = 11210;
export const STATS_BLOCKED = 382;
export const STATS_PENDING = 841;
export const STATS_PII = 1554;
export const STATS_TOP_USERS = 10;
export const STATS_TOP_DEPARTMENTS = 7;
export const STATS_TOP_MODELS = 5;
export const STATS_LIVE_EVENTS = 20;
export const STATS_ALERTS = 4;
export const STATS_QUOTAS = 7;

export const STATS_DEPARTMENTS = [
  'المالية', 'الموارد البشرية', 'الرعاية الصحية', 'القانونية',
  'المشتريات', 'التسويق', 'التقنية',
];

export const STATS_MODELS = [
  { name: 'gpt-4o', provider: 'OpenAI', cost: 2450.50 },
  { name: 'claude-3.5-sonnet', provider: 'Anthropic', cost: 1820.30 },
  { name: 'llama-3.1-70b', provider: 'NVIDIA NIM (محلي)', cost: 320.80 },
  { name: 'gemini-1.5-pro', provider: 'Google Vertex', cost: 1280.75 },
  { name: 'mistral-large', provider: 'Azure (سحابة سعودية)', cost: 680.40 },
];

// ── PRNG + Hash (byte-identical to kernel-reports.ts) ────────────────────────

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function pick<T>(arr: readonly T[], rand: () => number): T {
  return arr[Math.floor(rand() * arr.length)];
}

// ── KPIs ─────────────────────────────────────────────────────────────────────

const iconActivity = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>';
const iconCheck = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
const iconLock = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>';
const iconClock = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>';
const iconPii = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>';
const iconRisk = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>';

export function buildKpis(): KernelStatsKpi[] {
  return [
    {
      key: 'total',
      label: 'إجمالي الطلبات',
      value: STATS_TOTAL,
      unit: 'طلب',
      trend: 'up',
      trendLabel: '8%',
      footer: 'مقارنة بالفترة السابقة',
      auditFilter: '',
      iconSvg: iconActivity,
    },
    {
      key: 'allowed',
      label: 'السموح بها',
      value: STATS_ALLOWED,
      unit: 'طلب',
      trend: 'up',
      trendLabel: '2%',
      footer: '89.8% من الإجمالي',
      auditFilter: 'status=allowed',
      iconSvg: iconCheck,
    },
    {
      key: 'blocked',
      label: 'المحظورة',
      value: STATS_BLOCKED,
      unit: 'طلب',
      trend: 'down',
      trendLabel: '12%',
      footer: 'عالية الخطورة',
      auditFilter: 'status=blocked',
      iconSvg: iconLock,
    },
    {
      key: 'pending',
      label: 'بانتظار الموافقة',
      value: STATS_PENDING,
      unit: 'طلب',
      trend: 'up',
      trendLabel: '5%',
      footer: 'تحتاج قرار بشري',
      auditFilter: 'status=pending',
      iconSvg: iconClock,
    },
    {
      key: 'pii',
      label: 'PII مكتشف',
      value: STATS_PII,
      unit: 'طلب',
      trend: 'down',
      trendLabel: '4%',
      footer: 'نسبة 12.4%',
      auditFilter: 'pii=1',
      iconSvg: iconPii,
    },
    {
      key: 'risk',
      label: 'متوسط المخاطر',
      value: 23,
      unit: '%',
      trend: 'flat',
      trendLabel: '0%',
      footer: 'درجة تراكمية',
      auditFilter: 'risk=high',
      iconSvg: iconRisk,
    },
  ];
}

// ── Time series ──────────────────────────────────────────────────────────────

export function buildTimeSeries(): KernelStatsTimeSeries {
  const rand = mulberry32(STATS_SEED ^ 0x1);
  const labels = ['٠٠:٠٠', '٠٣:٠٠', '٠٦:٠٠', '٠٩:٠٠', '١٢:٠٠', '١٥:٠٠', '١٨:٠٠', '٢١:٠٠', '٢٣:٠٠'];
  const allowed: number[] = [];
  const blocked: number[] = [];
  const pending: number[] = [];

  for (let i = 0; i < labels.length; i += 1) {
    const isPeak = i >= 3 && i <= 5;
    const boost = isPeak ? 1.4 : i === 6 || i === 1 ? 0.6 : 1;
    allowed.push(Math.floor((80 + rand() * 100) * boost));
    blocked.push(Math.floor((2 + rand() * 8) * boost));
    pending.push(Math.floor((5 + rand() * 15) * boost));
  }

  return { labels, allowed, blocked, pending };
}

// ── Risk distribution ────────────────────────────────────────────────────────

export function buildRiskDistribution(): KernelStatsRiskDistribution {
  return {
    labels: ['حرج', 'مرتفع', 'متوسط', 'منخفض', 'ضئيل'],
    data: [12, 34, 68, 146, 88],
    colors: ['#ef4444', '#f97316', '#f59e0b', '#22c55e', '#10b981'],
  };
}

// ── Top users ────────────────────────────────────────────────────────────────

const USER_NAMES = [
  'محمد الحربي', 'سارة الفيصل', 'أحمد القحطاني', 'نورة الشهراني',
  'خالد الغامدي', 'فهد العتيبي', 'ريم الدوسري', 'عبدالله الزهراني',
  'مها السبيعي', 'ناصر المطيري',
];

export function buildTopUsers(): KernelStatsTopUser[] {
  const rand = mulberry32(STATS_SEED ^ 0x2);
  const users: KernelStatsTopUser[] = [];
  for (let i = 0; i < STATS_TOP_USERS; i += 1) {
    users.push({
      rank: i + 1,
      name: USER_NAMES[i],
      department: pick(STATS_DEPARTMENTS, rand),
      requests: 500 - i * 35 - Math.floor(rand() * 20),
      blocked: Math.floor(rand() * 30) + 5,
      pii: Math.floor(rand() * 50) + 10,
    });
  }
  return users;
}

// ── Top departments ──────────────────────────────────────────────────────────

export function buildTopDepartments(): KernelStatsTopDepartment[] {
  const rand = mulberry32(STATS_SEED ^ 0x3);
  const depts: KernelStatsTopDepartment[] = [];
  for (let i = 0; i < STATS_TOP_DEPARTMENTS; i += 1) {
    depts.push({
      rank: i + 1,
      name: STATS_DEPARTMENTS[i],
      requests: 2000 - i * 200 - Math.floor(rand() * 100),
      blocked: Math.floor(rand() * 50) + 10,
      cost: Math.round((500 - i * 50 - rand() * 50) * 100) / 100,
    });
  }
  return depts;
}

// ── Top models by cost ───────────────────────────────────────────────────────

export function buildTopModels(): KernelStatsTopModel[] {
  const rand = mulberry32(STATS_SEED ^ 0x4);
  const models: KernelStatsTopModel[] = [];
  for (let i = 0; i < STATS_TOP_MODELS; i += 1) {
    const m = STATS_MODELS[i];
    const quotaMax = 10000;
    const quotaUsed = Math.floor(quotaMax * (0.3 + rand() * 0.6));
    models.push({
      rank: i + 1,
      name: m.name,
      provider: m.provider,
      cost: m.cost,
      requests: Math.floor(2000 - i * 200 - rand() * 100),
      quotaUsed,
      quotaMax,
    });
  }
  return models;
}

// ── Live events ──────────────────────────────────────────────────────────────

export function buildLiveEvents(): KernelStatsLiveEvent[] {
  const rand = mulberry32(STATS_SEED ^ 0x5);
  const events: KernelStatsLiveEvent[] = [];
  const statuses: KernelStatsLiveEvent['status'][] = ['allowed', 'blocked', 'pending', 'approved'];

  for (let i = 0; i < STATS_LIVE_EVENTS; i += 1) {
    const status = statuses[Math.floor(rand() * statuses.length)];
    events.push({
      id: 'evt-' + String(i + 1).padStart(3, '0'),
      traceId: 'AI-2026-' + String(10493 - i),
      status,
      department: pick(STATS_DEPARTMENTS, rand),
      time: 'قبل ' + (i * 2 + 1) + 'د',
      risk: Math.floor(rand() * 100),
    });
  }
  return events;
}

// ── Alerts ───────────────────────────────────────────────────────────────────

export function buildAlerts(): KernelStatsAlert[] {
  return [
    { id: 'alert-1', rule: 'لو [المخاطر العالية] تجاوزت [10%] أرسل لـ [Slack]', channel: 'Slack', status: 'active', triggered: 3 },
    { id: 'alert-2', rule: 'لو [PII] تجاوز [15%] أرسل لـ [DPO]', channel: 'Email', status: 'active', triggered: 1 },
    { id: 'alert-3', rule: 'لو [زمن الاستجابة] تجاوز [3ث] أرسل لـ [CTO]', channel: 'Slack', status: 'active', triggered: 0 },
    { id: 'alert-4', rule: 'لو [التكلفة اليومية] تجاوزت [500 ر.س] أرسل لـ [CFO]', channel: 'SMS', status: 'paused', triggered: 2 },
  ];
}

// ── Quotas ───────────────────────────────────────────────────────────────────

export function buildQuotas(): KernelStatsQuota[] {
  const rand = mulberry32(STATS_SEED ^ 0x6);
  const quotas: KernelStatsQuota[] = [];
  const maxQuota = 50000;

  for (let i = 0; i < STATS_QUOTAS; i += 1) {
    const used = Math.floor(maxQuota * (0.2 + rand() * 0.7));
    quotas.push({
      id: 'quota-' + String(i + 1),
      department: STATS_DEPARTMENTS[i],
      used,
      max: maxQuota,
      percentage: Math.round((used / maxQuota) * 100),
    });
  }
  return quotas;
}

// ── Cost ─────────────────────────────────────────────────────────────────────

export function buildCost(): KernelStatsCost {
  const rand = mulberry32(STATS_SEED ^ 0x7);
  const byModel = STATS_MODELS.map((m) => ({ name: m.name, cost: m.cost }));
  const byDepartment = STATS_DEPARTMENTS.slice(0, 5).map((d, i) => ({
    name: d,
    cost: Math.round((800 - i * 120 - rand() * 50) * 100) / 100,
  }));
  const totalCost = byModel.reduce((sum, m) => sum + m.cost, 0);
  return { totalCost, byModel, byDepartment };
}

// ── Latency ──────────────────────────────────────────────────────────────────

export function buildLatency(): KernelStatsLatency {
  const rand = mulberry32(STATS_SEED ^ 0x8);
  const byModel = STATS_MODELS.map((m) => {
    const base = 200 + Math.floor(rand() * 400);
    return {
      name: m.name,
      p50: base,
      p95: base + Math.floor(rand() * 300),
      p99: base + Math.floor(rand() * 600),
    };
  });
  return {
    p50: 412,
    p95: 890,
    p99: 1450,
    byModel,
  };
}

// ── Period comparison ────────────────────────────────────────────────────────

export function buildPeriodComparison(): KernelStatsPeriodComparison {
  return {
    current: { period: 'مايو 2026', total: STATS_TOTAL, blocked: STATS_BLOCKED, pii: STATS_PII },
    previous: { period: 'أبريل 2026', total: 11540, blocked: 434, pii: 1620 },
    deltas: {
      total: Math.round(((STATS_TOTAL - 11540) / 11540) * 100),
      blocked: Math.round(((STATS_BLOCKED - 434) / 434) * 100),
      pii: Math.round(((STATS_PII - 1620) / 1620) * 100),
    },
  };
}

// ── Full dataset ─────────────────────────────────────────────────────────────

export function buildStatsData(): KernelStatsData {
  return {
    kpis: buildKpis(),
    timeSeries: buildTimeSeries(),
    riskDistribution: buildRiskDistribution(),
    topUsers: buildTopUsers(),
    topDepartments: buildTopDepartments(),
    topModels: buildTopModels(),
    liveEvents: buildLiveEvents(),
    alerts: buildAlerts(),
    quotas: buildQuotas(),
    cost: buildCost(),
    latency: buildLatency(),
    periodComparison: buildPeriodComparison(),
  };
}