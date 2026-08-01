/**
 * kernel-models.ts — Deterministic models dataset for /kernel/models/ (M25).
 *
 * M25 — Full deterministic generator producing model registry + arena +
 * routing rules + manual overrides + degradation alerts + security leaderboard.
 *
 * No Math.random, no Date.now: a single fixed seed (MODELS_SEED) drives a
 * mulberry32 PRNG. Mirrored byte-for-byte in public/js/kernel-models-data.js.
 *
 * Exact count contract (verified by scripts/verify-models.mjs):
 *   - models registry     = 6
 *   - arena models        = 3
 *   - routing nodes       = 9
 *   - routing links       = 12
 *   - manual overrides    = 2
 *   - degradation alerts  = 3
 *   - security leaderboard = 6
 *
 * Prompt 25 features covered:
 *   - model registry + version + provider + deployment location badge
 *   - latency + cost/1K tokens + scenario success + hallucination + safety
 *   - Arena A/B (parallel simulation + vote)
 *   - routing rules (sensitive data → local model)
 *   - manual override + degradation alert
 *   - model comparison export
 */

// ── Types ────────────────────────────────────────────────────────────────────

export interface KernelModelRegistry {
  id: string;
  name: string;
  version: string;
  provider: string;
  logo: string;
  dataLocation: 'cloud' | 'saudi' | 'local';
  locationLabel: string;
  medianLatency: number;
  costPer1k: number;
  successRate: number;
  hallucinationRate: number;
  safetyScore: number;
  status: 'active' | 'degraded';
  statusLabel: string;
}

export interface KernelArenaModel {
  id: string;
  name: string;
  logo: string;
  baseLatency: number;
  baseCost: number;
  baseGovernance: number;
}

export interface KernelArenaResult {
  modelId: string;
  modelName: string;
  time: number;
  cost: number;
  governance: number;
  isWinner: boolean;
  response: string;
}

export interface KernelRoutingNode {
  id: string;
  label: string;
  type: 'start' | 'decision' | 'model' | 'end';
  x: number;
  y: number;
}

export interface KernelRoutingLink {
  from: string;
  to: string;
}

export interface KernelRoutingRule {
  id: string;
  condition: string;
  targetModel: string;
  targetModelId: string;
  priority: number;
  active: boolean;
}

export interface KernelManualOverride {
  id: string;
  rule: string;
  originalModel: string;
  overrideModel: string;
  reason: string;
  status: 'active' | 'pending';
}

export interface KernelDegradationAlert {
  id: string;
  level: 'warning' | 'danger' | 'info';
  title: string;
  time: string;
  desc: string;
  modelId: string;
}

export interface KernelSecurityLeaderboardEntry {
  rank: number;
  name: string;
  score: number;
  label: string;
}

export interface KernelModelsData {
  registry: KernelModelRegistry[];
  arenaModels: KernelArenaModel[];
  routingNodes: KernelRoutingNode[];
  routingLinks: KernelRoutingLink[];
  routingRules: KernelRoutingRule[];
  manualOverrides: KernelManualOverride[];
  alerts: KernelDegradationAlert[];
  securityLeaderboard: KernelSecurityLeaderboardEntry[];
}

// ── Constants ────────────────────────────────────────────────────────────────

export const MODELS_SEED = 0x4d4f4445; // "MODE" in hex

export const MODELS_REGISTRY_COUNT = 6;
export const MODELS_ARENA_COUNT = 3;
export const MODELS_ROUTING_NODES = 9;
export const MODELS_ROUTING_LINKS = 12;
export const MODELS_OVERRIDES = 2;
export const MODELS_ALERTS = 3;
export const MODELS_LEADERBOARD = 6;

// ── PRNG + Hash (byte-identical to kernel-stats.ts) ────────────────────────────

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

// ── Model registry ───────────────────────────────────────────────────────────

export function buildRegistry(): KernelModelRegistry[] {
  return [
    {
      id: 'gpt-4o',
      name: 'GPT-4o',
      version: 'gpt-4o-2024-11-20',
      provider: 'OpenAI',
      logo: '🤖',
      dataLocation: 'cloud',
      locationLabel: '☁️ سحابي',
      medianLatency: 420,
      costPer1k: 2.5,
      successRate: 94,
      hallucinationRate: 8,
      safetyScore: 92,
      status: 'active',
      statusLabel: 'نشط',
    },
    {
      id: 'claude-3-5-sonnet',
      name: 'Claude 3.5 Sonnet',
      version: 'claude-3-5-sonnet-20241022',
      provider: 'Anthropic',
      logo: '🧠',
      dataLocation: 'cloud',
      locationLabel: '☁️ سحابي',
      medianLatency: 380,
      costPer1k: 3.0,
      successRate: 96,
      hallucinationRate: 5,
      safetyScore: 97,
      status: 'active',
      statusLabel: 'نشط',
    },
    {
      id: 'gemini-2-0-flash',
      name: 'Gemini 2.0 Flash',
      version: 'gemini-2.0-flash-exp',
      provider: 'Google',
      logo: '💎',
      dataLocation: 'cloud',
      locationLabel: '☁️ سحابي',
      medianLatency: 350,
      costPer1k: 1.5,
      successRate: 91,
      hallucinationRate: 12,
      safetyScore: 82,
      status: 'active',
      statusLabel: 'نشط',
    },
    {
      id: 'arabillm-4b',
      name: 'ArabiLLM 4B',
      version: 'arabillm-4b-v1',
      provider: 'SDAIA',
      logo: '🇸🇦',
      dataLocation: 'saudi',
      locationLabel: '🇸🇦 سعودي',
      medianLatency: 680,
      costPer1k: 0.8,
      successRate: 78,
      hallucinationRate: 18,
      safetyScore: 88,
      status: 'active',
      statusLabel: 'نشط',
    },
    {
      id: 'jais-13b',
      name: 'Jais 13B',
      version: 'jais-13b-chat-v1',
      provider: 'Inception (محلي)',
      logo: '🏠',
      dataLocation: 'local',
      locationLabel: '🏠 محلي',
      medianLatency: 1200,
      costPer1k: 0.3,
      successRate: 72,
      hallucinationRate: 22,
      safetyScore: 71,
      status: 'degraded',
      statusLabel: 'تدهور',
    },
    {
      id: 'llama-3-1-70b',
      name: 'Llama 3.1 70B',
      version: 'llama-3.1-70b-instruct',
      provider: 'Meta (محلي)',
      logo: '🦙',
      dataLocation: 'cloud',
      locationLabel: '☁️ سحابي',
      medianLatency: 950,
      costPer1k: 4.0,
      successRate: 93,
      hallucinationRate: 6,
      safetyScore: 85,
      status: 'active',
      statusLabel: 'نشط',
    },
  ];
}

// ── Arena models ─────────────────────────────────────────────────────────────

export function buildArenaModels(): KernelArenaModel[] {
  return [
    {
      id: 'gpt-4o',
      name: 'GPT-4o',
      logo: '🤖',
      baseLatency: 420,
      baseCost: 2.5,
      baseGovernance: 92,
    },
    {
      id: 'claude-3-5-sonnet',
      name: 'Claude 3.5 Sonnet',
      logo: '🧠',
      baseLatency: 380,
      baseCost: 3.0,
      baseGovernance: 97,
    },
    {
      id: 'gemini-2-0-flash',
      name: 'Gemini 2.0 Flash',
      logo: '💎',
      baseLatency: 350,
      baseCost: 1.5,
      baseGovernance: 82,
    },
  ];
}

// ── Arena run (deterministic simulation) ─────────────────────────────────────

export function buildArenaRun(prompt: string): KernelArenaResult[] {
  const rand = mulberry32(MODELS_SEED ^ 0xa1);
  const models = buildArenaModels();

  // Compute all times first, then determine winner (avoids extra rand() calls)
  const times = models.map((m) => m.baseLatency + Math.floor(rand() * 60) - 30);
  const minTime = Math.min(...times);

  return models.map((m, i) => {
    const time = times[i];
    const cost = Math.round((m.baseCost + rand() * 0.3) * 100) / 100;
    const governance = m.baseGovernance + Math.floor(rand() * 4) - 2;
    return {
      modelId: m.id,
      modelName: m.name,
      time,
      cost,
      governance,
      isWinner: time === minTime,
      response: 'النموذج ' + m.name + ' أنهى معالجة الطلب: ' + prompt,
    };
  });
}

// ── Routing nodes ────────────────────────────────────────────────────────────

export function buildRoutingNodes(): KernelRoutingNode[] {
  return [
    { id: 'start', label: 'بداية الطلب', type: 'start', x: 80, y: 200 },
    { id: 'pii', label: 'بيانات حساسة؟', type: 'decision', x: 280, y: 80 },
    { id: 'sensitive', label: 'حساسية عالية؟', type: 'decision', x: 280, y: 200 },
    { id: 'section', label: 'قسم حكومي؟', type: 'decision', x: 280, y: 320 },
    { id: 'local', label: 'نموذج محلي', type: 'model', x: 520, y: 50 },
    { id: 'saudi', label: 'نموذج سعودي', type: 'model', x: 520, y: 170 },
    { id: 'cloud', label: 'نموذج سحابي', type: 'model', x: 520, y: 290 },
    { id: 'local_fallback', label: 'نموذج محلي', type: 'model', x: 520, y: 410 },
    { id: 'end', label: 'النموذج المختار', type: 'end', x: 720, y: 200 },
  ];
}

// ── Routing links ────────────────────────────────────────────────────────────

export function buildRoutingLinks(): KernelRoutingLink[] {
  return [
    { from: 'start', to: 'pii' },
    { from: 'start', to: 'sensitive' },
    { from: 'start', to: 'section' },
    { from: 'pii', to: 'local' },
    { from: 'sensitive', to: 'saudi' },
    { from: 'sensitive', to: 'cloud' },
    { from: 'section', to: 'local_fallback' },
    { from: 'section', to: 'cloud' },
    { from: 'local', to: 'end' },
    { from: 'saudi', to: 'end' },
    { from: 'cloud', to: 'end' },
    { from: 'local_fallback', to: 'end' },
  ];
}

// ── Routing rules ────────────────────────────────────────────────────────────

export function buildRoutingRules(): KernelRoutingRule[] {
  return [
    {
      id: 'rule-1',
      condition: 'بيانات حساسة → نموذج محلي',
      targetModel: 'Jais 13B',
      targetModelId: 'jais-13b',
      priority: 1,
      active: true,
    },
    {
      id: 'rule-2',
      condition: 'حساسية عالية → نموذج سعودي',
      targetModel: 'ArabiLLM 4B',
      targetModelId: 'arabillm-4b',
      priority: 2,
      active: true,
    },
    {
      id: 'rule-3',
      condition: 'قسم حكومي → نموذج محلي',
      targetModel: 'Llama 3.1 70B',
      targetModelId: 'llama-3-1-70b',
      priority: 3,
      active: true,
    },
    {
      id: 'rule-4',
      condition: 'أسئلة عامة → نموذج سحابي',
      targetModel: 'GPT-4o',
      targetModelId: 'gpt-4o',
      priority: 4,
      active: true,
    },
  ];
}

// ── Manual overrides ─────────────────────────────────────────────────────────

export function buildManualOverrides(): KernelManualOverride[] {
  return [
    {
      id: 'override-1',
      rule: 'بيانات حساسة → نموذج محلي',
      originalModel: 'GPT-4o',
      overrideModel: 'ArabiLLM 4B',
      reason: 'مؤقت — صيانة النموذج السعودي',
      status: 'active',
    },
    {
      id: 'override-2',
      rule: 'قسم حكومي → نموذج محلي',
      originalModel: 'Claude 3.5 Sonnet',
      overrideModel: 'ArabiLLM 4B',
      reason: 'متطلب امتثال SFDA',
      status: 'active',
    },
  ];
}

// ── Degradation alerts ───────────────────────────────────────────────────────

export function buildAlerts(): KernelDegradationAlert[] {
  return [
    {
      id: 'alert-1',
      level: 'warning',
      title: 'تدهور أداء Jais 13B',
      time: 'منذ 3 ساعات',
      desc: 'معدل الهلوسة ارتفع من 18% إلى 22%. يُنقل الطلبات مؤقتاً لـ Llama 3.1.',
      modelId: 'jais-13b',
    },
    {
      id: 'alert-2',
      level: 'danger',
      title: 'توكن ArabiLLM 4B منتهي قريباً',
      time: 'بعد 48 ساعة',
      desc: 'الرصيد المتبقي 15% من الحصة الشهرية. جدّد قبل نفاد لتجنّب انقطاع.',
      modelId: 'arabillm-4b',
    },
    {
      id: 'alert-3',
      level: 'info',
      title: 'تحديث GPT-4o v2 متاح',
      time: 'أمس',
      desc: 'الإصدار الجديد يخفّض الهلوسة بنسبة 2% ويحسّن الزمن بنسبة 10%.',
      modelId: 'gpt-4o',
    },
  ];
}

// ── Security leaderboard ─────────────────────────────────────────────────────

export function buildSecurityLeaderboard(): KernelSecurityLeaderboardEntry[] {
  return [
    { rank: 1, name: 'Claude 3.5 Sonnet', score: 97, label: 'نتيجة الأسبوع' },
    { rank: 2, name: 'GPT-4o', score: 94, label: 'نتيجة الأسبوع' },
    { rank: 3, name: 'ArabiLLM 4B', score: 88, label: 'نتيجة الأسبوع' },
    { rank: 4, name: 'Llama 3.1 70B', score: 85, label: 'نتيجة الأسبوع' },
    { rank: 5, name: 'Gemini 2.0 Flash', score: 82, label: 'نتيجة الأسبوع' },
    { rank: 6, name: 'Jais 13B', score: 71, label: 'نتيجة الأسبوع' },
  ];
}

// ── Full dataset ─────────────────────────────────────────────────────────────

export function buildModelsData(): KernelModelsData {
  return {
    registry: buildRegistry(),
    arenaModels: buildArenaModels(),
    routingNodes: buildRoutingNodes(),
    routingLinks: buildRoutingLinks(),
    routingRules: buildRoutingRules(),
    manualOverrides: buildManualOverrides(),
    alerts: buildAlerts(),
    securityLeaderboard: buildSecurityLeaderboard(),
  };
}