/**
 * kernel-connectors.js — Vanilla JS engine for /kernel/connectors/ (M26).
 *
 * Reads window.KernelConnectorsData (from kernel-connectors-data.js).
 * Renders: KPIs + connector grid + drawer (data flow + live test + sync log +
 * queue) + token renewal + OAuth setup + custom connector guide.
 *
 * CSP-safe: type="module", no dynamic imports, no eval.
 * Deterministic: no Math.random, no Date.now, no toLocaleString.
 * Respects prefers-reduced-motion.
 */
(function () {
  'use strict';

  var data = (typeof window !== 'undefined' && window.KernelConnectorsData) || null;
  var connectorsData = null;
  var reducedMotion = false;

  function init() {
    if (!data) {
      console.error('KernelConnectorsData not loaded');
      return;
    }
    connectorsData = data.buildConnectorsData();
    reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    renderKpis();
    renderGrid();
    renderCustomGuide();
    bindConnectorCards();
    bindModal();
  }

  // ── KPIs ───────────────────────────────────────────────────────────────────

  function renderKpis() {
    var kpis = connectorsData.kpis;
    var els = {
      total: document.getElementById('kc-kpi-total'),
      active: document.getElementById('kc-kpi-active'),
      requests: document.getElementById('kc-kpi-requests'),
      latency: document.getElementById('kc-kpi-latency'),
    };
    if (els.total) els.total.textContent = String(kpis.total);
    if (els.active) els.active.textContent = String(kpis.active);
    if (els.requests) els.requests.textContent = fmtCount(kpis.requestsToday);
    if (els.latency) els.latency.textContent = kpis.avgLatency + 'ms';
  }

  function fmtCount(n) {
    var s = String(n);
    var parts = [];
    while (s.length > 3) {
      parts.unshift(s.slice(-3));
      s = s.slice(0, -3);
    }
    parts.unshift(s);
    return parts.join(',');
  }

  // ── Connector grid ─────────────────────────────────────────────────────────

  function renderGrid() {
    var grid = document.getElementById('kc-grid');
    if (!grid) return;

    var html = '';
    connectorsData.connectors.forEach(function (c) {
      var statusClass = 'kc-card--' + c.status;
      var healthColor = c.healthPercent >= 99 ? 'var(--status-success)' : c.healthPercent >= 95 ? 'var(--status-warning)' : 'var(--status-danger)';

      html += '<article class="kc-card ' + statusClass + '" data-connector-id="' + c.id + '">';
      html += '<div class="kc-card__main" role="button" tabindex="0" aria-label="' + c.name + ' — افتح التفاصيل">';
      html += '<header class="kc-card__header">';
      html += '<div class="kc-card__icon-block">';
      html += '<span class="kc-card__icon" aria-hidden="true">' + c.icon + '</span>';
      html += '<span class="kc-card__status-dot kc-card__status-dot--' + c.status + '" aria-label="الحالة: ' + c.statusLabel + '"></span>';
      html += '</div>';
      html += '<div class="kc-card__title-block">';
      html += '<h3 class="kc-card__name">' + c.name + '</h3>';
      html += '<p class="kc-card__category">' + c.category + ' · ' + c.authMethod + '</p>';
      html += '</div>';
      html += '</header>';

      html += '<p class="kc-card__description">' + c.description + '</p>';

      html += '<div class="kc-card__status-row">';
      html += '<span class="kc-card__status-pill kc-card__status-pill--' + c.status + '">' + c.statusLabel + '</span>';
      html += '<span class="kc-card__uptime">' + c.uptime + '</span>';
      html += '</div>';

      html += '<div class="kc-card__metrics">';
      html += '<div class="kc-card__metric"><span class="kc-card__metric-label">آخر مزامنة</span><span class="kc-card__metric-value">' + c.lastSync + '</span></div>';
      html += '<div class="kc-card__metric"><span class="kc-card__metric-label">اليوم</span><span class="kc-card__metric-value">' + fmtCount(c.recordsToday) + '</span></div>';
      html += '<div class="kc-card__metric"><span class="kc-card__metric-label">زمن الاستجابة</span><span class="kc-card__metric-value">' + (c.avgLatencyMs > 0 ? c.avgLatencyMs + ' ms' : '—') + '</span></div>';
      html += '</div>';

      html += '<div class="kc-card__health">';
      html += '<div class="kc-card__health-bar"><div class="kc-card__health-fill" style="width:' + c.healthPercent + '%; background:' + healthColor + '"></div></div>';
      html += '<span class="kc-card__health-label">الصحة ' + c.healthPercent + '%</span>';
      html += '</div>';

      html += '<div class="kc-card__readonly"><span class="kc-card__readonly-badge">🔒 قراءة فقط</span></div>';
      html += '</div>';

      // M29: زر الحالة خارج منطقة النقر حتى لا تتداخل الـ interactive controls
      if (c.status === 'error' && c.errorMsg) {
        html += '<div class="kc-card__error">';
        html += '<span class="kc-card__error-icon">⚠️</span>';
        html += '<span>' + c.errorMsg + '</span>';
        html += '<button type="button" class="kc-card__renew-btn" data-renew-token="' + c.id + '">جدّد التوكن الآن</button>';
        html += '</div>';
      }

      if (c.status === 'pending') {
        html += '<div class="kc-card__pending">';
        html += '<span class="kc-card__pending-icon">⏸️</span>';
        html += '<span>يتطلب إعداد OAuth</span>';
        html += '<button type="button" class="kc-card__setup-btn" data-setup-oauth="' + c.id + '">أكمل إعداد OAuth</button>';
        html += '</div>';
      }

      html += '</article>';
    });

    html += '<article class="kc-card kc-card--custom" data-custom-guide>';
    html += '<div class="kc-card__custom-icon">+</div>';
    html += '<h3 class="kc-card__name">موصل مخصص</h3>';
    html += '<p class="kc-card__description">ابنِ موصل لنظامك الخاص في 4 خطوات.</p>';
    html += '<button type="button" class="kc-card__custom-btn" data-custom-guide-open>ابدأ البناء</button>';
    html += '</article>';

    grid.innerHTML = html;
  }

  // ── Custom guide ───────────────────────────────────────────────────────────

  function renderCustomGuide() {
    var guide = document.getElementById('kc-custom-guide');
    if (!guide) return;

    var html = '';
    connectorsData.customGuide.forEach(function (s) {
      html += '<div class="kc-guide__step">';
      html += '<div class="kc-guide__step-num">' + s.step + '</div>';
      html += '<div class="kc-guide__step-body">';
      html += '<h4 class="kc-guide__step-title">' + s.title + '</h4>';
      html += '<p class="kc-guide__step-desc">' + s.description + '</p>';
      html += '</div>';
      html += '</div>';
    });

    guide.innerHTML = html;
  }

  // ── Connector cards: open drawer ────────────────────────────────────────────

  function bindConnectorCards() {
    var grid = document.getElementById('kc-grid');
    if (!grid) return;

    grid.addEventListener('click', function (e) {
      var card = e.target.closest('[data-connector-id]');
      if (!card) return;
      if (e.target.closest('button')) return;
      var id = card.dataset.connectorId;
      openDrawer(id);
    });

    grid.addEventListener('keydown', function (e) {
      var card = e.target.closest('[data-connector-id]');
      if (!card) return;
      if (e.target.closest('button')) return; // M29: لا تفتح الـ drawer من الأزرار الداخلية
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openDrawer(card.dataset.connectorId);
      }
    });

    grid.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-renew-token]');
      if (!btn) return;
      e.stopPropagation();
      renewToken(btn.dataset.renewToken);
    });

    grid.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-setup-oauth]');
      if (!btn) return;
      e.stopPropagation();
      setupOAuth(btn.dataset.setupOauth);
    });

    var customBtn = document.querySelector('[data-custom-guide-open]');
    if (customBtn) {
      customBtn.addEventListener('click', function () {
        var guide = document.getElementById('kc-custom-guide-section');
        if (guide) guide.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
      });
    }
  }

  function renewToken(id) {
    var connector = connectorsData.connectors.find(function (c) { return c.id === id; });
    if (!connector) return;
    showToast('🔄 يجدد التوكن لـ ' + connector.name + '...', 'info');
    setTimeout(function () {
      showToast('✅ تم تجديد التوكن لـ ' + connector.name, 'success');
    }, 1500);
  }

  function setupOAuth(id) {
    var connector = connectorsData.connectors.find(function (c) { return c.id === id; });
    if (!connector) return;
    showToast('🔧 يفتح إعداد OAuth لـ ' + connector.name + '...', 'info');
  }

  // ── Drawer ─────────────────────────────────────────────────────────────────

  function openDrawer(id) {
    var connector = connectorsData.connectors.find(function (c) { return c.id === id; });
    if (!connector) return;

    var drawer = document.getElementById('kc-drawer');
    if (!drawer) return;

    var titleEl = drawer.querySelector('[data-drawer-title]');
    var subtitleEl = drawer.querySelector('[data-drawer-subtitle]');
    if (titleEl) titleEl.textContent = connector.name;
    if (subtitleEl) subtitleEl.textContent = connector.category + ' · ' + connector.authMethod;

    renderDataFlow(connector);
    renderLiveTest(connector);
    renderSyncLog(connector);
    renderQueue(connector);

    drawer.dataset.open = 'true';
    drawer.hidden = false;
    document.body.classList.add('kc-drawer-open');
  }

  function closeDrawer() {
    var drawer = document.getElementById('kc-drawer');
    if (!drawer) return;
    drawer.dataset.open = 'false';
    drawer.hidden = true;
    document.body.classList.remove('kc-drawer-open');
  }

  function bindModal() {
    var drawer = document.getElementById('kc-drawer');
    if (!drawer) return;

    var closeBtn = drawer.querySelector('[data-drawer-close]');
    if (closeBtn) closeBtn.addEventListener('click', closeDrawer);

    var backdrop = drawer.querySelector('[data-drawer-backdrop]');
    if (backdrop) backdrop.addEventListener('click', closeDrawer);

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && drawer.dataset.open === 'true') closeDrawer();
    });
  }

  // ── Data flow diagram ──────────────────────────────────────────────────────

  function renderDataFlow(connector) {
    var container = document.getElementById('kc-drawer-flow');
    if (!container) return;

    var html = '<div class="kc-flow">';
    html += '<div class="kc-flow__node kc-flow__node--source">' + connector.icon + ' ' + connector.name + '</div>';
    html += '<div class="kc-flow__arrow">←</div>';
    html += '<div class="kc-flow__node kc-flow__node--connector">Kernel Connector</div>';
    html += '<div class="kc-flow__arrow">←</div>';
    html += '<div class="kc-flow__node kc-flow__node--kernel">Kernel (حوكمة)</div>';
    html += '<div class="kc-flow__arrow">←</div>';
    html += '<div class="kc-flow__node kc-flow__node--model">نموذج AI</div>';
    html += '</div>';

    container.innerHTML = html;
  }

  // ── Live test (safe mock only) ─────────────────────────────────────────────

  function renderLiveTest(connector) {
    var container = document.getElementById('kc-drawer-test');
    if (!container) return;

    var html = '<div class="kc-test">';
    html += '<p class="kc-test__warning">⚠️ الاختبار يستخدم safe mock فقط — ما نرسل بيانات حقيقية.</p>';
    html += '<div class="kc-test__input-row">';
    html += '<input type="text" class="kc-test__input" placeholder="اكتب استعلام تجريبي..." dir="rtl" aria-label="استعلام تجريبي" />';
    html += '<button type="button" class="kc-test__btn" data-test-run="' + connector.id + '">أرسل</button>';
    html += '</div>';
    html += '<div class="kc-test__response" data-test-response></div>';
    html += '</div>';

    container.innerHTML = html;

    var runBtn = container.querySelector('[data-test-run]');
    if (runBtn) {
      runBtn.addEventListener('click', function () {
        var input = container.querySelector('.kc-test__input');
        var response = container.querySelector('[data-test-response]');
        var query = input && input.value.trim() ? input.value.trim() : 'استعلام تجريبي';

        if (response) {
          response.textContent = '✅ استجابة آمنة (mock): ' + query;
          response.classList.add('kc-test__response--visible');
        }
      });
    }
  }

  // ── Sync log ───────────────────────────────────────────────────────────────

  function renderSyncLog(connector) {
    var container = document.getElementById('kc-drawer-sync');
    if (!container) return;

    var history = connectorsData.syncHistory.filter(function (h) { return h.connectorId === connector.id; });
    var html = '<ol class="kc-sync-log">';
    history.forEach(function (h) {
      var statusIcon = h.status === 'success' ? '✅' : h.status === 'failed' ? '❌' : '⏸️';
      html += '<li class="kc-sync-log__entry kc-sync-log__entry--' + h.status + '">';
      html += '<span class="kc-sync-log__icon">' + statusIcon + '</span>';
      html += '<span class="kc-sync-log__time">' + h.time + '</span>';
      html += '<span class="kc-sync-log__records">' + fmtCount(h.records) + ' سجل</span>';
      if (h.duration > 0) html += '<span class="kc-sync-log__duration">' + h.duration + 'ms</span>';
      html += '</li>';
    });
    html += '</ol>';

    container.innerHTML = html;
  }

  // ── Queue (during outage) ──────────────────────────────────────────────────

  function renderQueue(connector) {
    var container = document.getElementById('kc-drawer-queue');
    if (!container) return;

    if (connector.status !== 'error') {
      container.innerHTML = '';
      return;
    }

    var html = '<div class="kc-queue">';
    html += '<div class="kc-queue__header">';
    html += '<span class="kc-queue__icon">📋</span>';
    html += '<span class="kc-queue__title">طابور الانتظار أثناء الانقطاع</span>';
    html += '</div>';
    html += '<div class="kc-queue__count">42 طلب محتجز</div>';
    html += '<p class="kc-queue__desc">الطلبات تُحتجز وتُعاد المزامنة تلقائياً عند استعادة الاتصال.</p>';
    html += '</div>';

    container.innerHTML = html;
  }

  // ── Toast ──────────────────────────────────────────────────────────────────

  function showToast(msg, level) {
    var toast = document.getElementById('kc-toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.className = 'kc-toast kc-toast--' + (level || 'info');
    toast.hidden = false;
    setTimeout(function () { toast.hidden = true; }, 3000);
  }

  // ── Boot ───────────────────────────────────────────────────────────────────

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  document.addEventListener('astro:page-load', init);
})();