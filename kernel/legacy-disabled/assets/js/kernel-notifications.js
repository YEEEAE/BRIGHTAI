/**
 * BrightAI Kernel - Notification Center
 * Polls approvals, traces, health, and compliance signals for shared top-nav alerts.
 */

(function (global) {
  'use strict';

  const DAY_MS = 24 * 60 * 60 * 1000;
  const DEFAULT_CONFIG = {
    storageKey: 'brightai_kernel_notifications_v1',
    soundKey: 'brightai_kernel_notifications_sound',
    ttlMs: 7 * DAY_MS,
    pollInterval: 15000,
    maxStored: 50,
    maxVisible: 10,
    complianceFloor: 95,
    piiWarningFloor: 30,
  };

  const TYPE_META = {
    approval_needed: {
      label: 'Approval needed',
      title: 'موافقة مطلوبة',
      severity: 'warning',
      href: '/kernel/approvals/',
    },
    request_blocked: {
      label: 'Request blocked',
      title: 'طلب محظور',
      severity: 'danger',
      href: '/kernel/audit/',
    },
    system_health: {
      label: 'System health',
      title: 'حالة النظام',
      severity: 'info',
      href: '/kernel/stats/',
    },
    compliance_gap: {
      label: 'Compliance gap',
      title: 'فجوة امتثال',
      severity: 'warning',
      href: '/kernel/compliance/',
    },
  };

  const KernelNotifications = {
    config: { ...DEFAULT_CONFIG },
    state: {
      initialized: false,
      isOpen: false,
      hasCompletedInitialPoll: false,
      pollTimer: null,
      notifications: [],
      soundEnabled: false,
      audioContext: null,
      lastHealthSignature: '',
    },

    init(options = {}) {
      this.config = { ...this.config, ...options };
      this.cacheElements();
      if (!this.elements.center || !this.elements.button || !this.elements.dropdown) return;

      this.state.soundEnabled = this.readSoundPreference();
      this.state.notifications = this.pruneExpired(this.readStoredNotifications());

      if (!this.state.initialized) {
        this.bindEvents();
        this.state.initialized = true;
      }

      this.render();
      this.poll();
      this.startPolling();
    },

    cacheElements() {
      this.elements = {
        center: document.getElementById('kernel-notification-center'),
        button: document.getElementById('kernel-notification-button'),
        badge: document.getElementById('kernel-notification-badge'),
        dropdown: document.getElementById('kernel-notification-dropdown'),
        list: document.getElementById('kernel-notification-list'),
        summary: document.getElementById('kernel-notification-summary'),
        markAll: document.getElementById('kernel-notification-mark-all'),
        sound: document.getElementById('kernel-notification-sound'),
      };
    },

    bindEvents() {
      this.elements.button.addEventListener('click', (event) => {
        event.stopPropagation();
        this.toggle();
      });

      this.elements.dropdown.addEventListener('click', (event) => {
        const readButton = event.target.closest('[data-notification-read]');
        if (readButton) {
          event.preventDefault();
          this.markAsRead(readButton.getAttribute('data-notification-read'));
          return;
        }
        event.stopPropagation();
      });

      if (this.elements.markAll) {
        this.elements.markAll.addEventListener('click', (event) => {
          event.preventDefault();
          this.markAllAsRead();
        });
      }

      if (this.elements.sound) {
        this.elements.sound.addEventListener('click', (event) => {
          event.preventDefault();
          this.toggleSound();
        });
      }

      document.addEventListener('click', (event) => {
        if (this.state.isOpen && !this.elements.center.contains(event.target)) this.close();
      });

      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') this.close();
      });
    },

    startPolling() {
      if (this.state.pollTimer) return;
      this.state.pollTimer = global.setInterval(() => this.poll(), this.config.pollInterval);
    },

    async poll() {
      const results = await Promise.allSettled([
        this.fetchApprovals(),
        this.fetchStats(),
        this.fetchAudit(),
        this.fetchHealth(),
      ]);

      const [approvalData, statsData, auditData, healthData] = results.map((result) => (
        result.status === 'fulfilled' ? result.value : null
      ));

      const events = [
        ...this.eventsFromApprovals(approvalData),
        ...this.eventsFromTraces(auditData, statsData),
        ...this.eventsFromHealth(healthData, results[3]),
        ...this.eventsFromCompliance(statsData),
      ];

      const newNotifications = this.addEvents(events);
      const shouldNotify = this.state.hasCompletedInitialPoll && newNotifications.length > 0;

      this.render();
      this.persist();

      if (shouldNotify) {
        newNotifications.slice(0, 3).forEach((notification) => this.showToast(notification));
        this.playSound();
      }

      this.state.hasCompletedInitialPoll = true;
    },

    async fetchApprovals() {
      if (global.kernelAPI && typeof global.kernelAPI.getPendingApprovals === 'function') {
        return global.kernelAPI.getPendingApprovals();
      }
      return this.fetchJson('/api/kernel/approvals');
    },

    async fetchStats() {
      if (global.kernelAPI && typeof global.kernelAPI.getStats === 'function') {
        return global.kernelAPI.getStats();
      }
      return this.fetchJson('/api/kernel/stats');
    },

    async fetchAudit() {
      if (global.kernelAPI && typeof global.kernelAPI.getAuditLog === 'function') {
        return global.kernelAPI.getAuditLog({ limit: 10 });
      }
      return this.fetchJson('/api/kernel/audit?limit=10');
    },

    async fetchHealth() {
      if (global.kernelAPI && typeof global.kernelAPI.health === 'function' && typeof global.kernelAPI.getProviderStatus === 'function') {
        const [health, provider] = await Promise.all([
          global.kernelAPI.health(),
          global.kernelAPI.getProviderStatus(),
        ]);
        return { health, provider };
      }
      const [health, provider] = await Promise.all([
        this.fetchJson('/api/kernel/health'),
        this.fetchJson('/api/kernel/providers'),
      ]);
      return { health, provider };
    },

    async fetchJson(path) {
      const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const timeoutId = controller ? setTimeout(() => controller.abort(), 7000) : null;
      try {
        const response = await fetch(path, {
          headers: { Accept: 'application/json' },
          signal: controller ? controller.signal : undefined,
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      } finally {
        if (timeoutId) clearTimeout(timeoutId);
      }
    },

    eventsFromApprovals(data) {
      if (!data) return [];
      const pending = Array.isArray(data.pending) ? data.pending : [];
      const total = Number(data.summary?.totalPending ?? data.totalPending ?? data.pendingApproval ?? pending.length) || 0;

      if (pending.length) {
        return pending.slice(0, 5).map((request) => {
          const requestId = this.getRecordId(request, 'approval');
          const risk = request.riskLevel || request.risk_level || request.risk || 'medium';
          return this.createEvent({
            type: 'approval_needed',
            sourceKey: `approval:${requestId}`,
            title: 'موافقة مطلوبة',
            message: `طلب ${requestId} يحتاج مراجعة بشرية قبل التنفيذ. مستوى المخاطر: ${this.riskLabel(risk)}.`,
            href: `/kernel/approvals/?request_id=${encodeURIComponent(requestId)}`,
          });
        });
      }

      if (total > 0) {
        return [this.createEvent({
          type: 'approval_needed',
          sourceKey: `approval:summary:${total}`,
          title: 'موافقات معلقة',
          message: `يوجد ${this.formatNumber(total)} طلب بانتظار المراجعة البشرية.`,
          href: '/kernel/approvals/',
        })];
      }

      return [];
    },

    eventsFromTraces(auditData, statsData) {
      const rows = [
        ...this.extractRows(auditData),
        ...this.extractRows(statsData?.latestTraces || []),
      ];
      const unique = this.uniqueRows(rows);

      return unique.slice(0, 10).map((row) => {
        const traceId = this.getRecordId(row, 'trace');
        const isBlocked = this.isBlocked(row);
        const risk = row.riskLevel || row.risk_level || row.risk || row.risk_level_text || '';
        const user = row.userName || row.user_name || row.actor || row.department || 'Kernel';
        const type = isBlocked ? 'request_blocked' : 'system_health';
        const href = isBlocked ? `/kernel/audit/?trace_id=${encodeURIComponent(traceId)}` : `/kernel/evidence/?trace_id=${encodeURIComponent(traceId)}`;

        return this.createEvent({
          type,
          sourceKey: `${type}:${traceId}`,
          title: isBlocked ? 'طلب محظور' : 'Trace جديد',
          message: isBlocked
            ? `تم حظر ${traceId} بسبب سياسة الحوكمة. ${risk ? `المخاطر: ${this.riskLabel(risk)}.` : ''}`
            : `وصل trace جديد من ${user}: ${traceId}.`,
          href,
        });
      });
    },

    eventsFromHealth(healthData, healthResult) {
      if (healthResult && healthResult.status === 'rejected') {
        return [this.createEvent({
          type: 'system_health',
          sourceKey: 'health:api-unavailable',
          title: 'حالة النظام',
          message: 'تعذر الوصول إلى واجهات Kernel حالياً. سيتم تحديث الحالة تلقائياً.',
          href: '/kernel/stats/',
        })];
      }

      if (!healthData) return [];
      const health = healthData.health || {};
      const provider = healthData.provider || {};
      const dbOk = Boolean(
        health.kernel?.database === true
        || health.database === true
        || health.database?.connected === true
        || health.db?.connected === true
      );
      const providerMode = provider.mode || provider.activeProvider?.mode || provider.provider?.mode || '';
      const providerName = provider.provider?.name || provider.activeProvider?.name || provider.provider || 'Kernel';
      const healthStatus = health.status || (dbOk ? 'ok' : 'degraded');
      const degraded = healthStatus !== 'ok' || !dbOk || ['demo', 'fallback'].includes(String(providerMode).toLowerCase());
      const signature = `${healthStatus}:${dbOk}:${providerMode}:${providerName}`;

      if (this.state.lastHealthSignature === signature && !degraded) return [];
      this.state.lastHealthSignature = signature;

      if (!degraded && this.state.hasCompletedInitialPoll) {
        return [this.createEvent({
          type: 'system_health',
          sourceKey: `health:recovered:${Date.now()}`,
          title: 'حالة النظام',
          message: 'Kernel رجع لحالة تشغيل مستقرة.',
          href: '/kernel/stats/',
        })];
      }

      if (!degraded) return [];

      return [this.createEvent({
        type: 'system_health',
        sourceKey: `health:${signature}`,
        title: 'حالة النظام',
        message: `حالة Kernel تحتاج انتباه: ${dbOk ? 'قاعدة البيانات متصلة' : 'قاعدة البيانات غير مؤكدة'}، المزود ${providerName}.`,
        href: '/kernel/stats/',
      })];
    },

    eventsFromCompliance(stats) {
      if (!stats) return [];
      const events = [];
      const complianceRate = Number(stats.complianceRate ?? stats.compliance_rate);
      const piiRate = Number(stats.piiDetectionRate ?? stats.pii_detection_rate);
      const chainIntegrity = stats.chainIntegrity ?? stats.chain_integrity;

      if (Number.isFinite(complianceRate) && complianceRate > 0 && complianceRate < this.config.complianceFloor) {
        events.push(this.createEvent({
          type: 'compliance_gap',
          sourceKey: `compliance:rate:${Math.round(complianceRate)}`,
          title: 'فجوة امتثال',
          message: `معدل الامتثال الحالي ${Math.round(complianceRate)}%، أقل من حد ${this.config.complianceFloor}%.`,
          href: '/kernel/compliance/',
        }));
      }

      if (Number.isFinite(piiRate) && piiRate > this.config.piiWarningFloor) {
        events.push(this.createEvent({
          type: 'compliance_gap',
          sourceKey: `compliance:pii:${Math.round(piiRate)}`,
          title: 'ارتفاع كشف PII',
          message: `نسبة كشف البيانات الحساسة وصلت ${Math.round(piiRate)}%. راجع السياسات والتدقيق.`,
          href: '/kernel/compliance/',
        }));
      }

      if (chainIntegrity === false || String(chainIntegrity).toLowerCase() === 'invalid') {
        events.push(this.createEvent({
          type: 'compliance_gap',
          sourceKey: 'compliance:chain-integrity',
          title: 'فجوة امتثال',
          message: 'سلامة سلسلة الأدلة غير مؤكدة. يلزم التحقق من سجل التدقيق.',
          href: '/kernel/audit/',
        }));
      }

      return events;
    },

    createEvent(event) {
      const meta = TYPE_META[event.type] || TYPE_META.system_health;
      return {
        id: event.sourceKey,
        sourceKey: event.sourceKey,
        type: event.type,
        typeLabel: meta.label,
        severity: event.severity || meta.severity,
        title: event.title || meta.title,
        message: event.message || '',
        href: event.href || meta.href,
        createdAt: event.createdAt || new Date().toISOString(),
        read: false,
      };
    },

    addEvents(events) {
      const existingKeys = new Set(this.state.notifications.map((notification) => notification.sourceKey || notification.id));
      const fresh = [];

      events.forEach((event) => {
        if (!event || !event.sourceKey || existingKeys.has(event.sourceKey)) return;
        existingKeys.add(event.sourceKey);
        fresh.push(event);
      });

      if (!fresh.length) return [];

      this.state.notifications = this.pruneExpired([
        ...fresh,
        ...this.state.notifications,
      ]).slice(0, this.config.maxStored);

      return fresh;
    },

    render() {
      this.cacheElements();
      const unread = this.unreadCount();
      const latest = this.state.notifications.slice(0, this.config.maxVisible);

      if (this.elements.badge) {
        this.elements.badge.hidden = unread === 0;
        this.elements.badge.textContent = unread > 99 ? '99+' : String(unread);
      }

      if (this.elements.summary) {
        this.elements.summary.textContent = unread
          ? `${this.formatNumber(unread)} غير مقروء`
          : 'كل الإشعارات مقروءة';
      }

      if (this.elements.sound) {
        this.elements.sound.classList.toggle('active', this.state.soundEnabled);
        this.elements.sound.setAttribute('aria-pressed', String(this.state.soundEnabled));
        this.elements.sound.setAttribute('aria-label', this.state.soundEnabled ? 'إيقاف صوت الإشعارات' : 'تفعيل صوت الإشعارات');
      }

      if (!this.elements.list) return;
      this.elements.list.innerHTML = global.KernelUtils?.sanitizeHtml((latest.length
        ? latest.map((notification) => this.renderNotification(notification)).join('')
        : '<div class="kernel-notification-empty">لا توجد إشعارات حالياً</div>')) || '';
    },

    renderNotification(notification) {
      const type = this.escape(notification.typeLabel);
      const title = this.escape(notification.title);
      const message = this.escape(notification.message);
      const href = this.escape(notification.href || '#');
      const time = this.escape(this.relativeTime(notification.createdAt));
      const readButton = notification.read
        ? ''
        : `<button type="button" class="kernel-notification-read-button" data-notification-read="${this.escape(notification.id)}">قراءة</button>`;

      return `
        <article class="kernel-notification-item ${this.escape(notification.severity)} ${notification.read ? '' : 'unread'}">
          <span class="kernel-notification-status" aria-hidden="true"></span>
          <div class="kernel-notification-copy">
            <div>
              <span class="kernel-notification-meta">${type} · ${time}</span>
              <strong class="kernel-notification-title">${title}</strong>
            </div>
            <div class="kernel-notification-message">${message}</div>
            <div class="kernel-notification-footer">
              <a class="kernel-notification-link" href="${href}">فتح التفاصيل</a>
              ${readButton}
            </div>
          </div>
        </article>
      `;
    },

    toggle() {
      this.state.isOpen ? this.close() : this.open();
    },

    open() {
      this.state.isOpen = true;
      this.elements.center.classList.add('open');
      this.elements.button.setAttribute('aria-expanded', 'true');
      this.elements.dropdown.setAttribute('aria-hidden', 'false');
    },

    close() {
      if (!this.elements?.center) return;
      this.state.isOpen = false;
      this.elements.center.classList.remove('open');
      this.elements.button?.setAttribute('aria-expanded', 'false');
      this.elements.dropdown?.setAttribute('aria-hidden', 'true');
    },

    markAsRead(id) {
      this.state.notifications = this.state.notifications.map((notification) => (
        notification.id === id ? { ...notification, read: true } : notification
      ));
      this.render();
      this.persist();
    },

    markAllAsRead() {
      this.state.notifications = this.state.notifications.map((notification) => ({ ...notification, read: true }));
      this.render();
      this.persist();
    },

    toggleSound() {
      this.state.soundEnabled = !this.state.soundEnabled;
      try {
        localStorage.setItem(this.config.soundKey, this.state.soundEnabled ? 'true' : 'false');
      } catch (_error) {
        // Sound preference is optional.
      }
      if (this.state.soundEnabled) this.playSound(true);
      this.render();
    },

    playSound(force = false) {
      if (!this.state.soundEnabled && !force) return;
      if (global.KernelUtils?.prefersReducedMotion?.()) return;
      const AudioContextCtor = global.AudioContext || global.webkitAudioContext;
      if (!AudioContextCtor) return;

      try {
        const audioContext = this.state.audioContext || new AudioContextCtor();
        this.state.audioContext = audioContext;
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.value = 740;
        gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.05, audioContext.currentTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.16);
        oscillator.connect(gain);
        gain.connect(audioContext.destination);
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.18);
      } catch (_error) {
        // Browsers may block audio until a gesture; the toggle gives that gesture.
      }
    },

    showToast(notification) {
      const message = `${notification.title}: ${notification.message}`;
      const toastType = notification.severity === 'danger' ? 'error' : notification.severity;
      if (global.KernelUtils && typeof global.KernelUtils.showToast === 'function') {
        global.KernelUtils.showToast(message, toastType);
        return;
      }

      let container = document.getElementById('toast-container');
      if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        container.setAttribute('aria-live', 'polite');
        document.body.appendChild(container);
      }

      const toast = document.createElement('div');
      toast.className = `toast ${toastType}`;
      toast.textContent = message;
      container.appendChild(toast);
      setTimeout(() => toast.remove(), 4200);
    },

    readStoredNotifications() {
      try {
        const parsed = JSON.parse(localStorage.getItem(this.config.storageKey) || '[]');
        return Array.isArray(parsed) ? parsed : [];
      } catch (_error) {
        return [];
      }
    },

    persist() {
      try {
        localStorage.setItem(this.config.storageKey, JSON.stringify(this.state.notifications));
      } catch (_error) {
        // The UI keeps working even when storage is unavailable.
      }
    },

    readSoundPreference() {
      try {
        return localStorage.getItem(this.config.soundKey) === 'true';
      } catch (_error) {
        return false;
      }
    },

    pruneExpired(notifications) {
      const cutoff = Date.now() - this.config.ttlMs;
      return notifications
        .filter((notification) => new Date(notification.createdAt).getTime() >= cutoff)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    },

    unreadCount() {
      return this.state.notifications.filter((notification) => !notification.read).length;
    },

    extractRows(data) {
      if (!data) return [];
      if (Array.isArray(data)) return data;
      return [
        ...(Array.isArray(data.rows) ? data.rows : []),
        ...(Array.isArray(data.entries) ? data.entries : []),
        ...(Array.isArray(data.audit) ? data.audit : []),
        ...(Array.isArray(data.latestTraces) ? data.latestTraces : []),
      ];
    },

    uniqueRows(rows) {
      const seen = new Set();
      return rows.filter((row) => {
        const id = this.getRecordId(row, '');
        if (!id || seen.has(id)) return false;
        seen.add(id);
        return true;
      });
    },

    getRecordId(record, fallbackPrefix) {
      if (!record || typeof record !== 'object') return `${fallbackPrefix}-${Date.now()}`;
      const value = record.traceId
        || record.trace_id
        || record.interactionId
        || record.interaction_id
        || record.requestId
        || record.request_id
        || record.id
        || record.hash
        || record.recordHash;
      return String(value || `${fallbackPrefix}-${Date.now()}`).trim();
    },

    isBlocked(record) {
      const values = [
        record.status,
        record.approvalStatus,
        record.approval_status,
        record.decision,
        record.firewall_action,
        record.action,
      ].map((value) => String(value || '').toLowerCase());
      return values.some((value) => ['blocked', 'block', 'request_blocked'].includes(value));
    },

    riskLabel(level) {
      if (global.KernelUtils?.getRiskLabel) return global.KernelUtils.getRiskLabel(level);
      const labels = {
        critical: 'حرج',
        high: 'مرتفع',
        medium: 'متوسط',
        low: 'منخفض',
        minimal: 'ضئيل',
      };
      return labels[String(level || '').toLowerCase()] || String(level || 'غير محدد');
    },

    formatNumber(value) {
      if (global.KernelUtils?.formatNumber) return global.KernelUtils.formatNumber(value || 0);
      return new Intl.NumberFormat('ar-SA').format(value || 0);
    },

    relativeTime(value) {
      if (global.KernelUtils?.formatRelativeTime) return global.KernelUtils.formatRelativeTime(value);
      return new Date(value).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
    },

    escape(value) {
      if (global.KernelUtils?.escapeHtml) return global.KernelUtils.escapeHtml(value);
      return String(value ?? '').replace(/[&<>"']/g, (char) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;',
      })[char]);
    },
  };

  global.KernelNotifications = KernelNotifications;
})(typeof window !== 'undefined' ? window : this);
