/**
 * kernel-evidence-data.js — Deterministic evidence dataset, browser/Worker/Node mirror.
 *
 * Byte-for-byte algorithmic mirror of src/data/kernel-evidence.ts. Loaded as a
 * classic UMD script so it works in THREE runtimes without re-writing logic:
 *   - Browser main thread  → window.KernelEvidenceData
 *   - Web Worker           → self.KernelEvidenceData (via importScripts)
 *   - Node (verify script) → module.exports
 *
 * Contract (must never drift — verified by scripts/verify-evidence.mjs):
 *   - total            = 12
 *   - allowed          = 6
 *   - blocked          = 2
 *   - pending_approval = 2
 *   - approved         = 1
 *   - draft            = 1
 *
 * Determinism: the 12 published items are encoded verbatim as SEED_ITEMS
 * (same ids, traceIds, Arabic-Indic-digit dates, hashes, sizes, tags,
 * certificates, retention labels). A FNV-1a hash chain is computed
 * deterministically over evidenceCanonical(row) (genesis = '0x00000000').
 * No Math.random, no Date.now, no toLocaleString, no fetch.
 *
 * CSP: classic script from /js/ ('self'), no unsafe-inline. No external fetch.
 *
 * Published-content invariant: the Arabic text in SEED_ITEMS is published
 * content. Do NOT "correct" Saudi dialect or reformat the digits.
 */
(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.KernelEvidenceData = factory();
  }
})(typeof self !== 'undefined' ? self : typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  // ── Seed + counts ────────────────────────────────────────────────────

  var EVIDENCE_SEED = 0xe1d3a5c7;
  var EVIDENCE_TOTAL = 12;
  var EVIDENCE_ALLOWED = 6;
  var EVIDENCE_BLOCKED = 2;
  var EVIDENCE_PENDING_APPROVAL = 2;
  var EVIDENCE_APPROVED = 1;
  var EVIDENCE_DRAFT = 1;
  var EVIDENCE_NOW = Date.UTC(2026, 6, 6, 18, 0, 0);

  // ── Filter / label maps ──────────────────────────────────────────────

  var SECTORS = [
    { value: '', label: 'كل القطاعات' },
    { value: 'banking', label: 'البنوك' },
    { value: 'government', label: 'الجهات الحكومية' },
    { value: 'healthcare', label: 'الرعاية الصحية' },
    { value: 'manufacturing', label: 'الصناعة' },
    { value: 'telecom', label: 'الاتصالات' },
  ];

  var COMPLIANCE_PACKS = [
    { value: '', label: 'كل الحزم' },
    { value: 'pdpl', label: 'PDPL' },
    { value: 'nca', label: 'NCA ECC' },
    { value: 'sdaia', label: 'SDAIA' },
    { value: 'sfda', label: 'SFDA' },
    { value: 'sama', label: 'SAMA' },
    { value: 'iso42001', label: 'ISO 42001' },
    { value: 'iso27001', label: 'ISO 27001' },
  ];

  var TAGS = [
    { value: '', label: 'كل الوسوم' },
    { value: 'audit', label: 'تدقيق' },
    { value: 'breach', label: 'اختراق' },
    { value: 'hr', label: 'موارد بشرية' },
    { value: 'fintech', label: 'تقنية مالية' },
    { value: 'medical', label: 'طبي' },
  ];

  var PACK_LABEL = {
    pdpl: 'PDPL', nca: 'NCA ECC', sdaia: 'SDAIA', sfda: 'SFDA', sama: 'SAMA',
    iso42001: 'ISO 42001', iso27001: 'ISO 27001',
  };

  var SECTOR_LABEL = {
    banking: 'البنوك', government: 'الحكومة', healthcare: 'الرعاية الصحية',
    manufacturing: 'الصناعة', telecom: 'الاتصالات',
  };

  // ── Deterministic primitives (byte-identical to kernel-approvals-data.js) ─

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

  // ── Signature helpers (shared with the page) ─────────────────────────

  function signatureClass(item) {
    if (!item.signedAt) return 'kernel-evidence-item__signature--pending';
    if (item.status === 'draft') return 'kernel-evidence-item__signature--draft';
    return '';
  }

  function signatureText(item) {
    if (!item.signedAt) return 'بانتظار التوقيع';
    if (item.status === 'draft') return 'مسودة — غير موقّعة';
    return 'موقّع رقمياً';
  }

  // ── Canonical form sealed by the hash chain ──────────────────────────

  function evidenceCanonical(row) {
    return [
      row.id,
      row.traceId,
      row.title,
      row.query,
      row.status,
      row.riskLevel,
      String(row.riskScore),
      row.sector,
      row.pack,
      row.size,
      row.createdAt,
      row.signedAt === null ? '' : row.signedAt,
      row.tags.join(','),
      row.certificateId,
      row.retention,
    ].join('|');
  }

  // ── The 12 published items (seed — do NOT alter Arabic text/digits) ───

  var SEED_ITEMS = [
    {
      id: 'EVD-2026-10493', traceId: 'AI-2026-10493',
      title: 'محاولة تصدير قائمة 2,400 عميل',
      query: 'تصدير قائمة 2,400 عميل مع PII (اسم + هاتف + بريد)',
      status: 'blocked', riskLevel: 'critical', riskScore: 87,
      sector: 'banking', pack: 'pdpl',
      signedAt: '٢٠٢٦/٠٧/٠٦ ١٧:٤٢', size: '142KB', createdAt: '٢٠٢٦/٠٧/٠٦',
      tags: ['audit', 'fintech'], certificateId: 'CERT-2026-0841',
      retention: '5 سنوات — PDPL م.21',
    },
    {
      id: 'EVD-2026-10492', traceId: 'AI-2026-10492',
      title: 'استعلام تلخيصي عن سياسة الإجازات',
      query: 'تلخيص لوائح الإجازات الداخلية',
      status: 'allowed', riskLevel: 'low', riskScore: 12,
      sector: 'government', pack: 'sdaia',
      signedAt: '٢٠٢٦/٠٧/٠٦ ١٧:٣٨', size: '38KB', createdAt: '٢٠٢٦/٠٧/٠٦',
      tags: ['hr'], certificateId: 'CERT-2026-0840',
      retention: 'سنتان — NCA ECC-3',
    },
    {
      id: 'EVD-2026-10491', traceId: 'AI-2026-10491',
      title: 'تشغيل نموذج على سجلات طبية',
      query: 'تحليل 580 سجل طبي مع PII متعدد',
      status: 'pending_approval', riskLevel: 'high', riskScore: 72,
      sector: 'healthcare', pack: 'sfda',
      signedAt: null, size: '86KB', createdAt: '٢٠٢٦/٠٧/٠٦',
      tags: ['medical'], certificateId: 'CERT-2026-0839',
      retention: '7 سنوات — SFDA م.19',
    },
    {
      id: 'EVD-2026-10490', traceId: 'AI-2026-10490',
      title: 'تحليل عقد مورد',
      query: 'مراجعة عقد شراء من مورّد خارجي',
      status: 'approved', riskLevel: 'medium', riskScore: 28,
      sector: 'manufacturing', pack: 'iso27001',
      signedAt: '٢٠٢٦/٠٧/٠٦ ١٧:٢٤', size: '124KB', createdAt: '٢٠٢٦/٠٧/٠٦',
      tags: ['audit'], certificateId: 'CERT-2026-0838',
      retention: '5 سنوات — ISO 27001 A.5.1',
    },
    {
      id: 'EVD-2026-10489', traceId: 'AI-2026-10489',
      title: 'استعلام لوائح البنك المركزي',
      query: 'بحث عن ضوابط SAMA الجديدة',
      status: 'allowed', riskLevel: 'low', riskScore: 18,
      sector: 'banking', pack: 'sama',
      signedAt: '٢٠٢٦/٠٧/٠٦ ١٧:٢٠', size: '42KB', createdAt: '٢٠٢٦/٠٧/٠٦',
      tags: ['fintech'], certificateId: 'CERT-2026-0837',
      retention: '5 سنوات — SAMA CSF-2',
    },
    {
      id: 'EVD-2026-10488', traceId: 'AI-2026-10488',
      title: 'دمج نموذج ثالث',
      query: 'جرّب دمج نموذج Cohere مع PII',
      status: 'pending_approval', riskLevel: 'high', riskScore: 64,
      sector: 'telecom', pack: 'nca',
      signedAt: null, size: '94KB', createdAt: '٢٠٢٦/٠٧/٠٦',
      tags: ['audit'], certificateId: 'CERT-2026-0836',
      retention: '5 سنوات — NCA ECC-2',
    },
    {
      id: 'EVD-2026-10487', traceId: 'AI-2026-10487',
      title: 'تصدير قائمة خفيفة (320)',
      query: 'تصدير قائمة 320 عميل بدون PII',
      status: 'allowed', riskLevel: 'low', riskScore: 8,
      sector: 'banking', pack: 'pdpl',
      signedAt: '٢٠٢٦/٠٧/٠٦ ١٧:٠٨', size: '28KB', createdAt: '٢٠٢٦/٠٧/٠٦',
      tags: ['fintech'], certificateId: 'CERT-2026-0835',
      retention: '5 سنوات — PDPL م.21',
    },
    {
      id: 'EVD-2026-10486', traceId: 'AI-2026-10486',
      title: 'فشل اتصال ERP',
      query: 'timeout عند محاولة جلب بيانات من SAP',
      status: 'draft', riskLevel: 'medium', riskScore: 36,
      sector: 'manufacturing', pack: 'iso42001',
      signedAt: null, size: '18KB', createdAt: '٢٠٢٦/٠٧/٠٦',
      tags: ['audit'], certificateId: '—',
      retention: 'سنتان — ISO 42001 A.7.2',
    },
    {
      id: 'EVD-2026-10485', traceId: 'AI-2026-10485',
      title: 'اختبار سيناريو تلخيصي',
      query: 'اختبار سيناريو تلخيص عمليات',
      status: 'allowed', riskLevel: 'low', riskScore: 22,
      sector: 'government', pack: 'sdaia',
      signedAt: '٢٠٢٦/٠٧/٠٦ ١٦:٥٦', size: '52KB', createdAt: '٢٠٢٦/٠٧/٠٦',
      tags: ['hr'], certificateId: 'CERT-2026-0834',
      retention: 'سنتان — SDAIA م.7',
    },
    {
      id: 'EVD-2026-10484', traceId: 'AI-2026-10484',
      title: 'استعلام عادي بدون PII',
      query: 'استعلام عام عن سياسات HR',
      status: 'allowed', riskLevel: 'low', riskScore: 8,
      sector: 'government', pack: 'iso27001',
      signedAt: '٢٠٢٦/٠٧/٠٦ ١٦:٤٨', size: '24KB', createdAt: '٢٠٢٦/٠٧/٠٦',
      tags: ['hr'], certificateId: 'CERT-2026-0833',
      retention: 'سنتان — ISO 27001 A.5.1',
    },
    {
      id: 'EVD-2026-10470', traceId: 'AI-2026-10470',
      title: 'استعلام بهوية عميل (مرفوض)',
      query: 'محاولة الوصول لبيانات عميل برقم هوية',
      status: 'blocked', riskLevel: 'critical', riskScore: 94,
      sector: 'banking', pack: 'pdpl',
      signedAt: '٢٠٢٦/٠٧/٠٦ ١٥:١٢', size: '68KB', createdAt: '٢٠٢٦/٠٧/٠٦',
      tags: ['audit', 'breach'], certificateId: 'CERT-2026-0832',
      retention: '5 سنوات — PDPL م.21',
    },
    {
      id: 'EVD-2026-10465', traceId: 'AI-2026-10465',
      title: 'تلخيص تقرير حوكمة شهري',
      query: 'تلخيص تقرير حوكمة شهري تلقائي',
      status: 'allowed', riskLevel: 'low', riskScore: 14,
      sector: 'telecom', pack: 'iso42001',
      signedAt: '٢٠٢٦/٠٧/٠٥ ١٨:٣٠', size: '76KB', createdAt: '٢٠٢٦/٠٧/٠٥',
      tags: ['audit'], certificateId: 'CERT-2026-0831',
      retention: 'سنتان — ISO 42001 A.5.2',
    },
  ];

  // ── Builders ─────────────────────────────────────────────────────────

  function buildEvidenceRows() {
    var rows = [];
    for (var i = 0; i < SEED_ITEMS.length; i += 1) {
      var s = SEED_ITEMS[i];
      rows.push({
        id: s.id, traceId: s.traceId, title: s.title, query: s.query,
        status: s.status, riskLevel: s.riskLevel, riskScore: s.riskScore,
        sector: s.sector, pack: s.pack,
        signedAt: s.signedAt, size: s.size, createdAt: s.createdAt,
        tags: s.tags.slice(), certificateId: s.certificateId, retention: s.retention,
        prevHash: '0x00000000', hash: '0x00000000',
      });
    }
    var prev = '0x00000000';
    for (var m = 0; m < rows.length; m += 1) {
      var row = rows[m];
      row.prevHash = prev;
      row.hash = fnv1a(prev + '|' + evidenceCanonical(row));
      prev = row.hash;
    }
    return rows;
  }

  function buildEvidenceStats() {
    var rows = buildEvidenceRows();
    var allowed = 0, blocked = 0, pending_approval = 0, approved = 0, draft = 0;
    var totalSizeKb = 0;
    var packs = {};
    for (var i = 0; i < rows.length; i += 1) {
      var r = rows[i];
      if (r.status === 'allowed') allowed += 1;
      else if (r.status === 'blocked') blocked += 1;
      else if (r.status === 'pending_approval') pending_approval += 1;
      else if (r.status === 'approved') approved += 1;
      else draft += 1;
      var kb = parseFloat(String(r.size || '').replace(/[^\d.]/g, ''));
      if (!isNaN(kb)) totalSizeKb += kb;
      packs[r.pack] = true;
    }
    return {
      total: rows.length,
      allowed: allowed,
      blocked: blocked,
      pending_approval: pending_approval,
      approved: approved,
      draft: draft,
      totalSizeKb: Math.round(totalSizeKb),
      packCount: Object.keys(packs).length,
    };
  }

  return {
    EVIDENCE_SEED: EVIDENCE_SEED,
    EVIDENCE_TOTAL: EVIDENCE_TOTAL,
    EVIDENCE_ALLOWED: EVIDENCE_ALLOWED,
    EVIDENCE_BLOCKED: EVIDENCE_BLOCKED,
    EVIDENCE_PENDING_APPROVAL: EVIDENCE_PENDING_APPROVAL,
    EVIDENCE_APPROVED: EVIDENCE_APPROVED,
    EVIDENCE_DRAFT: EVIDENCE_DRAFT,
    EVIDENCE_NOW: EVIDENCE_NOW,
    SECTORS: SECTORS,
    COMPLIANCE_PACKS: COMPLIANCE_PACKS,
    TAGS: TAGS,
    PACK_LABEL: PACK_LABEL,
    SECTOR_LABEL: SECTOR_LABEL,
    mulberry32: mulberry32,
    fnv1a: fnv1a,
    shuffle: shuffle,
    signatureClass: signatureClass,
    signatureText: signatureText,
    evidenceCanonical: evidenceCanonical,
    buildEvidenceRows: buildEvidenceRows,
    buildEvidenceStats: buildEvidenceStats,
  };
});
