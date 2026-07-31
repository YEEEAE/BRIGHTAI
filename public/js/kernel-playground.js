/**
 * kernel-playground.js — محرّك ملعب الحوكمة (vanilla JS، self-contained).
 *
 * منطق حتمي بالكامل: نفس النص + نفس الإعدادات = نفس النتيجة (قابل للاستشهاد به
 * في تدقيق). يشتغل محليًا (وضع احتياطي محلي أصلي) — لا يعتمد على مزوّد خارجي.
 *
 * خط الأنابيب 10 مراحل (M5): استلام، فحص PII، فحص الحقن، تقييم مخاطر، مطابقة
 * سياسات، استدعاء النموذج، تسجيل الإخراج، التكلفة والزمن، توليد الدليل، إعداد
 * الشهادة. كل مرحلة لها حالة (idle/running/done/skipped/failed/unavailable)
 * ووقت وسبب وإدخال/إخراج ومرجع سياسة/مقيّم.
 *
 * يُحمّل عبر <script type="module" src="/js/kernel-playground.js">، يربط على
 * astro:page-load مع dataset.bound للـ idempotency (مثل باقي وحدات kernel).
 * يحترم prefers-reduced-motion و document.hidden.
 *
 *契约 DOM: الصفحة توفّر #pg-config (JSON) + العناصر بـ data-attrs التالية:
 *   #pg-input · [data-sample] · [data-context] · [data-policy]/.pg-toggle[data-pid]
 *   .pg-card[data-stage] · .pg-connector[data-idx] · #pg-verdict · #pg-pane-with/without
 *   #pg-mini-timeline · #pg-speed · #pg-skip · #pg-export · #pg-recipe-fab · #pg-tour
 *   #pg-settings-panel · #pg-seed · #pg-temp · #pg-topp · #pg-replay · #pg-open-trace
 *   #pg-add-dataset · #pg-add-scenario · #pg-turns · #pg-add-turn · #pg-est
 */
(function () {
  'use strict';

  const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── إعدادات تُحقن من الصفحة ──────────────────────────────────────────────
  let CFG = { policies: [], piiTypes: [], packs: [], recipes: [], samples: [], models: [], datasets: [], injectionPatterns: [], outputScorers: [], limits: { maxRequests: 25, maxChars: 2000 } };
  function loadCfg() {
    const el = document.getElementById('pg-config');
    if (!el) return;
    try { CFG = JSON.parse(el.textContent || '{}'); } catch (e) { /* fallback للقيم الافتراضية */ }
  }

  // ── أدوات مساعدة ─────────────────────────────────────────────────────────
  function hashStr(s) {
    // تجزئة deterministic (FNV-1a) — للبذرة والثبات.
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return (h >>> 0);
  }
  function luhn(num) {
    const d = String(num).replace(/[\s-]/g, '');
    if (!/^\d{13,19}$/.test(d)) return false;
    let sum = 0, alt = false;
    for (let i = d.length - 1; i >= 0; i--) {
      let n = +d[i]; if (alt) { n *= 2; if (n > 9) n -= 9; } sum += n; alt = !alt;
    }
    return sum % 10 === 0;
  }
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // ── ② الكشف عن كيانات PII ─────────────────────────────────────────────────
  const PII_PATTERNS = [
    { type: 'iban', re: /\bSA\d{22}\b/g, conf: 0.99 },
    { type: 'saudi_id', re: /\b1\d{9}\b/g, conf: 0.95 },
    { type: 'phone', re: /\b0?5\d{8}\b/g, conf: 0.92 },
    { type: 'email', re: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, conf: 0.96 },
    { type: 'patient_id', re: /\b(?:MR|ملف(?:\s*مريض)?(?:\s*رقم)?)[-\s]*(\d{4,})\b/gi, conf: 0.9 },
    { type: 'credit_card', re: /\b(?:\d[ -]?){13,18}\b/g, conf: 0.85, validate: luhn },
    { type: 'passport', re: /\b[A-Z]{1,2}\d{7,8}\b/g, conf: 0.8 },
    { type: 'api_secret', re: /\b(?:sk-[A-Za-z0-9]{12,}|(?:OPENAI_)?API[_-]?KEY|api[_-]?secret|token)[=:]\s*[\w.-]+/gi, conf: 0.97 },
    { type: 'medical', re: /\b(?:ورم|خبيث|تشخيص|سرطان|مرض\s*مزمن|علاج\s*كيميائي|وصفة|أدوية|مريض)\b/g, conf: 0.75 },
  ];

  function detectEntities(text) {
    const found = [];
    for (const p of PII_PATTERNS) {
      p.re.lastIndex = 0;
      let m;
      while ((m = p.re.exec(text)) !== null) {
        const val = m[0];
        if (p.validate && !p.validate(val)) continue;
        const start = m.index, end = start + val.length;
        if (found.some((e) => start < e.end && end > e.start)) continue;
        found.push({ type: p.type, value: val, start, end, confidence: p.conf });
      }
    }
    found.sort((a, b) => a.start - b.start);
    return found;
  }

  // ── ③ فحص الحقن (patterns من البيانات) ───────────────────────────────────
  function detectInjection(text) {
    const hits = [];
    (CFG.injectionPatterns || []).forEach((pat) => {
      try {
        const re = new RegExp(pat.source, 'gi');
        re.lastIndex = 0;
        if (re.test(text)) hits.push({ id: pat.id, label: pat.label, severity: pat.severity });
      } catch (e) { /* نمط غير صالح — تجاهل */ }
    });
    return hits;
  }

  // ── ④ التقييم: 12 عامل ────────────────────────────────────────────────────
  function scoreRisk(entities, ctx, seed) {
    const types = new Set(entities.map((e) => e.type));
    const text = ctx.text;
    const inj = ctx.injectionHits.length > 0;
    const exfil = ctx.injectionHits.some((h) => h.id === 'inj_exfil');
    const cross = /(خارجية|خارج\s*المملكة|سويسرا|external|abroad|overseas)/i.test(text);
    const sensitive = ['iban', 'medical', 'patient_id', 'api_secret', 'credit_card'].some((t) => types.has(t));
    const sensitiveSector = ['صحية', 'مالية', 'حكومي'].includes(ctx.sector);

    const factors = [
      { id: 'pii_density', pts: Math.min(entities.length * 6, 18) },
      { id: 'sensitive_entity', pts: sensitive ? 16 : 0 },
      { id: 'injection', pts: inj ? 15 : 0 },
      { id: 'sector', pts: sensitiveSector ? 12 : 0 },
      { id: 'count', pts: Math.min(entities.length * 3, 10) },
      { id: 'exfil', pts: exfil ? 10 : 0 },
      { id: 'secret', pts: types.has('api_secret') ? 9 : 0 },
      { id: 'cross_border', pts: cross ? 8 : 0 },
      { id: 'volume', pts: text.length > 400 ? 6 : 0 },
      { id: 'role', pts: (ctx.sensitivity === 'حرجة' || ctx.sensitivity === 'عالية') && (ctx.role === 'موظف' || ctx.role === 'مطوّر') ? 6 : 0 },
      { id: 'timing', pts: (seed % 5) + 0 },
      { id: 'history', pts: ((seed >> 3) % 4) + 0 },
    ];
    const total = Math.min(factors.reduce((s, f) => s + f.pts, 0), 100);
    return { total, factors, injection: inj, exfil, cross };
  }

  // ── ⑤ مطابقة السياسات ─────────────────────────────────────────────────────
  function matchPolicies(entities, risk, activeIds, ctx) {
    const types = new Set(entities.map((e) => e.type));
    const packFilter = ctx.pack ? (p) => p.compliancePack === ctx.pack : () => true;
    return CFG.policies
      .filter((p) => activeIds.has(p.id))
      .filter(packFilter)
      .filter((p) => {
        if (p.piiType === 'api_secret') return types.has('api_secret') || risk.injection;
        if (p.id === 'pr_iso42001_transparency') return risk.total >= 70;
        if (p.id === 'pr_saudi_id_sfda') return types.has('saudi_id') && ctx.sector === 'صحية';
        return types.has(p.piiType);
      });
  }

  // إجراء كل كيان حسب أقوى سياسة مناسبة له.
  const ACTION_RANK = { block: 4, redact: 3, hitl: 2, mask: 1, log: 0 };
  function entityActions(entities, matched) {
    return entities.map((e) => {
      const applicable = matched.filter((p) => p.piiType === e.type || p.piiType === 'any');
      const winner = applicable.sort((a, b) => ACTION_RANK[b.action] - ACTION_RANK[a.action])[0];
      return { ...e, action: winner ? winner.action : 'log' };
    });
  }

  // ── المحرّر الكامل: analyze ────────────────────────────────────────────────
  function analyze(text, ctx, seedStr) {
    const seed = hashStr((seedStr || text) + '|' + ctx.sector + '|' + ctx.role + '|' + ctx.sensitivity + '|' + ctx.department + '|' + ctx.model);
    const entities = detectEntities(text);
    const injectionHits = detectInjection(text);
    const risk = scoreRisk(entities, { ...ctx, text, injectionHits }, seed);
    const activeIds = new Set(ctx.activePolicies);
    const matched = matchPolicies(entities, risk, activeIds, ctx);
    const entitiesWithAction = entityActions(entities, matched);

    const verdict = (() => {
      if (matched.some((p) => p.action === 'block') || risk.injection) return 'block';
      if (matched.some((p) => p.action === 'mask' || p.action === 'redact') || entitiesWithAction.some((e) => e.action === 'mask' || e.action === 'redact')) return 'mask';
      if (matched.some((p) => p.action === 'hitl')) return 'hitl';
      return 'allow';
    })();

    // النص بعد التعمية (ما يراه النموذج)
    let modelInput = '';
    let cursor = 0;
    for (const e of entities) {
      modelInput += text.slice(cursor, e.start);
      const tok = (CFG.piiTypes.find((t) => t.id === e.type) || {}).maskToken || '⟦بيانات⟧';
      modelInput += tok;
      cursor = e.end;
    }
    modelInput += text.slice(cursor);

    const model = (CFG.models || []).find((m) => m.id === ctx.model) || null;
    const providerAvailable = !model || model.available !== false;
    const trace = 'AI-' + (seed % 100000).toString().padStart(5, '0');
    const response = providerAvailable ? responseFor(verdict, text) : '';
    const packs = Array.from(new Set(matched.map((p) => p.compliancePack)));
    const evd = {
      id: trace,
      hash: seed.toString(16).padStart(8, '0') + '…',
      size: (1.2 + (seed % 900) / 1000).toFixed(1) + 'KB',
      packs,
    };

    // التكلفة والزمن: توكنز + موديل
    const tokensIn = Math.max(8, Math.ceil(text.length / 4));
    const tokensOut = providerAvailable ? Math.max(6, Math.ceil((response.length + seed % 40) / 4)) : 0;
    const costPer1k = model ? model.costPer1k : 12;
    const baseLatency = model ? model.latencyBase : 420;
    const cost = (tokensIn + tokensOut) / 1000 * costPer1k;
    const modelMs = (providerAvailable ? baseLatency : 0) + (seed % 800);

    const latencies = {
      1: 40 + (seed % 20),
      2: 60 + entities.length * 15 + (seed % 30),
      3: 50 + injectionHits.length * 20 + (seed % 25),
      4: 70 + (seed % 40),
      5: 55 + matched.length * 25 + (seed % 20),
      6: modelMs,
      7: 65 + (seed % 35),
      8: 45 + (seed % 20),
      9: 50 + (seed % 25),
      10: 40 + (seed % 15),
    };
    const totalMs = Object.values(latencies).reduce((s, v) => s + v, 0);

    // تسجيل الإخراج (output scoring)
    const outputScore = providerAvailable ? scoreOutput(verdict, entities, matched, seed, text, response) : null;

    // الشهادة (Demo)
    const certificate = {
      id: 'CERT-' + trace,
      status: verdict === 'block' ? 'Blocked' : verdict === 'hitl' ? 'Approval required' : providerAvailable ? 'Passed' : 'Incomplete',
      severity: severityFor(risk.total),
      score: safetyScore(verdict, risk, outputScore),
    };

    return {
      trace, entities, entitiesWithAction, injectionHits, risk, matched, verdict,
      modelInput, response, evd, cost, modelMs, totalMs, packs, model, providerAvailable,
      latencies, outputScore, certificate,
      inputTokens: tokensIn, outputTokens: tokensOut,
    };
  }

  function responseFor(verdict, text) {
    if (verdict === 'block') return 'ممنوع تنفيذ الطلب: احتوى على بيانات محظورة أو محاولة حقن أوامر. Kernel أوقفه قبل الوصول للنموذج.';
    if (verdict === 'mask') return 'تمت معالجة الطلب بعد تعمية البيانات الشخصية. الإجابة جاهزة دون كشف الهويات.';
    if (verdict === 'hitl') return 'الطلب بحاجة مراجعة بشرية قبل التنفيذ حسب سياسة الشفافية. أُرسل لقائمة الموافقات.';
    return 'تم تنفيذ الطلب بأمان. ما كشف أي بيانات شخصية، والنتيجة جاهزة للاستخدام.';
  }

  function scoreOutput(verdict, entities, matched, seed, text, response) {
    const piiLeak = verdict === 'mask' ? 85 : verdict === 'allow' ? 100 : 40;
    const hallucination = 100 - ((seed % 6) + (verdict === 'block' ? 30 : 0));
    const accuracy = Math.min(100, 72 + (seed % 20) + (entities.length ? 4 : 10));
    const compliance = Math.min(100, 60 + matched.length * 8 + (verdict === 'allow' ? 10 : 0));
    return (CFG.outputScorers || []).map((s) => {
      const score = s.id === 'sc_acc' ? accuracy : s.id === 'sc_hallucination' ? hallucination : s.id === 'sc_pii_leak' ? piiLeak : compliance;
      return { id: s.id, name: s.name, category: s.category, score, status: score >= 80 ? 'pass' : score >= 50 ? 'warn' : 'fail', weight: s.weight };
    });
  }

  function severityFor(riskTotal) {
    if (riskTotal >= 70) return 'حرجة';
    if (riskTotal >= 45) return 'عالية';
    if (riskTotal >= 25) return 'متوسطة';
    return 'منخفضة';
  }

  function safetyScore(verdict, risk, outputScore) {
    const base = verdict === 'block' ? 15 : verdict === 'hitl' ? 45 : verdict === 'mask' ? 80 : 95;
    const outAvg = outputScore ? Math.round(outputScore.reduce((s, o) => s + o.score * (o.weight || 1), 0) / Math.max(1, outputScore.reduce((s, o) => s + (o.weight || 1), 0))) : 0;
    return Math.max(0, Math.min(100, Math.round(base * 0.6 + outAvg * 0.2 + (100 - risk.total) * 0.2)));
  }

  // ── عرض الكيانات في النص (تظليل ملوّن) ─────────────────────────────────────
  function renderHighlighted(text, entities, mode) {
    const frag = document.createDocumentFragment();
    let cursor = 0;
    for (const e of entities) {
      frag.appendChild(document.createTextNode(text.slice(cursor, e.start)));
      const span = document.createElement('mark');
      span.className = 'pg-entity';
      span.dataset.type = e.type;
      span.title = `${piiLabel(e.type)} · ثقة ${Math.round(e.confidence * 100)}% · إجراء ${actionLabel(e.action)}`;
      if (mode === 'masked') {
        const m = document.createElement('span');
        m.className = 'pg-entity__mask';
        m.textContent = (CFG.piiTypes.find((t) => t.id === e.type) || {}).maskToken || '⟦…⟧';
        span.appendChild(m);
      } else {
        span.textContent = e.value;
      }
      const chip = document.createElement('span');
      chip.className = 'pg-entity__chip';
      chip.textContent = piiLabel(e.type);
      span.appendChild(chip);
      frag.appendChild(span);
      cursor = e.end;
    }
    frag.appendChild(document.createTextNode(text.slice(cursor)));
    return frag;
  }
  function piiLabel(id) { return (CFG.piiTypes.find((t) => t.id === id) || {}).label || id; }
  function piiColor(id) { return (CFG.piiTypes.find((t) => t.id === id) || {}).color || '#94a3b8'; }
  function actionLabel(a) { return ({ mask: 'تعمية', block: 'حظر', redact: 'حذف', log: 'تسجيل', hitl: 'مراجعة بشرية' })[a] || a || 'تسجيل'; }

  // ═══════════════════ العرض (UI) ═══════════════════

  const STAGE = {
    1: { title: 'الاستلام', color: 'var(--status-info)' },
    2: { title: 'فحص PII', color: 'var(--status-warning)' },
    3: { title: 'فحص الحقن', color: '#f43f5e' },
    4: { title: 'تقييم المخاطر', color: '#f59e0b' },
    5: { title: 'مطابقة السياسات', color: 'var(--brand)' },
    6: { title: 'استدعاء النموذج', color: 'var(--indigo-400, #818cf8)' },
    7: { title: 'تسجيل الإخراج', color: '#c084fc' },
    8: { title: 'التكلفة والزمن', color: '#2dd4bf' },
    9: { title: 'توليد الدليل', color: 'var(--status-success)' },
    10: { title: 'إعداد الشهادة', color: '#4ade80' },
  };
  const STAGE_COUNT = 10;

  function stateOf(state) {
    const map = { idle: 'خامدة', running: 'جارية', done: 'منتهية', skipped: 'متجاوَزة', failed: 'فاشلة', unavailable: 'غير متاحة' };
    return map[state] || state;
  }

  function setCardState(stage, state) {
    const card = $(`.pg-card[data-stage="${stage}"]`);
    if (!card) return;
    card.dataset.state = state;
    card.style.setProperty('--pg-stage', STAGE[stage].color);
    const live = card.querySelector('[data-live]');
    if (live) live.textContent = `المرحلة ${stage} من ${STAGE_COUNT}: ${STAGE[stage].title}، الحالة: ${stateOf(state)}`;
  }

  function setCardTime(stage, ms) {
    const card = $(`.pg-card[data-stage="${stage}"]`);
    if (!card) return;
    const t = card.querySelector('[data-time]');
    if (t) t.textContent = ms > 0 ? `${ms}ms` : '';
  }

  function setDecision(idx, decision) {
    const conn = $(`.pg-connector[data-idx="${idx}"]`);
    if (!conn) return;
    const line = conn.querySelector('.pg-connector__line');
    const bead = conn.querySelector('.pg-decision');
    if (line) line.dataset.decision = decision;
    if (bead) { bead.dataset.decision = decision; bead.textContent = ({ pass: '✅', mask: '⚠️', block: '⛔', hitl: '🧑‍⚖️', wait: '⏸️', unavailable: '🚫' })[decision] || ''; }
  }

  function delay(ms) { return new Promise((r) => setTimeout(r, ms)); }

  // تعبئة محتوى كل مرحلة
  function fillStage1(body, r, ctx) {
    body.innerHTML = `
      <div class="pg-receipt">
        <div><strong>Trace:</strong> <code dir="ltr">${r.trace}</code></div>
        <div><strong>التوكنز:</strong> ${r.inputTokens}</div>
        <div><strong>اللغة:</strong> عربية</div>
        <div><strong>الموديل:</strong> ${r.model ? r.model.name : 'افتراضي'} ${r.providerAvailable ? '' : '<span class="pg-demo-tag">غير متاح</span>'}</div>
      </div>`;
  }
  function fillStage2(body, r, ctx, mode) {
    const wrap = document.createElement('div');
    const toolbar = document.createElement('div');
    toolbar.className = 'pg-pii-toolbar';
    const toggle = document.createElement('button');
    toggle.className = 'pg-skip-btn';
    toggle.type = 'button';
    toggle.textContent = mode === 'masked' ? 'الأصلي' : 'بعد التعمية';
    toggle.addEventListener('click', () => fillStage2(body, r, ctx, mode === 'masked' ? 'original' : 'masked'));
    toolbar.appendChild(toggle);
    wrap.appendChild(toolbar);

    // نعرض نفس النص الذي حُلّل (conversation يشمل اللفات) عشان الإزاحات تتطابق.
    const shown = ctx.conversation || ctx.text;
    const box = document.createElement('div');
    box.className = 'pg-pii-text';
    box.dir = /[؀-ۿ]/.test(shown) ? 'rtl' : 'ltr';
    box.appendChild(renderHighlighted(shown, r.entitiesWithAction, mode));
    wrap.appendChild(box);

    const tbl = document.createElement('table');
    tbl.className = 'pg-pii-table';
    tbl.setAttribute('role', 'table');
    tbl.setAttribute('aria-label', 'الكيانات المكتشفة ودرجات الثقة');
    tbl.innerHTML = `<thead><tr><th>النوع</th><th>القيمة</th><th>الثقة</th><th>الإجراء</th></tr></thead>`;
    const tb = document.createElement('tbody');
    r.entitiesWithAction.forEach((e) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${piiLabel(e.type)}</td><td dir="ltr">${e.value}</td><td>${Math.round(e.confidence * 100)}%</td><td>${actionLabel(e.action)}</td>`;
      tb.appendChild(tr);
    });
    if (!r.entitiesWithAction.length) tb.innerHTML = '<tr><td colspan="4">ما كشف بيانات شخصية.</td></tr>';
    tbl.appendChild(tb);
    wrap.appendChild(tbl);

    const alt = document.createElement('p');
    alt.className = 'pg-sr-only';
    alt.textContent = 'قائمة الكيانات: ' + (r.entitiesWithAction.map((e) => `${piiLabel(e.type)} (${Math.round(e.confidence * 100)}%)`).join('، ') || 'لا يوجد');
    wrap.appendChild(alt);

    body.innerHTML = '';
    body.appendChild(wrap);
  }
  function fillStage3(body, r) {
    if (!r.injectionHits.length) { body.innerHTML = '<p>ما اكتشف أي محاولة حقن أوامر.</p>'; return; }
    body.innerHTML = `
      <div class="pg-inj">
        ${r.injectionHits.map((h) => `
          <div class="pg-inj__item" data-sev="${h.severity}">
            <strong>${h.label}</strong>
            <span class="pg-pack-chip">${h.severity}</span>
          </div>`).join('')}
      </div>
      <p class="pg-inj__note">أي إشارة حقن ترفع المخاطر وقد تحظر الطلب قبل النموذج.</p>`;
  }
  function fillStage4(body, r) {
    const pct = r.risk.total;
    const color = pct >= 70 ? 'var(--status-danger)' : pct >= 45 ? 'var(--status-warning)' : 'var(--status-success)';
    const R = 42, C = 2 * Math.PI * R, off = C * (1 - pct / 100);
    const factorsRows = r.risk.factors
      .filter((f) => f.pts > 0)
      .sort((a, b) => b.pts - a.pts)
      .map((f) => {
        const w = CFG.factorWeights && CFG.factorWeights[f.id];
        const max = (w != null ? w : f.pts);
        const widthPct = Math.min(100, (f.pts / Math.max(max, 1)) * 100);
        const def = (CFG.factorLabels && CFG.factorLabels[f.id]) || f.id;
        return `<div class="pg-factor"><span class="pg-factor__name">${def}</span><span class="pg-factor__pts">+${f.pts}</span><span class="pg-factor__bar"><span style="width:${widthPct}%"></span></span></div>`;
      })
      .join('');
    const top = r.risk.factors.filter((f) => f.pts > 0).sort((a, b) => b.pts - a.pts)[0];
    const topLabel = top && CFG.factorLabels ? (CFG.factorLabels[top.id] || top.id) : '';
    const why = pct === 0 ? 'ما في عوامل مخاطر ظاهرة — الطلب منخفض الخطورة.'
      : topLabel ? `أكبر مساهم: «${topLabel}» (+${top.pts}) من عتبة الحظر 70.`
      : 'عوامل متعددة رفعت الدرجة فوق عتبة الحظر 70.';
    body.innerHTML = `
      <div class="pg-risk">
        <div class="pg-risk-arc" style="--pg-risk-c:${color}">
          <svg width="96" height="96" viewBox="0 0 96 96">
            <circle class="pg-risk-arc__track" cx="48" cy="48" r="${R}" fill="none" stroke-width="8"/>
            <circle class="pg-risk-arc__fill" cx="48" cy="48" r="${R}" fill="none" stroke-width="8" stroke-linecap="round" stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${off.toFixed(1)}"/>
          </svg>
          <span class="pg-risk-arc__num" data-count="${pct}">0</span>
        </div>
        <div class="pg-factors"><div class="pg-threshold" title="عتبة الحظر 70"></div>${factorsRows || '<p class="pg-factor__name">ما في عوامل مخاطر.</p>'}</div>
      </div>
      <p class="pg-risk__why">${why}</p>`;
    const num = body.querySelector('.pg-risk-arc__num');
    if (num && !REDUCED) animateCount(num, 0, pct, 600);
    else if (num) num.textContent = String(pct);
  }
  function fillStage5(body, r) {
    if (!r.matched.length) { body.innerHTML = '<p>ما اشتعلت أي سياسة. الطلب متوافق.</p>'; return; }
    body.innerHTML = r.matched.map((p) => {
      const pack = (CFG.packs.find((x) => x.id === p.compliancePack) || {}).label || p.compliancePack;
      const act = ({ mask: 'تعمية', block: 'حظر', redact: 'حذف', log: 'تسجيل', hitl: 'مراجعة بشرية' })[p.action] || p.action;
      return `<div class="pg-pmatch__item"><strong>${p.name}</strong> <span class="pg-pack-chip">${pack}</span><code class="pg-pmatch__cond">${p.condition}</code><div>الإجراء: ${act} · <a class="pg-pmatch__link" href="/kernel/policies/">↗ السياسة</a></div></div>`;
    }).join('');
  }
  function fillStage6(body, r) {
    if (!r.providerAvailable) {
      body.innerHTML = '<div class="pg-inj__item" data-sev="عالية"><strong>المزوّد غير متاح</strong><span class="pg-demo-tag">Demo</span></div><p class="pg-inj__note">المراحل 1–5 تمت محليًا. النموذج الخارجي ما اشتعل — الحوكمة كفت الدخول قبل التكلفة.</p>';
      return;
    }
    body.innerHTML = `
      <div class="pg-model-meta"><span>النموذج: ${r.model ? r.model.name : 'افتراضي'} · ${r.model ? r.model.provider : '—'}</span><span>الزمن: ${r.modelMs}ms</span><span>التكلفة: ${r.cost.toFixed(2)} هللة</span><span>توكنز: ${r.inputTokens} → ${r.outputTokens}</span></div>
      <div class="pg-model-tabs"><button data-mtab="input" aria-selected="true">ما يراه النموذج</button><button data-mtab="resp">الاستجابة</button></div>
      <div class="pg-model-input" dir="ltr">${escapeHtml(r.modelInput)}</div>`;
    const inputPane = body.querySelector('.pg-model-input');
    const btns = body.querySelectorAll('.pg-model-tabs button');
    btns.forEach((b) => b.addEventListener('click', () => {
      btns.forEach((x) => x.setAttribute('aria-selected', 'false'));
      b.setAttribute('aria-selected', 'true');
      if (b.dataset.mtab === 'input') { inputPane.className = 'pg-model-input'; inputPane.dir = 'ltr'; inputPane.textContent = r.modelInput; }
      else {
        inputPane.className = 'pg-model-response pg-model-cursor';
        inputPane.dir = 'rtl';
        streamText(inputPane, r.response);
      }
    }));
  }
  function fillStage7(body, r) {
    if (!r.outputScore) { body.innerHTML = '<p>ما في مخرجات لتقييمها (الطلب محظور أو المزوّد غير متاح).</p>'; return; }
    body.innerHTML = r.outputScore.map((s) => `
      <div class="pg-score-item" data-status="${s.status}">
        <div class="pg-score-item__head"><strong>${s.name}</strong><span class="pg-score-item__val">${s.score}%</span></div>
        <div class="pg-score-item__bar"><span style="width:${s.score}%"></span></div>
        <span class="pg-score-item__status">${({ pass: 'ممتاز', warn: 'إنذار', fail: 'فشل' })[s.status] || s.status}</span>
      </div>`).join('');
  }
  function fillStage8(body, r) {
    const rows = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => `
      <tr><td>${n}. ${STAGE[n].title}</td><td dir="ltr">${r.latencies[n]}ms</td></tr>`).join('');
    body.innerHTML = `
      <table class="pg-pii-table"><thead><tr><th>المرحلة</th><th>الزمن</th></tr></thead><tbody>${rows}</tbody></table>
      <div class="pg-cost-total">الإجمالي: <strong dir="ltr">${r.totalMs}ms</strong> · التكلفة: <strong dir="ltr">${r.cost.toFixed(2)}</strong> هللة</div>`;
  }
  function fillStage9(body, r) {
    const packs = r.packs.map((pid) => (CFG.packs.find((x) => x.id === pid) || {}).label).filter(Boolean).join(' · ') || '—';
    body.innerHTML = `
      <div class="pg-evd">
        <div class="pg-evd__cover" aria-hidden="true"></div>
        <div class="pg-evd__meta">
          <strong>EVD-${r.evd.id}</strong>
          <span>الحجم: ${r.evd.size} · الحزم: ${packs}</span>
          <span class="pg-evd__hash" dir="ltr">sha256:${r.evd.hash}</span>
        </div>
      </div>
      <div style="display:flex;gap:var(--space-2);margin-top:var(--space-2)">
        <button class="pg-skip-btn" type="button" data-evd-preview>معاينة</button>
        <button class="pg-skip-btn" type="button" data-evd-download>تحميل</button>
        <button class="pg-skip-btn" type="button" data-evd-open>افتح الدليل</button>
      </div>`;
  }
  function fillStage10(body, r) {
    const cert = r.certificate;
    const color = cert.status === 'Passed' ? 'var(--status-success)' : cert.status === 'Blocked' ? 'var(--status-danger)' : 'var(--status-warning)';
    body.innerHTML = `
      <div class="pg-cert" style="--pg-cert-c:${color}">
        <div class="pg-cert__badge"><strong>${cert.status}</strong><span class="pg-demo-tag">Demo</span></div>
        <div class="pg-cert__meta">المعرف: <code dir="ltr">${cert.id}</code></div>
        <div class="pg-cert__meta">الخطورة: ${cert.severity} · درجة الأمان: ${cert.score}/100</div>
      </div>`;
  }

  function animateCount(el, from, to, dur) {
    const t0 = performance.now();
    function step(now) {
      const p = Math.min(1, (now - t0) / dur);
      el.textContent = String(Math.round(from + (to - from) * p));
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  function streamText(el, text) {
    el.textContent = '';
    if (REDUCED || document.hidden) { el.textContent = text; return; }
    let i = 0;
    (function tick() {
      if (i > text.length) { el.classList.remove('pg-model-cursor'); return; }
      el.textContent = text.slice(0, i);
      i += 2;
      setTimeout(tick, 18);
    })();
  }
  function escapeHtml(s) { return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]); }

  // ── تعبئة عمود النتيجة ────────────────────────────────────────────────────
  function renderResult(r, ctx) {
    const v = $('#pg-verdict');
    const state = ({ block: 'var(--status-danger)', mask: 'var(--status-warning)', hitl: 'var(--status-info)', allow: 'var(--status-success)' })[r.verdict];
    const title = ({ block: 'حُظر قبل الوصول للنموذج', mask: 'سُمح بعد التعمية', hitl: 'بحاجة مراجعة بشرية', allow: 'سُمح بأمان' })[r.verdict];
    const icon = ({ block: '⛔', mask: '⚠️', hitl: '🧑‍⚖️', allow: '✅' })[r.verdict];
    const reason = r.verdict === 'block'
      ? (r.risk.injection ? 'احتوى على إشارات حقن أوامر أو استخراج أسرار.' : 'احتوى على بيانات تحظرها سياسة فعّالة (مثل آيبان أو سجل طبي).')
      : r.verdict === 'mask'
        ? `عُمّيت ${r.entities.length} كيان قبل الإرسال للنموذج.`
        : r.verdict === 'hitl'
          ? 'سياسة مراجعة بشرية اشتعلت (SDAIA شفافية أو ISO 42001 مخاطر عالية).'
          : 'ما كشف أي بيانات شخصية ولا انتهك أي سياسة.';
    v.style.setProperty('--pg-state', state);
    v.innerHTML = `<div class="pg-verdict__icon" aria-hidden="true">${icon}</div><h3 class="pg-verdict__title">${title}</h3><p class="pg-verdict__reason">${reason}</p>`;

    // تبويب "بدون Kernel" — النص الأصلي كما كان سيغادر (نفس النص الذي حُلّل)
    const rawShown = ctx.conversation || ctx.text;
    const without = $('#pg-pane-without');
    if (without) without.innerHTML = `<div class="pg-danger-strip">⚠ هذي البيانات كانت ستغادر منشأتك بلا تعمية</div><div>${escapeHtml(rawShown)}</div>`;
    const withPane = $('#pg-pane-with');
    if (withPane) { withPane.textContent = ''; withPane.appendChild(renderHighlighted(rawShown, r.entitiesWithAction, 'masked')); }

    // خريطة الامتثال
    const map = $('#pg-compliance-map');
    if (map) {
      const packs = r.packs.length ? r.packs : (r.verdict === 'allow' ? ['iso27001'] : []);
      map.innerHTML = packs.map((pid) => {
        const p = CFG.packs.find((x) => x.id === pid) || { label: pid, matter: '' };
        return `<span class="pg-pack-chip">${p.label} · ${p.matter || ''}</span>`;
      }).join('') || '<span class="pg-factor__name">ما في مواد متأثرة.</span>';
    }

    // الحكم + الأثر
    const sc = $('#pg-scorecard');
    if (sc) {
      sc.innerHTML = `
        <div class="pg-impact__cell"><div class="pg-impact__num" data-score>${r.certificate.score}</div><div class="pg-impact__label">درجة الأمان</div></div>
        <div class="pg-impact__cell"><div class="pg-impact__num" data-severity>${r.certificate.severity}</div><div class="pg-impact__label">الخطورة</div></div>
        <div class="pg-impact__cell"><div class="pg-impact__num" data-human>${r.verdict === 'hitl' ? 'مطلوبة' : 'تلقائي'}</div><div class="pg-impact__label">قرار بشري</div></div>
        <div class="pg-impact__cell"><div class="pg-impact__num" data-protected>${r.entities.length}</div><div class="pg-impact__label">سجلات محمية</div></div>
        <div class="pg-impact__cell"><div class="pg-impact__num" data-cost>${r.cost.toFixed(1)}</div><div class="pg-impact__label">هللة</div></div>
        <div class="pg-impact__cell"><div class="pg-impact__num" data-latency>${r.totalMs}</div><div class="pg-impact__label">مللي</div></div>`;
    }

    // A/B Diff summary
    renderDiffSummary(r, ctx);

    // صدّر الكود
    buildExport(r, ctx);

    // خزّن آخر نتيجة لإعادة التشغيل
    lastResult = { r, ctx };
  }

  function renderDiffSummary(r, ctx) {
    const panel = $('#pg-diff-summary');
    const panes = $('#pg-diff-panes');
    const root = document.querySelector('[data-pg-root]');
    if (!panel || !panes || !root) return;
    if (root.dataset.diff !== 'true') { panel.hidden = true; return; }

    // A = الحوكمة الحالية، B = بدون Kernel (كل السياسات مطفأة).
    // الطرفان يحللان نفس النص (conversation يشمل اللفات) عشان المقارنة عادلة.
    const diffText = ctx.conversation || ctx.text;
    const ctxB = { ...ctx, activePolicies: [] };
    const rB = analyze(diffText, ctxB, (root.dataset.seed || 'brightai-demo') + '-raw');
    panel.hidden = false;
    const verdictLabel = (vv) => ({ block: 'حُظر', mask: 'عُمّي', hitl: 'مراجعة', allow: 'سُمح' })[vv];
    panes.innerHTML = `
      <div class="pg-pane ${r.verdict !== rB.verdict ? 'pg-diff-add' : ''}">
        <div class="pg-pane__title">A · مع Kernel — ${verdictLabel(r.verdict)}</div>
        <div>سجلات محمية: ${r.entities.length} · تكلفة: ${r.cost.toFixed(1)} هللة</div>
        <div class="pg-diff-line">السياسات: ${r.matched.length ? r.matched.map((p) => p.name).join('، ') : 'لا شيء'}</div>
      </div>
      <div class="pg-pane ${r.verdict !== rB.verdict ? 'pg-diff-del' : ''}">
        <div class="pg-pane__title">B · بدون Kernel — ${verdictLabel(rB.verdict)}</div>
        <div>سجلات مكشوفة: ${rB.entities.length} · البيانات تغادر كما هي</div>
        <div class="pg-diff-line">السياسات: لا شيء</div>
      </div>`;
  }

  // ── صدّر الكود (cURL / Python / TS) ────────────────────────────────────────
  let _exportCodes = null;
  function buildExport(r, ctx) {
    const panel = $('#pg-export-panel');
    if (!panel) return;
    const payload = JSON.stringify({ prompt: r.modelInput, policies: r.packs, trace: r.trace, model: r.model ? r.model.id : 'default' });
    const curl = `curl -X POST https://api.brightai.site/v1/govern \\n  -H "Content-Type: application/json" \\n  -d '${payload}'`;
    const py = `import requests\n\nr = requests.post(\n    "https://api.brightai.site/v1/govern",\n    json=${payload.replace(/'/g, '"')},\n)\nprint(r.json())`;
    const ts = `const res = await fetch("https://api.brightai.site/v1/govern", {\n  method: "POST",\n  headers: { "Content-Type": "application/json" },\n  body: JSON.stringify(${payload.replace(/'/g, '"')}),\n});\nconst data = await res.json();`;
    _exportCodes = { curl, py, ts };
    const pre = panel.querySelector('.pg-export__pre');
    const setActive = (lang) => { pre.textContent = (_exportCodes && _exportCodes[lang]) || ''; panel.querySelectorAll('.pg-export__langs button').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.lang === lang))); };
    // اربط الأزرار مرة واحدة فقط (منع تراكم الـ listeners)
    if (!panel.dataset.exportBound) {
      panel.dataset.exportBound = '1';
      panel.querySelectorAll('.pg-export__langs button').forEach((b) => b.addEventListener('click', () => setActive(b.dataset.lang)));
      const copy = panel.querySelector('.pg-export__copy');
      if (copy) copy.addEventListener('click', () => { navigator.clipboard?.writeText(pre.textContent || ''); copy.textContent = '✓ نُسخ'; setTimeout(() => (copy.textContent = 'نسخ'), 1500); });
    }
    setActive('curl');
  }

  // ── تشغيل خط الأنابيب بالكامل ───────────────────────────────────────────────
  async function runPipeline(r, ctx) {
    const speed = currentSpeed();
    const step = REDUCED ? 0 : (speed === 0.5 ? 700 : 350);

    resetStages();
    setCardState(1, 'running');
    await delay(step);
    fillStage1(stageBody(1), r, ctx);
    setCardState(1, 'done'); setCardTime(1, r.latencies[1]);
    setDecision(1, r.entities.length ? 'mask' : 'pass');

    setCardState(2, 'running');
    await delay(step);
    fillStage2(stageBody(2), r, ctx, 'original');
    setCardState(2, 'done'); setCardTime(2, r.latencies[2]);
    setDecision(2, r.entities.length ? 'mask' : 'pass');

    setCardState(3, 'running');
    await delay(step);
    fillStage3(stageBody(3), r);
    setCardState(3, 'done'); setCardTime(3, r.latencies[3]);
    setDecision(3, r.injectionHits.length ? 'block' : 'pass');

    setCardState(4, 'running');
    await delay(step);
    fillStage4(stageBody(4), r);
    setCardState(4, 'done'); setCardTime(4, r.latencies[4]);
    setDecision(4, r.risk.total >= 70 ? 'block' : 'pass');

    const modelBlocked = r.verdict === 'block';
    const providerDown = !r.providerAvailable;

    setCardState(5, 'running'); await delay(step); fillStage5(stageBody(5), r); setCardState(5, 'done'); setCardTime(5, r.latencies[5]);
    setDecision(5, modelBlocked ? 'block' : r.matched.length ? 'mask' : 'pass');

    if (modelBlocked) {
      // أوقف قبل النموذج
      setCardState(6, 'skipped'); setCardState(7, 'skipped'); setCardTime(6, 0); setCardTime(7, 0);
      const b6 = stageBody(6); if (b6) b6.innerHTML = '<p>أوقفه Kernel قبل الوصول للنموذج — الحكم: حظر.</p>';
      const b7 = stageBody(7); if (b7) b7.innerHTML = '<p>لا مخرجات للتقييم — الطلب محظور.</p>';
      setDecision(6, 'block');
      setDecision(7, 'block');
    } else if (providerDown) {
      // احتياطي محلي: المراحل 1-4 تمت محليًا، النموذج غير متاح.
      setCardState(6, 'unavailable'); fillStage6(stageBody(6), r); setCardTime(6, 0);
      setCardState(7, 'unavailable'); fillStage7(stageBody(7), r); setCardTime(7, 0);
      setDecision(6, 'unavailable');
    } else {
      setCardState(6, 'running'); await delay(step); fillStage6(stageBody(6), r); setCardState(6, 'done'); setCardTime(6, r.latencies[6]);
      setDecision(6, 'pass');
      setCardState(7, 'running'); await delay(step); fillStage7(stageBody(7), r); setCardState(7, 'done'); setCardTime(7, r.latencies[7]);
      setDecision(7, 'pass');
    }

    // مراحل التكلفة والدليل والشهادة تشتغل دائمًا (حتى عند الحظر).
    setCardState(8, 'running'); await delay(step); fillStage8(stageBody(8), r); setCardState(8, 'done'); setCardTime(8, r.latencies[8]);
    setDecision(8, 'pass');
    setCardState(9, 'running'); await delay(step); fillStage9(stageBody(9), r); setCardState(9, 'done'); setCardTime(9, r.latencies[9]);
    setDecision(9, 'pass');
    setCardState(10, 'running'); await delay(step); fillStage10(stageBody(10), r); setCardState(10, 'done'); setCardTime(10, r.latencies[10]);

    renderResult(r, ctx);
    announce(`اكتمل التحليل. الحكم: ${r.verdict === 'block' ? 'حُظر' : r.verdict === 'mask' ? 'عُمّي ثم سُمح' : r.verdict === 'hitl' ? 'مراجعة بشرية' : 'سُمح'}.`);
    updateMiniTimeline(r);
  }
  function stageBody(n) { const c = $(`.pg-card[data-stage="${n}"]`); return c ? c.querySelector('.pg-card__body') : null; }
  function resetStages() {
    for (let s = 1; s <= STAGE_COUNT; s++) { setCardState(s, 'idle'); setCardTime(s, 0); const b = stageBody(s); if (b) b.innerHTML = ''; }
    for (let i = 1; i < STAGE_COUNT; i++) setDecision(i, 'wait');
  }

  function updateMiniTimeline(r) {
    $$('.pg-mini[data-mini]').forEach((btn) => {
      const n = parseInt(btn.dataset.mini, 10);
      const st = $('.pg-card[data-stage="' + n + '"]');
      if (!st) return;
      btn.dataset.state = st.dataset.state || 'idle';
    });
  }

  function announce(msg) {
    let live = $('#pg-live');
    if (!live) { live = document.createElement('div'); live.id = 'pg-live'; live.setAttribute('role', 'status'); live.setAttribute('aria-live', 'polite'); live.className = 'pg-sr-only'; document.body.appendChild(live); }
    live.textContent = msg;
  }

  let _speed = 1;
  function currentSpeed() { return _speed; }
  let lastResult = null;

  // ── قراءة حالة الإدخال ─────────────────────────────────────────────────────
  function readCtx() {
    const text = ($('#pg-input') || {}).value || '';
    const sector = ($('[data-context="sector"]') || {}).value || 'عام';
    const department = ($('[data-context="department"]') || {}).value || 'عام';
    const role = ($('[data-context="role"]') || {}).value || 'موظف';
    const sensitivity = ($('[data-context="sensitivity"]') || {}).value || 'متوسطة';
    const deployment = ($('[data-context="deployment"]') || {}).value || 'سحابي';
    const model = ($('[data-context="model"]') || {}).value || 'jais';
    const dataset = ($('[data-context="dataset"]') || {}).value || 'free';
    const pack = ($('[data-context="pack"]') || {}).value || '';
    const activePolicies = $$('.pg-toggle[data-pid]').filter((t) => t.getAttribute('aria-checked') === 'true').map((t) => t.dataset.pid);

    // محادثة متعددة اللفات
    let conversation = text;
    $$('#pg-turns .pg-turn').forEach((turn) => {
      const t = turn.querySelector('[data-turn-text]');
      const roleSel = turn.querySelector('[data-turn-role]');
      if (t && t.value.trim()) {
        const who = roleSel ? roleSel.value === 'assistant' ? 'المساعد: ' : 'المستخدم: ' : '';
        conversation += '\n' + who + t.value;
      }
    });

    return { text, conversation, sector, department, role, sensitivity, deployment, model, dataset, pack, activePolicies };
  }

  // ── تقدير التكلفة والزمن (مباشر أثناء الكتابة) ─────────────────────────────
  function updateEstimate() {
    const est = $('#pg-est');
    if (!est) return;
    const text = ($('#pg-input') || {}).value || '';
    const modelId = ($('[data-context="model"]') || {}).value || 'jais';
    const model = (CFG.models || []).find((m) => m.id === modelId);
    const tokensIn = Math.max(8, Math.ceil(text.length / 4));
    const seed = hashStr(text || 'x');
    const cost = model ? (tokensIn / 1000) * model.costPer1k : 0;
    const latency = model ? model.latencyBase + (seed % 800) : 0;
    const c = est.querySelector('[data-est-cost]');
    const l = est.querySelector('[data-est-latency]');
    if (c) c.textContent = '~' + cost.toFixed(2);
    if (l) l.textContent = '~' + latency;
  }

  // ── التهيئة + ربط الأحداث ──────────────────────────────────────────────────
  function init() {
    loadCfg();
    const root = document.querySelector('[data-pg-root]');
    if (!root || root.dataset.bound === '1') return;
    root.dataset.bound = '1';

    // عدّاد الأحرف
    const ta = $('#pg-input');
    const counter = $('#pg-counter');
    const updateCounter = () => {
      if (!ta || !counter) return;
      const n = ta.value.length;
      counter.textContent = `${n} / ${CFG.limits.maxChars}`;
      counter.parentElement && counter.parentElement.toggleAttribute('data-near-limit', n > CFG.limits.maxChars * 0.85);
      updateEstimate();
    };
    if (ta) ta.addEventListener('input', updateCounter);
    updateCounter();
    $$('[data-context]').forEach((s) => s.addEventListener('change', updateEstimate));

    // محادثة متعددة اللفات
    const turns = $('#pg-turns');
    const addTurn = $('#pg-add-turn');
    let turnCount = 1;
    if (addTurn && turns) addTurn.addEventListener('click', () => {
      turnCount++;
      const row = document.createElement('div');
      row.className = 'pg-turn';
      row.dataset.turn = String(turnCount);
      row.innerHTML = `
        <select data-turn-role aria-label="دور اللفة ${turnCount}">
          <option value="user">مستخدم</option>
          <option value="assistant">مساعد</option>
        </select>
        <textarea class="pg-textarea pg-turn__text" data-turn-text maxlength="${CFG.limits.maxChars}" placeholder="لفة إضافية من المحادثة…" dir="auto"></textarea>
        <button class="pg-skip-btn pg-turn__del" type="button" aria-label="حذف اللفة">✕</button>`;
      row.querySelector('.pg-turn__del').addEventListener('click', () => row.remove());
      turns.appendChild(row);
    });

    // العيّنات
    $$('[data-sample]').forEach((btn) => btn.addEventListener('click', () => {
      const s = CFG.samples.find((x) => x.id === btn.dataset.sample);
      if (!s || !ta) return;
      ta.value = s.prompt;
      updateCounter();
      ta.focus();
      announce(`تحميل عيّنة: ${s.label}`);
    }));

    // مفاتيح السياسات
    $$('.pg-toggle[data-pid]').forEach((t) => t.addEventListener('click', () => {
      const on = t.getAttribute('aria-checked') === 'true';
      t.setAttribute('aria-checked', String(!on));
    }));
    const allBtn = $('#pg-all-policies');
    if (allBtn) allBtn.addEventListener('click', () => {
      const toggles = $$('.pg-toggle[data-pid]');
      const anyOff = toggles.some((t) => t.getAttribute('aria-checked') !== 'true');
      toggles.forEach((t) => t.setAttribute('aria-checked', String(anyOff)));
      allBtn.textContent = anyOff ? 'إطفاء الكل' : 'تشغيل الكل';
    });

    // طي الأعمدة
    $$('.pg-col__toggle').forEach((t) => t.addEventListener('click', () => {
      const col = t.closest('.pg-col');
      if (col) col.dataset.collapsed = String(col.dataset.collapsed !== 'true');
    }));

    // أكورديون البطاقات
    $$('.pg-card').forEach((c) => {
      const h = c.querySelector('.pg-card__header');
      if (h) h.addEventListener('click', () => { c.dataset.expanded = String(c.dataset.expanded !== 'true'); });
    });

    // سرعة + تخطي
    $$('[data-speed]').forEach((b) => b.addEventListener('click', () => {
      _speed = parseFloat(b.dataset.speed);
      $$('[data-speed]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    }));
    const skip = $('#pg-skip'); if (skip) skip.addEventListener('click', () => { root.dataset.skip = '1'; });

    // زر التشغيل
    const runBtn = $('#pg-run');
    let used = 0;
    async function doRun() {
      const ctx = readCtx();
      if (!ctx.text.trim()) { announce('اكتب نصًا أو اختر عيّنة أولًا.'); ta && ta.focus(); return; }
      if (used >= CFG.limits.maxRequests) { showLimit(); return; }
      used++;
      updateRemaining(used);
      runBtn.disabled = true;

      const seed = readSettings().seed;
      const r = analyze(ctx.conversation, ctx, seed);
      const skipAnim = root.dataset.skip === '1'; root.dataset.skip = '0';
      if (skipAnim) REDUCED_BYPASS(r, ctx); else await runPipeline(r, ctx);
      runBtn.disabled = false;
    }
    if (runBtn) runBtn.addEventListener('click', doRun);

    // إعادة التشغيل (Replay)
    const replay = $('#pg-replay');
    if (replay) replay.addEventListener('click', () => { if (lastResult) { lastResult.ctx.conversation = readCtx().conversation; doRunFrom(lastResult); } else announce('شغّل تحليلًا أولًا.'); });
    function doRunFrom(saved) {
      const ctx = saved.ctx;
      const seed = readSettings().seed;
      const r = analyze(ctx.conversation, ctx, seed);
      const skipAnim = root.dataset.skip === '1'; root.dataset.skip = '0';
      if (skipAnim) REDUCED_BYPASS(r, ctx); else runPipeline(r, ctx);
    }

    // فتح Trace / الدليل عبر الدرج
    const openTrace = $('#pg-open-trace');
    if (openTrace) openTrace.addEventListener('click', () => {
      if (!lastResult) { announce('شغّل تحليلًا أولًا.'); return; }
      const id = lastResult.r.trace;
      const drawer = $('#k-trace-drawer');
      if (!drawer) { window.open('/kernel/audit/', '_blank'); return; }
      const idEl = drawer.querySelector('[data-kernel-trace-id]');
      if (idEl) idEl.textContent = id;
      drawer.setAttribute('aria-hidden', 'false');
    });

    // أزرار ديناميكية داخل بطاقات المراحل (delegated)
    document.addEventListener('click', (e) => {
      const openJourney = e.target.closest('[data-open-journey]');
      if (openJourney) { window.open('/kernel/audit/', '_blank'); return; }
      const openEvidence = e.target.closest('[data-open-evidence]');
      if (openEvidence) { window.open('/kernel/evidence/', '_blank'); return; }
      const evdOpen = e.target.closest('[data-evd-open]');
      if (evdOpen) { window.open('/kernel/evidence/', '_blank'); return; }
      const evdDownload = e.target.closest('[data-evd-download]');
      if (evdDownload) { downloadEvd(); return; }
      const evdPreview = e.target.closest('[data-evd-preview]');
      if (evdPreview) { previewEvd(); }
    });

    // تحميل الدليل (Blob تجريبي) — يُستدعى من زر العمود ومن بطاقة المرحلة 9.
    function downloadEvd() {
      const data = lastResult ? {
        trace: lastResult.r.trace,
        verdict: lastResult.r.verdict,
        modelInput: lastResult.r.modelInput,
        note: 'ملف دليل تجريبي (Demo)',
      } : { trace: 'demo', note: 'ملف دليل تجريبي (Demo)' };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'brightai-evd-demo.json'; a.click();
      URL.revokeObjectURL(url);
      announce('نُزّل ملف الدليل التجريبي (Demo).');
    }
    function previewEvd() {
      if (!lastResult) { announce('شغّل تحليلًا أولًا.'); return; }
      demoNote('معاينة الدليل (تجريبي — Demo): ' + lastResult.r.trace);
    }

    // Demo actions
    const addDataset = $('#pg-add-dataset');
    if (addDataset) addDataset.addEventListener('click', () => {
      if (!lastResult) { announce('شغّل تحليلًا أولًا.'); return; }
      demoNote('أُضيفت الحالة لمجموعة البيانات (تجريبي — Demo).');
    });
    const addScenario = $('#pg-add-scenario');
    if (addScenario) addScenario.addEventListener('click', () => {
      if (!lastResult) { announce('شغّل تحليلًا أولًا.'); return; }
      demoNote('حُوّلت الحالة لسيناريو (تجريبي — Demo).');
    });

    function demoNote(msg) {
      const v = $('#pg-verdict');
      if (v) { v.insertAdjacentHTML('beforeend', `<p class="pg-demo-note">${msg}</p>`); announce(msg); }
    }

    // الاختصارات
    document.addEventListener('keydown', (e) => {
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key === 'Enter') { e.preventDefault(); runBtn && runBtn.click(); }
      if (meta && e.key.toLowerCase() === 'k') { /* شِل يتعامل مع ⌘K */ }
      const stageNum = /^[1-9]$/.test(e.key) ? parseInt(e.key, 10) : e.key === '0' ? 10 : null;
      if (!meta && stageNum && document.activeElement === document.body) {
        const c = $(`.pg-card[data-stage="${stageNum}"]`); if (c) { c.dataset.expanded = 'true'; c.scrollIntoView({ block: 'nearest' }); }
      }
      // اختصارات R/D لا تشتغل أثناء الكتابة في الحقول
      const typing = document.activeElement && /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName);
      if (!meta && !typing && e.key.toLowerCase() === 'r') { resetStages(); const v = $('#pg-verdict'); if (v) v.innerHTML = '<p class="pg-verdict__reason">اكتب نصًا واضغط شغّل.</p>'; const s = $('#pg-scorecard'); if (s) s.innerHTML = ''; }
      if (!meta && !typing && e.key.toLowerCase() === 'd') { toggleDiff(root); }
      if (e.key === 'Escape') { closeSettings(); }
    });

    // mini timeline
    const mini = $('#pg-mini-timeline');
    if (mini) mini.addEventListener('click', (e) => {
      const btn = e.target.closest('.pg-mini');
      if (!btn) return;
      const n = parseInt(btn.dataset.mini, 10);
      $$('.pg-card').forEach((c) => { c.dataset.expanded = String(c.dataset.stage === String(n)); });
      announce(`الانتقال للمرحلة ${n}.`);
    });

    // نافذة الإعدادات
    const settingsBtn = $('#pg-settings');
    const settingsPanel = $('#pg-settings-panel');
    const settingsBackdrop = $('#pg-settings-backdrop');
    const settingsClose = $('#pg-settings-close');
    const openSettings = () => {
      if (!settingsPanel || !settingsBackdrop) return;
      const s = readSettings();
      const seedEl = $('#pg-seed'); if (seedEl) seedEl.value = s.seed;
      const tempEl = $('#pg-temp'); const tempOut = $('#pg-temp-out');
      if (tempEl) { tempEl.value = String(s.temperature); if (tempOut) tempOut.textContent = s.temperature; }
      const topEl = $('#pg-topp'); const topOut = $('#pg-topp-out');
      if (topEl) { topEl.value = String(s.topP); if (topOut) topOut.textContent = s.topP; }
      settingsPanel.hidden = false;
      settingsBackdrop.hidden = false;
    };
    const closeSettings = () => {
      if (!settingsPanel || !settingsBackdrop) return;
      const seedEl = $('#pg-seed');
      if (seedEl && seedEl.value) root.dataset.seed = seedEl.value;
      settingsPanel.hidden = true;
      settingsBackdrop.hidden = true;
    };
    if (settingsBtn) settingsBtn.addEventListener('click', openSettings);
    if (settingsClose) settingsClose.addEventListener('click', closeSettings);
    if (settingsBackdrop) settingsBackdrop.addEventListener('click', closeSettings);

    function readSettings() {
      return {
        seed: ($('#pg-seed') || {}).value || root.dataset.seed || 'brightai-demo',
        temperature: parseFloat(($('#pg-temp') || {}).value || '0.2'),
        topP: parseFloat(($('#pg-topp') || {}).value || '0.9'),
      };
    }

    // تبويبات النتيجة
    const tabWith = $('#pg-tab-with'), tabWithout = $('#pg-tab-without');
    const paneWith = $('#pg-pane-with'), paneWithout = $('#pg-pane-without');
    const showTab = (which) => {
      const onWith = which === 'with';
      tabWith && tabWith.setAttribute('aria-selected', String(onWith));
      tabWithout && tabWithout.setAttribute('aria-selected', String(!onWith));
      paneWith && (paneWith.hidden = !onWith);
      paneWithout && (paneWithout.hidden = onWith);
    };
    tabWith && tabWith.addEventListener('click', () => showTab('with'));
    tabWithout && tabWithout.addEventListener('click', () => showTab('without'));

    // شارة المزوّد غير المتاح (الوضع الاحتياطي المحلي)
    function updateLocalBadge() {
      const badge = $('#pg-local-badge');
      if (!badge) return;
      const modelId = ($('[data-context="model"]') || {}).value || 'jais';
      const model = (CFG.models || []).find((m) => m.id === modelId);
      const unavailable = !model || model.available === false;
      badge.hidden = !unavailable;
    }
    // حدّث الشارة عند تغيير النموذج مباشرة
    const modelSel = $('[data-context="model"]');
    if (modelSel) modelSel.addEventListener('change', updateLocalBadge);
    updateLocalBadge();

    // وضع الفرق
    const diffBtn = $('#pg-diff-toggle');
    if (diffBtn) diffBtn.addEventListener('click', () => toggleDiff(root));

    // كتاب الوصفات
    const fab = $('#pg-recipe-fab'), panel = $('#pg-recipe-panel');
    if (fab && panel) {
      fab.addEventListener('click', () => { panel.hidden = !panel.hidden; });
      panel.innerHTML = '<button class="pg-policies__all" style="width:100%;margin-bottom:var(--space-2)" id="pg-recipe-close">إغلاق</button>' +
        '<div class="pg-recipe-grid">' + CFG.recipes.map((rc) => `<button class="pg-recipe-card" data-recipe="${rc.id}"><div class="pg-recipe-card__title">${rc.title}</div><div class="pg-recipe-card__meta">${rc.sector} · متوقع: ${rc.result}</div></button>`).join('') + '</div>';
      panel.addEventListener('click', (ev) => {
        if (ev.target.id === 'pg-recipe-close') { panel.hidden = true; return; }
        const card = ev.target.closest('[data-recipe]'); if (!card) return;
        const rc = CFG.recipes.find((x) => x.id === card.dataset.recipe); if (!rc) return;
        const s = CFG.samples.find((x) => x.label && rc.title.includes(x.label));
        if (s && ta) { ta.value = s.prompt; updateCounter(); }
        panel.hidden = true;
      });
    }

    // التعليمي (أول تشغيل)
    maybeTour();

    // صدّر الكود: إظهار/إخفاء اللوحة
    const exportHead = $('#pg-export-head');
    const exportPanel = $('#pg-export-panel');
    if (exportHead && exportPanel) exportHead.addEventListener('click', () => { exportPanel.hidden = !exportPanel.hidden; });

    // مشاركة رابط دائم (يشفّر الإعدادات لا النص)
    const share = $('#pg-share');
    if (share) share.addEventListener('click', () => {
      const ctx = readCtx();
      const cfg = { seed: root.dataset.seed || 'brightai-demo', policies: ctx.activePolicies, diff: root.dataset.diff === 'true', model: ctx.model };
      location.hash = encodeURIComponent(JSON.stringify(cfg));
      navigator.clipboard?.writeText(location.href);
      share.textContent = '✓ نُسخ الرابط';
      setTimeout(() => (share.textContent = 'شارك 🔗'), 1500);
    });

    // تحميل الدليل (Blob تجريبي)
    const dl = $('#pg-download-evd');
    if (dl) dl.addEventListener('click', downloadEvd);

    // وضع التضمين
    if (window.self !== window.top) document.body.classList.add('pg-embed');

    // رابط دائم: اقرأ الإعدادات من hash
    applyHash(root);
    window.addEventListener('hashchange', () => applyHash(root));

    // لو في نص محمّل مسبقًا (من الرئيسية ?text=) شغّله تلقائيًا
    const preloaded = new URLSearchParams(location.search).get('text');
    if (preloaded && ta) { ta.value = preloaded; updateCounter(); }
  }

  function REDUCED_BYPASS(r, ctx) {
    for (let s = 1; s <= STAGE_COUNT; s++) { setCardState(s, 'done'); setCardTime(s, r.latencies[s] || 0); }
    fillStage1(stageBody(1), r, ctx);
    fillStage2(stageBody(2), r, ctx, 'original');
    fillStage3(stageBody(3), r);
    fillStage4(stageBody(4), r);
    fillStage5(stageBody(5), r);
    if (r.verdict !== 'block') {
      fillStage6(stageBody(6), r);
      fillStage7(stageBody(7), r);
    } else {
      setCardState(6, 'skipped'); setCardState(7, 'skipped');
      const b6 = stageBody(6); if (b6) b6.innerHTML = '<p>أوقفه Kernel قبل الوصول للنموذج — الحكم: حظر.</p>';
      const b7 = stageBody(7); if (b7) b7.innerHTML = '<p>لا مخرجات للتقييم — الطلب محظور.</p>';
      setDecision(6, 'block'); setDecision(7, 'block');
    }
    if (!r.providerAvailable) { setCardState(6, 'unavailable'); setCardState(7, 'unavailable'); }
    fillStage8(stageBody(8), r);
    fillStage9(stageBody(9), r);
    fillStage10(stageBody(10), r);
    for (let i = 1; i < STAGE_COUNT; i++) setDecision(i, r.verdict === 'block' && i >= 3 ? 'block' : 'pass');
    renderResult(r, ctx);
  }

  function toggleDiff(root) {
    const on = root.dataset.diff === 'true';
    root.dataset.diff = String(!on);
    const grid = $('.pg-grid'); if (grid) grid.dataset.diff = String(!on);
    // اعرض/أخفِ المقارنة فورًا حسب آخر نتيجة (وإلا تظهر مع أول تشغيل بعد التفعيل).
    if (lastResult) renderDiffSummary(lastResult.r, lastResult.ctx);
    announce(on ? 'إيقاف وضع الفرق.' : 'تفعيل وضع الفرق — شغّل وشوف A مقابل B.');
  }

  function showLimit() {
    const v = $('#pg-verdict');
    if (v) v.innerHTML = `<div class="pg-limit-card"><h3 class="pg-verdict__title">وصلت حد الجلسة</h3><p class="pg-verdict__reason">استخدمت ${CFG.limits.maxRequests} طلب في هذي الجلسة التجريبية.</p><a class="pg-run-btn" href="/contact/" style="display:inline-flex;margin-top:var(--space-3)">احجز عرضاً</a></div>`;
  }
  function updateRemaining(used) {
    const rem = $('#pg-remaining'); if (rem) { const left = Math.max(0, CFG.limits.maxRequests - used); rem.textContent = `متبقّي ${left} طلب`; rem.hidden = left <= 0; }
  }

  function maybeTour() {
    const key = 'brightai-pg-tour-done';
    try { if (localStorage.getItem(key)) return; } catch (e) { return; }
    const steps = [
      { t: 'اكتب طلبك هنا، أو اختر عيّنة جاهزة', sel: '#pg-input' },
      { t: 'شوف خط الأنابيب 10 مراحل يشتغل مرحلة مرحلة', sel: '.pg-cards' },
      { t: 'اقرأ الحكم، وبدّل تبويب «بدون Kernel»', sel: '#pg-verdict' },
    ];
    let i = 0;
    const pop = document.createElement('div');
    pop.className = 'pg-tour-pop';
    pop.setAttribute('role', 'dialog');
    document.body.appendChild(pop);
    const render = () => {
      if (i >= steps.length) { pop.remove(); try { localStorage.setItem(key, '1'); } catch (e) {} return; }
      const s = steps[i]; const el = $(s.sel);
      pop.innerHTML = `<p style="margin:0 0 var(--space-2)"><strong>الخطوة ${i + 1} من ${steps.length}</strong></p><p style="margin:0 0 var(--space-3);font-size:var(--text-xs)">${s.t}</p><div style="display:flex;gap:var(--space-2)"><button class="pg-skip-btn" id="pg-tour-skip" type="button">تخطي للجميع</button><button class="pg-run-btn" style="flex:0 0 auto;padding:0 var(--space-3)" id="pg-tour-next" type="button">${i === steps.length - 1 ? 'تم' : 'التالي'}</button></div>`;
      if (el) { const r = el.getBoundingClientRect(); pop.style.insetBlockStart = Math.min(r.top + 40, window.innerHeight - 180) + 'px'; pop.style.insetInlineStart = Math.min(r.left + 40, window.innerWidth - 340) + 'px'; }
      pop.querySelector('#pg-tour-next').addEventListener('click', () => { i++; render(); });
      pop.querySelector('#pg-tour-skip').addEventListener('click', () => { i = steps.length; render(); });
    };
    render();
  }

  function applyHash(root) {
    if (!location.hash || location.hash.length < 2) return;
    try {
      const cfg = JSON.parse(decodeURIComponent(location.hash.slice(1)));
      if (cfg.seed) root.dataset.seed = cfg.seed;
      if (cfg.policies) $$('.pg-toggle[data-pid]').forEach((t) => t.setAttribute('aria-checked', String(cfg.policies.includes(t.dataset.pid))));
      if (cfg.diff) toggleDiff(root);
      if (cfg.model) { const sel = $('[data-context="model"]'); if (sel) sel.value = cfg.model; }
    } catch (e) { /* hash مش إعدادات — تجاهل */ }
  }

  // ── ربط دوري ────────────────────────────────────────────────────────────────
  if (document.readyState !== 'loading') init();
  document.addEventListener('astro:page-load', init);
})();
