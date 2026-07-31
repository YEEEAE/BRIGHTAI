/**
 * kernel-hash.js — أداة الهاش الموحدة لنظام تقييم Kernel (M11 — Provenance & Reproducibility).
 *
 * قبل هذا الملف، كانت خوارزمية FNV-1a مكرّرة ثلاث مرات بثلاث صيغ:
 *   - src/data/kernel-datasets.ts        → fnv1a(str): '0x' + 8-hex   (build-time)
 *   - public/js/kernel-datasets.js:82    → fnv1a(str): '0x' + 8-hex   (browser, mirror)
 *   - public/js/kernel-playground.js:37  → hashStr(str): number       (seed derivation)
 *
 * هذا الملف يوحّد الثلاث تحت مصدر واحد ويضيف canonicalizers حتمية لـ inputHash /
 * outputHash / runHash. كل الهاشات هنا deterministic 100% — لا timestamp ولا
 * Math.random() — عشان أي Run قابل لإعادة الإنتاج بالضبط (Evaluation-environment
 * §المرحلة 5: «أي تشغيل محفوظ يمكن إعادة تشغيله وعرض الفرق»).
 *
 * القواعد:
 *   - fnv1a() و fnv1aNumber() يتطابقان بالخوارزمية مع النسخ الموجودة بالبايت
 *     (offset 2166136261، prime 16777619، >>> 0 للـ unsigned). تغيير أي ثابت
 *     يكسر الـ determinism القائم في playground (trace IDs، risks، latencies).
 *   - canonicalizeSetup() يبني سطر canon موحّد من RunSetup (مرتّب، لا يعتمد
 *     ترتيب مفاتيح الكائن) — أساس inputHash و runHash.
 *   - كل دوال الهاش ترجع '0x' + 8-hex سداسي عشري، بنفس نمط dataset versionHash.
 *
 * CSP: ES module خارجي من /js/، لا unsafe-inline. يُحمَّل قبل kernel-eval-store.js.
 * يُعرَّض على window.KernelHash للنماذج غير المعيارية (UMD-like guard).
 *
 * بيانات تجريبية — لا تخزين خارجي.
 */
(function () {
  'use strict';
  if (typeof window === 'undefined') return;

  var FNV_OFFSET = 2166136261;
  var FNV_PRIME = 16777619;

  /**
   * FNV-1a 32-bit، يرجّع hex بصيغة '0x' + 8 أرقام سداسية.
   * متطابق بالبايت مع kernel-datasets.ts fnv1a() و kernel-datasets.js:82.
   */
  function fnv1a(str) {
    var s = String(str == null ? '' : str);
    var h = FNV_OFFSET;
    for (var i = 0; i < s.length; i += 1) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, FNV_PRIME);
    }
    return '0x' + (h >>> 0).toString(16).padStart(8, '0');
  }

  /**
   * FNV-1a 32-bit، يرجّع عددًا صحيحًا unsigned.
   * متطابق بالبايت مع kernel-playground.js:37 hashStr() — يحل محلّها دون
   * تغيير سلوك الـ determinism (trace IDs، risk factors، latencies).
   */
  function fnv1aNumber(str) {
    var s = String(str == null ? '' : str);
    var h = FNV_OFFSET;
    for (var i = 0; i < s.length; i += 1) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, FNV_PRIME);
    }
    return h >>> 0;
  }

  /**
   * يسحب رقم إصدار من VersionedRef بأمان (يدعم version+name أو الاسم فقط).
   */
  function refSig(ref) {
    if (!ref) return 'none';
    return (ref.id || '?') + '@v' + (ref.version != null ? ref.version : '?');
  }

  /**
   * يبني توقيعًا موحّدًا (canonical) من RunSetup — مستقل عن ترتيب مفاتيح الكائن.
   * كل حقل في سطر ثابت، مفصول بـ \n. الترتيب مقصود وقابل لإعادة البناء.
   *
   * يشمل: dataset · model+provider · prompt · policy · scorers (مرتّبة id) ·
   * environment · provider · seed · temperature · topP · runtimeVersion.
   */
  function canonicalizeSetup(setup) {
    if (!setup) return '';
    var lines = [];
    lines.push('dataset:' + refSig(setup.dataset));
    lines.push('model:' + refSig(setup.model) + '|provider:' + (setup.model && setup.model.provider || '?'));
    lines.push('prompt:' + refSig(setup.prompt));
    lines.push('policy:' + refSig(setup.policy));
    var scorers = Array.isArray(setup.scorers) ? setup.scorers.slice() : [];
    scorers.sort(function (a, b) {
      return String(a && a.id || '') < String(b && b.id || '') ? -1 : 1;
    });
    lines.push('scorers:' + scorers.map(refSig).join(','));
    lines.push('environment:' + (setup.environment || '?'));
    lines.push('provider:' + (setup.provider || '?'));
    lines.push('seed:' + (setup.seed != null ? setup.seed : '?'));
    lines.push('temperature:' + (setup.temperature != null ? setup.temperature : '?'));
    lines.push('topP:' + (setup.topP != null ? setup.topP : '?'));
    return lines.join('\n');
  }

  /**
   * inputHash: هاش حتمي للنص المدخل + السياق (setup) — يجمع النص الخام مع
   * توقيع الإعداد عشان نفس النص بإعداد مختلف = هاش مختلف.
   */
  function inputHash(text, setup) {
    var canon = 'INPUT\n' + String(text == null ? '' : text) + '\n---\n' + canonicalizeSetup(setup);
    return fnv1a(canon);
  }

  /**
   * outputHash: هاش حتمي للمخرجات. يأخذ الكائن الناتج من analyze() (أو ناتج
   * Replay) ويستخرج الحقول المؤثرة: verdict · riskScore · entities count ·
   * matched policies · response text · outputScore. تجاهلنا التكلفة والزمن
   * لأنها غير حتمية بطبيعتها (لا يجب أن تؤثر على reproducibility).
   */
  function outputHash(result) {
    if (!result) return fnv1a('OUTPUT:empty');
    var ents = Array.isArray(result.entities) ? result.entities.length : 0;
    var matched = Array.isArray(result.matched) ? result.matched.map(function (p) { return p && p.id || ''; }).sort().join(',') : '';
    var scores = Array.isArray(result.outputScore) ? result.outputScore.map(function (s) {
      return (s && s.id || '') + ':' + (s && s.score != null ? s.score : '?');
    }).sort().join(',') : '';
    var canon = [
      'OUTPUT',
      'verdict:' + (result.verdict || '?'),
      'risk:' + (result.risk && result.risk.total != null ? result.risk.total : '?'),
      'entities:' + ents,
      'matched:' + matched,
      'response:' + String(result.response == null ? '' : result.response),
      'scores:' + scores,
    ].join('\n');
    return fnv1a(canon);
  }

  /**
   * runHash: هاش شامل للـ Run = inputHash + outputHash + setup canon.
   * هذي هي البصمة النهائية للـ Run — إن تغيّرت = التشغيل اختلف فعليًا.
   */
  function runHash(inputH, outputH, setup) {
    return fnv1a('RUN\n' + inputH + '\n' + outputH + '\n---\n' + canonicalizeSetup(setup));
  }

  window.KernelHash = {
    fnv1a: fnv1a,
    fnv1aNumber: fnv1aNumber,
    canonicalizeSetup: canonicalizeSetup,
    inputHash: inputHash,
    outputHash: outputHash,
    runHash: runHash,
    _refSig: refSig,
  };
})();
