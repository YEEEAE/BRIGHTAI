/**
 * Legacy chat widget compatibility layer.
 * Kept intentionally for old layouts that still use legacy IDs.
 *
 * Security posture:
 * - Never calls Gemini directly from browser
 * - Always routes requests through POST /api/gemini/chat
 */

document.addEventListener('DOMContentLoaded', () => {
  const chatToggle = document.getElementById('chatToggle');
  const chatWidget = document.getElementById('chatWidget');
  const chatOverlay = document.getElementById('chatOverlay');
  const chatMessages = document.getElementById('chatMessages');
  const userInput = document.getElementById('userInput');
  const sendButton = document.getElementById('sendButton');

  if (!chatToggle || !chatWidget || !chatMessages || !userInput || !sendButton) {
    return;
  }

  const API_URL = '/api/gemini/chat';
  let sessionId = null;
  let isOpen = false;
  let isSending = false;

  function getNowTime() {
    return new Date().toLocaleTimeString('ar-SA', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }

  function appendMessage(text, sender) {
    const wrapper = document.createElement('div');
    wrapper.className = `message-wrapper ${sender}`;

    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';
    bubble.textContent = text;

    const time = document.createElement('span');
    time.className = 'message-time';
    time.textContent = getNowTime();

    wrapper.appendChild(bubble);
    wrapper.appendChild(time);
    chatMessages.appendChild(wrapper);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function showTypingIndicator() {
    if (document.getElementById('legacyTypingIndicator')) return;

    const typing = document.createElement('div');
    typing.id = 'legacyTypingIndicator';
    typing.className = 'message-wrapper ai';
    typing.textContent = 'المساعد يكتب الآن...';
    chatMessages.appendChild(typing);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function hideTypingIndicator() {
    document.getElementById('legacyTypingIndicator')?.remove();
  }

  function setSendingState(sending) {
    isSending = sending;
    sendButton.disabled = sending;
    userInput.disabled = sending;
  }

  function toggleChat() {
    isOpen = !isOpen;
    chatWidget.classList.toggle('open', isOpen);
    chatToggle.classList.toggle('active', isOpen);
    if (chatOverlay) {
      chatOverlay.classList.toggle('show', isOpen && window.innerWidth <= 480);
    }

    if (isOpen) {
      setTimeout(() => userInput.focus(), 80);
    }
  }

  function closeChat() {
    isOpen = false;
    chatWidget.classList.remove('open');
    chatToggle.classList.remove('active');
    if (chatOverlay) {
      chatOverlay.classList.remove('show');
    }
  }

  function mapErrorMessage(error) {
    const status = Number(error?.status || error?.statusCode || 0);
    if (status === 429) return 'ضغط عالي حالياً. انتظر قليلًا ثم حاول مجددًا.';
    if (status === 408 || error?.name === 'AbortError') return 'انتهت مهلة الطلب. حاول مرة ثانية.';
    return 'تعذر الاتصال حالياً. تواصل معنا عبر واتساب: +966538229013';
  }

  async function sendMessage() {
    const message = userInput.value.trim();
    if (!message || isSending) return;

    appendMessage(message, 'user');
    userInput.value = '';
    setSendingState(true);
    showTypingIndicator();

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message,
          sessionId
        })
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        const requestError = new Error(payload?.error || `HTTP ${response.status}`);
        requestError.status = response.status;
        throw requestError;
      }

      if (payload?.sessionId) {
        sessionId = payload.sessionId;
      }

      const reply = String(payload?.reply || '').trim() || 'أهلًا بك، كيف أقدر أخدمك؟';
      appendMessage(reply, 'ai');
    } catch (error) {
      appendMessage(mapErrorMessage(error), 'ai');
    } finally {
      hideTypingIndicator();
      setSendingState(false);
      userInput.focus();
    }
  }

  chatToggle.addEventListener('click', toggleChat);
  chatOverlay?.addEventListener('click', closeChat);

  sendButton.addEventListener('click', sendMessage);
  userInput.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    sendMessage();
  });
});
