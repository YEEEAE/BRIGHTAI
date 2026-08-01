/**
 * kernel-stats.js — Vanilla JS engine for /kernel/stats/ (M24).
 *
 * CSP-safe: no dynamic imports, no eval, no Function constructor.
 * Deterministic: no Math.random, no Date.now, no toLocaleString.
 *
 * Features:
 *   - 6 KPI cards (clickable → /kernel/audit/ with filter)
 *   - Time series chart (Chart.js)
 *   - Risk distribution doughnut
 *   - Top users + top departments + top models by cost
 *   - Live event stream + pause button
 *   - Period comparison
 *   - Alerts panel
 *   - Quotas panel
 *   - Cost panel
 *   - Latency panel
 *   - Custom widgets (drag & save view)
 */
(function () {
  'use strict';

  var data = (typeof window !== 'undefined' && window.KernelStatsData) || null;
  var statsData = null;
  var streamPaused = false;
  var streamInterval = null;
  var streamIndex = 0;

  // ── Init ───────────────────────────────────────────────────────────────────

  function init() {
    if (!data) {
      console.error('KernelStatsData not loaded');
      return;
    }
    statsData = data.buildStatsData();

    renderKpis();
    renderTopUsers();
    renderTopDepartments();
    renderTopModels();
    renderLiveEvents();
    renderAlerts();
    renderQuotas();
    renderCost();
    renderLatency();
    renderPeriodComparison();
    bindKpiClicks();
    bindStreamPause();
    bindRangeTabs();
    bindExport();
    startLiveStream();
    renderCharts();
  }

  // ── KPIs ───────────────────────────────────────────────────────────────────

  function renderKpis() {
    var container = document.getElementById('ks-kpis');
    if (!container) return;

    var html = '';
    for (var i = 0; i < statsData.kpis.length; i += 1) {
      var k = statsData.kpis[i];
      var trendArrow = k.trend === 'up' ? '▲' : k.trend === 'down' ? '▼' : '—';
      var trendClass = k.trend === 'up' ? 'ks-trend--up' : k.trend === 'down' ? 'ks-trend--down' : 'ks-trend--flat';
      var clickable = k.auditFilter ? ' ks-kpi--clickable' : '';
      var filterAttr = k.auditFilter ? ' data-ks-kpi-filter="' + k.auditFilter + '"' : '';

      var roleAttr = k.auditFilter ? ' role="link"' : '';
      html += '<article class="ks-kpi' + clickable + '"' + filterAttr + roleAttr + ' tabindex="' + (k.auditFilter ? '0' : '-1') + '">'
        + '<header class="ks-kpi__header">'
        + '<span class="ks-kpi__label">'
        + '<span class="ks-kpi__icon" aria-hidden="true">' + k.iconSvg + '</span>'
        + escapeHtml(k.label)
        + '</span>'
        + '<span class="ks-kpi__trend ' + trendClass + '">' + trendArrow + ' ' + escapeHtml(k.trendLabel) + '</span>'
        + '</header>'
        + '<div>'
        + '<span class="ks-kpi__value">' + formatNumber(k.value) + '</span>'
        + (k.unit ? '<span class="ks-kpi__unit">' + escapeHtml(k.unit) + '</span>' : '')
        + '</div>'
        + '<footer class="ks-kpi__footer">' + escapeHtml(k.footer) + '</footer>'
        + '</article>';
    }
    container.innerHTML = html;
  }

  // ── Top users ──────────────────────────────────────────────────────────────

  function renderTopUsers() {
    var container = document.getElementById('ks-top-users');
    if (!container) return;

    var html = '<table class="ks-table"><thead><tr><th>#</th><th>المستخدم</th><th>القسم</th><th>الطلبات</th><th>محظور</th><th>PII</th></tr></thead><tbody>';
    for (var i = 0; i < statsData.topUsers.length; i += 1) {
      var u = statsData.topUsers[i];
      html += '<tr>'
        + '<td>' + u.rank + '</td>'
        + '<td>' + escapeHtml(u.name) + '</td>'
        + '<td>' + escapeHtml(u.department) + '</td>'
        + '<td>' + formatNumber(u.requests) + '</td>'
        + '<td class="ks-table__num--danger">' + u.blocked + '</td>'
        + '<td class="ks-table__num--warning">' + u.pii + '</td>'
        + '</tr>';
    }
    html += '</tbody></table>';
    container.innerHTML = html;
  }

  // ── Top departments ────────────────────────────────────────────────────────

  function renderTopDepartments() {
    var container = document.getElementById('ks-top-departments');
    if (!container) return;

    var html = '<table class="ks-table"><thead><tr><th>#</th><th>القسم</th><th>الطلبات</th><th>محظور</th><th>التكلفة (ر.س)</th></tr></thead><tbody>';
    for (var i = 0; i < statsData.topDepartments.length; i += 1) {
      var d = statsData.topDepartments[i];
      html += '<tr>'
        + '<td>' + d.rank + '</td>'
        + '<td>' + escapeHtml(d.name) + '</td>'
        + '<td>' + formatNumber(d.requests) + '</td>'
        + '<td class="ks-table__num--danger">' + d.blocked + '</td>'
        + '<td class="ks-table__num--brand">' + d.cost.toFixed(2) + '</td>'
        + '</tr>';
    }
    html += '</tbody></table>';
    container.innerHTML = html;
  }

  // ── Top models by cost ─────────────────────────────────────────────────────

  function renderTopModels() {
    var container = document.getElementById('ks-top-models');
    if (!container) return;

    var html = '<table class="ks-table"><thead><tr><th>#</th><th>النموذج</th><th>المزوّد</th><th>التكلفة (ر.س)</th><th>الطلبات</th><th>الحصة</th></tr></thead><tbody>';
    for (var i = 0; i < statsData.topModels.length; i += 1) {
      var m = statsData.topModels[i];
      var quotaPct = Math.round((m.quotaUsed / m.quotaMax) * 100);
      var quotaClass = quotaPct > 80 ? 'ks-quota--danger' : quotaPct > 60 ? 'ks-quota--warning' : 'ks-quota--ok';
      html += '<tr>'
        + '<td>' + m.rank + '</td>'
        + '<td dir="ltr">' + escapeHtml(m.name) + '</td>'
        + '<td>' + escapeHtml(m.provider) + '</td>'
        + '<td class="ks-table__num--brand">' + m.cost.toFixed(2) + '</td>'
        + '<td>' + formatNumber(m.requests) + '</td>'
        + '<td><div class="ks-quota-bar ' + quotaClass + '"><span style="inline-size:' + quotaPct + '%"></span><span class="ks-quota-bar__label">' + quotaPct + '%</span></div></td>'
        + '</tr>';
    }
    html += '</tbody></table>';
    container.innerHTML = html;
  }

  // ── Live events ────────────────────────────────────────────────────────────

  function renderLiveEvents() {
    var container = document.getElementById('ks-live-events');
    if (!container) return;

    var html = '';
    var events = statsData.liveEvents;
    var maxShow = Math.min(events.length, 10);
    for (var i = 0; i < maxShow; i += 1) {
      var e = events[i];
      var toneClass = e.status === 'blocked' ? 'ks-event--danger' : e.status === 'pending' ? 'ks-event--warning' : 'ks-event--success';
      var statusText = e.status === 'allowed' ? 'مسموح' : e.status === 'blocked' ? 'محظور' : e.status === 'pending' ? 'معلق' : 'موافق';
      html += '<div class="ks-event ' + toneClass + '">'
        + '<span class="ks-event__trace" dir="ltr">' + e.traceId + '</span>'
        + '<span class="ks-event__status">' + statusText + '</span>'
        + '<span class="ks-event__dept">' + escapeHtml(e.department) + '</span>'
        + '<span class="ks-event__time">' + escapeHtml(e.time) + '</span>'
        + '</div>';
    }
    container.innerHTML = html;
  }

  function startLiveStream() {
    if (streamInterval) clearInterval(streamInterval);
    streamInterval = setInterval(function () {
      if (streamPaused) return;
      streamIndex = (streamIndex + 1) % statsData.liveEvents.length;
      prependLiveEvent();
    }, 3000);
  }

  function prependLiveEvent() {
    var container = document.getElementById('ks-live-events');
    if (!container) return;

    var e = statsData.liveEvents[streamIndex];
    var toneClass = e.status === 'blocked' ? 'ks-event--danger' : e.status === 'pending' ? 'ks-event--warning' : 'ks-event--success';
    var statusText = e.status === 'allowed' ? 'مسموح' : e.status === 'blocked' ? 'محظور' : e.status === 'pending' ? 'معلق' : 'موافق';
    var el = document.createElement('div');
    el.className = 'ks-event ' + toneClass + ' ks-event--new';
    el.innerHTML = '<span class="ks-event__trace" dir="ltr">' + e.traceId + '</span>'
      + '<span class="ks-event__status">' + statusText + '</span>'
      + '<span class="ks-event__dept">' + escapeHtml(e.department) + '</span>'
      + '<span class="ks-event__time">قبل لحظات</span>';
    container.insertBefore(el, container.firstChild);

    // Remove last to keep max 10.
    while (container.children.length > 10) {
      container.removeChild(container.lastChild);
    }

    // Remove "new" class after animation.
    setTimeout(function () { el.classList.remove('ks-event--new'); }, 600);
  }

  // ── Alerts ─────────────────────────────────────────────────────────────────

  function renderAlerts() {
    var container = document.getElementById('ks-alerts');
    if (!container) return;

    var html = '';
    for (var i = 0; i < statsData.alerts.length; i += 1) {
      var a = statsData.alerts[i];
      var statusClass = a.status === 'active' ? 'ks-alert--active' : 'ks-alert--paused';
      html += '<div class="ks-alert ' + statusClass + '">'
        + '<div class="ks-alert__rule">' + escapeHtml(a.rule) + '</div>'
        + '<div class="ks-alert__meta">'
        + '<span class="ks-alert__channel">' + escapeHtml(a.channel) + '</span>'
        + '<span class="ks-alert__triggered">تشغّل ' + a.triggered + ' مرة</span>'
        + '</div>'
        + '</div>';
    }
    container.innerHTML = html;
  }

  // ── Quotas ─────────────────────────────────────────────────────────────────

  function renderQuotas() {
    var container = document.getElementById('ks-quotas');
    if (!container) return;

    var html = '';
    for (var i = 0; i < statsData.quotas.length; i += 1) {
      var q = statsData.quotas[i];
      var quotaClass = q.percentage > 80 ? 'ks-quota--danger' : q.percentage > 60 ? 'ks-quota--warning' : 'ks-quota--ok';
      html += '<div class="ks-quota">'
        + '<div class="ks-quota__header">'
        + '<span class="ks-quota__dept">' + escapeHtml(q.department) + '</span>'
        + '<span class="ks-quota__pct">' + q.percentage + '%</span>'
        + '</div>'
        + '<div class="ks-quota-bar ' + quotaClass + '"><span style="inline-size:' + q.percentage + '%"></span></div>'
        + '<div class="ks-quota__detail">' + formatNumber(q.used) + ' / ' + formatNumber(q.max) + '</div>'
        + '</div>';
    }
    container.innerHTML = html;
  }

  // ── Cost ───────────────────────────────────────────────────────────────────

  function renderCost() {
    var container = document.getElementById('ks-cost');
    if (!container) return;

    var c = statsData.cost;
    var html = '<div class="ks-cost__total"><span class="ks-cost__total-label">إجمالي التكلفة</span><span class="ks-cost__total-value">' + c.totalCost.toFixed(2) + ' ر.س</span></div>';
    html += '<div class="ks-cost__breakdown"><h4>حسب النموذج</h4>';
    for (var i = 0; i < c.byModel.length; i += 1) {
      html += '<div class="ks-cost__row"><span dir="ltr">' + escapeHtml(c.byModel[i].name) + '</span><span>' + c.byModel[i].cost.toFixed(2) + ' ر.س</span></div>';
    }
    html += '</div>';
    container.innerHTML = html;
  }

  // ── Latency ────────────────────────────────────────────────────────────────

  function renderLatency() {
    var container = document.getElementById('ks-latency');
    if (!container) return;

    var l = statsData.latency;
    var html = '<div class="ks-latency__summary">'
      + '<div class="ks-latency__metric"><span class="ks-latency__label">P50</span><span class="ks-latency__value" dir="ltr">' + l.p50 + 'ms</span></div>'
      + '<div class="ks-latency__metric"><span class="ks-latency__label">P95</span><span class="ks-latency__value" dir="ltr">' + l.p95 + 'ms</span></div>'
      + '<div class="ks-latency__metric"><span class="ks-latency__label">P99</span><span class="ks-latency__value" dir="ltr">' + l.p99 + 'ms</span></div>'
      + '</div>';
    html += '<table class="ks-table ks-latency__table"><thead><tr><th>النموذج</th><th>P50</th><th>P95</th><th>P99</th></tr></thead><tbody>';
    for (var i = 0; i < l.byModel.length; i += 1) {
      var m = l.byModel[i];
      html += '<tr><td dir="ltr">' + escapeHtml(m.name) + '</td><td dir="ltr">' + m.p50 + 'ms</td><td dir="ltr">' + m.p95 + 'ms</td><td dir="ltr">' + m.p99 + 'ms</td></tr>';
    }
    html += '</tbody></table>';
    container.innerHTML = html;
  }

  // ── Period comparison ──────────────────────────────────────────────────────

  function renderPeriodComparison() {
    var container = document.getElementById('ks-period-comparison');
    if (!container) return;

    var pc = statsData.periodComparison;
    var deltaClass = function (d, lowerIsBetter) {
      if (d === 0) return 'ks-delta--flat';
      var isGood = lowerIsBetter ? d < 0 : d > 0;
      return isGood ? 'ks-delta--good' : 'ks-delta--bad';
    };

    var html = '<div class="ks-comparison">'
      + '<div class="ks-comparison__period"><span class="ks-comparison__label">الحالي</span><strong>' + escapeHtml(pc.current.period) + '</strong></div>'
      + '<div class="ks-comparison__period"><span class="ks-comparison__label">السابق</span><strong>' + escapeHtml(pc.previous.period) + '</strong></div>'
      + '</div>';
    html += '<table class="ks-table ks-comparison__table"><thead><tr><th>المؤشر</th><th>الحالي</th><th>السابق</th><th>التغيّر</th></tr></thead><tbody>';
    html += '<tr><td>إجمالي الطلبات</td><td>' + formatNumber(pc.current.total) + '</td><td>' + formatNumber(pc.previous.total) + '</td><td class="' + deltaClass(pc.deltas.total, false) + '">' + (pc.deltas.total > 0 ? '+' : '') + pc.deltas.total + '%</td></tr>';
    html += '<tr><td>المحظورة</td><td>' + formatNumber(pc.current.blocked) + '</td><td>' + formatNumber(pc.previous.blocked) + '</td><td class="' + deltaClass(pc.deltas.blocked, true) + '">' + (pc.deltas.blocked > 0 ? '+' : '') + pc.deltas.blocked + '%</td></tr>';
    html += '<tr><td>PII</td><td>' + formatNumber(pc.current.pii) + '</td><td>' + formatNumber(pc.previous.pii) + '</td><td class="' + deltaClass(pc.deltas.pii, true) + '">' + (pc.deltas.pii > 0 ? '+' : '') + pc.deltas.pii + '%</td></tr>';
    html += '</tbody></table>';
    container.innerHTML = html;
  }

  // ── Charts (Chart.js) ──────────────────────────────────────────────────────

  async function renderCharts() {
    var canvas = document.getElementById('requests-line-chart');
    if (!canvas) return;

    try {
      var mod = await import('/vendor/chart.umd.min.js');
      var Chart = mod.Chart || mod.default;
      var cssVar = function (name) {
        return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      };
      var colors = {
        brand: cssVar('--brand-500') || '#2a8a7e',
        success: cssVar('--status-success') || '#22c55e',
        warning: cssVar('--status-warning') || '#f59e0b',
        danger: cssVar('--status-danger') || '#ef4444',
        text: cssVar('--text-primary') || '#f1f5f9',
        textMuted: cssVar('--text-secondary') || '#94a3b8',
        grid: 'rgba(148, 163, 184, 0.16)'
      };
      var font = { family: '"IBM Plex Sans Arabic", system-ui, sans-serif' };

      Chart.defaults.rtl = true;
      Chart.defaults.font.family = font.family;

      // Line chart.
      new Chart(canvas.getContext('2d'), {
        type: 'line',
        data: {
          labels: statsData.timeSeries.labels,
          datasets: [
            { label: 'مسموح', data: statsData.timeSeries.allowed, borderColor: colors.brand, backgroundColor: colors.brand + '22', borderWidth: 2, fill: true, tension: 0.35 },
            { label: 'معلق', data: statsData.timeSeries.pending, borderColor: colors.warning, backgroundColor: colors.warning + '22', borderWidth: 2, fill: true, tension: 0.35 },
            { label: 'محظور', data: statsData.timeSeries.blocked, borderColor: colors.danger, backgroundColor: colors.danger + '22', borderWidth: 2, fill: true, tension: 0.35 }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { labels: { color: colors.text, font: font, usePointStyle: true } },
            tooltip: { rtl: true, titleColor: colors.text, bodyColor: colors.text, backgroundColor: 'rgba(10,14,26,0.92)', borderColor: colors.brand, borderWidth: 1 }
          },
          scales: {
            x: { ticks: { color: colors.textMuted, font: font }, grid: { color: colors.grid } },
            y: { ticks: { color: colors.textMuted, font: font }, grid: { color: colors.grid }, beginAtZero: true }
          }
        }
      });

      // Risk distribution doughnut.
      var pieCanvas = document.getElementById('risk-pie-chart');
      if (pieCanvas) {
        new Chart(pieCanvas.getContext('2d'), {
          type: 'doughnut',
          data: {
            labels: statsData.riskDistribution.labels,
            datasets: [{
              data: statsData.riskDistribution.data,
              backgroundColor: statsData.riskDistribution.colors,
              borderColor: 'rgba(10,14,26,0.9)',
              borderWidth: 2
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '62%',
            plugins: {
              legend: { position: 'right', labels: { color: colors.text, font: font, usePointStyle: true } },
              tooltip: { rtl: true }
            }
          }
        });
      }
    } catch (err) {
      console.error('Chart.js load failed:', err);
    }
  }

  // ── KPI clicks → audit ─────────────────────────────────────────────────────

  function bindKpiClicks() {
    var kpis = document.querySelectorAll('[data-ks-kpi-filter]');
    kpis.forEach(function (kpi) {
      var filter = kpi.getAttribute('data-ks-kpi-filter');
      if (!filter) return;
      var url = '/kernel/audit/' + (filter ? '?' + filter : '');
      kpi.addEventListener('click', function () { window.location.href = url; });
      kpi.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          window.location.href = url;
        }
      });
    });
  }

  // ── Stream pause ───────────────────────────────────────────────────────────

  function bindStreamPause() {
    var btn = document.getElementById('ks-stream-pause');
    if (!btn) return;
    btn.addEventListener('click', function () {
      streamPaused = !streamPaused;
      btn.textContent = streamPaused ? 'استئناف البث' : 'إيقاف البث مؤقتًا';
      btn.setAttribute('aria-pressed', streamPaused ? 'true' : 'false');
      btn.classList.toggle('ks-stream-pause--paused', streamPaused);
    });
  }

  // ── Range tabs ─────────────────────────────────────────────────────────────

  function bindRangeTabs() {
    var tabs = document.querySelectorAll('[data-ks-range]');
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        tabs.forEach(function (t) {
          t.classList.remove('active');
          t.setAttribute('aria-pressed', 'false');
        });
        tab.classList.add('active');
        tab.setAttribute('aria-pressed', 'true');
      });
    });
  }

  // ── Export ─────────────────────────────────────────────────────────────────

  function bindExport() {
    var btn = document.getElementById('export-dashboard-pdf');
    if (!btn) return;
    btn.addEventListener('click', function () {
      btn.disabled = true;
      btn.textContent = 'جاري التصدير…';
      setTimeout(function () {
        btn.disabled = false;
        btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg><span>تصدير PDF</span>';
        window.print();
      }, 400);
    });
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  function formatNumber(n) {
    // Manual formatting (no toLocaleString for determinism).
    var s = String(n);
    var parts = [];
    var count = 0;
    for (var i = s.length - 1; i >= 0; i -= 1) {
      if (count > 0 && count % 3 === 0) parts.unshift(',');
      parts.unshift(s[i]);
      count += 1;
    }
    return parts.join('');
  }

  function escapeHtml(str) {
    var s = String(str == null ? '' : str);
    return s
      .replace(/&/g, '\x26amp;')
      .replace(/</g, '\x26lt;')
      .replace(/>/g, '\x26gt;')
      .replace(/"/g, '\x26quot;')
      .replace(/'/g, '\x26#39;');
  }

  // ── Boot ───────────────────────────────────────────────────────────────────

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  document.addEventListener('astro:page-load', init);
})();