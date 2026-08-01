/**
 * kernel-reports-data.js — UMD mirror of src/data/kernel-reports.ts (M23).
 *
 * Byte-for-byte identical algorithm. No Math.random, no Date.now, no
 * toLocaleString. Works in: browser main thread (window.KernelReportsData),
 * Web Worker (importScripts), Node (module.exports).
 *
 * CSP-safe: no dynamic imports, no eval, no Function constructor.
 */
(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.KernelReportsData = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // ── Constants ──────────────────────────────────────────────────────────────

  var REPORT_SEED = 0x7e3a1c50;
  var REPORT_TOTAL = 42;
  var REPORT_READY = 38;
  var REPORT_GENERATING = 1;
  var REPORT_FAILED = 3;
  var SCHEDULED_TOTAL = 4;
  var SCHEDULED_ACTIVE = 3;
  var SCHEDULED_PAUSED = 1;
  var TEMPLATE_VERSIONS_TOTAL = 5;
  var RECIPIENTS_TOTAL = 18;

  var TS_START = Date.UTC(2026, 4, 1, 0, 0, 0);
  var TS_END = Date.UTC(2026, 4, 31, 23, 59, 59);

  var REPORT_TYPES = [
    { id: 'governance', label: 'تقرير حوكمة', icon: '⚖️' },
    { id: 'compliance', label: 'تقرير امتثال', icon: '🛡️' },
    { id: 'audit', label: 'تقرير تدقيق', icon: '📋' },
    { id: 'risk', label: 'تقرير مخاطر', icon: '⚠️' },
    { id: 'custom', label: 'تقرير مخصص', icon: '⚙️' },
    { id: 'pii', label: 'كشف PII', icon: '🔒' },
    { id: 'connectors', label: 'الموصلات', icon: '🔌' }
  ];

  var REPORT_FORMATS = ['PDF', 'JSON', 'CSV', 'XLSX'];

  var REPORT_LANGUAGES = [
    { id: 'ar', label: 'العربية', native: 'العربية' },
    { id: 'en', label: 'English', native: 'English' },
    { id: 'fr', label: 'Français', native: 'Français' },
    { id: 'es', label: 'Español', native: 'Español' },
    { id: 'de', label: 'Deutsch', native: 'Deutsch' }
  ];

  var REPORT_RECIPIENTS = [
    { id: 'ciso', label: 'CISO', role: 'الرئيس التنفيذي للأمن السيبراني' },
    { id: 'dpo', label: 'DPO', role: 'مسؤول حماية البيانات' },
    { id: 'governance', label: 'مكتب الحوكمة', role: 'لجنة الحوكمة والمخاطر' },
    { id: 'cto', label: 'CTO', role: 'الرئيس التنفيذي للتقنية' },
    { id: 'compliance', label: 'فريق الامتثال', role: 'مدير الامتثال' },
    { id: 'audit', label: 'التدقيق الداخلي', role: 'مدير التدقيق الداخلي' }
  ];

  var REPORT_WIDGETS = [
    { type: 'kpi', label: 'مؤشر KPI', icon: '📊' },
    { type: 'chart', label: 'مخطط', icon: '📈' },
    { type: 'table', label: 'جدول', icon: '📋' },
    { type: 'text', label: 'نص', icon: '📝' },
    { type: 'page-break', label: 'فاصل صفحة', icon: '📄' }
  ];

  // ── PRNG + Hash ────────────────────────────────────────────────────────────

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

  function fnv1a(str) {
    var s = String(str == null ? '' : str);
    var h = 0x811c9dc5;
    for (var i = 0; i < s.length; i += 1) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    return '0x' + h.toString(16).padStart(8, '0');
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  function formatTsLabel(ts) {
    var d = new Date(ts);
    var y = d.getUTCFullYear();
    var m = String(d.getUTCMonth() + 1).padStart(2, '0');
    var day = String(d.getUTCDate()).padStart(2, '0');
    var h = String(d.getUTCHours()).padStart(2, '0');
    var min = String(d.getUTCMinutes()).padStart(2, '0');
    return y + '/' + m + '/' + day + ' ' + h + ':' + min;
  }

  function pick(arr, rand) {
    return arr[Math.floor(rand() * arr.length)];
  }

  function pickN(arr, n, rand) {
    var copy = arr.slice();
    var out = [];
    for (var i = 0; i < n && copy.length > 0; i += 1) {
      var idx = Math.floor(rand() * copy.length);
      out.push(copy.splice(idx, 1)[0]);
    }
    return out;
  }

  // ── Title templates ────────────────────────────────────────────────────────

  var TITLE_TEMPLATES = {
    governance: [
      'تقرير حوكمة AI التوليدي — {period}',
      'تقرير حوكمة AI الشهري — {period}',
      'تقرير حوكمة AI الربع سنوي — {period}',
      'تقرير حوكمة AI السنوي — {period}'
    ],
    compliance: [
      'تقرير جاهزية PDPL — {period}',
      'تقرير امتثال NCA ECC — {period}',
      'تقرير امتثال SDAIA — {period}',
      'تقرير امتثال SFDA — {period}',
      'تقرير امتثال SAMA — {period}',
      'تقرير امتثال ISO 42001 — {period}'
    ],
    audit: [
      'تدقيق NCA ECC — {period}',
      'تدقيق PDPL — {period}',
      'تدقيق سجل AI — {period}',
      'تدقيق الموصلات — {period}'
    ],
    risk: [
      'تقرير المخاطر الشهري — {period}',
      'تقرير المخاطر الربع سنوي — {period}',
      'تحليل المخاطر عالية المستوى — {period}',
      'تقرير المخاطر التشغيلية — {period}'
    ],
    custom: [
      'تقرير مخصص — {period}',
      'تحليل استخدام AI — {period}',
      'تقرير مخصص للإدارة — {period}'
    ],
    pii: [
      'كشف PII للموارد البشرية — {period}',
      'كشف PII للعملاء — {period}',
      'كشف PII للمرضى — {period}',
      'كشف PII الشامل — {period}'
    ],
    connectors: [
      'تقرير الموصلات والاستخدام — {period}',
      'تقرير صحة الموصلات — {period}',
      'تقرير مزامنة الموصلات — {period}'
    ]
  };

  var PERIODS = [
    'Q2 2026', 'مايو 2026', 'يونيو 2026', 'الأسبوع 21',
    'الأسبوع 22', 'آخر 30 يوم', 'آخر 7 أيام', '2026 كامل'
  ];

  var EXECUTIVE_SUMMARIES = {
    governance: [
      'يغطي هذا التقرير حوكمة AI التوليدي في {period}. تم فحص {traces} طلب، مع 89.8% سماح و3.1% حظر. الالتزام بسياسات SDAIA مرتفع.',
      'تلخص هذه الوثيقة نشاط حوكمة AI لـ {period}. {traces} طلب تمت معالجته، مع تطبيق 11 سياسة. لا توجد حوادث حرجة.'
    ],
    compliance: [
      'يوضح هذا التقرير حالة الامتثال للأطر التنظيمية في {period}. النتيجة الإجمالية 83% مع 4 أطر مكتملة و2 جزئية.',
      'تقرير امتثال شامل لـ {period}. يغطي PDPL وNCA ECC وSDAIA وSFDA. {traces} طلب موثّق كدليل امتثال.'
    ],
    audit: [
      'سجل تدقيق كامل لـ {period}. {traces} سجل موثّق بسلسلة هاش غير قابلة للتعديل. تم التحقق من سلامة السلسلة.',
      'تقرير تدقيق لـ {period}. يغطي {traces} قرار AI مع Trace ID فريد لكل قرار. سلسلة الهاش سليمة.'
    ],
    risk: [
      'تحليل المخاطر لـ {period}. {traces} طلب فُحص، 382 محظور، 87% متوسط المخاطر. أعلى مخاطر في قسم التسويق.',
      'تقرير المخاطر الشهري لـ {period}. توزيع المخاطر: 12 حرج، 34 مرتفع، 68 متوسط. {traces} طلب مغطى.'
    ],
    custom: [
      'تقرير مخصص لـ {period}. تم بناؤه باستخدام widgets مخصصة. يغطي {traces} طلب.',
      'تحليل مخصص لـ {period}. يجمع بين مؤشرات حوكمة وامتثال ومخاطر. {traces} طلب في النطاق.'
    ],
    pii: [
      'كشف PII شامل لـ {period}. {traces} طلب فُحص، 1,554 يحتوي PII. الأنواع الأكثر كشفًا: الهوية والجوال.',
      'تقرير PII لـ {period}. يغطي {traces} طلب، مع 12.4% نسبة كشف. تم تطبيق التعمية على جميع الحالات.'
    ],
    connectors: [
      'تقرير الموصلات لـ {period}. 8 موصلات نشطة، 2,148 استعلام. زمن الاستجابة الوسيط 128ms.',
      'حالة الموصلات لـ {period}. {traces} طلب عبر الموصلات. Salesforce يحتاج تجديد التوكن.'
    ]
  };

  // ── Template versions ──────────────────────────────────────────────────────

  function buildTemplateVersions() {
    var rand = mulberry32(REPORT_SEED ^ 0x7e65);
    var versions = [];
    var notes = [
      'الإصدار الأول — widgets أساسية (KPI + table)',
      'إضافة widgets: chart + text + page-break',
      'إضافة 5 لغات + role recipients',
      'إضافة Trace coverage + Certificate coverage',
      'إضافة executive summary مولّد آليًا'
    ];
    var prev = '0x00000000';
    for (var i = 0; i < TEMPLATE_VERSIONS_TOTAL; i += 1) {
      var ts = TS_START + Math.floor(rand() * (TS_END - TS_START));
      var version = '1.' + i;
      var canonical = version + '|' + ts + '|' + notes[i];
      var hash = fnv1a(prev + '|' + canonical);
      versions.push({
        version: version,
        createdAt: ts,
        createdAtLabel: formatTsLabel(ts),
        note: notes[i],
        hash: hash,
        certifiedBy: i < 2 ? 'CERT-2026-001' : null
      });
      prev = hash;
    }
    return versions;
  }

  // ── Report rows ────────────────────────────────────────────────────────────

  function reportCanonical(r) {
    return [
      r.id, r.title, r.type, r.status, r.format, r.language,
      r.period, r.sizeMb, r.ts, r.recipients.join(','),
      r.traceCoverage.join(','), r.certificateCoverage.join(','),
      r.templateVersion, r.progress
    ].join('|');
  }

  function buildReportRows() {
    var rand = mulberry32(REPORT_SEED);
    var total = REPORT_TOTAL;
    var span = TS_END - TS_START;

    var statuses = [];
    for (var i = 0; i < REPORT_READY; i += 1) statuses.push('ready');
    for (var j = 0; j < REPORT_GENERATING; j += 1) statuses.push('generating');
    for (var k = 0; k < REPORT_FAILED; k += 1) statuses.push('failed');
    for (var s = statuses.length - 1; s > 0; s -= 1) {
      var jj = Math.floor(rand() * (s + 1));
      var tmp = statuses[s];
      statuses[s] = statuses[jj];
      statuses[jj] = tmp;
    }

    var rows = [];
    var prev = '0x00000000';

    for (var n = 0; n < total; n += 1) {
      var status = statuses[n];
      var type = pick(REPORT_TYPES, rand);
      var format = pick(REPORT_FORMATS, rand);
      var language = pick(REPORT_LANGUAGES, rand);
      var period = pick(PERIODS, rand);
      var titlePool = TITLE_TEMPLATES[type.id];
      var titleTemplate = titlePool[Math.floor(rand() * titlePool.length)];
      var title = titleTemplate.replace('{period}', period);

      var ts = TS_START + Math.floor(rand() * span);
      var sizeMb = Math.round((0.3 + rand() * 4.5) * 10) / 10;

      var recipientsCount = 1 + Math.floor(rand() * 4);
      var recipients = pickN(REPORT_RECIPIENTS, recipientsCount, rand).map(function (r) { return r.label; });

      var traceCount = 5 + Math.floor(rand() * 46);
      var traceCoverage = [];
      for (var t = 0; t < traceCount; t += 1) {
        traceCoverage.push('AI-2026-' + String(10000 + Math.floor(rand() * 9000)));
      }

      var certCount = Math.floor(rand() * 4);
      var certificateCoverage = [];
      for (var c = 0; c < certCount; c += 1) {
        certificateCoverage.push('CERT-2026-' + String(1 + Math.floor(rand() * 99)).padStart(3, '0'));
      }

      var summaryPool = EXECUTIVE_SUMMARIES[type.id];
      var summaryTemplate = summaryPool[Math.floor(rand() * summaryPool.length)];
      var executiveSummary = summaryTemplate
        .replace('{period}', period)
        .replace('{traces}', String(traceCount));

      var templateVersion = '1.' + Math.floor(rand() * TEMPLATE_VERSIONS_TOTAL);
      var progress = status === 'generating' ? 30 + Math.floor(rand() * 60) : 100;
      var id = 'r-' + String(n + 1).padStart(3, '0');

      var raw = {
        id: id, title: title, type: type.id, status: status, format: format,
        language: language.id, period: period, sizeMb: sizeMb, ts: ts,
        recipients: recipients, traceCoverage: traceCoverage,
        certificateCoverage: certificateCoverage, templateVersion: templateVersion,
        progress: progress
      };

      var hash = fnv1a(prev + '|' + reportCanonical(raw));

      rows.push({
        index: n, id: id, title: title, type: type.id, typeLabel: type.label,
        status: status, format: format, language: language.id, period: period,
        sizeMb: sizeMb, createdAt: ts, createdAtLabel: formatTsLabel(ts),
        recipients: recipients, traceCoverage: traceCoverage,
        traceCoverageCount: traceCount, certificateCoverage: certificateCoverage,
        certificateCoverageCount: certCount, executiveSummary: executiveSummary,
        templateVersion: templateVersion, progress: progress,
        prevHash: prev, hash: hash
      });

      prev = hash;
    }

    return rows;
  }

  // ── Scheduled reports ──────────────────────────────────────────────────────

  function buildScheduledReports() {
    var rand = mulberry32(REPORT_SEED ^ 0x5c1);
    var scheduled = [];
    var freqs = ['يومي', 'أسبوعي', 'شهري', 'ربع سنوي'];
    var nextRuns = ['غدًا 09:00', 'الأحد 09:00', 'الاثنين 08:00', '2026-07-01', '2026-08-15'];

    for (var i = 0; i < SCHEDULED_TOTAL; i += 1) {
      var type = pick(REPORT_TYPES, rand);
      var language = pick(REPORT_LANGUAGES, rand);
      var recipientsCount = 1 + Math.floor(rand() * 4);
      var recipients = pickN(REPORT_RECIPIENTS, recipientsCount, rand).map(function (r) { return r.label; });
      var status = i < SCHEDULED_ACTIVE ? 'active' : 'paused';

      scheduled.push({
        id: 'sch-' + String(i + 1),
        title: type.label + ' — ' + pick(freqs, rand),
        type: type.id, typeLabel: type.label,
        frequency: pick(freqs, rand), nextRun: pick(nextRuns, rand),
        recipients: recipients, recipientsCount: recipients.length,
        status: status, language: language.id
      });
    }

    return scheduled;
  }

  // ── Report stats ───────────────────────────────────────────────────────────

  function buildReportStats() {
    var rows = buildReportRows();
    var scheduled = buildScheduledReports();

    var byType = { governance: 0, compliance: 0, audit: 0, risk: 0, custom: 0, pii: 0, connectors: 0 };
    var byFormat = { PDF: 0, JSON: 0, CSV: 0, XLSX: 0 };
    var ready = 0, generating = 0;
    var allRecipients = {};

    for (var i = 0; i < rows.length; i += 1) {
      var r = rows[i];
      byType[r.type] += 1;
      byFormat[r.format] += 1;
      if (r.status === 'ready') ready += 1;
      else if (r.status === 'generating') generating += 1;
      for (var j = 0; j < r.recipients.length; j += 1) {
        allRecipients[r.recipients[j]] = true;
      }
    }

    for (var s = 0; s < scheduled.length; s += 1) {
      for (var k = 0; k < scheduled[s].recipients.length; k += 1) {
        allRecipients[scheduled[s].recipients[k]] = true;
      }
    }

    var recipientCount = 0;
    for (var key in allRecipients) { if (allRecipients.hasOwnProperty(key)) recipientCount += 1; }

    return {
      total: rows.length, ready: ready, generating: generating,
      scheduled: scheduled.length, recipients: recipientCount,
      byType: byType, byFormat: byFormat, byLanguage: REPORT_LANGUAGES.length
    };
  }

  // ── Default templates ──────────────────────────────────────────────────────

  function buildDefaultTemplates() {
    return REPORT_TYPES.map(function (t, idx) {
      return {
        id: 'tpl-' + String(idx + 1).padStart(2, '0'),
        name: t.label + ' — قالب افتراضي',
        type: t.id, language: 'ar',
        widgets: [
          { id: 'w-1', type: 'kpi', label: 'إجمالي الطلبات', metricKey: 'total' },
          { id: 'w-2', type: 'kpi', label: 'المسموح', metricKey: 'allowed' },
          { id: 'w-3', type: 'kpi', label: 'المحظور', metricKey: 'blocked' },
          { id: 'w-4', type: 'chart', label: 'الطلبات عبر الزمن', chartKind: 'line' },
          { id: 'w-5', type: 'table', label: 'أعلى الأقسام', columns: 3 },
          { id: 'w-6', type: 'text', label: 'ملخص تنفيذي', body: 'ملخص تنفيذي مولّد آليًا.' },
          { id: 'w-7', type: 'page-break', label: 'فاصل صفحة' }
        ]
      };
    });
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  return {
    REPORT_SEED: REPORT_SEED,
    REPORT_TOTAL: REPORT_TOTAL,
    REPORT_READY: REPORT_READY,
    REPORT_GENERATING: REPORT_GENERATING,
    REPORT_FAILED: REPORT_FAILED,
    SCHEDULED_TOTAL: SCHEDULED_TOTAL,
    SCHEDULED_ACTIVE: SCHEDULED_ACTIVE,
    SCHEDULED_PAUSED: SCHEDULED_PAUSED,
    TEMPLATE_VERSIONS_TOTAL: TEMPLATE_VERSIONS_TOTAL,
    RECIPIENTS_TOTAL: RECIPIENTS_TOTAL,
    REPORT_TYPES: REPORT_TYPES,
    REPORT_FORMATS: REPORT_FORMATS,
    REPORT_LANGUAGES: REPORT_LANGUAGES,
    REPORT_RECIPIENTS: REPORT_RECIPIENTS,
    REPORT_WIDGETS: REPORT_WIDGETS,
    mulberry32: mulberry32,
    fnv1a: fnv1a,
    buildTemplateVersions: buildTemplateVersions,
    buildReportRows: buildReportRows,
    buildScheduledReports: buildScheduledReports,
    buildReportStats: buildReportStats,
    buildDefaultTemplates: buildDefaultTemplates
  };
}));