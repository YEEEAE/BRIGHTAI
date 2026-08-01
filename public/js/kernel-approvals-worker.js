/**
 * kernel-approvals-worker.js — Web Worker for /kernel/approvals/ heavy lifting.
 *
 * M19 requirement: filtering over 162 approval rows happens OFF the main thread
 * so scrolling + keyboard navigation stay smooth. (Unlike the 12,483-row audit
 * log this is a lighter dataset, but the architecture is identical so the
 * engine + worker stay symmetric and future-proof.)
 *
 * The worker reconstructs the deterministic dataset in-process via
 * importScripts('kernel-approvals-data.js') (classic script → self.KernelApprovalsData).
 * No row payload is ever transferred over postMessage on init — the worker
 * owns its own copy, byte-identical to the main thread's (same seed).
 *
 * Protocol (request → response):
 *   { type: 'init' }                       → { type: 'init', stats, total }
 *   { type: 'filter', filters }            → { type: 'filtered', indices, total, visible }
 *   { type: 'slice', start, end }          → { type: 'slice', rows, start }
 *   { type: 'export', format }             → { type: 'export', format, rows, total }
 *   { type: 'verify', index }              → { type: 'verify', result, prev, current, next }
 *   { type: 'tamper-check', index }        → { type: 'tamper-check', result } (Demo only)
 *
 * Filters shape: { status, risk, dept, search }.
 *   - status: '' | 'pending' | 'critical' | 'review' | 'approved' | 'rejected'
 *   - risk:   '' | 'low' | 'medium' | 'high' | 'critical'  (≤30/31-60/61-85/>85)
 *   - dept:   '' | role label (تسويق/مالية/عمليات/قانونية/تقنية)
 *   - search: substring match on title / context / traceId / requesterLabel / hash
 *
 * Immutable rule (Prompt 19/20): the dataset is regenerated deterministically;
 * no fetch, no remote ledger. Hash-chain verification is re-computed locally,
 * and the tamper demo intentionally mutates a COPY and shows the link break.
 * Live decisions are client-side ledger events (new audit entries), never a
 * mutation of the sealed chain.
 *
 * CSP: worker-src 'self' blob: allows classic workers from /js/.
 */
importScripts('kernel-approvals-data.js');

'use strict';

var Data = self.KernelApprovalsData;
var rows = null;
/** Cached filtered indices (display order, newest first). Kept in-worker so
 * slice/export don't re-send indices across the boundary. */
var lastIndices = [];

function buildRows() {
  if (!rows) rows = Data.buildApprovalRows();
  return rows;
}

function riskLevel(risk) {
  if (risk <= 30) return 'low';
  if (risk <= 60) return 'medium';
  if (risk <= 85) return 'high';
  return 'critical';
}

function normalize(s) {
  return String(s == null ? '' : s).toLowerCase();
}

/**
 * Applies filters over the full dataset, returns matching indices in
 * DISPLAY order (newest first — reverse of the time-ascending build order).
 */
function filterIndices(filters) {
  var all = buildRows();
  var n = all.length;
  var f = filters || {};

  var status = f.status || '';
  var risk = f.risk || '';
  var dept = f.dept || '';
  var search = normalize(f.search);

  var indices = [];
  for (var i = 0; i < n; i += 1) {
    var r = all[i];
    if (status !== '' && r.status !== status) continue;
    if (risk !== '' && riskLevel(r.risk) !== risk) continue;
    if (dept !== '' && r.requesterRole !== dept) continue;
    if (search !== '') {
      var hay = normalize(r.title) + ' ' + r.traceId + ' ' + r.requesterLabel + ' ' + r.hash;
      if (hay.indexOf(search) === -1) continue;
    }
    indices.push(i);
  }

  // Display order: newest first.
  indices.reverse();
  return indices;
}

/** Verifies a row's chain link by re-computing hash = fnv1a(prev + '|' + canon). */
function verifyRow(all, index) {
  var r = all[index];
  var expected = Data.fnv1a(r.prevHash + '|' + Data.approvalCanonical(r));
  return { ok: expected === r.hash, expected: expected, stored: r.hash };
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
    reply(msg, { type: 'init', stats: Data.buildApprovalStats(all), total: all.length });
    return;
  }

  if (type === 'filter') {
    lastIndices = filterIndices(msg.filters);
    reply(msg, {
      type: 'filtered',
      indices: lastIndices,
      total: lastIndices.length,
      visible: lastIndices.length,
    });
    return;
  }

  if (type === 'slice') {
    // Uses the worker-cached filter result — no indices in the request.
    var idxArr = lastIndices;
    var start = msg.start | 0;
    var end = Math.min(msg.end | 0, idxArr.length);
    var sliceRows = [];
    for (var s = start; s < end; s += 1) {
      sliceRows.push(all[idxArr[s]]);
    }
    reply(msg, { type: 'slice', rows: sliceRows, start: start, total: idxArr.length });
    return;
  }

  if (type === 'export') {
    var expIdx = lastIndices;
    var expRows = [];
    for (var e = 0; e < expIdx.length; e += 1) {
      expRows.push(all[expIdx[e]]);
    }
    reply(msg, { type: 'export', format: msg.format, rows: expRows, total: expRows.length });
    return;
  }

  if (type === 'verify') {
    var idx = msg.index | 0;
    var check = verifyRow(all, idx);
    var prev = idx > 0 ? all[idx - 1] : null;
    var next = idx < all.length - 1 ? all[idx + 1] : null;
    reply(msg, {
      type: 'verify',
      result: check,
      prev: prev ? { traceId: prev.traceId, hash: prev.hash } : null,
      current: { traceId: all[idx].traceId, hash: all[idx].hash, stored: all[idx].hash },
      next: next ? { traceId: next.traceId, hash: next.hash } : null,
      index: idx,
    });
    return;
  }

  if (type === 'tamper-check') {
    // DEMO ONLY: mutate a COPY of the selected row (bump risk) and show
    // that the chain breaks. The real dataset is never mutated.
    var tidx = msg.index | 0;
    var original = all[tidx];
    var tampered = {
      ts: original.ts,
      requesterId: original.requesterId,
      requesterRole: original.requesterRole,
      title: original.title,
      risk: Math.min(99, original.risk + 13),
      status: original.status,
      traceId: original.traceId,
      slaDeadline: original.slaDeadline,
      piiFindings: original.piiFindings,
      triggeredPolicies: original.triggeredPolicies,
      whatIf: original.whatIf,
      decisionBy: original.decisionBy,
      decisionTs: original.decisionTs,
      decisionReason: original.decisionReason,
    };
    var canon = Data.approvalCanonical(tampered);
    var broken = Data.fnv1a(original.prevHash + '|' + canon) === original.hash;
    reply(msg, {
      type: 'tamper-check',
      result: { broken: !broken, tamperedField: 'risk', original: original.risk, tampered: tampered.risk },
    });
    return;
  }

  reply(msg, { type: 'error', error: 'unknown message type: ' + type });
});
