/**
 * Bright AI Enterprise Chatbot
 * مساعد Bright AI المؤسسي - واجهة أمامية للشات بوت
 * Requirements: REQ-8.1, REQ-8.2
 */

'use strict';

/**
 * Enterprise Chatbot Configuration
 */
const ENTERPRISE_CONFIG = {
  apiEndpoint: '/api/ai/chat',
  welcomeMessage: 'مرحباً بكم في Bright AI. أنا مستشاركم الذكي للحلول المؤسسية. كيف يمكنني مساعدتكم اليوم؟',
  placeholder: 'اكتب استفسارك هنا...',
  title: 'مستشار Bright AI',
  subtitle: 'شريككم الاستراتيجي للتحول الرقمي',
  whatsappLink: 'https://wa.me/966538229013',
  maxMessageLength: 500,
  typingDelay: 1500
};

/**
 * Enterprise Chatbot Class
 * Manages the AI chatbot widget with enterprise styling
 */
class BrightAIEnterpriseChatbot {
  constructor(options = {}) {
    this.config = { ...ENTERPRISE_CONFIG, ...options };
    this.isOpen = false;
    this.isLoading = false;
    this.conversationHistory = [];
    this.sessionId = null;
    this.widget = null;
    this.lastFocusedElement = null;

    // Bind methods
    this.toggle = this.toggle.bind(this);
    this.sendMessage = this.sendMessage.bind(this);
    this.handleKeyPress = this.handleKeyPress.bind(this);
  }

  /**
   * Initialize the chatbot widget
   */
  init() {
    this.createWidget();
    this.attachEventListeners();
    this.addMessage(this.config.welcomeMessage, 'bot');
    console.log('[Bright AI Enterprise Chatbot] Initialized');
  }

  /**
   * Create the enterprise chatbot widget HTML
   */
  createWidget() {
    this.widget = document.createElement('div');
    this.widget.className = 'enterprise-chatbot';
    this.widget.setAttribute('role', 'region');
    this.widget.setAttribute('aria-label', 'مستشار Bright AI المؤسسي');

    this.widget.innerHTML = `
      <!-- Toggle Button -->
      <button class="enterprise-chatbot__toggle" 
              aria-label="فتح المحادثة مع مستشار Bright AI" 
              aria-expanded="false"
              aria-controls="enterprise-chatbot-window"
              type="button">
        <svg class="enterprise-chatbot__toggle-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
          <circle cx="12" cy="10" r="1.5"/>
          <circle cx="8" cy="10" r="1.5"/>
          <circle cx="16" cy="10" r="1.5"/>
        </svg>
        <span class="enterprise-chatbot__toggle-pulse"></span>
      </button>

      <!-- Chat Window -->
      <div class="enterprise-chatbot__window" 
           id="enterprise-chatbot-window"
           role="dialog" 
           aria-labelledby="enterprise-chatbot-title"
           aria-modal="true"
           aria-hidden="true">
        
        <!-- Header -->
        <header class="enterprise-chatbot__header">
          <div class="enterprise-chatbot__header-info">
            <div class="enterprise-chatbot__avatar">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
              </svg>
            </div>
            <div class="enterprise-chatbot__header-text">
              <h2 class="enterprise-chatbot__title" id="enterprise-chatbot-title">${this.escapeHtml(this.config.title)}</h2>
              <span class="enterprise-chatbot__status">
                <span class="enterprise-chatbot__status-dot"></span>
                متصل الآن
              </span>
            </div>
          </div>
          <button class="enterprise-chatbot__close" 
                  aria-label="إغلاق المحادثة"
                  type="button">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </header>

        <!-- Messages Area -->
        <div class="enterprise-chatbot__messages" 
             role="log" 
             aria-live="polite" 
             aria-label="سجل المحادثة"
             tabindex="0">
        </div>

        <!-- Quick Actions -->
        <div class="enterprise-chatbot__quick-actions">
          <button type="button" class="enterprise-chatbot__quick-btn" data-message="ما هي خدماتكم؟">
            الخدمات
          </button>
          <button type="button" class="enterprise-chatbot__quick-btn" data-message="أريد حجز استشارة تنفيذية">
            استشارة
          </button>
          <button type="button" class="enterprise-chatbot__quick-btn" data-message="ما القطاعات التي تخدمونها؟">
            القطاعات
          </button>
        </div>

        <!-- Input Area -->
        <footer class="enterprise-chatbot__input-area">
          <label for="enterprise-chatbot-input" class="sr-only">اكتب استفسارك</label>
          <input type="text" 
                 id="enterprise-chatbot-input"
                 class="enterprise-chatbot__input" 
                 placeholder="${this.escapeHtml(this.config.placeholder)}"
                 autocomplete="off"
                 maxlength="${this.config.maxMessageLength}"
                 aria-describedby="enterprise-chatbot-hint">
          <span id="enterprise-chatbot-hint" class="sr-only">اضغط Enter لإرسال الرسالة</span>
          <button class="enterprise-chatbot__send" 
                  aria-label="إرسال الرسالة"
                  type="button">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
          </button>
        </footer>

        <!-- WhatsApp CTA -->
        <div class="enterprise-chatbot__cta">
          <a href="${this.config.whatsappLink}" 
             target="_blank" 
             rel="noopener noreferrer"
             class="enterprise-chatbot__whatsapp">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            طلب استشارة تنفيذية
          </a>
        </div>
      </div>
    `;

    document.body.appendChild(this.widget);
    this.cacheElements();
  }

  /**
   * Cache DOM element references
   */
  cacheElements() {
    this.toggleButton = this.widget.querySelector('.enterprise-chatbot__toggle');
    this.chatWindow = this.widget.querySelector('.enterprise-chatbot__window');
    this.messagesContainer = this.widget.querySelector('.enterprise-chatbot__messages');
    this.inputField = this.widget.querySelector('.enterprise-chatbot__input');
    this.sendButton = this.widget.querySelector('.enterprise-chatbot__send');
    this.closeButton = this.widget.querySelector('.enterprise-chatbot__close');
    this.quickButtons = this.widget.querySelectorAll('.enterprise-chatbot__quick-btn');
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    this.toggleButton.addEventListener('click', this.toggle);
    this.closeButton.addEventListener('click', this.toggle);
    this.sendButton.addEventListener('click', this.sendMessage);
    this.inputField.addEventListener('keypress', this.handleKeyPress);

    // Quick action buttons
    this.quickButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const message = btn.dataset.message;
        if (message) {
          this.inputField.value = message;
          this.sendMessage();
        }
      });
    });

    // Close on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.toggle();
      }
    });
  }

  /**
   * Toggle chatbot open/closed
   */
  toggle() {
    this.isOpen = !this.isOpen;
    
    this.chatWindow.classList.toggle('open', this.isOpen);
    this.toggleButton.classList.toggle('active', this.isOpen);
    this.toggleButton.setAttribute('aria-expanded', String(this.isOpen));
    this.chatWindow.setAttribute('aria-hidden', String(!this.isOpen));
    
    this.toggleButton.setAttribute(
      'aria-label', 
      this.isOpen ? 'إغلاق المحادثة' : 'فتح المحادثة مع مستشار Bright AI'
    );
    
    if (this.isOpen) {
      this.lastFocusedElement = document.activeElement;
      setTimeout(() => this.inputField.focus(), 100);
    } else if (this.lastFocusedElement) {
      this.lastFocusedElement.focus();
    }
  }

  /**
   * Handle Enter key press
   */
  handleKeyPress(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      this.sendMessage();
    }
  }

  /**
   * Send message to API
   */
  async sendMessage() {
    const message = this.inputField.value.trim();
    
    if (!message || this.isLoading) return;
    if (message.length > this.config.maxMessageLength) {
      this.showError('الرسالة طويلة جداً. الحد الأقصى هو ' + this.config.maxMessageLength + ' حرف.');
      return;
    }
    
    this.inputField.value = '';
    this.addMessage(message, 'user');
    this.setLoading(true);
    
    try {
      const response = await this.callAPI(message);
      this.addMessage(response.reply, 'bot');
      
      if (response.sessionId) {
        this.sessionId = response.sessionId;
      }
    } catch (error) {
      console.error('[Enterprise Chatbot] Error:', error);
      this.showError(error.message || 'عذراً، حدث خطأ. يرجى المحاولة مرة أخرى.');
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Call the server API
   */
  async callAPI(message) {
    const response = await fetch(this.config.apiEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        history: this.getHistoryForAPI(),
        sessionId: this.sessionId
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'حدث خطأ في الاتصال');
    }

    return data;
  }

  /**
   * Get conversation history for API
   */
  getHistoryForAPI() {
    return this.conversationHistory.slice(-10).map(msg => ({
      text: msg.text,
      sender: msg.sender
    }));
  }

  /**
   * Add message to conversation
   */
  addMessage(text, sender) {
    const timestamp = new Date();
    
    this.conversationHistory.push({
      id: this.generateId(),
      text,
      sender,
      timestamp
    });

    const messageEl = document.createElement('div');
    messageEl.className = `enterprise-chatbot__message enterprise-chatbot__message--${sender}`;
    messageEl.innerHTML = `
      <div class="enterprise-chatbot__message-content">
        <span class="enterprise-chatbot__message-text">${this.escapeHtml(text)}</span>
        <span class="enterprise-chatbot__message-time">${this.formatTime(timestamp)}</span>
      </div>
    `;

    this.messagesContainer.appendChild(messageEl);
    this.scrollToBottom();
  }

  /**
   * Show typing indicator
   */
  showTypingIndicator() {
    const typingEl = document.createElement('div');
    typingEl.className = 'enterprise-chatbot__typing';
    typingEl.id = 'enterprise-chatbot-typing';
    typingEl.setAttribute('aria-label', 'يكتب الآن...');
    typingEl.innerHTML = `
      <span class="enterprise-chatbot__typing-dot"></span>
      <span class="enterprise-chatbot__typing-dot"></span>
      <span class="enterprise-chatbot__typing-dot"></span>
    `;
    this.messagesContainer.appendChild(typingEl);
    this.scrollToBottom();
  }

  /**
   * Hide typing indicator
   */
  hideTypingIndicator() {
    const typingEl = document.getElementById('enterprise-chatbot-typing');
    if (typingEl) typingEl.remove();
  }

  /**
   * Show error message
   */
  showError(message) {
    const errorEl = document.createElement('div');
    errorEl.className = 'enterprise-chatbot__error';
    errorEl.innerHTML = `
      <span>${this.escapeHtml(message)}</span>
      <a href="${this.config.whatsappLink}" target="_blank" rel="noopener" class="enterprise-chatbot__error-link">
        تواصل معنا عبر واتساب
      </a>
    `;
    this.messagesContainer.appendChild(errorEl);
    this.scrollToBottom();
  }

  /**
   * Set loading state
   */
  setLoading(loading) {
    this.isLoading = loading;
    this.sendButton.disabled = loading;
    this.inputField.disabled = loading;
    
    if (loading) {
      this.showTypingIndicator();
    } else {
      this.hideTypingIndicator();
    }
  }

  /**
   * Scroll to bottom of messages
   */
  scrollToBottom() {
    requestAnimationFrame(() => {
      this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    });
  }

  /**
   * Format timestamp
   */
  formatTime(date) {
    return date.toLocaleTimeString('ar-SA', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Generate unique ID
   */
  generateId() {
    return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Escape HTML
   */
  escapeHtml(text) {
    if (window.BrightAIUtils?.escapeHtml) {
      return window.BrightAIUtils.escapeHtml(text);
    }
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Clear conversation
   */
  clearHistory() {
    this.conversationHistory = [];
    this.messagesContainer.innerHTML = '';
    this.addMessage(this.config.welcomeMessage, 'bot');
    this.sessionId = null;
  }

  /**
   * Destroy widget
   */
  destroy() {
    if (this.widget?.parentNode) {
      this.widget.parentNode.removeChild(this.widget);
    }
    this.widget = null;
    this.conversationHistory = [];
  }
}

/**
 * Lazy load enterprise chatbot
 */
function initEnterpriseChatbot() {
  let chatbot = null;
  let initialized = false;

  const initialize = () => {
    if (initialized) return;
    initialized = true;
    
    chatbot = new BrightAIEnterpriseChatbot();
    chatbot.init();
    
    document.removeEventListener('scroll', lazyLoadHandler);
    document.removeEventListener('mousemove', lazyLoadHandler);
    document.removeEventListener('touchstart', lazyLoadHandler);
  };

  const lazyLoadHandler = () => {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(initialize);
    } else {
      setTimeout(initialize, 100);
    }
  };

  document.addEventListener('scroll', lazyLoadHandler, { once: true, passive: true });
  document.addEventListener('mousemove', lazyLoadHandler, { once: true, passive: true });
  document.addEventListener('touchstart', lazyLoadHandler, { once: true, passive: true });
  setTimeout(initialize, 3000);
}

// Auto-initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initEnterpriseChatbot);
} else {
  initEnterpriseChatbot();
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { BrightAIEnterpriseChatbot, initEnterpriseChatbot };
}

window.BrightAIEnterpriseChatbot = BrightAIEnterpriseChatbot;
