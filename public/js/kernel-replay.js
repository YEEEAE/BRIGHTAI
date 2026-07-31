/**
 * kernel-replay.js — محرّك إعادة الإنتاج والتصنيف (M11 — Prompt 12 / Evaluation-environment §5).
 *
 * هذا الملف يحوي منطق المقارنة والتصنيف فقط — ما يشغّل شي بنفسه. التشغيل
 * الفعلي يجري في kernel-playground.js (analyze)، والتخزين في kernel-eval-store.js.
 * هذي الطبقة تقارن Run قديم بـ Replay جديد وتُرجّع: الحالة + أسباب الفرق.
 *
 * القواعد (Prompt 12):
 *   - «لا تعدل Run قديم» — ما نلمس الأصل. كل مقارنة تقرأ فقط.
 *   - «كل Replay ينشئ Run جديداً مع parentRunId» — مسؤولية المتجر، مو هنا.
 *   - تصنيف النتيجة: exact-match · acceptable · material · non-reproducible.
 *   - أسباب الاختلاف السبعة: provider/model/policy/dataset/scorer/environment/stochastic.
 *
 * CSP: ES module خارجي من /js/. يُعرَّض على window.KernelReplay.
 * بيانات تجريبية — لا تخزين خارجي.
 */
(function () {
  'use strict';
  if (typeof window === 'undefined') return;

  var RISK_BANDS = ['low', 'medium', 'high', 'critical'];

  /** يرجّع نطاق المخاطر من درجة رقمية (0-100) — لمقارنة material. */
  function riskBandFromScore(score) {
    if (score == null) return 'low';
    if (score >= 85) return 'critical';
    if (score >= 70) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
  }

  /** يسحب توقيع VersionedRef موحّد: "id@vversion" أو "none" لو مفقود. */
  function refId(ref) {
    if (!ref) return 'none';
    return (ref.id || '?') + '@v' + (ref.version != null ? ref.version : '?');
  }

  /**
   * يقارن setupين ويُرجّع أسباب الاختلاف الإجرائية (Setup-level).
   * ما يحكم على الـ output هنا — هذي للفروق المُعلَنة في الإعداد.
   * لو كل الفروع null/undefined نرجّع مصفوفة فاضية.
   */
  function diffReasonSetup(oldSetup, newSetup) {
    var reasons = [];
    if (!oldSetup || !newSetup) return reasons;
    var a = oldSetup, b = newSetup;
    if ((a.provider || '') !== (b.provider || '')) reasons.push('provider-changed');
    if (refId(a.model) !== refId(b.model)) reasons.push('model-changed');
    if (refId(a.policy) !== refId(b.policy)) reasons.push('policy-changed');
    if (refId(a.dataset) !== refId(b.dataset)) reasons.push('dataset-changed');
    // scorers: نقارن مجموعات id+version مرتّبة.
    var sig = function (arr) {
      return (arr || []).map(function (s) { return (s && s.id || '?') + '@v' + (s && s.version != null ? s.version : '?'); })
        .slice().sort().join(',');
    };
    if (sig(a.scorers) !== sig(b.scorers)) reasons.push('scorer-changed');
    if ((a.environment || '') !== (b.environment || '')) reasons.push('environment-changed');
    return reasons;
  }

  /**
   * يحسب أسباب الاختلاف الكاملة بين Run قديم و Replay جديد.
   * إن تطابقت كل حقول الـ setup + اختلف الـ output → stochastic-variance.
   */
  function diffReason(oldRun, newRun) {
    var setupReasons = diffReasonSetup(oldRun && oldRun.setup, newRun && newRun.setup);
    // لو الـ output متطابق → ما في أسباب اختلاف (exact-match).
    if (oldRun && newRun && oldRun.outputHash && oldRun.outputHash === newRun.outputHash) {
      return [];
    }
    // لو الـ setup كله متطابق + الـ output اختلف → تباين عشوائي.
    if (setupReasons.length === 0) {
      return ['stochastic-variance'];
    }
    return setupReasons;
  }

  /**
   * يصنّف علاقة Replay بأصله (Prompt 12 / Evaluation-environment §5 — حالات المطابقة).
   *   - exact-match: outputHash متطابق تمامًا.
   *   - acceptable: النص/الهاش اختلف، لكن verdict + نطاق المخاطر ثابتان.
   *   - material: تغيّر verdict أو نطاق المخاطر (قرار اختلف فعليًا).
   *   - non-reproducible: الأصل غير متاح، أو البيئة/النص المدخل تغيّرت بشكل يمنع.
   *
   * oldRun = الأصل (parent)، newRun = Replay.
   */
  function classify(oldRun, newRun) {
    // non-reproducible: الأصل مفقود، أو الـ input تغيّر جذريًا.
    if (!oldRun || !newRun) {
      return { matchStatus: 'non-reproducible', diffReason: ['environment-changed'] };
    }
    // لو الـ input hash اختلف = النص المدخل تغيّر → ما نقدر نعيد نفس الشيء.
    if (oldRun.inputHash && newRun.inputHash && oldRun.inputHash !== newRun.inputHash) {
      return { matchStatus: 'non-reproducible', diffReason: diffReason(oldRun, newRun) };
    }
    // exact-match: نفس الـ output تمامًا.
    if (oldRun.outputHash && newRun.outputHash && oldRun.outputHash === newRun.outputHash) {
      return { matchStatus: 'exact-match', diffReason: [] };
    }
    // نحتاج verdict + risk للمقارنة — نجيبهم من الـ traces أو من snapshot.
    var oldV = verdictOf(oldRun);
    var newV = verdictOf(newRun);
    var oldBand = riskBandOf(oldRun);
    var newBand = riskBandOf(newRun);
    // material: القرار اختلف (verdict أو نطاق المخاطر).
    if (oldV !== newV || oldBand !== newBand) {
      return { matchStatus: 'material', diffReason: diffReason(oldRun, newRun) };
    }
    // acceptable: كل شي متطابق قراريًا، بس النص اختلف.
    return { matchStatus: 'acceptable', diffReason: diffReason(oldRun, newRun) };
  }

  /** يسحب verdict من Run (من أول trace أو من snapshot.result). */
  function verdictOf(run) {
    if (!run) return '';
    if (run.traces && run.traces[0] && run.traces[0].verdict) return run.traces[0].verdict;
    if (run._snapshot && run._snapshot.verdict) return run._snapshot.verdict;
    return '';
  }

  /** يسحب نطاق المخاطر من Run. */
  function riskBandOf(run) {
    if (!run) return 'low';
    if (run.traces && run.traces[0] && run.traces[0].riskScore != null) {
      return riskBandFromScore(run.traces[0].riskScore);
    }
    if (run._snapshot && run._snapshot.risk && run._snapshot.risk.total != null) {
      return riskBandFromScore(run._snapshot.risk.total);
    }
    return 'low';
  }

  /**
   * يبني كائن مقارنة قبل/بعد كامل — للعرض في درج Replay.
   * يشمل: verdict flip، risk delta، score deltas per scorer، reasons.
   */
  function compareRuns(oldRun, newRun) {
    var cls = classify(oldRun, newRun);
    var oldScores = scoresOf(oldRun);
    var newScores = scoresOf(newRun);
    var scoreDeltas = [];
    Object.keys(newScores).forEach(function (id) {
      var o = oldScores[id];
      var n = newScores[id];
      if (o == null && n == null) return;
      scoreDeltas.push({ id: id, before: o, after: n, delta: (n != null && o != null) ? (n - o) : null });
    });
    return {
      matchStatus: cls.matchStatus,
      diffReason: cls.diffReason,
      verdict: { before: verdictOf(oldRun), after: verdictOf(newRun) },
      riskBand: { before: riskBandOf(oldRun), after: riskBandOf(newRun) },
      outputHash: { before: oldRun && oldRun.outputHash, after: newRun && newRun.outputHash },
      scoreDeltas: scoreDeltas,
    };
  }

  /** يجمع scores من أول trace في خريطة id→score. */
  function scoresOf(run) {
    var out = {};
    if (!run) return out;
    var results = run.scorerResults || (run.traces && run.traces[0] && run.traces[0].scorerResults) || [];
    results.forEach(function (s) {
      if (s && s.id != null) out[s.id] = s.score != null ? s.score : null;
    });
    return out;
  }

  window.KernelReplay = {
    classify: classify,
    diffReason: diffReason,
    diffReasonSetup: diffReasonSetup,
    compareRuns: compareRuns,
    riskBandFromScore: riskBandFromScore,
  };
})();
