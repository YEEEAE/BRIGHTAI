/**
 * kernel-redteam.js — M16: Red Team Arena engine + UI wiring (2026-08-01).
 *
 * محرك مستقل لصفحة /kernel/redteam/ — vanilla JS، يعمل محلياً في المتصفح،
 * CSP-safe (ES module خارجي + بيانات من JSON blob #redteam-config — لا
 * unsafe-inline).
 *
 * القرار المعماري (M16): محرك حتمي بالكامل — لا Math.random إطلاقاً.
 * الحكم يُشتق من:
 *   1) مطابقة المدخل الحر مع مكتبة الـ 40 تقنية (عبر `trigger`).
 *   2) فحوصات PII الحقيقية (أنماط PII_PATTERNS الفعلية من kernel-scorers).
 *   3) فحوصات حقن الأوامر (SCENARIO_INJECTION_PATTERNS الفعلية).
 *   4) تقييم مخاطر حتمي (مصطلحات حساسة) + عدّاد معدل الطلبات (Rate Limiter).
 * الاختراقات (5 من 40) مقصودة: هجمات تستهدف طبقة المخرجات (Stage 5) المعروضة
 * كخامدة في الوضع التجريبي — يطابق FAQ المنشور: «المراحل 1-4 تشتغل كاملة،
 * المرحلة 5 تُعرض كخامدة».
 *
 * المراحل 1-4 تشتغل فعلياً، المرحلة 5 (model_guard) تُعرض كخامدة.
 * النتائج تُسجَّل في KernelEvalStore الحقيقي (مصدر حقيقة موحّد للـ Trace/
 * Run) — كل هجوم يصير Trace قابل للفتح، والاختراق يولّد بلاغاً + سياسة مقترحة.
 *
 * القواعد الصارمة (مطابقة kernel-eval-engine):
 *   - لا تسريب PII في data-* attributes أو النصوص — المعرفات فقط.
 *   - Rate Limiter: حد 10 هجمات / 60 ثانية (تجريبي) — تجاوزه = صُدّ بـ rate_limiter.
 *   - لا هجمات على أهداف خارجية (ما في أي اتصال شبكة — كله محلي).
 *
 * الواجهة: window.KernelRedteam = { launchAttack, chainMessage, suggestPolicy,
 * snapshot, onEvent, reset, analyze }.
 * طبقة UI ترتبط بـ data-rt-* attributes في الصفحة.
 */
(function () {
  'use strict';
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  var root = document.querySelector('[data-rt-root]');
  if (!root) return;

  /* ── الإعدادات من JSON blob ─────────────────────────────────────── */
  var config = {};
  var cfgEl = document.getElementById('redteam-config');
  if (cfgEl) {
    try { config = JSON.parse(cfgEl.textContent || '{}'); } catch (e) { config = {}; }
  }
  var ATTACKS = config.attacks || [];
  var LAYER_LABELS = config.layers || {};
  var VERDICT_LABELS = config.verdictLabels || { blocked: 'صُدّ', breached: 'اختراق' };
  var PII_PATTERNS = config.piiPatterns || {};
  var INJECTION_PATTERNS = config.injectionPatterns || [];

  // أسماء السياسات للعرض (لا تُسريب — معرفات فقط).
  var POLICY_LABELS = {
    'pol-injection-block': 'منع حقن الأوامر (NCA ECC)',
    'pol-pii-mask': 'تعمية الهوية (PDPL م.12)',
    'pr_saudi_id_pdpl': 'تعمية الهوية الوطنية (PDPL)',
    'pr_iban_block_local': 'حظر الآيبان المحلي (PDPL)',
    'pr_iban_block_cross': 'حظر الآيبان الدولي',
    'pr_email_mask': 'تعمية البريد (PDPL)',
    'pr_medical_block': 'حظر المحتوى الطبي (SFDA)',
    'pr_credit_card_luhn': 'حظر بطاقة الائتمان (Luhn)',
    'pr_passport_mask': 'تعمية الجواز',
    'pr_sdaia_draft': 'امتثال سدايا (مسودة)',
    'pr_iso42001_transparency': 'الشفافية التشغيلية (ISO 42001)',
  };

  // السياسة المرتبطة بكل نوع PII (من kernel-policies المرتبطة).
  var PII_POLICY = {
    saudi_id: 'pr_saudi_id_pdpl',
    mobile: 'pol-pii-mask',
    email: 'pr_email_mask',
    address: 'pol-pii-mask',
    iban: 'pr_iban_block_local',
    credit_card: 'pr_credit_card_luhn',
    patient_file: 'pr_medical_block',
    medical_record: 'pr_medical_block',
    salary: 'pr_saudi_id_pdpl',
    employee_data: 'pol-pii-mask',
  };

  // مصطلحـات تقييم المخاطر الحتمي (قرارات/إجراءات حساسة بدون اعتماد بشري).
  var RISK_TERMS = [
    'تمويل', 'ائتمان', 'قرض', 'ريال', 'حوالة', 'سحب', 'تحويل', 'ملايين',
    'احذف', 'حذف', 'تعديل', 'صلاحيات', 'رفع', 'صلاحية', 'كلمة المرور',
    'password', 'روشتة', 'تشخيص', 'دواء', 'جرعة', 'مرض', 'مريض', 'علاج',
  ];

  // Rate Limiter (تجريبي): 10 هجمات / 60 ثانية.
  var RT_RATE_MAX = 10;
  var RT_RATE_WINDOW_MS = 60000;

  /* ── الحالة ──────────────────────────────────────────────────────── */
  var STATE_KEY = 'brightai-kernel-redteam-state';
  var state = {
    phase: 'idle',            // idle | running | complete
    attackCount: 0,
    blockedCount: 0,
    breachedCount: 0,
    rateLimitedCount: 0,
    lastVerdict: null,        // blocked | breached | rate_limited
    lastLayer: null,
    lastPolicyId: null,
    lastReason: null,
    traceId: null,
    runId: null,
    rateHits: [],             // timestamps (الطلبات غير المرفوضة بالـ Rate Limiter)
    lastAttackId: null,
    lastInput: null,
  };

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
      if (!Array.isArray(state.rateHits)) state.rateHits = [];
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
    return 'AI-RT-' + new Date().getFullYear() + '-' + pad(nextSeq('rt-trace'), 5);
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

  /* ── المطابقة مع مكتبة الـ 40 ────────────────────────────────────── */
  function findAttack(id) {
    for (var i = 0; i < ATTACKS.length; i += 1) {
      if (ATTACKS[i].id === id) return ATTACKS[i];
    }
    return null;
  }
  function triggerMatches(trigger, input) {
    var t = String(trigger == null ? '' : trigger);
    if (!t) return false;
    try {
      var escaped = t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return new RegExp(escaped, 'i').test(input);
    } catch (e) {
      return input.indexOf(t.toLowerCase()) !== -1;
    }
  }
  function matchLibrary(input) {
    for (var i = 0; i < ATTACKS.length; i += 1) {
      var a = ATTACKS[i];
      var triggers = Array.isArray(a.trigger) ? a.trigger : [];
      for (var j = 0; j < triggers.length; j += 1) {
        if (triggerMatches(triggers[j], input)) return a;
      }
    }
    return null;
  }

  function policyLabel(id) {
    return POLICY_LABELS[id] || id;
  }

  /* ── الحكم الحتمي ────────────────────────────────────────────────── */
  function countRecentAttacks() {
    var now = Date.now();
    state.rateHits = (state.rateHits || []).filter(function (t) { return now - t < RT_RATE_WINDOW_MS; });
    return state.rateHits.length;
  }

  function riskScoreOf(text) {
    var lower = String(text).toLowerCase();
    var score = 0;
    RISK_TERMS.forEach(function (t) {
      if (lower.indexOf(t) !== -1) score += 1;
    });
    return score;
  }

  /**
   * يصنّف مدخل الهجوم حتمياً (لا Math.random).
   * @param {string} text نص الهجوم الحر.
   * @returns {object} verdict + layer + policyId + reason + matchedAttackId + pii + injection + riskScore + rateLimited
   */
  function classifyInput(text) {
    var input = String(text == null ? '' : text);

    // الطبقة الخارجية: Rate Limiter (تجريبي).
    if (countRecentAttacks() >= RT_RATE_MAX) {
      return {
        verdict: 'rate_limited',
        layer: 'rate_limiter',
        policyId: 'pr_iso42001_transparency',
        reason: 'تجاوزت حد ' + RT_RATE_MAX + ' هجمات في الدقيقة — هذا تقييد استخدام (Fair Use)، مو صدّ أمني. انتظر قليلاً أو اضغط «إعادة ضبط» لفكّه.',
        matchedAttackId: null,
        pii: [],
        injection: [],
        riskScore: 0,
        rateLimited: true,
      };
    }

    // 1) مطابقة مكتبة الـ 40 (الحكم والطبقة والسياسة من البيانات — حتمي).
    var attack = matchLibrary(input);
    if (attack) {
      var layerLabel = LAYER_LABELS[attack.layer] || attack.layer;
      var reason;
      if (attack.verdict === 'breached') {
        reason = '«' + attack.title + '» (' + attack.owasp + '): استغلّت ثغرة في طبقة ' +
          layerLabel + ' (Stage 5 خامد). تم توليد بلاغ تلقائي وسياسة مقترحة.';
      } else {
        reason = 'اكتُشفت محاولة «' + attack.title + '» (' + attack.owasp + '). صدّتها طبقة ' +
          layerLabel + ' — السياسة: ' + policyLabel(attack.policyIds[0]);
      }
      return {
        verdict: attack.verdict,
        layer: attack.layer,
        policyId: attack.policyIds[0] || 'pol-injection-block',
        reason: reason,
        matchedAttackId: attack.id,
        pii: scanPii(input),
        injection: scanInjection(input),
        riskScore: riskScoreOf(input),
        rateLimited: false,
      };
    }

    // 2) فحص PII فعلي (أنماط kernel-scorers الحقيقية).
    var pii = scanPii(input);
    if (pii.length) {
      var first = pii[0];
      return {
        verdict: 'blocked',
        layer: 'pii_scanner',
        policyId: PII_POLICY[first.type] || 'pol-pii-mask',
        reason: 'اكتُشف نمط بيانات شخصية (' + first.label + ') — الحظر تلقائي (PDPL).',
        matchedAttackId: null,
        pii: pii,
        injection: [],
        riskScore: riskScoreOf(input),
        rateLimited: false,
      };
    }

    // 3) فحص حقن الأوامر الفعلي (أنماط kernel-scenarios-lab الحقيقية).
    var injection = scanInjection(input);
    if (injection.length) {
      return {
        verdict: 'blocked',
        layer: 'policy_engine',
        policyId: 'pol-injection-block',
        reason: 'اكتُشفت محاولة حقن (' + injection[0].label + ') — الحظر تلقائي (NCA ECC).',
        matchedAttackId: null,
        pii: [],
        injection: injection,
        riskScore: riskScoreOf(input),
        rateLimited: false,
      };
    }

    // 4) تقييم المخاطر الحتمي (مصطلحات إجراءات حساسة).
    var risk = riskScoreOf(input);
    if (risk >= 2) {
      var pct = Math.min(96, 60 + risk * 6);
      return {
        verdict: 'blocked',
        layer: 'risk_scoring',
        policyId: 'pr_iso42001_transparency',
        reason: 'اكتُشفت محاولة إجراء/قرار حساس (مالي/طبي/صلاحيات) بدون اعتماد بشري — درجة المخاطر ' + pct + '/100.',
        matchedAttackId: null,
        pii: [],
        injection: [],
        riskScore: risk,
        rateLimited: false,
      };
    }

    // 5) لا تطابق معروف — عولج الطلب بسلام (منخفض الخطورة).
    return {
      verdict: 'low_risk',
      layer: 'risk_scoring',
      policyId: 'pr_iso42001_transparency',
      reason: 'لا تطابق أي تقنية هجوم معروفة في مكتبة الـ 40 ولا أنماط PII/حقن — عولج الطلب بسلام (منخفض الخطورة).',
      matchedAttackId: null,
      pii: [],
      injection: [],
      riskScore: risk,
      rateLimited: false,
    };
  }

  /* ── سياسة مقترحة (للاختراق) ─────────────────────────────────────── */
  function buildPolicyDraft(result) {
    var attack = result.matchedAttackId ? findAttack(result.matchedAttackId) : null;
    var title = attack
      ? 'سياسة مقترحة لسد ثغرة «' + attack.title + '»'
      : 'سياسة مقترحة لسد الثغرة المكتشفة';
    var body = [
      'الغرض: سد الثغرة المكتشفة في ' + (attack ? '«' + attack.title + '» (' + attack.owasp + ')' : 'هذا الهجوم'),
      'الطبقة المخترقة: ' + (LAYER_LABELS[result.layer] || result.layer),
      '',
      '1. تفعيل فحص المخرجات (Stage 5) بدل العرض الخامد الحالي في الوضع التجريبي.',
      '2. إضافة قاعدة حظر تطابق نمط: ' + (attack ? attack.title : 'الهجوم المكتشف') + '.',
      '3. رفع أي ناتج يحمل هذه العلامات إلى مراجعة بشرية (HITL) قبل التسليم.',
      '4. تسجيل كل محاولة في سجل التدقيق مع Trace ID وحالة الامتثال.',
    ];
    return {
      title: title,
      text: body.join('\n'),
      policyIds: attack ? attack.policyIds.slice() : ['pol-injection-block'],
    };
  }

  function suggestPolicyForId(attackId) {
    var attack = findAttack(attackId);
    var fake = {
      verdict: attack ? attack.verdict : 'breached',
      layer: attack ? attack.layer : 'model_guard',
      policyId: attack ? (attack.policyIds[0] || 'pol-injection-block') : 'pol-injection-block',
      matchedAttackId: attackId,
    };
    return buildPolicyDraft(fake);
  }

  /* ── الربط بـ KernelEvalStore (Run/Trace حقيقي) ──────────────────── */
  function getStore() {
    return window.KernelEvalStore || null;
  }
  function createSessionRun() {
    var store = getStore();
    if (!store) return null;
    var setup = {
      dataset: {
        id: 'ds-redteam-sb1',
        name: 'ساحة الفريق الأحمر — 40 تقنية',
        cases: ATTACKS.map(function (a) {
          return { id: a.id, title: a.title, owasp: a.owasp, expected: a.verdict };
        }),
      },
      model: { id: 'rt-demo-model', name: 'نموذج محاكى (Red Team)', provider: 'simulated' },
      prompt: { id: 'p-redteam', name: 'هجوم فريق أحمر', version: 1 },
      policy: { id: 'pol-redteam', name: 'سياسات ساحة الفريق الأحمر', version: 1 },
      scorers: [
        { id: 'sc-pii-detection', name: 'فحص PII' },
        { id: 'sc-inj-prompt', name: 'كشف حقن أوامر' },
        { id: 'sc-risk-scoring', name: 'تقييم المخاطر' },
      ],
      environment: 'demo',
      provider: 'simulated',
      seed: 0,
      temperature: 0,
    };
    try {
      var run = store.createRun({
        name: 'ساحة الفريق الأحمر — جلسة ' + nowIso().slice(0, 10),
        status: 'review',
        inputText: ATTACKS[0] ? ATTACKS[0].prompt : '',
        result: { arena: 'redteam', attacks: ATTACKS.length },
        setup: setup,
        startedAt: nowIso(),
      });
      state.runId = run.id;
      return run;
    } catch (e) {
      return null;
    }
  }
  function appendStoreTrace(run, result, inputText, traceId) {
    var store = getStore();
    if (!store || !run || !run.id) return;
    try {
      var cur = store.getRun(run.id) || run;
      var traces = (cur.traces || []).slice();
      var breached = result.verdict === 'breached';
      traces.push({
        id: traceId,
        runId: run.id,
        attackId: result.matchedAttackId,
        input: inputText,
        verdict: breached ? 'breached' : 'blocked',
        layer: result.layer,
        policyId: result.policyId,
        policyLabel: policyLabel(result.policyId),
        riskScore: result.riskScore,
        pii: result.pii,
        injection: result.injection,
        output: result.reason,
        rateLimited: result.rateLimited || false,
        proposedPolicy: breached ? buildPolicyDraft(result).text : undefined,
        createdAt: nowIso(),
      });
      store.updateRun(run.id, { traces: traces });
    } catch (e) { /* لا نكسر الساحة لو فشل الـ store */ }
  }
  function updateStoreSummary(run, traceId) {
    var store = getStore();
    if (!store || !run || !run.id) return;
    try {
      store.updateRun(run.id, {
        summary: {
          arena: 'redteam',
          attacks: state.attackCount,
          blocked: state.blockedCount,
          breached: state.breachedCount,
          rateLimited: state.rateLimitedCount,
          lastTraceId: traceId,
        },
      });
    } catch (e) { /* تجاهل */ }
  }

  /* ── تسجيل هجوم ──────────────────────────────────────────────────── */
  function recordAttack(result, inputText) {
    state.attackCount += 1;
    if (result.verdict === 'rate_limited') {
      state.rateLimitedCount += 1;
    } else {
      state.rateHits.push(Date.now());
      if (result.verdict === 'breached') state.breachedCount += 1;
      else state.blockedCount += 1;
    }
    state.lastVerdict = result.verdict;
    state.lastLayer = result.layer;
    state.lastPolicyId = result.policyId;
    state.lastReason = result.reason;
    state.lastAttackId = result.matchedAttackId;
    state.lastInput = inputText;

    var store = getStore();
    var run = null;
    if (store) {
      run = state.runId ? (store.getRun(state.runId) || null) : null;
      if (!run) run = createSessionRun();
    }
    var traceId = makeTraceId();
    state.traceId = traceId;
    if (run) {
      appendStoreTrace(run, result, inputText, traceId);
      updateStoreSummary(run, traceId);
    }
    saveState();
  }

  /* ── التشغيل ─────────────────────────────────────────────────────── */
  function sleep(ms) {
    return new Promise(function (r) { setTimeout(r, ms); });
  }

  /**
   * يشغّل هجوماً على النص المُدخل.
   * @param {string} text نص الهجوم.
   * @param {object} [opts] { instant: true } لتخطي تأخير العرض (للاختبارات).
   * @returns {Promise<object>} النتيجة الحتمية.
   */
  async function launchAttack(text, opts) {
    if (state.phase === 'running') return null;
    var trimmed = String(text == null ? '' : text).trim();
    if (!trimmed) {
      // مدخل فارغ: عرض رسالة استرداد، ما نعدّ هجوم ولا نغيّر phase.
      showEmptyMessage();
      if (ui.input) ui.input.focus();
      return null;
    }
    state.phase = 'running';
    emit();
    if (!(opts && opts.instant)) await sleep(320);

    var result = classifyInput(trimmed);
    recordAttack(result, trimmed);
    result.traceId = state.traceId;
    showVerdict(result);

    state.phase = 'complete';
    saveState();
    emit();
    return result;
  }

  /**
   * رسالة هجوم متسلسل (وضع المحادثة) — نفس الحكم الحتمي.
   */
  async function chainMessage(text, opts) {
    if (state.phase === 'running') return null;
    var trimmed = String(text == null ? '' : text).trim();
    if (!trimmed) return null;
    state.phase = 'running';
    emit();
    if (!(opts && opts.instant)) await sleep(240);

    var result = classifyInput(trimmed);
    recordAttack(result, trimmed);
    if (ui.chainStatus) ui.chainStatus.textContent = VERDICT_DISPLAY[result.verdict]
      ? VERDICT_DISPLAY[result.verdict].title
      : 'صُدّ';
    if (ui.chainInput) ui.chainInput.value = '';

    state.phase = 'complete';
    saveState();
    emit();
    return result;
  }

  function snapshot() {
    return {
      phase: state.phase,
      attackCount: state.attackCount,
      blockedCount: state.blockedCount,
      breachedCount: state.breachedCount,
      rateLimitedCount: state.rateLimitedCount,
      lastVerdict: state.lastVerdict,
      lastLayer: state.lastLayer,
      lastPolicyId: state.lastPolicyId,
      lastReason: state.lastReason,
      lastAttackId: state.lastAttackId,
      traceId: state.traceId,
      runId: state.runId,
      libraryCount: ATTACKS.length,
    };
  }

  /* ── منطقة sr-live للإعلانات (reset/...). تُنشأ مرة واحدة. ───────── */
  var announceRegion = null;
  function ensureAnnounceRegion() {
    if (announceRegion) return announceRegion;
    announceRegion = document.createElement('div');
    announceRegion.setAttribute('aria-live', 'polite');
    announceRegion.setAttribute('role', 'status');
    announceRegion.style.cssText = 'position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0;';
    document.body.appendChild(announceRegion);
    return announceRegion;
  }
  function announce(text) {
    var region = ensureAnnounceRegion();
    // إعادة التهيئة لضمان إعادة الإعلان لو نفس النص تكرر.
    region.textContent = '';
    window.setTimeout(function () { region.textContent = text; }, 30);
  }

  /* يحدّث ملخص الجلسة في الواجهة من snapshot. */
  function updateSessionUi(snap) {
    if (!ui.session) return;
    var hasActivity = snap.attackCount > 0;
    ui.session.hidden = !hasActivity;
    if (ui.sessionCount) ui.sessionCount.textContent = String(snap.attackCount);
    if (ui.sessionBlocked) ui.sessionBlocked.textContent = String(snap.blockedCount);
    if (ui.sessionBreached) ui.sessionBreached.textContent = String(snap.breachedCount);
    if (ui.sessionLimited) ui.sessionLimited.textContent = String(snap.rateLimitedCount);
  }

  /* ── أحداث للصفحة والاختبارات ───────────────────────────────────── */
  var listeners = [];
  function emit() {
    var snap = snapshot();
    updateSessionUi(snap);
    listeners.forEach(function (fn) { try { fn(snap); } catch (e) {} });
    document.dispatchEvent(new CustomEvent('kernel-redteam-progress', { detail: snap }));
  }

  /* ═══════════════════════ طبقة الـ UI ═══════════════════════════ */
  var $ = function (sel, el) { return (el || document).querySelector(sel); };
  var $$ = function (sel, el) { return Array.prototype.slice.call((el || document).querySelectorAll(sel)); };

  var ui = {
    input: $('[data-rt-input]') || $('[data-rt-root] #rt-attack-input'),
    chars: $('[data-rt-chars]'),
    attackBtn: $('[data-rt-attack-btn]'),
    resetBtn: $('[data-rt-reset]'),
    overlay: $('[data-rt-overlay]'),
    verdict: $('[data-rt-verdict]'),
    verdictIcon: $('[data-rt-verdict-icon]'),
    verdictTitle: $('[data-rt-verdict-title]'),
    verdictSubtitle: $('[data-rt-verdict-subtitle]'),
    simNote: $('[data-rt-sim-note]'),
    empty: $('[data-rt-empty]'),
    vLayer: $('[data-rt-v-layer]'),
    vPolicy: $('[data-rt-v-policy]'),
    vReason: $('[data-rt-v-reason]'),
    vTrace: $('[data-rt-v-trace]'),
    breach: $('[data-rt-breach]'),
    policyDraft: $('[data-rt-policy-draft]'),
    tryAgain: $('[data-rt-try-again]'),
    close: $('[data-rt-close]'),
    chainInput: $('[data-rt-chain-input]'),
    chainSend: $('[data-rt-chain-send]'),
    chainMessages: $('[data-rt-chain-messages]'),
    chainStatus: $('[data-rt-chain-status]'),
    session: $('[data-rt-session]'),
    sessionCount: $('[data-rt-session-count]'),
    sessionBlocked: $('[data-rt-session-blocked]'),
    sessionBreached: $('[data-rt-session-breached]'),
    sessionLimited: $('[data-rt-session-limited]'),
  };

  // خرائط الـ 4 نتائج: icon + title + subtitle + class modifier.
  // كذا كل نتيجة لها هوية بصرية منفصلة — ما يلتبس "صُدّ" مع "مقيّد" مع "اختراق".
  var VERDICT_DISPLAY = {
    blocked: {
      icon: '🛡',
      title: 'صُدّ!',
      subtitle: 'Kernel تصدّى لهجومك. الدفاع الذي أوقفك مكشوف بالكامل.',
      mod: 'blocked',
    },
    breached: {
      icon: '💥',
      title: 'اختراق!',
      subtitle: 'هجومك نجح في المحاكاة. تم توليد بلاغ تلقائي + سياسة مقترحة لسد الثغرة.',
      mod: 'breached',
    },
    rate_limited: {
      icon: '⏳',
      title: 'مقيّد',
      subtitle: 'هذا تقييد استخدام (Rate Limiter)، مو صدّ أمني — خدّمتك أكثير من الحد المسموح.',
      mod: 'rate-limited',
    },
    low_risk: {
      icon: '○',
      title: 'عولج بسلام',
      subtitle: 'ما طلّع هجوم معروف ولا نمط حساس — عالجه Kernel كطلب منخفض الخطورة.',
      mod: 'low-risk',
    },
  };

  function showVerdict(result) {
    // اختيار الـ display من الـ 4 نتائج (fallback على blocked للأمان).
    var display = VERDICT_DISPLAY[result.verdict] || VERDICT_DISPLAY.blocked;
    var breached = result.verdict === 'breached';

    if (ui.verdictIcon) {
      ui.verdictIcon.className = 'rt-verdict__icon rt-verdict__icon--' + display.mod;
      ui.verdictIcon.textContent = display.icon;
    }
    if (ui.verdictTitle) {
      ui.verdictTitle.className = 'rt-verdict__title rt-verdict__title--' + display.mod;
      ui.verdictTitle.textContent = display.title;
    }
    if (ui.verdictSubtitle) {
      ui.verdictSubtitle.textContent = display.subtitle;
    }
    if (ui.vLayer) ui.vLayer.textContent = LAYER_LABELS[result.layer] || result.layer;
    if (ui.vPolicy) ui.vPolicy.textContent = policyLabel(result.policyId);
    if (ui.vReason) ui.vReason.textContent = result.reason;

    // الـ Trace ID صار زر «افتح الأثر» — يربط بالـ drawer عبر event.
    if (ui.vTrace) {
      ui.vTrace.textContent = result.traceId || '—';
      ui.vTrace.disabled = !result.traceId;
    }

    // شريط المحاكاة ظاهر دائمًا في كل نتيجة.
    if (ui.simNote) ui.simNote.hidden = false;
    // أخفِ رسالة الفارغ لو كانت ظاهرة من محاولة سابقة.
    if (ui.empty) ui.empty.hidden = true;

    if (ui.breach) {
      ui.breach.hidden = !breached;
      if (breached && ui.policyDraft) {
        ui.policyDraft.textContent = buildPolicyDraft(result).text;
      }
    }

    if (ui.overlay) {
      ui.overlay.classList.add('rt-overlay--active');
      ui.overlay.setAttribute('aria-hidden', 'false');
    }
    if (ui.verdict) {
      ui.verdict.setAttribute('aria-hidden', 'false');
      window.setTimeout(function () {
        ui.verdict.classList.add('rt-verdict--visible');
      }, 50);
    }
  }

  /* رسالة المدخل الفارغ: تعرض بطاقة بسيطة من غير ما تعدّ هجوم. */
  function showEmptyMessage() {
    if (ui.verdictIcon) {
      ui.verdictIcon.className = 'rt-verdict__icon rt-verdict__icon--rate-limited';
      ui.verdictIcon.textContent = '✍️';
    }
    if (ui.verdictTitle) {
      ui.verdictTitle.className = 'rt-verdict__title rt-verdict__title--rate-limited';
      ui.verdictTitle.textContent = 'اكتب هجومك الأول';
    }
    if (ui.verdictSubtitle) ui.verdictSubtitle.textContent = 'صندوق الهجوم فاضي. ما نقدر نحكم على شي للحين.';
    if (ui.simNote) ui.simNote.hidden = true;
    if (ui.empty) ui.empty.hidden = false;
    if (ui.breach) ui.breach.hidden = true;
    if (ui.vTrace) ui.vTrace.textContent = '—';
    if (ui.vLayer) ui.vLayer.textContent = '—';
    if (ui.vPolicy) ui.vPolicy.textContent = '—';
    if (ui.vReason) ui.vReason.textContent = '—';

    if (ui.overlay) {
      ui.overlay.classList.add('rt-overlay--active');
      ui.overlay.setAttribute('aria-hidden', 'false');
    }
    if (ui.verdict) {
      ui.verdict.setAttribute('aria-hidden', 'false');
      window.setTimeout(function () {
        ui.verdict.classList.add('rt-verdict--visible');
      }, 50);
    }
    // mark the input invalid for a11y feedback.
    if (ui.input) ui.input.setAttribute('aria-invalid', 'true');
  }

  /* يفتح trace drawer عبر نفس event name اللي يستخدمه kernel-approvals. */
  function openTraceDrawer(traceId) {
    if (!traceId) return;
    try {
      document.dispatchEvent(new CustomEvent('kerneltrace:open', { detail: { traceId: traceId } }));
    } catch (e) {
      // متصفحات قديمة بدون CustomEvent — تجاهل بأمان.
    }
  }

  function hideVerdict() {
    if (ui.verdict) {
      ui.verdict.classList.remove('rt-verdict--visible');
      ui.verdict.setAttribute('aria-hidden', 'true');
    }
    if (ui.overlay) {
      ui.overlay.classList.remove('rt-overlay--active');
      ui.overlay.setAttribute('aria-hidden', 'true');
    }
    // فضّ aria-invalid لما يقفل الـ drawer (رجّع الحقل لحالته الطبيعية).
    if (ui.input) ui.input.removeAttribute('aria-invalid');
  }

  function addChainMessage(text, isUser, kind) {
    if (!ui.chainMessages) return;
    var msg = document.createElement('div');
    var cls = 'rt-chain__msg ' + (isUser ? 'rt-chain__msg--user' : 'rt-chain__msg--system');
    if (!isUser && kind === 'breach') cls += ' rt-chain__msg--breach';
    msg.className = cls;

    var msgText = document.createElement('span');
    msgText.className = 'rt-chain__msg-text';
    msgText.textContent = text;
    msg.appendChild(msgText);

    var msgTime = document.createElement('span');
    msgTime.className = 'rt-chain__msg-time';
    msgTime.setAttribute('dir', 'ltr');
    msgTime.textContent = new Date().toLocaleTimeString('en-US', { hour12: false });
    msg.appendChild(msgTime);

    ui.chainMessages.appendChild(msg);
    ui.chainMessages.scrollTop = ui.chainMessages.scrollHeight;
  }

  async function sendChainMessage() {
    if (!ui.chainInput) return;
    var text = ui.chainInput.value.trim();
    if (!text) return;
    addChainMessage(text, true);
    ui.chainInput.value = '';
    if (ui.chainStatus) ui.chainStatus.textContent = 'Kernel يحلل…';
    var result = await chainMessage(text);
    if (result) {
      var vd = VERDICT_DISPLAY[result.verdict] || VERDICT_DISPLAY.blocked;
      addChainMessage(
        vd.icon + ' ' + vd.title + ': ' + result.reason,
        false,
        result.verdict === 'breached' ? 'breach' : null
      );
    }
  }

  function setAnalyzing(on) {
    if (!ui.attackBtn) return;
    ui.attackBtn.disabled = on;
    ui.attackBtn.innerHTML = on
      ? '<span>يجري التحليل…</span>'
      : '<span>اهجم</span><span aria-hidden="true">🗡</span>';
  }

  function bind() {
    if (ui.input) {
      if (ui.chars) {
        ui.input.addEventListener('input', function () {
          ui.chars.textContent = this.value.length + ' / 4000';
          // أي كتابة تفضّ حالة الـ invalid من محاولة الفارغ السابقة.
          this.removeAttribute('aria-invalid');
        });
      }
      ui.input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          runFromButton();
        }
      });
    }

    if (ui.attackBtn) ui.attackBtn.addEventListener('click', runFromButton);

    // زر إعادة الضبط: يمسح الجلسة + يفكّ Rate Limiter + يُعلن عبر aria-live.
    if (ui.resetBtn && ui.resetBtn.dataset.boundRtReset !== '1') {
      ui.resetBtn.dataset.boundRtReset = '1';
      ui.resetBtn.addEventListener('click', function () {
        resetState();
        if (ui.input) {
          ui.input.value = '';
          ui.input.removeAttribute('aria-invalid');
          if (ui.chars) ui.chars.textContent = '0 / 4000';
        }
        hideVerdict();
        announce('تمت إعادة ضبط الجلسة — العدّاد صفر والحد مرفوع.');
      });
    }

    // زر «افتح الأثر» — يربط الـ Trace ID بـ drawer الأثر الحقيقي.
    if (ui.vTrace && ui.vTrace.dataset.boundRtTrace !== '1') {
      ui.vTrace.dataset.boundRtTrace = '1';
      ui.vTrace.addEventListener('click', function () {
        var traceId = (this.textContent || '').trim();
        if (traceId && traceId !== '—') openTraceDrawer(traceId);
      });
    }

    // زر «جرّبها» من المكتبة — يملأ صندوق الإدخال.
    $$('[data-attack-prompt]').forEach(function (btn) {
      if (btn.dataset.boundRtTry === '1') return;
      btn.dataset.boundRtTry = '1';
      btn.addEventListener('click', function () {
        if (!ui.input) return;
        ui.input.value = btn.getAttribute('data-attack-prompt') || '';
        if (ui.chars) ui.chars.textContent = ui.input.value.length + ' / 4000';
        ui.input.focus();
        var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        var hero = document.querySelector('.rt-hero');
        if (hero) hero.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth' });
      });
    });

    if (ui.tryAgain) {
      ui.tryAgain.addEventListener('click', function () {
        hideVerdict();
        if (ui.input) ui.input.focus();
      });
    }
    if (ui.close) ui.close.addEventListener('click', hideVerdict);

    if (ui.chainSend) ui.chainSend.addEventListener('click', function () { sendChainMessage(); });
    if (ui.chainInput) {
      ui.chainInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          sendChainMessage();
        }
      });
    }

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && ui.verdict && ui.verdict.getAttribute('aria-hidden') === 'false') {
        hideVerdict();
      }
    });
  }

  async function runFromButton() {
    if (!ui.input) return;
    var text = ui.input.value.trim();
    if (!text) return;
    setAnalyzing(true);
    try {
      await launchAttack(text);
    } finally {
      setAnalyzing(false);
    }
  }

  /* ── إعادة الضبط (standalone عشان الـ UI button يقدر يناديه مباشرة) ─── */
  function resetState() {
    state = {
      phase: 'idle', attackCount: 0, blockedCount: 0, breachedCount: 0,
      rateLimitedCount: 0, lastVerdict: null, lastLayer: null, lastPolicyId: null,
      lastReason: null, traceId: null, runId: null, rateHits: [],
      lastAttackId: null, lastInput: null,
    };
    try { localStorage.removeItem(STATE_KEY); } catch (e) {}
    emit();
  }

  /* ── التصدير ────────────────────────────────────────────────────── */
  window.KernelRedteam = {
    launchAttack: launchAttack,
    chainMessage: chainMessage,
    analyze: classifyInput,
    suggestPolicy: suggestPolicyForId,
    snapshot: snapshot,
    onEvent: function (fn) { listeners.push(fn); },
    reset: resetState,
    _debug: function () {
      return { configParsed: !!cfgEl, attackCount: ATTACKS.length, rateMax: RT_RATE_MAX, rateWindowMs: RT_RATE_WINDOW_MS };
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
