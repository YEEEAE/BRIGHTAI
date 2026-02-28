(function () {
  'use strict';

  const SESSION_LIFETIME_MS = 20 * 60 * 1000;
  const CLIENT_TIMEOUT_MS = 35000;
  const RETRYABLE_ERROR_CODES = new Set([
    'RATE_LIMIT_EXCEEDED',
    'STREAM_TIMEOUT',
    'AI_UNAVAILABLE',
    'AI_STREAM_ERROR',
    'AI_AUTH_ERROR',
    'GROQ_UNAVAILABLE',
    'GROQ_STREAM_ERROR',
    'CLIENT_TIMEOUT',
    'NETWORK_ERROR',
    'HTTP_ERROR',
    'EMPTY_STREAM'
  ]);

  const BOT_PROFILES = {
    support: {
      label: 'BrightSupport',
      outputType: 'دعم العملاء',
      welcome:
        'مرحباً بك في BrightSupport. عندنا دعم فوري على مدار الساعة، اكتب استفسارك وسنبدأ مباشرة.',
      quickActions: [
        'كيف أقدر أبدأ مع حلولكم؟',
        'وش أفضل باقة لقطاعي؟',
        'كيف أحجز استشارة تنفيذية؟'
      ]
    },
    recruiter: {
      label: 'BrightRecruiter',
      outputType: 'التوظيف الذكي',
      welcome:
        'مرحباً بك في BrightRecruiter. أرسل سؤالك أو تفاصيل الوظيفة، ونقدر ندعمك في فرز المرشحين مبدئياً.',
      quickActions: [
        'ابغى قالب وصف وظيفي سريع',
        'وش معايير فرز السير الذاتية؟',
        'كيف أقيس جودة المرشح؟'
      ]
    },
    sales: {
      label: 'BrightSales',
      outputType: 'المبيعات',
      welcome:
        'مرحباً بك في BrightSales. نقدر نساعدك بتأهيل العملاء وبناء سيناريو مبيعات واضح.',
      quickActions: [
        'ابغى سكربت اتصال أولي',
        'وش أفضل طريقة لتأهيل العميل؟',
        'كيف أزيد معدل الإغلاق؟'
      ]
    },
    project: {
      label: 'BrightProject',
      outputType: 'إدارة المشاريع',
      welcome:
        'مرحباً بك في BrightProject. اكتب التحدي الحالي في مشروعك ونرتبه لك بخطة تنفيذ واضحة.',
      quickActions: [
        'كيف أبني خطة مشروع 90 يوم؟',
        'وش أهم مخاطر التنفيذ؟',
        'كيف أوزع المهام على الفريق؟'
      ]
    },
    math: {
      label: 'BrightMath',
      outputType: 'شرح وتعليم',
      welcome:
        'مرحباً بك في BrightMath. اكتب المسألة أو ارفع ملف، وبنشرح لك الحل خطوة بخطوة.',
      quickActions: [
        'اشرح لي الجبر بطريقة مبسطة',
        'حل مسألة تفاضل خطوة بخطوة',
        'اعطني تمارين للمراجعة'
      ]
    }
  };

  class StreamRequestError extends Error {
    constructor(message, details = {}) {
      super(message);
      this.name = 'StreamRequestError';
      this.status = details.status || 500;
      this.errorCode = details.errorCode || 'STREAM_ERROR';
      this.retryable = details.retryable !== false;
    }
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatMessageHtml(text) {
    let safe = escapeHtml(text);
    safe = safe.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    safe = safe.replace(/\*(.+?)\*/g, '<em>$1</em>');
    safe = safe.replace(/\n/g, '<br>');
    return safe;
  }

  function safeJsonParse(raw) {
    try {
      return JSON.parse(raw);
    } catch (error) {
      return null;
    }
  }

  function detectProfileId(container) {
    const declared = container.dataset.chatbotProfile;
    if (declared && BOT_PROFILES[declared]) return declared;

    const path = window.location.pathname.toLowerCase();
    if (path.includes('brightsupport')) return 'support';
    if (path.includes('brightrecruiter')) return 'recruiter';
    if (path.includes('brightsales')) return 'sales';
    if (path.includes('brightproject')) return 'project';
    if (path.includes('brightmath')) return 'math';

    return 'support';
  }

  class GroqStreamClient {
    constructor(endpoint) {
      const _gw = (typeof window !== 'undefined' && window.BrightAIGateway) || {};
      const _defaultEndpoint = typeof _gw.buildUrl === 'function'
        ? _gw.buildUrl('/api/ai/stream')
        : '/api/ai/stream';
      this.endpoint = endpoint || _defaultEndpoint;
    }

    async readErrorPayload(response) {
      const contentType = response.headers.get('content-type') || '';
      const raw = await response.text().catch(() => '');

      if (contentType.includes('application/json')) {
        const parsed = safeJsonParse(raw);
        if (parsed) return parsed;
      }

      return {
        error: raw || 'تعذر إكمال الطلب.',
        errorCode: response.status === 429 ? 'RATE_LIMIT_EXCEEDED' : 'HTTP_ERROR'
      };
    }

    async stream({ payload, onSession, onToken }) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), CLIENT_TIMEOUT_MS);

      if (timeoutId.unref) timeoutId.unref();

      try {
        const response = await fetch(this.endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: controller.signal
        });

        if (!response.ok) {
          const errorPayload = await this.readErrorPayload(response);
          throw new StreamRequestError(errorPayload.error || 'تعذر الاتصال بالخادم.', {
            status: response.status,
            errorCode: errorPayload.errorCode || 'HTTP_ERROR',
            retryable: response.status !== 401 && response.status !== 403
          });
        }

        if (!response.body) {
          throw new StreamRequestError('لم يتم استلام بث من الخادم.', {
            status: 500,
            errorCode: 'EMPTY_STREAM',
            retryable: true
          });
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const rawLine of lines) {
            const line = rawLine.trim();
            if (!line || !line.startsWith('data:')) continue;

            const data = line.replace(/^data:\s*/, '');
            if (!data) continue;
            if (data === '[DONE]') return;

            const parsed = safeJsonParse(data);
            if (!parsed) continue;

            if (parsed.sessionId && typeof onSession === 'function') {
              onSession(parsed.sessionId);
            }

            if (parsed.error) {
              throw new StreamRequestError(parsed.error, {
                status: 500,
                errorCode: parsed.errorCode || 'AI_STREAM_ERROR',
                retryable: parsed.retryable !== false
              });
            }

            if (typeof parsed.token === 'string' && typeof onToken === 'function') {
              onToken(parsed.token);
            }
          }
        }
      } catch (error) {
        if (error instanceof StreamRequestError) {
          throw error;
        }

        if (error?.name === 'AbortError') {
          throw new StreamRequestError('انتهت مهلة الاتصال بالخادم.', {
            status: 408,
            errorCode: 'CLIENT_TIMEOUT',
            retryable: true
          });
        }

        throw new StreamRequestError('تعذر إكمال الطلب حالياً.', {
          status: 500,
          errorCode: 'NETWORK_ERROR',
          retryable: true
        });
      } finally {
        clearTimeout(timeoutId);
      }
    }
  }

  class ProductionChatbot {
    constructor(container) {
      this.container = container;
      this.profileId = detectProfileId(container);
      this.profile = BOT_PROFILES[this.profileId] || BOT_PROFILES.support;
      const _gw2 = (typeof window !== 'undefined' && window.BrightAIGateway) || {};
      const _defaultStreamEndpoint = typeof _gw2.buildUrl === 'function'
        ? _gw2.buildUrl('/api/ai/stream')
        : '/api/ai/stream';
      this.endpoint = container.dataset.chatEndpoint || _defaultStreamEndpoint;
      this.sessionKey = `brightai_chat_session_${this.profileId}`;

      this.chatMessages = document.getElementById('chatMessages');
      this.userInput = document.getElementById('userInput');
      this.sendButton = document.getElementById('sendButton');
      this.fileInput = document.getElementById('fileInput');
      this.fileButton = document.getElementById('fileButton') || document.getElementById('attachButton');
      this.inputArea = this.container.querySelector('.input-area');
      this.customFilePreview = document.getElementById('filePreview');

      this.stateElement = null;
      this.currentFile = null;
      this.pending = false;
      this.lastRequest = null;
      this.sessionId = this.loadSessionId();
      this.client = new GroqStreamClient(this.endpoint);
    }

    init() {
      if (!this.chatMessages || !this.userInput || !this.sendButton) return;

      this.injectRuntimeStyles();
      this.mountStateElement();
      this.bindEvents();
      this.renderInitialUI();
      this.refreshComposerState();
    }

    injectRuntimeStyles() {
      if (document.getElementById('chatbot-runtime-style')) return;

      const style = document.createElement('style');
      style.id = 'chatbot-runtime-style';
      style.textContent = `
        .chat-runtime-state {
          margin-top: 8px;
          font-size: 13px;
          color: #64748b;
          min-height: 20px;
        }

        .chat-runtime-state[data-state="loading"] {
          color: #0f766e;
          font-weight: 600;
        }

        .chat-runtime-state[data-state="error"] {
          color: #b91c1c;
          font-weight: 600;
        }

        .chat-quick-actions {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .chat-quick-actions .option-button {
          border: 1px solid #d1d5db;
          background: #f8fafc;
          color: #0f172a;
          border-radius: 8px;
          padding: 8px 10px;
          text-align: right;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }

        .chat-quick-actions .option-button:hover {
          background: #eef2ff;
        }

        .chat-retry-button {
          margin-top: 10px;
          border: 0;
          border-radius: 8px;
          padding: 8px 12px;
          background: #1d4ed8;
          color: #fff;
          cursor: pointer;
          font-size: 13px;
          font-family: inherit;
        }

        .chat-privacy-note {
          font-size: 12px;
          color: #475569;
          line-height: 1.6;
        }

        .chat-file-remove-btn {
          border: 0;
          background: transparent;
          color: #dc2626;
          cursor: pointer;
          padding: 2px 6px;
          font-size: 12px;
          font-family: inherit;
        }
      `;

      document.head.appendChild(style);
    }

    mountStateElement() {
      const stateEl = document.createElement('div');
      stateEl.className = 'chat-runtime-state';
      stateEl.setAttribute('aria-live', 'polite');
      stateEl.setAttribute('data-state', 'idle');
      stateEl.textContent = 'جاهز لاستقبال رسالتك.';

      if (this.inputArea && this.inputArea.parentNode) {
        this.inputArea.parentNode.insertBefore(stateEl, this.inputArea.nextSibling);
      } else {
        this.container.appendChild(stateEl);
      }

      this.stateElement = stateEl;
    }

    bindEvents() {
      this.sendButton.addEventListener('click', () => this.sendCurrentMessage());

      this.userInput.addEventListener('keydown', event => {
        if (event.key === 'Enter' && !event.shiftKey) {
          event.preventDefault();
          this.sendCurrentMessage();
        }
      });

      this.userInput.addEventListener('input', () => {
        this.adjustTextareaHeight();
        this.refreshComposerState();
      });

      if (this.fileButton && this.fileInput) {
        this.fileButton.addEventListener('click', () => this.fileInput.click());
      }

      if (this.fileInput) {
        this.fileInput.addEventListener('change', () => {
          const file = this.fileInput.files && this.fileInput.files[0] ? this.fileInput.files[0] : null;
          this.currentFile = file;
          this.renderFilePreview();
          this.refreshComposerState();
        });
      }
    }

    renderInitialUI() {
      if (this.chatMessages.children.length > 0) return;

      this.addMessage(this.profile.welcome, 'bot');
      this.renderQuickActions(this.profile.quickActions || []);

      const privacyText =
        'سياسة الخصوصية: نحفظ معرف الجلسة فقط داخل المتصفح (Session Storage) بدون تخزين نص المحادثة محلياً. محفوظات الخادم قصيرة العمر ومخفية للبيانات الحساسة.';
      const privacyMessage = this.addMessage(privacyText, 'bot');
      privacyMessage.classList.add('chat-privacy-note');
    }

    renderQuickActions(actions) {
      if (!Array.isArray(actions) || actions.length === 0) return;

      const wrapper = document.createElement('div');
      wrapper.className = 'message bot-message';

      const quickActions = document.createElement('div');
      quickActions.className = 'chat-quick-actions';

      actions.forEach(action => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'option-button';
        button.textContent = action;
        button.addEventListener('click', () => {
          this.userInput.value = action;
          this.adjustTextareaHeight();
          this.refreshComposerState();
          this.sendCurrentMessage();
        });
        quickActions.appendChild(button);
      });

      wrapper.appendChild(quickActions);
      this.chatMessages.appendChild(wrapper);
      this.scrollToBottom();
    }

    adjustTextareaHeight() {
      this.userInput.style.height = 'auto';
      this.userInput.style.height = `${Math.min(this.userInput.scrollHeight, 150)}px`;
    }

    formatFileMeta(file) {
      if (!file) return '';
      const sizeKb = Math.max(1, Math.round(file.size / 1024));
      return `ملف مرفق: ${file.name} (${sizeKb}KB)`;
    }

    renderFilePreview() {
      const targetContainer = this.customFilePreview || this.container;
      let preview = targetContainer.querySelector('.runtime-file-preview');

      if (!this.currentFile) {
        if (preview) preview.remove();
        return;
      }

      if (!preview) {
        preview = document.createElement('div');
        preview.className = 'file-preview runtime-file-preview';

        if (this.customFilePreview) {
          this.customFilePreview.innerHTML = '';
          this.customFilePreview.appendChild(preview);
        } else if (this.inputArea && this.inputArea.parentNode) {
          this.inputArea.parentNode.insertBefore(preview, this.inputArea);
        } else {
          targetContainer.appendChild(preview);
        }
      }

      preview.innerHTML = `
        <i class="material-icons">description</i>
        <span class="file-name">${escapeHtml(this.currentFile.name)}</span>
      `;

      const removeButton = document.createElement('button');
      removeButton.type = 'button';
      removeButton.className = 'chat-file-remove-btn';
      removeButton.textContent = 'إزالة';
      removeButton.addEventListener('click', () => {
        this.currentFile = null;
        if (this.fileInput) this.fileInput.value = '';
        this.renderFilePreview();
        this.refreshComposerState();
      });

      preview.appendChild(removeButton);
    }

    addMessage(text, sender) {
      const messageDiv = document.createElement('div');
      messageDiv.className = `message ${sender}-message`;
      messageDiv.innerHTML = formatMessageHtml(text);
      this.chatMessages.appendChild(messageDiv);
      this.scrollToBottom();
      return messageDiv;
    }

    addTypingIndicator() {
      const typingDiv = document.createElement('div');
      typingDiv.className = 'message bot-message';
      typingDiv.innerHTML = '<div style="display:flex;gap:4px;"><span class="typing-dot">.</span><span class="typing-dot">.</span><span class="typing-dot">.</span></div>';
      this.chatMessages.appendChild(typingDiv);
      this.scrollToBottom();
      return typingDiv;
    }

    scrollToBottom() {
      this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    setRuntimeState(state, text) {
      if (!this.stateElement) return;
      this.stateElement.dataset.state = state;
      this.stateElement.textContent = text;
    }

    setPending(isPending) {
      this.pending = isPending;
      this.userInput.disabled = isPending;
      if (this.fileButton) this.fileButton.disabled = isPending;
      this.refreshComposerState();
    }

    refreshComposerState() {
      if (!this.sendButton || !this.userInput) return;
      const hasText = this.userInput.value.trim().length > 0;
      const hasFile = !!this.currentFile;
      this.sendButton.disabled = this.pending || (!hasText && !hasFile);
    }

    loadSessionId() {
      if (!window.sessionStorage) return null;

      const raw = sessionStorage.getItem(this.sessionKey);
      if (!raw) return null;

      const parsed = safeJsonParse(raw);
      if (!parsed || !parsed.id || !parsed.expiresAt) {
        sessionStorage.removeItem(this.sessionKey);
        return null;
      }

      if (Date.now() > parsed.expiresAt) {
        sessionStorage.removeItem(this.sessionKey);
        return null;
      }

      return parsed.id;
    }

    persistSessionId(id) {
      if (!window.sessionStorage || !id) return;
      const payload = {
        id,
        expiresAt: Date.now() + SESSION_LIFETIME_MS
      };
      sessionStorage.setItem(this.sessionKey, JSON.stringify(payload));
    }

    async sendCurrentMessage() {
      if (this.pending) return;

      const text = this.userInput.value.trim();
      const fileMeta = this.formatFileMeta(this.currentFile);

      if (!text && !fileMeta) return;

      const userVisible = [text, fileMeta].filter(Boolean).join('\n');
      this.addMessage(userVisible, 'user');

      const requestPayload = {
        message: [text, fileMeta].filter(Boolean).join('\n'),
        outputType: this.profile.outputType,
        sessionId: this.sessionId || undefined
      };

      this.lastRequest = {
        payload: requestPayload,
        userVisible
      };

      this.userInput.value = '';
      this.userInput.style.height = '45px';
      this.currentFile = null;
      if (this.fileInput) this.fileInput.value = '';
      this.renderFilePreview();

      await this.dispatchRequest(requestPayload, false);
    }

    async retryLastRequest() {
      if (!this.lastRequest || this.pending) return;

      const retryPayload = {
        ...this.lastRequest.payload,
        sessionId: this.sessionId || this.lastRequest.payload.sessionId || undefined
      };

      await this.dispatchRequest(retryPayload, true);
    }

    normalizeError(error) {
      const errorCode = error?.errorCode || 'UNKNOWN';
      const retryable = error?.retryable !== false && RETRYABLE_ERROR_CODES.has(errorCode);

      if (errorCode === 'RATE_LIMIT_EXCEEDED') {
        return {
          message: 'وصلت للحد المسموح للطلبات. انتظر دقيقة ثم أعد المحاولة.',
          retryable: true
        };
      }

      if (errorCode === 'STREAM_TIMEOUT' || errorCode === 'CLIENT_TIMEOUT') {
        return {
          message: 'انتهت مهلة الرد. تقدر تعيد المحاولة الآن.',
          retryable: true
        };
      }

      if (errorCode === 'AI_UNAVAILABLE' || errorCode === 'GROQ_UNAVAILABLE') {
        return {
          message: 'الخدمة مشغولة حالياً. جرّب بعد لحظات.',
          retryable: true
        };
      }

      if (errorCode === 'AI_AUTH_ERROR' || errorCode === 'GROQ_AUTH_ERROR') {
        return {
          message: 'الخدمة غير متاحة حالياً من جهة الإعدادات.',
          retryable: false
        };
      }

      return {
        message: error?.message || 'حدث خطأ غير متوقع أثناء المعالجة.',
        retryable
      };
    }

    showErrorBubble(message, retryable) {
      const bubble = this.addMessage(message, 'bot');

      if (!retryable) return;

      const retryButton = document.createElement('button');
      retryButton.type = 'button';
      retryButton.className = 'chat-retry-button';
      retryButton.textContent = 'إعادة المحاولة';
      retryButton.addEventListener('click', () => {
        this.retryLastRequest();
      });

      bubble.appendChild(document.createElement('br'));
      bubble.appendChild(retryButton);
    }

    async dispatchRequest(requestPayload, isRetry) {
      const typingIndicator = this.addTypingIndicator();
      const responseBubble = this.addMessage('', 'bot');
      let streamText = '';

      this.setPending(true);
      this.setRuntimeState('loading', 'جاري المعالجة...');

      try {
        await this.client.stream({
          payload: requestPayload,
          onSession: id => {
            this.sessionId = id;
            this.persistSessionId(id);
          },
          onToken: token => {
            streamText += token;
            responseBubble.innerHTML = formatMessageHtml(streamText);
            this.scrollToBottom();
          }
        });

        if (!streamText.trim()) {
          responseBubble.innerHTML = 'تم استلام الرد بدون محتوى قابل للعرض.';
        }

        this.setRuntimeState('idle', isRetry ? 'تمت إعادة المحاولة بنجاح.' : 'جاهز لاستقبال رسالتك.');
      } catch (error) {
        responseBubble.remove();

        const normalized = this.normalizeError(error);
        this.showErrorBubble(normalized.message, normalized.retryable);
        this.setRuntimeState('error', normalized.message);
      } finally {
        typingIndicator.remove();
        this.setPending(false);
      }
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    const container = document.querySelector('.chat-container');
    if (!container) return;

    const app = new ProductionChatbot(container);
    app.init();
  });
})();
