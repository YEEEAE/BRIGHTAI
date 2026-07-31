/**
 * kernel-playground.js — محرّك ملعب الحوكمة (vanilla JS، self-contained).
 *
 * منطق حتمي بالكامل: نفس النص + نفس الإعدادات = نفس النتيجة (قابل للاستشهاد به
 * في تدقيق). يشتغل محليًا (وضع احتياطي محلي أصلي) — لا يعتمد على مزوّد خارجي.
 *
 * يُحمّل عبر <script type="module" src="/js/kernel-playground.js">، يربط على
 * astro:page-load مع dataset.bound للـ idempotency (مثل باقي وحدات kernel).
 * يحترم prefers-reduced-motion و document.hidden.
 *
 *契约 DOM: الصفحة توفّر #pg-config (JSON) + العناصر بـ data-attrs التالية:
 *   #pg-input · [data-sample] · [data-context] · [data-policy]/.pg-toggle[data-pid]
 *   .pg-card[data-stage] · .pg-connector[data-idx] · #pg-verdict · #pg-pane-with/without
 *   #pg-timemachine · #pg-speed · #pg-skip · #pg-export · #pg-recipe-fab · #pg-tour
 */
(function () {
  'use strict';

  const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── إعدادات تُحقن من الصفحة ──────────────────────────────────────────────
  let CFG = { policies: [], piiTypes: [], packs: [], recipes: [], samples: [], limits: { maxRequests: 25, maxChars: 2000 } };
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

  // ── ① الكشف عن كيانات PII ─────────────────────────────────────────────────
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
  const INJECTION_RE = /(?:تجاهل|اسئل|تخطّ?ي).*(?:تعليمات|أوامر|السابقة)|ignore\s+(?:all|previous|prior)|disregard.*(instructions|rules)|وضع\s*المطور|developer\s*mode|system\s*prompt|jailbreak/i;
  const EXFIL_RE = /(أرسل|ابعث|صدّ?ر|صدر|ناقل|تحويل\s*إلى|external|outside|خارج(?:ية|ي))/i;
  const CROSSBORDER_RE = /(خارجية|خارج\s*المملكة|سويسرا|external|abroad|overseas)/i;

  function detectEntities(text) {
    const found = [];
    for (const p of PII_PATTERNS) {
      p.re.lastIndex = 0;
      let m;
      while ((m = p.re.exec(text)) !== null) {
        const val = m[0];
        if (p.validate && !p.validate(val)) continue;
        // تجنّب تداخل متداخلة: اقبل الأطول عند التقاطع
        const start = m.index, end = start + val.length;
        if (found.some((e) => start < e.end && end > e.start)) continue;
        found.push({ type: p.type, value: val, start, end, confidence: p.conf });
      }
    }
    found.sort((a, b) => a.start - b.start);
    return found;
  }

  // ── ③ التقييم: 12 عامل ────────────────────────────────────────────────────
  function scoreRisk(entities, ctx, seed) {
    const types = new Set(entities.map((e) => e.type));
    const text = ctx.text;
    const inj = INJECTION_RE.test(text);
    const exfil = EXFIL_RE.test(text);
    const cross = CROSSBORDER_RE.test(text);
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
      { id: 'timing', pts: (seed % 5) + 0 },        // deterministic
      { id: 'history', pts: ((seed >> 3) % 4) + 0 }, // deterministic
    ];
    const total = Math.min(factors.reduce((s, f) => s + f.pts, 0), 100);
    return { total, factors, injection: inj, exfil, cross };
  }

  // ── ④ مطابقة السياسات ─────────────────────────────────────────────────────
  function matchPolicies(entities, risk, activeIds, ctx) {
    const types = new Set(entities.map((e) => e.type));
    return CFG.policies
      .filter((p) => activeIds.has(p.id))
      .filter((p) => {
        if (p.piiType === 'api_secret') return types.has('api_secret') || risk.injection;
        if (p.id === 'pr_iso42001_transparency') return risk.total >= 70;
        if (p.id === 'pr_saudi_id_sfda') return types.has('saudi_id') && ctx.sector === 'صحية';
        return types.has(p.piiType);
      });
  }

  // ── المحرّر الكامل: analyze ────────────────────────────────────────────────
  function analyze(text, ctx, seedStr) {
    const seed = hashStr((seedStr || text) + '|' + ctx.sector + '|' + ctx.role + '|' + ctx.sensitivity);
    const entities = detectEntities(text);
    const risk = scoreRisk(entities, { ...ctx, text }, seed);
    const activeIds = new Set(ctx.activePolicies);
    const matched = matchPolicies(entities, risk, activeIds, ctx);

    const verdict = (() => {
      if (matched.some((p) => p.action === 'block') || risk.injection) return 'block';
      if (matched.some((p) => p.action === 'mask' || p.action === 'redact')) return 'mask';
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

    const trace = 'AI-' + (seed % 100000).toString().padStart(5, '0');
    const response = responseFor(verdict, text);
    const packs = Array.from(new Set(matched.map((p) => p.compliancePack)));
    const evd = {
      id: trace,
      hash: seed.toString(16).padStart(8, '0') + '…',
      size: (1.2 + (seed % 900) / 1000).toFixed(1) + 'KB',
      packs,
    };
    const cost = (8 + (seed % 40) / 10).toFixed(1); // هللة
    const modelMs = 240 + (seed % 800);

    return { trace, entities, risk, matched, verdict, modelInput, response, evd, cost, modelMs, packs };
  }

  function responseFor(verdict, text) {
    if (verdict === 'block') return 'ممنوع تنفيذ الطلب: احتوى على بيانات محظورة أو محاولة حقن أوامر. Kernel أوقفه قبل الوصول للنموذج.';
    if (verdict === 'mask') return 'تمت معالجة الطلب بعد تعمية البيانات الشخصية. الإجابة جاهزة دون كشف الهويات.';
    return 'تم تنفيذ الطلب بأمان. ما كشف أي بيانات شخصية، والنتيجة جاهزة للاستخدام.';
  }

  // ── عرض الكيانات في النص (تظليل ملوّن) ─────────────────────────────────────
  function renderHighlighted(text, entities, mode) {
    // mode: 'original' (تظليل) أو 'masked' (مستبدل). يرجع DocumentFragment آمن.
    const frag = document.createDocumentFragment();
    let cursor = 0;
    for (const e of entities) {
      frag.appendChild(document.createTextNode(text.slice(cursor, e.start)));
      const span = document.createElement('mark');
      span.className = 'pg-entity';
      span.dataset.type = e.type;
      span.title = `${piiLabel(e.type)} · ثقة ${Math.round(e.confidence * 100)}%`;
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

  // ═══════════════════ العرض (UI) ═══════════════════

  const STAGE = {
    1: { title: 'الاستلام', color: 'var(--status-info)' },
    2: { title: 'فحص PII', color: 'var(--status-warning)' },
    3: { title: 'تقييم المخاطر', color: '#f59e0b' },
    4: { title: 'مطابقة السياسات', color: 'var(--brand)' },
    5: { title: 'استدعاء النموذج', color: 'var(--indigo-400, #818cf8)' },
    6: { title: 'توليد الدليل', color: 'var(--status-success)' },
  };

  function stateOf(state) {
    const map = { idle: 'خامدة', running: 'جارية', done: 'منتهية', skipped: 'متجاوَزة' };
    return map[state] || state;
  }

  function setCardState(stage, state) {
    const card = $(`.pg-card[data-stage="${stage}"]`);
    if (!card) return;
    card.dataset.state = state;
    card.style.setProperty('--pg-stage', STAGE[stage].color);
    const live = card.querySelector('[data-live]');
    if (live) live.textContent = `المرحلة ${stage} من 6: ${STAGE[stage].title}، الحالة: ${stateOf(state)}`;
  }

  function setDecision(idx, decision) {
    const conn = $(`.pg-connector[data-idx="${idx}"]`);
    if (!conn) return;
    const line = conn.querySelector('.pg-connector__line');
    const bead = conn.querySelector('.pg-decision');
    if (line) line.dataset.decision = decision;
    if (bead) { bead.dataset.decision = decision; bead.textContent = ({ pass: '✅', mask: '⚠️', block: '⛔', wait: '⏸️' })[decision] || ''; }
  }

  function delay(ms) { return new Promise((r) => setTimeout(r, ms)); }

  // تعبئة محتوى كل مرحلة
  function fillStage1(body, r, ctx) {
    body.innerHTML = `
      <div class="pg-receipt">
        <div><strong>Trace:</strong> <code dir="ltr">${r.trace}</code></div>
        <div><strong>التوكنز:</strong> ${Math.ceil(ctx.text.length / 4)}</div>
        <div><strong>اللغة:</strong> عربية</div>
        <div><strong>الطابع الزمني:</strong> <span dir="ltr">${r.modelMs - 200}ms</span></div>
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

    const box = document.createElement('div');
    box.className = 'pg-pii-text';
    box.dir = /[؀-ۿ]/.test(ctx.text) ? 'rtl' : 'ltr';
    box.appendChild(renderHighlighted(ctx.text, r.entities, mode));
    wrap.appendChild(box);

    // جدول الثقة + بديل نصي للوصولية
    const tbl = document.createElement('table');
    tbl.className = 'pg-pii-table';
    tbl.setAttribute('role', 'table');
    tbl.setAttribute('aria-label', 'الكيانات المكتشفة ودرجات الثقة');
    tbl.innerHTML = `<thead><tr><th>النوع</th><th>القيمة</th><th>الثقة</th></tr></thead>`;
    const tb = document.createElement('tbody');
    r.entities.forEach((e) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${piiLabel(e.type)}</td><td dir="ltr">${e.value}</td><td>${Math.round(e.confidence * 100)}%</td>`;
      tb.appendChild(tr);
    });
    if (!r.entities.length) tb.innerHTML = '<tr><td colspan="3">ما كشف بيانات شخصية.</td></tr>';
    tbl.appendChild(tb);
    wrap.appendChild(tbl);

    const alt = document.createElement('p');
    alt.className = 'pg-sr-only';
    alt.textContent = 'قائمة الكيانات: ' + (r.entities.map((e) => `${piiLabel(e.type)} (${Math.round(e.confidence * 100)}%)`).join('، ') || 'لا يوجد');
    wrap.appendChild(alt);

    body.innerHTML = '';
    body.appendChild(wrap);
  }
  function fillStage3(body, r) {
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
      </div>`;
    // count-up
    const num = body.querySelector('.pg-risk-arc__num');
    if (num && !REDUCED) animateCount(num, 0, pct, 600);
    else if (num) num.textContent = String(pct);
  }
  function fillStage4(body, r) {
    if (!r.matched.length) { body.innerHTML = '<p>ما اشتعلت أي سياسة. الطلب متوافق.</p>'; return; }
    body.innerHTML = r.matched.map((p) => {
      const pack = (CFG.packs.find((x) => x.id === p.compliancePack) || {}).label || p.compliancePack;
      const act = ({ mask: 'تعمية', block: 'حظر', redact: 'حذف', log: 'تسجيل', hitl: 'مراجعة بشرية' })[p.action] || p.action;
      return `<div class="pg-pmatch__item"><strong>${p.name}</strong> <span class="pg-pack-chip">${pack}</span><code class="pg-pmatch__cond">${p.condition}</code><div>الإجراء: ${act} · <a class="pg-pmatch__link" href="/kernel/policies/">↗ السياسة</a></div></div>`;
    }).join('');
  }
  function fillStage5(body, r) {
    body.innerHTML = `
      <div class="pg-model-meta"><span>النموذج: ${r.packs.length ? 'مُعمّى' : 'مباشر'}</span><span>الزمن: ${r.modelMs}ms</span><span>التكلفة: ${r.cost} هللة</span></div>
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
  function fillStage6(body, r) {
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
    const state = ({ block: 'var(--status-danger)', mask: 'var(--status-warning)', allow: 'var(--status-success)' })[r.verdict];
    const title = ({ block: 'حُظر قبل الوصول للنموذج', mask: 'سُمح بعد التعمية', allow: 'سُمح بأمان' })[r.verdict];
    const icon = ({ block: '⛔', mask: '⚠️', allow: '✅' })[r.verdict];
    const reason = r.verdict === 'block'
      ? (r.risk.injection ? 'احتوى على إشارات حقن أوامر أو استخراج أسرار.' : 'احتوى على بيانات تحظرها سياسة فعّالة (مثل آيبان أو سجل طبي).')
      : r.verdict === 'mask'
        ? `عُمّيت ${r.entities.length} كيان قبل الإرسال للنموذج.`
        : 'ما كشف أي بيانات شخصية ولا انتهك أي سياسة.';
    v.style.setProperty('--pg-state', state);
    v.innerHTML = `<div class="pg-verdict__icon" aria-hidden="true">${icon}</div><h3 class="pg-verdict__title">${title}</h3><p class="pg-verdict__reason">${reason}</p>`;

    // تبويب "بدون Kernel" — النص الأصلي كما كان سيغادر
    const without = $('#pg-pane-without');
    if (without) without.innerHTML = `<div class="pg-danger-strip">⚠ هذي البيانات كانت ستغادر منشأتك بلا تعمية</div><div>${escapeHtml(ctx.text)}</div>`;
    const withPane = $('#pg-pane-with');
    if (withPane) { withPane.textContent = ''; withPane.appendChild(renderHighlighted(ctx.text, r.entities, 'masked')); }

    // خريطة الامتثال
    const map = $('#pg-compliance-map');
    if (map) {
      const packs = r.packs.length ? r.packs : (r.verdict === 'allow' ? ['iso27001'] : []);
      map.innerHTML = packs.map((pid) => {
        const p = CFG.packs.find((x) => x.id === pid) || { label: pid, matter: '' };
        return `<span class="pg-pack-chip">${p.label} · ${p.matter || ''}</span>`;
      }).join('') || '<span class="pg-factor__name">ما في مواد متأثرة.</span>';
    }

    // الأثر
    const impact = $('#pg-impact');
    if (impact) {
      const protected_ = r.entities.length;
      impact.innerHTML = `
        <div class="pg-impact__cell"><div class="pg-impact__num">${protected_}</div><div class="pg-impact__label">سجلات محمية</div></div>
        <div class="pg-impact__cell"><div class="pg-impact__num">${r.cost}</div><div class="pg-impact__label">هللة</div></div>
        <div class="pg-impact__cell"><div class="pg-impact__num">${r.modelMs}</div><div class="pg-impact__label">مللي ثانية</div></div>`;
    }

    // صدّر الكود
    buildExport(r, ctx);
  }

  // ── صدّر الكود (cURL / Python / TS) ────────────────────────────────────────
  function buildExport(r, ctx) {
    const panel = $('#pg-export-panel');
    if (!panel) return;
    const payload = JSON.stringify({ prompt: r.modelInput, policies: r.packs, trace: r.trace });
    const curl = `curl -X POST https://api.brightai.site/v1/govern \\n  -H "Content-Type: application/json" \\n  -d '${payload}'`;
    const py = `import requests\n\nr = requests.post(\n    "https://api.brightai.site/v1/govern",\n    json=${payload.replace(/'/g, '"')},\n)\nprint(r.json())`;
    const ts = `const res = await fetch("https://api.brightai.site/v1/govern", {\n  method: "POST",\n  headers: { "Content-Type": "application/json" },\n  body: JSON.stringify(${payload.replace(/'/g, '"')}),\n});\nconst data = await res.json();`;
    const codes = { curl, py, ts };
    const pre = panel.querySelector('.pg-export__pre');
    const setActive = (lang) => { pre.textContent = codes[lang]; panel.querySelectorAll('.pg-export__langs button').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.lang === lang))); };
    panel.querySelectorAll('.pg-export__langs button').forEach((b) => b.addEventListener('click', () => setActive(b.dataset.lang)));
    setActive('curl');
    const copy = panel.querySelector('.pg-export__copy');
    if (copy) copy.addEventListener('click', () => { navigator.clipboard?.writeText(pre.textContent || ''); copy.textContent = '✓ نُسخ'; setTimeout(() => (copy.textContent = 'نسخ'), 1500); });
  }

  // ── تشغيل خط الأنابيب بالكامل ───────────────────────────────────────────────
  async function runPipeline(r, ctx) {
    const speed = currentSpeed();
    const step = REDUCED ? 0 : (speed === 0.5 ? 700 : 350);

    resetStages();
    setCardState(1, 'running');
    await delay(step);
    fillStage1(stageBody(1), r, ctx);
    setCardState(1, 'done');
    setDecision(1, r.entities.length ? 'mask' : 'pass');

    setCardState(2, 'running');
    await delay(step);
    fillStage2(stageBody(2), r, ctx, 'original');
    setCardState(2, 'done');
    setDecision(2, r.entities.length ? 'mask' : 'pass');

    setCardState(3, 'running');
    await delay(step);
    fillStage3(stageBody(3), r);
    setCardState(3, 'done');
    setDecision(3, r.risk.total >= 70 ? 'block' : 'pass');

    if (r.verdict === 'block') {
      // أوقف قبل النموذج
      setCardState(4, 'running'); await delay(step); fillStage4(stageBody(4), r); setCardState(4, 'done');
      setDecision(4, 'block');
      [5, 6].forEach((s) => setCardState(s, 'skipped'));
      setDecision(5, 'block');
    } else {
      setCardState(4, 'running'); await delay(step); fillStage4(stageBody(4), r); setCardState(4, 'done');
      setDecision(4, r.matched.length ? 'mask' : 'pass');
      setCardState(5, 'running'); await delay(step); fillStage5(stageBody(5), r); setCardState(5, 'done');
      setDecision(5, 'pass');
      setCardState(6, 'running'); await delay(step); fillStage6(stageBody(6), r); setCardState(6, 'done');
    }
    renderResult(r, ctx);
    announce(`اكتمل التحليل. الحكم: ${r.verdict === 'block' ? 'حُظر' : r.verdict === 'mask' ? 'عُمّي ثم سُمح' : 'سُمح'}.`);
  }
  function stageBody(n) { const c = $(`.pg-card[data-stage="${n}"]`); return c ? c.querySelector('.pg-card__body') : null; }
  function resetStages() { [1, 2, 3, 4, 5, 6].forEach((s) => { setCardState(s, 'idle'); const b = stageBody(s); if (b) b.innerHTML = ''; }); [1, 2, 3, 4, 5].forEach((i) => setDecision(i, 'wait')); }

  function announce(msg) {
    let live = $('#pg-live');
    if (!live) { live = document.createElement('div'); live.id = 'pg-live'; live.setAttribute('role', 'status'); live.setAttribute('aria-live', 'polite'); live.className = 'pg-sr-only'; document.body.appendChild(live); }
    live.textContent = msg;
  }

  let _speed = 1;
  function currentSpeed() { return _speed; }

  // ── قراءة حالة الإدخال ─────────────────────────────────────────────────────
  function readCtx() {
    const text = ($('#pg-input') || {}).value || '';
    const sector = ($('[data-context="sector"]') || {}).value || 'عام';
    const role = ($('[data-context="role"]') || {}).value || 'موظف';
    const sensitivity = ($('[data-context="sensitivity"]') || {}).value || 'متوسطة';
    const deployment = ($('[data-context="deployment"]') || {}).value || 'سحابي';
    const activePolicies = $$('.pg-toggle[data-pid]').filter((t) => t.getAttribute('aria-checked') === 'true').map((t) => t.dataset.pid);
    return { text, sector, role, sensitivity, deployment, activePolicies };
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
    };
    if (ta) ta.addEventListener('input', updateCounter);
    updateCounter();

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
    if (runBtn) runBtn.addEventListener('click', async () => {
      const ctx = readCtx();
      if (!ctx.text.trim()) { announce('اكتب نصًا أو اختر عيّنة أولًا.'); ta && ta.focus(); return; }
      if (used >= CFG.limits.maxRequests) { showLimit(); return; }
      used++;
      updateRemaining(used);
      runBtn.disabled = true;

      // إعداد الحزم/الأوزان للعرض
      const r = analyze(ctx.text, ctx, root.dataset.seed || 'brightai-demo');
      // وضع احتياطي محلي: محرك لغوي "غير متاح" لو deployment=محلي ومافي اتصال — هنا دائمًا محلي ناجح.
      const skipAnim = root.dataset.skip === '1'; root.dataset.skip = '0';
      if (skipAnim) REDUCED_BYPASS(r, ctx) ; else await runPipeline(r, ctx);
      runBtn.disabled = false;
    });

    // الاختصارات
    document.addEventListener('keydown', (e) => {
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key === 'Enter') { e.preventDefault(); runBtn && runBtn.click(); }
      if (meta && e.key.toLowerCase() === 'k') { /* شِل يتعامل مع ⌘K */ }
      if (!meta && /^[1-6]$/.test(e.key) && document.activeElement === document.body) {
        const c = $(`.pg-card[data-stage="${e.key}"]`); if (c) { c.dataset.expanded = 'true'; c.scrollIntoView({ block: 'nearest' }); }
      }
      if (!meta && e.key.toLowerCase() === 'r') { resetStages(); const v = $('#pg-verdict'); if (v) v.innerHTML = '<p class="pg-verdict__reason">اكتب نصًا واضغط شغّل.</p>'; }
      if (!meta && e.key.toLowerCase() === 'd') { toggleDiff(root); }
    });

    // آلة الزمن
    const tm = $('#pg-timemachine');
    if (tm) tm.addEventListener('input', () => {
      const n = parseInt(tm.value, 10);
      $$('.pg-card').forEach((c) => { c.dataset.expanded = String(c.dataset.stage === String(n)); });
      announce(`الانتقال للمرحلة ${n}.`);
    });

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
      const cfg = { seed: root.dataset.seed || 'brightai-demo', policies: ctx.activePolicies, diff: root.dataset.diff === 'true' };
      location.hash = encodeURIComponent(JSON.stringify(cfg));
      navigator.clipboard?.writeText(location.href);
      share.textContent = '✓ نُسخ الرابط';
      setTimeout(() => (share.textContent = 'شارك 🔗'), 1500);
    });

    // تحميل الدليل (Blob تجريبي)
    const dl = $('#pg-download-evd');
    if (dl) dl.addEventListener('click', () => {
      const blob = new Blob([JSON.stringify({ trace: 'demo', note: 'ملف دليل تجريبي' }, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'brightai-evd-demo.json'; a.click();
      URL.revokeObjectURL(url);
    });

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
    [1, 2, 3, 4, 5, 6].forEach((s) => { setCardState(s, 'done'); });
    fillStage1(stageBody(1), r, ctx);
    fillStage2(stageBody(2), r, ctx, 'original');
    fillStage3(stageBody(3), r);
    fillStage4(stageBody(4), r);
    if (r.verdict !== 'block') { fillStage5(stageBody(5), r); fillStage6(stageBody(6), r); }
    else { [5, 6].forEach((s) => setCardState(s, 'skipped')); }
    [1, 2, 3, 4, 5].forEach((i) => setDecision(i, r.verdict === 'block' && i >= 3 ? 'block' : 'pass'));
    renderResult(r, ctx);
  }

  function toggleDiff(root) {
    const on = root.dataset.diff === 'true';
    root.dataset.diff = String(!on);
    const grid = $('.pg-grid'); if (grid) grid.dataset.diff = String(!on);
    announce(on ? 'إيقاف وضع الفرق.' : 'تفعيل وضع الفرق — اضبط سياسات اللوحتين ثم شغّل.');
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
      { t: 'شوف خط الأنابيب يشتغل مرحلة مرحلة', sel: '.pg-cards' },
      { t: 'اقرأ الحكم، وبدّل تبويب «بدون Kernel»', sel: '#pg-verdict' },
    ];
    let i = 0;
    const pop = document.createElement('div');
    pop.className = 'pg-tour-pop';
    pop.setAttribute('role', 'dialog');
    pop.hidden = false;
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
    } catch (e) { /* hash مش إعدادات — تجاهل */ }
  }

  // ── ربط دوري ────────────────────────────────────────────────────────────────
  if (document.readyState !== 'loading') init();
  document.addEventListener('astro:page-load', init);
})();
