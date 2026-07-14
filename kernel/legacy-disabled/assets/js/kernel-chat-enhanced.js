/**
 * BrightAI Kernel - Chat Enhanced Features
 * Markdown rendering, SSE streaming, sessions, file upload, voice input,
 * thinking process, message actions, smart quick examples
 */
(function () {
  'use strict';

  /* ═══════════════════════════════════════════════════════════════
     MARKDOWN RENDERING
     ═══════════════════════════════════════════════════════════════ */
  function initMarkdown() {
    if (typeof marked === 'undefined') return;
    marked.setOptions({
      breaks: true,
      gfm: true,
      highlight: function (code, lang) {
        if (typeof hljs !== 'undefined' && lang && hljs.getLanguage(lang)) {
          try { return hljs.highlight(code, { language: lang }).value; } catch (e) { /* skip */ }
        }
        if (typeof hljs !== 'undefined') {
          try { return hljs.highlightAuto(code).value; } catch (e) { /* skip */ }
        }
        return code;
      },
    });
    const renderer = new marked.Renderer();
    renderer.code = function (code, lang) {
      var language = lang || '';
      var highlighted = code;
      if (typeof hljs !== 'undefined' && language && hljs.getLanguage(language)) {
        try { highlighted = hljs.highlight(code, { language: language }).value; } catch (e) { /* skip */ }
      }
      var label = language ? language : 'code';
      return '<div class="code-header"><span>' + escapeHtml(label) + '</span><button class="code-copy-btn" data-kernel-click="kernelChatEnhanced.copyCode" data-kernel-arg-0="__element__">نسخ</button></div><pre><code class="hljs' + (language ? ' language-' + language : '') + '">' + highlighted + '</code></pre>';
    };
    marked.setOptions({ renderer: renderer });
  }

  function renderMarkdown(text) {
    if (!text) return '';
    if (typeof marked === 'undefined') return escapeHtml(text);
    try { return sanitizeHtml(marked.parse(text)); } catch (e) { return escapeHtml(text); }
  }

  function escapeHtml(str) {
    if (typeof KernelUtils !== 'undefined' && KernelUtils.escapeHtml) return KernelUtils.escapeHtml(str);
    return String(str || '').replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[c]; });
  }

  function sanitizeHtml(html) {
    var source = String(html || '');
    if (typeof DOMPurify !== 'undefined' && DOMPurify.sanitize) return DOMPurify.sanitize(source);
    if (typeof KernelUtils !== 'undefined' && KernelUtils.sanitizeHtml) return KernelUtils.sanitizeHtml(source);
    return escapeHtml(source);
  }

  /* ═══════════════════════════════════════════════════════════════
     SSE STREAMING
     ═══════════════════════════════════════════════════════════════ */
  function streamText(contentEl, text, onComplete) {
    if (typeof KernelUtils !== 'undefined' && KernelUtils.prefersReducedMotion && KernelUtils.prefersReducedMotion()) {
      contentEl.innerHTML = renderMarkdown(text);
      if (onComplete) onComplete();
      return;
    }
    var words = text.split(/(\s+)/);
    var idx = 0;
    var accumulated = '';
    var cursor = document.createElement('span');
    cursor.className = 'stream-cursor';
    contentEl.innerHTML = '';
    contentEl.appendChild(cursor);

    function tick() {
      if (idx < words.length) {
        accumulated += words[idx++];
        cursor.remove();
        contentEl.innerHTML = renderMarkdown(accumulated);
        contentEl.appendChild(cursor);
        var msgs = document.getElementById('messages');
        if (msgs) msgs.scrollTop = msgs.scrollHeight;
        var delay = words[idx - 1].trim() ? 25 : 5;
        setTimeout(tick, delay);
      } else {
        cursor.remove();
        contentEl.innerHTML = renderMarkdown(accumulated);
        if (onComplete) onComplete();
      }
    }
    tick();
  }

  /* ═══════════════════════════════════════════════════════════════
     THINKING PROCESS
     ═══════════════════════════════════════════════════════════════ */
  function showThinkingProcess(container, data, insertBefore) {
    var steps = [
      { label: 'فحص البيانات الحساسة (PII Scan)', icon: '<path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>' },
      { label: 'تقييم المخاطر (Risk Assessment)', icon: '<path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>' },
      { label: 'فحص السياسات (Policy Check)', icon: '<path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>' },
      { label: 'توليد الرد (Response)', icon: '<path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>' },
    ];

    var el = document.createElement('div');
    el.className = 'thinking-process';
    el.innerHTML = sanitizeHtml('<div class="thinking-steps" id="thinking-steps">' +
      steps.map(function (s, i) {
        return '<div class="thinking-step" data-step="' + i + '">' +
          '<span class="thinking-step-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' + s.icon + '</svg></span>' +
          '<span class="thinking-step-label">' + s.label + '</span>' +
          '<span class="thinking-step-time"></span>' +
          '</div>';
      }).join('') +
      '</div>');

    if (insertBefore) {
      container.insertBefore(el, insertBefore);
    } else {
      container.appendChild(el);
    }

    // Animate steps sequentially
    var stepEls = el.querySelectorAll('.thinking-step');
    var durations = [600, 500, 400, 300];
    var total = 0;

    stepEls.forEach(function (stepEl, i) {
      setTimeout(function () {
        stepEl.classList.add('active');
        stepEl.querySelector('.thinking-step-time').textContent = durations[i] + 'ms';
      }, total);
      total += durations[i];
      setTimeout(function () {
        stepEl.classList.remove('active');
        stepEl.classList.add('done');
      }, total);
    });

    return el;
  }

  /* ═══════════════════════════════════════════════════════════════
     MESSAGE ACTIONS (Copy, Regenerate, Share)
     ═══════════════════════════════════════════════════════════════ */
  function createMessageActions(msgId, text, data) {
    var traceId = data && (data.traceId || data.trace_id || data.kernel && data.kernel.traceId);
    var actionsHtml = '<div class="msg-actions">' +
      '<button class="msg-action-btn" data-kernel-click="kernelChatEnhanced.copyMessage" data-kernel-arg-0="' + escapeHtml(msgId) + '" data-kernel-arg-1="__element__" title="نسخ">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>' +
      'نسخ</button>' +
      '<button class="msg-action-btn" data-kernel-click="kernelChatEnhanced.regenerate" data-kernel-arg-0="' + escapeHtml(msgId) + '" title="إعادة توليد">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>' +
      'إعادة</button>';

    if (traceId) {
      actionsHtml += '<a class="msg-action-btn" href="/kernel/evidence/?trace_id=' + encodeURIComponent(traceId) + '" title="فتح الأدلة">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>' +
        'أدلة</a>';
    }
    actionsHtml += '</div>';
    return actionsHtml;
  }

  /* ═══════════════════════════════════════════════════════════════
     SMART QUICK EXAMPLES
     ═══════════════════════════════════════════════════════════════ */
  var examplesByPack = {
    general: [
      'كيف أحسّن كفاءة العمليات في مؤسستي باستخدام الذكاء الاصطناعي؟',
      'اكتب خطة تنفيذية لمشروع تحويل رقمي لمدة 6 أشهر',
      'لخّص أفضل الممارسات في إدارة المشاريع التقنية',
      'ما هي فوائد ومخاطر استخدام AI في القطاع الحكومي؟',
    ],
    PDPL: [
      'ما هي متطلبات نظام حماية البيانات الشخصية للشركات في السعودية؟',
      'اكتب سياسة خصوصية تتوافق مع نظام PDPL',
      'كيف أنشئ سجل لمعالجة البيانات الشخصية؟',
      'ما هي حقوق صاحب البيانات حسب نظام PDPL؟',
    ],
    NCA_ECC: [
      'ما هي متطلبات ضوابط الأمن السيبراني NCA ECC 2-2024؟',
      'اكتب خطة استجابة للحوادث الأمنية السيبرانية',
      'كيف أقيّم جاهزية المؤسسة لمتطلبات NCA ECC؟',
      'ما هي أفضل الممارسات لحماية البنية التحتية الحيوية؟',
    ],
    SFDA: [
      'ما هي متطلبات SFDA لحوكمة الذكاء الاصطناعي في الأجهزة الطبية؟',
      'اكتب تقرير CAPA لحدث عدم مطابقة في منتج طبي',
      'كيف أعد وثيقة تحليل المخاطر حسب ISO 14971؟',
      'ما هي متطلبات التتبع للمنتجات الطبية حسب SFDA؟',
    ],
    healthcare: [
      'كيف أحمي بيانات المرضى مع السماح بالتحليل الطبي؟',
      'اكتب سياسة حماية السجلات الطبية الإلكترونية',
      'ما هي متطلبات مشاركة البيانات الصحية للأبحاث؟',
      'كيف أنفذ تقييم تأثير الخصوصية على نظام صحي جديد؟',
    ],
    procurement: [
      'ما هي شروط عقد المورد بقيمة 500,000 ريال؟',
      'اكتب مواصفات فنية لمناقصة نظام إدارة موارد بشرية',
      'كيف أقيّم عروض الموردين تقنياً ومالياً؟',
      'ما هي ضوابط الشراء الإلكتروني حسب نظام المشتريات الحكومي؟',
    ],
  };

  function renderQuickExamples(pack) {
    var container = document.getElementById('quick-examples');
    if (!container) return;
    var key = (pack || 'general').toLowerCase();
    if (key === 'nca_ecc') key = 'NCA_ECC';
    var examples = examplesByPack[key] || examplesByPack.general;
    container.innerHTML = sanitizeHtml(examples.map(function (text) {
      return '<button class="quick-example" data-kernel-click="useExample" data-kernel-arg-0="__element__">' + escapeHtml(text) + '</button>';
    }).join(''));
  }

  /* ═══════════════════════════════════════════════════════════════
     CHAT SESSIONS
     ═══════════════════════════════════════════════════════════════ */
  var SESSIONS_KEY = 'kernel_chat_sessions';
  var ACTIVE_SESSION_KEY = 'kernel_active_session';

  function getSessions() {
    try { return JSON.parse(localStorage.getItem(SESSIONS_KEY) || '[]'); } catch (e) { return []; }
  }

  function saveSessions(sessions) {
    try { localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions)); } catch (e) { /* skip */ }
  }

  function getActiveSessionId() {
    return localStorage.getItem(ACTIVE_SESSION_KEY) || 'default';
  }

  function setActiveSessionId(id) {
    localStorage.setItem(ACTIVE_SESSION_KEY, id);
  }

  function createSession(title) {
    var sessions = getSessions();
    var id = 's_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    sessions.unshift({ id: id, title: title || 'محادثة جديدة', created: Date.now() });
    if (sessions.length > 20) sessions = sessions.slice(0, 20);
    saveSessions(sessions);
    return id;
  }

  function deleteSession(id) {
    var sessions = getSessions().filter(function (s) { return s.id !== id; });
    saveSessions(sessions);
    // Remove messages for this session
    try { localStorage.removeItem('chatMessages_' + id); } catch (e) { /* skip */ }
  }

  function updateSessionTitle(id, title) {
    var sessions = getSessions();
    var session = sessions.find(function (s) { return s.id === id; });
    if (session) { session.title = title.substring(0, 50); saveSessions(sessions); }
  }

  function renderSessions() {
    var list = document.getElementById('session-list');
    if (!list) return;
    var sessions = getSessions();
    var activeId = getActiveSessionId();
    list.innerHTML = sanitizeHtml(sessions.map(function (s) {
      var isActive = s.id === activeId;
      return '<div class="session-item' + (isActive ? ' active' : '') + '" data-kernel-click="kernelChatEnhanced.switchSession" data-kernel-arg-0="' + escapeHtml(s.id) + '">' +
        '<span class="session-item-text">' + escapeHtml(s.title) + '</span>' +
        '<button class="session-item-del" data-kernel-stop="true" data-kernel-click="kernelChatEnhanced.deleteAndRemoveSession" data-kernel-arg-0="' + escapeHtml(s.id) + '" aria-label="حذف">' +
        '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button>' +
        '</div>';
    }).join(''));
    var titleEl = document.getElementById('active-session-title');
    if (titleEl) {
      var active = sessions.find(function (s) { return s.id === activeId; });
      titleEl.textContent = active ? active.title : 'محادثة جديدة';
    }
  }

  /* ═══════════════════════════════════════════════════════════════
     FILE UPLOAD
     ═══════════════════════════════════════════════════════════════ */
  var pendingFiles = [];

  function handleFileUpload(files) {
    if (!files || !files.length) return;
    var container = document.getElementById('file-attachments');
    for (var i = 0; i < files.length; i++) {
      var file = files[i];
      if (file.size > 5 * 1024 * 1024) {
        if (typeof showToast === 'function') showToast('خطأ', 'حجم الملف يتجاوز 5MB: ' + file.name, 'error');
        continue;
      }
      var fileId = 'f_' + Date.now() + '_' + i;
      pendingFiles.push({ id: fileId, name: file.name, size: file.size, file: file });
      var chip = document.createElement('div');
      chip.className = 'file-chip';
      chip.id = 'chip-' + fileId;
      chip.innerHTML = sanitizeHtml('<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/></svg>' +
        '<span>' + escapeHtml(file.name) + '</span>' +
        '<button class="file-chip-remove" data-kernel-click="kernelChatEnhanced.removeFile" data-kernel-arg-0="' + escapeHtml(fileId) + '">×</button>');
      container.appendChild(chip);
    }
    container.classList.add('has-files');
    // Reset file input
    var input = document.getElementById('file-input');
    if (input) input.value = '';
    // Scan for PII hints
    scanFilesForPII();
  }

  function scanFilesForPII() {
    pendingFiles.forEach(function (f) {
      var name = f.name.toLowerCase();
      var isSuspicious = /pass|secret|key|credential|token|id_card|identity|iqama/.test(name);
      var chip = document.getElementById('chip-' + f.id);
      if (chip) {
        chip.classList.toggle('pii-warning', isSuspicious);
      }
    });
  }

  function removeFile(fileId) {
    pendingFiles = pendingFiles.filter(function (f) { return f.id !== fileId; });
    var chip = document.getElementById('chip-' + fileId);
    if (chip) chip.remove();
    var container = document.getElementById('file-attachments');
    if (container && pendingFiles.length === 0) container.classList.remove('has-files');
  }

  function getFileContext() {
    if (!pendingFiles.length) return '';
    return '\n\n[ملفات مرفقة: ' + pendingFiles.map(function (f) { return f.name + ' (' + (f.size / 1024).toFixed(1) + 'KB)'; }).join(', ') + ']';
  }

  /* ═══════════════════════════════════════════════════════════════
     VOICE INPUT
     ═══════════════════════════════════════════════════════════════ */
  var recognition = null;
  var isRecording = false;

  function initVoiceInput() {
    var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return false;
    recognition = new SpeechRecognition();
    recognition.lang = 'ar-SA';
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = function (event) {
      var transcript = '';
      for (var i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      var input = document.getElementById('query-input') || document.getElementById('chat-input');
      if (input) input.value = transcript;
      if (typeof updateCharCounter === 'function') updateCharCounter(transcript);
      if (typeof resizeTextarea === 'function') resizeTextarea(input);
    };

    recognition.onend = function () {
      stopRecording();
    };

    recognition.onerror = function (event) {
      stopRecording();
      if (event.error !== 'aborted' && typeof showToast === 'function') {
        showToast('خطأ', 'تعذر التعرف على الصوت: ' + event.error, 'error');
      }
    };

    return true;
  }

  function toggleVoiceInput() {
    if (!recognition && !initVoiceInput()) {
      if (typeof showToast === 'function') showToast('غير متاح', 'المتصفح لا يدعم الإدخال الصوتي', 'error');
      return;
    }
    if (isRecording) {
      recognition.stop();
      stopRecording();
    } else {
      try {
        recognition.start();
        startRecording();
      } catch (e) {
        stopRecording();
      }
    }
  }

  function startRecording() {
    isRecording = true;
    var btn = document.getElementById('voice-btn');
    if (btn) btn.classList.add('recording');
    var indicator = document.getElementById('voice-indicator');
    if (indicator) indicator.classList.add('active');
  }

  function stopRecording() {
    isRecording = false;
    var btn = document.getElementById('voice-btn');
    if (btn) btn.classList.remove('recording');
    var indicator = document.getElementById('voice-indicator');
    if (indicator) indicator.classList.remove('active');
  }

  /* ═══════════════════════════════════════════════════════════════
     PUBLIC API
     ═══════════════════════════════════════════════════════════════ */
  window.kernelChatEnhanced = {
    // Markdown
    renderMarkdown: renderMarkdown,
    initMarkdown: initMarkdown,
    // Streaming
    streamText: streamText,
    // Thinking
    showThinkingProcess: showThinkingProcess,
    // Actions
    createMessageActions: createMessageActions,
    copyMessage: function (msgId, btn) {
      var el = document.getElementById('content-' + msgId);
      if (!el) return;
      var text = el.textContent || el.innerText;
      if (typeof KernelUtils !== 'undefined' && KernelUtils.copyToClipboard) {
        KernelUtils.copyToClipboard(text).then(function () {
          if (btn) { btn.classList.add('copied'); setTimeout(function () { btn.classList.remove('copied'); }, 2000); }
        });
      } else {
        navigator.clipboard.writeText(text).then(function () {
          if (btn) { btn.classList.add('copied'); setTimeout(function () { btn.classList.remove('copied'); }, 2000); }
        });
      }
    },
    copyCode: function (btn) {
      var pre = btn.closest('.code-header').nextElementSibling;
      if (pre) {
        var code = pre.textContent;
        navigator.clipboard.writeText(code).then(function () {
          btn.textContent = 'تم'; setTimeout(function () { btn.textContent = 'نسخ'; }, 1500);
        });
      }
    },
    regenerate: function (msgId) {
      // Find the user message before this AI message and re-send
      var allMsgs = document.querySelectorAll('.message');
      var targetIdx = -1;
      allMsgs.forEach(function (m, i) { if (m.id === 'msg-' + msgId || m.querySelector('#content-' + msgId)) targetIdx = i; });
      if (targetIdx > 0) {
        var prevUser = allMsgs[targetIdx - 1];
        var userBubble = prevUser.querySelector('.user-bubble');
        if (userBubble) {
          var input = document.getElementById('query-input') || document.getElementById('chat-input');
          if (input) { input.value = userBubble.textContent; }
          if (typeof sendMessage === 'function') sendMessage();
        }
      }
    },
    // Sessions
    getSessions: getSessions,
    getActiveSessionId: getActiveSessionId,
    createSession: createSession,
    deleteAndRemoveSession: function (id) {
      deleteSession(id);
      if (getActiveSessionId() === id) {
        var sessions = getSessions();
        var newId = sessions.length ? sessions[0].id : createSession('محادثة جديدة');
        setActiveSessionId(newId);
        if (typeof clearChat === 'function') clearChat();
      }
      renderSessions();
    },
    switchSession: function (id) {
      // Save current messages
      var currentId = getActiveSessionId();
      try {
        var msgs = localStorage.getItem('chatMessages');
        if (msgs) localStorage.setItem('chatMessages_' + currentId, msgs);
      } catch (e) { /* skip */ }
      setActiveSessionId(id);
      // Load session messages
      try {
        var saved = localStorage.getItem('chatMessages_' + id);
        if (saved) { localStorage.setItem('chatMessages', saved); }
        else { localStorage.removeItem('chatMessages'); }
      } catch (e) { /* skip */ }
      location.reload();
    },
    renderSessions: renderSessions,
    updateSessionTitle: updateSessionTitle,
    // Smart Examples
    renderQuickExamples: renderQuickExamples,
    // File Upload
    handleFileUpload: handleFileUpload,
    removeFile: removeFile,
    getFileContext: getFileContext,
    getPendingFiles: function () { return pendingFiles; },
    clearPendingFiles: function () {
      pendingFiles = [];
      var container = document.getElementById('file-attachments');
      if (container) { container.innerHTML = ''; container.classList.remove('has-files'); }
    },
    // Voice
    toggleVoiceInput: toggleVoiceInput,
    isVoiceAvailable: function () { return !!recognition || !!(window.SpeechRecognition || window.webkitSpeechRecognition); },
  };

  /* ═══════════════════════════════════════════════════════════════
     INIT
     ═══════════════════════════════════════════════════════════════ */
  function init() {
    initMarkdown();
    initVoiceInput();

    // Ensure at least one session exists
    var sessions = getSessions();
    if (!sessions.length) {
      var id = createSession('محادثة جديدة');
      setActiveSessionId(id);
    } else {
      var activeId = getActiveSessionId();
      var exists = sessions.some(function (s) { return s.id === activeId; });
      if (!exists) setActiveSessionId(sessions[0].id);
    }

    renderSessions();
    renderQuickExamples(typeof selectedCompliance !== 'undefined' ? selectedCompliance : 'general');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
