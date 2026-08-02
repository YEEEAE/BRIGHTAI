/**
 * kernel-drawer.js — درج الرحلة (Trace Drawer).
 *
 * تحديث 2026-08-02 (M28 — المرحلة 1: ربط الدرج بمصدر الحقيقة):
 *  - الدرج يقرأ الـ trace من KernelEvalStore ويعبّئ محتواه ديناميكيًا:
 *    الملخص (مستخدم/قسم/نموذج/زمن) + شارة الحكم + المراحل (من trace.stages
 *    أو مراحل افتراضية من حقول الـ trace) + سلسلة الهاش (من run hashes).
 *  - واجهة عامة window.KernelTraceDrawer = { open, close, isOpen } —
 *    كل صفحات /kernel/* تفتح الدرج من خلالها (توحيد الفتح، لا فتح يدوي).
 *  - يدعم seed اختياري { user, dept, model, time, verdict, hashes } من
 *    المتصل (مثلاً audit) يُعرض عندما الـ trace مو مخزّن في الـ Store بعد.
 *
 * السلوك المحفوظ:
 *  - يفتح بأي عنصر [data-trace-id] (نقرة)، أو بتقديم بحث Trace ID في الشريط العلوي.
 *  - الظهور يُدار عبر aria-hidden على #k-trace-drawer؛ focus-trap.js (عام)
 *    يربط تلقائيًا role=dialog+aria-modal ويتكفّل بـ Tab/Escape وإرجاع التركيز.
 *  - متوافق مع astro:page-load (view transitions) — إعادة ربط في كل تنقّل.
 *
 * CSP: ES module خارجي (مستورد بـ side-effect من KernelLayout)، لا unsafe-inline.
 * بيانات تجريبية — لا تخزين.
 */
(function () {
  'use strict';
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  var SCROLL_LOCK_COUNT = 0;

  function lockScroll() {
    SCROLL_LOCK_COUNT += 1;
    if (SCROLL_LOCK_COUNT === 1) document.body.style.overflow = 'hidden';
  }
  function unlockScroll() {
    SCROLL_LOCK_COUNT = Math.max(0, SCROLL_LOCK_COUNT - 1);
    if (SCROLL_LOCK_COUNT === 0) document.body.style.overflow = '';
  }

  function getDrawer() {
    return document.getElementById('k-trace-drawer');
  }

  /* ── مصادر البيانات ─────────────────────────────────────────────── */
  function getStore() {
    return window.KernelEvalStore || null;
  }

  /** يبحث عن الـ run اللي يحتوي الـ trace المطلوب (مصدر الحقيقة). */
  function findRunTrace(store, traceId) {
    if (!store || !traceId) return null;
    var runs = store.listRuns();
    for (var i = 0; i < runs.length; i += 1) {
      var tr = runs[i].traces || [];
      for (var j = 0; j < tr.length; j += 1) {
        if (tr[j].id === traceId) return { run: runs[i], trace: tr[j] };
      }
    }
    return null;
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function shortHash(h) {
    if (!h) return '—';
    var s = String(h);
    if (s.length <= 10) return s;
    return s.slice(0, 6) + '…' + s.slice(-4);
  }

  /* ── الأيقونات (مطابقة أنماط kernel.css) ─────────────────────────── */
  var STAGE_ICONS = [
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3"/></svg>',
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>',
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>',
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15V17M6 21H18C19.1046 21 20 20.1046 20 19V13C20 11.8954 19.1046 11 18 11H6C4.89543 11 4 11.8954 4 13V19C4 20.1046 4.89543 21 6 21ZM16 11V7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7V11H16Z"/></svg>',
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/><path d="M9 12l2 2 4-4"/></svg>',
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>',
  ];

  function verdictInfo(v) {
    if (v === 'allowed' || v === 'allow' || v === 'pass' || v === 'passed') {
      return { cls: 'k-verdict--allow', icon: '✓', label: 'مسموح' };
    }
    if (v === 'breached') {
      return { cls: 'k-verdict--block', icon: '⚠', label: 'اختراق — حرج' };
    }
    if (v === 'partial' || v === 'review' || v === 'pending' || v === 'approval_required') {
      return { cls: 'k-verdict--wait', icon: '⏱', label: 'مراجعة' };
    }
    if (v === 'blocked' || v === 'fail' || v === 'block' || v === 'breach') {
      return { cls: 'k-verdict--block', icon: '⊘', label: 'محظور' };
    }
    return { cls: 'k-verdict--block', icon: '⊘', label: 'محظور' };
  }

  /* ── بناء المراحل ────────────────────────────────────────────────── */
  function buildStages(trace) {
    if (trace && Array.isArray(trace.stages) && trace.stages.length) {
      return trace.stages.map(function (s) {
        var resCls = 'k-timeline__result--ok';
        var resText = 'مرّ';
        var nodeMod = '';
        if (s.status === 'skipped' || s.status === 'skip') {
          resCls = 'k-timeline__result--skip'; resText = 'تجاوز'; nodeMod = '--skip';
        } else if (s.status === 'blocked' || s.status === 'block' || s.status === 'fail') {
          resCls = 'k-timeline__result--block'; resText = 'حُظر'; nodeMod = '--block';
        } else if (s.status === 'critical') {
          resCls = 'k-timeline__result--critical'; resText = 'حرج'; nodeMod = '--critical';
        } else if (s.status === 'mask' || s.status === 'masked' || s.status === 'warn') {
          resCls = 'k-timeline__result--mask'; resText = 'عُمّي'; nodeMod = '--mask';
        }
        return {
          name: s.label || 'مرحلة',
          time: s.durationMs != null ? s.durationMs + 'ms' : '—',
          resultClass: resCls,
          resultText: resText,
          nodeClass: nodeMod,
          detail: s.detail || '',
          skipped: resCls === 'k-timeline__result--skip',
        };
      });
    }
    // بناء افتراضي من حقول الـ trace (مثلاً redteam/scenarios بلا stages).
    var blocked = trace.verdict === 'blocked' || trace.verdict === 'breached' || trace.verdict === 'fail';
    var hasPii = !!(trace.pii && (trace.pii.length || Number(trace.pii) > 0));
    var risk = Number(trace.riskScore || 0);
    var items = [];
    items.push({
      name: 'الاستلام', time: '—', resultClass: 'k-timeline__result--ok', resultText: 'مرّ',
      nodeClass: '', detail: trace.input ? escapeHtml(trace.input.slice(0, 80)) + '…' : 'طلب وارد.',
      skipped: false,
    });
    items.push({
      name: 'فحص PII', time: '—',
      resultClass: hasPii ? 'k-timeline__result--mask' : 'k-timeline__result--ok',
      resultText: hasPii ? 'عُمّي' : 'سليم', nodeClass: hasPii ? '--mask' : '',
      detail: hasPii ? 'اكتُشفت بيانات حساسة وتم تعميتها قبل الإرسال.' : 'لا PII مكتشفة.',
      skipped: false,
    });
    items.push({
      name: 'كشف حقن', time: '—',
      resultClass: trace.injection ? 'k-timeline__result--block' : 'k-timeline__result--ok',
      resultText: trace.injection ? 'مشبوه' : 'سليم', nodeClass: trace.injection ? '--block' : '',
      detail: trace.injection ? 'رُصدت محاولة حقن أوامر.' : 'لا مؤشرات حقن.',
      skipped: false,
    });
    items.push({
      name: 'تقييم المخاطر', time: '—',
      resultClass: risk >= 70 ? 'k-timeline__result--critical' : (risk >= 40 ? 'k-timeline__result--mask' : 'k-timeline__result--ok'),
      resultText: risk >= 70 ? ('حرج · ' + risk) : ('مخاطر · ' + risk),
      nodeClass: risk >= 70 ? '--critical' : '',
      detail: 'درجة المخاطر: ' + risk + '/100.', skipped: false,
    });
    items.push({
      name: 'مطابقة السياسات', time: '—',
      resultClass: blocked ? 'k-timeline__result--block' : 'k-timeline__result--ok',
      resultText: blocked ? 'حُظر' : 'مرّ', nodeClass: blocked ? '--block' : '',
      detail: trace.policyLabel || 'لا سياسات مشتعلة.', skipped: false,
    });
    items.push({
      name: 'استدعاء النموذج', time: '—',
      resultClass: blocked ? 'k-timeline__result--skip' : 'k-timeline__result--ok',
      resultText: blocked ? 'لن يُستدعى' : 'اكتمل', nodeClass: blocked ? '--skip' : '',
      detail: blocked ? 'حُظر قبل الوصول للنموذج.' : (trace.output || 'اكتمل الاستدعاء.'),
      skipped: blocked,
    });
    return items;
  }

  function renderTimeline(drawer, stages) {
    var ol = drawer.querySelector('[data-kernel-timeline]');
    if (!ol) return;
    var html = stages.map(function (s, i) {
      var itemCls = s.skipped ? 'k-timeline__item k-timeline__item--skipped' : 'k-timeline__item k-timeline__item--done';
      var nodeCls = 'k-timeline__node' + (s.nodeClass || '');
      var icon = STAGE_ICONS[i % STAGE_ICONS.length];
      return '<li class="' + itemCls + '">' +
        '<span class="' + nodeCls + '" aria-hidden="true"></span>' +
        '<details class="k-timeline__card"' + (i === 0 ? ' open' : '') + '>' +
        '<summary class="k-timeline__head">' +
        '<span class="k-timeline__icon" aria-hidden="true">' + icon + '</span>' +
        '<span class="k-timeline__name">' + (i + 1) + '. ' + escapeHtml(s.name) + '</span>' +
        '<span class="k-timeline__time" dir="ltr">' + escapeHtml(s.time) + '</span>' +
        '<span class="k-timeline__result ' + s.resultClass + '">' + escapeHtml(s.resultText) + '</span>' +
        '</summary>' +
        '<p class="k-timeline__detail">' + escapeHtml(s.detail) + '</p>' +
        '</details></li>';
    }).join('');
    ol.innerHTML = html;
  }

  /* ── التعبئة من Store (مصدر الحقيقة) ─────────────────────────────── */
  function fillFromStore(drawer, traceId) {
    var store = getStore();
    if (!store || !traceId) return false;
    var found = findRunTrace(store, traceId);
    if (!found) return false;
    var run = found.run;
    var trace = found.trace;
    var model = (run.setup && run.setup.model && (run.setup.model.name || run.setup.model.id)) || '—';
    var totalMs = (run.timing && run.timing.totalMs != null) ? run.timing.totalMs : trace.latencyMs;

    setText(drawer, '[data-kernel-drawer-user]', trace.title || trace.attackId || 'مستخدم النظام');
    setText(drawer, '[data-kernel-drawer-dept]', trace.sector || (run.summary && run.summary.sector) || '—');
    setText(drawer, '[data-kernel-drawer-model]', model);
    setText(drawer, '[data-kernel-drawer-time]', totalMs != null ? totalMs + 'ms' : '—');

    applyVerdict(drawer, verdictInfo(trace.verdict || run.status));
    renderTimeline(drawer, buildStages(trace));

    setText(drawer, '[data-kernel-hash-prev]', shortHash(run.inputHash));
    setText(drawer, '[data-kernel-hash-curr]', shortHash(run.runHash));
    setText(drawer, '[data-kernel-hash-next]', shortHash(run.outputHash));
    drawer.dataset.currentHash = run.runHash || '';

    // M28 — replay→parent: إن كان هذا الـ run إعادة تشغيل (له parentRunId)،
    // نُظهر سطر النسب مع زر يفتح الأصل في نفس الدرج.
    showLineage(drawer, run);

    // حقول الحالة/الإجراء من الـ trace (إن وُجدت) — تظهر في قسم التفاصيل.
    var hasDetail = false;
    if (trace.status) { setText(drawer, '[data-kernel-drawer-status]', statusAr(trace.status)); hasDetail = true; }
    if (trace.policyAction) { setText(drawer, '[data-kernel-drawer-action]', trace.policyAction); hasDetail = true; }
    toggleSection(drawer, '[data-kernel-drawer-detail]', hasDetail);
    toggleSection(drawer, '[data-kernel-drawer-json]', false);
    toggleSection(drawer, '[data-kernel-drawer-snippet]', false);
    toggleSection(drawer, '[data-kernel-drawer-actions]', true);
    return true;
  }

  /* M28 — replay→parent: يعرض سطر النسب لو كان الـ run إعادة تشغيل. */
  function showLineage(drawer, run) {
    var section = drawer.querySelector('[data-kernel-drawer-lineage]');
    if (!section) return;
    if (!run || !run.parentRunId) {
      section.hidden = true;
      return;
    }
    setText(drawer, '[data-kernel-drawer-parent]', run.parentRunId);
    drawer.dataset.parentRunId = run.parentRunId || '';
    section.hidden = false;
  }

  function statusAr(s) {
    if (s === 'allowed' || s === 'allow') return 'مسموح';
    if (s === 'blocked' || s === 'block') return 'محظور';
    if (s === 'pending_approval' || s === 'review' || s === 'pending') return 'بانتظار الموافقة';
    if (s === 'error' || s === 'failed' || s === 'fail') return 'خطأ';
    return String(s);
  }

  function toggleSection(drawer, sel, show) {
    var el = drawer.querySelector(sel);
    if (el) el.hidden = !show;
  }

  /* ── التعبئة من seed (بيانات المتصل، مثلاً audit) ────────────────── */
  function fillFromSeed(drawer, seed) {
    if (!seed) return false;
    if (seed.user != null) setText(drawer, '[data-kernel-drawer-user]', seed.user);
    if (seed.dept != null) setText(drawer, '[data-kernel-drawer-dept]', seed.dept);
    if (seed.model != null) setText(drawer, '[data-kernel-drawer-model]', seed.model);
    if (seed.time != null) setText(drawer, '[data-kernel-drawer-time]', seed.time);
    if (seed.verdict) applyVerdict(drawer, verdictInfo(seed.verdict));
    if (seed.stages) renderTimeline(drawer, seed.stages);
    if (seed.hashes) {
      if (seed.hashes.prev != null) setText(drawer, '[data-kernel-hash-prev]', shortHash(seed.hashes.prev));
      if (seed.hashes.curr != null) setText(drawer, '[data-kernel-hash-curr]', shortHash(seed.hashes.curr));
      if (seed.hashes.next != null) setText(drawer, '[data-kernel-hash-next]', shortHash(seed.hashes.next));
    }
    if (seed.hash != null) drawer.dataset.currentHash = seed.hash;

    // أقسام التفاصيل: تُظهر حسب ما يمرّره المتصل.
    var hasDetail = false;
    if (seed.status != null) { setText(drawer, '[data-kernel-drawer-status]', seed.status); hasDetail = true; }
    if (seed.approval != null) { setText(drawer, '[data-kernel-drawer-approval]', seed.approval); hasDetail = true; }
    if (seed.anomaly != null) { setText(drawer, '[data-kernel-drawer-anomaly]', seed.anomaly); hasDetail = true; }
    if (seed.action != null) { setText(drawer, '[data-kernel-drawer-action]', seed.action); hasDetail = true; }
    toggleSection(drawer, '[data-kernel-drawer-detail]', hasDetail);

    var hasJson = seed.json != null;
    if (hasJson) {
      var jsonBody = drawer.querySelector('[data-kernel-drawer-json-body]');
      if (jsonBody) jsonBody.textContent = typeof seed.json === 'string' ? seed.json : JSON.stringify(seed.json, null, 2);
    }
    toggleSection(drawer, '[data-kernel-drawer-json]', hasJson);

    var hasSnippet = seed.snippet != null;
    if (hasSnippet) {
      var snipBody = drawer.querySelector('[data-kernel-drawer-snippet-body]');
      if (snipBody) snipBody.textContent = seed.snippet;
    }
    toggleSection(drawer, '[data-kernel-drawer-snippet]', hasSnippet);

    // إجراءات: تظهر في سياقات التدقيق (حين يوجد JSON أو hash محدد).
    toggleSection(drawer, '[data-kernel-drawer-actions]', hasJson || seed.hash != null);
    return true;
  }

  function setText(drawer, sel, val) {
    var el = drawer.querySelector(sel);
    if (el) el.textContent = val;
  }

  function applyVerdict(drawer, v) {
    var vEl = drawer.querySelector('[data-kernel-trace-verdict]');
    if (!vEl) return;
    vEl.className = 'k-verdict ' + v.cls;
    var iconEl = vEl.querySelector('.k-verdict__icon');
    if (iconEl) iconEl.textContent = v.icon;
    var txtEl = vEl.querySelector('span:last-child');
    if (txtEl && txtEl !== iconEl) txtEl.textContent = v.label;
  }

  /* تصدير PDF للدرج: صفحة طباعة نظيفة بالملخص + المراحل + الهاشات. */
  function exportDrawerPdf(drawer) {
    var idEl = drawer.querySelector('[data-kernel-trace-id]');
    var id = idEl ? idEl.textContent.trim() : '—';
    var vals = {};
    drawer.querySelectorAll('[data-label]').forEach(function (el) {
      vals[el.getAttribute('data-label')] = el.textContent;
    });
    var verdictEl = drawer.querySelector('[data-kernel-trace-verdict]');
    var verdict = verdictEl ? verdictEl.textContent.trim() : '';
    var stagesHtml = '';
    var stages = drawer.querySelectorAll('.k-timeline__item');
    stages.forEach(function (li) {
      var name = li.querySelector('.k-timeline__name');
      var res = li.querySelector('.k-timeline__result');
      stagesHtml += '<li><strong>' + escapeHtml(name ? name.textContent : '') + '</strong> — ' +
        escapeHtml(res ? res.textContent : '') + '</li>';
    });
    var hashes = [];
    drawer.querySelectorAll('[data-kernel-hash-prev],[data-kernel-hash-curr],[data-kernel-hash-next]').forEach(function (el) {
      hashes.push(escapeHtml(el.textContent));
    });

    var html = '<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8">' +
      '<title>Trace ' + id + ' — تصدير</title>' +
      '<style>body{font-family:system-ui;color:#0f172a;padding:24px;line-height:1.7}' +
      'h1{font-size:18px}h2{font-size:14px;margin-top:24px}' +
      'table{width:100%;border-collapse:collapse;font-size:12px;margin-top:8px}' +
      'th,td{border:1px solid #cbd5e1;padding:6px 8px;text-align:start}th{background:#f1f5f9;width:140px}' +
      'li{margin:4px 0}</style></head><body>' +
      '<h1>Kernel Trace — ' + id + '</h1>' +
      '<table><tbody>' +
      Object.keys(vals).map(function (k) { return '<tr><th>' + escapeHtml(k) + '</th><td>' + escapeHtml(vals[k]) + '</td></tr>'; }).join('') +
      '<tr><th>الحكم</th><td>' + escapeHtml(verdict) + '</td></tr>' +
      '</tbody></table>' +
      '<h2>المراحل</h2><ol>' + stagesHtml + '</ol>' +
      '<h2>سلسلة الهاش</h2><p style="font-family:monospace;font-size:12px">' + hashes.join(' ← ') + '</p>' +
      '<script>window.onload=function(){setTimeout(function(){window.print();},250);};<\/script>' +
      '</body></html>';
    var w = window.open('', '_blank', 'width=860,height=680');
    if (!w) return;
    w.document.write(html);
    w.document.close();
  }

  /* ── الفتح / الإغلاق ─────────────────────────────────────────────── */
  function openDrawer(traceId, seed) {
    var drawer = getDrawer();
    if (!drawer) return;
    if (traceId) {
      var idEl = drawer.querySelector('[data-kernel-trace-id]');
      if (idEl) idEl.textContent = traceId;
    }
    // إعادة ضبط أقسام التفاصيل (الدرج مشترك — لا تسريب بين سياقات مختلفة).
    toggleSection(drawer, '[data-kernel-drawer-detail]', false);
    toggleSection(drawer, '[data-kernel-drawer-json]', false);
    toggleSection(drawer, '[data-kernel-drawer-snippet]', false);
    toggleSection(drawer, '[data-kernel-drawer-actions]', false);
    delete drawer.dataset.currentHash;

    // مصدر الحقيقة أولًا، ثم seed من المتصل، وإلا تبقى القيم الافتراضية.
    if (!fillFromStore(drawer, traceId || '')) fillFromSeed(drawer, seed);
    // focus-trap.js يراقب aria-hidden ويفتح الفخ + ينقل التركيز.
    drawer.setAttribute('aria-hidden', 'false');
  }

  function closeDrawer() {
    var drawer = getDrawer();
    if (!drawer) return;
    // focus-trap.js سيتكفّل بإرجاع التركيز لمصدر الفتح وإغلاق الفخ.
    drawer.setAttribute('aria-hidden', 'true');
  }

  function isOpen() {
    var drawer = getDrawer();
    return !!drawer && drawer.getAttribute('aria-hidden') === 'false';
  }

  function init() {
    var drawer = getDrawer();
    if (!drawer) return;

    // قفل/تحرير scroll متزامن مع دورة حياة focus-trap.
    drawer.addEventListener('a11y:modal-opened', lockScroll);
    drawer.addEventListener('a11y:modal-closed', unlockScroll);

    // أزرار/خلفية الإغلاق.
    drawer.querySelectorAll('[data-kernel-trace-close]').forEach(function (el) {
      if (el.dataset.bound === '1') return;
      el.dataset.bound = '1';
      el.addEventListener('click', closeDrawer);
    });

    // نسخ Trace ID.
    var copyBtn = drawer.querySelector('[data-kernel-trace-copy]');
    if (copyBtn && copyBtn.dataset.bound !== '1') {
      copyBtn.dataset.bound = '1';
      copyBtn.addEventListener('click', function () {
        var idEl = drawer.querySelector('[data-kernel-trace-id]');
        var val = idEl ? idEl.textContent.trim() : '';
        if (!val) return;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(val).catch(function () {});
        }
        // توست نجاح خفيف.
        var toast = document.getElementById('k-toast');
        if (toast) {
          var msg = toast.querySelector('[data-kernel-toast-msg]');
          if (msg) msg.textContent = 'نسخت Trace ID';
          toast.hidden = false;
          window.setTimeout(function () { toast.hidden = true; }, 3000);
        }
      });
    }

    // نسخ الهاش الحالي (من dataset.currentHash الذي يُملأ عند الفتح).
    var copyHashBtn = drawer.querySelector('[data-kernel-drawer-copy-hash]');
    if (copyHashBtn && copyHashBtn.dataset.bound !== '1') {
      copyHashBtn.dataset.bound = '1';
      copyHashBtn.addEventListener('click', function () {
        var h = drawer.dataset.currentHash;
        if (!h) return;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(h).catch(function () {});
        }
        var toast = document.getElementById('k-toast');
        if (toast) {
          var m = toast.querySelector('[data-kernel-toast-msg]');
          if (m) m.textContent = 'نسخت الهاش';
          toast.hidden = false;
          window.setTimeout(function () { toast.hidden = true; }, 3000);
        }
      });
    }

    // نسخ snippet التدقيق.
    var copySnippetBtn = drawer.querySelector('[data-kernel-drawer-copy-snippet]');
    if (copySnippetBtn && copySnippetBtn.dataset.bound !== '1') {
      copySnippetBtn.dataset.bound = '1';
      copySnippetBtn.addEventListener('click', function () {
        var body = drawer.querySelector('[data-kernel-drawer-snippet-body]');
        if (!body || !body.textContent) return;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(body.textContent).catch(function () {});
        }
        var toast = document.getElementById('k-toast');
        if (toast) {
          var m = toast.querySelector('[data-kernel-toast-msg]');
          if (m) m.textContent = 'نسخت الـ snippet';
          toast.hidden = false;
          window.setTimeout(function () { toast.hidden = true; }, 3000);
        }
      });
    }

    // تصدير PDF: يعرض صفحة قابلة للطباعة بالتفاصيل الحالية للدرج.
    var exportPdfBtn = drawer.querySelector('[data-kernel-drawer-export-pdf]');
    if (exportPdfBtn && exportPdfBtn.dataset.bound !== '1') {
      exportPdfBtn.dataset.bound = '1';
      exportPdfBtn.addEventListener('click', function () { exportDrawerPdf(drawer); });
    }

    // M28 — replay→parent: زر «افتح الأصل» يعيد فتح الدرج على الـ run الأب.
    var openParentBtn = drawer.querySelector('[data-kernel-drawer-open-parent]');
    if (openParentBtn && openParentBtn.dataset.bound !== '1') {
      openParentBtn.dataset.bound = '1';
      openParentBtn.addEventListener('click', function () {
        var parentId = drawer.dataset.parentRunId;
        if (!parentId) return;
        openDrawer(parentId);
      });
    }

    // عناصر [data-trace-id] في أي صفحة — تفتح الدرج.
    document.querySelectorAll('[data-trace-id]').forEach(function (el) {
      if (el.dataset.boundTrace === '1') return;
      el.dataset.boundTrace = '1';
      el.addEventListener('click', function (e) {
        e.preventDefault();
        openDrawer(el.getAttribute('data-trace-id') || undefined);
      });
    });

    // بحث Trace ID في الشريط العلوي.
    var form = document.querySelector('[data-kernel-trace-search]');
    if (form && form.dataset.bound !== '1') {
      form.dataset.bound = '1';
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var input = form.querySelector('[data-kernel-trace-input]');
        var val = input ? input.value.trim() : '';
        openDrawer(val || 'AI-2026-10493');
      });
    }

    // الواجهة المشتركة — كل صفحات /kernel/* تفتح الدرج منها.
    window.KernelTraceDrawer = {
      open: openDrawer,
      close: closeDrawer,
      isOpen: isOpen,
    };

    // API عام: أي صفحة تقدر تفتح الدرج بحدث (نمط approvals القديم).
    document.addEventListener('kerneltrace:open', function (e) {
      if (e.detail && e.detail.traceId) openDrawer(e.detail.traceId);
    });
  }

  // Esc إضافي احتياطي (focus-trap يعالجها بالأساس داخل الفخ).
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && isOpen()) closeDrawer();
  });

  document.addEventListener('astro:page-load', init);
})();
