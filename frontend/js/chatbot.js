/**
 * BrightAI Chatbot Widget
 * AI-powered chatbot using server gateway for Gemini API
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 12.3, 23.2, 25.11
 */

'use strict';

/**
 * BrightAI Chatbot Class
 * Manages the AI chatbot widget functionality
 */
class BrightAIChatbot {
  constructor(options = {}) {
    // Configuration
    this.config = {
      apiEndpoint: options.apiEndpoint || '/api/ai/chat',
      welcomeMessage: options.welcomeMessage || 'مرحباً! أنا مساعد BrightAI الذكي. كيف يمكنني مساعدتك اليوم؟',
      placeholder: options.placeholder || 'اكتب رسالتك هنا...',
      title: options.title || 'مساعد BrightAI',
      ...options
    };

    // State
    this.isOpen = false;
    this.isLoading = false;
    this.conversationHistory = [];
    this.sessionId = null;
    this.widget = null;
    this.messagesContainer = null;
    this.inputField = null;
    this.sendButton = null;
    this.lastFocusedElement = null;

    // Bind methods
    this.toggle = this.toggle.bind(this);
    this.sendMessage = this.sendMessage.bind(this);
    this.handleKeyPress = this.handleKeyPress.bind(this);
    this.handleFocusTrap = this.handleFocusTrap.bind(this);
  }

  /**
   * Initialize the chatbot widget
   */
  init() {
    // Create widget HTML
    this.createWidget();
    
    // Add event listeners
    this.attachEventListeners();
    
    // Add welcome message to history
    this.addMessage(this.config.welcomeMessage, 'bot');
    
    // Track initialization
    this.trackEvent('chatbot_initialized');
    
    console.log('[BrightAI Chatbot] Initialized successfully');
  }

  /**
   * Create the chatbot widget HTML structure
   */
  createWidget() {
    // Create main container
    this.widget = document.createElement('div');
    this.widget.className = 'chatbot-widget';
    this.widget.setAttribute('role', 'region');
    this.widget.setAttribute('aria-label', 'مساعد BrightAI الذكي');

    this.widget.innerHTML = `
      <!-- Toggle Button -->
      <button class="chatbot-toggle" 
              aria-label="فتح المحادثة مع مساعد BrightAI" 
              aria-expanded="false"
              aria-controls="chatbot-window"
              type="button">
        <svg class="chatbot-toggle-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
          <circle cx="12" cy="10" r="1.5"/>
          <circle cx="8" cy="10" r="1.5"/>
          <circle cx="16" cy="10" r="1.5"/>
        </svg>
      </button>

      <!-- Chat Window -->
      <div class="chatbot-window" 
           id="chatbot-window"
           role="dialog" 
           aria-labelledby="chatbot-title"
           aria-modal="true"
           aria-hidden="true">
        
        <!-- Header -->
        <header class="chatbot-header">
          <div class="chatbot-header-info">
            <div class="chatbot-avatar" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
              </svg>
            </div>
            <div class="chatbot-header-text">
              <h2 class="chatbot-title" id="chatbot-title">${this.escapeHtml(this.config.title)}</h2>
              <span class="chatbot-status">
                <span class="chatbot-status-dot" aria-hidden="true"></span>
                متصل الآن
              </span>
            </div>
          </div>
          <button class="chatbot-minimize" 
                  aria-label="إغلاق المحادثة"
                  type="button">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </header>

        <!-- Messages Area -->
        <div class="chatbot-messages" 
             role="log" 
             aria-live="polite" 
             aria-label="سجل المحادثة"
             tabindex="0">
          <!-- Messages will be inserted here -->
        </div>

        <!-- Input Area -->
        <footer class="chatbot-input-area">
          <label for="chatbot-input" class="sr-only">اكتب رسالتك</label>
          <input type="text" 
                 id="chatbot-input"
                 class="chatbot-input" 
                 placeholder="${this.escapeHtml(this.config.placeholder)}"
                 autocomplete="off"
                 aria-describedby="chatbot-input-hint">
          <span id="chatbot-input-hint" class="sr-only">اضغط Enter لإرسال الرسالة</span>
          <button class="chatbot-send" 
                  aria-label="إرسال الرسالة"
                  type="button">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
          </button>
        </footer>
      </div>
    `;

    // Append to body
    document.body.appendChild(this.widget);

    // Cache DOM references
    this.toggleButton = this.widget.querySelector('.chatbot-toggle');
    this.chatWindow = this.widget.querySelector('.chatbot-window');
    this.messagesContainer = this.widget.querySelector('.chatbot-messages');
    this.inputField = this.widget.querySelector('.chatbot-input');
    this.sendButton = this.widget.querySelector('.chatbot-send');
    this.minimizeButton = this.widget.querySelector('.chatbot-minimize');
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Toggle button
    this.toggleButton.addEventListener('click', this.toggle);
    
    // Minimize button
    this.minimizeButton.addEventListener('click', this.toggle);
    
    // Send button
    this.sendButton.addEventListener('click', this.sendMessage);
    
    // Input field - Enter key (Requirement 4.8)
    this.inputField.addEventListener('keypress', this.handleKeyPress);
    
    // Focus trap for accessibility
    this.chatWindow.addEventListener('keydown', this.handleFocusTrap);
    
    // Close on Escape key
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
    
    // Update UI
    this.chatWindow.classList.toggle('open', this.isOpen);
    this.toggleButton.classList.toggle('active', this.isOpen);
    this.toggleButton.setAttribute('aria-expanded', String(this.isOpen));
    this.chatWindow.setAttribute('aria-hidden', String(!this.isOpen));
    
    // Update toggle button label
    this.toggleButton.setAttribute(
      'aria-label', 
      this.isOpen ? 'إغلاق المحادثة' : 'فتح المحادثة مع مساعد BrightAI'
    );
    
    if (this.isOpen) {
      // Store last focused element for returning focus later
      this.lastFocusedElement = document.activeElement;
      
      // Focus input field
      setTimeout(() => this.inputField.focus(), 100);
      
      // Track widget open
      this.trackEvent('chatbot_opened');
    } else {
      // Return focus to toggle button or last focused element
      if (this.lastFocusedElement) {
        this.lastFocusedElement.focus();
      } else {
        this.toggleButton.focus();
      }
      
      // Track widget close
      this.trackEvent('chatbot_closed');
    }
  }

  /**
   * Handle Enter key press to send message (Requirement 4.8)
   * @param {KeyboardEvent} e
   */
  handleKeyPress(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      this.sendMessage();
    }
  }

  /**
   * Handle focus trap within chatbot window
   * @param {KeyboardEvent} e
   */
  handleFocusTrap(e) {
    if (e.key !== 'Tab' || !this.isOpen) return;

    const focusableElements = this.chatWindow.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }
    } else {
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  }

  /**
   * Send message to AI (Requirement 4.1, 4.3, 4.4, 4.5, 23.2)
   */
  async sendMessage() {
    const message = this.inputField.value.trim();
    
    if (!message || this.isLoading) return;
    
    // Clear input
    this.inputField.value = '';
    
    // Add user message to UI and history
    this.addMessage(message, 'user');
    
    // Track message sent
    this.trackEvent('chatbot_message_sent', { message_length: message.length });
    
    // Show loading state (Requirement 4.4)
    this.setLoading(true);
    
    try {
      // Call server gateway (NOT direct Gemini API) - Requirement 23.2
      const response = await this.callAPI(message);
      
      // Add bot response
      this.addMessage(response.reply, 'bot');
      
      // Update session ID
      if (response.sessionId) {
        this.sessionId = response.sessionId;
      }
      
      // Track reply received
      this.trackEvent('chatbot_reply_received');
      
    } catch (error) {
      console.error('[BrightAI Chatbot] Error:', error);
      
      // Show error message in Arabic (Requirement 4.5)
      this.showError(error.message || 'عذراً، حدث خطأ. يرجى المحاولة مرة أخرى.');
      
      // Track error
      this.trackEvent('chatbot_error', { error: error.message });
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Call the server API endpoint
   * @param {string} message - User message
   * @returns {Promise<Object>} - API response
   */
  async callAPI(message) {
    const response = await fetch(this.config.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
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
   * Get conversation history formatted for API
   * @returns {Array}
   */
  getHistoryForAPI() {
    // Return last 10 messages for context
    return this.conversationHistory.slice(-10).map(msg => ({
      text: msg.text,
      sender: msg.sender
    }));
  }

  /**
   * Add message to conversation (Requirement 4.6)
   * @param {string} text - Message text
   * @param {string} sender - 'user' or 'bot'
   */
  addMessage(text, sender) {
    const timestamp = new Date();
    
    // Add to history (Requirement 4.6)
    this.conversationHistory.push({
      id: this.generateId(),
      text,
      sender,
      timestamp
    });

    // Create message element
    const messageEl = document.createElement('div');
    messageEl.className = `chatbot-message ${sender}`;
    messageEl.innerHTML = `
      <span class="chatbot-message-text">${this.escapeHtml(text)}</span>
      <span class="chatbot-message-time">${this.formatTime(timestamp)}</span>
    `;

    // Add to DOM
    this.messagesContainer.appendChild(messageEl);

    // Auto-scroll to latest message (Requirement 4.6)
    this.scrollToBottom();
  }

  /**
   * Show typing indicator (Requirement 4.4)
   */
  showTypingIndicator() {
    const typingEl = document.createElement('div');
    typingEl.className = 'chatbot-typing';
    typingEl.id = 'chatbot-typing';
    typingEl.setAttribute('aria-label', 'يكتب الآن...');
    typingEl.innerHTML = `
      <span class="chatbot-typing-dot"></span>
      <span class="chatbot-typing-dot"></span>
      <span class="chatbot-typing-dot"></span>
    `;
    this.messagesContainer.appendChild(typingEl);
    this.scrollToBottom();
  }

  /**
   * Hide typing indicator
   */
  hideTypingIndicator() {
    const typingEl = document.getElementById('chatbot-typing');
    if (typingEl) {
      typingEl.remove();
    }
  }

  /**
   * Show error message
   * @param {string} message - Error message in Arabic
   */
  showError(message) {
    const errorEl = document.createElement('div');
    errorEl.className = 'chatbot-error';
    errorEl.innerHTML = `
      <span>${this.escapeHtml(message)}</span>
      <button class="chatbot-error-retry" type="button">إعادة المحاولة</button>
    `;
    
    // Add retry handler
    errorEl.querySelector('.chatbot-error-retry').addEventListener('click', () => {
      errorEl.remove();
      // Retry last message if available
      const lastUserMessage = [...this.conversationHistory]
        .reverse()
        .find(m => m.sender === 'user');
      if (lastUserMessage) {
        this.inputField.value = lastUserMessage.text;
        // Remove the failed message from history
        this.conversationHistory = this.conversationHistory.filter(
          m => m.id !== lastUserMessage.id
        );
      }
    });
    
    this.messagesContainer.appendChild(errorEl);
    this.scrollToBottom();
  }

  /**
   * Set loading state
   * @param {boolean} loading
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
   * Scroll messages container to bottom
   */
  scrollToBottom() {
    requestAnimationFrame(() => {
      this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    });
  }

  /**
   * Format timestamp for display
   * @param {Date} date
   * @returns {string}
   */
  formatTime(date) {
    return date.toLocaleTimeString('ar-SA', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Generate unique ID
   * @returns {string}
   */
  generateId() {
    return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Escape HTML to prevent XSS
   * Uses centralized utility if available
   * @param {string} text
   * @returns {string}
   */
  escapeHtml(text) {
    // Use centralized utility if available
    if (window.BrightAIUtils?.escapeHtml) {
      return window.BrightAIUtils.escapeHtml(text);
    }
    // Fallback implementation
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Track analytics events (Requirement 12.3)
   * @param {string} eventName
   * @param {Object} eventData
   */
  trackEvent(eventName, eventData = {}) {
    if (typeof window.dataLayer !== 'undefined') {
      window.dataLayer.push({
        event: eventName,
        chatbot_session_id: this.sessionId,
        ...eventData
      });
    }
  }

  /**
   * Get conversation history
   * @returns {Array}
   */
  getHistory() {
    return [...this.conversationHistory];
  }

  /**
   * Clear conversation history
   */
  clearHistory() {
    this.conversationHistory = [];
    this.messagesContainer.innerHTML = '';
    this.addMessage(this.config.welcomeMessage, 'bot');
    this.sessionId = null;
  }

  /**
   * Destroy the chatbot widget
   */
  destroy() {
    if (this.widget && this.widget.parentNode) {
      this.widget.parentNode.removeChild(this.widget);
    }
    this.widget = null;
    this.conversationHistory = [];
  }
}

/**
 * Lazy load chatbot (Requirement 25.11)
 * Only initialize when user interacts or after delay
 */
function initChatbotLazy() {
  let chatbot = null;
  let initialized = false;

  const initialize = () => {
    if (initialized) return;
    initialized = true;
    
    chatbot = new BrightAIChatbot();
    chatbot.init();
    
    // Remove lazy load listeners
    document.removeEventListener('scroll', lazyLoadHandler);
    document.removeEventListener('mousemove', lazyLoadHandler);
    document.removeEventListener('touchstart', lazyLoadHandler);
  };

  const lazyLoadHandler = () => {
    // Use requestIdleCallback if available, otherwise setTimeout
    if ('requestIdleCallback' in window) {
      requestIdleCallback(initialize);
    } else {
      setTimeout(initialize, 100);
    }
  };

  // Initialize on user interaction
  document.addEventListener('scroll', lazyLoadHandler, { once: true, passive: true });
  document.addEventListener('mousemove', lazyLoadHandler, { once: true, passive: true });
  document.addEventListener('touchstart', lazyLoadHandler, { once: true, passive: true });

  // Fallback: Initialize after 3 seconds if no interaction
  setTimeout(initialize, 3000);
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initChatbotLazy);
} else {
  initChatbotLazy();
}

// Export for external use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { BrightAIChatbot, initChatbotLazy };
}

// Make available globally
window.BrightAIChatbot = BrightAIChatbot;
