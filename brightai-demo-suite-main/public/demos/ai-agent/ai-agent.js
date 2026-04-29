/**
 * BrightAI — Demo: AI Agent للشركات
 * Handles interaction, API calls, and DOM updates.
 */

import {
  showToast,
  renderMarkdown,
  appendMessage,
  appendTypingIndicator,
  setButtonLoading,
  buildFAQ,
  buildExamplePrompts,
} from '/shared/demo-ui-kit.js';
import { sendDemoRequest, fetchDemoSchema } from '/shared/demo-api-client.js';
import { trackEvent, getDemoStats } from '/shared/demo-analytics.js';

const DEMO_ID = 'ai-agent';

// DOM refs
const form          = document.getElementById('chat-form');
const input         = document.getElementById('user-input');
const sendBtn       = document.getElementById('send-btn');
const feed          = document.getElementById('messages-feed');
const clearBtn      = document.getElementById('clear-btn');
const statQueries   = document.getElementById('stat-queries');
const examplesContainer = document.getElementById('examples-container');
const faqContainer  = document.getElementById('faq-container');

// -- Context helpers ------------------------------------------------------
function getContext() {
  return {
    companyName: document.getElementById('ctx-company')?.value?.trim() || '',
    industry:    document.getElementById('ctx-industry')?.value || '',
    teamSize:    document.getElementById('ctx-team')?.value?.trim() || '',
    objective:   document.getElementById('ctx-objective')?.value?.trim() || '',
  };
}

// -- Query counter --------------------------------------------------------
function updateQueryStat() {
  const stats = getDemoStats(DEMO_ID);
  if (statQueries) statQueries.textContent = stats.queries;
}

// -- Message submission ---------------------------------------------------
async function handleSubmit(e) {
  e.preventDefault();

  const text = input.value.trim();
  if (!text) {
    showToast('يرجى كتابة استفسارك أولاً.', 'warning');
    input.focus();
    return;
  }

  // Show user message
  appendMessage(feed, 'user', `<p>${escapeHtml(text)}</p>`);
  input.value = '';

  // Show typing indicator
  const indicator = appendTypingIndicator(feed);

  // Disable send button
  const restore = setButtonLoading(sendBtn);

  try {
    const { response } = await sendDemoRequest({
      demoId: DEMO_ID,
      userInput: text,
      context: getContext(),
      language: 'ar',
    });

    indicator.remove();
    appendMessage(feed, 'ai', renderMarkdown(response));

    trackEvent(DEMO_ID, 'query');
    updateQueryStat();
  } catch (err) {
    indicator.remove();
    const errorMsg = err.statusCode === 429
      ? 'لقد تجاوزت الحد الأقصى للطلبات. يرجى الانتظار دقيقة ثم المحاولة مجدداً.'
      : (err.message || 'حدث خطأ أثناء الاتصال بالخادم.');
    appendMessage(feed, 'ai', `<p style="color:var(--color-error)">${escapeHtml(errorMsg)}</p>`);
    showToast(errorMsg, 'error');
    trackEvent(DEMO_ID, 'error');
  } finally {
    restore();
    input.focus();
  }
}

// -- Clear conversation ---------------------------------------------------
function clearConversation() {
  // Remove all messages except the welcome message
  const all = feed.querySelectorAll('.message');
  all.forEach((el) => {
    if (el.id !== 'welcome-msg') el.remove();
  });
  showToast('تم مسح المحادثة.', 'info', 2000);
}

// -- HTML escaping --------------------------------------------------------
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// -- Initialize -----------------------------------------------------------
async function init() {
  updateQueryStat();
  form.addEventListener('submit', handleSubmit);
  clearBtn.addEventListener('click', clearConversation);

  // Handle Enter key (textarea fallback — input already submits on Enter)
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    }
  });

  try {
    const schema = await fetchDemoSchema(DEMO_ID);

    // Build example prompts
    if (schema.examplePrompts?.length) {
      buildExamplePrompts(examplesContainer, schema.examplePrompts, input);
    }

    // Build FAQ
    if (schema.faq?.length) {
      buildFAQ(faqContainer, schema.faq);
    }
  } catch {
    // Schema loading failure is non-fatal — demo still works
  }
}

init();
