export {};
declare global {
  interface Window {
    KernelAuditData?: {
      buildAuditRows: () => any[];
      buildAuditStats: (rows: any[]) => any;
      fnv1a: (str: string) => string;
      auditCanonical: (row: any) => string;
    };
    KernelTraceDrawer?: {
      open: (id: string, seed: any) => void;
      close: () => void;
    };
    __kernelAudit?: {
      trace: (id: string) => any;
      dataset: () => number;
    };
  }
}

(function () {
  'use strict';

  const ROW_H = 44;
  const ROW_GAP = 0; // borders are drawn with box-shadow; no layout gap
  const OVERSCAN = 6; // rows to render beyond the viewport edge
  const SEARCH_DEBOUNCE = 200;
  const INIT_TIMEOUT = 3000; // worker init fallback watchdog

  let worker: Worker | null = null;
  let workerReady = false;
  let mainThreadData: any = null; // KernelAuditData (fallback)
  let useWorker = false;

  // Client-side state (mirrors the worker's dataset for fallback + verify).
  let fullRows: any[] | null = null;
  let filteredIndices: number[] = [];

  // Render state.
  let viewport: HTMLElement | null = null;
  let spacer: HTMLElement | null = null;
  let band: HTMLElement | null = null;
  const rowPool: HTMLDivElement[] = [];
  const rowCache = new Map<number, HTMLDivElement>(); // index → node
  let lastStart = -1;
  let lastEnd = -1;
  let filterRev = 0; // incremented on every filter apply → forces re-render
  let lastFilterRev = -1; // filterRev at last render → guards the delta no-op
  let currentTotal = 0;

  const filters = { dateFrom: '', dateTo: '', risk: '', status: '', user: '', dept: '', search: '' };
  let searchTimer: any = null;
  let pendingFilterReq = 0;

  // ── helpers ────────────────────────────────────────────────────────────
  const $ = <T extends HTMLElement = HTMLElement>(sel: string, root: ParentNode = document): T | null => root.querySelector<T>(sel);
  const $all = <T extends HTMLElement = HTMLElement>(sel: string, root: ParentNode = document): T[] => Array.from(root.querySelectorAll<T>(sel));

  function statusLabel(s: string) {
    if (s === 'allowed') return 'مسموح';
    if (s === 'blocked') return 'محظور';
    if (s === 'pending_approval') return 'بانتظار الموافقة';
    return 'خطأ';
  }

  function statusClass(s: string) {
    if (s === 'allowed') return 'ka-status--allowed';
    if (s === 'blocked') return 'ka-status--blocked';
    if (s === 'pending_approval') return 'ka-status--pending';
    return 'ka-status--error';
  }

  function riskClass(score: number) {
    if (score > 85) return 'kernel-risk-badge--critical';
    if (score >= 60) return 'kernel-risk-badge--high';
    if (score >= 30) return 'kernel-risk-badge--medium';
    return 'kernel-risk-badge--low';
  }

  // Manual thousands separator (deterministic, no locale dependence).
  function fmtCount(n: number): string {
    const s = String(n);
    let out = '';
    let c = 0;
    for (let i = s.length - 1; i >= 0; i -= 1) {
      out = s[i] + out;
      c += 1;
      if (c % 3 === 0 && i > 0) out = ',' + out;
    }
    return out;
  }

  function flash(btn: HTMLElement) {
    btn.setAttribute('data-copied', 'true');
    setTimeout(function () { btn.removeAttribute('data-copied'); }, 1400);
  }

  function safeCopy(text: string): Promise<any> {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).catch(function () { return fallbackCopy(text); });
    }
    return Promise.resolve(fallbackCopy(text));
  }
  function fallbackCopy(text: string) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (e) { /* noop */ }
    document.body.removeChild(ta);
  }

  function downloadFile(name: string, mime: string, content: string | Blob) {
    const blob = content instanceof Blob ? content : new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
  }

  // ── engine adapter: worker → main-thread fallback ──────────────────────
  function request(msg: any): Promise<any> {
    if (useWorker && workerReady && worker) {
      return new Promise(function (resolve) {
        const id = 'r' + (++pendingFilterReq);
        msg._id = id;
        const onMsg = function (ev: MessageEvent) {
          if (ev.data && ev.data._id === id) {
            worker?.removeEventListener('message', onMsg);
            resolve(ev.data);
          }
        };
        worker?.addEventListener('message', onMsg);
        worker?.postMessage(msg);
      });
    }
    return mainThreadHandle(msg);
  }

  function mainThreadHandle(msg: any): Promise<any> {
    const all = fullRows || [];
    const type = msg.type;
    if (type === 'init') {
      return Promise.resolve({ type: 'init', stats: mainThreadData.buildAuditStats(all), total: all.length });
    }
    if (type === 'filter') {
      filteredIndices = mainThreadFilter(all, msg.filters);
      return Promise.resolve({
        type: 'filtered',
        indices: filteredIndices.slice(),
        total: filteredIndices.length,
        visible: filteredIndices.length,
      });
    }
    if (type === 'slice') {
      const out = [];
      for (let s = msg.start; s < Math.min(msg.end, filteredIndices.length); s += 1) {
        out.push(all[filteredIndices[s]]);
      }
      return Promise.resolve({ type: 'slice', rows: out, start: msg.start, total: filteredIndices.length });
    }
    if (type === 'export') {
      const exp = [];
      for (let e = 0; e < filteredIndices.length; e += 1) exp.push(all[filteredIndices[e]]);
      return Promise.resolve({ type: 'export', format: msg.format, rows: exp, total: exp.length });
    }
    if (type === 'verify') {
      const idx = msg.index | 0;
      const chk = verifyRowLocal(all, idx);
      return Promise.resolve({
        type: 'verify',
        result: chk,
        prev: idx > 0 ? { traceId: all[idx - 1].traceId, hash: all[idx - 1].hash } : null,
        current: { traceId: all[idx].traceId, hash: all[idx].hash, stored: all[idx].hash },
        next: idx < all.length - 1 ? { traceId: all[idx + 1].traceId, hash: all[idx + 1].hash } : null,
        index: idx,
      });
    }
    if (type === 'tamper-check') {
      const t = msg.index | 0;
      const o = all[t];
      const broken = mainThreadData.fnv1a(o.prevHash + '|' + mainThreadData.auditCanonical({
        ts: o.ts, userId: o.userId, role: o.role, action: o.action,
        risk: Math.min(99, o.risk + 13), status: o.status, traceId: o.traceId,
      })) === o.hash;
      return Promise.resolve({ type: 'tamper-check', result: { broken: !broken, tamperedField: 'risk', original: o.risk, tampered: Math.min(99, o.risk + 13) } });
    }
    return Promise.resolve({ type: 'error', error: 'unknown message type: ' + type });
  }

  function mainThreadFilter(all: any[], f: any) {
    const risk = f.risk || '', status = f.status || '', user = f.user || '', dept = f.dept || '';
    const from = f.dateFrom ? Date.parse(f.dateFrom + 'T00:00:00Z') : -Infinity;
    const to = f.dateTo ? Date.parse(f.dateTo + 'T23:59:59.999Z') : Infinity;
    const search = String(f.search || '').toLowerCase();
    const lo = lowerBound(all, from), hi = upperBound(all, to);
    const indices: number[] = [];
    for (let i = lo; i < hi; i += 1) {
      const r = all[i];
      if (risk !== '' && riskLevel(r.risk) !== risk) continue;
      if (status !== '' && r.status !== status) continue;
      if (user !== '' && r.userId !== user) continue;
      if (dept !== '' && r.role !== dept) continue;
      if (search !== '') {
        const hay = (r.action + ' ' + r.traceId + ' ' + r.userLabel + ' ' + r.hash).toLowerCase();
        if (hay.indexOf(search) === -1) continue;
      }
      indices.push(i);
    }
    indices.reverse();
    return indices;
  }

  function riskLevel(risk: number) {
    if (risk <= 30) return 'low';
    if (risk <= 60) return 'medium';
    if (risk <= 85) return 'high';
    return 'critical';
  }

  function lowerBound(all: any[], ts: number) {
    let lo = 0, hi = all.length;
    while (lo < hi) {
      const m = (lo + hi) >>> 1;
      if (all[m].ts < ts) lo = m + 1;
      else hi = m;
    }
    return lo;
  }

  function upperBound(all: any[], ts: number) {
    let lo = 0, hi = all.length;
    while (lo < hi) {
      const m = (lo + hi) >>> 1;
      if (all[m].ts <= ts) lo = m + 1;
      else hi = m;
    }
    return lo;
  }

  function verifyRowLocal(all: any[], index: number) {
    const r = all[index];
    const expected = mainThreadData.fnv1a(r.prevHash + '|' + mainThreadData.auditCanonical(r));
    return { ok: expected === r.hash, expected: expected, stored: r.hash };
  }

  // ── worker setup ───────────────────────────────────────────────────────
  function setupWorker() {
    try {
      if (typeof Worker === 'undefined') throw new Error('no Worker');
      worker = new Worker('/js/kernel-audit-worker.js');
      useWorker = true;
      workerReady = false;
      worker.addEventListener('message', function (ev) {
        if (ev.data && ev.data.type === 'init') workerReady = true;
      });
      worker.addEventListener('error', function () { switchToMainThread(); });
      // Watchdog: if init doesn't arrive, fall back.
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
    if (worker) {
      try { worker.terminate(); } catch (e) { /* noop */ }
      worker = null;
    }
    // fullRows is always built in boot(); re-run the filter on the main thread.
    if (fullRows) initAfterData();
  }

  // ── boot ───────────────────────────────────────────────────────────────
  let boot = function boot_impl() {
    const main = $<HTMLElement>('[data-kernel-loading]');
    if (!main) return;
    if (main.getAttribute('data-audit-bound') === '1') return;
    main.setAttribute('data-audit-bound', '1');

    viewport = $('[data-ka-viewport]');
    spacer = $('[data-ka-spacer]');
    band = $('[data-ka-band]');
    if (!viewport || !spacer || !band) return;

    // The main thread ALWAYS owns a byte-identical copy of the dataset
    // (same deterministic seed) for rendering + verify. The Worker is used
    // for off-main-thread filter/export compute; only small results cross
    // postMessage. If Worker is unavailable we fall back to this copy.
    mainThreadData = window.KernelAuditData;
    if (!mainThreadData) return; // data script missing → keep skeleton
    fullRows = mainThreadData.buildAuditRows();

    bindKpis(fullRows!);
    bindFilters();
    bindSearch();
    bindExports();
    bindVerifier();
    bindDrawer();
    bindRowEvents();

    // AUDIT-URL: read filters from the URL BEFORE the first filter request so
    // a deep-link / refresh lands on the right filter set. Done after the DOM
    // binders so syncDomFromFilters() can find the bound controls.
    readFiltersFromUrl();

    setupWorker();

    if (useWorker && worker) {
      // Worker owns its own copy; our init message drives the first filter
      // inside wireWorkerInit().
      worker.postMessage({ type: 'init' });
    } else {
      initAfterData();
    }
  }

  function handleFiltered(res: any) {
    if (!res || res.type !== 'filtered') return;
    if (Array.isArray(res.indices)) filteredIndices = res.indices;
    filterRev += 1;
    reveal();
    updateToolbar();
    renderWindow();
  }

  // BAI-P0-TRUTH-001: demo-mode toggle removed — this surface shows only
  // deterministic data, so the viewport/verifier/kpis stay visible. The
  // empty state now means "filter returned no rows", not "live mode on".

  function reveal() {
    const main = $('[data-kernel-loading]');
    if (!main || !main.hasAttribute('data-kernel-loading')) return;
    const skel = main.querySelector<HTMLElement>('[data-kernel-skeleton]');
    if (skel) skel.hidden = true;
    main.removeAttribute('data-kernel-loading');
  }

  function initAfterData() {
    if (!fullRows) return;
    currentTotal = fullRows.length;
    request({ type: 'filter', filters: filters }).then(handleFiltered);
  }

  // ── KPI strip ──────────────────────────────────────────────────────────
  function bindKpis(rows: any[]) {
    // SSR renders the exact build-time stats; the engine re-syncs from the
    // deterministic baseline (not the filtered set). Toolbar shows the live
    // filtered count.
    if (!rows) return;
    const s = mainThreadData.buildAuditStats(rows);
    setKpi('[data-ka-kpi-total]', s.total);
    setKpi('[data-ka-kpi-allowed]', s.allowed);
    setKpi('[data-ka-kpi-blocked]', s.blocked);
    setKpi('[data-ka-kpi-approvals]', s.approvals);
  }
  function setKpi(sel: string, val: number) {
    const el = $(sel);
    if (el) el.textContent = fmtCount(val);
  }

  // ── filters ────────────────────────────────────────────────────────────
  function bindFilters() {
    $all('[data-kernel-audit-filter]').forEach(function (sel) {
      if (sel.dataset.bound === '1') return;
      sel.dataset.bound = '1';
      sel.addEventListener('change', function () {
        (filters as any)[sel.getAttribute('data-kernel-audit-filter') || ''] = (sel as HTMLSelectElement).value;
        applyFilter();
      });
    });

    $all('[data-ka-clear]').forEach(function (clear) {
      if (clear.dataset.bound === '1') return;
      clear.dataset.bound = '1';
      clear.addEventListener('click', function () {
        $all('[data-kernel-audit-filter]').forEach(function (s) { (s as HTMLSelectElement).value = ''; });
        Object.assign(filters, { dateFrom: '', dateTo: '', risk: '', status: '', user: '', dept: '', search: '' });
        const searchEl = $('[data-ka-search]') as HTMLInputElement;
        if (searchEl) searchEl.value = '';
        // Re-apply with cleared filters (default date range, all rows).
        applyFilter();
      });
    });
  }

  function bindSearch() {
    const input = $('[data-ka-search]') as HTMLInputElement;
    if (!input) return;
    input.addEventListener('input', function () {
      clearTimeout(searchTimer);
      const v = input.value;
      searchTimer = setTimeout(function () {
        filters.search = v;
        applyFilter();
      }, SEARCH_DEBOUNCE);
    });
  }

  function applyFilter() {
    // AUDIT-URL: mirror the in-memory filter state to the URL (replaceState,
    // not pushState, so each tweak doesn't flood browser history). This makes
    // the filter set refresh-safe and shareable. popstate (back button) is
    // handled by readFiltersFromUrl.
    writeFiltersToUrl();
    request({ type: 'filter', filters: filters }).then(handleFiltered);
  }

  // ── filter URL state (AUDIT-URL — bidirectional) ───────────────────────
  // Param map: short URL-friendly keys ↔ internal filter fields. Audit is the
  // first kernel page to sync live filter state; the contract is:
  //   - read on boot (deep-link / refresh lands on the right filter set)
  //   - written on every change (replaceState, history stays clean)
  //   - popstate re-reads (browser back/forward restores filters)
  const URL_PARAM_MAP: Array<[string, keyof typeof filters]> = [
    ['from', 'dateFrom'],
    ['to', 'dateTo'],
    ['risk', 'risk'],
    ['status', 'status'],
    ['user', 'user'],
    ['dept', 'dept'],
    ['q', 'search'],
  ];

  /** Pull filter values from location.search into the in-memory state + sync
   *  the DOM controls (selects, date inputs, search) so the UI reflects the
   *  URL. Returns true if any param was present (caller skips the default). */
  function readFiltersFromUrl(): boolean {
    let params: URLSearchParams;
    try {
      params = new URLSearchParams(location.search);
    } catch (e) {
      return false;
    }
    let any = false;
    URL_PARAM_MAP.forEach(function (entry) {
      const val = params.get(entry[0]);
      if (val != null && val !== '') {
        (filters as any)[entry[1]] = val;
        any = true;
      }
    });
    if (any) syncDomFromFilters();
    return any;
  }

  /** Reflect the in-memory filter state back onto the DOM controls. Needed
   *  after a URL-driven read so the <select>/<input> elements show the
   *  active filter (otherwise the UI says "all" while the URL says otherwise). */
  function syncDomFromFilters() {
    $all<HTMLSelectElement & HTMLInputElement>('[data-kernel-audit-filter]').forEach(function (el) {
      const key = el.getAttribute('data-kernel-audit-filter') || '';
      const val = (filters as any)[key];
      if (typeof val === 'string') el.value = val;
    });
    const searchEl = $('[data-ka-search]') as HTMLInputElement;
    if (searchEl && typeof filters.search === 'string') searchEl.value = filters.search;
  }

  /** Serialize the active filters to location.search via replaceState. Empty
   *  values are dropped so the URL stays clean when a filter is cleared. */
  function writeFiltersToUrl() {
    const params = new URLSearchParams();
    URL_PARAM_MAP.forEach(function (entry) {
      const val = (filters as any)[entry[1]];
      if (typeof val === 'string' && val !== '') params.set(entry[0], val);
    });
    const qs = params.toString();
    const next = qs ? location.pathname + '?' + qs : location.pathname;
    // Guard against no-op replaces (avoids spamming history/timing observers).
    if (location.pathname + location.search === next) return;
    try {
      history.replaceState(null, '', next);
    } catch (e) {
      /* Safari private mode / cross-origin can throw — non-fatal. */
    }
  }

  function updateToolbar() {
    const counter = $('[data-kernel-audit-count]');
    if (counter) {
      counter.textContent = fmtCount(currentTotal) + ' سجل إجمالي · تعرض ' + fmtCount(filteredIndices.length);
    }
    const empty = $('[data-ka-empty]') as HTMLElement;
    if (empty) empty.hidden = filteredIndices.length !== 0;
  }

  // ── virtualized rendering ──────────────────────────────────────────────
  function renderWindow() {
    if (!viewport || !spacer || !band) return;
    const total = filteredIndices.length;
    spacer.style.height = total * (ROW_H + ROW_GAP) + 'px';

    const st = viewport.scrollTop || 0;
    const vh = viewport.clientHeight || 0;
    const start = Math.max(0, Math.floor(st / (ROW_H + ROW_GAP)) - OVERSCAN);
    const end = Math.min(total, Math.ceil((st + vh) / (ROW_H + ROW_GAP)) + OVERSCAN);

    if (start === lastStart && end === lastEnd && filterRev === lastFilterRev) {
      return; // delta no-op: window + filters unchanged
    }
    lastStart = start;
    lastEnd = end;
    lastFilterRev = filterRev;

    // Reuse pooled nodes; build a keyed map for the visible window.
    const visible: Record<number, boolean> = {};
    for (let i = start; i < end; i += 1) {
      visible[i] = true;
      if (rowCache.has(i)) continue;
      rowCache.set(i, acquireNode());
    }

    // Remove rows that left the window.
    const stale: number[] = [];
    rowCache.forEach(function (v, key) {
      if (!visible[key]) stale.push(key);
    });
    for (let s = 0; s < stale.length; s += 1) {
      const node = rowCache.get(stale[s]);
      if (node) releaseNode(node);
      rowCache.delete(stale[s]);
    }

    // Position + fill visible rows.
    rowCache.forEach(function (node, key) {
      if (visible[key]) {
        node.style.transform = 'translateY(' + (key * (ROW_H + ROW_GAP)) + 'px)';
        fillRow(node, filteredIndices[key]);
      }
    });

    updateScrollPos();
  }

  function acquireNode(): HTMLDivElement {
    let node = rowPool.pop();
    if (!node) {
      node = buildRowNode();
      band?.appendChild(node);
    }
    node.style.display = '';
    return node;
  }
  function releaseNode(node: HTMLDivElement) {
    node.style.display = 'none';
    rowPool.push(node);
  }

  function buildRowNode(): HTMLDivElement {
    const row = document.createElement('div');
    row.className = 'kernel-audit-vrow';
    row.setAttribute('role', 'row');
    row.setAttribute('tabindex', '0');

    const cells = [
      { cls: 'ka-cell--ts', key: 'ts' },
      { cls: 'ka-cell--user', key: 'user' },
      { cls: 'ka-cell--action', key: 'action' },
      { cls: 'ka-cell--risk', key: 'risk' },
      { cls: 'ka-cell--status', key: 'status' },
      { cls: 'ka-cell--hash', key: 'hash' },
      { cls: 'ka-cell--view', key: 'view' },
    ];

    cells.forEach(function (c) {
      const cell = document.createElement('div');
      cell.className = 'kernel-audit-vrow__cell ' + c.cls;
      cell.setAttribute('role', 'cell'); // M29: axe aria-required-children (table)
      row.appendChild(cell);
    });

    // hash copy button + view button are built once per pooled node.
    const hashCell = row.querySelector('.ka-cell--hash');
    if (hashCell) {
      const copyBtn = document.createElement('button');
      copyBtn.type = 'button';
      copyBtn.className = 'kernel-audit-table__hash-copy';
      copyBtn.setAttribute('aria-label', 'نسخ الهاش');
      copyBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>';
      copyBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        const idx = row.getAttribute('data-ka-idx');
        if (idx == null) return;
        const r = getRowByRealIndex(parseInt(idx, 10));
        if (r) safeCopy(r.hash).then(function () { flash(copyBtn); });
      });
      hashCell.appendChild(copyBtn);
    }

    const viewCell = row.querySelector('.ka-cell--view');
    if (viewCell) {
      const viewBtn = document.createElement('button');
      viewBtn.type = 'button';
      viewBtn.className = 'kernel-audit-table__view-btn';
      viewBtn.textContent = 'عرض';
      viewBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        // AUDIT-FOCUS: focus the button before opening so the shared focus-trap
        // (focus-trap.js, which captures document.activeElement at open time)
        // returns focus to THIS button on close, not the row container. This
        // makes the drawer's focus-return precise and keyboard-navigable.
        viewBtn.focus({ preventScroll: true });
        const idx = row.getAttribute('data-ka-idx');
        if (idx == null) return;
        openDrawer(parseInt(idx, 10));
      });
      viewCell.appendChild(viewBtn);
    }

    row.addEventListener('click', function () {
      const idx = row.getAttribute('data-ka-idx');
      if (idx != null) openDrawer(parseInt(idx, 10));
    });
    row.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const idx = row.getAttribute('data-ka-idx');
        if (idx != null) openDrawer(parseInt(idx, 10));
      }
    });

    return row;
  }

  function getRowByRealIndex(idx: number) {
    return fullRows ? fullRows[idx] : null;
  }

  function fillRow(node: HTMLDivElement, realIndex: number) {
    if (!fullRows) return;
    const r = fullRows[realIndex];
    if (!r) return;
    node.setAttribute('data-ka-idx', String(realIndex));
    node.setAttribute('data-status', r.status);
    node.setAttribute('data-risk', String(r.risk));
    node.classList.toggle('kernel-audit-vrow--anomaly', !!r.anomaly);

    const cells = node.children;
    cells[0].textContent = r.tsLabel;
    cells[1].innerHTML = '<strong>' + escapeHtml(r.userLabel) + '</strong><span class="ka-cell--user-role">' + escapeHtml(r.role) + '</span>';
    cells[2].textContent = r.action;
    cells[3].innerHTML = '<span class="kernel-risk-badge ' + riskClass(r.risk) + '">' + r.risk + '</span>';
    cells[4].textContent = statusLabel(r.status);
    cells[4].className = 'kernel-audit-vrow__cell ka-cell--status ' + statusClass(r.status);

    const hashCell = cells[5];
    let hashText = hashCell.querySelector('.ka-hash-text');
    if (!hashText) {
      hashText = document.createElement('span');
      hashText.className = 'ka-hash-text';
      hashCell.insertBefore(hashText, hashCell.firstChild);
    }
    hashText.textContent = r.hash.slice(0, 12) + '…' + r.hash.slice(-4);
    const copyBtn = hashCell.querySelector('.kernel-audit-table__hash-copy');
    if (copyBtn) copyBtn.setAttribute('data-kernel-audit-copy', r.hash);
  }

  function escapeHtml(s: string): string {
    return String(s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' } as any)[c] || c;
    });
  }

  function updateScrollPos() {
    const pos = $('[data-ka-scrollpos]');
    if (pos) pos.textContent = fmtCount(filteredIndices.length);
  }

  function bindRowEvents() {
    if (viewport) {
      viewport.addEventListener('scroll', function () {
        requestAnimationFrame(function () { renderWindow(); });
      });
      if ((window as any).ResizeObserver) {
        new (window as any).ResizeObserver(function () { renderWindow(); }).observe(viewport);
      }
    }
  }

  // ── drawer ─────────────────────────────────────────────────────────────
  function openDrawer(realIndex: number) {
    const r = getRowByRealIndex(realIndex);
    if (!r) return;
    if (!window.KernelTraceDrawer) return; // kernel-drawer.js (الشِل) لازم يحمّل أولًا

    const seed = {
      // AUDIT-PROV: tag the trace as demo-seeded so the shared drawer can
      // surface a provenance banner + stamp the PDF export.
      source: AUDIT_SOURCE,
      sourceLabel: AUDIT_SOURCE_LABEL,
      user: r.userLabel,
      dept: r.role,
      model: 'NVIDIA NIM',
      time: r.tsLabel,
      verdict: r.status, // allowed/blocked/pending_approval/error → يترجم للشارة
      hashes: { prev: r.prevHash, curr: r.hash, next: undefined },
      hash: r.hash,
      status: statusLabel(r.status),
      approval: r.humanApproved ? 'نعم — موافقة بشرية' : (r.status === 'pending_approval' ? 'بانتظار الموافقة' : 'لا — آلي'),
      anomaly: r.anomaly ? 'نعم — أعلى من نمط المستخدم' : 'لا',
      action: r.action,
      json: JSON.stringify({
        traceId: r.traceId,
        timestamp: r.tsLabel,
        user: r.userLabel,
        department: r.role,
        action: r.action,
        riskScore: r.risk,
        status: r.status,
        humanApproved: r.humanApproved,
        anomaly: r.anomaly,
        prevHash: r.prevHash,
        hash: r.hash,
      }, null, 2),
      snippet: 'window.__kernelAudit && window.__kernelAudit.trace("' + r.traceId + '")',
      stages: buildTimeline(r),
    };
    window.KernelTraceDrawer.open(r.traceId, seed);
  }

  /** المراحل الست بصيغة seed (بما يتوافق مع buildStages في kernel-drawer.js). */
  function buildTimeline(r: any) {
    const blocked = r.status === 'blocked';
    const risk = r.risk;
    return [
      { name: 'الاستلام', time: 'T+0ms', resultClass: 'k-timeline__result--ok', resultText: 'مرّ', nodeClass: '', detail: 'مستخدم: ' + r.userLabel, skipped: false },
      { name: 'فحص PII', time: 'T+18ms', resultClass: blocked ? 'k-timeline__result--mask' : 'k-timeline__result--ok', resultText: blocked ? 'عُمّي' : 'سليم', nodeClass: blocked ? '--mask' : '', detail: 'كاشف PII: ' + (blocked ? 'تم كشف بيانات حساسة (PII)' : 'لم يُكشف في هذا السجل.'), skipped: false },
      { name: 'تقييم المخاطر', time: 'T+24ms', resultClass: risk > 85 ? 'k-timeline__result--critical' : 'k-timeline__result--ok', resultText: 'درجة ' + risk + '/100', nodeClass: risk > 85 ? '--critical' : '', detail: 'درجة المخاطر: ' + risk + '/100', skipped: false },
      { name: 'مطابقة السياسات', time: 'T+31ms', resultClass: blocked ? 'k-timeline__result--block' : 'k-timeline__result--ok', resultText: blocked ? 'حُظر' : 'مرّ', nodeClass: blocked ? '--block' : '', detail: 'سياسة: ' + (risk > 70 ? 'تجميد + مراجعة بشرية' : 'مسموح'), skipped: false },
      { name: 'استدعاء النموذج', time: 'T+58ms', resultClass: blocked ? 'k-timeline__result--skip' : 'k-timeline__result--ok', resultText: blocked ? 'لن يُستدعى' : 'اكتمل', nodeClass: blocked ? '--skip' : '', detail: blocked ? 'لم يُستدعى النموذج — تم الحظر قبل الإرسال.' : 'استدعاء مزود النموذج: NVIDIA NIM', skipped: blocked },
      { name: 'توليد الدليل', time: 'T+74ms', resultClass: 'k-timeline__result--ok', resultText: r.status === 'error' ? 'فشل' : 'EVD', nodeClass: '', detail: 'Hash: ' + r.hash, skipped: false },
    ];
  }

  function bindDrawer() {
    // لا درج خاص بعد (M28) — لا شيء يُربَط هنا. الفتح موحّد عبر الشِل.
  }

  // ── exports ────────────────────────────────────────────────────────────
  // AUDIT-PROV (2026-08-09): every exported artifact states its source and a
  // full ISO timestamp. The dataset is deterministic demo data (seeded via
  // AUDIT_SEED in src/data/kernel-audit.ts), NOT production audit records.
  // Surfacing this in the artifact — not just the page-level DemoPill — is
  // the trust contract: anyone who opens an exported CSV/JSON/PDF months
  // later sees "بيانات تجريبية حتمية" inline, with no ambiguity.
  const AUDIT_SOURCE = 'demo-seeded';
  const AUDIT_SOURCE_LABEL = 'بيانات تجريبية حتمية — ليست سجلات إنتاج';
  const AUDIT_SCHEMA = 'brightai.kernel.audit-events';

  function bindExports() {
    $all('[data-kernel-audit-export]').forEach(function (btn) {
      if (btn.dataset.bound === '1') return;
      btn.dataset.bound = '1';
      btn.addEventListener('click', function () {
        exportRows(btn.getAttribute('data-kernel-audit-export') || 'json');
      });
    });
  }

  function exportRows(format: string) {
    request({ type: 'export', format: format }).then(function (res) {
      if (!res || res.type !== 'export') return;
      const rows = res.rows || [];
      const now = new Date();
      const iso = now.toISOString();
      const fileStamp = iso.slice(0, 10); // filename stays date-only (cosmetic)

      if (format === 'csv') {
        downloadFile('kernel-audit-' + fileStamp + '.csv', 'text/csv;charset=utf-8', exportCsv(rows, iso));
      } else if (format === 'json') {
        downloadFile('kernel-audit-' + fileStamp + '.json', 'application/json', exportJson(rows, iso));
      } else if (format === 'pdf') {
        printPdf(rows, iso);
      }
    });
  }

  /** CSV with a provenance comment header. Excel/LibreOffice/PapaParse treat
   *  leading `#` lines as comments or single-cell text; either way the column
   *  header row (`ts,user,...`) is unambiguous. RFC 4180 quoting preserved. */
  function exportCsv(rows: any[], iso: string): string {
    const meta =
      '# source=' + AUDIT_SOURCE + ' exported_at=' + iso + ' count=' + rows.length + ' schema=' + AUDIT_SCHEMA + '\n' +
      '# note=' + AUDIT_SOURCE_LABEL + ' — BrightAI Kernel Demo.' + '\n';
    const header = 'ts,user,department,action,risk,status,traceId,hash,approved\n';
    const body = rows.map(function (d: any) {
      return [d.tsLabel, d.userLabel, d.role, d.action, d.risk, d.status, d.traceId, d.hash, d.humanApproved ? 'yes' : 'no']
        .map(function (c) { return '"' + String(c).replace(/"/g, '""') + '"'; }).join(',');
    }).join('\n');
    return meta + header + body;
  }

  /** JSON wrapped in a provenance envelope (mirrors audit-verifier.ts:
   *  schema + exportedAt, extended with source/sourceLabel for demo honesty). */
  function exportJson(rows: any[], iso: string): string {
    return JSON.stringify({
      schema: AUDIT_SCHEMA,
      source: AUDIT_SOURCE,
      sourceLabel: AUDIT_SOURCE_LABEL,
      exportedAt: iso,
      count: rows.length,
      events: rows,
    }, null, 2);
  }

  function printPdf(rows: any[], iso: string) {
    const w = window.open('', '_blank', 'width=900,height=700');
    if (!w) return;
    const thead = '<tr><th>الوقت</th><th>المستخدم</th><th>القسم</th><th>الإجراء</th><th>المخاطر</th><th>الحالة</th><th>Trace</th></tr>';
    const body = rows.map(function (r) {
      return '<tr><td>' + escapeHtml(r.tsLabel) + '</td><td>' + escapeHtml(r.userLabel) + '</td><td>' + escapeHtml(r.role) + '</td><td>' + escapeHtml(r.action) +
        '</td><td>' + r.risk + '</td><td>' + statusLabel(r.status) + '</td><td>' + escapeHtml(r.traceId) + '</td></tr>';
    }).join('');
    // AUDIT-PROV: provenance header (source + full ISO timestamp + count) is
    // always visible at the top of the print view + any PDF the user saves.
    const html = '<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>سجل تدقيق Kernel (عرض توضيحي) — ' + iso + '</title>' +
      '<style>' +
      'body{font-family:system-ui;padding:20px;color:#0f172a;position:relative}' +
      'table{width:100%;border-collapse:collapse;font-size:11px}th,td{border:1px solid #cbd5e1;padding:4px 6px;text-align:start}th{background:#f1f5f9}h1{font-size:16px}' +
      '.ka-prov{background:#fef3c7;border:1px solid #fcd34d;border-radius:6px;padding:8px 12px;margin:8px 0 16px;font-size:12px;line-height:1.7}' +
      '.ka-prov strong{color:#92400e}' +
      '.ka-prov-row{display:block}' +
      'body::before{content:"DEMO";position:fixed;top:40%;inset-inline-start:50%;transform:translateX(-50%) rotate(-30deg);font-size:120px;color:rgba(245,158,11,0.08);font-weight:800;pointer-events:none;z-index:0}' +
      'table,h1,.ka-prov{position:relative;z-index:1}' +
      '</style></head><body>' +
      '<h1>BrightAI Kernel — سجل تدقيق (عرض توضيحي)</h1>' +
      '<div class="ka-prov">' +
      '<span class="ka-prov-row"><strong>المصدر:</strong> ' + AUDIT_SOURCE_LABEL + '</span>' +
      '<span class="ka-prov-row"><strong>توقيت التصدير:</strong> <span dir="ltr">' + iso + '</span></span>' +
      '<span class="ka-prov-row"><strong>عدد السجلات:</strong> ' + rows.length + '</span>' +
      '</div>' +
      '<table><thead>' + thead + '</thead><tbody>' + body + '</tbody></table>' +
      '<script>window.onload=function(){setTimeout(function(){window.print();},250);};<\/script></body></html>';
    w.document.write(html);
    w.document.close();
  }

  // ── hash chain verifier ────────────────────────────────────────────────
  function bindVerifier() {
    const btn = $('[data-ka-verify-btn]');
    if (btn) {
      btn.addEventListener('click', function () {
        const traceInput = $('[data-ka-verify-trace]') as HTMLInputElement;
        const trace = (traceInput ? traceInput.value : '').trim();
        runVerify(trace);
      });
    }
    const tamper = $('[data-ka-tamper-btn]');
    if (tamper) {
      tamper.addEventListener('click', function () {
        const traceInput = $('[data-ka-verify-trace]') as HTMLInputElement;
        const trace = (traceInput ? traceInput.value : '').trim();
        runTamperDemo(trace);
      });
    }
    // Enter key in the trace input triggers verify.
    const input = $('[data-ka-verify-trace]') as HTMLInputElement;
    if (input) {
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') btn && (btn as HTMLButtonElement).click();
      });
    }
  }

  function findIndexByTrace(trace: string) {
    if (!trace || !fullRows) return -1;
    for (let i = 0; i < fullRows.length; i += 1) {
      if (fullRows[i].traceId === trace) return i;
    }
    return -1;
  }

  function runVerify(trace: string) {
    const out = $('[data-ka-verify-out]');
    if (!fullRows) return;
    const idx = findIndexByTrace(trace);
    if (idx === -1) {
      if (out) {
        out.className = 'ka-verify-out ka-verify-out--fail';
        out.textContent = 'ما لقيت traceId "' + trace + '" في السجل. جرّب نسخ Trace ID من جدول فوق.';
      }
      return;
    }
    request({ type: 'verify', index: idx }).then(function (res) {
      if (!res || res.type !== 'verify') return;
      const prevEl = $('[data-ka-verify-prev]');
      const curEl = $('[data-ka-verify-current]');
      const nextEl = $('[data-ka-verify-next]');
      if (prevEl) prevEl.textContent = res.prev ? res.prev.traceId + ' · ' + res.prev.hash : '— (بداية السلسلة)';
      if (curEl) curEl.textContent = res.current.traceId + ' · ' + res.current.hash;
      if (nextEl) nextEl.textContent = res.next ? res.next.traceId + ' · ' + res.next.hash : '— (نهاية السلسلة)';
      if (out) {
        if (res.result.ok) {
          out.className = 'ka-verify-out ka-verify-out--ok';
          out.textContent = '✓ التحقق ناجح — الهاش المعاد حسابه يطابق المخزّن. السجل سليم ومتواصل مع السلسلة.';
        } else {
          out.className = 'ka-verify-out ka-verify-out--fail';
          out.textContent = '✗ كسر في السلسلة — الهاش المعاد حسابه (' + res.result.expected + ') لا يطابق المخزّن (' + res.result.stored + '). السجل عُدّل.';
        }
      }
    });
  }

  function runTamperDemo(trace: string) {
    const out = $('[data-ka-verify-out]');
    if (!fullRows) return;
    const idx = findIndexByTrace(trace);
    if (idx === -1) {
      if (out) {
        out.className = 'ka-verify-out ka-verify-out--fail';
        out.textContent = 'ما لقيت traceId. أول شي اختر سجل من الجدول ونسخ Trace ID.';
      }
      return;
    }
    request({ type: 'tamper-check', index: idx }).then(function (res) {
      if (!res || res.type !== 'tamper-check') return;
      if (out) {
        if (res.result.broken) {
          out.className = 'ka-verify-out ka-verify-out--fail';
          out.textContent = '✗ محاكاة العبث: غيّرنا risk من ' + res.result.original + ' إلى ' + res.result.tampered +
            ' في نسخة. الحساب كشف الكسر فورًا — السلسلة تكشف أي تعديل على أي حقل.';
        } else {
          out.className = 'ka-verify-out ka-verify-out--ok';
          out.textContent = 'لم يكسر (هذا غريب — تحقق من الدالة).';
        }
      }
    });
  }

  // ── devtools window helper (no console.log in production) ──────────────
  window.__kernelAudit = {
    trace: function (id: string) {
      if (!fullRows) return { error: 'dataset not ready' };
      const idx = findIndexByTrace(id);
      if (idx === -1) return { error: 'trace not found: ' + id };
      const r = fullRows[idx];
      return {
        traceId: r.traceId,
        timestamp: r.tsLabel,
        user: r.userLabel,
        department: r.role,
        action: r.action,
        riskScore: r.risk,
        status: r.status,
        humanApproved: r.humanApproved,
        anomaly: r.anomaly,
        prevHash: r.prevHash,
        hash: r.hash,
        chainLinkValid: verifyRowLocal(fullRows, idx).ok,
      };
    },
    dataset: function () { return fullRows ? fullRows.length : 0; },
  };

  // ── boot wiring ────────────────────────────────────────────────────────
  function init() {
    boot();
  }

  // Listen for worker init completion.
  function wireWorkerInit() {
    if (!worker) return;
    worker.addEventListener('message', function (ev) {
      const d = ev.data;
      if (d && d.type === 'init') {
        workerReady = true;
        // Ask the worker to compute + cache the first filtered set.
        currentTotal = fullRows ? fullRows.length : 0;
        request({ type: 'filter', filters: filters }).then(handleFiltered);
      }
    });
  }

  // Override boot to wire worker-init once the worker exists.
  const _boot = boot;
  boot = function () {
    _boot();
    wireWorkerInit();
  };

  document.addEventListener('astro:page-load', init);
  if (document.readyState !== 'loading') init();

  // AUDIT-URL: restore filters when the user navigates with browser back/forward.
  // boot() only runs once (guarded by data-audit-bound), so popstate must
  // re-read the URL and re-apply the filter directly. Bound once on the window.
  window.addEventListener('popstate', function () {
    // Reset filters to empty first, then layer URL values on top.
    Object.assign(filters, { dateFrom: '', dateTo: '', risk: '', status: '', user: '', dept: '', search: '' });
    readFiltersFromUrl();
    request({ type: 'filter', filters: filters }).then(handleFiltered);
  });
})();
