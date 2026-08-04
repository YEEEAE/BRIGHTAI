/**
 * kernel-approvals.js — /kernel/approvals/ interactive engine (M19 build).
 *
 * M19 — replaces the old REPORTS-15 tabs/cards/demo with the queue
 * list/detail design from تصميم-صفحات-kernel.md §8:
 *   - Five status cards (7 معلقة · 3 حرجة · 2 مراجعة · 142 موافقة · 8 رفض),
 *     clickable as filters; the active one gets a colored border.
 *   - List/detail: right column (380px) = request cards, left = detail panel.
 *   - Request card: 3px risk border · 40px mini risk counter · 2-line title ·
 *     requester + dept · thin decreasing SLA bar (red under 20%) · trace badge.
 *   - Detail panel: full request · colorized PII findings · triggered policies ·
 *     "ماذا لو وافقت" impact card (3 points) · mandatory reason on reject with
 *     auto-suggest · three big buttons: وافق / ارفض / حوّل (تفويض).
 *   - Keyboard batch: J/K move, A approve, R reject, F transfer, Space preview,
 *     ? toggles the shortcuts hint.
 *
 * M19.1 (2026-08-01) — upgrades requested by the prompt:
 *   - full Trace: any Trace ID in the detail opens the journey drawer.
 *   - delegate: transfer is a real delegation — a target reviewer select is
 *     shown in the modal when action === 'transfer', and the chosen assignee is
 *     recorded as the new recipient in the ledger event.
 *   - suggested reason مع مراجعة بشرية: the auto-suggest fills the reason field
 *     AND reveals a badge «اقتراح آلي — راجعه قبل التأكيد», so the human
 *     reviews before confirming.
 *   - Audit · Trace · Evidence · Certificate: each decision ledger entry now
 *     emits concrete, ticking references (event ID, evidence hash, certificate)
 *     instead of static text, and every decision is immutable in the ledger.
 *
 * Immutable rule (Prompt 20): every decision appends a NEW Audit event to the
 * on-page decision ledger (client-side demo ledger — the sealed hash chain of
 * kernel-approvals-data.js is never mutated). The ledger only ever grows.
 * M-A14 undo (2026-08-04): within the 10s undo window, the LAST session entry
 * may be rolled back (removed from the on-page session list) via the shared
 * #k-toast — the sealed chain is never touched, and no entry older than the
 * most recent decision can be undone.
 *
 * Architecture: CSP-safe external ES module, Web Worker off-main-thread
 * filtering (kernel-approvals-worker.js) with an automatic main-thread
 * fallback, deterministic in-memory dataset.
 *
 * DOM contract (approvals.astro):
 *   [data-kernel-loading]              → .kernel-main wrapper
 *   [data-kap-filters]                 → status filter cards container
 *   [data-kap-filter="pending|critical|review|approved|rejected|all"]
 *   [data-kap-filter-count="<status>"] → the count badge inside a card
 *   [data-kap-list]                    → right column queue (380px)
 *   [data-kap-detail]                  → left detail panel
 *   [data-kap-ledger]                  → decision ledger list (ol)
 *   [data-kap-shortcuts]               → keyboard shortcuts overlay
 *   [data-kap-modal]                   → decision modal (approve/reject/transfer)
 *   [data-kap-empty]                   → empty state
 *   [data-kap-modal-delegate-field]    → transfer target select wrapper (hidden by default)
 *   [data-kap-modal-delegate]          → transfer target select
 *   [data-kap-modal-suggest-badge]     → «اقتراح آلي — راجعه قبل التأكيد» hint
 *
 * CSP: external module only, no unsafe-inline. Data is deterministic + local.
 */
(function () {
  'use strict';

  var SEARCH_DEBOUNCE = 200;
  var INIT_TIMEOUT = 3000; // worker init fallback watchdog
  var SLA_RED = 0.2; // SLA bar turns red under 20% remaining

  var worker = null;
  var workerReady = false;
  var mainThreadData = null; // KernelApprovalsData (fallback + render source)
  var useWorker = false;

  var fullRows = null; // deterministic 162 rows (build order, time-ascending)
  var filteredIndices = []; // display order (newest first)

  var filters = { status: '', risk: '', dept: '', search: '' };
  var activeFilter = 'pending'; // default status card (actionable queue)
  var selectedIndex = -1; // real index of the row shown in the detail panel

  // Client-side demo audit events. Immutable: only ever appended (unshift).
  var decisionLedger = [];
  var ledgerSeq = 0; // deterministic audit event counter for the session

  // ── helpers ────────────────────────────────────────────────────────────
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  function statusLabel(s) {
    if (s === 'pending') return 'معلقة';
    if (s === 'critical') return 'حرجة';
    if (s === 'review') return 'قيد المراجعة';
    if (s === 'approved') return 'موافقة';
    if (s === 'rejected') return 'رفض';
    return 'غير معروف';
  }

  function riskLevel(risk) {
    if (risk <= 30) return 'low';
    if (risk <= 60) return 'medium';
    if (risk <= 85) return 'high';
    return 'critical';
  }

  function riskBorderClass(score) {
    if (score >= 85) return 'kernel-ap-card--critical';
    if (score >= 60) return 'kernel-ap-card--high';
    return 'kernel-ap-card--medium';
  }

  function riskBadgeClass(score) {
    if (score > 85) return 'kernel-risk-badge--critical';
    if (score >= 60) return 'kernel-risk-badge--high';
    if (score >= 30) return 'kernel-risk-badge--medium';
    return 'kernel-risk-badge--low';
  }

  function piiTypeClass(type) {
    if (type === 'medical') return 'kernel-ap-pii--medical';
    if (type === 'financial') return 'kernel-ap-pii--financial';
    if (type === 'id') return 'kernel-ap-pii--id';
    if (type === 'phone') return 'kernel-ap-pii--phone';
    if (type === 'email') return 'kernel-ap-pii--email';
    if (type === 'address') return 'kernel-ap-pii--address';
    if (type === 'name') return 'kernel-ap-pii--name';
    return 'kernel-ap-pii--none';
  }

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

  function safeCopy(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).catch(function () { return fallbackCopy(text); });
    }
    return Promise.resolve(fallbackCopy(text));
  }
  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (e) { /* noop */ }
    document.body.removeChild(ta);
  }

  function hash8(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i += 1) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return '0x' + (h >>> 0).toString(16).padStart(8, '0');
  }

  // ── engine adapter: worker → main-thread fallback ──────────────────────
  var pendingFilterReq = 0;
  function request(msg) {
    if (useWorker && workerReady) {
      return new Promise(function (resolve) {
        var id = 'r' + (++pendingFilterReq);
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

  function mainThreadFilter(all, f) {
    var status = f.status || '', risk = f.risk || '', dept = f.dept || '';
    var search = String(f.search || '').toLowerCase();
    var indices = [];
    for (var i = 0; i < all.length; i += 1) {
      var r = all[i];
      if (status !== '' && r.status !== status) continue;
      if (risk !== '' && riskLevel(r.risk) !== risk) continue;
      if (dept !== '' && r.requesterRole !== dept) continue;
      if (search !== '') {
        var hay = (r.title + ' ' + r.traceId + ' ' + r.requesterLabel + ' ' + r.hash).toLowerCase();
        if (hay.indexOf(search) === -1) continue;
      }
      indices.push(i);
    }
    indices.reverse(); // newest first (display order)
    return indices;
  }

  function mainThreadHandle(msg) {
    var all = fullRows;
    var type = msg.type;
    if (type === 'init') {
      return Promise.resolve({ type: 'init', stats: mainThreadData.buildApprovalStats(all), total: all.length });
    }
    if (type === 'filter') {
      filteredIndices = mainThreadFilter(all, msg.filters);
      return Promise.resolve({ type: 'filtered', indices: filteredIndices.slice(), total: filteredIndices.length, visible: filteredIndices.length });
    }
    if (type === 'verify') {
      var idx = msg.index | 0;
      return Promise.resolve({ type: 'verify', result: verifyRowLocal(all, idx), index: idx });
    }
    if (type === 'tamper-check') {
      var t = msg.index | 0;
      var o = all[t];
      var tampered = {
        ts: o.ts, requesterId: o.requesterId, requesterRole: o.requesterRole, title: o.title,
        risk: Math.min(99, o.risk + 13), status: o.status, traceId: o.traceId,
        slaDeadline: o.slaDeadline, piiFindings: o.piiFindings, triggeredPolicies: o.triggeredPolicies,
        whatIf: o.whatIf, decisionBy: o.decisionBy, decisionTs: o.decisionTs, decisionReason: o.decisionReason,
      };
      var broken = mainThreadData.fnv1a(o.prevHash + '|' + mainThreadData.approvalCanonical(tampered)) === o.hash;
      return Promise.resolve({ type: 'tamper-check', result: { broken: !broken, tamperedField: 'risk', original: o.risk, tampered: Math.min(99, o.risk + 13) } });
    }
    return Promise.resolve({ type: 'error', error: 'unknown message type: ' + type });
  }

  function verifyRowLocal(all, index) {
    var r = all[index];
    var expected = mainThreadData.fnv1a(r.prevHash + '|' + mainThreadData.approvalCanonical(r));
    return { ok: expected === r.hash, expected: expected, stored: r.hash };
  }

  // ── worker setup ───────────────────────────────────────────────────────
  function setupWorker() {
    try {
      if (typeof Worker === 'undefined') throw new Error('no Worker');
      worker = new Worker('/js/kernel-approvals-worker.js');
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
    if (fullRows) initAfterData();
  }

  // ── boot ───────────────────────────────────────────────────────────────
  function boot() {
    var main = $('[data-kernel-loading]');
    if (!main) return;
    if (main.getAttribute('data-ap-bound') === '1') return;
    main.setAttribute('data-ap-bound', '1');

    mainThreadData = window.KernelApprovalsData;
    if (!mainThreadData) return; // data script missing → keep skeleton
    fullRows = mainThreadData.buildApprovalRows();

    bindFilters();
    bindSearch();
    bindLedgerEvents();
    bindShortcuts();
    bindShortcutsBtn();
    bindModal();
    bindEmptyReset();

    setupWorker();
    if (useWorker) {
      worker.postMessage({ type: 'init' });
    } else {
      initAfterData();
    }
  }

  function initAfterData() {
    if (!fullRows) return;
    request({ type: 'filter', filters: { status: activeFilter, risk: '', dept: '', search: '' } }).then(handleFiltered);
  }

  function handleFiltered(res) {
    if (!res || res.type !== 'filtered') return;
    if (Array.isArray(res.indices)) filteredIndices = res.indices;
    reveal();
    renderList();
    renderDetail();
    updateFilterCounts();
    updateLedger();
  }

  function checkDemoMode() {
    var pill = $('[data-kernel-demo-pill]');
    var isDemo = pill ? pill.getAttribute('aria-pressed') !== 'false' : true;
    var emptyState = $('[data-kernel-empty]');
    var filtersBar = $('[data-kap-filters]');
    var toolbar = $('.kernel-ap-toolbar');
    var layout = $('.kernel-ap-layout');
    var ledger = $('.kernel-ap-ledger-wrap');

    if (emptyState) emptyState.hidden = isDemo;
    if (filtersBar) filtersBar.hidden = !isDemo;
    if (toolbar) toolbar.hidden = !isDemo;
    if (layout) layout.hidden = !isDemo;
    if (ledger) ledger.hidden = !isDemo;
  }

  function reveal() {
    var main = $('[data-kernel-loading]');
    if (!main || !main.hasAttribute('data-kernel-loading')) return;
    var skel = main.querySelector('[data-kernel-skeleton]');
    if (skel) skel.hidden = true;
    main.removeAttribute('data-kernel-loading');
    checkDemoMode();
  }

  document.addEventListener('kernel:demo-toggle', function () {
    checkDemoMode();
  });

  // ── status filter cards ────────────────────────────────────────────────
  function bindFilters() {
    var container = $('[data-kap-filters]');
    if (!container || container.dataset.bound === '1') return;
    container.dataset.bound = '1';
    container.addEventListener('click', function (e) {
      var card = e.target.closest('[data-kap-filter]');
      if (!card) return;
      var status = card.getAttribute('data-kap-filter');
      setActiveFilter(status);
      request({ type: 'filter', filters: { status: status, risk: '', dept: '', search: filters.search } }).then(handleFiltered);
    });
  }

  function setActiveFilter(status) {
    activeFilter = status;
    filters.status = status;
    $all('[data-kap-filter]').forEach(function (card) {
      var on = card.getAttribute('data-kap-filter') === status;
      card.setAttribute('aria-pressed', on ? 'true' : 'false');
      card.classList.toggle('kernel-ap-filter--active', on);
    });
  }

  function updateFilterCounts() {
    var stats = mainThreadData.buildApprovalStats(fullRows);
    var counts = {
      pending: stats.pending,
      critical: stats.critical,
      review: stats.review,
      approved: stats.approved,
      rejected: stats.rejected,
    };
    Object.keys(counts).forEach(function (key) {
      var el = $('[data-kap-filter-count="' + key + '"]');
      if (el) el.textContent = fmtCount(counts[key]);
    });
  }

  // ── queue list (right column, 380px) ───────────────────────────────────
  function renderList() {
    var list = $('[data-kap-list]');
    if (!list) return;
    list.innerHTML = '';
    if (filteredIndices.length === 0) {
      var empty = $('[data-kap-empty]');
      if (empty) empty.hidden = false;
      var detail = $('[data-kap-detail]');
      if (detail) detail.innerHTML = '';
      return;
    }
    var emptyEl = $('[data-kap-empty]');
    if (emptyEl) emptyEl.hidden = true;

    filteredIndices.forEach(function (realIndex, pos) {
      var r = fullRows[realIndex];
      var sla = renderSlaBar(r);
      var card = document.createElement('article');
      card.className = 'kernel-ap-card ' + riskBorderClass(r.risk);
      card.setAttribute('data-kap-card', String(realIndex));
      card.setAttribute('data-pos', String(pos));
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.setAttribute('aria-pressed', realIndex === selectedIndex ? 'true' : 'false');
      card.innerHTML =
        '<div class="kernel-ap-card__top">' +
          '<span class="kernel-ap-card__risk" aria-label="درجة المخاطر ' + r.risk + '">' + r.risk + '</span>' +
          '<div class="kernel-ap-card__snippet">' +
            '<h3 class="kernel-ap-card__title">' + escapeHtml(r.title) + '</h3>' +
            '<div class="kernel-ap-card__meta">' +
              '<span class="kernel-ap-card__requester">' + escapeHtml(r.requesterLabel) + '</span>' +
              '<span class="kernel-ap-card__dept">' + escapeHtml(r.requesterRole) + '</span>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="kernel-ap-card__sla">' + sla + '</div>' +
        '<div class="kernel-ap-card__foot">' +
          '<span class="kernel-ap-card__trace">' + escapeHtml(r.traceId) + '</span>' +
          '<span class="kernel-ap-card__status">' + statusLabel(r.status) + '</span>' +
        '</div>';

      card.addEventListener('click', function () { selectCard(realIndex); });
      card.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          selectCard(realIndex);
        }
      });
      list.appendChild(card);
    });

    if (selectedIndex === -1 && filteredIndices.length > 0) {
      selectCard(filteredIndices[0]);
    } else if (filteredIndices.indexOf(selectedIndex) === -1) {
      selectCard(filteredIndices[0]);
    }
  }

  function renderSlaBar(r) {
    var sla = r.slaHours === null || r.slaDeadline === null;
    if (sla) return '<span class="kernel-ap-card__sla--none">لا مهلة</span>';
    var pct = mainThreadData.slaPctLeft(r);
    var pctDisplay = Math.max(0, Math.round(pct * 100));
    var cls = pct <= SLA_RED ? 'kernel-ap-sla--danger' : 'kernel-ap-sla--ok';
    var label = pct <= 0 ? 'منتهية المهلة' : (pct <= SLA_RED ? 'متبقي ' + pctDisplay + '%' : 'SLA ' + pctDisplay + '%');
    return '<span class="kernel-ap-sla"><span class="kernel-ap-sla__track"><span class="kernel-ap-sla__fill ' + cls + '" style="inline-size:' + pctDisplay + '%"></span></span><span class="kernel-ap-sla__label">' + label + '</span></span>';
  }

  function selectCard(realIndex) {
    if (realIndex === selectedIndex) return;
    selectedIndex = realIndex;
    renderList(); // refresh aria-pressed
    renderDetail();
  }

  // ── full Trace (فتح درج الرحلة من أي Trace في الصفحة) ────────────────
  function openTraceDrawer(traceId) {
    if (!traceId) return;
    var drawer = document.getElementById('k-trace-drawer');
    if (drawer) {
      var idEl = drawer.querySelector('[data-kernel-trace-id]');
      if (idEl) idEl.textContent = traceId;
      drawer.setAttribute('aria-hidden', 'false');
      return;
    }
    var ev = new CustomEvent('kerneltrace:open', { detail: { traceId: traceId } });
    document.dispatchEvent(ev);
  }

  function bindDetailTrace() {
    var detail = $('[data-kap-detail]');
    if (!detail) return;
    $all('[data-trace-id]', detail).forEach(function (el) {
      if (el.dataset.boundTrace === '1') return;
      el.dataset.boundTrace = '1';
      el.addEventListener('click', function (e) {
        e.preventDefault();
        openTraceDrawer(el.getAttribute('data-trace-id') || undefined);
      });
      el.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openTraceDrawer(el.getAttribute('data-trace-id') || undefined);
        }
      });
    });
  }

  // ── suggestion helpers (مراجعة بشرية إلزامية) ─────────────────────────
  function getSuggestionText(r) {
    return r.risk >= 85
      ? 'يحتوي PII حساسًا أو أثرًا عالي المخاطر — يستوجب الرفض مع تصعيد.'
      : 'الطلب متوافق مع سياسة PII والغرض مشروع.';
  }

  function showSuggestBadge(badge) {
    if (badge) badge.hidden = false;
  }

  // ── detail panel (left) ────────────────────────────────────────────────
  function renderDetail() {
    var detail = $('[data-kap-detail]');
    if (!detail) return;
    if (selectedIndex === -1 || !fullRows[selectedIndex]) {
      detail.innerHTML = '<p class="kernel-ap-detail__placeholder">اختر طلبًا من القائمة لعرض تفاصيله.</p>';
      return;
    }
    var r = fullRows[selectedIndex];
    var isActionable = r.status === 'pending' || r.status === 'critical' || r.status === 'review';

    var pii = r.piiFindings.length
      ? r.piiFindings.map(function (p) {
          return '<span class="kernel-ap-pii ' + piiTypeClass(p.type) + '">' + escapeHtml(p.label) + '</span>';
        }).join('')
      : '<span class="kernel-ap-pii kernel-ap-pii--none">لا PII</span>';

    var policies = r.triggeredPolicies.length
      ? r.triggeredPolicies.map(function (p) { return '<span class="kernel-ap-policy">' + escapeHtml(p) + '</span>'; }).join('')
      : '<span class="kernel-ap-policy kernel-ap-policy--none">لا سياسات مشتعلة</span>';

    var whatIf = r.whatIf.length
      ? r.whatIf.map(function (w) { return '<li>' + escapeHtml(w) + '</li>'; }).join('')
      : '<li>لا أثر متوقع.</li>';

    var decision = r.decisionBy
      ? '<section class="kernel-ap-detail__decision" aria-label="قرار سابق">' +
          '<h4 class="kernel-ap-detail__h4">قرار سابق</h4>' +
          '<p><strong>' + statusLabel(r.status) + '</strong> — بواسطة ' + escapeHtml(r.decisionByRole || '') + ' (' + escapeHtml(r.decisionTsLabel) + ')</p>' +
          '<p class="kernel-ap-detail__decision-reason">' + escapeHtml(r.decisionReason || '') + '</p>' +
        '</section>'
      : '';

    var actions = isActionable
      ? '<section class="kernel-ap-detail__actions" aria-label="قرار الموافقة">' +
          '<label class="kernel-ap-detail__reason-label" for="kap-reason">التعليل <span class="kernel-ap-detail__reason-required">إلزامي عند الرفض أو التفويض</span></label>' +
          '<div class="kernel-ap-detail__reason-row">' +
            '<textarea id="kap-reason" class="kernel-ap-detail__reason" data-kap-reason placeholder="اكتب سبب القرار أو اضغط اقتراح آلي…"></textarea>' +
            '<button type="button" class="kernel-modal__btn" data-kap-suggest>اقتراح آلي</button>' +
            '<span class="kernel-ap-detail__suggest-badge" data-kap-suggest-badge hidden>اقتراح آلي — راجعه قبل التأكيد</span>' +
          '</div>' +
          '<div class="kernel-ap-detail__decide-row">' +
            '<button type="button" class="kernel-ap-decide kernel-ap-decide--approve" data-kap-decide="approve">وافق</button>' +
            '<button type="button" class="kernel-ap-decide kernel-ap-decide--reject" data-kap-decide="reject">ارفض</button>' +
            '<button type="button" class="kernel-ap-decide kernel-ap-decide--transfer" data-kap-decide="transfer">حوّل (تفويض)</button>' +
          '</div>' +
        '</section>'
      : '';
    detail.innerHTML =
      '<header class="kernel-ap-detail__head">' +
        '<div>' +
          '<h3 class="kernel-ap-detail__title">' + escapeHtml(r.title) + '</h3>' +
          '<div class="kernel-ap-detail__meta">' +
            '<span class="kernel-risk-badge ' + riskBadgeClass(r.risk) + '" aria-label="درجة المخاطر ' + r.risk + '">' + r.risk + '</span>' +
            '<span class="kernel-ap-detail__trace kernel-ap-detail__trace--link" data-trace-id="' + escapeHtml(r.traceId) + '" role="button" tabindex="0" aria-label="فتح رحلة ' + escapeHtml(r.traceId) + '">' + escapeHtml(r.traceId) + '</span>' +
            '<span>' + escapeHtml(r.tsLabel) + '</span>' +
          '</div>' +
        '</div>' +
        '<span class="kernel-ap-detail__status kernel-ap-detail__status--' + r.status + '">' + statusLabel(r.status) + '</span>' +
      '</header>' +
      '<div class="kernel-ap-detail__requester">' +
        '<span class="kernel-approval-card__avatar" aria-hidden="true">' + escapeHtml((r.requesterLabel || '؟').charAt(0)) + '</span>' +
        '<span><strong>' + escapeHtml(r.requesterLabel) + '</strong> — ' + escapeHtml(r.requesterRole) + '</span>' +
      '</div>' +
      '<p class="kernel-ap-detail__context">' + escapeHtml(r.context) + '</p>' +
      '<section class="kernel-ap-detail__section" aria-label="فحص PII">' +
        '<h4 class="kernel-ap-detail__h4">نتيجة فحص PII</h4>' +
        '<div class="kernel-ap-detail__chips">' + pii + '</div>' +
      '</section>' +
      '<section class="kernel-ap-detail__section" aria-label="السياسات المشتعلة">' +
        '<h4 class="kernel-ap-detail__h4">السياسات المشتعلة</h4>' +
        '<div class="kernel-ap-detail__chips">' + policies + '</div>' +
      '</section>' +
      '<section class="kernel-ap-whatif" aria-label="ماذا لو وافقت">' +
        '<h4 class="kernel-ap-detail__h4">ماذا لو وافقت؟</h4>' +
        '<ol class="kernel-ap-whatif__list">' + whatIf + '</ol>' +
      '</section>' +
      decision +
      actions;

    var reason = detail.querySelector('[data-kap-reason]');
    if (reason) {
      if (reason.dataset.bound === '1') return;
      reason.dataset.bound = '1';
      reason.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) e.preventDefault();
      });
    }
    var suggest = detail.querySelector('[data-kap-suggest]');
    if (suggest && suggest.dataset.bound !== '1') {
      suggest.dataset.bound = '1';
      suggest.addEventListener('click', function () {
        var rr = fullRows[selectedIndex];
        var ta = detail.querySelector('[data-kap-reason]');
        if (!rr || !ta) return;
        ta.value = getSuggestionText(rr);
        showSuggestBadge(detail.querySelector('[data-kap-suggest-badge]'));
        ta.focus();
      });
    }
    $all('[data-kap-decide]', detail).forEach(function (btn) {
      if (btn.dataset.bound === '1') return;
      btn.dataset.bound = '1';
      btn.addEventListener('click', function () { onDecideClick(btn.getAttribute('data-kap-decide')); });
    });
    bindDetailTrace();
  }

  // ── decision modal (approve / reject / transfer) ───────────────────────
  function openDecisionModal(action) {
    var modal = $('[data-kap-modal]');
    var r = fullRows[selectedIndex];
    if (!modal || !r) return;
    modal.setAttribute('data-open', 'true');
    modal.setAttribute('aria-hidden', 'false');
    modal.dataset.decisionAction = action;

    var title = action === 'approve' ? 'تأكيد الموافقة' : action === 'reject' ? 'تأكيد الرفض' : 'تحويل الطلب (تفويض)';
    $('[data-kap-modal-title]').textContent = title;

    var context = $('[data-kap-modal-context]');
    if (context) {
      context.innerHTML = '<strong>' + escapeHtml(r.title) + '</strong><br>' +
        '<span style="font-family:var(--font-mono); font-size:0.85rem;">' + escapeHtml(r.traceId) + ' · Risk ' + r.risk + '</span>';
    }

    var label = $('[data-kap-modal-label]');
    if (label) {
      label.textContent = action === 'reject' ? 'سبب الرفض (إلزامي)' : action === 'transfer' ? 'سبب التفويض + اختيار المسؤول المستهدف (إلزامي)' : 'ملاحظاتك (اختياري)';
    }

    var reason = $('[data-kap-modal-reason]');
    if (reason) { reason.value = ''; }
    var badge = $('[data-kap-modal-suggest-badge]');
    if (badge) badge.hidden = true;

    var confirm = $('[data-kap-modal-confirm]');
    if (confirm) {
      confirm.textContent = title;
      confirm.className = 'kernel-modal__btn' +
        (action === 'approve' ? ' kernel-modal__btn--approve' : action === 'reject' ? ' kernel-modal__btn--reject' : '');
    }

    var suggest = $('[data-kap-modal-suggest]');
    if (suggest) suggest.hidden = action === 'approve';

    // مستهدف التفويض: ملء القائمة داخل المودال عند «تحويل».
    var delegateField = $('[data-kap-modal-delegate-field]');
    var delegateSel = $('[data-kap-modal-delegate]');
    if (delegateField && delegateSel) {
      if (action === 'transfer') {
        delegateField.hidden = false;
        var reviewers = mainThreadData.APPROVAL_REVIEWERS || [];
        delegateSel.innerHTML = reviewers.map(function (rev) {
          return '<option value="' + escapeHtml(rev.id) + '" data-delegate-label="' + escapeHtml(rev.label) + '">' + escapeHtml(rev.label) + ' — ' + escapeHtml(rev.role) + '</option>';
        }).join('');
      } else {
        delegateField.hidden = true;
      }
    }

    setTimeout(function () {
      var ta = $('[data-kap-modal-reason]');
      if (ta) ta.focus();
    }, 60);
  }

  function closeModal() {
    var modal = $('[data-kap-modal]');
    if (!modal) return;
    modal.setAttribute('data-open', 'false');
    modal.setAttribute('aria-hidden', 'true');
    var delegateField = $('[data-kap-modal-delegate-field]');
    if (delegateField) delegateField.hidden = true;
  }

  function onDecideClick(action) {
    // أخذ التعليل قبل فتح المودال للتفويض/الرفض (النافذة تُظهر الحقل الإلزامي).
    openDecisionModal(action);
  }

  function confirmDecision() {
    var modal = $('[data-kap-modal]');
    var r = fullRows[selectedIndex];
    if (!modal || !r) return;
    var action = modal.dataset.decisionAction;
    var reason = $('[data-kap-modal-reason]');
    var text = reason ? reason.value.trim() : '';
    var delegateSel = $('[data-kap-modal-delegate]');
    var delegateId = (action === 'transfer' && delegateSel) ? delegateSel.value : '';
    var delegateLabel = (action === 'transfer' && delegateSel) ? (delegateSel.selectedOptions && delegateSel.selectedOptions[0] ? delegateSel.selectedOptions[0].getAttribute('data-delegate-label') || '' : '') : '';

    if (action === 'reject' && !text) {
      if (reason) {
        reason.focus();
        reason.style.borderColor = 'var(--status-danger)';
        setTimeout(function () { if (reason) reason.style.borderColor = ''; }, 1500);
      }
      return;
    }
    if (action === 'transfer' && !text) {
      if (reason) {
        reason.focus();
        reason.style.borderColor = 'var(--status-warning)';
        setTimeout(function () { if (reason) reason.style.borderColor = ''; }, 1500);
      }
      return;
    }
    if (action === 'transfer' && !delegateId) {
      if (delegateSel) {
        delegateSel.focus();
        delegateSel.style.borderColor = 'var(--status-warning)';
        setTimeout(function () { if (delegateSel) delegateSel.style.borderColor = ''; }, 1500);
      }
      return;
    }

    var entry = appendLedgerDecision(r, action, text, delegateId, delegateLabel);
    closeModal();
    renderDetail();
    renderList();
    updateFilterCounts();
    offerDecisionUndo(entry);
  }

  // ── decision ledger (Prompt 20: Audit · Trace · Evidence · Certificate) ─
  function appendLedgerDecision(r, action, reason, delegateId, delegateLabel) {
    ledgerSeq += 1;
    var eventId = 'AUD-APR-' + String(20260000 + ledgerSeq);
    var traceId = r.traceId;
    // Alias hash chain: event ⊂ trace ⊂ evidence ⊂ certificate — deterministic
    // FNV-1a of the signed payload (cannot be deleted; only appended).
    var evidenceHash = hash8(traceId + '|' + action + '|' + (delegateId || '') + '|' + ledgerSeq);
    var certificateId = 'CERT-APR-' + String(1000 + ledgerSeq);
    var actionLabel = action === 'approve' ? 'موافقة' : action === 'reject' ? 'رفض' : 'تحويل';
    decisionLedger.unshift({
      eventId: eventId,
      traceId: traceId,
      action: action,
      actionLabel: actionLabel,
      reason: reason,
      delegate: delegateId ? delegateLabel : '',
      reviewer: 'أنت (مراجع)',
      ts: new Date().toISOString(),
      risk: r.risk,
      evidenceHash: evidenceHash,
      certificateId: certificateId,
    });
    updateLedger();
    return decisionLedger[0];
  }

  /**
   * يقدّم «تراجع» للقرار الأخير عبر التوست المشترك (#k-toast + KernelUndoToast).
   * الـ undo يزيل فقط آخر قرار من ledger الجلسة الحالية (في الذاكرة — لا يمسّ
   * سلسلة الهاش المختومة في kernel-approvals-data.js). بعد نافذة الـ undo
   * (10 ثوانٍ) يُهجر الـ handler تلقائياً — لا undo متأخر.
   */
  function offerDecisionUndo(entry) {
    if (!entry || !window.KernelFeedback || !window.KernelFeedback.toast) return;
    window.KernelFeedback.toast.show({
      message: 'تم تسجيل قرار ' + entry.actionLabel + ' — ' + entry.eventId,
      onUndo: function () {
        var idx = decisionLedger.indexOf(entry);
        if (idx !== -1) {
          decisionLedger.splice(idx, 1);
          updateLedger();
        }
      },
    });
  }

  function updateLedger() {
    var ol = $('[data-kap-ledger]');
    if (!ol) return;
    if (decisionLedger.length === 0) {
      ol.innerHTML = '<li class="kernel-ap-ledger__empty">لا قرارات في هذه الجلسة بعد. القرارات هنا تُسجَّل كأحداث تدقيق (Audit) لا يمكن تعديلها.</li>';
      return;
    }
    ol.innerHTML = decisionLedger.map(function (d) {
      var delegateRow = d.delegate ? '<span class="kernel-ap-ledger__delegate">↳ ' + escapeHtml(d.delegate) + '</span>' : '';
      var traceUrl = '/kernel/audit/?trace=' + encodeURIComponent(d.traceId);
      var evidenceUrl = '/kernel/evidence/?trace=' + encodeURIComponent(d.traceId) + '&evd=' + encodeURIComponent(d.evidenceHash);
      return '<li class="kernel-ap-ledger__item">' +
        '<span class="kernel-ap-ledger__badge kernel-ap-ledger__badge--' + d.action + '">' + d.actionLabel + '</span>' +
        '<span class="kernel-ap-ledger__trace">' + escapeHtml(d.traceId) + '</span>' +
        '<span class="kernel-ap-ledger__meta">' + escapeHtml(d.reviewer) + ' · ' + escapeHtml(d.ts.slice(0, 16).replace('T', ' ')) + '</span>' +
        '<p class="kernel-ap-ledger__reason">' + escapeHtml(d.reason) + '</p>' + delegateRow +
        '<div class="kernel-ap-ledger__links">' +
          '<a class="kernel-ap-ledger__link" href="' + traceUrl + '" title="Audit event">Audit ' + escapeHtml(d.eventId) + '</a>' +
          '<button type="button" class="kernel-ap-ledger__link kernel-ap-ledger__link--trace" data-kap-ledger-trace="' + escapeHtml(d.traceId) + '" title="Trace">Trace</button>' +
          '<a class="kernel-ap-ledger__link" href="' + evidenceUrl + '" title="Evidence hash">Evidence ' + escapeHtml(d.evidenceHash) + '</a>' +
          '<a class="kernel-ap-ledger__link" href="' + evidenceUrl + '" title="Certificate">' + escapeHtml(d.certificateId) + '</a>' +
        '</div>' +
      '</li>';
    }).join('');
  }

  function bindLedgerEvents() {
    // Ledger is immutable (append-only). Binding keeps any future link/data
    // attributes live without touching the sealed hash chain.
    var ledger = $('[data-kap-ledger]');
    if (!ledger || ledger.dataset.bound === '1') return;
    ledger.dataset.bound = '1';
    // M28 — Trace button: opens the shared drawer (unified trace navigation).
    ledger.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-kap-ledger-trace]');
      if (!btn) return;
      var traceId = btn.getAttribute('data-kap-ledger-trace');
      if (!traceId) return;
      if (window.KernelTraceDrawer && window.KernelTraceDrawer.open) {
        e.preventDefault();
        window.KernelTraceDrawer.open(traceId);
      } else {
        window.location.href = '/kernel/audit/?trace=' + encodeURIComponent(traceId);
      }
    });
    // Keyboard activation for the trace button (Enter/Space).
    ledger.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      var btn = e.target.closest('[data-kap-ledger-trace]');
      if (!btn) return;
      e.preventDefault();
      var traceId = btn.getAttribute('data-kap-ledger-trace');
      if (!traceId) return;
      if (window.KernelTraceDrawer && window.KernelTraceDrawer.open) {
        window.KernelTraceDrawer.open(traceId);
      } else {
        window.location.href = '/kernel/audit/?trace=' + encodeURIComponent(traceId);
      }
    });
  }

  // ── search ─────────────────────────────────────────────────────────────
  function bindSearch() {
    var input = $('[data-kap-search]');
    if (!input) return;
    input.addEventListener('input', function () {
      clearTimeout(input._t);
      input._t = setTimeout(function () {
        filters.search = input.value.trim();
        request({ type: 'filter', filters: { status: activeFilter, risk: '', dept: '', search: filters.search } }).then(handleFiltered);
      }, SEARCH_DEBOUNCE);
    });
  }

  // ── keyboard batch (J/K/A/R/F/Space/?) ─────────────────────────────────
  function bindShortcuts() {
    document.addEventListener('keydown', function (e) {
      var tag = (e.target.tagName || '').toLowerCase();
      var typing = tag === 'input' || tag === 'textarea' || tag === 'select';
      if (typing) return;

      if (e.key === '?') {
        e.preventDefault();
        toggleShortcuts();
        return;
      }
      if (e.key === 'Escape') {
        var shortcuts = $('[data-kap-shortcuts]');
        if (shortcuts && !shortcuts.hidden) shortcuts.hidden = true;
        return;
      }
      var modalOpen = $('[data-kap-modal]').getAttribute('data-open') === 'true';
      if (modalOpen) return;

      var key = e.key.toLowerCase();
      if (key === 'j') { e.preventDefault(); moveSelection(1); }
      else if (key === 'k') { e.preventDefault(); moveSelection(-1); }
      else if (key === 'a') { e.preventDefault(); if (isSelectedActionable()) onDecideClick('approve'); }
      else if (key === 'r') { e.preventDefault(); if (isSelectedActionable()) onDecideClick('reject'); }
      else if (key === 'f') { e.preventDefault(); if (isSelectedActionable()) onDecideClick('transfer'); }
      else if (key === ' ') { e.preventDefault(); focusSelectedCard(); }
    });
  }

  function moveSelection(dir) {
    if (filteredIndices.length === 0) return;
    var pos = filteredIndices.indexOf(selectedIndex);
    var next = Math.min(Math.max(0, pos + dir), filteredIndices.length - 1);
    selectCard(filteredIndices[next]);
    scrollToSelected();
  }

  function focusSelectedCard() {
    var card = $('[data-kap-card="' + selectedIndex + '"]');
    if (card) card.focus();
  }

  function scrollToSelected() {
    var card = $('[data-kap-card="' + selectedIndex + '"]');
    if (!card) return;
    var list = $('[data-kap-list]');
    if (list && card.scrollIntoView) card.scrollIntoView({ block: 'nearest' });
  }

  function isSelectedActionable() {
    var r = fullRows[selectedIndex];
    return r && (r.status === 'pending' || r.status === 'critical' || r.status === 'review');
  }

  function toggleShortcuts() {
    var s = $('[data-kap-shortcuts]');
    if (!s) return;
    s.hidden = !s.hidden;
  }

  // Toolbar shortcut button (M19) — mirrors the '?' key binding.
  function bindShortcutsBtn() {
    var btn = $('[data-kap-shortcuts-btn]');
    if (!btn || btn.dataset.bound === '1') return;
    btn.dataset.bound = '1';
    btn.addEventListener('click', function () { toggleShortcuts(); });
  }

  // ── empty state reset ──────────────────────────────────────────────────
  function bindEmptyReset() {
    var reset = $('[data-kap-reset]');
    if (!reset) return;
    reset.addEventListener('click', function () {
      setActiveFilter('pending');
      filters.search = '';
      var searchEl = $('[data-kap-search]');
      if (searchEl) searchEl.value = '';
      request({ type: 'filter', filters: { status: 'pending', risk: '', dept: '', search: '' } }).then(handleFiltered);
    });
  }

  // ── modal wiring ───────────────────────────────────────────────────────
  function bindModal() {
    var modal = $('[data-kap-modal]');
    if (!modal || modal.dataset.bound === '1') return;
    modal.dataset.bound = '1';
    $all('[data-kap-modal-close]', modal).forEach(function (n) {
      n.addEventListener('click', closeModal);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modal.getAttribute('data-open') === 'true') closeModal();
    });
    var suggest = $('[data-kap-modal-suggest]');
    if (suggest) suggest.addEventListener('click', function () {
      var r = fullRows[selectedIndex];
      var reason = $('[data-kap-modal-reason]');
      if (!r || !reason) return;
      reason.value = getSuggestionText(r);
      showSuggestBadge($('[data-kap-modal-suggest-badge]'));
    });
    var confirm = $('[data-kap-modal-confirm]');
    if (confirm) confirm.addEventListener('click', confirmDecision);
  }

  // ── devtools window helper (no console.log in production) ──────────────
  window.__kernelApprovals = {
    trace: function (id) {
      if (!fullRows) return { error: 'dataset not ready' };
      for (var i = 0; i < fullRows.length; i += 1) {
        if (fullRows[i].traceId === id) {
          var r = fullRows[i];
          return {
            traceId: r.traceId,
            title: r.title,
            requester: r.requesterLabel,
            department: r.requesterRole,
            riskScore: r.risk,
            status: r.status,
            slaPctLeft: mainThreadData.slaPctLeft(r),
            prevHash: r.prevHash,
            hash: r.hash,
            chainLinkValid: verifyRowLocal(fullRows, i).ok,
          };
        }
      }
      return { error: 'trace not found: ' + id };
    },
    dataset: function () { return fullRows ? fullRows.length : 0; },
    ledger: function () { return decisionLedger.slice(); },
  };

  // ── boot wiring ────────────────────────────────────────────────────────
  function wireWorkerInit() {
    if (!worker) return;
    worker.addEventListener('message', function (ev) {
      var d = ev.data;
      if (d && d.type === 'init') {
        workerReady = true;
        request({ type: 'filter', filters: { status: activeFilter, risk: '', dept: '', search: '' } }).then(handleFiltered);
      }
    });
  }

  var _boot = boot;
  boot = function () {
    _boot();
    wireWorkerInit();
  };

  document.addEventListener('astro:page-load', boot);
  if (document.readyState !== 'loading') boot();
})();