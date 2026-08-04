/**
 * kernel-time-machine.js — /kernel/replay/ interactive engine (M20 build).
 *
 * M20 — replaces the old hardcoded ROWS-10 / static-stats sample with the
 * deterministic time-machine design from تصميم-صفحات-kernel.md §9:
 *   - Setup panel: period (date range + shortcuts آخر شهر/ربع/سنة) · proposed
 *     policies (multi-select + counter) · scope (dept) · processing mode.
 *   - Results: 4-number strip (+blocked · -allowed · falsePos · net) · monthly
 *     before/after chart · side-effect amber warning · affected-departments
 *     ranked bars · affected-rows table (before → after arrow) · export memo.
 *   - Investigation tab: Trace ID → deterministic 6-step horizontal timeline.
 *
 * M20 SECURITY RULE (Prompt 20 immutable rule): the replay NEVER sends
 * historical request data to an external provider. When the user picks
 * external mode, the engine shows a consent modal (disclosure of scope +
 * count + "بيانات قد تحتوي PII") and ONLY a consenting run proceeds; local
 * mode needs no consent and is the default. The data module enforces the same
 * gate on the worker side (consentRequired=true without consent). No fetch.
 *
 * Architecture: CSP-safe external ES module, Web Worker off-main-thread
 * simulation (kernel-time-machine-worker.js) with an automatic main-thread
 * fallback, deterministic in-memory dataset (kernel-time-machine-data.js).
 *
 * DOM contract (replay.astro):
 *   [data-rp-tab="sim|invest"]           → tab buttons
 *   .rp-panel                            → tab panels
 *   [data-rp-date-from] / [data-rp-date-to] → date inputs
 *   [data-rp-shortcut]                   → period shortcut buttons
 *   [data-rp-policy-check]               → policy checkboxes
 *   [data-rp-counter]                    → "N محددة" counter
 *   [data-rp-dept]                       → dept scope select
 *   [data-rp-mode]                       → mode radio (local|external)
 *   [data-rp-run]                        → run button
 *   [data-rp-loading] / [data-rp-results] / [data-rp-empty]
 *   [data-rp-stat="blocked|allowed|falsepos|net"]
 *   [data-rp-scoped]                     → scope count chip
 *   [data-rp-source-badge]               → mode badge (محلي/خارجي)
 *   [data-rp-chart]                      → monthly bars container
 *   [data-rp-chart-table]                → reduced-motion table tbody
 *   [data-rp-warning] / [data-rp-warning-text] / [data-rp-warning-link]
 *   [data-rp-depts]                      → affected-departments rows
 *   [data-rp-tbody]                      → affected-rows table body
 *   [data-rp-table-count]
 *   [data-rp-export]                     → export memo button
 *   [data-rp-consent]                    → consent modal (dialog)
 *   [data-rp-consent-text]               → disclosure paragraph
 *   [data-rp-consent-approve] / [data-rp-consent-local] / [data-rp-consent-cancel]
 *   [data-rp-invest-input] / [data-rp-invest-run] / [data-rp-invest-empty]
 *   [data-rp-timeline] / [data-rp-timeline-wrap]
 *
 * CSP: external module only, no unsafe-inline. Data is deterministic + local.
 */
(function () {
  'use strict';

  var INIT_TIMEOUT = 3000; // worker init fallback watchdog
  var PAGE = 30; // virtualization batch for the affected table

  var worker = null;
  var workerReady = false;
  var mainThreadData = null; // KernelTimeMachineData (fallback + render source)
  var useWorker = false;

  var fullRows = null; // deterministic 520 rows (time-ascending)
  var lastResult = null; // last simulate() result (for export)
  var lastParams = null; // last simulate() params (for export)
  var pendingRun = null; // pending consent-gated run config

  var VERDICT = { allowed: 'مسموح', blocked: 'محظور' };

  // ── helpers ────────────────────────────────────────────────────────────
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&', '<': '<', '>': '>', '"': '"', "'": '&#39;' }[c];
    });
  }

  function fmtCount(n) {
    var s = String(n);
    var out = '';
    var c = 0;
    for (var i = s.length - 1; i >= 0; i -= 1) {
      out = s[i] + out;
      c += 1;
      if (c % 3 === 0 && i > 0) out = ',' + out;
    }
    return out;
  }

  // ── engine adapter: worker → main-thread fallback ──────────────────────
  var pendingReq = 0;
  function request(msg) {
    if (useWorker && workerReady) {
      return new Promise(function (resolve) {
        var id = 'r' + (++pendingReq);
        msg._id = id;
        var onMsg = function (ev) {
          if (ev.data && ev.data._id === id) {
            worker.removeEventListener('message', onMsg);
            resolve(ev.data);
          }
        };
        worker.addEventListener('message', onMsg);
        worker.postMessage(msg);
      });
    }
    return mainThreadHandle(msg);
  }

  function mainThreadHandle(msg) {
    var all = fullRows;
    var type = msg.type;
    if (type === 'init') {
      return Promise.resolve({ type: 'init', total: all.length, policies: mainThreadData.REPLAY_POLICIES });
    }
    if (type === 'simulate') {
      return Promise.resolve({ type: 'simulated', result: mainThreadData.simulateReplay(all, msg.params) });
    }
    if (type === 'investigate') {
      return Promise.resolve({
        type: 'investigated',
        stages: mainThreadData.buildTimeline(msg.traceId, all),
        found: all.some(function (r) { return r.traceId === String(msg.traceId || ''); }),
        traceId: String(msg.traceId || ''),
      });
    }
    if (type === 'export') {
      var res = mainThreadData.simulateReplay(all, msg.params);
      return Promise.resolve({ type: 'exported', memo: buildMemo(res, msg.params) });
    }
    return Promise.resolve({ type: 'error', error: 'unknown message type: ' + type });
  }

  // ── worker setup ───────────────────────────────────────────────────────
  function setupWorker() {
    try {
      if (typeof Worker === 'undefined') throw new Error('no Worker');
      worker = new Worker('/js/kernel-time-machine-worker.js');
      useWorker = true;
      workerReady = false;
      worker.addEventListener('message', function (ev) {
        if (ev.data && ev.data.type === 'init') workerReady = true;
      });
      worker.addEventListener('error', function () { switchToMainThread(); });
      setTimeout(function () {
        if (!workerReady) switchToMainThread();
      }, INIT_TIMEOUT);
    } catch (e) {
      switchToMainThread();
    }
  }

  function switchToMainThread() {
    if (!useWorker) return;
    useWorker = false;
    workerReady = false;
    if (worker) { try { worker.terminate(); } catch (e) { /* noop */ } worker = null; }
  }

  // ── boot ───────────────────────────────────────────────────────────────
  function boot() {
    if (document.documentElement.getAttribute('data-rtm-bound') === '1') return;
    document.documentElement.setAttribute('data-rtm-bound', '1');

    mainThreadData = window.KernelTimeMachineData;
    if (!mainThreadData) return;
    fullRows = mainThreadData.buildReplayRows();

    bindTabs();
    bindShortcuts();
    bindPolicies();
    bindRun();
    bindExport();
    bindInvest();
    bindConsent();
    bindAffectedTraceLinks();
    bindInvestDrawer();

    setupWorker();
    if (useWorker) {
      worker.postMessage({ type: 'init' });
    }
  }

  // ── tabs ───────────────────────────────────────────────────────────────
  function switchTab(name) {
    $all('[data-rp-tab]').forEach(function (t) {
      var on = t.getAttribute('data-rp-tab') === name;
      t.classList.toggle('active', on);
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
    });
    $all('.rp-panel').forEach(function (p) {
      p.hidden = p.id !== 'rp-panel-' + name;
    });
  }

  function bindTabs() {
    $all('[data-rp-tab]').forEach(function (t) {
      if (t.dataset.bound === '1') return;
      t.dataset.bound = '1';
      t.addEventListener('click', function () { switchTab(t.getAttribute('data-rp-tab')); });
    });
  }

  // ── setup panel ────────────────────────────────────────────────────────
  function bindShortcuts() {
    $all('[data-rp-shortcut]').forEach(function (b) {
      if (b.dataset.bound === '1') return;
      b.dataset.bound = '1';
      b.addEventListener('click', function () {
        $all('[data-rp-shortcut]').forEach(function (x) { x.classList.remove('active'); });
        b.classList.add('active');
        var range = parseInt(b.getAttribute('data-rp-range'), 10);
        var to = new Date(Date.UTC(2026, 6, 31));
        var from = new Date(to);
        if (range === 1) from = new Date(Date.UTC(2026, 6, 1));
        else if (range === 3) from = new Date(Date.UTC(2026, 4, 1));
        else if (range === 12) from = new Date(Date.UTC(2025, 6, 1));
        setDate('data-rp-date-from', from);
        setDate('data-rp-date-to', to);
      });
    });
  }

  function setDate(sel, d) {
    var input = $(sel);
    if (!input) return;
    input.value = d.getUTCFullYear() + '-' + String(d.getUTCMonth() + 1).padStart(2, '0') + '-' + String(d.getUTCDate()).padStart(2, '0');
  }

  function bindPolicies() {
    $all('[data-rp-policy-check]').forEach(function (c) {
      if (c.dataset.bound === '1') return;
      c.dataset.bound = '1';
      c.addEventListener('change', function () {
        var row = c.closest('[data-rp-policy-row]');
        if (row) row.classList.toggle('checked', c.checked);
        updateCounter();
      });
    });
  }

  function selectedPolicies() {
    return $all('[data-rp-policy-check]:checked').map(function (c) { return c.value; });
  }

  function updateCounter() {
    var n = selectedPolicies().length;
    var c = $('[data-rp-counter]');
    if (c) c.textContent = n + ' محددة';
    var run = $('[data-rp-run]');
    if (run) run.disabled = n === 0;
  }

  function currentMode() {
    var el = $('[data-rp-mode]:checked');
    return el && el.value === 'external' ? 'external' : 'local';
  }

  function currentParams() {
    var from = parseDate($('[data-rp-date-from]').value, mainThreadData.REPLAY_TS_START);
    var to = parseDate($('[data-rp-date-to]').value, mainThreadData.REPLAY_TS_END);
    if (from > to) { var t = from; from = to; to = t; }
    return {
      fromMs: from,
      toMs: to + 86399999,
      dept: $('[data-rp-dept]').value,
      policyIds: selectedPolicies(),
      mode: currentMode(),
      externalConsented: false,
    };
  }

  function parseDate(v, fallback) {
    if (!v) return fallback;
    var m = String(v).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return fallback;
    return Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  }

  // ── run ────────────────────────────────────────────────────────────────
  function bindRun() {
    var run = $('[data-rp-run]');
    if (!run || run.dataset.bound === '1') return;
    run.dataset.bound = '1';
    run.addEventListener('click', function () {
      var policies = selectedPolicies();
      if (policies.length === 0) return;
      var params = currentParams();

      if (params.mode === 'external') {
        // SECURITY: show the disclosure and require explicit consent.
        pendingRun = params;
        openConsent(params);
        return;
      }
      runSimulation(params);
    });
  }

  function runSimulation(params) {
    var loading = $('[data-rp-loading]');
    var results = $('[data-rp-results]');
    var empty = $('[data-rp-empty]');
    if (loading) loading.hidden = false;
    if (results) results.hidden = true;
    if (empty) empty.hidden = true;

    request({ type: 'simulate', params: params }).then(function (res) {
      if (!res || res.type !== 'simulated') return;
      lastResult = res.result;
      lastParams = params;
      if (loading) loading.hidden = true;
      if (results) results.hidden = false;
      renderResults(res.result);
    });
  }

  function renderResults(res) {
    if (!res || res.consentRequired) return;

    // Source badge — the consent gate's visible footprint.
    var badge = $('[data-rp-source-badge]');
    if (badge) {
      if (res.mode === 'external') {
        badge.textContent = 'مزوّد خارجي — بموافقة صريحة (محاكاة)';
        badge.className = 'rp-source-badge rp-source-badge--external';
      } else {
        badge.textContent = 'محلي — لم تُرسل أي بيانات';
        badge.className = 'rp-source-badge rp-source-badge--local';
      }
    }

    var scoped = $('[data-rp-scoped]');
    if (scoped) scoped.textContent = fmtCount(res.scoped) + ' طلب';

    animateNumber($('[data-rp-stat="blocked"]'), res.stats.extraBlocked, '+');
    animateNumber($('[data-rp-stat="allowed"]'), res.stats.extraAllowed, '-');
    animateNumber($('[data-rp-stat="falsepos"]'), res.stats.falsePos, '');
    animateNumber($('[data-rp-stat="net"]'), res.stats.net, res.stats.net >= 0 ? '+' : '');

    renderChart(res.monthly);
    renderWarning(res.warning);
    renderDepts(res.depts);
    renderRows(res.affected);

    var count = $('[data-rp-table-count]');
    if (count) count.textContent = fmtCount(res.affected.length) + ' طلب';
  }

  function animateNumber(node, target, prefix) {
    if (!node) return;
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var text = prefix + target;
    if (reduce) { node.textContent = text; return; }
    var dur = 600, t0 = null;
    function step(ts) {
      if (!t0) t0 = ts;
      var p = Math.min((ts - t0) / dur, 1);
      var val = Math.round(target * (1 - Math.pow(1 - p, 3)));
      node.textContent = prefix + val;
      if (p < 1) requestAnimationFrame(step);
      else node.textContent = text;
    }
    requestAnimationFrame(step);
  }

  function renderChart(monthly) {
    var wrap = $('[data-rp-chart]');
    if (wrap) {
      var max = 1;
      for (var i = 0; i < monthly.length; i += 1) {
        if (monthly[i].before > max) max = monthly[i].before;
        if (monthly[i].after > max) max = monthly[i].after;
      }
      wrap.innerHTML = monthly.map(function (mo) {
        var diff = mo.after - mo.before;
        var bh = Math.round((mo.before / max) * 100);
        var ah = Math.round((mo.after / max) * 100);
        return '<div class="rp-chart__group">' +
          '<div class="rp-chart__bars">' +
            '<div class="rp-chart__bar rp-chart__bar--before" style="height:' + bh + '%"></div>' +
            '<div class="rp-chart__bar rp-chart__bar--after" style="height:' + ah + '%">' +
              '<span class="rp-chart__diff ' + (diff > 0 ? 'rp-chart__diff--up' : (diff < 0 ? 'rp-chart__diff--down' : '')) + '">' +
                (diff > 0 ? '+' : '') + diff +
              '</span>' +
            '</div>' +
          '</div>' +
          '<span class="rp-chart__month">' + mo.m + '</span>' +
        '</div>';
      }).join('');
    }
    var tbl = $('[data-rp-chart-table]');
    if (tbl) {
      tbl.innerHTML = monthly.map(function (mo) {
        return '<tr><td>' + mo.m + '</td><td>' + mo.before + '</td><td>' + mo.after + '</td>' +
          '<td>' + (mo.after - mo.before >= 0 ? '+' : '') + (mo.after - mo.before) + '</td></tr>';
      }).join('');
    }
  }

  function renderWarning(warning) {
    var warn = $('[data-rp-warning]');
    if (!warn) return;
    if (warning) {
      var txt = $('[data-rp-warning-text]');
      if (txt) {
        txt.textContent = '⚠ ' + warning.policyName + ' كانت ستحظر ' +
          fmtCount(warning.count) + ' طلباً مشروعاً في قسم ' + warning.dept +
          ' (' + fmtCount(warning.falsePos) + ' إيجابية كاذبة محتملة)';
      }
      warn.hidden = false;
    } else {
      warn.hidden = true;
    }
  }

  function renderDepts(depts) {
    var wrap = $('[data-rp-depts]');
    if (!wrap) return;
    if (!depts || depts.length === 0) {
      wrap.innerHTML = '<p class="rp-depts__empty">ما فيه قسم متأثر بهذه السياسات.</p>';
      return;
    }
    var max = depts[0].affected;
    wrap.innerHTML = depts.map(function (d) {
      var pct = Math.round((d.affected / max) * 100);
      return '<div class="rp-dept-row">' +
        '<span class="rp-dept-row__name">' + escapeHtml(d.dept) + '</span>' +
        '<div class="rp-dept-row__track"><div class="rp-dept-row__bar" style="width:' + pct + '%"></div></div>' +
        '<span class="rp-dept-row__val">' + d.affected + '</span>' +
        '<span class="rp-dept-row__split">' + d.blocks + ' حظر · ' + d.released + ' إسماح</span>' +
      '</div>';
    }).join('');
  }

  function renderRows(rows) {
    var tbody = $('[data-rp-tbody]');
    if (!tbody) return;
    tbody.innerHTML = '';
    var i = 0;
    function chunk() {
      var end = Math.min(i + PAGE, rows.length);
      for (; i < end; i++) {
        var r = rows[i];
        var flip = r.before !== r.after;
        var tr = document.createElement('tr');
        tr.innerHTML =
          '<td><button type="button" class="rp-table__trace" data-rp-trace-open="' + escapeHtml(r.trace) + '" aria-label="فتح رحلة ' + escapeHtml(r.trace) + '">' + escapeHtml(r.trace) + '</button></td>' +
          '<td>' + escapeHtml(r.dept) + '</td>' +
          '<td>' + escapeHtml(r.req) + (r.falsePos ? ' <span class="rp-fp-chip">FP</span>' : '') + '</td>' +
          '<td><span class="rp-verdict-cell">' +
            '<span class="rp-verdict-cell__before ' + r.before + '">' + VERDICT[r.before] + '</span>' +
            '<span class="rp-verdict-cell__arrow' + (flip ? ' flip' : '') + '">←</span>' +
            '<span class="rp-verdict-cell__after ' + r.after + '">' + VERDICT[r.after] + '</span>' +
          '</span></td>';
        tbody.appendChild(tr);
      }
      if (i < rows.length) requestAnimationFrame(chunk);
    }
    chunk();
  }

  // M28 — replay→parent: كل trace في جدول الطلبات المتأثرة يفتح الدرج المشترك
  // (KernelTraceDrawer) بسياق الصف نفسه — مصدر الحقيقة أولًا، ثم الـ seed.
  function bindAffectedTraceLinks() {
    var tbody = $('[data-rp-tbody]');
    if (!tbody || tbody.dataset.boundTrace === '1') return;
    tbody.dataset.boundTrace = '1';
    tbody.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-rp-trace-open]');
      if (!btn) return;
      var trace = btn.getAttribute('data-rp-trace-open');
      if (!trace) return;
      var tr = btn.closest('tr');
      var dept = tr ? tr.children[1].textContent : '—';
      var req = tr ? tr.children[2].textContent.replace(/\s*FP$/, '') : '—';
      var afterCell = tr ? tr.querySelector('.rp-verdict-cell__after') : null;
      var after = afterCell ? (afterCell.textContent === 'مسموح' ? 'allowed' : 'blocked') : 'blocked';
      var seed = {
        user: req,
        dept: dept,
        model: 'NVIDIA NIM',
        time: '—',
        verdict: after,
        hashes: { prev: undefined, curr: undefined, next: undefined },
        status: after === 'allowed' ? 'مسموح' : 'محظور',
        action: 'محاكاة السياسة المقترحة',
      };
      if (window.KernelTraceDrawer && window.KernelTraceDrawer.open) {
        window.KernelTraceDrawer.open(trace, seed);
      } else {
        window.location.href = '/kernel/audit/?trace=' + encodeURIComponent(trace);
      }
    });
    tbody.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      var btn = e.target.closest('[data-rp-trace-open]');
      if (!btn) return;
      e.preventDefault();
      var trace = btn.getAttribute('data-rp-trace-open');
      if (!trace) return;
      if (window.KernelTraceDrawer && window.KernelTraceDrawer.open) {
        window.KernelTraceDrawer.open(trace);
      } else {
        window.location.href = '/kernel/audit/?trace=' + encodeURIComponent(trace);
      }
    });
  }

  // ── consent modal (M20 security gate) — Prompt 12: plain Arabic text ───
  function openConsent(params) {
    var modal = $('[data-rp-consent]');
    if (!modal) return;
    var text = $('[data-rp-consent-text]');
    if (text) {
      // Plain Arabic: "عشان نقارن السياسة الجديدة بالقديمة، نحتاج نرسل
      // <strong>N طلب قديم</strong> للنموذج." — the count is injected here.
      text.innerHTML = 'عشان نقارن السياسة الجديدة بالقديمة، نحتاج نرسل ' +
        '<strong>' + fmtCount(params.policyIds.length > 0 ? estimatedScope(params) : 0) +
        ' طلب قديم</strong> للنموذج.';
    }
    modal.hidden = false;
    modal.setAttribute('aria-hidden', 'false');
    var first = $('[data-rp-consent-local]');
    if (first) first.focus();
  }

  function estimatedScope(params) {
    var n = 0;
    for (var i = 0; i < fullRows.length; i += 1) {
      var r = fullRows[i];
      if (r.ts < params.fromMs || r.ts > params.toMs) continue;
      if (params.dept !== '' && r.dept !== params.dept) continue;
      n += 1;
    }
    return n;
  }

  function closeConsent() {
    var modal = $('[data-rp-consent]');
    if (!modal) return;
    modal.hidden = true;
    modal.setAttribute('aria-hidden', 'true');
  }

  function bindConsent() {
    var modal = $('[data-rp-consent]');
    if (!modal) return;
    var approve = $('[data-rp-consent-approve]');
    if (approve && approve.dataset.bound !== '1') {
      approve.dataset.bound = '1';
      approve.addEventListener('click', function () {
        if (!pendingRun) return;
        pendingRun.externalConsented = true;
        var p = pendingRun;
        pendingRun = null;
        closeConsent();
        runSimulation(p);
      });
    }
    var local = $('[data-rp-consent-local]');
    if (local && local.dataset.bound !== '1') {
      local.dataset.bound = '1';
      local.addEventListener('click', function () {
        if (!pendingRun) return;
        var p = pendingRun;
        pendingRun = null;
        closeConsent();
        p.mode = 'local';
        p.externalConsented = false;
        runSimulation(p);
      });
    }
    var cancel = $('[data-rp-consent-cancel]');
    if (cancel && cancel.dataset.bound !== '1') {
      cancel.dataset.bound = '1';
      cancel.addEventListener('click', function () {
        pendingRun = null;
        closeConsent();
      });
    }
    // Close on backdrop click + Escape (a11y).
    modal.addEventListener('click', function (e) {
      if (e.target === modal) { pendingRun = null; closeConsent(); }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !modal.hidden) { pendingRun = null; closeConsent(); }
    });
  }

  // ── export memo ────────────────────────────────────────────────────────
  function bindExport() {
    var exp = $('[data-rp-export]');
    if (!exp || exp.dataset.bound === '1') return;
    exp.dataset.bound = '1';
    exp.addEventListener('click', function () {
      if (!lastResult) return;
      var params = lastParams || currentParams();
      request({ type: 'export', params: params }).then(function (res) {
        if (!res || res.type !== 'exported') return;
        downloadMemo(res.memo);
      });
    });
  }

  function downloadMemo(text) {
    var blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = 'kernel-replay-memo.txt';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
  }

  // ── investigation tab ──────────────────────────────────────────────────
  function bindInvest() {
    var invRun = $('[data-rp-invest-run]');
    if (invRun && invRun.dataset.bound !== '1') {
      invRun.dataset.bound = '1';
      invRun.addEventListener('click', runInvestigation);
    }
    var input = $('[data-rp-invest-input]');
    if (input && input.dataset.bound !== '1') {
      input.dataset.bound = '1';
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') runInvestigation();
      });
    }
  }

  function runInvestigation() {
    var input = $('[data-rp-invest-input]');
    var val = (input && input.value || '').trim();
    var wrap = $('[data-rp-timeline-wrap]');
    var emptyEl = $('[data-rp-invest-empty]');
    if (!/^AI-2026-\d+$/i.test(val)) {
      if (wrap) wrap.hidden = true;
      if (emptyEl) {
        emptyEl.hidden = false;
        emptyEl.textContent = 'صيغة غير صحيحة. مثال صحيح: AI-2026-10493';
      }
      return;
    }
    if (emptyEl) emptyEl.hidden = true;
    var tl = $('[data-rp-timeline]');
    request({ type: 'investigate', traceId: val }).then(function (res) {
      if (!res || res.type !== 'investigated') return;
      if (tl) {
        tl.innerHTML = res.stages.map(function (s) {
          return '<div class="rp-tl-step">' +
            '<span class="rp-tl-step__index">' + s.i + '</span>' +
            '<span class="rp-tl-step__title">' + s.title + '</span>' +
            '<span class="rp-tl-step__meta">' + s.meta + '</span>' +
            '<span class="rp-tl-step__ts">' + s.ts + '</span>' +
            '<span class="rp-tl-step__verdict ' + s.verdict + '">' + VERDICT[s.verdict] + '</span>' +
          '</div>';
        }).join('');
      }
      if (wrap) wrap.hidden = false;
      // M28 — replay→parent: زر يفتح الرحلة المحقّقة في الدرج المشترك.
      var dl = $('[data-rp-invest-drawer]');
      if (dl) {
        if (res.found) {
          dl.hidden = false;
          dl.dataset.traceId = val;
        } else {
          dl.hidden = true;
        }
      }
    });
  }

  // M28 — replay→parent: زر «افتح الرحلة في الدرج المشترك» في تبويب التحقيق.
  function bindInvestDrawer() {
    var btn = $('[data-rp-invest-drawer]');
    if (!btn || btn.dataset.bound === '1') return;
    btn.dataset.bound = '1';
    btn.addEventListener('click', function () {
      var traceId = btn.getAttribute('data-trace-id');
      if (!traceId) return;
      if (window.KernelTraceDrawer && window.KernelTraceDrawer.open) {
        window.KernelTraceDrawer.open(traceId);
      } else {
        window.location.href = '/kernel/audit/?trace=' + encodeURIComponent(traceId);
      }
    });
  }

  document.addEventListener('astro:page-load', boot);
  if (document.readyState !== 'loading') boot();
})();
