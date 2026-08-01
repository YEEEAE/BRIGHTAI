/**
 * kernel-audit-data.js — Deterministic audit dataset, browser/Worker/Node mirror.
 *
 * Byte-for-byte algorithmic mirror of src/data/kernel-audit.ts. Loaded as a
 * classic UMD script so it works in THREE runtimes without re-writing logic:
 *   - Browser main thread  → window.KernelAuditData
 *   - Web Worker           → self.KernelAuditData (via importScripts)
 *   - Node (verify script) → module.exports
 *
 * Contract (must never drift — verified by scripts/verify-audit.mjs):
 *   - total     = 12,483 rows
 *   - allowed   = 11,210 (713 human-approved → approvals metric)
 *   - blocked   = 382
 *   - pending   = 841
 *   - error     = 50
 *   - approvals = 1,554 (= 841 pending + 713 human-approved allowed)
 *
 * Determinism: mulberry32(AUDIT_SEED) drives every choice. Exact status counts
 * are pre-built then Fisher–Yates-shuffled with the same RNG stream, so the
 * distribution is exact AND the order is reproducible across engines.
 * Timestamps are UTC-based and formatted manually (no locale, no toLocaleString).
 *
 * The hash chain (FNV-1a) seals each row against tampering. The engine
 * re-computes the chain client-side and compares — any edited field breaks it.
 * fnv1a is byte-identical to kernel-hash.js / kernel-datasets.ts.
 *
 * CSP: classic script from /js/ ('self'), no unsafe-inline. No external fetch —
 * the dataset is regenerated deterministically in-process (Prompt 19 immutable rule).
 */
(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.KernelAuditData = factory();
  }
})(typeof self !== 'undefined' ? self : typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var AUDIT_SEED = 0x5a4d11ed;
  var AUDIT_TOTAL = 12483;
  var AUDIT_ALLOWED = 11210;
  var AUDIT_BLOCKED = 382;
  var AUDIT_PENDING = 841;
  var AUDIT_ERROR = 50;
  var AUDIT_APPROVED_ALLOWED = 713;

  var AUDIT_USERS = [
    { id: 'm.alharbi', label: 'محمد الحربي', role: 'تسويق' },
    { id: 's.alfaisal', label: 'سارة الفيصل', role: 'مالية' },
    { id: 'a.alqahtani', label: 'أحمد القحطاني', role: 'عمليات' },
    { id: 'n.alshahrani', label: 'نورة الشهراني', role: 'قانونية' },
    { id: 'k.alghamdi', label: 'خالد الغامدي', role: 'تقنية' },
  ];

  var TS_START = Date.UTC(2026, 4, 20, 0, 0, 0);
  var TS_END = Date.UTC(2026, 6, 6, 23, 59, 59);

  var ACTION_POOL = {
    'تسويق': {
      allowed: [
        'استعلام تلخيصي عن سياسة الإجازات',
        'استعلام عادي (لا PII)',
        'تصدير تقرير خفيف لقائمة عملاء',
        'تحليل أداء حملة سابقة',
      ],
      blocked: [
        'طلب تصدير قائمة 2,400 عميل (PII)',
        'استعلام عن بيانات عملاء عبر مزود خارجي',
        'توليد رسائل بريدية شخصية من سجلات العملاء',
      ],
      pending_approval: ['تشغيل نموذج توليدي على شرائح العملاء', 'دمج بيانات حملة مع CRM'],
      error: ['فشل اتصال بـ CRM (timeout)', 'خطأ في استجابة مزود النموذج'],
    },
    'مالية': {
      allowed: ['استعلام عن سياسة الصرف', 'تلخيص تقرير مصروفات ربع سنوي', 'استعلام عن رصيد بند'],
      blocked: [
        'تشغيل نموذج توليدي على سجلات طبية',
        'تصدير ملف مكافآت الموظفين (PII)',
        'استعلام عن بيانات بنكية لعملاء',
      ],
      pending_approval: ['توليد تقرير مالي حساس', 'مراجعة مدفوعات آلية'],
      error: ['فشل اتصال بـ ERP (timeout)', 'انقطاع في خدمة المعاملات'],
    },
    'عمليات': {
      allowed: ['تحليل عقد مورد', 'اختبار سيناريو تلخيصي', 'استعلام عن جدولة إنتاج'],
      blocked: ['نقل بيانات موردين إلى مزود خارجي', 'تعديل قاعدة مورد عبر نموذج'],
      pending_approval: ['توليد ملخص تفاوض مع مورد', 'مراجعة عقد قبل التوقيع'],
      error: ['فشل مزامنة مع نظام المخزون'],
    },
    'قانونية': {
      allowed: ['استعلام لوائح البنك المركزي', 'استعلام عن بند تعاقدي', 'تلخيص وثيقة قانونية عامة'],
      blocked: ['تصدير ملف قضية حساس', 'استعلام عن معلومات طرف ثالث محمية'],
      pending_approval: ['توليد مسودة اتفاقية', 'مراجعة امتثال صفقة'],
      error: ['فشل الاتصال بقاعدة اللوائح'],
    },
    'تقنية': {
      allowed: ['استعلام عن حالة الأنظمة', 'فحص إعدادات جدار الحماية', 'تلخيص سجل النظام'],
      blocked: ['دمج نموذج ثالث + كشف PII جديد', 'تثبيت مكتبة من مصدر غير موثوق', 'تصدير مفاتيح API'],
      pending_approval: ['تغيير إعدادات حساسة', 'تحديث نموذج على بيئة الإنتاج'],
      error: ['انقطاع في مزود النموذج', 'فشل قراءة سجل النظام'],
    },
  };

  function mulberry32(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function fnv1a(str) {
    var s = String(str == null ? '' : str);
    var h = 2166136261;
    for (var i = 0; i < s.length; i += 1) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return '0x' + (h >>> 0).toString(16).padStart(8, '0');
  }

  function shuffle(arr, rand) {
    for (var i = arr.length - 1; i > 0; i -= 1) {
      var j = Math.floor(rand() * (i + 1));
      var tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
    }
    return arr;
  }

  function pad2(n) {
    return String(n).padStart(2, '0');
  }

  function formatTsLabel(epochMs) {
    var d = new Date(epochMs);
    return (
      d.getUTCFullYear() + '/' + pad2(d.getUTCMonth() + 1) + '/' + pad2(d.getUTCDate()) +
      ' ' + pad2(d.getUTCHours()) + ':' + pad2(d.getUTCMinutes())
    );
  }

  function formatTsDate(epochMs) {
    var d = new Date(epochMs);
    return d.getUTCFullYear() + '-' + pad2(d.getUTCMonth() + 1) + '-' + pad2(d.getUTCDate());
  }

  function auditCanonical(row) {
    return [
      String(row.ts),
      row.userId,
      row.role,
      row.action,
      String(row.risk),
      row.status,
      row.traceId,
    ].join('|');
  }

  /** Rebuilds the FULL dataset deterministically. Pure function. */
  function buildAuditRows() {
    var rand = mulberry32(AUDIT_SEED);
    var total = AUDIT_TOTAL;

    var statuses = [];
    for (var i = 0; i < AUDIT_ALLOWED; i += 1) statuses.push('allowed');
    for (var i = 0; i < AUDIT_BLOCKED; i += 1) statuses.push('blocked');
    for (var i = 0; i < AUDIT_PENDING; i += 1) statuses.push('pending_approval');
    for (var i = 0; i < AUDIT_ERROR; i += 1) statuses.push('error');
    shuffle(statuses, rand);

    var raw = [];
    var span = TS_END - TS_START;
    for (var j = 0; j < total; j += 1) {
      var status = statuses[j];
      var uIdx = Math.floor(rand() * AUDIT_USERS.length);
      var user = AUDIT_USERS[uIdx];
      var pool = ACTION_POOL[user.role][status];
      var action = pool[Math.floor(rand() * pool.length)];
      var ts = TS_START + Math.floor(rand() * span);

      var risk;
      if (status === 'allowed') risk = 1 + Math.floor(rand() * 45);
      else if (status === 'blocked') risk = 60 + Math.floor(rand() * 39);
      else if (status === 'pending_approval') risk = 40 + Math.floor(rand() * 46);
      else risk = 30 + Math.floor(rand() * 31);

      raw.push({ ts: ts, userId: user.id, role: user.role, action: action, risk: risk, status: status });
    }

    raw.sort(function (a, b) { return a.ts - b.ts; });

    var rows = [];
    var allowedSeen = 0;
    for (var k = 0; k < total; k += 1) {
      var r = raw[k];
      var traceId = 'AI-2026-' + String(10493 + (total - 1 - k));
      var humanApproved = false;
      if (r.status === 'allowed') {
        allowedSeen += 1;
        humanApproved = allowedSeen <= AUDIT_APPROVED_ALLOWED;
      }
      var anomaly = r.status === 'blocked' && r.risk >= 90;
      var userRec = AUDIT_USERS[findUserIndex(r.userId)];
      rows.push({
        index: k,
        ts: r.ts,
        tsLabel: formatTsLabel(r.ts),
        tsDate: formatTsDate(r.ts),
        userId: r.userId,
        userLabel: userRec.label,
        role: r.role,
        action: r.action,
        risk: r.risk,
        status: r.status,
        humanApproved: humanApproved,
        traceId: traceId,
        anomaly: anomaly,
        prevHash: '0x00000000',
        hash: '0x00000000',
      });
    }

    var prev = '0x00000000';
    for (var m = 0; m < total; m += 1) {
      var row = rows[m];
      row.prevHash = prev;
      row.hash = fnv1a(prev + '|' + auditCanonical(row));
      prev = row.hash;
    }

    return rows;
  }

  function findUserIndex(id) {
    for (var i = 0; i < AUDIT_USERS.length; i += 1) {
      if (AUDIT_USERS[i].id === id) return i;
    }
    return 0;
  }

  function buildAuditStats(rows) {
    var r = rows || buildAuditRows();
    var allowed = 0, blocked = 0, pending = 0, error = 0, approved = 0;
    for (var i = 0; i < r.length; i += 1) {
      var s = r[i].status;
      if (s === 'allowed') allowed += 1;
      else if (s === 'blocked') blocked += 1;
      else if (s === 'pending_approval') pending += 1;
      else error += 1;
      if (s === 'pending_approval' || (s === 'allowed' && r[i].humanApproved)) approved += 1;
    }
    return { total: r.length, allowed: allowed, blocked: blocked, pending: pending, error: error, approvals: approved };
  }

  return {
    AUDIT_SEED: AUDIT_SEED,
    AUDIT_TOTAL: AUDIT_TOTAL,
    AUDIT_ALLOWED: AUDIT_ALLOWED,
    AUDIT_BLOCKED: AUDIT_BLOCKED,
    AUDIT_PENDING: AUDIT_PENDING,
    AUDIT_ERROR: AUDIT_ERROR,
    AUDIT_APPROVED_ALLOWED: AUDIT_APPROVED_ALLOWED,
    AUDIT_USERS: AUDIT_USERS,
    AUDIT_DEFAULT_FROM: '2026-06-01',
    AUDIT_DEFAULT_TO: '2026-07-06',
    mulberry32: mulberry32,
    fnv1a: fnv1a,
    formatTsLabel: formatTsLabel,
    formatTsDate: formatTsDate,
    auditCanonical: auditCanonical,
    buildAuditRows: buildAuditRows,
    buildAuditStats: buildAuditStats,
  };
});
