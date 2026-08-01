/**
 * kernel-models-data.js — UMD mirror of src/data/kernel-models.ts (M25).
 *
 * Byte-for-byte identical algorithm. No Math.random, no Date.now, no
 * toLocaleString. Works in: browser main thread (window.KernelModelsData),
 * Web Worker (importScripts), Node (module.exports).
 *
 * CSP-safe: no dynamic imports, no eval, no Function constructor.
 */
(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.KernelModelsData = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // ── Constants ──────────────────────────────────────────────────────────────

  var MODELS_SEED = 0x4d4f4445;

  var MODELS_REGISTRY_COUNT = 6;
  var MODELS_ARENA_COUNT = 3;
  var MODELS_ROUTING_NODES = 9;
  var MODELS_ROUTING_LINKS = 12;
  var MODELS_OVERRIDES = 2;
  var MODELS_ALERTS = 3;
  var MODELS_LEADERBOARD = 6;

  // ── PRNG ───────────────────────────────────────────────────────────────────

  function mulberry32(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function pick(arr, rand) {
    return arr[Math.floor(rand() * arr.length)];
  }

  // ── Model registry ─────────────────────────────────────────────────────────

  function buildRegistry() {
    return [
      { id: 'gpt-4o', name: 'GPT-4o', version: 'gpt-4o-2024-11-20', provider: 'OpenAI', logo: '🤖', dataLocation: 'cloud', locationLabel: '☁️ سحابي', medianLatency: 420, costPer1k: 2.5, successRate: 94, hallucinationRate: 8, safetyScore: 92, status: 'active', statusLabel: 'نشط' },
      { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet', version: 'claude-3-5-sonnet-20241022', provider: 'Anthropic', logo: '🧠', dataLocation: 'cloud', locationLabel: '☁️ سحابي', medianLatency: 380, costPer1k: 3.0, successRate: 96, hallucinationRate: 5, safetyScore: 97, status: 'active', statusLabel: 'نشط' },
      { id: 'gemini-2-0-flash', name: 'Gemini 2.0 Flash', version: 'gemini-2.0-flash-exp', provider: 'Google', logo: '💎', dataLocation: 'cloud', locationLabel: '☁️ سحابي', medianLatency: 350, costPer1k: 1.5, successRate: 91, hallucinationRate: 12, safetyScore: 82, status: 'active', statusLabel: 'نشط' },
      { id: 'arabillm-4b', name: 'ArabiLLM 4B', version: 'arabillm-4b-v1', provider: 'SDAIA', logo: '🇸🇦', dataLocation: 'saudi', locationLabel: '🇸🇦 سعودي', medianLatency: 680, costPer1k: 0.8, successRate: 78, hallucinationRate: 18, safetyScore: 88, status: 'active', statusLabel: 'نشط' },
      { id: 'jais-13b', name: 'Jais 13B', version: 'jais-13b-chat-v1', provider: 'Inception (محلي)', logo: '🏠', dataLocation: 'local', locationLabel: '🏠 محلي', medianLatency: 1200, costPer1k: 0.3, successRate: 72, hallucinationRate: 22, safetyScore: 71, status: 'degraded', statusLabel: 'تدهور' },
      { id: 'llama-3-1-70b', name: 'Llama 3.1 70B', version: 'llama-3.1-70b-instruct', provider: 'Meta (محلي)', logo: '🦙', dataLocation: 'cloud', locationLabel: '☁️ سحابي', medianLatency: 950, costPer1k: 4.0, successRate: 93, hallucinationRate: 6, safetyScore: 85, status: 'active', statusLabel: 'نشط' }
    ];
  }

  // ── Arena models ───────────────────────────────────────────────────────────

  function buildArenaModels() {
    return [
      { id: 'gpt-4o', name: 'GPT-4o', logo: '🤖', baseLatency: 420, baseCost: 2.5, baseGovernance: 92 },
      { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet', logo: '🧠', baseLatency: 380, baseCost: 3.0, baseGovernance: 97 },
      { id: 'gemini-2-0-flash', name: 'Gemini 2.0 Flash', logo: '💎', baseLatency: 350, baseCost: 1.5, baseGovernance: 82 }
    ];
  }

  // ── Arena run (deterministic simulation) ───────────────────────────────────

  function buildArenaRun(prompt) {
    var rand = mulberry32(MODELS_SEED ^ 0xa1);
    var models = buildArenaModels();

    var times = models.map(function (m) { return m.baseLatency + Math.floor(rand() * 60) - 30; });
    var minTime = Math.min.apply(null, times);

    return models.map(function (m, i) {
      var time = times[i];
      var cost = Math.round((m.baseCost + rand() * 0.3) * 100) / 100;
      var governance = m.baseGovernance + Math.floor(rand() * 4) - 2;
      return {
        modelId: m.id,
        modelName: m.name,
        time: time,
        cost: cost,
        governance: governance,
        isWinner: time === minTime,
        response: 'النموذج ' + m.name + ' أنهى معالجة الطلب: ' + prompt
      };
    });
  }

  // ── Routing nodes ──────────────────────────────────────────────────────────

  function buildRoutingNodes() {
    return [
      { id: 'start', label: 'بداية الطلب', type: 'start', x: 80, y: 200 },
      { id: 'pii', label: 'بيانات حساسة؟', type: 'decision', x: 280, y: 80 },
      { id: 'sensitive', label: 'حساسية عالية؟', type: 'decision', x: 280, y: 200 },
      { id: 'section', label: 'قسم حكومي؟', type: 'decision', x: 280, y: 320 },
      { id: 'local', label: 'نموذج محلي', type: 'model', x: 520, y: 50 },
      { id: 'saudi', label: 'نموذج سعودي', type: 'model', x: 520, y: 170 },
      { id: 'cloud', label: 'نموذج سحابي', type: 'model', x: 520, y: 290 },
      { id: 'local_fallback', label: 'نموذج محلي', type: 'model', x: 520, y: 410 },
      { id: 'end', label: 'النموذج المختار', type: 'end', x: 720, y: 200 }
    ];
  }

  // ── Routing links ──────────────────────────────────────────────────────────

  function buildRoutingLinks() {
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
      { from: 'local_fallback', to: 'end' }
    ];
  }

  // ── Routing rules ──────────────────────────────────────────────────────────

  function buildRoutingRules() {
    return [
      { id: 'rule-1', condition: 'بيانات حساسة → نموذج محلي', targetModel: 'Jais 13B', targetModelId: 'jais-13b', priority: 1, active: true },
      { id: 'rule-2', condition: 'حساسية عالية → نموذج سعودي', targetModel: 'ArabiLLM 4B', targetModelId: 'arabillm-4b', priority: 2, active: true },
      { id: 'rule-3', condition: 'قسم حكومي → نموذج محلي', targetModel: 'Llama 3.1 70B', targetModelId: 'llama-3-1-70b', priority: 3, active: true },
      { id: 'rule-4', condition: 'أسئلة عامة → نموذج سحابي', targetModel: 'GPT-4o', targetModelId: 'gpt-4o', priority: 4, active: true }
    ];
  }

  // ── Manual overrides ───────────────────────────────────────────────────────

  function buildManualOverrides() {
    return [
      { id: 'override-1', rule: 'بيانات حساسة → نموذج محلي', originalModel: 'GPT-4o', overrideModel: 'ArabiLLM 4B', reason: 'مؤقت — صيانة النموذج السعودي', status: 'active' },
      { id: 'override-2', rule: 'قسم حكومي → نموذج محلي', originalModel: 'Claude 3.5 Sonnet', overrideModel: 'ArabiLLM 4B', reason: 'متطلب امتثال SFDA', status: 'active' }
    ];
  }

  // ── Degradation alerts ─────────────────────────────────────────────────────

  function buildAlerts() {
    return [
      { id: 'alert-1', level: 'warning', title: 'تدهور أداء Jais 13B', time: 'منذ 3 ساعات', desc: 'معدل الهلوسة ارتفع من 18% إلى 22%. يُنقل الطلبات مؤقتاً لـ Llama 3.1.', modelId: 'jais-13b' },
      { id: 'alert-2', level: 'danger', title: 'توكن ArabiLLM 4B منتهي قريباً', time: 'بعد 48 ساعة', desc: 'الرصيد المتبقي 15% من الحصة الشهرية. جدّد قبل نفاد لتجنّب انقطاع.', modelId: 'arabillm-4b' },
      { id: 'alert-3', level: 'info', title: 'تحديث GPT-4o v2 متاح', time: 'أمس', desc: 'الإصدار الجديد يخفّض الهلوسة بنسبة 2% ويحسّن الزمن بنسبة 10%.', modelId: 'gpt-4o' }
    ];
  }

  // ── Security leaderboard ───────────────────────────────────────────────────

  function buildSecurityLeaderboard() {
    return [
      { rank: 1, name: 'Claude 3.5 Sonnet', score: 97, label: 'نتيجة الأسبوع' },
      { rank: 2, name: 'GPT-4o', score: 94, label: 'نتيجة الأسبوع' },
      { rank: 3, name: 'ArabiLLM 4B', score: 88, label: 'نتيجة الأسبوع' },
      { rank: 4, name: 'Llama 3.1 70B', score: 85, label: 'نتيجة الأسبوع' },
      { rank: 5, name: 'Gemini 2.0 Flash', score: 82, label: 'نتيجة الأسبوع' },
      { rank: 6, name: 'Jais 13B', score: 71, label: 'نتيجة الأسبوع' }
    ];
  }

  // ── Full dataset ───────────────────────────────────────────────────────────

  function buildModelsData() {
    return {
      registry: buildRegistry(),
      arenaModels: buildArenaModels(),
      routingNodes: buildRoutingNodes(),
      routingLinks: buildRoutingLinks(),
      routingRules: buildRoutingRules(),
      manualOverrides: buildManualOverrides(),
      alerts: buildAlerts(),
      securityLeaderboard: buildSecurityLeaderboard()
    };
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  return {
    MODELS_SEED: MODELS_SEED,
    MODELS_REGISTRY_COUNT: MODELS_REGISTRY_COUNT,
    MODELS_ARENA_COUNT: MODELS_ARENA_COUNT,
    MODELS_ROUTING_NODES: MODELS_ROUTING_NODES,
    MODELS_ROUTING_LINKS: MODELS_ROUTING_LINKS,
    MODELS_OVERRIDES: MODELS_OVERRIDES,
    MODELS_ALERTS: MODELS_ALERTS,
    MODELS_LEADERBOARD: MODELS_LEADERBOARD,
    mulberry32: mulberry32,
    buildRegistry: buildRegistry,
    buildArenaModels: buildArenaModels,
    buildArenaRun: buildArenaRun,
    buildRoutingNodes: buildRoutingNodes,
    buildRoutingLinks: buildRoutingLinks,
    buildRoutingRules: buildRoutingRules,
    buildManualOverrides: buildManualOverrides,
    buildAlerts: buildAlerts,
    buildSecurityLeaderboard: buildSecurityLeaderboard,
    buildModelsData: buildModelsData
  };
}));