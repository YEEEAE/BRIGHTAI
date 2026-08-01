/**
 * kernel-time-machine-worker.js — Web Worker for /kernel/replay/ heavy lifting.
 *
 * M20 requirement: the replay simulation over 520 historical requests (and the
 * timeline reconstruction) runs OFF the main thread so the UI stays responsive
 * and the scroll of the affected-rows table stays smooth.
 *
 * The worker reconstructs the deterministic dataset in-process via
 * importScripts('kernel-time-machine-data.js') (classic script →
 * self.KernelTimeMachineData). No row payload is ever transferred over
 * postMessage on init — the worker owns its own copy, byte-identical to the
 * main thread's (same seed).
 *
 * Protocol (request → response):
 *   { type: 'init' }                                  → { type: 'init', total, policies, depts, months }
 *   { type: 'simulate', params }                      → { type: 'simulated', result }
 *   { type: 'investigate', traceId, all? }            → { type: 'investigated', stages, found }
 *   { type: 'export', params }                        → { type: 'exported', memo }
 *   { type: 'verify', index }                         → { type: 'verify', result, prev, current, next }
 *   { type: 'tamper-check', index }                   → { type: 'tamper-check', result } (Demo only)
 *
 * Params shape (simulate): { fromMs, toMs, dept, policyIds, mode, externalConsented }.
 *
 * Security rule (Prompt 20, M20): the replay NEVER sends historical request
 * data to an external provider. simulateReplay() returns consentRequired=true
 * when external mode is requested without explicit consent — the worker never
 * performs any network call, period. The consent modal lives in the engine.
 *
 * CSP: worker-src 'self' blob: allows classic workers from /js/.
 */
importScripts('kernel-time-machine-data.js');

'use strict';

var Data = self.KernelTimeMachineData;
var rows = null;

function buildRows() {
  if (!rows) rows = Data.buildReplayRows();
  return rows;
}

/** Echoes the request `_id` so the main-thread request() promise resolves. */
function reply(msg, payload) {
  var out = payload || {};
  out._id = msg._id;
  self.postMessage(out);
}

self.addEventListener('message', function (ev) {
  var msg = ev.data || {};
  var type = msg.type;
  var all = buildRows();

  if (type === 'init') {
    reply(msg, {
      type: 'init',
      total: all.length,
      policies: Data.REPLAY_POLICIES,
      depts: Data.REPLAY_DEPTS,
      months: Data.REPLAY_MONTHS,
    });
    return;
  }

  if (type === 'simulate') {
    var result = Data.simulateReplay(all, msg.params || {});
    reply(msg, { type: 'simulated', result: result });
    return;
  }

  if (type === 'investigate') {
    var stages = Data.buildTimeline(msg.traceId, all);
    var found = false;
    for (var i = 0; i < all.length; i += 1) {
      if (all[i].traceId === String(msg.traceId || '')) { found = true; break; }
    }
    reply(msg, { type: 'investigated', stages: stages, found: found, traceId: String(msg.traceId || '') });
    return;
  }

  if (type === 'export') {
    var result2 = Data.simulateReplay(all, msg.params || {});
    var memo = buildMemo(result2, msg.params || {});
    reply(msg, { type: 'exported', memo: memo });
    return;
  }

  if (type === 'verify') {
    var idx = msg.index | 0;
    var r = all[idx];
    var expected = Data.fnv1a(r.prevHash + '|' + Data.replayCanonical(r));
    var prev = idx > 0 ? all[idx - 1] : null;
    var next = idx < all.length - 1 ? all[idx + 1] : null;
    reply(msg, {
      type: 'verify',
      result: { ok: expected === r.hash, expected: expected, stored: r.hash },
      prev: prev ? { traceId: prev.traceId, hash: prev.hash } : null,
      current: { traceId: all[idx].traceId, hash: all[idx].hash, stored: all[idx].hash },
      next: next ? { traceId: next.traceId, hash: next.hash } : null,
      index: idx,
    });
    return;
  }

  if (type === 'tamper-check') {
    // DEMO ONLY: mutate a COPY of the selected row (bump the count) and show
    // that the chain breaks. The real dataset is never mutated.
    var tidx = msg.index | 0;
    var original = all[tidx];
    var tampered = {
      ts: original.ts,
      dept: original.dept,
      req: original.req,
      before: original.before,
      after: original.after,
      policy: original.policy,
      falsePos: original.falsePos,
      traceId: original.traceId,
    };
    tampered.req = tampered.req + ' (معدّل)';
    var broken = Data.fnv1a(original.prevHash + '|' + Data.replayCanonical(tampered)) === original.hash;
    reply(msg, {
      type: 'tamper-check',
      result: { broken: !broken, tamperedField: 'req', original: original.req, tampered: tampered.req },
    });
    return;
  }

  reply(msg, { type: 'error', error: 'unknown message type: ' + type });
});

/** Decision memo — deterministic text derived from the simulation result. */
function buildMemo(result, params) {
  if (!result || result.consentRequired) {
    return 'BrightAI Kernel — مذكرة قرار\n' +
      'لم يُنفَّذ التشغيل الخارجي بدون موافقة صريحة.\n';
  }
  var from = Data.formatTsLabel(params.fromMs);
  var to = Data.formatTsLabel(params.toMs);
  var line = [];
  line.push('BrightAI Kernel — مذكرة قرار (بيانات توضيحية)');
  line.push('الفترة: ' + from + ' → ' + to);
  line.push('النطاق: ' + (params.dept ? params.dept : 'كل الأقسام'));
  line.push('وضع المعالجة: ' + (params.mode === 'external' ? 'مزوّد خارجي (بموافقة صريحة)' : 'محلي — لم تُرسل بيانات'));
  line.push('');
  line.push('الملخص التنفيذي:');
  line.push('إعادة تشغيل السياسات المقترحة على ' + result.scoped + ' طلب تاريخي أظهرت زيادة ' +
    result.stats.extraBlocked + ' حظر إضافي و' + result.stats.falsePos + ' إيجابية كاذبة محتملة.');
  line.push('');
  line.push('الأرقام:');
  line.push('  • كان سيُحظر إضافياً: +' + result.stats.extraBlocked);
  line.push('  • كان سيُسمح إضافياً: -' + result.stats.extraAllowed);
  line.push('  • إيجابية كاذبة محتملة: ' + result.stats.falsePos);
  line.push('  • صافي الأثر: +' + result.stats.net);
  line.push('');
  line.push('الأقسام الأكثر تأثراً:');
  for (var i = 0; i < result.depts.length; i += 1) {
    var d = result.depts[i];
    line.push('  • ' + d.dept + ': ' + d.affected + ' طلب (' + d.blocks + ' حظر، ' + d.released + ' إسماح)');
  }
  if (result.warning) {
    line.push('');
    line.push('تحذير الأثر الجانبي:');
    line.push('  • ' + result.warning.policyName + ' كانت ستحظر ' + result.warning.count +
      ' طلباً مشروعاً في قسم ' + result.warning.dept + ' (' + result.warning.falsePos + ' إيجابية كاذبة).');
  }
  return line.join('\n') + '\n';
}
