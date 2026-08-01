/**
 * kernel-time-machine-data.js — Deterministic replay dataset, browser/Worker/Node mirror.
 *
 * Byte-for-byte algorithmic mirror of src/data/kernel-replay.ts. Loaded as a
 * classic UMD script so it works in THREE runtimes without re-writing logic:
 *   - Browser main thread  → window.KernelTimeMachineData
 *   - Web Worker           → self.KernelTimeMachineData (via importScripts)
 *   - Node (verify script) → module.exports
 *
 * Contract (must never drift — verified by scripts/verify-replay.mjs):
 *   - total     = 520
 *   - blocked   = 340
 *   - released  = 12
 *   - falsePos  = 48
 *   - untouched = 168
 *   - default full-run simulation: extraBlocked=340 · extraAllowed=12 ·
 *     falsePos=48 · net=328
 *
 * Determinism: mulberry32(REPLAY_SEED) drives every choice. Exact block counts
 * and false-positive budgets are pre-built then Fisher–Yates-shuffled with the
 * same RNG stream, so the distribution is exact AND the order is reproducible
 * across engines. Timestamps are UTC-based and formatted manually (no locale,
 * no toLocaleString).
 *
 * Security (Prompt 20, M20): the replay NEVER sends historical request data to
 * an external provider. simulateReplay() enforces a consent gate — external
 * mode without externalConsented=true returns consentRequired=true and zero
 * data. No fetch, no remote ledger.
 *
 * The hash chain (FNV-1a) seals every request-relevant field against tampering.
 * fnv1a is byte-identical to kernel-hash.js / kernel-audit-data.js /
 * kernel-datasets.ts / kernel-approvals-data.js.
 *
 * CSP: classic script from /js/ ('self'), no unsafe-inline.
 */
(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.KernelTimeMachineData = factory();
  }
})(typeof self !== 'undefined' ? self : typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var REPLAY_SEED = 0x5c0ffee0;
  var REPLAY_TOTAL = 520;
  var REPLAY_BLOCKED = 340;
  var REPLAY_RELEASED = 12;
  var REPLAY_FALSE_POS = 48;
  var REPLAY_UNTOUCHED = 168;

  var REPLAY_TS_START = Date.UTC(2026, 1, 1, 0, 0, 0);
  var REPLAY_TS_END = Date.UTC(2026, 6, 31, 23, 59, 59);

  var REPLAY_MONTHS = ['فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو'];

  var REPLAY_POLICIES = [
    { id: 'p-pii-export', name: 'حظر تصدير قوائم العملاء (PII)', pack: 'PDPL', highFalsePos: true },
    { id: 'p-medical', name: 'حظر الهوية في السياق الطبي', pack: 'SFDA', highFalsePos: false },
    { id: 'p-iban', name: 'حظر SA-IBAN في المخرجات', pack: 'SAMA', highFalsePos: false },
    { id: 'p-email', name: 'تعمية البريد الإلكتروني', pack: 'PDPL', highFalsePos: false },
    { id: 'p-prompt-inj', name: 'كشف حقن الأوامر', pack: 'NCA', highFalsePos: true },
  ];

  var REPLAY_DEPTS = ['التسويق', 'المالية', 'العمليات', 'القانونية', 'تقنية', 'الموارد البشرية'];

  var BLOCK_POLICIES = [
    { id: 'p-pii-export', count: 200, falsePosBudget: 32, dept: 'التسويق', reqs: [
      'تصدير قائمة 2,400 عميل',
      'تقرير حملة بأسماء العملاء',
      'دمج بيانات عملاء مع CRM خارجي',
      'استعلام عن شريحة عملاء بالاسم والهاتف',
    ] },
    { id: 'p-medical', count: 60, falsePosBudget: 6, dept: 'العمليات', reqs: [
      'تلخيص سجل طبي لمتابعة حالة',
      'استعلام عن سجل موظف (بيانات طبية)',
      'تحليل 580 سجل طبي مع PII',
    ] },
    { id: 'p-iban', count: 40, falsePosBudget: 4, dept: 'المالية', reqs: [
      'كشف SA-IBAN في فاتورة مورد',
      'مراجعة أرقام حسابات في عقد',
      'تسوية بنكية بتفاصيل حسابات',
    ] },
    { id: 'p-prompt-inj', count: 40, falsePosBudget: 6, dept: 'تقنية', reqs: [
      'حقن أمر تجاوز التعليمات',
      'محاولة استخراج أسرار من النموذج',
      'تجاوز قواعد الرفض عبر prompt',
    ] },
  ];

  var EMAIL_DEPTS = ['التسويق', 'الموارد البشرية', 'المالية'];
  var EMAIL_REQS = [
    'إرسال كشوف رواتب بريدياً',
    'بريد ترويجي لأسماء العملاء',
    'إرسال قائمة مرشحين بريدياً',
  ];

  var UNTOUCHED_REQS = {
    'التسويق': ['تحليل أداء حملة سابقة (مجاميع فقط)', 'استعلام عن سياسة الإجازات', 'تقرير إعلانات مجمع'],
    'المالية': ['توليد تقرير مصاريف ربعي', 'مراجعة مدفوعات داخلية', 'تلخيص مصروفات تشغيلية'],
    'العمليات': ['ملخص عقد مورد', 'جدولة صيانة', 'استعلام عن جدول إنتاج'],
    'القانونية': ['استعلام لوائح عام', 'تلخيص وثيقة منشورة', 'توليد مسودة اتفاقية قياسية'],
    'تقنية': ['استعلام SQL بسيط', 'تصدير سجلات تدقيق', 'استعلام توثيق API'],
    'الموارد البشرية': ['استعلام عن سياسة الإجازات', 'تلخيص وصف وظيفي', 'استعلام عن دليل الموظف'],
  };

  var TIMELINE_STEPS = [
    { title: 'الاستلام', meta: 'طلب مستلم، توكنز 142، عربي' },
    { title: 'فحص PII', meta: 'كُشف: هوية وطنية + جوال' },
    { title: 'تقييم المخاطر', meta: 'الدرجة 87/100 — حرج' },
    { title: 'مطابقة السياسات', meta: 'سياسة حظر تصدير PII' },
    { title: 'استدعاء النموذج', meta: 'لم يُستدعَ — حُظر قبله' },
    { title: 'توليد الدليل', meta: 'EVD + hash 0xa7c8…2c1b' },
  ];

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

  function monthIndexOf(ts) {
    return new Date(ts).getUTCMonth() - 1;
  }

  function replayCanonical(row) {
    return [
      String(row.ts),
      row.dept,
      row.req,
      row.before,
      row.after,
      row.policy,
      row.falsePos ? '1' : '0',
      row.traceId,
    ].join('|');
  }

  function buildReplayRows() {
    var rand = mulberry32(REPLAY_SEED);
    var raw = [];
    var ord = 0;

    // 1) Block rows (exact counts + exact false-positive budgets).
    for (var p = 0; p < BLOCK_POLICIES.length; p += 1) {
      var bp = BLOCK_POLICIES[p];
      var fpBudget = [];
      for (var f = 0; f < bp.count; f += 1) {
        fpBudget.push(f < bp.falsePosBudget);
      }
      shuffle(fpBudget, rand);
      for (var b = 0; b < bp.count; b += 1) {
        var tsb = REPLAY_TS_START +
          Math.floor(rand() * 6) * (30 * 86400000) +
          Math.floor(rand() * 28) * 86400000 +
          Math.floor(rand() * 24) * 3600000 +
          Math.floor(rand() * 60) * 60000;
        raw.push({
          ts: tsb,
          dept: bp.dept,
          req: bp.reqs[Math.floor(rand() * bp.reqs.length)],
          before: 'allowed',
          after: 'blocked',
          policy: bp.id,
          falsePos: fpBudget[b],
          ord: ord++,
        });
      }
    }

    // 2) Release rows (p-email masking: previously blocked → allowed).
    for (var rl = 0; rl < REPLAY_RELEASED; rl += 1) {
      var tsr = REPLAY_TS_START +
        Math.floor(rand() * 6) * (30 * 86400000) +
        Math.floor(rand() * 28) * 86400000 +
        Math.floor(rand() * 24) * 3600000 +
        Math.floor(rand() * 60) * 60000;
      raw.push({
        ts: tsr,
        dept: EMAIL_DEPTS[Math.floor(rand() * EMAIL_DEPTS.length)],
        req: EMAIL_REQS[Math.floor(rand() * EMAIL_REQS.length)],
        before: 'blocked',
        after: 'allowed',
        policy: 'p-email',
        falsePos: false,
        ord: ord++,
      });
    }

    // 3) Untouched rows (before === after, no policy applies).
    for (var u = 0; u < REPLAY_UNTOUCHED; u += 1) {
      var deptU = REPLAY_DEPTS[Math.floor(rand() * REPLAY_DEPTS.length)];
      var tsu = REPLAY_TS_START +
        Math.floor(rand() * 6) * (30 * 86400000) +
        Math.floor(rand() * 28) * 86400000 +
        Math.floor(rand() * 24) * 3600000 +
        Math.floor(rand() * 60) * 60000;
      var beforeU = rand() < 0.5 ? 'blocked' : 'allowed';
      raw.push({
        ts: tsu,
        dept: deptU,
        req: UNTOUCHED_REQS[deptU][Math.floor(rand() * UNTOUCHED_REQS[deptU].length)],
        before: beforeU,
        after: beforeU,
        policy: '',
        falsePos: false,
        ord: ord++,
      });
    }

    // 4) Sort time-ascending, tie-broken by `ord` (engine-stable).
    raw.sort(function (a, b) { return (a.ts - b.ts) || (a.ord - b.ord); });

    var rows = [];
    for (var i = 0; i < REPLAY_TOTAL; i += 1) {
      var r = raw[i];
      rows.push({
        index: i,
        ts: r.ts,
        tsLabel: formatTsLabel(r.ts),
        tsDate: formatTsDate(r.ts),
        traceId: 'AI-2026-' + String(10000 + (REPLAY_TOTAL - 1 - i)),
        dept: r.dept,
        req: r.req,
        before: r.before,
        after: r.after,
        policy: r.policy,
        falsePos: r.falsePos,
        prevHash: '0x00000000',
        hash: '0x00000000',
      });
    }

    // 5) Hash chain (time-ascending).
    var prev = '0x00000000';
    for (var h = 0; h < REPLAY_TOTAL; h += 1) {
      var row = rows[h];
      row.prevHash = prev;
      row.hash = fnv1a(prev + '|' + replayCanonical(row));
      prev = row.hash;
    }

    return rows;
  }

  function simulateReplay(rows, params) {
    var mode = params.mode === 'external' ? 'external' : 'local';
    var policyIds = params.policyIds || [];
    var dept = params.dept || '';

    var zero = { extraBlocked: 0, extraAllowed: 0, falsePos: 0, net: 0 };
    if (mode === 'external' && !params.externalConsented) {
      return {
        consentRequired: true,
        mode: mode,
        scoped: 0,
        stats: zero,
        monthly: REPLAY_MONTHS.map(function (m) { return { m: m, before: 0, after: 0 }; }),
        affected: [],
        depts: [],
        warning: null,
      };
    }

    var from = params.fromMs;
    var to = params.toMs;
    var monthly = REPLAY_MONTHS.map(function (m) { return { m: m, before: 0, after: 0 }; });
    var affected = [];
    var deptAgg = {};
    var scoped = 0;
    var extraBlocked = 0;
    var extraAllowed = 0;
    var falsePos = 0;

    var policySet = {};
    for (var pi = 0; pi < policyIds.length; pi += 1) policySet[policyIds[pi]] = true;

    for (var rl2 = 0; rl2 < rows.length; rl2 += 1) {
      var rr = rows[rl2];
      if (rr.ts < from || rr.ts > to) continue;
      if (dept !== '' && rr.dept !== dept) continue;
      scoped += 1;

      var verdict = policySet[rr.policy] === true ? rr.after : rr.before;
      var mi = monthIndexOf(rr.ts);
      if (mi >= 0 && mi < monthly.length) {
        if (rr.before === 'blocked') monthly[mi].before += 1;
        if (verdict === 'blocked') monthly[mi].after += 1;
      }

      if (rr.before === 'allowed' && verdict === 'blocked') {
        extraBlocked += 1;
      } else if (rr.before === 'blocked' && verdict === 'allowed') {
        extraAllowed += 1;
      }
      if (verdict === 'blocked' && rr.falsePos) falsePos += 1;

      if (rr.before !== verdict) {
        affected.push({
          trace: rr.traceId,
          dept: rr.dept,
          req: rr.req,
          before: rr.before,
          after: verdict,
          policy: rr.policy,
          falsePos: rr.falsePos,
        });
        if (!deptAgg[rr.dept]) {
          deptAgg[rr.dept] = { dept: rr.dept, affected: 0, blocks: 0, released: 0 };
        }
        var agg = deptAgg[rr.dept];
        agg.affected += 1;
        if (rr.before === 'allowed' && verdict === 'blocked') agg.blocks += 1;
        else if (rr.before === 'blocked' && verdict === 'allowed') agg.released += 1;
      }
    }

    var deptKeys = [];
    for (var dk in deptAgg) {
      if (Object.prototype.hasOwnProperty.call(deptAgg, dk)) deptKeys.push(deptAgg[dk]);
    }
    var depts = deptKeys.sort(function (a, b) { return b.affected - a.affected; });

    var warning = null;
    for (var pw = 0; pw < REPLAY_POLICIES.length; pw += 1) {
      var pol = REPLAY_POLICIES[pw];
      if (!pol.highFalsePos) continue;
      if (policySet[pol.id] !== true) continue;
      var fpW = 0;
      var legitW = 0;
      var deptHits = {};
      for (var aw = 0; aw < affected.length; aw += 1) {
        var aa = affected[aw];
        if (aa.policy !== pol.id) continue;
        if (aa.after === 'blocked') {
          if (aa.falsePos) fpW += 1;
          else legitW += 1;
        }
        deptHits[aa.dept] = (deptHits[aa.dept] || 0) + 1;
      }
      if (fpW === 0) continue;
      var topDept = '';
      var topCount = -1;
      for (var td in deptHits) {
        if (Object.prototype.hasOwnProperty.call(deptHits, td) && deptHits[td] > topCount) {
          topCount = deptHits[td];
          topDept = td;
        }
      }
      if (!warning || fpW > warning.falsePos) {
        warning = { policyId: pol.id, policyName: pol.name, count: legitW, falsePos: fpW, dept: topDept };
      }
    }

    return {
      consentRequired: false,
      mode: mode,
      scoped: scoped,
      stats: { extraBlocked: extraBlocked, extraAllowed: extraAllowed, falsePos: falsePos, net: extraBlocked - extraAllowed },
      monthly: monthly,
      affected: affected,
      depts: depts,
      warning: warning,
    };
  }

  function buildTimeline(traceId, rows) {
    var id = String(traceId || '');
    var seedHash = parseInt(fnv1a(id).slice(2), 16);
    var rand = mulberry32(seedHash >>> 0);

    var finalVerdict = 'allowed';
    if (rows) {
      for (var fr = 0; fr < rows.length; fr += 1) {
        if (rows[fr].traceId === id) {
          finalVerdict = rows[fr].after === 'blocked' ? 'blocked' : 'allowed';
          break;
        }
      }
    }

    var t0 = [0, 4, 12, 18, 34, 58];
    var stages = [];
    for (var ts = 0; ts < TIMELINE_STEPS.length; ts += 1) {
      var st = TIMELINE_STEPS[ts];
      var verdict = ts < 2 ? 'allowed' : (finalVerdict === 'blocked' && ts >= 2 ? 'blocked' : (ts === 5 ? 'blocked' : 'allowed'));
      stages.push({
        i: String(ts + 1),
        title: st.title,
        ts: 'T+' + (t0[ts] + Math.floor(rand() * 3)) + 'ms',
        meta: st.meta,
        verdict: verdict,
      });
    }
    return stages;
  }

  return {
    REPLAY_SEED: REPLAY_SEED,
    REPLAY_TOTAL: REPLAY_TOTAL,
    REPLAY_BLOCKED: REPLAY_BLOCKED,
    REPLAY_RELEASED: REPLAY_RELEASED,
    REPLAY_FALSE_POS: REPLAY_FALSE_POS,
    REPLAY_UNTOUCHED: REPLAY_UNTOUCHED,
    REPLAY_TS_START: REPLAY_TS_START,
    REPLAY_TS_END: REPLAY_TS_END,
    REPLAY_MONTHS: REPLAY_MONTHS,
    REPLAY_POLICIES: REPLAY_POLICIES,
    REPLAY_DEPTS: REPLAY_DEPTS,
    mulberry32: mulberry32,
    fnv1a: fnv1a,
    formatTsLabel: formatTsLabel,
    formatTsDate: formatTsDate,
    replayCanonical: replayCanonical,
    buildReplayRows: buildReplayRows,
    simulateReplay: simulateReplay,
    buildTimeline: buildTimeline,
  };
});
