/**
 * BrightAI — Demo: إدارة المستشفى الذكي
 */

import {
  showToast, renderMarkdown, appendMessage,
  appendTypingIndicator, setButtonLoading, buildFAQ, buildExamplePrompts,
} from '/shared/demo-ui-kit.js';
import { sendDemoRequest, fetchDemoSchema } from '/shared/demo-api-client.js';
import { trackEvent, getDemoStats } from '/shared/demo-analytics.js';

const DEMO_ID = 'smart-hospital-management';

const form              = document.getElementById('chat-form');
const input             = document.getElementById('user-input');
const sendBtn           = document.getElementById('send-btn');
const feed              = document.getElementById('messages-feed');
const clearBtn          = document.getElementById('clear-btn');
const statQueries       = document.getElementById('stat-queries');
const examplesContainer = document.getElementById('examples-container');
const faqContainer      = document.getElementById('faq-container');

function getContext() {
  return {
    hospitalName:    document.getElementById('ctx-hospital-name')?.value?.trim() || '',
    hospitalType:    document.getElementById('ctx-hospital-type')?.value || '',
    bedCount:        document.getElementById('ctx-beds')?.value?.trim() || '',
    accreditation:   document.getElementById('ctx-accreditation')?.value || '',
  };
}

function updateQueryStat() {
  const stats = getDemoStats(DEMO_ID);
  if (statQueries) statQueries.textContent = stats.queries;
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

async function handleSubmit(e) {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) { showToast('يرجى كتابة استفسارك الإداري أولاً.', 'warning'); input.focus(); return; }

  appendMessage(feed, 'user', `<p>${escapeHtml(text)}</p>`);
  input.value = '';
  const indicator = appendTypingIndicator(feed);
  const restore = setButtonLoading(sendBtn);

  try {
    const { response } = await sendDemoRequest({
      demoId: DEMO_ID, userInput: text, context: getContext(), language: 'ar',
    });
    indicator.remove();
    appendMessage(feed, 'ai', renderMarkdown(response));
    trackEvent(DEMO_ID, 'query');
    updateQueryStat();
  } catch (err) {
    indicator.remove();
    const msg = err.statusCode === 429
      ? 'تجاوزت الحد الأقصى للطلبات. انتظر دقيقة ثم حاول مجدداً.'
      : (err.message || 'حدث خطأ أثناء الاتصال بالخادم.');
    appendMessage(feed, 'ai', `<p style="color:var(--color-error)">${escapeHtml(msg)}</p>`);
    showToast(msg, 'error');
    trackEvent(DEMO_ID, 'error');
  } finally {
    restore();
    input.focus();
  }
}

function clearConversation() {
  feed.querySelectorAll('.message').forEach((el) => {
    if (el.id !== 'welcome-msg') el.remove();
  });
  showToast('تم مسح المحادثة.', 'info', 2000);
}

async function init() {
  updateQueryStat();
  form.addEventListener('submit', handleSubmit);
  clearBtn.addEventListener('click', clearConversation);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    }
  });
  try {
    const schema = await fetchDemoSchema(DEMO_ID);
    if (schema.examplePrompts?.length) buildExamplePrompts(examplesContainer, schema.examplePrompts, input);
    if (schema.faq?.length) buildFAQ(faqContainer, schema.faq);
  } catch { /* non-fatal */ }
}

init();
