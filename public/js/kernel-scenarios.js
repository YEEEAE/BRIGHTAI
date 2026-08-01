/**
 * kernel-scenarios.js — M15: Scenario Lab engine + UI wiring (2026-08-01).
 *
 * محرك مستقل لصفحة /kernel/scenarios/ — vanilla JS، يعمل محلياً في المتصفح،
 * CSP-safe (ES module خارجي + بيانات من JSON blob #scenarios-config — لا
 * unsafe-inline).
 *
 * القرار المعماري (M15): محرك مستقل ولا يُستدعى kernel-eval-engine.js —
 * لأن ذلك المحرك مرتبط بـ [data-eval-root] ويعود مبكراً خارج صفحة eval
 * (سطر 41-42) فلا يُصدَّر window.KernelEvalEngine هناك. تعديله يخاطر بصفحة
 * eval المختبرة، لذا استنسخنا المنهجية الحتمية نفسها (mulberry32 + regex
 * فعلي على المدخلات + policyAction/verdict) في محرك خاص بالمختبر، مع حفظ
 * النتائج في KernelEvalStore الحقيقي (مصدر حقيقة موحّد للـ Trace/Certificate).
 *
 * الميزات (المواصفات §4):
 *   - تشغيل فردي (زر ▶ على البطاقة) وتشغيل دفعي (▶ شغّل الكل) مع شريط تقدم.
 *   - فلاتر (القطاع / النتيجة) + بحث على البطاقات.
 *   - مصفوفة حرارية سيناريو × نموذج (خلايا 32px) مع مبدّل «مقارنة بالتشغيل
 *     السابق» (أسهم تحسّن / تراجع).
 *   - زر «اقترح سياسة تسدّها ←» لكل نتيجة فاشلة.
 *   - تقرير جاهزية (ناجح/فاشل/بانتظار + مقترحات).
 *   - كل نتيجة تُسجَّل كـ Trace (AI-…) قابل للفتح من درج الرحلة عبر
 *     [data-trace-id]، والتشغيل الدفعي ينشئ Run + Certificate في الـ Store.
 *
 * القواعد الصارمة (مطابقة kernel-eval-engine):
 *   - لا Passed لشغل ناقص: أي تشغيل ملغي/متوقف = gate 'incomplete'.
 *   - الحكم حتمي بالبذرة (mulberry32) + فحوصات regex حقيقية — المزوّد هنا
 *     Simulated موثّق بوسم Demo، و«انحراف المزوّد» محاكى حتمي (seed يعتمد
 *     على رقم الجولة) كي تظهر أسهم التحسّن/التراجع في المقارنة.
 *   - لا تسريب PII في data-* attributes أو النصوص — المعرفات فقط.
 *
 * الواجهة: window.KernelScenarios = { runOne, runAll, pause, cancel,
 * snapshot, matrix, suggestPolicy, onEvent, reset }.
 * طبقة UI ترتبط بـ data-sc-* attributes في الصفحة.
 */
(function () {
  'use strict';
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  var root = document.querySelector('[data-sc-root]');
  if (!root) return;

  /* ── الإعدادات من JSON blob ─────────────────────────────────────── */
  var config = {};
  var cfgEl = document.getElementById('scenarios-config');
  if (cfgEl) {
    try { config = JSON.parse(cfgEl.textContent || '{}'); } catch (e) { config = {}; }
  }
  var SCENARIOS = config.scenarios || [];
  var MODELS = config.models || [];
  var POLICIES = config.policies || [];
  var PII_PATTERNS = config.piiPatterns || {};
  var INJECTION_PATTERNS = config.injectionPatterns || [];
  var RISK_LABELS = config.riskLabels || {};
  var SECTOR_LABELS = config.sectorLabels || {};
  var RESULT_LABELS = config.resultLabels || {};

  /* ── الحالة ──────────────────────────────────────────────────────── */
  var STATE_KEY = 'brightai-kernel-scenarios-state';
  var state = {
    phase: 'idle',          // idle | running | paused | complete | cancelled | partial
    runCount: 0,
    runId: null,
    gate: null,
    scenarios: {},          // { scenarioId: { verdict, action, riskScore, latencyMs, costSar, traceId, runCount, updatedAt } }
    prevScenarios: {},      // نسخة قبل آخر جولة (للمقارنة)
    matrixPrev: null,       // مصفوفة آخر جولة (للمقارنة)
    completed: 0,
    failed: 0,
    partial: 0,
    total: SCENARIOS.length,
  };

  var STORE_KEY = 'brightai-kernel-eval';

  function clone(x) { return JSON.parse(JSON.stringify(x)); }
  function nowIso() { return new Date().toISOString(); }
  function pad(n, len) { return String(n).padStart(len, '0'); }
  function esc(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function loadState() {
    try {
      var raw = localStorage.getItem(STATE_KEY);
      if (raw) state = Object.assign(state, JSON.parse(raw));
    } catch (e) { /* تجاهل */ }
  }
  function saveState() {
    try { localStorage.setItem(STATE_KEY, JSON.stringify(state)); } catch (e) { /* quota */ }
  }
  function nextSeq(key) {
    var n = Number(localStorage.getItem('brightai-kernel-eval-seq-' + key) || '0') + 1;
    try { localStorage.setItem('brightai-kernel-eval-seq-' + key, String(n)); } catch (e) {}
    return n;
  }
  function makeTraceId() {
    var year = new Date().getFullYear();
    return 'AI-' + year + '-' + pad(nextSeq('trace'), 5);
  }

  /** مولد حتمي (mulberry32) — نفس البذرة = نفس التسلسل. */
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* ── الفحوصات الحتمية (regex فعلي) ───────────────────────────────── */
  function scanPii(text) {
    var found = [];
    Object.keys(PII_PATTERNS).forEach(function (id) {
      var p = PII_PATTERNS[id];
      if (!p || !p.regex) return;
      try {
        var re = new RegExp(p.regex, 'gi');
        var count = 0;
        var m;
        while ((m = re.exec(String(text))) !== null) {
          count += 1;
          if (count > 5) break;
        }
        if (count > 0) found.push({ type: id, label: p.label || id, count: count });
      } catch (e) { /* تجاهل نمط معطوب */ }
    });
    return found;
  }
  function scanInjection(text) {
    var hits = [];
    (INJECTION_PATTERNS || []).forEach(function (p) {
      if (!p || !p.source) return;
      try {
        var re = new RegExp(p.source, 'i');
        if (re.test(String(text))) hits.push({ id: p.id, label: p.label || p.id, severity: p.severity || 'high' });
      } catch (e) { /* تجاهل */ }
    });
    return hits;
  }

  /* ── الحكم الحتمي ────────────────────────────────────────────────── */
  function driftProbFor(band) {
    if (band === 'critical') return 0.18;
    if (band === 'high') return 0.12;
    if (band === 'medium') return 0.07;
    return 0.03; // low / minimal
  }

  /**
   * يحسب نتيجة سيناريو تحت نموذج معيّن لجولة معيّنة — حتمي بالكامل.
   * @param {object} scenario سيناريو مختبر.
   * @param {string} modelId معرّف النموذج.
   * @param {number} runIndex رقم الجولة (يتقدم مع كل تشغيل دفعي).
   * @returns {{verdict:string, action:string, riskScore:number, latencyMs:number, costSar:number, pii:Array, injection:Array, reason:string}}
   */
  function computeCase(scenario, modelId, runIndex) {
    var idx = SCENARIOS.indexOf(scenario);
    var modelIdx = MODELS.findIndex(function (m) { return m.id === modelId; });
    var seed = 1000 + idx * 17 + Math.max(0, modelIdx) * 7 + (runIndex || 0) * 131;
    var rng = mulberry32(seed);

    var piiIn = scanPii(scenario.prompt || '');
    var injectionIn = scanInjection(scenario.prompt || '');
    var riskScore = 40 + Math.floor(rng() * 60);

    var expected = scenario.expectedAction; // allow | allow_with_review | block
    var drifted = rng() < driftProbFor(scenario.riskBand);

    var verdict, action, reason;
    if (expected === 'block') {
      if (drifted) {
        verdict = 'fail';
        action = 'allow';
        reason = injectionIn.length
          ? 'انحراف محاكى: سمح المزوّد بطلب حقن الأوامر (فجوة دفاعية).'
          : 'انحراف محاكى: سمح المزوّد بطلب بيانات حساسة (فجوة دفاعية).';
      } else {
        verdict = 'pass';
        action = 'block';
        reason = injectionIn.length
          ? 'حُظر الطلب — اكتُشف حقن أوامر في المدخل.'
          : 'حُظر الطلب — بيانات شخصية حساسة / مخالفة سياسة حظر.';
      }
    } else if (expected === 'allow_with_review') {
      if (drifted) {
        verdict = 'fail';
        action = 'allow';
        reason = 'انحراف محاكى: اعتُمد الطلب تلقائياً دون مراجعة بشرية (تجاوز HITL).';
      } else {
        verdict = 'partial';
        action = 'approve';
        reason = 'يتطلب اعتماداً بشرياً (HITL) — أُحيل للاعتماد مع تعمية بيانات التعريف.';
      }
    } else {
      // allow
      if (drifted) {
        verdict = 'fail';
        action = 'block';
        reason = 'انحراف محاكى: حُظر الطلب الشرعي خطأً (حظر كاذب).';
      } else {
        verdict = 'pass';
        action = 'allow';
        reason = 'سُمح بالطلب — لا بيانات شخصية حساسة ولا حقن أوامر.';
      }
    }

    var inputTokens = Math.max(6, Math.round(String(scenario.prompt || '').length / 5));
    var outputTokens = Math.max(8, Math.round(String(scenario.prompt || '').length / 9) + Math.floor(rng() * 20));
    var latencyMs = Math.round(120 + rng() * 220);
    var costSar = ((inputTokens + outputTokens) / 1000) * 0.0004 + 2 * 0.00005;

    return {
      verdict: verdict,
      action: action,
      riskScore: riskScore,
      latencyMs: latencyMs,
      costSar: costSar,
      pii: piiIn,
      injection: injectionIn,
      reason: reason,
    };
  }

  /* ── المصفوفة سيناريو × نموذج ────────────────────────────────────── */
  function computeMatrix(runIndex) {
    var matrix = {};
    SCENARIOS.forEach(function (sc) {
      matrix[sc.id] = {};
      MODELS.forEach(function (m) {
        var r = computeCase(sc, m.id, runIndex);
        matrix[sc.id][m.id] = { verdict: r.verdict, action: r.action, latencyMs: r.latencyMs, costSar: r.costSar };
      });
    });
    return matrix;
  }

  /* ── اقتراح سياسة للنتيجة الفاشلة ────────────────────────────────── */
  /**
   * يبني مسودة سياسة مقترحة لسد فجوة سيناريو فاشل (أو بانقـراض الفجوة).
   * @returns {{title:string, text:string, policyIds:string[]}}
   */
  function suggestPolicy(scenario) {
    var expected = scenario.expectedAction;
    var band = scenario.riskBand;
    var base = [
      'الغرض: سدّ فجوة الدفاع المكتشفة في سيناريو «' + scenario.title + '».',
      'النطاق: كل الطلبات التي تطابق نمط هذا السيناريو ضمن ' + (scenario.complianceTags || []).join('، ') + '.',
    ];
    var body = [];
    var title = 'سياسة مقترحة';
    var policyIds = [];

    if (expected === 'block') {
      title = 'سياسة حظر صارم مقترحة';
      body.push('1. الحكم: حظر (block) عند اكتشاف PII حساسة أو حقن أوامر — لا سماح جزئي.');
      body.push('2. رفع إلى مراجعة بشرية (HITL) عند درجة خطر ≥ 70 أو شك في هوية الطالب.');
      if (band === 'critical') {
        body.push('3. تسجيل فوري في سجل التدقيق مع Trace ID وحالة الامتثال (' + scenario.complianceTags.join('/') + ').');
      }
      policyIds = scenario.linkedPolicies.slice();
    } else if (expected === 'allow_with_review') {
      title = 'سياسة تعمية + اعتماد بشري مقترحة';
      body.push('1. الحكم: تعمية (redact) لبيانات التعريف ثم تحويل للاعتماد البشري.');
      body.push('2. منع الاعتماد التلقائي — أي ناتج ببيانات تعريفية يُرفض حتى يعتمد المختص.');
      policyIds = scenario.linkedPolicies.slice();
    } else {
      title = 'سياسة تقليل الحظر الكاذب مقترحة';
      body.push('1. الحكم: سماح (allow) عند عدم وجود PII أو حقن — مع فحص إضافي للمخرجات.');
      body.push('2. إضافة قائمة استثناءات مشروعة لتقليل الحظر الكاذب مع توثيق السبب.');
    }
    return {
      title: title,
      text: base.concat(body).join('\n'),
      policyIds: policyIds,
    };
  }

  /* ── الربط بـ KernelEvalStore (Trace/Certificate حقيقي) ──────────── */
  function getStore() {
    return window.KernelEvalStore || null;
  }
  function miniCases() {
    return SCENARIOS.map(function (sc) {
      return {
        id: sc.id,
        title: sc.title,
        input: sc.prompt,
        expected: sc.expectedBehavior,
        verdict: sc.expectedAction === 'block' ? 'blocked' : sc.expectedAction === 'allow_with_review' ? 'approval_required' : 'allowed',
        risk: sc.riskBand,
        sector: sc.sector,
      };
    });
  }
  function createStoreRun(runIndex) {
    var store = getStore();
    if (!store) return null;
    var model = MODELS[0] || { id: 'demo-model', provider: 'simulated' };
    var setup = {
      dataset: { id: 'ds-scenarios-sb1', name: 'مختبر سيناريوهات SBG v1.0', cases: miniCases() },
      model: { id: model.id, name: model.label || model.id, provider: 'simulated' },
      prompt: { id: 'p-scenarios', name: 'سيناريو قياسي', version: 1 },
      policy: { id: 'pol-scenarios', name: 'سياسات المختبر', version: 1 },
      scorers: [
        { id: 'sc-pii-detection', name: 'فحص PII' },
        { id: 'sc-injection', name: 'كشف حقن أوامر' },
      ],
      environment: 'demo',
      provider: 'simulated',
      seed: runIndex,
      temperature: 0,
    };
    try {
      return store.createRun({
        name: 'مختبر سيناريوهات — جولة ' + runIndex,
        status: 'review',
        inputText: SCENARIOS[0] ? SCENARIOS[0].prompt : '',
        result: { scenarios: SCENARIOS.length, runIndex: runIndex },
        setup: setup,
        startedAt: nowIso(),
      });
    } catch (e) {
      return null;
    }
  }
  function appendStoreTrace(run, trace) {
    var store = getStore();
    if (!store || !run || !run.id) return;
    try {
      var cur = store.getRun(run.id) || run;
      var traces = (cur.traces || []).slice();
      traces.push(trace);
      store.updateRun(run.id, { traces: traces });
    } catch (e) { /* لا نكسر المختبر لو فشل الـ store */ }
  }
  function finalizeStoreRun(run, gate) {
    var store = getStore();
    if (!store || !run || !run.id) return;
    try {
      var cert = null;
      if (gate === 'passed' || gate === 'passed-with-findings') {
        cert = store.addCertificate({
          id: 'CERT-' + new Date().getFullYear() + '-' + pad(nextSeq('cert'), 5),
          runId: run.id,
          title: 'شهادة جاهزية مختبر السيناريوهات',
          status: 'passed',
          issuedAt: nowIso(),
          environment: 'demo',
        });
      }
      store.updateRun(run.id, {
        status: gate === 'passed' ? 'complete' : 'review',
        finishedAt: nowIso(),
        certificateId: cert ? cert.id : undefined,
        summary: { gate: gate, scenarios: state.total, completed: state.completed, failed: state.failed },
      });
      if (gate === 'passed' || gate === 'passed-with-findings') {
        try { store.publishRun(run.id); } catch (e) { /* تجاهل */ }
      }
    } catch (e) { /* تجاهل */ }
  }

  /* ── التشغيل ─────────────────────────────────────────────────────── */
  var STAGES = [
    { id: 'dataset_load', label: 'تحميل Dataset' },
    { id: 'validate', label: 'تحقق الحالة' },
    { id: 'preflight_pii', label: 'فحص PII' },
    { id: 'injection_scan', label: 'كشف حقن' },
    { id: 'risk_assessment', label: 'تقييم المخاطر' },
    { id: 'policy_eval', label: 'تقييم السياسات' },
    { id: 'model_invoke', label: 'استدعاء النموذج' },
    { id: 'gate', label: 'بوابة القرار' },
  ];

  function sleep(ms) {
    return new Promise(function (r) { setTimeout(r, ms); });
  }

  function computeGate() {
    if (state.phase === 'cancelled' || state.phase === 'partial') return 'incomplete';
    var passed = state.completed - state.failed;
    var total = state.total || 1;
    var rate = total ? passed / total : 0;
    if (state.failed === 0) return 'passed';
    if (rate >= 0.8) return 'passed-with-findings';
    return 'review-required';
  }

  /** يشغّل سيناريو واحد (فردي أو ضمن الدفعة). */
  function executeScenario(scenario, modelId, runIndex, opts) {
    var traceId = makeTraceId();
    var result = computeCase(scenario, modelId, runIndex);
    var stages = STAGES.map(function (s, i) {
      return {
        id: s.id,
        label: s.label,
        status: 'complete',
        detail: '',
        durationMs: Math.round(10 + ((i * 13) % 40)),
      };
    });

    var prev = state.scenarios[scenario.id] || null;
    state.scenarios[scenario.id] = {
      verdict: result.verdict,
      action: result.action,
      riskScore: result.riskScore,
      latencyMs: result.latencyMs,
      costSar: result.costSar,
      traceId: traceId,
      runCount: state.runCount,
      updatedAt: nowIso(),
      reason: result.reason,
    };
    state.completed += 1;
    if (result.verdict === 'fail') state.failed += 1;
    if (result.verdict === 'partial') state.partial += 1;

    if (opts && opts.run) {
      appendStoreTrace(opts.run, {
        id: traceId,
        runId: opts.run.id,
        scenarioId: scenario.id,
        caseId: scenario.linkedCaseId,
        title: scenario.title,
        verdict: result.verdict,
        policyAction: result.action,
        riskScore: result.riskScore,
        pii: result.pii,
        injection: result.injection,
        output: result.reason,
        cost: result.costSar,
        latencyMs: result.latencyMs,
        stages: stages,
        createdAt: nowIso(),
      });
    }

    emit();
    return { scenario: scenario, result: result, prev: prev };
  }

  async function runOne(id) {
    if (state.phase === 'running') return;
    var scenario = SCENARIOS.find(function (s) { return s.id === id; });
    if (!scenario) return;
    state.phase = 'running';
    state.completed = 0;
    state.failed = 0;
    state.partial = 0;
    state.gate = null;
    state.runId = null;
    emit();
    await sleep(60);
    var run = createStoreRun(state.runCount || 0);
    state.runId = run ? run.id : null;
    var r = executeScenario(scenario, MODELS[0] ? MODELS[0].id : '', state.runCount, { run: run });
    state.prevScenarios[id] = r.prev ? r.prev : null;
    await sleep(120);
    state.gate = computeGate();
    finalizeStoreRun(run, state.gate);
    state.phase = 'complete';
    saveState();
    emit();
  }

  async function runAll() {
    if (state.phase === 'running') return;
    // نلتقط المصفوفة السابقة قبل التحديث (للمقارنة).
    state.matrixPrev = computeMatrix(state.runCount);
    state.prevScenarios = clone(state.scenarios);
    state.runCount += 1;
    state.completed = 0;
    state.failed = 0;
    state.partial = 0;
    state.gate = null;
    state.phase = 'running';
    state.runId = null;
    emit();

    var run = createStoreRun(state.runCount);
    state.runId = run ? run.id : null;

    for (var i = 0; i < SCENARIOS.length; i += 1) {
      if (state.phase === 'cancelled') {
        state.phase = 'partial';
        break;
      }
      while (state.phase === 'paused') await sleep(140);
      await sleep(45);
      executeScenario(SCENARIOS[i], MODELS[0] ? MODELS[0].id : '', state.runCount, { run: run });
    }

    if (state.phase === 'paused') state.phase = 'complete';
    if (state.phase === 'running') state.phase = 'complete';
    if (state.phase === 'partial' && state.completed === state.total) state.phase = 'complete';
    state.gate = computeGate();
    finalizeStoreRun(run, state.gate);
    saveState();
    emit();
  }

  function pause() { if (state.phase === 'running') state.phase = 'paused'; emit(); }
  function cancel() {
    if (state.phase === 'running' || state.phase === 'paused') {
      state.phase = 'cancelled';
      state.gate = 'incomplete';
      saveState();
      emit();
    }
  }

  function snapshot() {
    return {
      phase: state.phase,
      runCount: state.runCount,
      runId: state.runId,
      gate: state.gate,
      total: state.total,
      completed: state.completed,
      failed: state.failed,
      partial: state.partial,
      scenarios: state.scenarios,
      prevScenarios: state.prevScenarios,
      matrixPrev: state.matrixPrev,
      matrix: computeMatrix(state.runCount),
    };
  }

  /* ── أحداث للصفحة والاختبارات ───────────────────────────────────── */
  var listeners = [];
  function emit() {
    render();
    var snap = snapshot();
    listeners.forEach(function (fn) { try { fn(snap); } catch (e) {} });
    document.dispatchEvent(new CustomEvent('kernel-scenarios-progress', { detail: snap }));
  }

  /* ═══════════════════════ طبقة الـ UI ═══════════════════════════ */
  var $ = function (sel, el) { return (el || document).querySelector(sel); };
  var $$ = function (sel, el) { return Array.prototype.slice.call((el || document).querySelectorAll(sel)); };

  var ui = {
    runAll: $('[data-sc-run-all]'),
    pause: $('[data-sc-pause]'),
    cancel: $('[data-sc-cancel]'),
    resume: $('[data-sc-resume]'),
    phase: $('[data-sc-phase]'),
    progressBar: $('[data-sc-progress-bar]'),
    progressLabel: $('[data-sc-progress-label]'),
    kpiTotal: $('[data-sc-kpi-total]'),
    kpiPassed: $('[data-sc-kpi-passed]'),
    kpiFailed: $('[data-sc-kpi-failed]'),
    kpiProgress: $('[data-sc-kpi-progress]'),
    tabs: $$('[data-sc-tab]'),
    search: $('[data-sc-search]'),
    resultFilters: $$('[data-sc-result-filter]'),
    grid: $('[data-sc-grid]'),
    matrixBody: $('[data-sc-matrix-body]'),
    matrixCompare: $('[data-sc-compare-toggle]'),
    matrixPrevNote: $('[data-sc-matrix-prev-note]'),
    reportBody: $('[data-sc-report-body]'),
    reportScore: $('[data-sc-report-score]'),
    reportGate: $('[data-sc-report-gate]'),
    empty: $('[data-sc-empty]'),
    policyModal: $('[data-sc-policy-modal]'),
    policyClose: $('[data-sc-policy-close]'),
    policyTitle: $('[data-sc-policy-title]'),
    policyText: $('[data-sc-policy-text]'),
    policyPills: $('[data-sc-policy-pills]'),
  };

  var VERDICT_LABEL = { pass: 'ناجح', fail: 'فاشل', partial: 'بانتظار' };
  var ACTION_LABEL = { allow: 'سماح', block: 'حظر', redact: 'تعمية', approve: 'موافقة بشرية' };
  var VERDICT_CLASS = { pass: 'sc-badge--ok', fail: 'sc-badge--err', partial: 'sc-badge--warn', pending: 'sc-badge--muted' };

  function toast(msg) {
    var toastEl = document.getElementById('k-toast');
    if (!toastEl) return;
    var msgEl = toastEl.querySelector('[data-kernel-toast-msg]');
    if (msgEl) msgEl.textContent = msg;
    toastEl.hidden = false;
    window.setTimeout(function () { toastEl.hidden = true; }, 3000);
  }

  function verdictBadge(verdict) {
    var label = VERDICT_LABEL[verdict] || 'لم يُشغَّل';
    return '<span class="sc-badge ' + (VERDICT_CLASS[verdict] || 'sc-badge--muted') + '">' + label + '</span>';
  }

  function topColor(verdict) {
    if (verdict === 'pass') return 'var(--status-success)';
    if (verdict === 'fail') return 'var(--status-danger)';
    if (verdict === 'partial') return 'var(--status-warning)';
    return 'var(--border-subtle)';
  }

  function renderCard(card) {
    var id = card.dataset.scenarioId;
    var r = state.scenarios[id] || null;
    var verdict = r ? r.verdict : 'pending';

    var top = $('[data-sc-topbar]', card);
    if (top) top.style.background = topColor(verdict);

    var badge = $('[data-sc-verdict]', card);
    if (badge) {
      badge.textContent = verdictBadge(verdict).replace(/<[^>]+>/g, '');
      badge.className = 'sc-badge ' + (VERDICT_CLASS[verdict] || 'sc-badge--muted');
    }

    var last = $('[data-sc-last]', card);
    if (last) {
      last.textContent = r ? (r.updatedAt ? new Date(r.updatedAt).toLocaleString('ar-SA') : '—') : 'لم يُشغَّل بعد';
    }
    var lat = $('[data-sc-latency]', card);
    if (lat) lat.textContent = r ? (Math.round(r.latencyMs) + ' ms') : '—';
    var cost = $('[data-sc-cost]', card);
    if (cost) cost.textContent = r ? (Number(r.costSar).toFixed(4) + ' SAR') : '—';

    var trace = $('[data-sc-trace]', card);
    if (trace && r && r.traceId) {
      trace.textContent = r.traceId;
      trace.classList.remove('sc-card__trace--empty');
      trace.setAttribute('data-trace-id', r.traceId);
    } else if (trace) {
      trace.textContent = '—';
      trace.classList.add('sc-card__trace--empty');
      trace.removeAttribute('data-trace-id');
    }

    var suggest = $('[data-sc-policy-suggest]', card);
    if (suggest) {
      suggest.hidden = verdict !== 'fail';
    }

    var runBtn = $('[data-sc-run]', card);
    if (runBtn) runBtn.disabled = state.phase === 'running';
  }

  function renderAllCards() {
    $$('[data-sc-card]').forEach(renderCard);
  }

  function renderKpis() {
    if (ui.kpiTotal) ui.kpiTotal.textContent = String(state.total);
    if (ui.kpiPassed) ui.kpiPassed.textContent = String(Math.max(0, state.completed - state.failed));
    if (ui.kpiFailed) ui.kpiFailed.textContent = String(state.failed);
    if (ui.kpiProgress) ui.kpiProgress.textContent = state.total ? Math.round((state.completed / state.total) * 100) + '%' : '0%';

    if (ui.progressBar) {
      var pct = state.total ? Math.round((state.completed / state.total) * 100) : 0;
      ui.progressBar.style.width = pct + '%';
    }
    if (ui.progressLabel) {
      ui.progressLabel.textContent = state.phase === 'idle'
        ? 'جاهز — اختر التشغيل'
        : state.completed + ' / ' + state.total;
    }
    if (ui.phase) {
      var label = 'خامل';
      if (state.phase === 'running') label = 'جارٍ';
      else if (state.phase === 'paused') label = 'متوقف مؤقتاً';
      else if (state.phase === 'complete') label = 'مكتمل';
      else if (state.phase === 'cancelled') label = 'ملغي';
      else if (state.phase === 'partial') label = 'جزئي (غير مكتمل)';
      ui.phase.textContent = label;
      ui.phase.setAttribute('data-phase', state.phase);
    }
    if (ui.runAll) ui.runAll.disabled = state.phase === 'running';
    if (ui.pause) ui.pause.hidden = state.phase !== 'running';
    if (ui.cancel) ui.cancel.hidden = state.phase !== 'running' && state.phase !== 'paused';
    if (ui.resume) ui.resume.hidden = state.phase !== 'paused';
  }

  function renderMatrix() {
    if (!ui.matrixBody) return;
    var compare = !!(ui.matrixCompare && ui.matrixCompare.checked);
    var current = snapshot().matrix;
    var prev = compare ? (state.matrixPrev || {}) : {};

    var rows = SCENARIOS.map(function (sc) {
      var cells = MODELS.map(function (m) {
        var cur = (current[sc.id] || {})[m.id] || null;
        var old = (prev[sc.id] || {})[m.id] || null;
        var verdict = cur ? cur.verdict : 'pending';
        var cls = 'sc-matrix__cell--' + verdict;
        var arrow = '';
        if (compare && old && cur && old.verdict !== cur.verdict) {
          var better = cur.verdict === 'pass' || (cur.verdict === 'partial' && old.verdict === 'fail');
          arrow = '<span class="sc-matrix__arrow ' + (better ? 'sc-matrix__arrow--up' : 'sc-matrix__arrow--down') + '" aria-hidden="true">' + (better ? '▲' : '▼') + '</span>';
        }
        return '<td class="sc-matrix__cell ' + cls + '" title="' + esc(sc.title) + ' · ' + esc(m.label) + '">' + arrow + '<span class="sc-matrix__label">' + (VERDICT_LABEL[verdict] || '—') + '</span></td>';
      }).join('');
      return '<tr>' +
        '<th scope="row" class="sc-matrix__scenario"><span>' + esc(sc.title) + '</span></th>' +
        cells +
        '</tr>';
    }).join('');

    var header = MODELS.map(function (m) {
      return '<th scope="col" class="sc-matrix__model"><span lang="en">' + esc(m.short) + '</span></th>';
    }).join('');

    ui.matrixBody.innerHTML =
      '<thead><tr><th scope="col" class="sc-matrix__scenario-header">السيناريو</th>' + header + '</tr></thead>' +
      '<tbody>' + rows + '</tbody>';

    if (ui.matrixPrevNote) {
      ui.matrixPrevNote.hidden = compare && (!state.matrixPrev || Object.keys(state.matrixPrev).length === 0);
      if (compare && state.matrixPrev && Object.keys(state.matrixPrev).length) {
        ui.matrixPrevNote.textContent = 'مقارنة بجولة ' + Math.max(1, state.runCount - 1) + ' — ▲ تحسّن · ▼ تراجع';
      } else {
        ui.matrixPrevNote.textContent = 'مصفوفة الجولة الحالية (' + state.runCount + ')';
      }
    }
  }

  function policyLabel(id) {
    var p = POLICIES.find(function (x) { return x.id === id; });
    return p ? p.label : id;
  }

  function renderReport() {
    if (!ui.reportBody) return;
    var passed = Math.max(0, state.completed - state.failed);
    var score = state.total ? Math.round((passed / state.total) * 100) : 0;

    if (ui.reportScore) {
      ui.reportScore.textContent = score + '%';
      ui.reportScore.className = 'sc-report__score ' + (score >= 80 ? 'sc-report__score--ok' : score >= 50 ? 'sc-report__score--warn' : 'sc-report__score--err');
    }
    if (ui.reportGate) {
      var g = state.gate;
      var gl = { passed: 'جاهز (Passed)', 'passed-with-findings': 'جاهز مع ملاحظات', 'review-required': 'يتطلب مراجعة', incomplete: 'غير مكتمل' };
      ui.reportGate.textContent = gl[g] || 'لم يُشغَّل';
      ui.reportGate.className = 'sc-report__gate ' + (g === 'passed' ? 'sc-badge--ok' : g === 'passed-with-findings' ? 'sc-badge--warn' : 'sc-badge--err');
    }

    var rows = SCENARIOS.map(function (sc) {
      var r = state.scenarios[sc.id] || null;
      var verdict = r ? r.verdict : 'pending';
      var suggest = verdict === 'fail' && r ? suggestPolicy(sc) : null;
      var policyCell = '';
      if (suggest) {
        policyCell = '<button type="button" class="sc-btn sc-btn--ghost sc-btn--small" data-sc-report-suggest data-scenario-id="' + esc(sc.id) + '">اقترح سياسة تسدّها ←</button>';
      } else if (sc.linkedPolicies.length) {
        policyCell = sc.linkedPolicies.map(function (p) { return '<span class="sc-chip" lang="en">' + esc(policyLabel(p)) + '</span>'; }).join(' ');
      } else {
        policyCell = '<span class="sc-report__muted">—</span>';
      }
      return '<tr>' +
        '<td><span class="sc-report__title">' + esc(sc.title) + '</span></td>' +
        '<td>' + verdictBadge(verdict) + '</td>' +
        '<td><span class="sc-report__action">' + (r ? (ACTION_LABEL[r.action] || r.action) : '—') + '</span></td>' +
        '<td class="sc-report__risk">' + (RISK_LABELS[sc.riskBand] || sc.riskBand) + '</td>' +
        '<td>' + policyCell + '</td>' +
        '</tr>';
    }).join('');

    ui.reportBody.innerHTML = '<table class="sc-report__table"><thead><tr>' +
      '<th scope="col">السيناريو</th><th scope="col">النتيجة</th><th scope="col">الإجراء</th><th scope="col">المخاطر</th><th scope="col">السياسات</th>' +
      '</tr></thead><tbody>' + rows + '</tbody></table>';

    $$('[data-sc-report-suggest]', ui.reportBody).forEach(function (btn) {
      if (btn.dataset.boundReport === '1') return;
      btn.dataset.boundReport = '1';
      btn.addEventListener('click', function () {
        var sc = SCENARIOS.find(function (s) { return s.id === btn.dataset.scenarioId; });
        if (sc) openPolicyModal(sc);
      });
    });
  }

  function openPolicyModal(scenario) {
    if (!ui.policyModal) return;
    var draft = suggestPolicy(scenario);
    if (ui.policyTitle) ui.policyTitle.textContent = draft.title;
    if (ui.policyText) ui.policyText.textContent = draft.text;
    if (ui.policyPills) {
      ui.policyPills.innerHTML = (draft.policyIds.length
        ? draft.policyIds.map(function (p) { return '<span class="sc-chip" lang="en">' + esc(policyLabel(p)) + '</span>'; }).join('')
        : '<span class="sc-report__muted">لا توجد سياسة مرتبطة — تُنشأ جديدة</span>');
    }
    ui.policyModal.hidden = false;
    document.body.style.overflow = 'hidden';
  }
  function closePolicyModal() {
    if (!ui.policyModal) return;
    ui.policyModal.hidden = true;
    document.body.style.overflow = '';
  }

  function applyFilters() {
    var q = (ui.search ? ui.search.value : '').trim().toLowerCase();
    var activeCat = document.querySelector('[data-sc-cat].active');
    var cat = activeCat ? activeCat.dataset.scCat : 'all';
    var activeResult = document.querySelector('[data-sc-result-filter][aria-pressed="true"]');
    var result = activeResult ? (activeResult.dataset.scResultFilter || activeResult.dataset.scResult || 'all') : 'all';

    var visible = 0;
    $$('[data-sc-card]').forEach(function (card) {
      var id = card.dataset.scenarioId;
      var sc = SCENARIOS.find(function (s) { return s.id === id; });
      var r = state.scenarios[id] || null;
      var verdict = r ? r.verdict : 'pending';
      var matchCat = cat === 'all' || (sc && sc.sector === cat);
      var matchResult = result === 'all' || verdict === result;
      var matchSearch = !q || (sc && (sc.title.toLowerCase().indexOf(q) !== -1 || sc.description.toLowerCase().indexOf(q) !== -1));
      var show = matchCat && matchResult && matchSearch;
      card.hidden = !show;
      if (show) visible += 1;
    });
    if (ui.empty) ui.empty.hidden = visible !== 0;
  }

  function render() {
    renderKpis();
    renderAllCards();
    renderMatrix();
    renderReport();
  }

  function bind() {
    if (ui.runAll) ui.runAll.addEventListener('click', function () { runAll(); });
    if (ui.pause) ui.pause.addEventListener('click', function () { pause(); });
    if (ui.cancel) ui.cancel.addEventListener('click', function () { cancel(); });
    if (ui.resume) ui.resume.addEventListener('click', function () { runAll(); toast('استُؤنف التشغيل'); });

    $$('[data-sc-tab]').forEach(function (tab) {
      if (tab.dataset.bound === '1') return;
      tab.dataset.bound = '1';
      tab.addEventListener('click', function () {
        $$('[data-sc-tab]').forEach(function (t) {
          var on = t === tab;
          t.classList.toggle('active', on);
          t.setAttribute('aria-selected', on ? 'true' : 'false');
        });
        var view = tab.dataset.scTab;
        $$('[data-sc-view]').forEach(function (v) {
          v.hidden = v.dataset.scView !== view;
        });
      });
    });

    $$('[data-sc-cat]').forEach(function (btn) {
      if (btn.dataset.boundCat === '1') return;
      btn.dataset.boundCat = '1';
      btn.addEventListener('click', function () {
        $$('[data-sc-cat]').forEach(function (b) {
          var on = b === btn;
          b.classList.toggle('active', on);
          b.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        applyFilters();
      });
    });

    $$('[data-sc-result-filter]').forEach(function (btn) {
      if (btn.dataset.boundResult === '1') return;
      btn.dataset.boundResult = '1';
      btn.addEventListener('click', function () {
        $$('[data-sc-result-filter]').forEach(function (b) {
          var on = b === btn;
          b.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        applyFilters();
      });
    });

    if (ui.search) {
      ui.search.addEventListener('input', applyFilters);
    }

    if (ui.matrixCompare) {
      ui.matrixCompare.addEventListener('change', renderMatrix);
    }

    $$('[data-sc-run]').forEach(function (btn) {
      if (btn.dataset.boundRun === '1') return;
      btn.dataset.boundRun = '1';
      btn.addEventListener('click', function () {
        var id = btn.closest('[data-sc-card]').dataset.scenarioId;
        runOne(id);
      });
    });

    $$('[data-sc-policy-suggest]').forEach(function (btn) {
      if (btn.dataset.boundSuggest === '1') return;
      btn.dataset.boundSuggest = '1';
      btn.addEventListener('click', function () {
        var sc = SCENARIOS.find(function (s) { return s.id === btn.closest('[data-sc-card]').dataset.scenarioId; });
        if (sc) openPolicyModal(sc);
      });
    });

    if (ui.policyClose) ui.policyClose.addEventListener('click', closePolicyModal);
    var backdrop = $('[data-sc-policy-backdrop]');
    if (backdrop) backdrop.addEventListener('click', closePolicyModal);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && ui.policyModal && !ui.policyModal.hidden) closePolicyModal();
    });
  }

  /* ── التصدير ────────────────────────────────────────────────────── */
  window.KernelScenarios = {
    runOne: runOne,
    runAll: runAll,
    pause: pause,
    cancel: cancel,
    snapshot: snapshot,
    matrix: function (ri) { return computeMatrix(ri == null ? state.runCount : ri); },
    suggestPolicy: suggestPolicy,
    onEvent: function (fn) { listeners.push(fn); },
    reset: function () {
      state = {
        phase: 'idle', runCount: 0, runId: null, gate: null,
        scenarios: {}, prevScenarios: {}, matrixPrev: null,
        completed: 0, failed: 0, partial: 0, total: SCENARIOS.length,
      };
      try { localStorage.removeItem(STATE_KEY); } catch (e) {}
      emit();
    },
  };

  function init() {
    loadState();
    bind();
    emit();
  }

  document.addEventListener('astro:page-load', function () {
    loadState();
    bind();
    emit();
  });

  if (document.readyState !== 'loading') init();
  else document.addEventListener('DOMContentLoaded', init);
})();
