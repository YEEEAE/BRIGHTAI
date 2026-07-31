/**
 * kernel-eval-store.js — الخدمة المشتركة لنظام تقييم Kernel (M3).
 *
 * Store واحد يدير Evaluation Runs + Datasets + Traces + Certificates عبر
 * كل صفحات /kernel/. كل صفحة تقرأ وتكتب من هنا (منع التكرار في الحالة).
 *
 * القواعد (Evaluation-environment.md §المرحلة 0/5/7):
 *   - لا يمكن تعديل Run منشور (published) إطلاقاً.
 *   - أي تعديل على Run منشور يرفض على الأصل، وينشئ نسخة جديدة
 *     (version + 1) تصبح draft قابلة للتعديل — الأصل يبقى immutable.
 *   - فصل Demo عن Live عبر environment — لا يختلطان أبداً.
 *   - كل Run جديد يتطلب setup كامل (Dataset + Model + Model version +
 *     Prompt version + Policy version + Scorers + Environment + Provider).
 *
 * API (عبر window.KernelEvalStore):
 *   listRuns(), getRun(id), createRun(draft), updateRun(id, patch),
 *   publishRun(id), cloneRun(id), listDatasets(), getDataset(id),
 *   getTrace(id), getCertificate(id)
 *
 * التخزين: localStorage (مفتاح brightai-kernel-eval) + استرجاع من JSON blob
 * #eval-config إن وُجد (نمط pg-config). CSP: ES module خارجي، لا unsafe-inline.
 *
 * بيانات تجريبية — لا تخزين خارجي.
 */
(function () {
  'use strict';
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  var STORE_KEY = 'brightai-kernel-eval';
  var PREFIX_RUN = 'EVAL';
  var PREFIX_TRACE = 'AI';
  var PREFIX_CERT = 'CERT';

  // إصدار runtime المُعلَن — يُختم على كل Run للـ provenance (Prompt 12).
  // يُحدَّث يدويًا مع كل تغيير جوهري في محرّك التقييم.
  var RUNTIME_VERSION = 'kernel-eval-1.0.0';

  /* ── أدوات مساعدة ────────────────────────────────────────────────── */
  function pad(num, len) {
    return String(num).padStart(len, '0');
  }

  /** معرّف فريد بصيغة EVAL-2026-00001. */
  function makeId(prefix) {
    var year = new Date().getFullYear();
    var seq = nextSeq(prefix + '-' + year);
    return prefix + '-' + year + '-' + pad(seq, 5);
  }

  function nextSeq(key) {
    var n = Number(localStorage.getItem('brightai-kernel-eval-seq-' + key) || '0') + 1;
    try { localStorage.setItem('brightai-kernel-eval-seq-' + key, String(n)); } catch (e) {}
    return n;
  }

  function nowIso() { return new Date().toISOString(); }

  /**
   * Hash بسيط (FNV-1a) — يُستعمل كـ fallback لو KernelHash ما تحمّل بعد.
   * عادي إنه ما يستعمله أحد فعليًا بعد ربط createRun بـ KernelHash: كل الهاشات
   * الحتمية تمر عبر window.KernelHash.{inputHash,outputHash,runHash}.
   */
  function simpleHash(str) {
    var s = String(str == null ? '' : str);
    var h = 2166136261;
    for (var i = 0; i < s.length; i += 1) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return '0x' + (h >>> 0).toString(16).padStart(8, '0');
  }

  /** يرجّع KernelHash إن تحمّل، وإلا fallback. يحدّث في init(). */
  function H() {
    return (window.KernelHash) || {
      fnv1a: simpleHash,
      inputHash: function (t) { return simpleHash('INPUT' + t); },
      outputHash: function (r) { return simpleHash('OUTPUT' + JSON.stringify(r)); },
      runHash: function (i, o) { return simpleHash('RUN' + i + o); },
      canonicalizeSetup: function () { return ''; },
    };
  }

  /* ── الحالة ──────────────────────────────────────────────────────── */
  var state = { runs: [], datasets: [], certificates: [] };

  function persist() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(state));
    } catch (e) {
      /* quota — تجاهل بصمت، الحالة تبقى في الذاكرة */
    }
  }

  function load() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (raw) state = JSON.parse(raw);
      if (!Array.isArray(state.runs)) state.runs = [];
      if (!Array.isArray(state.datasets)) state.datasets = [];
      if (!Array.isArray(state.certificates)) state.certificates = [];
    } catch (e) {
      state = { runs: [], datasets: [], certificates: [] };
    }
  }

  function seedFromConfig() {
    // إن وُجد JSON blob بإعدادات/بيانات (نمط pg-config) — نقرأه ونحتفظ
    // بمرجعه كـ fixtures فقط، دون خلط Demo مع Live.
    var el = document.getElementById('eval-config');
    if (!el) return;
    try {
      var cfg = JSON.parse(el.textContent || '{}');
      if (cfg && Array.isArray(cfg.datasets)) {
        cfg.datasets.forEach(function (d) {
          if (d && d.id && !state.datasets.some(function (x) { return x.id === d.id; })) {
            state.datasets.push(d);
          }
        });
      }
    } catch (e) {}
  }

  /* ── التحقق ──────────────────────────────────────────────────────── */
  function assertSetup(setup) {
    var required = ['dataset', 'model', 'prompt', 'policy', 'scorers', 'environment', 'provider'];
    required.forEach(function (k) {
      if (!setup || setup[k] == null) {
        throw new Error('kernel-eval-store: setup مفقود (' + k + ') — لا يمكن تشغيل تقييم بدونه');
      }
    });
    if (!Array.isArray(setup.scorers) || setup.scorers.length === 0) {
      throw new Error('kernel-eval-store: لازم Scorers واحد على الأقل');
    }
    if (setup.model.provider == null) {
      throw new Error('kernel-eval-store: لازم المزوّد الحقيقي للنموذج');
    }
  }

  function findRun(id) {
    return state.runs.find(function (r) { return r.id === id; });
  }

  function assertNotPublished(run, action) {
    if (run.published) {
      throw new Error(
        'kernel-eval-store: لا يمكن ' + action + ' لـ Run منشور (' + run.id + '). استخدم cloneRun لإنشاء نسخة جديدة.'
      );
    }
  }

  /* ── العمليات العامة ────────────────────────────────────────────── */
  function listRuns() {
    return state.runs.slice();
  }

  function getRun(id) {
    return state.runs.find(function (r) { return r.id === id; }) || null;
  }

  /**
   * ينشئ Run جديد (version 1، draft، غير منشور).
   *
   * الهاشات حتمية 100% عبر window.KernelHash (لا now، لا Math.random).
   * لازم draft يمرّر: inputText (النص الخام) و result (ناتج analyze) عشان
   * نحسب الهاشات صح. الـ caller (kernel-playground) يمرّرهم دائمًا.
   */
  function createRun(draft) {
    assertSetup(draft && draft.setup);
    var hash = H();
    var now = nowIso();
    var setup = {
      dataset: Object.assign({}, draft.setup.dataset),
      model: Object.assign({}, draft.setup.model),
      prompt: Object.assign({}, draft.setup.prompt),
      policy: Object.assign({}, draft.setup.policy),
      scorers: draft.setup.scorers.map(function (s) { return Object.assign({}, s); }),
      environment: draft.setup.environment,
      provider: draft.setup.provider,
      seed: draft.setup.seed,
      temperature: draft.setup.temperature,
      topP: draft.setup.topP,
    };
    var inputText = draft.inputText != null ? String(draft.inputText) : '';
    // الهاشات الحتمية — لو الـ caller مرّرها مسبقًا نحترمها (مفيد للاختبارات)
    var inputH = draft.inputHash || hash.inputHash(inputText, setup);
    var outputH = draft.outputHash || (draft.result ? hash.outputHash(draft.result) : '');
    var runH = draft.runHash || hash.runHash(inputH, outputH, setup);
    var run = {
      id: makeId(PREFIX_RUN),
      evaluationId: draft.evaluationId || makeId('EVALID'),
      name: draft.name || 'تقييم جديد',
      status: draft.status || 'review',
      setup: setup,
      published: false,
      version: 1,
      startedAt: draft.startedAt || now,
      finishedAt: draft.finishedAt,
      inputHash: inputH,
      outputHash: outputH,
      runHash: runH,
      // Provenance كامل (Prompt 12) — runtime + prompt hash.
      runtimeVersion: draft.runtimeVersion || RUNTIME_VERSION,
      promptVersionHash: draft.promptVersionHash || hash.fnv1a(setup.prompt && setup.prompt.id || ''),
      // ربط Replay: parentRunId + reproducibility تنسخ من draft فقط (لا تخمين).
      parentRunId: draft.parentRunId,
      reproducibility: draft.reproducibility,
      cost: draft.cost || { inputTokens: 0, outputTokens: 0, providerCostSar: 0, scorerCostSar: 0, toolCostSar: 0, totalCostSar: 0 },
      timing: draft.timing || { piiScanMs: 0, riskScoreMs: 0, policyMs: 0, providerMs: 0, scoringMs: 0, totalMs: 0, p50Ms: 0, p95Ms: 0, p99Ms: 0 },
      traces: draft.traces || [],
      scorerResults: draft.scorerResults || [],
      summary: draft.summary,
      certificateId: draft.certificateId,
      createdAt: now,
      updatedAt: now,
    };
    state.runs.unshift(run);
    persist();
    return run;
  }

  /**
   * يعدّل Run غير منشور فقط. أي محاولة تعديل لـ Run منشور ترمي خطأ.
   * النسخ المحفوظة immutable — التعديل يعمل على نسخة جديدة من الكائن
   * ثم يستبدلها في الحالة (لا نعدّل الكائن الأصلي).
   */
  function updateRun(id, patch) {
    var idx = state.runs.findIndex(function (r) { return r.id === id; });
    if (idx === -1) throw new Error('kernel-eval-store: Run غير موجود (' + id + ')');
    var current = state.runs[idx];
    assertNotPublished(current, 'تعديل');
    var updated = Object.assign({}, current, patch, { updatedAt: nowIso() });
    // ضمان: setup يبقى immutable — أي تعديل عليه يشمل إصداراته.
    if (patch && patch.setup) {
      updated.setup = Object.assign({}, current.setup, patch.setup);
    }
    state.runs[idx] = updated;
    persist();
    return updated;
  }

  /** يقفل الـ Run (published = true) — بعدها لا يعدّل ولا يُحذف. */
  function publishRun(id) {
    var idx = state.runs.findIndex(function (r) { return r.id === id; });
    if (idx === -1) throw new Error('kernel-eval-store: Run غير موجود (' + id + ')');
    var hash = H();
    var run = state.runs[idx];
    if (run.published) return run;
    // runHash حتمي بدل simpleHash(now + random) القديم.
    if (!run.runHash) {
      run.runHash = hash.runHash(run.inputHash, run.outputHash, run.setup);
    }
    var published = Object.assign({}, run, { published: true, updatedAt: nowIso() });
    state.runs[idx] = published;
    persist();
    return published;
  }

  /**
   * ينشئ نسخة جديدة (version + 1) من Run منشور — الأصل يبقى كما هو.
   * النسخة الجديدة draft قابلة للتعديل.
   *
   * ملاحظة: cloneRun ليست Replay. هذي نسخة عادية للتعديل، ما تحمل parentRunId.
   * للإعادة التشغيلية استعمل replayRun().
   */
  function cloneRun(id) {
    var run = findRun(id);
    if (!run) throw new Error('kernel-eval-store: Run غير موجود (' + id + ')');
    var hash = H();
    var now = nowIso();
    var clone = Object.assign({}, run, {
      id: makeId(PREFIX_RUN),
      version: run.version + 1,
      published: false,
      status: 'review',
      startedAt: now,
      finishedAt: undefined,
      runHash: '',
      outputHash: '',
      certificateId: undefined,
      // نسخة عادية، ليست Replay — ما فيها parent ولا reproducibility.
      parentRunId: undefined,
      reproducibility: undefined,
      createdAt: now,
      updatedAt: now,
    });
    state.runs.unshift(clone);
    persist();
    return clone;
  }

  /* ── Replay (M11 — Prompt 12) ────────────────────────────────────── */

  /**
   * يجهّز draft لإعادة تشغيل Run موجود. ما يعدّل الأصل إطلاقًا (Prompt 12:
   * «لا تعدل Run قديم»). الـ caller (kernel-playground / kernel-replay)
   * يأخذ draft يُعيد تنفيذه ثم يستدعي finalizeReplay.
   *
   * mode:
   *   - 'full'         : إعادة تشغيل كامل بنفس setup (expected → exact-match
   *                      أو stochastic-variance).
   *   - 'failed'       : إعادة الحالة الفاشلة فقط (يحتفظ بنفس setup؛ المعنى
   *                      هنا تشغيلي — ما في محرك دفعي بعد، فـ failed ≈ full).
   *   - 'config'       : إعادة بإعداد مختلف — overrides تُدمج فوق setup الأصل.
   *
   * overrides (اختياري): patch فوق setup — مثلاً { seed, temperature, model }.
   *   أي override يُسجّل تلقائيًا كسبب اختلاف في diffReason عند المقارنة.
   */
  function replayRun(id, opts) {
    var run = findRun(id);
    if (!run) throw new Error('kernel-eval-store: Run غير موجود (' + id + ')');
    var mode = (opts && opts.mode) || 'full';
    if (['full', 'failed', 'config'].indexOf(mode) === -1) {
      throw new Error('kernel-eval-store: mode غير صالح (' + mode + ')');
    }
    var overrides = (opts && opts.overrides) || {};
    // ننسخ setup الأصل ثم نطبّق overrides فوقه (shallow + scorers deep copy).
    var baseSetup = run.setup;
    var mergedSetup = {
      dataset: Object.assign({}, baseSetup.dataset, overrides.dataset || {}),
      model: Object.assign({}, baseSetup.model, overrides.model || {}),
      prompt: Object.assign({}, baseSetup.prompt, overrides.prompt || {}),
      policy: Object.assign({}, baseSetup.policy, overrides.policy || {}),
      scorers: Array.isArray(overrides.scorers)
        ? overrides.scorers.map(function (s) { return Object.assign({}, s); })
        : baseSetup.scorers.map(function (s) { return Object.assign({}, s); }),
      environment: overrides.environment || baseSetup.environment,
      provider: overrides.provider || baseSetup.provider,
      seed: overrides.seed != null ? overrides.seed : baseSetup.seed,
      temperature: overrides.temperature != null ? overrides.temperature : baseSetup.temperature,
      topP: overrides.topP != null ? overrides.topP : baseSetup.topP,
    };
    // نرجّع draft مُجمّع — الـ caller يكمل التنفيذ وينادي finalizeReplay.
    return {
      _isReplayDraft: true,
      parentRunId: run.id,
      mode: mode,
      parentSetup: baseSetup,
      setup: mergedSetup,
      name: 'إعادة تشغيل ← ' + (run.name || run.id),
      // يُملأ لاحقًا بـ createRun: inputText + result + هاشات.
    };
  }

  /**
   * يختم نتيجة Replay: ينشئ Run جديد بـ parentRunId، يحفظه، ويربط نتيجة
   * المقارنة (reproducibility). ما يلمس الأصل.
   *
   * reproducibility (اختياري): إن مرّرها الـ caller (محسوبة من kernel-replay
   * classify) نحفظها؛ وإلا نتركها فاردة (يحسبها لاحقًا من يعرضها).
   */
  function finalizeReplay(draft, reproducibility) {
    if (!draft || !draft._isReplayDraft) {
      throw new Error('kernel-eval-store: finalizeReplay يتطلب draft من replayRun()');
    }
    var created = createRun({
      name: draft.name,
      setup: draft.setup,
      status: 'review',
      inputText: draft.inputText,
      result: draft.result,
      // هاشات تُحسب داخل createRun حتميًا.
      parentRunId: draft.parentRunId,
      reproducibility: reproducibility || undefined,
    });
    return created;
  }

  /**
   * يرجّع Runs قابلة لإعادة التشغيل: مكتملة أو منشورة (ما في فايدة نعيد
   * تشغيل شيء ناقص ما اكتمل أصلاً).
   */
  function listReplayableRuns() {
    return state.runs.filter(function (r) {
      return r.status === 'complete' || r.published;
    }).slice();
  }

  /**
   * يبني سلسلة النسب (lineage): من Run الحالي لأبعد أب عبر parentRunId.
   * مفيد للعرض («هذا Replay من EVAL-…0005 اللي هو Replay من EVAL-…0001»).
   */
  function getRunLineage(id) {
    var lineage = [];
    var seen = Object.create(null);
    var curId = id;
    var guard = 0;
    while (curId && !seen[curId] && guard < 32) {
      seen[curId] = true;
      var r = findRun(curId);
      if (!r) break;
      lineage.push({ id: r.id, name: r.name, status: r.status, published: r.published, createdAt: r.createdAt });
      curId = r.parentRunId;
      guard += 1;
    }
    return lineage;
  }

  /** يرجّع إصدار runtime المُعلَن (للعرض + الاختبارات). */
  function getRuntimeVersion() { return RUNTIME_VERSION; }

  /* ── Datasets ────────────────────────────────────────────────────── */
  function listDatasets() {
    return state.datasets.slice();
  }

  function getDataset(id) {
    return state.datasets.find(function (d) { return d.id === id; }) || null;
  }

  function addDataset(dataset) {
    if (!dataset || !dataset.id) throw new Error('kernel-eval-store: Dataset بدون id');
    var existing = getDataset(dataset.id);
    if (existing) throw new Error('kernel-eval-store: Dataset موجود (' + dataset.id + ')');
    state.datasets.push(dataset);
    persist();
    return dataset;
  }

  /* ── Trace و Certificate ─────────────────────────────────────────── */
  function getTrace(id) {
    for (var i = 0; i < state.runs.length; i += 1) {
      var t = state.runs[i].traces.find(function (x) { return x.id === id; });
      if (t) return t;
    }
    return null;
  }

  function getCertificate(id) {
    return state.certificates.find(function (c) { return c.id === id; }) || null;
  }

  function addCertificate(cert) {
    if (!cert || !cert.id) throw new Error('kernel-eval-store: شهادة بدون id');
    state.certificates.unshift(cert);
    persist();
    return cert;
  }

  /* ── init ────────────────────────────────────────────────────────── */
  function init() {
    load();
    seedFromConfig();
    window.KernelEvalStore = {
      listRuns: listRuns,
      getRun: getRun,
      createRun: createRun,
      updateRun: updateRun,
      publishRun: publishRun,
      cloneRun: cloneRun,
      // M11 — Replay & Reproducibility
      replayRun: replayRun,
      finalizeReplay: finalizeReplay,
      listReplayableRuns: listReplayableRuns,
      getRunLineage: getRunLineage,
      getRuntimeVersion: getRuntimeVersion,
      listDatasets: listDatasets,
      getDataset: getDataset,
      addDataset: addDataset,
      getTrace: getTrace,
      getCertificate: getCertificate,
      addCertificate: addCertificate,
      _debug: function () { return { state: state, persist: persist, runtime: RUNTIME_VERSION }; },
    };
  }

  document.addEventListener('astro:page-load', function () {
    // إعادة التهيئة بعد أي تنقّل (view transitions) — نحافظ على الحالة
    // من localStorage ولا نعيد البذر مرتين (seedFromConfig يفحص التكرار).
    load();
    seedFromConfig();
  });

  if (document.readyState !== 'loading') init();
  else document.addEventListener('DOMContentLoaded', init);
})();
