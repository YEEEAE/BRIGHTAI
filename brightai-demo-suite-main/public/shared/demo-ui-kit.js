/**
 * BrightAI Demo — UI Kit
 * Reusable DOM utilities: toast, markdown renderer, message factory, FAQ, loading state.
 */

// ── Toast ────────────────────────────────────────────────────────────────────

let _toastContainer = null;

function getToastContainer() {
  if (!_toastContainer) {
    _toastContainer = document.createElement('div');
    _toastContainer.className = 'toast-container';
    document.body.appendChild(_toastContainer);
  }
  return _toastContainer;
}

/**
 * Shows a brief toast notification.
 * @param {string} message
 * @param {'info'|'success'|'error'|'warning'} [type='info']
 * @param {number} [duration=3500]
 */
export function showToast(message, type = 'info', duration = 3500) {
  const container = getToastContainer();
  const toast = document.createElement('div');
  toast.className = `toast${type !== 'info' ? ` toast--${type}` : ''}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease';
    setTimeout(() => toast.remove(), 350);
  }, duration);
}

// ── Markdown → HTML ──────────────────────────────────────────────────────────

/**
 * Converts a minimal subset of Markdown to safe HTML.
 * Supports: **bold**, *italic*, ## headings, - lists, \n paragraphs, horizontal rules.
 * Does NOT use an external library to keep the bundle zero-dep.
 * @param {string} md
 * @returns {string} HTML string (NOT injected via innerHTML by default — wrap in .md-content)
 */
export function renderMarkdown(md) {
  if (!md) return '';

  const escaped = md
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const lines = escaped.split('\n');
  const result = [];
  let inList = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Horizontal rule
    if (/^(-{3,}|\*{3,})$/.test(line.trim())) {
      if (inList) { result.push('</ul>'); inList = false; }
      result.push('<hr>');
      continue;
    }

    // Headings
    const h3 = line.match(/^### (.+)/);
    const h2 = line.match(/^## (.+)/);
    const h1 = line.match(/^# (.+)/);
    if (h1 || h2 || h3) {
      if (inList) { result.push('</ul>'); inList = false; }
      const tag = h1 ? 'h1' : h2 ? 'h2' : 'h3';
      const content = (h1 || h2 || h3)[1];
      result.push(`<${tag}>${inlineFormat(content)}</${tag}>`);
      continue;
    }

    // Unordered list
    const li = line.match(/^[*\-+] (.+)/);
    if (li) {
      if (!inList) { result.push('<ul>'); inList = true; }
      result.push(`<li>${inlineFormat(li[1])}</li>`);
      continue;
    }

    // Numbered list
    const oli = line.match(/^\d+\. (.+)/);
    if (oli) {
      if (inList) { result.push('</ul>'); inList = false; }
      // Simple: treat as list item without wrapping <ol> for brevity
      result.push(`<li>${inlineFormat(oli[1])}</li>`);
      continue;
    }

    // Close list if needed
    if (inList && line.trim() === '') {
      result.push('</ul>');
      inList = false;
    }

    // Empty line = paragraph break
    if (line.trim() === '') {
      result.push('');
      continue;
    }

    // Regular paragraph line
    if (!inList) {
      result.push(`<p>${inlineFormat(line)}</p>`);
    }
  }

  if (inList) result.push('</ul>');

  return result.join('\n');
}

function inlineFormat(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>');
}

// ── Message Factory ──────────────────────────────────────────────────────────

/**
 * Creates and appends a message bubble to a feed element.
 * @param {HTMLElement} feed
 * @param {'ai'|'user'} role
 * @param {string} contentHtml - Rendered HTML content
 * @param {string} [avatarLabel] - Short label for the avatar
 */
export function appendMessage(feed, role, contentHtml, avatarLabel = null) {
  const el = document.createElement('div');
  el.className = `message message--${role}`;

  const avatar = document.createElement('div');
  avatar.className = 'message__avatar';
  avatar.textContent = avatarLabel || (role === 'ai' ? 'AI' : 'أنت');

  const bubble = document.createElement('div');
  bubble.className = 'message__bubble md-content';
  bubble.innerHTML = contentHtml;

  el.appendChild(avatar);
  el.appendChild(bubble);
  feed.appendChild(el);

  // Scroll to bottom
  requestAnimationFrame(() => {
    feed.scrollTop = feed.scrollHeight;
  });

  return el;
}

/**
 * Appends a typing indicator (three animated dots) to the feed.
 * Returns the element so it can be removed when the response arrives.
 * @param {HTMLElement} feed
 * @returns {HTMLElement}
 */
export function appendTypingIndicator(feed) {
  const el = document.createElement('div');
  el.className = 'message message--ai';
  el.innerHTML = `
    <div class="message__avatar">AI</div>
    <div class="message__bubble">
      <div class="typing-indicator">
        <span class="typing-indicator__dot"></span>
        <span class="typing-indicator__dot"></span>
        <span class="typing-indicator__dot"></span>
      </div>
    </div>
  `;
  feed.appendChild(el);
  feed.scrollTop = feed.scrollHeight;
  return el;
}

// ── Loading State ────────────────────────────────────────────────────────────

/**
 * Sets a button into loading state (shows spinner, disables it).
 * @param {HTMLButtonElement} btn
 * @param {string} [loadingText]
 * @returns {Function} restore — call to revert to original state
 */
export function setButtonLoading(btn, loadingText = 'جاري المعالجة...') {
  const originalHTML = btn.innerHTML;
  const originalDisabled = btn.disabled;
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner"></span>${loadingText}`;
  return function restore() {
    btn.disabled = originalDisabled;
    btn.innerHTML = originalHTML;
  };
}

// ── FAQ Builder ──────────────────────────────────────────────────────────────

/**
 * Renders a FAQ section into a container element from a schema.faq array.
 * @param {HTMLElement} container
 * @param {Array<{questionAr: string, answerAr: string}>} faqs
 */
export function buildFAQ(container, faqs) {
  if (!faqs?.length) return;

  const section = document.createElement('div');
  section.className = 'faq-section';
  section.innerHTML = `
    <div class="faq-section__header">
      <h2 class="faq-section__title">الأسئلة الشائعة</h2>
    </div>
  `;

  faqs.forEach((faq, idx) => {
    // Support both {questionAr, answerAr} and shorthand {q, a}
    const question = faq.questionAr || faq.q || '';
    const answer   = faq.answerAr   || faq.a || '';

    const item = document.createElement('div');
    item.className = 'faq-item';
    item.innerHTML = `
      <button class="faq-item__question" aria-expanded="false" aria-controls="faq-answer-${idx}">
        ${question}
        <svg class="faq-item__chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      <div class="faq-item__answer" id="faq-answer-${idx}" role="region">
        <p>${answer}</p>
      </div>
    `;

    const btn = item.querySelector('.faq-item__question');
    btn.addEventListener('click', () => {
      const isOpen = item.classList.contains('is-open');
      // Close all
      section.querySelectorAll('.faq-item.is-open').forEach((i) => {
        i.classList.remove('is-open');
        i.querySelector('.faq-item__question').setAttribute('aria-expanded', 'false');
      });
      // Toggle this
      if (!isOpen) {
        item.classList.add('is-open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });

    section.appendChild(item);
  });

  container.appendChild(section);
}

// ── Example Prompts ──────────────────────────────────────────────────────────

/**
 * Renders clickable example prompt chips.
 * @param {HTMLElement} container
 * @param {string[]} prompts
 * @param {HTMLTextAreaElement|HTMLInputElement} targetInput
 */
export function buildExamplePrompts(container, prompts, targetInput) {
  if (!prompts?.length) return;

  const wrap = document.createElement('div');
  wrap.className = 'example-prompts';

  prompts.forEach((text) => {
    const chip = document.createElement('button');
    chip.className = 'example-prompt-chip';
    chip.type = 'button';
    chip.textContent = text;
    chip.addEventListener('click', () => {
      targetInput.value = text;
      targetInput.focus();
    });
    wrap.appendChild(chip);
  });

  container.appendChild(wrap);
}
