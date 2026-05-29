/**
 * notifications.js — Enterprise Frontend Notification System
 * AR: مكتبة الإشعارات الشاملة للفرونتند — Toasts، مركز الإشعارات، تنبيهات حرجة، وتيار أنشطة.
 * EN: Full frontend notification library — Toasts, Center, Critical Alerts, Activity Feed.
 *
 * Self-injecting IIFE — loads Socket.io client and renders all notification UI automatically.
 */
(function () {
  'use strict';

  /* ======================================================================
     Configuration
     ====================================================================== */
  var API_BASE = '/api';
  var MAX_TOASTS = 5;
  var DEFAULT_TOAST_DURATION = 5000;
  var CRITICAL_TOAST_DURATION = 0; // AR: لا يختفي تلقائياً.

  /* ======================================================================
     State
     ====================================================================== */
  var socket = null;
  var notifications = [];
  var unreadCount = 0;
  var activeToasts = [];
  var activityFeed = [];
  var isNCOpen = false;
  var isPrefsOpen = false;
  var currentFilter = 'all';
  var preferences = {
    channels: { in_app: true, email: false, browser_push: false },
    quiet_hours: { enabled: false, from: 22, to: 7 },
    types: {}
  };

  /* ======================================================================
     SVG Icons
     ====================================================================== */
  var ICONS = {
    bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
    info: '💡',
    success: '✅',
    warning: '⚠️',
    error: '❌',
    critical: '🚨',
    close: '×',
    settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
    empty: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/><line x1="1" y1="1" x2="23" y2="23"/></svg>',
    check_all: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="20 6 9 17 4 12"/></svg>',
    trash: '🗑'
  };

  /* ======================================================================
     Utility Helpers
     ====================================================================== */
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }

  function relativeTime(timestamp) {
    var diff = Date.now() - timestamp;
    var seconds = Math.floor(diff / 1000);
    if (seconds < 60) return 'الآن';
    var minutes = Math.floor(seconds / 60);
    if (minutes < 60) return 'منذ ' + minutes + ' دقيقة';
    var hours = Math.floor(minutes / 60);
    if (hours < 24) return 'منذ ' + hours + ' ساعة';
    var days = Math.floor(hours / 24);
    if (days < 7) return 'منذ ' + days + ' يوم';
    return new Date(timestamp).toLocaleDateString('ar-SA');
  }

  function apiFetch(url, options) {
    options = options || {};
    options.headers = Object.assign({ 'Content-Type': 'application/json' }, options.headers || {});
    options.credentials = 'include';
    return fetch(url, options);
  }

  function escapeHtml(value) {
    return String(value === null || value === undefined ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /* ======================================================================
     DOM Injection — inject all notification UI elements
     ====================================================================== */
  function injectUI() {
    // 1. Toast container
    if (!$('.toast-container')) {
      var tc = document.createElement('div');
      tc.className = 'toast-container';
      tc.id = 'toast-container';
      document.body.appendChild(tc);
    }

    // 2. Notification Bell in topbar
    injectBell();
  }

  function injectBell() {
    // AR: البحث عن الـ topbar — يحتوي عادة على class 'topbar' أو 'top-bar' أو 'header-actions'.
    var topbar = $('.topbar-actions') || $('.topbar-end') || $('.header-actions') || $('.top-bar-actions');
    if (!topbar) {
      // AR: محاولة إنشاء حاوية في أعلى الصفحة إذا لم يوجد topbar.
      topbar = $('.topbar') || $('header');
      if (!topbar) return;
      // AR: البحث عن أي div فرعي في الـ topbar.
      var children = topbar.querySelectorAll('div');
      if (children.length > 0) {
        topbar = children[children.length - 1]; // AR: آخر div عادة هو الـ actions.
      }
    }

    if ($('#notification-bell-wrapper')) return; // AR: موجود بالفعل.

    var wrapper = document.createElement('div');
    wrapper.id = 'notification-bell-wrapper';
    wrapper.style.position = 'relative';
    wrapper.style.display = 'inline-flex';
    wrapper.innerHTML =
      '<button class="notification-bell" id="notification-bell" title="مركز الإشعارات" aria-label="مركز الإشعارات">' +
        ICONS.bell +
        '<span class="notification-badge" id="notification-badge" data-count="0"></span>' +
      '</button>' +
      '<div class="notification-center" id="notification-center">' +
        '<div class="nc-header">' +
          '<h3>الإشعارات</h3>' +
          '<div class="nc-header-actions">' +
            '<button class="nc-action-btn" id="nc-mark-all-read" title="تعليم الكل كمقروء">' + ICONS.check_all + ' قراءة الكل</button>' +
            '<button class="nc-settings-btn" id="nc-settings-btn" title="إعدادات الإشعارات">' + ICONS.settings + '</button>' +
          '</div>' +
        '</div>' +
        '<div class="nc-filters" id="nc-filters">' +
          '<button class="nc-filter-chip active" data-filter="all">الكل</button>' +
          '<button class="nc-filter-chip" data-filter="unread">غير مقروء</button>' +
          '<button class="nc-filter-chip" data-filter="critical">حرج</button>' +
          '<button class="nc-filter-chip" data-filter="warning">تحذير</button>' +
          '<button class="nc-filter-chip" data-filter="success">نجاح</button>' +
          '<button class="nc-filter-chip" data-filter="info">معلومات</button>' +
        '</div>' +
        '<div class="nc-list" id="nc-list"></div>' +
      '</div>';

    // AR: إدراج قبل عنصر آخر في الـ topbar.
    topbar.insertBefore(wrapper, topbar.firstChild);

    // AR: ربط الأحداث.
    bindBellEvents();
  }

  function bindBellEvents() {
    var bell = $('#notification-bell');
    if (!bell) return;

    bell.addEventListener('click', function (e) {
      e.stopPropagation();
      toggleNotificationCenter();
    });

    var markAllBtn = $('#nc-mark-all-read');
    if (markAllBtn) {
      markAllBtn.addEventListener('click', function () {
        markAllRead();
      });
    }

    var settingsBtn = $('#nc-settings-btn');
    if (settingsBtn) {
      settingsBtn.addEventListener('click', function () {
        closeNotificationCenter();
        openPreferencesPanel();
      });
    }

    var filtersEl = $('#nc-filters');
    if (filtersEl) {
      filtersEl.addEventListener('click', function (e) {
        var chip = e.target.closest('.nc-filter-chip');
        if (!chip) return;
        var filter = chip.dataset.filter;
        currentFilter = filter;
        filtersEl.querySelectorAll('.nc-filter-chip').forEach(function (c) { c.classList.remove('active'); });
        chip.classList.add('active');
        renderNCList();
      });
    }

    // AR: إغلاق عند النقر خارج المركز.
    document.addEventListener('click', function (e) {
      var nc = $('#notification-center');
      var bellWrapper = $('#notification-bell-wrapper');
      if (nc && isNCOpen && bellWrapper && !bellWrapper.contains(e.target)) {
        closeNotificationCenter();
      }
    });
  }

  /* ======================================================================
     Toast Notifications
     ====================================================================== */
  function showToast(options) {
    var type = options.type || 'info';
    var title = options.title || '';
    var message = options.message || '';
    var duration = options.duration !== undefined ? options.duration : (type === 'critical' ? CRITICAL_TOAST_DURATION : DEFAULT_TOAST_DURATION);
    var id = options.id || ('toast_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7));

    // AR: تقليم القائمة.
    while (activeToasts.length >= MAX_TOASTS) {
      var oldest = activeToasts.shift();
      removeToast(oldest);
    }

    var container = $('#toast-container');
    if (!container) return;

    var el = document.createElement('div');
    el.className = 'toast-item ' + type;
    el.id = id;
    el.innerHTML =
      '<div class="toast-icon">' + (ICONS[type] || ICONS.info) + '</div>' +
      '<div class="toast-body">' +
        (title ? '<div class="toast-title">' + title + '</div>' : '') +
        (message ? '<div class="toast-message">' + message + '</div>' : '') +
      '</div>' +
      '<button class="toast-close" aria-label="إغلاق">' + ICONS.close + '</button>' +
      (duration > 0 ? '<div class="toast-progress" style="animation-duration:' + duration + 'ms"></div>' : '');

    container.appendChild(el);
    activeToasts.push(id);

    // AR: ربط زر الإغلاق.
    el.querySelector('.toast-close').addEventListener('click', function () {
      removeToast(id);
    });

    // AR: إزالة تلقائية بعد المدة.
    if (duration > 0) {
      setTimeout(function () { removeToast(id); }, duration);
    }

    return id;
  }

  function removeToast(id) {
    var el = document.getElementById(id);
    if (!el) return;
    el.classList.add('removing');
    setTimeout(function () {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 350);
    activeToasts = activeToasts.filter(function (t) { return t !== id; });
  }

  /* ======================================================================
     Notification Center
     ====================================================================== */
  function toggleNotificationCenter() {
    if (isNCOpen) {
      closeNotificationCenter();
    } else {
      openNotificationCenter();
    }
  }

  function openNotificationCenter() {
    var nc = $('#notification-center');
    if (!nc) return;
    isNCOpen = true;
    nc.classList.add('open');
    fetchNotifications();
  }

  function closeNotificationCenter() {
    var nc = $('#notification-center');
    if (!nc) return;
    isNCOpen = false;
    nc.classList.remove('open');
  }

  function fetchNotifications() {
    apiFetch(API_BASE + '/notifications?limit=30')
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data.success && data.data) {
          notifications = data.data.notifications || [];
          unreadCount = data.data.unread || 0;
          updateBadge(unreadCount);
          renderNCList();
        }
      })
      .catch(function () {
        // AR: استخدام البيانات المحلية إذا فشل الاتصال.
        renderNCList();
      });
  }

  function renderNCList() {
    var listEl = $('#nc-list');
    if (!listEl) return;

    var filtered = notifications;
    if (currentFilter === 'unread') {
      filtered = notifications.filter(function (n) { return !n.read; });
    } else if (currentFilter !== 'all') {
      filtered = notifications.filter(function (n) { return n.type === currentFilter; });
    }

    if (!filtered.length) {
      listEl.innerHTML = '<div class="nc-empty">' + ICONS.empty + '<p>لا توجد إشعارات</p></div>';
      return;
    }

    listEl.innerHTML = filtered.map(function (n) {
      return '<div class="nc-item ' + (n.read ? '' : 'unread') + '" data-id="' + n.id + '">' +
        '<div class="nc-item-icon ' + (n.type || 'info') + '">' + (ICONS[n.type] || ICONS.info) + '</div>' +
        '<div class="nc-item-body">' +
          '<div class="nc-item-title">' + (n.title || n.event || '') + '</div>' +
          '<div class="nc-item-message">' + (n.message || '') + '</div>' +
          '<div class="nc-item-time">' + relativeTime(n.created_at) + '</div>' +
        '</div>' +
        '<button class="nc-item-delete" data-delete="' + n.id + '" title="حذف">' + ICONS.trash + '</button>' +
      '</div>';
    }).join('');

    // AR: ربط أحداث النقر.
    listEl.querySelectorAll('.nc-item').forEach(function (item) {
      item.addEventListener('click', function (e) {
        if (e.target.closest('.nc-item-delete')) return;
        var id = item.dataset.id;
        markRead(id);
        item.classList.remove('unread');
      });
    });

    listEl.querySelectorAll('.nc-item-delete').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var id = btn.dataset.delete;
        deleteNotification(id);
      });
    });
  }

  function updateBadge(count) {
    unreadCount = count;
    var badge = $('#notification-badge');
    if (!badge) return;
    badge.textContent = count > 99 ? '99+' : (count || '');
    badge.dataset.count = String(count);

    if (count > 0) {
      badge.classList.add('bounce');
      var bell = $('#notification-bell');
      if (bell) bell.classList.add('has-unread');
      setTimeout(function () { badge.classList.remove('bounce'); }, 500);
    } else {
      var bell2 = $('#notification-bell');
      if (bell2) bell2.classList.remove('has-unread');
    }
  }

  /* ======================================================================
     API Actions
     ====================================================================== */
  function markRead(id) {
    apiFetch(API_BASE + '/notifications/' + id + '/read', { method: 'POST' })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data.success) {
          notifications.forEach(function (n) { if (n.id === id) n.read = true; });
          unreadCount = Math.max(0, unreadCount - 1);
          updateBadge(unreadCount);
        }
      })
      .catch(function () { /* silent */ });

    // AR: إرسال عبر Socket أيضاً للتحديث الفوري.
    if (socket && socket.connected) {
      socket.emit('notification:mark-read', { id: id });
    }
  }

  function markAllRead() {
    apiFetch(API_BASE + '/notifications/mark-all-read', { method: 'POST' })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data.success) {
          notifications.forEach(function (n) { n.read = true; });
          unreadCount = 0;
          updateBadge(0);
          renderNCList();
        }
      })
      .catch(function () { /* silent */ });
  }

  function deleteNotification(id) {
    apiFetch(API_BASE + '/notifications/' + id, { method: 'DELETE' })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data.success) {
          var wasUnread = notifications.find(function (n) { return n.id === id && !n.read; });
          notifications = notifications.filter(function (n) { return n.id !== id; });
          if (wasUnread) unreadCount = Math.max(0, unreadCount - 1);
          updateBadge(unreadCount);
          renderNCList();
        }
      })
      .catch(function () { /* silent */ });
  }

  function acknowledgeAlert(id) {
    apiFetch(API_BASE + '/notifications/' + id + '/acknowledge', { method: 'POST' })
      .catch(function () { /* silent */ });

    if (socket && socket.connected) {
      socket.emit('notification:acknowledge', { id: id });
    }
  }

  /* ======================================================================
     Critical Alert Modal
     ====================================================================== */
  function showCriticalModal(notification) {
    // AR: إزالة أي نافذة حرجة موجودة.
    var existing = $('.critical-modal-overlay');
    if (existing) existing.remove();

    var overlay = document.createElement('div');
    overlay.className = 'critical-modal-overlay';
    overlay.innerHTML =
      '<div class="critical-modal">' +
        '<div class="critical-modal-header">' +
          '<div class="danger-icon">' + ICONS.critical + '</div>' +
          '<h2>' + (notification.title || 'تنبيه حرج') + '</h2>' +
        '</div>' +
        '<div class="critical-modal-body">' +
          '<div class="critical-modal-message">' + (notification.message || '') + '</div>' +
          (notification.details || (notification.metadata && notification.metadata.error) ?
            '<div class="critical-modal-details">' + (notification.details || notification.metadata.error || '') + '</div>' : '') +
        '</div>' +
        '<div class="critical-modal-footer">' +
          '<button class="critical-ack-btn" id="critical-ack-btn">✓ تم الاطلاع والتأكيد</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(overlay);

    // AR: تشغيل صوت تنبيه.
    playCriticalSound();

    // AR: ربط زر التأكيد.
    overlay.querySelector('#critical-ack-btn').addEventListener('click', function () {
      if (notification.id) acknowledgeAlert(notification.id);
      overlay.style.opacity = '0';
      setTimeout(function () { overlay.remove(); }, 300);
    });

    // AR: منع الإغلاق بالنقر خارج النافذة.
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) {
        overlay.querySelector('.critical-modal').style.animation = 'criticalShake 0.5s ease-in-out';
        playCriticalSound();
      }
    });
  }

  /* ======================================================================
     Data Quality Alert Banner
     ====================================================================== */
  function showDataQualityBanner(payload) {
    var existing = $('#data-quality-banner');
    if (existing) existing.remove();

    var banner = document.createElement('div');
    banner.id = 'data-quality-banner';
    banner.className = 'data-quality-banner';
    banner.innerHTML =
      '<div class="dqb-content">' +
        '<strong>⚠️ صقر AI: اكتُشفت تغييرات في بنية ملف Excel</strong>' +
        '<span>' + escapeHtml((payload.errors || []).length + ' خطأ، ' + (payload.warnings || []).length + ' تحذير') + '</span>' +
      '</div>' +
      '<div class="dqb-actions">' +
        '<button class="dqb-details" type="button">عرض التفاصيل</button>' +
        '<button class="dqb-close" type="button" aria-label="إغلاق">' + ICONS.close + '</button>' +
      '</div>';

    document.body.appendChild(banner);

    banner.querySelector('.dqb-details').addEventListener('click', function () {
      showDataQualityModal(payload);
    });
    banner.querySelector('.dqb-close').addEventListener('click', function () {
      banner.remove();
    });
  }

  function showDataQualityModal(payload) {
    var existing = $('.data-quality-modal-overlay');
    if (existing) existing.remove();

    function renderList(title, items, emptyText) {
      var safeItems = items || [];
      return '<section class="dqm-section">' +
        '<h4>' + escapeHtml(title) + '</h4>' +
        (safeItems.length
          ? '<ul>' + safeItems.map(function (item) {
              var text = typeof item === 'string' ? item : ((item.sheet ? item.sheet + ': ' : '') + (item.column || JSON.stringify(item)));
              return '<li>' + escapeHtml(text) + '</li>';
            }).join('') + '</ul>'
          : '<p>' + escapeHtml(emptyText) + '</p>') +
      '</section>';
    }

    var overlay = document.createElement('div');
    overlay.className = 'data-quality-modal-overlay';
    overlay.innerHTML =
      '<div class="data-quality-modal" role="dialog" aria-modal="true" aria-label="تفاصيل جودة ملف Excel">' +
        '<div class="dqm-header">' +
          '<div>' +
            '<h3>صقر AI Data Quality Report</h3>' +
            '<p>' + escapeHtml(payload.message || 'تم رصد تغييرات في جودة ملف Excel الأسبوعي.') + '</p>' +
          '</div>' +
          '<button class="dqm-close" type="button" aria-label="إغلاق">' + ICONS.close + '</button>' +
        '</div>' +
        '<div class="dqm-body">' +
          renderList('الأخطاء', payload.errors, 'لا توجد أخطاء حرجة.') +
          renderList('التحذيرات', payload.warnings, 'لا توجد تحذيرات.') +
          renderList('الأعمدة المفقودة', payload.missingColumns, 'لا توجد أعمدة مفقودة.') +
        '</div>' +
      '</div>';

    document.body.appendChild(overlay);
    overlay.querySelector('.dqm-close').addEventListener('click', function () { overlay.remove(); });
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) overlay.remove();
    });
  }

  /* ======================================================================
     Critical Sound — صوت التنبيه الحرج
     ====================================================================== */
  function playCriticalSound() {
    try {
      var AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      var ctx = new AudioContext();

      // AR: نغمة تنبيه مزدوجة.
      function beep(freq, startTime, duration) {
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.15, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        osc.start(startTime);
        osc.stop(startTime + duration);
      }

      var now = ctx.currentTime;
      beep(880, now, 0.15);
      beep(1100, now + 0.18, 0.15);
      beep(880, now + 0.4, 0.15);
      beep(1100, now + 0.58, 0.2);
    } catch (e) {
      // AR: تجاهل الخطأ — المتصفح لا يدعم Web Audio أو الصوت محظور.
    }
  }

  /* ======================================================================
     Preferences Panel
     ====================================================================== */
  function openPreferencesPanel() {
    if ($('.preferences-panel')) {
      var panel = $('.preferences-panel');
      panel.classList.add('open');
      isPrefsOpen = true;
      return;
    }

    var panel = document.createElement('div');
    panel.className = 'preferences-panel open';
    panel.innerHTML =
      '<div class="preferences-overlay"></div>' +
      '<div class="preferences-drawer">' +
        '<div class="prefs-header">' +
          '<h3>⚙️ إعدادات الإشعارات</h3>' +
          '<button class="prefs-close">' + ICONS.close + '</button>' +
        '</div>' +
        '<div class="prefs-body">' +
          '<div class="prefs-section">' +
            '<h4>القنوات</h4>' +
            buildToggleRow('الإشعارات الداخلية', 'pref-in-app', preferences.channels.in_app) +
            buildToggleRow('البريد الإلكتروني', 'pref-email', preferences.channels.email) +
            buildToggleRow('إشعارات المتصفح', 'pref-push', preferences.channels.browser_push) +
          '</div>' +
          '<div class="prefs-section">' +
            '<h4>ساعات الهدوء</h4>' +
            buildToggleRow('تفعيل ساعات الهدوء', 'pref-quiet', preferences.quiet_hours.enabled) +
            '<div class="prefs-time-row">' +
              '<label>من</label>' +
              '<input type="number" id="pref-quiet-from" value="' + (preferences.quiet_hours.from || 22) + '" min="0" max="23">' +
              '<label>إلى</label>' +
              '<input type="number" id="pref-quiet-to" value="' + (preferences.quiet_hours.to || 7) + '" min="0" max="23">' +
            '</div>' +
            '<p style="font-size:11px;color:#94a3b8;margin:4px 0 0;">التنبيهات الحرجة لا تتأثر بساعات الهدوء.</p>' +
          '</div>' +
          '<div class="prefs-section">' +
            '<h4>أنواع الإشعارات</h4>' +
            buildToggleRow('تحديث بيانات Excel', 'pref-type-data', true) +
            buildToggleRow('مرفوض جديد', 'pref-type-reject', true) +
            buildToggleRow('موافقة معلقة', 'pref-type-approval', true) +
            buildToggleRow('تنبيه حرج', 'pref-type-critical', true) +
            buildToggleRow('CAPA متأخر', 'pref-type-capa', true) +
            buildToggleRow('شذوذ مكتشف', 'pref-type-anomaly', true) +
            buildToggleRow('تحليل AI جاهز', 'pref-type-ai', true) +
          '</div>' +
        '</div>' +
      '</div>';

    document.body.appendChild(panel);
    isPrefsOpen = true;

    // AR: ربط الإغلاق.
    panel.querySelector('.prefs-close').addEventListener('click', closePreferencesPanel);
    panel.querySelector('.preferences-overlay').addEventListener('click', closePreferencesPanel);

    // AR: ربط التبديلات لحفظ التفضيلات.
    panel.querySelectorAll('.toggle-switch input').forEach(function (toggle) {
      toggle.addEventListener('change', savePreferences);
    });
    panel.querySelectorAll('input[type="number"]').forEach(function (input) {
      input.addEventListener('change', savePreferences);
    });

    // AR: تحميل التفضيلات من الخادم.
    loadPreferences();
  }

  function closePreferencesPanel() {
    var panel = $('.preferences-panel');
    if (panel) {
      panel.classList.remove('open');
      isPrefsOpen = false;
    }
  }

  function buildToggleRow(label, id, checked) {
    return '<div class="prefs-row">' +
      '<span class="prefs-label">' + label + '</span>' +
      '<label class="toggle-switch">' +
        '<input type="checkbox" id="' + id + '"' + (checked ? ' checked' : '') + '>' +
        '<span class="toggle-slider"></span>' +
      '</label>' +
    '</div>';
  }

  function loadPreferences() {
    apiFetch(API_BASE + '/notifications/preferences')
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data.success && data.data) {
          preferences = data.data;
          applyPrefsToUI();
        }
      })
      .catch(function () { /* silent — use defaults */ });
  }

  function applyPrefsToUI() {
    var map = {
      'pref-in-app': preferences.channels.in_app,
      'pref-email': preferences.channels.email,
      'pref-push': preferences.channels.browser_push,
      'pref-quiet': preferences.quiet_hours.enabled
    };
    Object.keys(map).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.checked = !!map[id];
    });
    var qFrom = document.getElementById('pref-quiet-from');
    var qTo = document.getElementById('pref-quiet-to');
    if (qFrom) qFrom.value = preferences.quiet_hours.from || 22;
    if (qTo) qTo.value = preferences.quiet_hours.to || 7;
  }

  function savePreferences() {
    var updates = {
      channels: {
        in_app: !!safeChecked('pref-in-app'),
        email: !!safeChecked('pref-email'),
        browser_push: !!safeChecked('pref-push')
      },
      quiet_hours: {
        enabled: !!safeChecked('pref-quiet'),
        from: Number(safeValue('pref-quiet-from')) || 22,
        to: Number(safeValue('pref-quiet-to')) || 7
      }
    };

    apiFetch(API_BASE + '/notifications/preferences', {
      method: 'PUT',
      body: JSON.stringify(updates)
    })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data.success && data.data) preferences = data.data;
        showToast({ type: 'success', title: 'تم الحفظ', message: 'تم تحديث تفضيلات الإشعارات بنجاح.', duration: 2000 });
      })
      .catch(function () {
        showToast({ type: 'error', title: 'خطأ', message: 'فشل حفظ التفضيلات.', duration: 3000 });
      });
  }

  function safeChecked(id) {
    var el = document.getElementById(id);
    return el ? el.checked : false;
  }

  function safeValue(id) {
    var el = document.getElementById(id);
    return el ? el.value : '';
  }

  /* ======================================================================
     Socket.io Integration
     ====================================================================== */
  function connectSocket() {
    if (typeof window.io !== 'function') return;
    if (socket && socket.connected) return;

    socket = window.io({ withCredentials: true, reconnection: true, reconnectionDelay: 2000, reconnectionAttempts: 10 });

    socket.on('connect', function () {
      showToast({ type: 'info', title: 'متصل', message: 'تم الاتصال بخادم التحديثات الفورية.', duration: 2500 });
    });

    socket.on('disconnect', function (reason) {
      if (reason !== 'io client disconnect') {
        showToast({ type: 'warning', title: 'انقطع الاتصال', message: 'جاري محاولة إعادة الاتصال...', duration: 3000 });
      }
    });

    socket.on('reconnect', function () {
      showToast({ type: 'success', title: 'تم إعادة الاتصال', message: 'تم استعادة الاتصال بنجاح.', duration: 2000 });
    });

    // AR: إشعار جديد من الخادم.
    socket.on('notification:new', function (notification) {
      // AR: إضافة للقائمة المحلية.
      notifications.unshift(notification);
      unreadCount++;
      updateBadge(unreadCount);
      if (isNCOpen) renderNCList();

      // AR: عرض Toast.
      showToast({
        type: notification.type,
        title: notification.title,
        message: notification.message,
        id: notification.id,
        duration: notification.type === 'critical' ? CRITICAL_TOAST_DURATION : DEFAULT_TOAST_DURATION
      });

      // AR: عرض نافذة حرجة إذا كان التنبيه حرجاً.
      if (notification.type === 'critical') {
        showCriticalModal(notification);
      }
    });

    // AR: تحديث إشعار (تجميع).
    socket.on('notification:updated', function (notification) {
      var idx = notifications.findIndex(function (n) { return n.id === notification.id; });
      if (idx !== -1) notifications[idx] = notification;
      if (isNCOpen) renderNCList();
    });

    // AR: تحديث عدد غير المقروءة.
    socket.on('notification:count', function (data) {
      updateBadge(data.count || 0);
    });

    // AR: تنبيه حرج مباشر.
    socket.on('alert:critical', function (notification) {
      showCriticalModal(notification);
    });

    // AR: تيار الأنشطة الأولي.
    socket.on('activity:init', function (data) {
      activityFeed = data.activities || [];
      renderActivityFeed();
    });

    // AR: نشاط جديد.
    socket.on('activity:new', function (activity) {
      activityFeed.unshift(activity);
      if (activityFeed.length > 30) activityFeed.splice(30);
      renderActivityFeed();
    });

    // AR: تحديث التواجد.
    socket.on('presence:update', function (data) {
      renderPresence(data);
    });

    // AR: تحديث بيانات Excel (متوافق مع app.js القائم).
    socket.on('data:updated', function (payload) {
      var count = payload && payload.record_count ? payload.record_count : 'new';
      showToast({
        type: 'success',
        title: 'تم تحديث البيانات',
        message: 'تم تحميل ' + count + ' سجل من ملف Excel. جاري تحديث اللوحة...',
        duration: 4000
      });
    });

    socket.on('data:quality-alert', function (payload) {
      payload = payload || {};
      var notification = {
        id: 'dq_' + Date.now(),
        event: 'data:quality-alert',
        type: (payload.errors && payload.errors.length) ? 'error' : 'warning',
        title: payload.title || 'صقر AI: اكتُشفت تغييرات في بنية ملف Excel',
        message: payload.message || 'تم رصد أخطاء أو تحذيرات في جودة ملف Excel الأسبوعي.',
        metadata: payload,
        read: false,
        created_at: Date.now()
      };

      notifications.unshift(notification);
      unreadCount++;
      updateBadge(unreadCount);
      if (isNCOpen) renderNCList();

      showToast({
        type: notification.type,
        title: notification.title,
        message: (payload.errors || []).length + ' خطأ، ' + (payload.warnings || []).length + ' تحذير',
        duration: 7000
      });
      showDataQualityBanner(payload);
    });

    socket.on('data:update_failed', function (payload) {
      showToast({
        type: 'error',
        title: 'فشل التحديث',
        message: (payload && payload.message) || 'فشل تحميل ملف Excel.',
        duration: 6000
      });
    });
  }

  /* ======================================================================
     Activity Feed Rendering
     ====================================================================== */
  function renderActivityFeed() {
    var container = $('#activity-feed-list') || $('#live-activity-feed');
    if (!container) return;

    if (!activityFeed.length) {
      container.innerHTML = '<p style="color:#94a3b8;font-size:12px;text-align:center;padding:24px;">لا توجد أنشطة حديثة.</p>';
      return;
    }

    container.innerHTML = activityFeed.slice(0, 20).map(function (a) {
      return '<div class="activity-feed-item">' +
        '<div class="activity-icon ' + (a.type || 'info') + '">' + (ICONS[a.type] || ICONS.info) + '</div>' +
        '<div class="activity-text">' + (a.title || a.event || '') +
          (a.message ? '<br><span style="color:#94a3b8;font-size:11px;">' + a.message + '</span>' : '') +
        '</div>' +
        '<div class="activity-time">' + relativeTime(a.created_at) + '</div>' +
      '</div>';
    }).join('');
  }

  /* ======================================================================
     Presence Rendering
     ====================================================================== */
  function renderPresence(data) {
    var container = $('#presence-indicator');
    if (!container) return;

    container.innerHTML =
      '<span class="presence-dot"></span>' +
      '<span>' + (data.active_users || 0) + ' مستخدم نشط</span>';
  }

  /* ======================================================================
     Initial Setup — التهيئة
     ====================================================================== */
  function init() {
    injectUI();

    // AR: تحميل Socket.io client إذا لم يكن محملاً.
    if (typeof window.io === 'function') {
      connectSocket();
    } else {
      var script = document.createElement('script');
      script.src = '/demo/node_modules/socket.io/client-dist/socket.io.js';
      script.async = true;
      script.onload = connectSocket;
      document.head.appendChild(script);
    }

    // AR: تحميل العدد الأولي من الخادم.
    apiFetch(API_BASE + '/notifications/count')
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data.success && data.data) updateBadge(data.data.count || 0);
      })
      .catch(function () { /* silent */ });
  }

  /* ======================================================================
     Public API — exposed globally
     ====================================================================== */
  window.BrightNotifications = {
    toast: showToast,
    critical: showCriticalModal,
    openCenter: openNotificationCenter,
    closeCenter: closeNotificationCenter,
    openPreferences: openPreferencesPanel
  };

  // AR: التشغيل عند جاهزية DOM.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
