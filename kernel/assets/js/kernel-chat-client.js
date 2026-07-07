/**
 * BrightAI Kernel - Chat Client Module
 * Advanced chat interface with streaming, typewriter effect, and governance integration
 * Supports both English and Arabic (RTL)
 */

(function (global) {
  'use strict';

  const KernelChatClient = {
    // Configuration
    config: {
      apiEndpoint: '/api/kernel/chat',
      maxRetries: 3,
      retryDelay: 1000,
      streamChunkDelay: 50,
      typewriterSpeed: 30, // ms per character
      messageHistoryLimit: 100,
      sessionId: null,
    },

    // State
    state: {
      messages: [],
      isLoading: false,
      currentStream: null,
      pendingApproval: null,
      governance: {
        riskLevel: 'low',
        piiDetected: false,
        requiresApproval: false,
      },
    },

    // Initialize chat
    init() {
      this.state.sessionId = this.generateSessionId();
      this.setupEventListeners();
      this.loadMessageHistory();
      this.logEvent('[CHAT] Initialized', { sessionId: this.state.sessionId });
    },

    // Setup event listeners
    setupEventListeners() {
      const sendBtn = document.getElementById('send-btn');
      const inputField = this.getInputField();
      const clearBtn = document.getElementById('clear-btn');
      const approveBtn = document.getElementById('approve-btn');
      const rejectBtn = document.getElementById('reject-btn');
      const sendHandler = this.getPageHandler('sendMessage', () => this.sendMessage());
      const clearHandler = this.getPageHandler('clearChat', () => this.clearHistory());

      if (sendBtn) {
        sendBtn.addEventListener('click', sendHandler);
        sendBtn.addEventListener('touchend', (e) => {
          e.preventDefault();
          sendHandler();
        });
      }

      if (inputField) {
        inputField.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            sendHandler();
          }
        });

        // Set minimum font size for iOS
        inputField.style.fontSize = '16px';
      }

      if (clearBtn) {
        clearBtn.addEventListener('click', clearHandler);
      }

      if (approveBtn) {
        approveBtn.addEventListener('click', () => this.approveRequest());
      }

      if (rejectBtn) {
        rejectBtn.addEventListener('click', () => this.rejectRequest());
      }
    },

    // Send message
    async sendMessage() {
      const inputField = this.getInputField();
      const message = inputField?.value?.trim();

      if (!message) return;

      // Clear input
      if (inputField) inputField.value = '';

      // Add user message to display
      this.addMessageToUI(message, 'user');
      this.state.messages.push({
        role: 'user',
        content: message,
        timestamp: Date.now(),
      });

      // Set loading state
      this.state.isLoading = true;
      this.updateLoadingUI(true);

      try {
        const response = await this.fetchWithRetry(this.config.apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: message,
            sessionId: this.state.sessionId,
            messageHistory: this.state.messages.slice(-10), // Last 10 messages for context
          }),
        });

        const data = await response.json();

        if (this.isApprovalRequired(data)) {
          this.handleApprovalRequired(data);
        } else {
          this.handleStreamResponse(data);
        }
      } catch (error) {
        this.logError('Failed to send message', error);
        this.addMessageToUI('حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى.', 'error');
      } finally {
        this.state.isLoading = false;
        this.updateLoadingUI(false);
      }
    },

    // Handle streaming response with typewriter effect
    handleStreamResponse(data) {
      const response = data.response || '';
      const metadata = data.metadata || data.kernel || {};
      const traceId = this.getTraceId(data);
      const governanceMeta = this.normalizeGovernanceMeta({ ...data, ...metadata, traceId });

      // Update governance state
      if (metadata) {
        this.state.governance = {
          riskLevel: governanceMeta.riskLevel,
          piiDetected: governanceMeta.piiDetected,
          requiresApproval: false,
        };
      }

      // Add AI response with typewriter effect
      this.addMessageToUI('', 'ai', { ...data, ...metadata, traceId });
      const messages = document.querySelectorAll('.message.ai');
      const lastMessage = messages[messages.length - 1];

      if (lastMessage) {
        this.typewriterEffect(response, lastMessage);
      }

      // Add to state
      this.state.messages.push({
        role: 'assistant',
        content: response,
        metadata: { ...metadata, traceId, governance: governanceMeta },
        timestamp: Date.now(),
      });

      this.saveMessageHistory();
    },

    // Handle approval required
    handleApprovalRequired(data) {
      const pendingApproval = this.normalizeApprovalPayload(data);
      this.state.pendingApproval = pendingApproval;
      const approvalPanel = document.getElementById('approval-panel');

      if (approvalPanel) {
        const reasonEl = document.getElementById('approval-reason');
        const riskEl = document.getElementById('approval-risk');

        if (reasonEl) reasonEl.textContent = pendingApproval.reasonText || 'محتوى يتطلب موافقة إدارية';
        if (riskEl) {
          riskEl.textContent = `مستوى الخطر: ${this.getRiskLabel(pendingApproval.riskLevel)}`;
          riskEl.className = `risk-badge risk-${pendingApproval.riskLevel}`;
        }

        approvalPanel.style.display = 'block';
      }

      this.addMessageToUI('تم اكتشاف محتوى حساس. يتطلب موافقة إدارية.', 'governance', {
        traceId: pendingApproval.traceId,
        targetPage: 'approvals',
        riskScore: pendingApproval.riskScore,
        riskLevel: pendingApproval.riskLevel,
        firewallAction: 'pending_approval',
        piiDetected: data.piiDetected || data.kernel?.firewall?.piiDetected || data.metadata?.firewall?.piiDetected || false,
      });
    },

    // Detect either legacy or current approval response contract
    isApprovalRequired(data) {
      return Boolean(data && (data.requiresApproval === true || data.status === 'pending_approval'));
    },

    // Normalize approval fields so the UI never reads undefined values
    normalizeApprovalPayload(data) {
      const interactionId = data.interactionId || data.requestId || data.id || '';
      const riskScore = data.riskScore ?? data.kernel?.risk?.score ?? 0;
      const riskLevel = data.riskLevel || data.kernel?.risk?.level || 'medium';
      const reasons = Array.isArray(data.reasons)
        ? data.reasons
        : data.reason
          ? [data.reason]
          : [];

      return {
        interactionId,
        requestId: data.requestId || interactionId,
        traceId: this.getTraceId(data),
        riskScore,
        riskLevel,
        reasons,
        reasonText: reasons.length > 0 ? reasons.join('، ') : 'محتوى يتطلب موافقة إدارية',
      };
    },

    // Approve request
    async approveRequest() {
      if (!this.state.pendingApproval) return;

      try {
        const response = await this.fetchWithRetry('/api/kernel/approvals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            interactionId: this.state.pendingApproval.interactionId,
            requestId: this.state.pendingApproval.requestId,
            traceId: this.state.pendingApproval.traceId,
            action: 'approve',
            sessionId: this.state.sessionId,
          }),
        });

        const data = await response.json();
        if (data.success || data.status === 'completed') {
          this.addMessageToUI('✓ تمت الموافقة. معالجة الطلب...', 'system');
          this.handleStreamResponse({
            response: data.response,
            metadata: { ...(data.metadata || data.kernel || {}), traceId: this.getTraceId(data) || this.state.pendingApproval.traceId },
            traceId: this.getTraceId(data) || this.state.pendingApproval.traceId,
          });
        }
      } catch (error) {
        this.logError('Failed to approve', error);
      }

      this.clearApprovalPanel();
    },

    // Reject request
    async rejectRequest() {
      if (!this.state.pendingApproval) return;

      try {
        await this.fetchWithRetry('/api/kernel/approvals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            interactionId: this.state.pendingApproval.interactionId,
            requestId: this.state.pendingApproval.requestId,
            traceId: this.state.pendingApproval.traceId,
            action: 'reject',
            sessionId: this.state.sessionId,
          }),
        });

        this.addMessageToUI('✗ تم رفض الطلب.', 'system');
      } catch (error) {
        this.logError('Failed to reject', error);
      }

      this.clearApprovalPanel();
    },

    // Typewriter effect
    typewriterEffect(text, container) {
      let index = 0;
      const contentEl = container.querySelector('.message-content') || container;

      if (window.KernelUtils?.prefersReducedMotion?.()) {
        contentEl.textContent = text;
        return;
      }

      const type = () => {
        if (index < text.length) {
          contentEl.textContent += text[index++];
          setTimeout(type, this.config.typewriterSpeed);
        }
      };

      type();
    },

    // Add message to UI
    addMessageToUI(content, type = 'system', meta = {}) {
      const messagesContainer = document.getElementById('messages');
      if (!messagesContainer) return;

      const messageEl = document.createElement('div');
      messageEl.className = `message ${type}`;

      const contentEl = document.createElement('div');
      contentEl.className = 'message-content';
      contentEl.textContent = content;

      messageEl.appendChild(contentEl);
      const traceId = meta.traceId || this.getTraceId(meta);
      if (traceId) {
        messageEl.appendChild(this.createTraceLink(traceId, meta.targetPage || 'evidence'));
      }
      if (this.shouldRenderGovernanceCard(type, meta)) {
        messageEl.appendChild(this.createGovernanceCard(meta));
      }
      messagesContainer.appendChild(messageEl);

      // Scroll to bottom
      setTimeout(() => {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }, 0);
    },

    // Update loading UI
    updateLoadingUI(isLoading) {
      const sendBtn = document.getElementById('send-btn');
      const inputField = this.getInputField();

      if (sendBtn) {
        sendBtn.disabled = isLoading;
        sendBtn.textContent = isLoading ? 'جاري المعالجة...' : 'إرسال';
      }

      if (inputField) {
        inputField.disabled = isLoading;
      }
    },

    // Clear approval panel
    clearApprovalPanel() {
      const approvalPanel = document.getElementById('approval-panel');
      if (approvalPanel) {
        approvalPanel.style.display = 'none';
      }
      this.state.pendingApproval = null;
    },

    getInputField() {
      return document.getElementById('query-input') || document.getElementById('chat-input');
    },

    getPageHandler(name, fallback) {
      return (...args) => {
        if (typeof global[name] === 'function') return global[name](...args);
        return fallback(...args);
      };
    },

    // Clear history
    clearHistory() {
      const messagesContainer = document.getElementById('messages');
      if (messagesContainer) {
        messagesContainer.innerHTML = '';
      }
      this.state.messages = [];
      localStorage.removeItem(`brightai-chat-${this.state.sessionId}`);
    },

    // Save message history to localStorage
    saveMessageHistory() {
      try {
        const key = `brightai-chat-${this.state.sessionId}`;
        localStorage.setItem(key, JSON.stringify(this.state.messages));
      } catch (e) {
        console.error('[CHAT] Failed to save history:', e);
      }
    },

    // Load message history from localStorage
    loadMessageHistory() {
      try {
        const key = `brightai-chat-${this.state.sessionId}`;
        const saved = localStorage.getItem(key);
      if (saved) {
        this.state.messages = JSON.parse(saved);
          const messagesContainer = document.getElementById('messages');
          if (messagesContainer) {
            messagesContainer.innerHTML = '';
            this.state.messages.forEach((msg) => {
              this.addMessageToUI(msg.content, msg.role === 'user' ? 'user' : 'ai', msg.metadata || {});
            });
          }
        }
      } catch (e) {
        console.error('[CHAT] Failed to load history:', e);
      }
    },

    // Fetch with retry logic
    async fetchWithRetry(url, options = {}, retries = this.config.maxRetries) {
      try {
        const response = await fetch(url, options);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return response;
      } catch (error) {
        if (retries > 0) {
          await new Promise((r) => setTimeout(r, this.config.retryDelay));
          return this.fetchWithRetry(url, options, retries - 1);
        }
        throw error;
      }
    },

    // Generate session ID
    generateSessionId() {
      return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    },

    getTraceId(data = {}) {
      const value = data.traceId || data.trace_id || data.kernel?.traceId || data.metadata?.traceId || data.summary?.traceId;
      return /^AI-\d{4}-\d{5,}$/.test(String(value || '')) ? String(value) : null;
    },

    createTraceLink(traceId, targetPage = 'evidence') {
      const link = document.createElement('a');
      link.className = 'kernel-trace-link';
      link.href = targetPage === 'approvals'
        ? `/kernel/approvals/?trace_id=${encodeURIComponent(traceId)}`
        : `/kernel/${targetPage}/?trace_id=${encodeURIComponent(traceId)}`;
      link.textContent = traceId;
      link.title = 'فتح سجل Trace ID';
      return link;
    },

    shouldRenderGovernanceCard(type, meta = {}) {
      return ['ai', 'governance'].includes(type) || Boolean(
        meta.riskScore !== undefined ||
        meta.riskLevel ||
        meta.piiDetected !== undefined ||
        meta.firewallAction ||
        meta.firewall ||
        meta.kernel?.firewall ||
        this.getTraceId(meta)
      );
    },

    normalizePiiItems(value) {
      if (Array.isArray(value)) return value.filter(Boolean);
      if (!value || typeof value !== 'object') return [];
      if (Array.isArray(value.items)) return value.items.filter(Boolean);
      if (Array.isArray(value.detected)) return value.detected.filter(Boolean);
      if (Array.isArray(value.entities)) return value.entities.filter(Boolean);
      if (value.type || value.name) return [value];
      return Object.entries(value)
        .filter(([, detected]) => detected === true)
        .map(([type]) => type);
    },

    normalizeBooleanSignal(value) {
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === 'boolean') return value;
      if (typeof value === 'number') return value > 0;
      if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        return ['true', 'yes', 'detected', 'found', '1'].includes(normalized);
      }
      return Boolean(value && typeof value === 'object' && this.normalizePiiItems(value).length > 0);
    },

    clampRiskScore(value) {
      const score = Number(value);
      if (!Number.isFinite(score)) return 0;
      return Math.max(0, Math.min(100, Math.round(score)));
    },

    normalizeGovernanceMeta(data = {}) {
      const riskScore = this.clampRiskScore(
        data.riskScore ??
        data.kernel?.risk?.score ??
        data.metadata?.riskScore ??
        data.metadata?.risk?.score ??
        data.summary?.riskScore ??
        0
      );
      const riskLevel = data.riskLevel || data.kernel?.risk?.level || data.metadata?.riskLevel || data.metadata?.risk?.level || (
        riskScore < 30 ? 'low' : riskScore < 60 ? 'medium' : riskScore < 85 ? 'high' : 'critical'
      );
      const rawPii = data.piiDetected ??
        data.pii ??
        data.firewall?.piiDetected ??
        data.kernel?.piiDetected ??
        data.kernel?.firewall?.piiDetected ??
        data.metadata?.piiDetected ??
        data.metadata?.firewall?.piiDetected;
      const piiItems = this.normalizePiiItems(rawPii);
      const piiDetected = piiItems.length > 0 || this.normalizeBooleanSignal(rawPii);
      const firewallAction = data.firewallAction ||
        data.firewall?.action ||
        data.kernel?.firewall?.action ||
        data.metadata?.firewall?.action ||
        data.decision ||
        data.status ||
        'allowed';

      return {
        riskScore,
        riskLevel,
        piiDetected,
        piiItems,
        firewallAction,
        traceId: data.traceId || this.getTraceId(data),
      };
    },

    governanceHref(page, traceId) {
      const safe = traceId ? `?trace_id=${encodeURIComponent(traceId)}` : '';
      if (page === 'audit') return `/kernel/audit/${safe}`;
      if (page === 'policies') {
        return traceId
          ? `/kernel/policies/?create=1&trace_id=${encodeURIComponent(traceId)}`
          : '/kernel/policies/?create=1';
      }
      return `/kernel/evidence/${safe}`;
    },

    cssToken(value) {
      return String(value || '').toLowerCase().replace(/[^a-z0-9_-]/g, '-');
    },

    createGovernanceCard(meta = {}) {
      const normalized = this.normalizeGovernanceMeta(meta);
      const card = document.createElement('div');
      card.className = 'kernel-governance-card';
      card.setAttribute('aria-label', 'ملخص الحوكمة');

      const grid = document.createElement('div');
      grid.className = 'kernel-governance-grid';

      const piiItemsText = normalized.piiItems
        .map((item) => (typeof item === 'string' ? item : item.type || item.name || 'PII'))
        .join('، ');
      const piiLabel = normalized.piiDetected
        ? `نعم${piiItemsText ? ` · ${piiItemsText}` : ''}`
        : 'لا';
      const actionLabel = this.getDecisionLabel(normalized.firewallAction) || normalized.firewallAction;

      grid.appendChild(this.createGovernanceItem('Risk score', `${normalized.riskScore}%`, `risk-${this.cssToken(normalized.riskLevel)}`));
      grid.appendChild(this.createGovernanceItem('PII detected', piiLabel, normalized.piiDetected ? 'pii-yes' : 'pii-no'));
      grid.appendChild(this.createGovernanceItem('Firewall action', actionLabel, `action-${this.cssToken(normalized.firewallAction)}`));
      grid.appendChild(this.createGovernanceItem('Trace ID', normalized.traceId || 'غير متوفر', 'trace'));
      card.appendChild(grid);

      const actions = document.createElement('div');
      actions.className = 'kernel-governance-actions';
      actions.setAttribute('aria-label', 'إجراءات الحوكمة');
      actions.appendChild(this.createGovernanceButton('Audit', 'mdi:format-list-checks', this.governanceHref('audit', normalized.traceId)));
      actions.appendChild(this.createGovernanceButton('Evidence', 'mdi:file-lock', this.governanceHref('evidence', normalized.traceId)));
      actions.appendChild(this.createGovernanceButton('Create Policy', 'mdi:shield-half-full', this.governanceHref('policies', normalized.traceId)));
      card.appendChild(actions);

      return card;
    },

    createGovernanceItem(label, value, valueClass = '') {
      const item = document.createElement('div');
      item.className = 'kernel-governance-item';

      const labelEl = document.createElement('span');
      labelEl.className = 'kernel-governance-label';
      labelEl.textContent = label;

      const valueEl = document.createElement('span');
      valueEl.className = `kernel-governance-value ${valueClass}`.trim();
      valueEl.textContent = value;

      item.appendChild(labelEl);
      item.appendChild(valueEl);
      return item;
    },

    createGovernanceButton(label, icon, href) {
      const link = document.createElement('a');
      link.className = 'kernel-governance-btn';
      link.href = href;

      const iconEl = document.createElement('iconify-icon');
      iconEl.className = 'kernel-governance-icon';
      iconEl.setAttribute('icon', icon);
      iconEl.setAttribute('aria-hidden', 'true');

      const labelEl = document.createElement('span');
      labelEl.textContent = label;

      link.appendChild(iconEl);
      link.appendChild(labelEl);
      return link;
    },

    // Get risk label
    getRiskLabel(level) {
      const labels = {
        low: 'منخفض',
        medium: 'متوسط',
        high: 'مرتفع',
        critical: 'حرج',
      };
      return labels[level] || level;
    },

    getDecisionLabel(decision) {
      const labels = {
        allowed: 'مسموح',
        masked: 'مخفى',
        blocked: 'محظور',
        pending: 'بانتظار الموافقة',
        pending_approval: 'بانتظار الموافقة',
        approved: 'موافق عليه',
        rejected: 'مرفوض',
        completed: 'مكتمل',
        executed_after_approval: 'تم التنفيذ بعد الموافقة',
      };
      return labels[String(decision || '').toLowerCase()] || decision;
    },

    // Logging
    logEvent(message, data = {}) {},
    logError(message, error) {
      console.error(`[CHAT ERROR] ${message}`, error);
    },
  };

  // Export to global scope
  global.KernelChatClient = KernelChatClient;

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      KernelChatClient.init();
    });
  } else {
    KernelChatClient.init();
  }
})(window);
