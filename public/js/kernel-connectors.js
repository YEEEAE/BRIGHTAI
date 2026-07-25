/**
 * kernel-connectors.js — BAI-SEC-18 (2026-07-25)
 *
 * Extracted from src/pages/kernel/connectors.astro inline
 * <script is:inline define:vars={{ connectors }}> block to enable
 * strict-CSP. The `connectors` array is now passed via a sibling
 * <script type="application/json" id="kernel-connectors-data">
 * data block; this file reads it via JSON.parse at init time.
 *
 * Loaded as a static ES module via
 * <script type="module" src="/js/kernel-connectors.js">.
 *
 * Behavior preserved verbatim (see original inline script for the
 * REPORTS-15 + KERNEL-AI-2026-07-14 context):
 *   - Reads #kernel-connectors-data JSON block, parses the
 *     `connectors` array
 *   - Opens the connector-config modal on [data-configure-connector]
 *     click, populating fields + sync log + stats from the matching
 *     connector entry
 *   - Closes modal on [data-close-connector-modal] click or Escape
 *   - [data-sync-connector] gives visual "syncing…" feedback (1.5s)
 *   - #save-connector-btn gives visual "saving…" → "saved" feedback
 *     then auto-closes the modal
 */
(function () {
  'use strict';

  function readConnectors() {
    var el = document.getElementById('kernel-connectors-data');
    if (!el) return [];
    try {
      var data = JSON.parse(el.textContent || '[]');
      return Array.isArray(data) ? data : [];
    } catch (e) {
      console.warn('[kernel-connectors] failed to parse data block', e);
      return [];
    }
  }

  function init() {
    var connectors = readConnectors();
    if (connectors.length === 0) return;

    var modal = document.getElementById('connector-modal');
    var titleEl = document.getElementById('connector-modal-title');
    var subtitleEl = document.getElementById('connector-modal-subtitle');
    var endpointEl = document.getElementById('connector-endpoint');
    var authEl = document.getElementById('connector-auth');
    var freqEl = document.getElementById('connector-freq');
    var syncLog = document.getElementById('connector-sync-log');
    var statsEl = document.getElementById('connector-stats');

    function openConnectorConfig(id) {
      var c = connectors.find(function (x) { return x.id === id; });
      if (!c) return;
      titleEl.textContent = 'إعدادات: ' + c.name;
      subtitleEl.textContent = c.category + ' · ' + c.authMethod;
      endpointEl.value = c.endpoint;
      authEl.value = c.authMethod;
      freqEl.value = c.syncFreq.indexOf('real-time') > -1
        ? 'realtime'
        : c.syncFreq.indexOf('5') > -1
        ? '5min'
        : c.syncFreq.indexOf('15') > -1
        ? '15min'
        : c.syncFreq.indexOf('30') > -1
        ? '30min'
        : c.syncFreq.indexOf('ساعة') > -1
        ? 'hourly'
        : 'daily';

      // Sync log (demo data)
      var logEntries = c.status === 'connected' ? [
        { time: 'الآن', label: 'مزامنة ناجحة', count: 47, status: 'success' },
        { time: 'قبل 5د', label: 'مزامنة ناجحة', count: 51, status: 'success' },
        { time: 'قبل 10د', label: 'مزامنة ناجحة', count: 49, status: 'success' },
        { time: 'قبل 15د', label: 'مزامنة ناجحة', count: 52, status: 'success' },
        { time: 'قبل 20د', label: 'تحذير: زمن استجابة مرتفع', count: 38, status: 'warning' },
      ] : c.status === 'error' ? [
        { time: 'قبل ساعتين', label: 'خطأ: انتهت صلاحية Token', count: 0, status: 'error' },
        { time: 'قبل 4 ساعات', label: 'مزامنة ناجحة', count: 45, status: 'success' },
        { time: 'قبل 5 ساعات', label: 'مزامنة ناجحة', count: 42, status: 'success' },
      ] : [
        { time: '—', label: 'في انتظار إعداد OAuth', count: 0, status: 'pending' },
      ];

      syncLog.innerHTML = logEntries.map(function (e) {
        return (
          '<li class="kernel-connector-sync-log__entry">' +
            '<span class="kernel-connector-sync-log__status kernel-connector-sync-log__status--' + e.status + '"></span>' +
            '<div class="kernel-connector-sync-log__body">' +
              '<strong>' + e.label + '</strong>' +
              '<span>' + e.time + (e.count ? ' · ' + e.count + ' سجل' : '') + '</span>' +
            '</div>' +
          '</li>'
        );
      }).join('');

      statsEl.innerHTML =
        '<div class="kernel-connector-stats__item">' +
          '<span>إجمالي السجلات المتدفقة</span>' +
          '<strong>' + c.totalRecords.toLocaleString('ar-SA') + '</strong>' +
        '</div>' +
        '<div class="kernel-connector-stats__item">' +
          '<span>متوسط زمن الاستجابة</span>' +
          '<strong>' + (c.avgLatencyMs || '—') + ' ms</strong>' +
        '</div>' +
        '<div class="kernel-connector-stats__item">' +
          '<span>Uptime (30 يوم)</span>' +
          '<strong>' + c.uptime + '</strong>' +
        '</div>';

      modal.hidden = false;
      document.body.style.overflow = 'hidden';
    }

    function closeModal() {
      modal.hidden = true;
      document.body.style.overflow = '';
    }

    document.querySelectorAll('[data-configure-connector]').forEach(function (btn) {
      btn.addEventListener('click', function () { openConnectorConfig(btn.dataset.configureConnector); });
    });
    document.querySelectorAll('[data-close-connector-modal]').forEach(function (el) {
      el.addEventListener('click', closeModal);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !modal.hidden) closeModal();
    });

    // Sync now button (visual feedback)
    document.querySelectorAll('[data-sync-connector]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (btn.disabled) return;
        var original = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<span>جاري المزامنة…</span>';
        setTimeout(function () {
          btn.disabled = false;
          btn.innerHTML = original;
        }, 1500);
      });
    });

    var saveBtn = document.getElementById('save-connector-btn');
    if (saveBtn) {
      saveBtn.addEventListener('click', function () {
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<span>جاري الحفظ…</span>';
        setTimeout(function () {
          saveBtn.disabled = false;
          saveBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><polyline points="20 6 9 17 4 12"/></svg><span>تم الحفظ</span>';
          setTimeout(closeModal, 800);
        }, 600);
      });
    }
  }

  document.addEventListener('astro:page-load', init);
  if (document.readyState !== 'loading') init();
})();
