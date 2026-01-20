/**
 * Bright AI - Chatbot Logic (Groq API Integration)
 * Replaces Gemini with Groq (Mixtral-8x7b)
 */

const CHAT_CONFIG = {
    // In a real build, use process.env or similar. 
    // For this static demo, we'll look for a global or use a placeholder.
    // Replace 'YOUR_API_KEY' with your actual Groq API key (starts with gsk_)
    apiKey: 'gsk_yours_here',
    apiEndpoint: 'https://api.groq.com/openai/v1/chat/completions',
    model: 'mixtral-8x7b-32768',
    maxHistory: 10
};

// State
let isChatOpen = false;
let messageHistory = [
    { role: "system", content: "You are a helpful AI assistant for Bright AI, a Saudi enterprise AI company. You speak Arabic and English. Be professional, concise, and helpful." }
];
let isTyping = false;
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 2000;

// DOM Elements
const chatWindow = document.getElementById('chat-window');
const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const chatForm = document.getElementById('chat-form');

/**
 * Toggle the chat window visibility
 */
window.toggleChat = function () {
    isChatOpen = !isChatOpen;
    if (chatWindow) {
        chatWindow.classList.toggle('open', isChatOpen);
        chatWindow.setAttribute('aria-hidden', !isChatOpen);

        if (isChatOpen && chatInput) {
            setTimeout(() => chatInput.focus(), 300);
        }
    }
};

/**
 * Handle form submission
 * @param {Event} e 
 */
window.handleChatSubmit = async function (e) {
    e.preventDefault();
    if (!chatInput || isTyping) return;

    const now = Date.now();
    if (now - lastRequestTime < MIN_REQUEST_INTERVAL) {
        console.warn('Rate limit: Please wait before sending another message.');
        return;
    }
    lastRequestTime = now;

    const text = chatInput.value.trim();
    if (!text) return;

    // 1. Add User Message
    addMessage(text, 'user');
    chatInput.value = '';

    // 2. Show Typing Indicator
    showTypingIndicator();

    // 3. Call API
    try {
        const responseText = await callGroqAPI(text);
        removeTypingIndicator();
        addMessage(responseText, 'bot');
    } catch (error) {
        removeTypingIndicator();
        console.error('Groq API Error:', error);
        addMessage('عذراً، حدث خطأ في الاتصال. يرجى المحاولة لاحقاً.', 'bot');
    }
};

/**
 * Add a message to the UI and history
 * @param {string} text 
 * @param {string} sender 'user' or 'bot'
 */
function addMessage(text, sender) {
    if (!chatMessages) return;

    // Append to history
    if (sender === 'user') {
        messageHistory.push({ role: "user", content: text });
    } else {
        messageHistory.push({ role: "assistant", content: text });
    }

    // Prune history
    if (messageHistory.length > CHAT_CONFIG.maxHistory + 1) {
        // Keep system prompt [0], remove oldest pairs
        // logic: keep [0], take last N
        const system = messageHistory[ 0 ];
        const recent = messageHistory.slice(-CHAT_CONFIG.maxHistory);
        messageHistory = [ system, ...recent ];
    }

    // Create UI Element
    const msgDiv = document.createElement('div');
    msgDiv.className = 'flex items-start gap-3 fade-in-up';

    if (sender === 'bot') {
        msgDiv.innerHTML = `
      <div class="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-300 shrink-0 border border-indigo-500/30">
        <iconify-icon icon="lucide:bot" width="16"></iconify-icon>
      </div>
      <div class="bg-white/5 p-3 rounded-2xl rounded-tr-none text-slate-200 border border-white/5 text-right">
        ${escapeHtml(text)}
      </div>
    `;
    } else {
        msgDiv.innerHTML = `
      <div class="bg-indigo-600 p-3 rounded-2xl rounded-tl-none text-white mr-auto ml-0 border border-indigo-500">
        ${escapeHtml(text)}
      </div>
      <div class="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 shrink-0 border border-slate-600">
        <iconify-icon icon="lucide:user" width="16"></iconify-icon>
      </div>
    `;
        msgDiv.classList.add('flex-row-reverse'); // Flip for user
    }

    chatMessages.appendChild(msgDiv);
    scrollToBottom();
}

/**
 * Show typing dots
 */
function showTypingIndicator() {
    isTyping = true;
    const typingDiv = document.createElement('div');
    typingDiv.id = 'typing-indicator';
    typingDiv.className = 'flex items-start gap-3 fade-in-up';
    typingDiv.innerHTML = `
    <div class="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-300 shrink-0 border border-indigo-500/30">
      <iconify-icon icon="lucide:bot" width="16"></iconify-icon>
    </div>
    <div class="bg-white/5 p-4 rounded-2xl rounded-tr-none border border-white/5 flex gap-1 items-center h-10">
      <div class="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style="animation-delay: 0s"></div>
      <div class="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
      <div class="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
    </div>
  `;
    chatMessages.appendChild(typingDiv);
    scrollToBottom();
}

function removeTypingIndicator() {
    isTyping = false;
    const el = document.getElementById('typing-indicator');
    if (el) el.remove();
}

/**
 * Call Groq API
 * @param {string} userMessage 
 */
async function callGroqAPI(userMessage) {
    if (CHAT_CONFIG.apiKey === 'gsk_yours_here') {
        console.warn('Please set your Groq API Key in js/groq-chat.js');
        return "عذراً، لم يتم إعداد مفتاح API. يرجى مراجعة إعدادات النظام.";
    }

    const response = await fetch(CHAT_CONFIG.apiEndpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${CHAT_CONFIG.apiKey}`
        },
        body: JSON.stringify({
            model: CHAT_CONFIG.model,
            messages: messageHistory,
            temperature: 0.7,
            max_tokens: 1024
        })
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error?.message || 'API request failed');
    }

    const data = await response.json();
    return data.choices[ 0 ]?.message?.content || "عذراً، لم أتمكن من فهم ذلك.";
}

// Helpers
function scrollToBottom() {
    if (chatMessages) {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML.replace(/\n/g, '<br>');
}

// Styles for fade-in
const style = document.createElement('style');
style.textContent = `
  .fade-in-up {
    animation: fadeInUp 0.3s ease-out forwards;
  }
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;
document.head.appendChild(style);
