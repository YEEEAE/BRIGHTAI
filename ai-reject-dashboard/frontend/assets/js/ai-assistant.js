/**
 * Documentation:
 * - docs/03-ai/saqr-ai-overview.md
 * - docs/03-ai/session-memory.md
 * - docs/04-api/ai-api.md
 */
/* ===== AI ASSISTANT GLOBAL WIDGET (Self-Injecting) ===== */

(function () {
  // Prevent duplicate initialization
  if (window.__AiAssistantInitialized) return;
  window.__AiAssistantInitialized = true;

  // Configuration constants
  const AI_NAME = 'صقر AI';
  const API_CHAT = '/api/ai/chat';
  const API_CHAT_CLOSE = '/api/ai/chat/close';
  const STORAGE_KEY = 'ai_chat_history_session'; // sessionStorage — cleared on tab close
  const SOUND_TOGGLE_KEY = 'ai_chat_sound_enabled';

  // State Management
  const state = {
    isOpen: false,
    isRecording: false,
    isSoundEnabled: localStorage.getItem(SOUND_TOGGLE_KEY) === 'true', // Sound pref stays across sessions
    history: [],
    conversationId: sessionStorage.getItem('ai_conversation_id') || (function() {
      const newId = 'conv_' + Math.random().toString(36).substring(2, 11);
      sessionStorage.setItem('ai_conversation_id', newId);
      return newId;
    })(),
    userRole: 'Quality Auditor (Auditor)',
    currentPage: getPageName(),
    recognition: null,
    speechSynth: window.speechSynthesis,
    activeUtterance: null
  };

  // Get Page Name helper
  function getPageName() {
    const path = window.location.pathname;
    const file = path.substring(path.lastIndexOf('/') + 1);
    return file || 'index.html';
  }

  // Smart suggestions by page
  const suggestionsByPage = {
    'index.html': [
      { text: 'كم تكلفة المرفوضات الإجمالية؟', textEn: 'What is the total reject cost?' },
      { text: 'أعطني أعلى 5 أسباب رفض متكررة', textEn: 'Give me the top 5 reject reasons' },
      { text: 'ما توقعات المرفوضات للشهر القادم؟', textEn: 'What are the reject forecasts for next month?' }
    ],
    'executive.html': [
      { text: 'أعطني تقريراً تنفيذياً للأسبوع', textEn: 'Give me an executive weekly brief' },
      { text: 'حلل أداء الأقسام من حيث التكلفة والجودة', textEn: 'Compare departments performance' },
      { text: 'ما هي أعلى المخاطر المالية النشطة؟', textEn: 'What are the highest active financial risks?' }
    ],
    'finance.html': [
      { text: 'ما هو متوسط تكلفة المرفوضة الواحدة؟', textEn: 'What is the average cost per reject?' },
      { text: 'أعطني تحليل الحيود المالي للموازنة', textEn: 'Give me a budget variance analysis' },
      { text: 'ما هو العائد الاستثماري لمشاريع CAPA؟', textEn: 'What is the ROI on CAPA projects?' }
    ],
    'quality.html': [
      { text: 'ما هي حالة إجراءات CAPA المفتوحة؟', textEn: 'What is the status of open CAPAs?' },
      { text: 'اقترح خطة CAPA متكاملة لمشكلة Resin A', textEn: 'Suggest a CAPA plan for Resin A' },
      { text: 'ما هي متطلبات الامتثال لـ ISO 13485؟', textEn: 'What are the ISO 13485 compliance rules?' }
    ],
    'production.html': [
      { text: 'ما كفاءة المعدات الإجمالية OEE هذا الأسبوع؟', textEn: 'What is the OEE effectiveness this week?' },
      { text: 'أعطني معدل التلف في الماكينة 4', textEn: 'Give me the reject rate for machine 4' },
      { text: 'قارن أداء الوردية الصباحية بالوردية المسائية', textEn: 'Compare morning and evening shifts' }
    ]
  };

  // Dynamic initialization on DOM load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {
    loadCSS();
    injectHTML();
    initSpeechRecognition();
    loadHistory();
    setupEventListeners();
    renderSmartSuggestions();
    
    // Welcome message if history is empty
    if (state.history.length === 0) {
      addAssistantMessage(
        document.documentElement.lang === 'en'
          ? 'مرحباً! أنا صقر AI، مساعدك الذكي لتحليلات ميس من BrightAI. كيف يمكنني مساعدتك اليوم؟'
          : 'مرحباً! أنا صقر AI، مساعدك الذكي لتحليلات ميس من BrightAI. كيف يمكنني مساعدتك اليوم؟'
      );
    } else {
      state.history.forEach(msg => appendMessageToDOM(msg.sender, msg.text, msg.charts, msg.actions, false));
    }
  }

  // Load CSS dynamically
  function loadCSS() {
    if (!document.getElementById('ai-assistant-styles')) {
      const link = document.createElement('link');
      link.id = 'ai-assistant-styles';
      link.rel = 'stylesheet';
      link.href = '../assets/css/ai-assistant.css';
      document.head.appendChild(link);
    }
  }

  // Inject Chat Widget HTML elements to DOM
  function injectHTML() {
    const isEn = document.documentElement.lang === 'en';
    
    // Create FAB
    const fab = document.createElement('div');
    fab.className = 'ai-fab';
    fab.id = 'ai-fab';
    fab.setAttribute('title', isEn ? 'صقر AI Quality Assistant' : 'صقر AI - المساعد الذكي للجودة');
    fab.innerHTML = `
      <svg class="ai-falcon-icon" viewBox="0 0 64 64" aria-hidden="true">
        <path d="M55.8 8.4c-8.7 1.4-17.2 4.9-25.4 10.4L20 25.8 7.3 24.1c-1.1-.1-1.7 1.2-.9 2l8.9 8.2-6.2 11.8c-.5 1 .5 2.1 1.5 1.7l13.7-5.3 9.8 9.7c.8.8 2.1.1 1.9-1l-1.8-12.1 5.2-4.5c4.6-4 8.2-8.7 10.7-14.1l6.8-10.4c.6-.9-.1-1.9-1.1-1.7ZM29.2 33.6l-7.8 3 3.5-6.7 8.8-6c5.1-3.5 10.3-6.1 15.6-7.8-2 3.1-4.5 6.3-7.5 9.5l-12.6 8Z"/>
        <path d="M42.4 20.1c-2.4.9-4.9 2.1-7.3 3.6l8.2.5c2-2.2 3.7-4.3 5.2-6.4-1.9.6-4 1.4-6.1 2.3Z"/>
      </svg>
    `;
    document.body.appendChild(fab);

    // Create Chat Window
    const win = document.createElement('div');
    win.className = 'ai-chat-window';
    win.id = 'ai-chat-window';
    win.innerHTML = `
      <div class="ai-chat-header" id="ai-chat-header">
        <div class="ai-header-info">
          <div class="ai-header-icon">
            <svg class="ai-falcon-icon" viewBox="0 0 64 64" aria-hidden="true"><path d="M55.8 8.4c-8.7 1.4-17.2 4.9-25.4 10.4L20 25.8 7.3 24.1c-1.1-.1-1.7 1.2-.9 2l8.9 8.2-6.2 11.8c-.5 1 .5 2.1 1.5 1.7l13.7-5.3 9.8 9.7c.8.8 2.1.1 1.9-1l-1.8-12.1 5.2-4.5c4.6-4 8.2-8.7 10.7-14.1l6.8-10.4c.6-.9-.1-1.9-1.1-1.7ZM29.2 33.6l-7.8 3 3.5-6.7 8.8-6c5.1-3.5 10.3-6.1 15.6-7.8-2 3.1-4.5 6.3-7.5 9.5l-12.6 8Z"/><path d="M42.4 20.1c-2.4.9-4.9 2.1-7.3 3.6l8.2.5c2-2.2 3.7-4.3 5.2-6.4-1.9.6-4 1.4-6.1 2.3Z"/></svg>
          </div>
          <div class="ai-header-titles">
            <h4>🦅 صقر AI</h4>
            <span>${isEn ? 'MAIS Stock/Life Risk Hub' : 'مركز تحليل المخزون والعمر الافتراضي'}</span>
          </div>
        </div>
        <div class="ai-header-controls">
          <button class="ai-control-btn ${state.isSoundEnabled ? 'ai-voice-active' : ''}" id="ai-toggle-sound" title="${isEn ? 'Toggle Text-to-Speech' : 'تشغيل/إيقاف القراءة الصوتية'}">
            <svg viewBox="0 0 24 24" width="16" height="16"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" fill="currentColor"/></svg>
          </button>
          <button class="ai-control-btn" id="ai-export-chat" title="${isEn ? 'Export Conversation' : 'تصدير المحادثة'}">
            <svg viewBox="0 0 24 24" width="16" height="16"><path d="M19 12v7H5v-7H3v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2zm-6 .67l2.59-2.58L17 11.5l-5 5-5-5 1.41-1.41L11 12.67V3h2v9.67z" fill="currentColor"/></svg>
          </button>
          <button class="ai-control-btn" id="ai-clear-chat" title="${isEn ? 'Clear Chat' : 'مسح المحادثة'}">
            <svg viewBox="0 0 24 24" width="16" height="16"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="currentColor"/></svg>
          </button>
          <button class="ai-control-btn" id="ai-minimize-chat" title="${isEn ? 'Minimize' : 'تصغير'}">
            <svg viewBox="0 0 24 24" width="16" height="16"><path d="M19 13H5v-2h14v2z" fill="currentColor"/></svg>
          </button>
        </div>
      </div>
      
      <div class="ai-chat-body" id="ai-chat-body"></div>

      <div class="ai-suggestions-box">
        <div class="ai-suggestions-title">${isEn ? 'Try asking...' : 'توصية الأسئلة السريعة:'}</div>
        <div class="ai-suggestions-list" id="ai-suggestions-list"></div>
      </div>

      <div class="ai-chat-input-area">
        <div class="ai-input-wrapper">
          <textarea class="ai-chat-input" id="ai-chat-input" placeholder="${isEn ? 'Type a message or quality query...' : 'اكتب سؤالك حول المرفوضات أو الجودة...'}" rows="1"></textarea>
          <button class="ai-input-icon-btn" id="ai-mic-btn" title="${isEn ? 'Voice Input' : 'إدخال صوتي'}">
            <svg viewBox="0 0 24 24"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/></svg>
          </button>
        </div>
        <button class="ai-send-btn" id="ai-send-btn">
          <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
        </button>
      </div>
    `;
    document.body.appendChild(win);
  }

  // Setup Event Listeners
  function setupEventListeners() {
    const fab = document.getElementById('ai-fab');
    const win = document.getElementById('ai-chat-window');
    const input = document.getElementById('ai-chat-input');
    const sendBtn = document.getElementById('ai-send-btn');
    const micBtn = document.getElementById('ai-mic-btn');
    const clearBtn = document.getElementById('ai-clear-chat');
    const exportBtn = document.getElementById('ai-export-chat');
    const soundBtn = document.getElementById('ai-toggle-sound');
    const minimizeBtn = document.getElementById('ai-minimize-chat');
    const header = document.getElementById('ai-chat-header');

    // Toggle Chat visibility
    fab.addEventListener('click', toggleChat);
    minimizeBtn.addEventListener('click', toggleChat);
    window.addEventListener('pagehide', closeConversation);

    // Send messages
    sendBtn.addEventListener('click', handleSendMessage);
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
    });

    // Mic recording
    micBtn.addEventListener('click', toggleVoiceInput);

    // Clear history
    clearBtn.addEventListener('click', clearHistory);

    // Export conversation
    exportBtn.addEventListener('click', exportConversation);

    // Toggle Speech synthesis
    soundBtn.addEventListener('click', toggleVoiceOutput);

    // Resizing text input dynamically
    input.addEventListener('input', function () {
      this.style.height = 'auto';
      this.style.height = (this.scrollHeight - 16) + 'px';
    });

    // Make header draggable (grab-to-move)
    makeDraggable(header, win);
  }

  function toggleChat() {
    state.isOpen = !state.isOpen;
    const win = document.getElementById('ai-chat-window');
    const fab = document.getElementById('ai-fab');
    
    if (state.isOpen) {
      win.classList.add('active');
      fab.classList.add('active');
      document.getElementById('ai-chat-input').focus();
      scrollChatToBottom();
    } else {
      win.classList.remove('active');
      fab.classList.remove('active');
      if (state.speechSynth) {
        state.speechSynth.cancel();
      }
      closeConversation();
    }
  }

  function closeConversation() {
    if (!state.conversationId) return;

    const payload = JSON.stringify({ conversation_id: state.conversationId });
    if (navigator.sendBeacon) {
      navigator.sendBeacon(API_CHAT_CLOSE, new Blob([payload], { type: 'application/json' }));
      return;
    }

    fetch(API_CHAT_CLOSE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      credentials: 'include',
      keepalive: true
    }).catch(function () {});
  }

  // Dynamic drag-to-move implementation
  function makeDraggable(header, element) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    header.onmousedown = dragMouseDown;

    function dragMouseDown(e) {
      e = e || window.event;
      // Do not drag if clicking control buttons
      if (e.target.closest('.ai-header-controls')) return;
      e.preventDefault();
      pos3 = e.clientX;
      pos4 = e.clientY;
      document.onmouseup = closeDragElement;
      document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
      e = e || window.event;
      e.preventDefault();
      pos1 = pos3 - e.clientX;
      pos2 = pos4 - e.clientY;
      pos3 = e.clientX;
      pos4 = e.clientY;
      element.style.bottom = 'auto';
      element.style.insetInlineEnd = 'auto';
      element.style.top = (element.offsetTop - pos2) + "px";
      element.style.left = (element.offsetLeft - pos1) + "px";
    }

    function closeDragElement() {
      document.onmouseup = null;
      document.onmousemove = null;
    }
  }

  // Render Smart Suggestions dynamically
  function renderSmartSuggestions() {
    const list = document.getElementById('ai-suggestions-list');
    list.innerHTML = '';
    const isEn = document.documentElement.lang === 'en';
    
    const pageSuggestions = suggestionsByPage[state.currentPage] || suggestionsByPage['index.html'];
    
    pageSuggestions.forEach(s => {
      const chip = document.createElement('div');
      chip.className = 'ai-suggestion-chip';
      chip.textContent = isEn ? s.textEn : s.text;
      chip.addEventListener('click', () => {
        document.getElementById('ai-chat-input').value = isEn ? s.textEn : s.text;
        handleSendMessage();
      });
      list.appendChild(chip);
    });
  }

  // Handle messages sending process
  async function handleSendMessage() {
    const input = document.getElementById('ai-chat-input');
    const message = input.value.trim();
    if (!message) return;

    // Reset input text height
    input.value = '';
    input.style.height = '20px';

    // Append user message
    appendMessageToDOM('user', message);
    saveMessage('user', message);

    // Show typing indicator
    const typing = showTypingIndicator();
    document.getElementById('ai-fab')?.classList.add('analyzing');
    scrollChatToBottom();

    // Context preparation
    const filters = {};
    if (window.Alpine) {
      // Safe Alpine.js search context read if available
      try {
        const root = document.querySelector('[x-data]');
        if (root && root.__x) {
          const data = root.__x.getUnobservedData();
          if (data && data.filters) Object.assign(filters, data.filters);
        }
      } catch (err) {}
    }

    try {
      const response = await fetch(API_CHAT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: message,
          conversation_id: state.conversationId,
          recent_messages: state.history.slice(-15).map(h => ({
            sender: h.sender,
            text: h.text
          })),
          context: {
            page: state.currentPage,
            filters: filters,
            user_role: state.userRole
          }
        }),
        credentials: 'include'
      });

      typing.remove();

      if (!response.ok) throw new Error('API server unavailable');
      const data = await response.json();
      const payload = data.data || data;

      appendMessageToDOM('assistant', payload.reply, payload.charts, payload.actions);
      saveMessage('assistant', payload.reply, payload.charts, payload.actions);

      // Trigger TTS if active
      if (state.isSoundEnabled) {
        speakResponse(payload.reply);
      }

    } catch (err) {
      typing.remove();
      const errorMsg = document.documentElement.lang === 'en'
        ? 'Apologies, I am experiencing server connectivity issues right now. Running in local fallback mode.'
        : 'نعتذر منك، أواجه مشكلة في الاتصال بالخادم الآن. تم تشغيل وضع الاستجابة الاحتياطي المحلي.';
      
      appendMessageToDOM('assistant', errorMsg);
      saveMessage('assistant', errorMsg);
    } finally {
      document.getElementById('ai-fab')?.classList.remove('analyzing');
      scrollChatToBottom();
    }
  }

  // Render & Append Bubble to DOM
  function appendMessageToDOM(sender, text, charts, actions, animate = true) {
    const body = document.getElementById('ai-chat-body');
    const isEn = document.documentElement.lang === 'en';

    const wrapper = document.createElement('div');
    wrapper.style.display = 'flex';
    wrapper.style.flexDirection = 'column';
    wrapper.style.alignItems = sender === 'user' ? 'flex-end' : 'flex-start';
    wrapper.style.gap = '6px';

    const bubble = document.createElement('div');
    bubble.className = `ai-msg-bubble ai-msg-${sender}`;
    bubble.innerHTML = parseMarkdown(text);

    // Feedback actions for assistant
    if (sender === 'assistant') {
      const feedback = document.createElement('div');
      feedback.className = 'ai-msg-feedback';
      feedback.innerHTML = `
        <button class="ai-feedback-btn" title="${isEn ? 'Copy' : 'نسخ'}">
          <svg viewBox="0 0 24 24"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0-2-.9-2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
        </button>
        <button class="ai-feedback-btn" title="${isEn ? 'Good answer' : 'إجابة مفيدة'}">
          <svg viewBox="0 0 24 24"><path d="M1 21h4V9H1v12zm22-10c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"/></svg>
        </button>
        <button class="ai-feedback-btn" title="${isEn ? 'Bad answer' : 'إجابة غير مفيدة'}">
          <svg viewBox="0 0 24 24"><path d="M23 3h-4v12h4V3zm-22 10c0 1.1.9 2 2 2h6.31l-.95 4.57-.03.32c0 .41.17.79.44 1.06L9.83 23l6.59-6.59c.36-.36.58-.86.58-1.41V5c0-1.1-.9-2-2-2H6c-.83 0-1.54.5-1.84 1.22L1.14 10.27C1.05 10.5 1 10.74 1 11v2z"/></svg>
        </button>
      `;
      
      // Copy to clipboard listener
      feedback.querySelector('.ai-feedback-btn').addEventListener('click', () => {
        navigator.clipboard.writeText(text);
        const icon = feedback.querySelector('svg');
        feedback.querySelector('.ai-feedback-btn').style.color = 'var(--ai-secondary)';
        setTimeout(() => {
          feedback.querySelector('.ai-feedback-btn').style.color = '';
        }, 1500);
      });

      bubble.appendChild(feedback);
    }

    wrapper.appendChild(bubble);

    // Embed Renders dynamic charts
    if (charts && charts.length > 0) {
      charts.forEach((chartData, idx) => {
        const chartId = `ai-chart-${state.conversationId}-${Date.now()}-${idx}`;
        const container = document.createElement('div');
        container.className = 'ai-embedded-chart';
        container.innerHTML = `
          <div style="font-weight: 700; font-size: 12px; margin-bottom: 8px; color: var(--ai-text);">${chartData.title}</div>
          <div id="${chartId}" style="min-height: 180px;"></div>
        `;
        wrapper.appendChild(container);
        
        // Render ApexChart safely after injection
        setTimeout(() => {
          renderApexChart(chartId, chartData);
        }, 100);
      });
    }

    // Embed Quick Actions Buttons
    if (actions && actions.length > 0) {
      const actionGroup = document.createElement('div');
      actionGroup.className = 'ai-action-group';
      
      actions.forEach(act => {
        const btn = document.createElement('button');
        btn.className = 'ai-action-btn';
        btn.innerHTML = `
          <svg width="12" height="12" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm0-4h-2V7h2v8z"/></svg>
          <span>${act.label}</span>
        `;
        btn.addEventListener('click', () => {
          handleExecuteAction(act);
        });
        actionGroup.appendChild(btn);
      });
      wrapper.appendChild(actionGroup);
    }

    body.appendChild(wrapper);
    if (animate) scrollChatToBottom();
  }

  // Handle Quick Action executions
  function handleExecuteAction(action) {
    const isEn = document.documentElement.lang === 'en';
    
    if (action.command === 'create_capa' || action.command === 'initiate_capa') {
      // Toggle to quality.html or fill CAPA form dynamically
      if (window.location.pathname.indexOf('quality.html') === -1) {
        window.location.href = 'quality.html?action=new_capa&reason=' + encodeURIComponent(action.payload?.reason || '');
      } else {
        // Safe dispatch if QMS dashboard listens
        const event = new CustomEvent('ai_trigger_capa', { detail: action.payload });
        window.dispatchEvent(event);
        appendMessageToDOM('assistant', isEn ? 'Triggered QMS CAPA entry form.' : 'تم فتح نموذج تسجيل CAPA في نظام إدارة الجودة.');
      }
    } else if (action.command === 'export_financial_report') {
      window.print();
    } else {
      appendMessageToDOM('assistant', isEn ? `Executing command: ${action.label}` : `جاري تنفيذ الإجراء: ${action.label}`);
    }
  }

  // Beautiful render ApexCharts inside chat bubbles
  function renderApexChart(id, chartData) {
    if (!window.ApexCharts) return;
    
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark' || document.body.classList.contains('dark-mode');
    
    const options = {
      chart: {
        type: chartData.type || 'bar',
        height: 180,
        sparkline: { enabled: false },
        toolbar: { show: false },
        background: 'transparent'
      },
      theme: {
        mode: isDark ? 'dark' : 'light'
      },
      colors: ['#0F4C81', '#00A6A6', '#F4A261', '#2A9D8F'],
      series: chartData.series,
      xaxis: {
        categories: chartData.categories || [],
        labels: { style: { fontSize: '9px' } }
      },
      yaxis: {
        labels: { style: { fontSize: '9px' } }
      },
      stroke: {
        width: chartData.type === 'line' ? 2 : 0,
        curve: 'smooth'
      },
      dataLabels: { enabled: false },
      legend: { show: false }
    };

    const chart = new ApexCharts(document.getElementById(id), options);
    chart.render();
  }

  // Show Typing Bubble
  function showTypingIndicator() {
    const body = document.getElementById('ai-chat-body');
    const indicator = document.createElement('div');
    let thinkingStep = 0;
    const thinkingStates = ['hm', 'hmm', 'hmmm', 'hmmmm'];

    indicator.className = 'ai-typing-indicator';
    indicator.id = 'ai-typing';
    indicator.innerHTML = `
      <span class="ai-typing-label">${thinkingStates[thinkingStep]}</span>
      <span class="ai-typing-dots" aria-hidden="true"><span></span><span></span><span></span></span>
    `;
    body.appendChild(indicator);

    const label = indicator.querySelector('.ai-typing-label');
    const thinkingTimer = window.setInterval(() => {
      thinkingStep = (thinkingStep + 1) % thinkingStates.length;
      label.textContent = thinkingStates[thinkingStep];
    }, 2000);

    const removeIndicator = indicator.remove.bind(indicator);
    indicator.remove = () => {
      window.clearInterval(thinkingTimer);
      removeIndicator();
    };

    return indicator;
  }

  // Safe scroll to bottom
  function scrollChatToBottom() {
    const body = document.getElementById('ai-chat-body');
    body.scrollTop = body.scrollHeight;
  }

  // Text-To-Speech (Voice Output) speaking responder
  function speakResponse(text) {
    if (!state.speechSynth) return;
    state.speechSynth.cancel(); // Stop active speaker

    // Strip Markdown code / styles for natural speech
    const cleanText = text
      .replace(/[*#`_\-]/g, '')
      .replace(/\[.*?\]\(.*?\)/g, '')
      .substring(0, 300); // Speak first 300 chars to avoid speech backlog

    const isAr = /[\u0600-\u06FF]/.test(text);
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = isAr ? 'ar-SA' : 'en-US';
    utterance.rate = 1.05;
    
    // Choose Saudi vocal if available
    const voices = state.speechSynth.getVoices();
    const voice = voices.find(v => v.lang.includes(isAr ? 'ar' : 'en'));
    if (voice) utterance.voice = voice;

    state.activeUtterance = utterance;
    state.speechSynth.speak(utterance);
  }

  // Toggle voice output setting
  function toggleVoiceOutput() {
    state.isSoundEnabled = !state.isSoundEnabled;
    localStorage.setItem(SOUND_TOGGLE_KEY, state.isSoundEnabled);
    
    const btn = document.getElementById('ai-toggle-sound');
    if (state.isSoundEnabled) {
      btn.classList.add('ai-voice-active');
      speakResponse(document.documentElement.lang === 'en' ? 'Voice response enabled' : 'تم تفعيل التحدث الصوتي للمساعد');
    } else {
      btn.classList.remove('ai-voice-active');
      if (state.speechSynth) state.speechSynth.cancel();
    }
  }

  // Initialize Speech-to-Text Recognition
  function initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recog = new SpeechRecognition();
    recog.continuous = false;
    recog.interimResults = false;
    recog.lang = document.documentElement.lang === 'en' ? 'en-US' : 'ar-SA';

    recog.onstart = () => {
      state.isRecording = true;
      document.getElementById('ai-mic-btn').classList.add('recording');
    };

    recog.onend = () => {
      state.isRecording = false;
      document.getElementById('ai-mic-btn').classList.remove('recording');
    };

    recog.onresult = (e) => {
      const resultText = e.results[0][0].transcript;
      const input = document.getElementById('ai-chat-input');
      input.value = (input.value + ' ' + resultText).trim();
      input.dispatchEvent(new Event('input')); // Recalculate height
    };

    state.recognition = recog;
  }

  // Toggle voice recording
  function toggleVoiceInput() {
    if (!state.recognition) {
      alert(document.documentElement.lang === 'en' ? 'Speech recognition is not supported in your browser.' : 'ميزة تمييز الكلام بالصوت غير مدعومة في متصفحك الحالي.');
      return;
    }

    if (state.isRecording) {
      state.recognition.stop();
    } else {
      state.recognition.start();
    }
  }

  // History Management
  function loadHistory() {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) state.history = JSON.parse(stored);
    } catch (err) {
      state.history = [];
    }
  }

  function saveMessage(sender, text, charts, actions) {
    state.history.push({ sender, text, charts, actions });
    if (state.history.length > 50) state.history.shift();
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state.history));
    } catch (err) {}
  }

  async function clearHistory() {
    const isEn = document.documentElement.lang === 'en';
    if (confirm(isEn ? 'Are you sure you want to clear chat history?' : 'هل أنت متأكد من مسح سجل المحادثة بالكامل؟')) {
      state.history = [];
      sessionStorage.removeItem(STORAGE_KEY);
      document.getElementById('ai-chat-body').innerHTML = '';
      if (state.speechSynth) state.speechSynth.cancel();

      // Clear backend memory
      try {
        await fetch(API_CHAT_CLOSE, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ conversation_id: state.conversationId }),
          credentials: 'include'
        });
      } catch (err) {
        console.warn('Failed to clear backend memory:', err);
      }

      init();
    }
  }

  // Export full chat history as beautiful styled HTML file
  function exportConversation() {
    const isEn = document.documentElement.lang === 'en';
    const title = isEn ? 'AI Auditor Conversation History' : 'سجل محادثة المساعد الذكي للجودة';
    
    let htmlContent = `
      <!DOCTYPE html>
      <html dir="${isEn ? 'ltr' : 'rtl'}" lang="${isEn ? 'en' : 'ar'}">
      <head>
        <meta charset="UTF-8">
        <title>${title}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; background: #F8FAFC; color: #1E293B; }
          .header { text-align: center; border-bottom: 2px solid #E2E8F0; padding-bottom: 20px; margin-bottom: 30px; }
          .header h1 { color: #0F4C81; margin: 0; }
          .header p { color: #64748B; margin: 5px 0 0; }
          .chat-list { display: flex; flex-direction: column; gap: 20px; max-width: 800px; margin: 0 auto; }
          .bubble { padding: 16px 20px; border-radius: 12px; line-height: 1.6; max-width: 90%; }
          .user { background: #0F4C81; color: white; align-self: flex-end; border-bottom-right-radius: 2px; }
          .assistant { background: #FFFFFF; border: 1px solid #E2E8F0; color: #1E293B; align-self: flex-start; border-bottom-left-radius: 2px; }
          table { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 13px; }
          th, td { padding: 10px 14px; text-align: start; border-bottom: 1px solid #E2E8F0; }
          th { background: #F1F5F9; font-weight: 700; color: #0F4C81; }
          .footer { text-align: center; font-size: 11px; color: #94A3B8; margin-top: 50px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${title}</h1>
          <p>Middle East Medical Adhesive Industry (MAIS) - Generated on ${new Date().toLocaleString()}</p>
        </div>
        <div class="chat-list">
    `;

    state.history.forEach(msg => {
      const senderClass = msg.sender === 'user' ? 'user' : 'assistant';
      htmlContent += `
        <div class="bubble ${senderClass}">
          <strong>${msg.sender === 'user' ? (isEn ? 'User' : 'المستخدم') : (isEn ? 'AI Quality Hub' : 'مساعد العمليات الذكي')}</strong>
          <div>${parseMarkdown(msg.text)}</div>
        </div>
      `;
    });

    htmlContent += `
        </div>
        <div class="footer">
          تنبيه سرية وأمان: البيانات الواردة في هذا التقرير هي بيانات استشارية وتخضع لإشراف ومراجعة إدارة تأكيد الجودة (QAM) لمصنع MAIS الطبي.
        </div>
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `MAIS-AI-Chat-${new Date().toISOString().split('T')[0]}.html`;
    link.click();
  }

  // Light, capability-packed Custom Markdown parser (Supports tables, lists, headers, bold, code)
  function parseMarkdown(md) {
    if (!md) return '';
    let html = String(md)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Header conversions
    html = html.replace(/^### (.*?)$/gm, '<h5 style="font-weight:700;margin:10px 0 6px;color:var(--ai-primary);">$1</h5>');
    html = html.replace(/^## (.*?)$/gm, '<h4 style="font-weight:700;margin:12px 0 8px;color:var(--ai-primary);">$1</h4>');
    html = html.replace(/^# (.*?)$/gm, '<h3 style="font-weight:800;margin:16px 0 10px;color:var(--ai-primary);">$1</h3>');

    // Bold tags
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong style="font-weight:700;">$1</strong>');

    // Code blocks styling
    html = html.replace(/```(.*?)\n([\s\S]*?)```/g, '<pre style="background:rgba(0,0,0,0.05);padding:10px;border-radius:6px;overflow-x:auto;font-family:monospace;font-size:11.5px;margin:8px 0;"><code>$2</code></pre>');

    // Inline code tags
    html = html.replace(/`(.*?)`/g, '<code style="background:rgba(0,0,0,0.04);padding:2px 4px;border-radius:4px;font-family:monospace;font-size:12px;color:var(--ai-secondary);">$1</code>');

    // Bullet lists parsing
    html = html.replace(/^\- (.*?)$/gm, '<li style="margin-inline-start:12px;list-style:disc;">$1</li>');
    html = html.replace(/^\* (.*?)$/gm, '<li style="margin-inline-start:12px;list-style:circle;">$1</li>');

    // Markdown Table parsing
    const lines = html.split('\n');
    let inTable = false;
    let tableHtml = '';
    const outputLines = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line.startsWith('|') && line.endsWith('|')) {
        const cells = line.split('|').map(c => c.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
        
        // Skip separator line (e.g. |---|---|)
        if (line.includes('---')) continue;

        if (!inTable) {
          inTable = true;
          tableHtml = '<table><thead><tr>';
          cells.forEach(c => { tableHtml += `<th>${c}</th>`; });
          tableHtml += '</tr></thead><tbody>';
        } else {
          tableHtml += '<tr>';
          cells.forEach(c => { tableHtml += `<td>${c}</td>`; });
          tableHtml += '</tr>';
        }
      } else {
        if (inTable) {
          inTable = false;
          tableHtml += '</tbody></table>';
          outputLines.push(tableHtml);
        }
        outputLines.push(line);
      }
    }

    if (inTable) {
      tableHtml += '</tbody></table>';
      outputLines.push(tableHtml);
    }

    return outputLines.join('<br>').replace(/(<br>){2,}/g, '<br>');
  }
})();
