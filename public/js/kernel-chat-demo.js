  // REPORTS-15 — Chat interactivity (demo mode).
  // Streams a fake AI response word-by-word after the user sends a message.
  // Toggles the typing indicator. Supports Enter (send) / Shift+Enter (newline).
  // BAI-P0-TRUTH-001: KernelDemoPill is now a fixed disclosure badge (not a
  // toggle), so kernel:demo-toggle was removed from the system; page data
  // layering is disclosed statically instead.
  (function () {
    'use strict';
    var FAKE_RESPONSES = [
      'تمام، قبل ما أنفذ الطلب لازم أمرره عبر طبقات الحوكمة:\n\n• PII scan: نجح\n• Risk scoring: 18/100 (منخفض)\n• Policy match: سياسة "توليد محتوى" — مسموح\n\nهذي إجابة تجريبية في وضع البيانات التوضيحية.',
      'وصلت. الطلب يحتاج مراجعة بشري بسبب ارتفاع درجة المخاطر (72%) — تم تجميده وتمريره إلى <a href="/kernel/approvals/">لوحة الموافقات</a>.',
      'تمام، تم توليد ملف دليل EVD-2026-10492.pdf وتوقيعه رقمياً. تقدر تفتحه من <a href="/kernel/evidence/">صفحة الأدلة</a>.',
      'الكشف كشف 145 سجل يحتوي PII — تم تطبيق الإخفاء قبل إرسال الطلب للنموذج. الـ PII لم يخرج من حدود المؤسسة.',
    ];

    function pickFakeResponse() {
      return FAKE_RESPONSES[Math.floor(Math.random() * FAKE_RESPONSES.length)];
    }

      function el(q, root) { return (root || document).querySelector(q); }
      function elAll(q, root) { return Array.prototype.slice.call((root || document).querySelectorAll(q)); }

      // KERNEL-ANALYTICS-2026-07-18 — funnel tracking (non-PII only).
      // All payloads carry slugs/flags, never message text or contact PII.
      // track() enforces consent gating + dedupe globally. ANALYTICS_EVENTS is
      // exposed on window.__BRIGHTAI_ANALYTICS__.events (this is an inline
      // script, so the module-scoped constant is not in scope).
      function kernelTrack(name, payload) {
        var rt = window.__BRIGHTAI_ANALYTICS__;
        if (rt && typeof rt.track === 'function') rt.track(name, payload || {});
      }
      function KEV() {
        var rt = window.__BRIGHTAI_ANALYTICS__;
        return (rt && rt.events) || {};
      }
      // Reads the active scenario slugs from the banner (server or JS-upgraded).
      function scenarioCtx() {
        var banner = el('[data-scenario-banner]');
        if (!banner) return {};
        return {
          scenario_id: banner.getAttribute('data-scenario-id') || undefined,
          sector: banner.getAttribute('data-sector') || undefined,
          risk_band: banner.getAttribute('data-risk-band') || undefined,
          journey_stage: banner.getAttribute('data-journey-stage') || undefined,
        };
      }

    function createMessage(role, text) {
      var article = document.createElement('article');
      article.className = 'kernel-chat-message kernel-chat-message--' + role;

      var avatar = document.createElement('span');
      avatar.className = 'kernel-chat-message__avatar';
      avatar.setAttribute('aria-hidden', 'true');
      avatar.textContent = role === 'user' ? 'ي' : 'AI';
      article.appendChild(avatar);

      var body = document.createElement('div');
      body.className = 'kernel-chat-message__body';
      article.appendChild(body);

      var bubble = document.createElement('div');
      bubble.className = 'kernel-chat-message__bubble';
      body.appendChild(bubble);

      var meta = document.createElement('span');
      meta.className = 'kernel-chat-message__meta';
      meta.textContent = 'الآن';
      body.appendChild(meta);

      // CHAT-STATE-001: every AI message carries a source badge slot so the
      // origin (live / demo / unavailable / blocked / cancelled) is always
      // visible adjacent to the response. User messages get no badge.
      var badge = null;
      if (role === 'ai') {
        badge = document.createElement('span');
        badge.className = 'kernel-source-badge';
        badge.setAttribute('data-source', 'pending');
        badge.setAttribute('hidden', '');
        badge.setAttribute('aria-label', 'مصدر الرد: قيد التحديد');
        body.appendChild(badge);
      }

      return { article: article, body: body, bubble: bubble, meta: meta, badge: badge, text: text };
    }

    /**
     * CHAT-STATE-001: attach / update the source badge on an AI message.
     * source: 'live' | 'demo' | 'unavailable' | 'blocked' | 'cancelled'.
     * provider: optional provider name shown in the live badge title.
     * Keeps badge hidden until a real source is set (not 'pending').
     */
    var SOURCE_LABELS = {
      live: 'مباشر',
      demo: 'تجريبي',
      unavailable: 'غير متاح',
      blocked: 'محظور بالسياسة',
      cancelled: 'مُلغى',
    };
    function attachSourceBadge(badge, source, provider) {
      if (!badge) return;
      badge.setAttribute('data-source', source);
      var label = SOURCE_LABELS[source] || source;
      var title = 'مصدر الرد: ' + label;
      if (source === 'live' && provider) title += ' (' + provider + ')';
      badge.setAttribute('title', title);
      badge.setAttribute('aria-label', title);
      badge.innerHTML =
        '<span class="kernel-source-badge__dot" aria-hidden="true"></span>' +
        '<span>' + label + '</span>';
      badge.removeAttribute('hidden');
    }

    function streamInto(bubble, html, onDone) {
      // Stream word-by-word; very lightweight simulator.
      var tokens = html.split(/(\s+|<[^>]+>)/).filter(Boolean);
      var idx = 0;
      bubble.textContent = '';
      var interval = setInterval(function () {
        if (idx >= tokens.length) {
          clearInterval(interval);
          if (typeof onDone === 'function') onDone();
          return;
        }
        bubble.insertAdjacentText('beforeend', tokens[idx]);
        idx++;
      }, 28);
    }

    function scrollThreadToEnd(thread) {
      if (!thread) return;
      thread.scrollTop = thread.scrollHeight;
    }

    function init() {
      var form = el('[data-kernel-chat-form]');
      var input = el('[data-kernel-chat-input]');
      var sendBtn = el('[data-kernel-chat-send]');
      var attachBtn = el('[data-kernel-chat-attach]');
      var messages = el('[data-kernel-chat-messages]');
      var announcer = el('[data-kernel-chat-announcer]');
      var thread = el('[data-kernel-chat-thread]');
      var typing = el('[data-kernel-typing]');
      var newBtn = el('[data-kernel-chat-new]');
      var banner = el('[data-kernel-policy-banner]');
      var errorSlot = el('[data-kernel-chat-error-slot]');
      var contactCta = el('[data-kernel-contact-cta]');

      if (!form || !input || !messages) return;

      // KERNEL-ANALYTICS-2026-07-18: kernel_started fires once per page view
      // (dedupe in analytics.js collapses rapid repeats). Non-PII: carries the
      // active scenario slugs when present, nothing else.
      kernelTrack(KEV().KERNEL_STARTED, scenarioCtx());

      // Avoid double-binding across view transitions
      if (form.dataset.bound === '1') return;
      form.dataset.bound = '1';

      // REPORTS-SEC-01 — track whether /api/ai/chat is reachable.
      // null = untested, true = reachable (try it), false = 404 (skip it).
      var apiAvailability = null;

      // KERNEL-AI-2026-07-14 — عدد رسائل المستخدم لتفعيل CTA بعد 3 رسائل
      var userMessageCount = 0;
      var ctaThreshold = 3;

      // KERNEL-AI-2026-07-14 — عرض أخطاء عربية موحدة
      function showChatError(type, retryAfterSec) {
        if (!errorSlot) return;
        var titles = {
          rate_limit: 'تم تجاوز حد الطلبات',
          provider_failed: 'المزود الذكي غير متاح مؤقتاً',
          network: 'تعذّر الاتصال',
          unavailable: 'المساعد في وضع تجريبي',
          timeout: 'انتهت مهلة الاستجابة',
          cancelled: 'تم إيقاف الرد',
          unknown: 'حدث خطأ غير متوقع',
        };
        var msgs = {
          rate_limit: retryAfterSec
            ? 'وصلنا للحد المسموح. حاول مرة ثانية بعد ' + retryAfterSec + ' ثانية.'
            : 'وصلنا للحد المسموح. حاول مرة ثانية بعد لحظات.',
          provider_failed: 'فشل الوصول إلى نموذج الذكاء الاصطناعي (المزود لم يرد). طلبك ما وصل للنموذج — تقدر تعيد المحاولة الآن.',
          network: 'تعذّر الاتصال بالخادم. تحقق من الإنترنت ثم أعد المحاولة. طلبك ما وصل للنموذج.',
          unavailable: 'هذه البيئة لا تشغّل نقطة الاتصال /api/ai/chat/. ستشاهد ردوداً توضيحية. للتفعيل الكامل تواصل مع فريق BrightAI.',
          timeout: 'النموذج أخذ وقتاً أطول من المتوقع. طلبك ما اكتمل — تقدر تعيد المحاولة.',
          cancelled: 'أوقفت الرد يدوياً. النص الجزئي (إن وُجد) ظاهر فوق. تقدر تعيد المحاولة بنفس الرسالة.',
          unknown: 'حدث خطأ غير متوقع. طلبك ما وصل للنموذج — تقدر تعيد المحاولة.',
        };
        var toneMap = {
          rate_limit: 'warning',
          provider_failed: 'danger',
          network: 'warning',
          unavailable: 'info',
          timeout: 'warning',
          cancelled: 'warning',
          unknown: 'danger',
        };
        // CHAT-STATE-001: which error types should offer a retry button.
        // Rate-limit is excluded (must wait); unavailable is excluded (a
        // demo reply follows). All others get retry.
        var retryable = {
          provider_failed: true,
          network: true,
          timeout: true,
          cancelled: true,
          unknown: true,
        };
        var tone = toneMap[type] || 'warning';
        var div = document.createElement('div');
        div.className = 'kernel-chat-policy-banner kernel-chat-policy-banner--' + tone;
        div.setAttribute('role', 'alert');
        div.setAttribute('aria-live', 'polite');
        // KERNEL-ANALYTICS-2026-07-18: message_blocked — the user's message
        // did not reach the model (blocked / rejected / errored). Non-PII:
        // carries only the error class + scenario slugs.
        kernelTrack(KEV().MESSAGE_BLOCKED, Object.assign(
          { error_type: type },
          scenarioCtx()
        ));
        div.innerHTML =
          '<span class="kernel-chat-policy-banner__icon" aria-hidden="true">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
              (type === 'unavailable'
                ? '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>'
                : '<path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>') +
            '</svg>' +
          '</span>' +
          '<div class="kernel-chat-policy-banner__body">' +
            '<p class="kernel-chat-policy-banner__title">' + titles[type] + '</p>' +
            '<p class="kernel-chat-policy-banner__msg">' + msgs[type] + '</p>' +
            (retryable[type]
              ? '<button type="button" class="kernel-chat-policy-banner__retry" data-kernel-retry aria-label="إعادة إرسال آخر رسالة">' +
                  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>' +
                  '<span>إعادة المحاولة</span>' +
                '</button>'
              : '') +
          '</div>';
        // replace existing error if any
        errorSlot.innerHTML = '';
        errorSlot.appendChild(div);
        // CHAT-STATE-001: wire the retry button to re-send the last message.
        var retryBtn = div.querySelector('[data-kernel-retry]');
        if (retryBtn) {
          retryBtn.addEventListener('click', function () {
            clearChatError();
            if (lastUserMessage) {
              input.value = lastUserMessage;
              sendMessage();
            } else {
              input.focus();
            }
          });
        }
        errorSlot.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      function clearChatError() {
        if (errorSlot) errorSlot.innerHTML = '';
      }
      function maybeShowContactCta() {
        if (contactCta && userMessageCount >= ctaThreshold) {
          contactCta.hidden = false;
          // smooth scroll to CTA after a small delay
          setTimeout(function () {
            contactCta.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 200);
        }
      }

      // BAI-KRN-002 / M1 (2026-07-18): wire-up layer — session UUID, AbortController,
      // IME guard, max-length 4000. Keeps the existing fetch path; M2 (next
      // phase) replaces the JSON-only path with SSE. M3 wires the Cancel button
      // and the demo/degraded badge.

      /**
       * sessionManager: lazy UUID v4 generator, persisted in sessionStorage so a
       * tab refresh keeps the same conversation history on the server (Redis-backed
       * context, per CHAT-SESSION-2026-07-15). Throws nothing — caller treats null
       * as "single-turn request".
       */
      function getSessionId() {
        try {
          var KEY = 'brightai.kernel.sessionId';
          var cached =
            window.sessionStorage && window.sessionStorage.getItem(KEY);
          if (
            cached &&
            /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
              cached,
            )
          ) {
            return cached;
          }
          // crypto.randomUUID is supported in Astro's modern browser targets.
          var fresh =
            typeof crypto !== 'undefined' && crypto.randomUUID
              ? crypto.randomUUID()
              : null;
          if (fresh && window.sessionStorage) {
            window.sessionStorage.setItem(KEY, fresh);
          }
          return fresh;
        } catch (_) {
          return null;
        }
      }

      /**
       * promptIdFromUrl: reads ?prompt= from window.location.search. The server
       * enforces the ALLOWED_PROMPT_IDS allowlist (5 keys — see
       * src/pages/api/ai/chat.ts:135). If absent or unknown, we send undefined
       * and the server runs without a system prompt (matches the legacy JSON
       * path's behaviour). BAI-KRN-002 / M1.
       */
      function getPromptIdFromUrl() {
        try {
          var sp = new URLSearchParams(window.location.search);
          var v = sp.get('prompt');
          if (!v) return undefined;
          var allowed = [
            'compliance',
            'policies',
            'evidence',
            'audit',
            'scenarios',
          ];
          return allowed.indexOf(v) !== -1 ? v : undefined;
        } catch (_) {
          return undefined;
        }
      }

      /** BAI-KRN-002 / M1: one controller per send. M3 wires Cancel button. */
      var composerAbort = null;

      /** CHAT-STATE-001: last user message text — used by error-banner retry. */
      var lastUserMessage = '';

      /** Original send-button markup, cached so we can restore it after
       *  the in-flight Cancel state ends. */
      var sendBtnOriginalHTML = '';
      var sendBtnCancelHandler = null;

      /**
       * CHAT-STATE-001: morph the send button into a Cancel control.
       * The button stays enabled (so it remains clickable) but swaps its
       * label/icon/class to signal "stop", and a one-shot click handler
       * triggers composerAbort.abort(). M3 finally wires the controller.
       */
      function enterStreamingState() {
        if (!sendBtn) return;
        if (!sendBtnOriginalHTML) sendBtnOriginalHTML = sendBtn.innerHTML;
        sendBtn.disabled = false; // must stay clickable to cancel
        sendBtn.classList.add('kernel-chat-composer__btn--cancel');
        sendBtn.classList.remove('kernel-chat-composer__btn--primary');
        sendBtn.setAttribute('aria-label', 'إيقاف الرد الجاري');
        sendBtn.innerHTML =
          '<span aria-hidden="true">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>' +
          '</span>' +
          '<span>إيقاف</span>';
        sendBtnCancelHandler = function () {
          if (composerAbort) {
            try { composerAbort.abort(); } catch (_) { /* noop */ }
          }
        };
        sendBtn.addEventListener('click', sendBtnCancelHandler, { once: true });
      }

      /**
       * CHAT-STATE-001: restore the send button to its idle state. Called
       * from every terminal path (finalizeIdle, abort, error, blocked).
       */
      function exitStreamingState() {
        if (!sendBtn) return;
        sendBtn.classList.remove('kernel-chat-composer__btn--cancel');
        sendBtn.classList.add('kernel-chat-composer__btn--primary');
        sendBtn.removeAttribute('aria-label');
        if (sendBtnOriginalHTML) {
          sendBtn.innerHTML = sendBtnOriginalHTML;
          sendBtnOriginalHTML = '';
        }
        sendBtn.disabled = false;
        if (sendBtnCancelHandler) {
          sendBtn.removeEventListener('click', sendBtnCancelHandler);
          sendBtnCancelHandler = null;
        }
      }

      /** BAI-KRN-002 / M1: isComposing guard for CJK / IME keyboards. */
      var composerIsComposing = false;
      input.addEventListener('compositionstart', function () {
        composerIsComposing = true;
      });
      input.addEventListener('compositionend', function () {
        composerIsComposing = false;
      });
      // KRN-FORM-001: مسح حالة الخطأ فور بدء الكتابة مرة أخرى.
      input.addEventListener('input', function () {
        var inputErr = document.getElementById('kernel-chat-input-error');
        if (inputErr && !inputErr.hidden) inputErr.hidden = true;
        if (input && input.hasAttribute('aria-invalid')) input.removeAttribute('aria-invalid');
      });

      /** BAI-KRN-002 / M1: 4000-char cap (server enforces too). */
      var MAX_INPUT_CHARS = 4000;

      // BAI-KRN-002 / M2 (2026-07-18): SSE reader + JSON fallback. The server
      // (src/pages/api/ai/chat.ts:763) checks the Accept header:
      //   Accept: text/event-stream → emits `event: token`, `event: done`,
      //                          `event: error` frames.
      //   Accept: application/json  → legacy { reply, provider } shape.
      // We send text/event-stream first (better UX), but auto-detect the
      // response Content-Type so a JSON-only server still works.

      /**
       * Read a fetch response as SSE. Yields {event, data} pairs where
       * `data` is the parsed JSON payload. Mirrors the parser at
       * src/pages/api/ai/chat.ts:436 but is client-side + resilient to
       * the server closing the stream without a `done` event.
       *
       * Aborts cleanly when the AbortSignal fires (caller cancels).
       */
      async function* readSSE(response, signal) {
        if (!response.body || typeof response.body.getReader !== 'function') {
          throw new Error('SSE: no readable body');
        }
        var reader = response.body.getReader();
        var decoder = new TextDecoder();
        var buf = '';
        var aborted = false;
        if (signal) {
          signal.addEventListener(
            'abort',
            function () {
              aborted = true;
              try { reader.cancel(); } catch (_) { /* noop */ }
            },
            { once: true },
          );
        }
        try {
          while (!aborted) {
            var step = await reader.read();
            if (step.done) break;
            buf += decoder.decode(step.value, { stream: true });
            // Split into complete frames (terminated by blank line)
            var frames = buf.split(/\r?\n\r?\n/);
            buf = frames.pop() || ''; // last partial frame goes back to buffer
            for (var i = 0; i < frames.length; i++) {
              var frame = frames[i];
              var eventName = 'message';
              var dataLines = [];
              var lines = frame.split(/\r?\n/);
              for (var j = 0; j < lines.length; j++) {
                var line = lines[j];
                if (line.indexOf('event:') === 0) {
                  eventName = line.slice(6).trim();
                } else if (line.indexOf('data:') === 0) {
                  dataLines.push(line.slice(5).trim());
                }
              }
              if (!dataLines.length) continue;
              var payload = dataLines.join('\n');
              if (payload === '[DONE]') return;
              var parsed;
              try { parsed = JSON.parse(payload); } catch (_) { parsed = null; }
              yield { event: eventName, data: parsed, raw: payload };
            }
          }
        } finally {
          try { reader.releaseLock(); } catch (_) { /* noop */ }
        }
      }

      /**
       * BAI-KRN-002 / M2: provider badge state. Set after every successful
       * reply (SSE done event or JSON reply). Cleared on error/new chat.
       * No static / hardcoded provider value — always reflects the server's
       * metadata (Acceptance: "لا تعرض provider ثابتاً").
       *
       * K2 (2026-07-18): also drives the visible provider card in the
       * RIGHT pane + context drawer (previously hard-coded "NVIDIA NIM").
       * The card now shows the live provider name from the response, or a
       * neutral "—" before the first successful reply.
       */
      var lastProvider = '';

      /** K2 (2026-07-18): reflect the live provider into the provider card(s). */
      var PROVIDER_LABELS = { groq: 'Groq', gemini: 'Gemini', '': '—' };
      var STATUS_LABELS = { groq: 'متصّل', gemini: 'متصّل', '': '—' };
      var MODE_LABELS = { groq: 'Production', gemini: 'Production', '': '—' };
      function updateProviderBadges() {
        var label = PROVIDER_LABELS[lastProvider] || '—';
        var status = STATUS_LABELS[lastProvider] || '—';
        var mode = MODE_LABELS[lastProvider] || '—';
        elAll('[data-provider-badge]').forEach(function (node) {
          node.textContent = label;
        });
        elAll('[data-provider-status]').forEach(function (node) {
          node.textContent = status;
          if (lastProvider) {
            node.className = 'kernel-chat-context-card__value kernel-chat-context-card__value--ok';
          } else {
            node.className = 'kernel-chat-context-card__value';
          }
        });
        elAll('[data-provider-mode]').forEach(function (node) {
          node.textContent = mode;
        });
        // When a live provider is known, drop the static "demo" tint if any.
        if (lastProvider) {
          elAll('[data-provider-card]').forEach(function (node) {
            node.removeAttribute('data-demo');
          });
        }
      }

      /** K2 (2026-07-18): DEMO badge — shown while the visible reply is a
       *  seed/demo fallback (no live provider contacted). Hidden on the
       *  first successful live reply. */
      function setDemoMode(isDemo) {
        elAll('[data-demo-badge]').forEach(function (node) {
          node.hidden = !isDemo;
        });
        elAll('[data-provider-card]').forEach(function (node) {
          if (isDemo) node.setAttribute('data-demo', 'true');
        });
      }

      /** K2 (2026-07-18): DEGRADED badge — driven by the X-Chat-Session
       *  response header when the Redis-backed session store fell back to
       *  in-memory storage (context not preserved across reloads). */
      function setDegradedMode(isDegraded) {
        elAll('[data-degraded-badge]').forEach(function (node) {
          node.hidden = !isDegraded;
        });
      }

      function sendMessage() {
        // BAI-KRN-002 / M1 (2026-07-18): wire-up layer — IME composition guard
        // must come BEFORE the trim check (Arabic/CJK keyboards fire Enter on
        // a composing buffer, and we must not auto-submit during IME).
        if (composerIsComposing) return;

        var raw = input.value;
        if (!raw || !raw.trim()) {
          var inputErr = document.getElementById('kernel-chat-input-error');
          if (inputErr) inputErr.hidden = false;
          if (input) input.setAttribute('aria-invalid', 'true');
          input.focus();
          return;
        }
        var inputErr = document.getElementById('kernel-chat-input-error');
        if (inputErr) inputErr.hidden = true;
        if (input) input.removeAttribute('aria-invalid');
        // BAI-KRN-002 / M1: clamp to server-side cap (4000). Server re-validates;
        // UI clamp is a UX nicety + prevents runaway payloads.
        if (raw.length > MAX_INPUT_CHARS) raw = raw.slice(0, MAX_INPUT_CHARS);

        // Append user message
        var userMsg = createMessage('user', raw);
        messages.insertBefore(userMsg.article, typing);

        // CHAT-STATE-001: remember the last user message so the retry
        // button in error banners can re-send it verbatim.
        lastUserMessage = raw;

        // Clear + reset
        input.value = '';

        // CHAT-STATE-001: turn the send button into a Cancel control while
        // a request is in flight. AbortController (composerAbort) is
        // created below; the cancel handler reads it at click time.
        enterStreamingState();

        // Show typing
        typing.hidden = false;
        messages.setAttribute('aria-busy', 'true');
        scrollThreadToEnd(thread);

        // Hide any active policy banner after first send
        if (banner) banner.hidden = true;

        // KERNEL-AI-2026-07-14: increment user message counter + show CTA after threshold
        userMessageCount++;
        maybeShowContactCta();

        // KERNEL-AI-2026-07-14: clear any previous error
        clearChatError();
        // K2 (2026-07-18): a live API attempt is starting — leave demo
        // mode so the provider card shows "—" until the reply arrives.
        setDemoMode(false);

        // BAI-KRN-002 / M1: fresh AbortController per request. M3 will wire the
        // Cancel button to composerAbort.abort(); for now the controller exists
        // so callers can observe the signal state.
        composerAbort = new AbortController();

        // BAI-KRN-002 / M1: build payload with sessionId (Redis-backed context,
        // CHAT-SESSION-2026-07-15) + promptId from URL (server allowlist, M1).
        var payload = { message: raw };
        var sessionId = getSessionId();
        if (sessionId) payload.sessionId = sessionId;
        var promptId = getPromptIdFromUrl();
        if (promptId) payload.promptId = promptId;

        // REPORTS-SEC-01 + KERNEL-AI-2026-07-14 + BAI-KRN-002 / M2 (2026-07-18):
        // Try the server-side /api/ai/chat/ proxy first. We request SSE via
        // Accept: text/event-stream; the server may return JSON instead
        // (older build, env flag off, etc.) — we auto-detect via Content-Type
        // and fall back accordingly. Provider badge is sourced from the
        // response (SSE `done` event or JSON `provider` field), never
        // hard-coded. On error, show Arabic error message AND fall back to
        // demo reply so the user still gets visual feedback.
        var apiTried = false;
        if (apiAvailability !== false) {
          apiTried = true;
          // trailing slash لتفادي 301 → method change (fetch يحول POST→GET على 301)
          fetch('/api/ai/chat/', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              // BAI-KRN-002 / M2: ask for SSE. Server checks this header at
              // chat.ts:763 and routes to the streaming generator when present.
              'Accept': 'text/event-stream, application/json',
            },
            signal: composerAbort.signal,
            body: JSON.stringify(payload),
          })
            .then(function (res) {
              if (res.status === 404) {
                apiAvailability = false;
                showChatError('unavailable');
                // CHAT-STATE-001: 404 is the one case where a demo reply
                // remains useful — the endpoint genuinely does not exist
                // (Render static). Other provider errors no longer fall
                // back, so the user sees a clear retry path instead.
                runDemoReply();
                return null;
              }
              if (res.status === 429) {
                var retryAfter = parseInt(res.headers.get('Retry-After') || '60', 10);
                showChatError('rate_limit', retryAfter);
                // No demo reply — user must wait
                typing.hidden = true;
                messages.setAttribute('aria-busy', 'false');
                exitStreamingState();
                input.focus();
                return null;
              }
              // CHAT-STATE-001: firewall policy decisions. 451 = block,
              // 428 = require_approval. Both carry { reply, blocked, decision,
              // traceId, findings } in the body — we render the refusal as a
              // real AI message with a "blocked" badge + suggested phrasing,
              // NOT as a generic error + demo reply (previous behaviour).
              if (res.status === 451 || res.status === 428) {
                return res.json().then(function (data) {
                  renderBlockedMessage(data || {});
                  return null;
                }).catch(function () {
                  showChatError('unknown');
                  finalizeIdle();
                  return null;
                });
              }
              if (res.status === 502) {
                // CHAT-STATE-001: provider failure — no demo fallback. The
                // user gets a clear error + retry so they know the model
                // was never reached.
                showChatError('provider_failed');
                finalizeIdle();
                return null;
              }
              if (res.status === 503) {
                // 503 = upstream rate-limited / overloaded. Same treatment as 502.
                showChatError('provider_failed');
                finalizeIdle();
                return null;
              }
              if (res.status === 504) {
                showChatError('timeout');
                finalizeIdle();
                return null;
              }
              if (res.status === 403) {
                // Origin allowlist rejected (or expired API key). This is the
                // configuration / origin path — show a clear info-level notice
                // without exposing why exactly, then fall back to demo.
                showChatError('unavailable');
                runDemoReply();
                return null;
              }
              if (!res.ok) {
                showChatError('unknown');
                finalizeIdle();
                return null;
              }
              // CHAT-STATE-001: HTTP 200 with X-Stream-Status: all_providers_failed
              // is the server's "no provider could serve this" signal (see
              // chat.ts:~880). Treat it like a provider failure.
              if (res.headers.get('X-Stream-Status') === 'all_providers_failed') {
                showChatError('provider_failed');
                finalizeIdle();
                return null;
              }
              // K2 (2026-07-18): surface degraded session notice if the
              // server fell back to in-memory context storage.
              if (res.headers.get('X-Chat-Session') === 'degraded') {
                setDegradedMode(true);
              }
              return { res: res, contentType: res.headers.get('content-type') || '' };
            })
            .then(function (handled) {
              if (!handled) return;
              var res = handled.res;
              var ct = handled.contentType;

              // BAI-KRN-002 / M2: SSE path — server sent text/event-stream.
              if (ct.indexOf('text/event-stream') !== -1) {
                return consumeSSE(res);
              }

              // JSON fallback (server returned application/json). The shape
              // is { reply: string, provider: 'groq'|'gemini' } on success.
              return res.json().then(function (data) {
                if (!data || !data.reply) {
                  showChatError('unknown');
                  finalizeIdle();
                  return null;
                }
                var aiMsg = createMessage('ai', '');
                messages.insertBefore(aiMsg.article, typing);
                if (data.provider) lastProvider = String(data.provider);
                updateProviderBadges();
                // CHAT-STATE-001: mark this as a live (not demo) reply.
                attachSourceBadge(aiMsg.badge, 'live', lastProvider || undefined);
                // KERNEL-ANALYTICS-2026-07-18: message_allowed — a reply was
                // produced (PII passed firewall or was redacted). Non-PII.
                 kernelTrack(KEV().MESSAGE_ALLOWED, scenarioCtx());
                 streamInto(aiMsg.bubble, data.reply, function () {
                   lastCompletedReply = data.reply;
                   finalizeIdle();
                   input.focus();
                   scrollThreadToEnd(thread);
                 });
                return null;
              });
            })
            .catch(function (err) {
              // BAI-KRN-002 / M2: distinguish user-cancel from network error.
              if (err && (err.name === 'AbortError' || composerAbort && composerAbort.signal.aborted)) {
                typing.hidden = true;
                messages.setAttribute('aria-busy', 'false');
                // CHAT-STATE-001: mark the in-flight AI message (if any) as
                // cancelled, keep partial text, and offer a retry.
                var partial = messages.querySelector('.kernel-chat-message--ai[data-streaming="true"]');
                if (partial) {
                  var pBadge = partial.querySelector('.kernel-source-badge');
                  attachSourceBadge(pBadge, 'cancelled');
                  partial.removeAttribute('data-streaming');
                }
                exitStreamingState();
                input.focus();
                // Show a retry banner (not a "timeout" confusion) so the
                // user knows they stopped it and can resume.
                showChatError('cancelled');
                return;
              }
              showChatError('network');
              finalizeIdle();
            });
        }

        /**
         * BAI-KRN-002 / M2 (2026-07-18): SSE consumer.
         * Pipes event: token deltas into the AI message bubble, listens for
         * `event: done` to capture the provider metadata (sets lastProvider),
         * and surfaces `event: error` as the appropriate Arabic error.
         * Uses streamInto() — the same word-by-word typer used by the JSON
         * path and the demo fallback — so the visual UX is identical
         * regardless of source.
         */
        async function consumeSSE(res) {
          var aiMsg = createMessage('ai', '');
          // CHAT-STATE-001: tag the message as streaming so the catch path
          // can find + demote it to "cancelled" if the user aborts.
          aiMsg.article.setAttribute('data-streaming', 'true');
          messages.insertBefore(aiMsg.article, typing);
          var fullReply = '';
          var doneSeen = false;
          var liveProvider = '';
          try {
            for await (var frame of readSSE(res, composerAbort && composerAbort.signal)) {
              if (!frame) continue;
              if (frame.event === 'token' && frame.data && typeof frame.data.delta === 'string') {
                fullReply += frame.data.delta;
                // Append text in chunks so the bubble updates as tokens arrive
                if (typeof aiMsg.bubble.appendChunk === 'function') {
                  aiMsg.bubble.appendChunk(frame.data.delta);
                } else {
                  aiMsg.bubble.textContent = fullReply;
                }
                scrollThreadToEnd(thread);
               } else if (frame.event === 'done' && frame.data) {
                 doneSeen = true;
                 if (typeof frame.data.provider === 'string') {
                   liveProvider = frame.data.provider;
                   lastProvider = frame.data.provider;
                 }
                 updateProviderBadges();
                 // CHAT-STATE-001: live reply completed — badge as مباشر.
                 attachSourceBadge(aiMsg.badge, 'live', liveProvider || undefined);
                 // KERNEL-ANALYTICS-2026-07-18: message_allowed — stream
                 // completed with a reply. Non-PII.
                kernelTrack(KEV().MESSAGE_ALLOWED, scenarioCtx());
               } else if (frame.event === 'error') {
                // Stream-level error mid-response: keep what we have, demote
                // the badge to unavailable, and surface a retry notice.
                attachSourceBadge(aiMsg.badge, 'unavailable');
                showChatError('provider_failed');
              }
            }
          } catch (err) {
            // readSSE surfaces AbortError when the user cancels. Fall through
            // to idle state without showing a confusing network error.
            if (err && (err.name === 'AbortError' || composerAbort && composerAbort.signal.aborted)) {
              // CHAT-STATE-001: user cancel — keep partial text, mark cancelled.
              attachSourceBadge(aiMsg.badge, 'cancelled');
            } else {
              attachSourceBadge(aiMsg.badge, 'unavailable');
              showChatError('network');
            }
          }
          aiMsg.article.removeAttribute('data-streaming');
          if (!doneSeen && !fullReply) {
            // No tokens arrived before the stream closed — degrade gracefully.
            attachSourceBadge(aiMsg.badge, 'unavailable');
            showChatError('unknown');
          }
          if (fullReply) lastCompletedReply = fullReply;
          finalizeIdle();
          input.focus();
          scrollThreadToEnd(thread);
        }

      /**
       * A11Y-STREAM (2026-07-18): announce the COMPLETE reply once via the
       * dedicated sr-only live region — never per-token. Prevents screen
       * readers from reading every streamed chunk.
       */
      var lastCompletedReply = '';
      function announce(text) {
        if (!announcer) return;
        // Clear then set so AT re-announces even identical consecutive replies.
        announcer.textContent = '';
        announcer.textContent = text || '';
      }

      /**
       * BAI-KRN-002 / M2: shared finalize helper (idle state + focus).
       * CHAT-STATE-001: also restores the send button from Cancel state.
       */
      function finalizeIdle() {
        typing.hidden = true;
        messages.setAttribute('aria-busy', 'false');
        exitStreamingState();
        // Announce the completed reply a single time, after streaming ends.
        if (lastCompletedReply) {
          announce(lastCompletedReply);
          lastCompletedReply = '';
        }
      }

        // REPORTS-SEC-01: Demo fallback path (latency simulation + fake streaming).
        // يُستخدم عندما الـ API غير متاح أو رجع 404/403. يحفظ الـ UX القديم.
        // CHAT-STATE-001: now also tags the reply as demo so the source
        // badge clearly distinguishes it from a live reply.
        function runDemoReply() {
          setDemoMode(true);
          setTimeout(function () {
            var aiMsg = createMessage('ai', '');
            messages.insertBefore(aiMsg.article, typing);
            attachSourceBadge(aiMsg.badge, 'demo');
            var fake = pickFakeResponse();
            streamInto(aiMsg.bubble, fake, function () {
              lastCompletedReply = fake;
              typing.hidden = true;
              scrollThreadToEnd(thread);
              finalizeIdle();
            });
          }, 700);
        }

        /**
         * CHAT-STATE-001: render a firewall-blocked response as a real AI
         * message. The server returns this on HTTP 451 (block) and 428
         * (require_approval) with { reply, blocked, decision, traceId,
         * findings }. We show the refusal text, a "blocked" source badge,
         * and a suggested-phrasing box explaining why + offering a safe
         * rewrite — reusing the same pattern the seed messages use.
         */
        function renderBlockedMessage(data) {
          var aiMsg = createMessage('ai', '');
          messages.insertBefore(aiMsg.article, typing);
          attachSourceBadge(aiMsg.badge, 'blocked');
          var refusal = (data && data.reply) ||
            'تعذّر إرسال الطلب: يحتوي على بيانات محظورة حسب سياسة الأمان.';
          aiMsg.bubble.textContent = refusal;
          // Governance strip mirroring the seed messages.
          var gov = document.createElement('div');
          gov.className = 'kernel-governance-strip';
          gov.setAttribute('aria-label', 'شريط الحوكمة');
          gov.innerHTML =
            '<span class="kernel-governance-strip__item kernel-governance-strip__item--decision" data-decision="blocked" title="القرار">⊘ محظور</span>' +
            (data && data.traceId
              ? '<span class="kernel-governance-strip__item kernel-governance-strip__item--trace" title="Trace ID">' + data.traceId + '</span>'
              : '');
          aiMsg.body.appendChild(gov);
          // Suggested-phrasing box: explain why + offer a safe rewrite.
          var findings = (data && data.findings) || [];
          var whyText = 'طلبك يحتوي على بيانات شخصية أو سرية محظورة. ' +
            (findings.length
              ? 'الكشف وجد: ' + findings.slice(0, 5).join('، ') + '. '
              : '') +
            'أعد صياغة الطلب بدون أرقام هوية أو بيانات حساسة، أو استخدم صياغة مجمّعة (إحصاءات بدل بيانات خام).';
          var safePhrasing = 'جرّب صياغة أبعدَ عن البيانات الحساسة: اطلب ملخصاً إحصائياً أو تقريراً مجمّعاً بدل البيانات الخام.';
          var sugg = document.createElement('div');
          sugg.className = 'kernel-chat-suggestion';
          sugg.setAttribute('role', 'alert');
          sugg.innerHTML =
            '<div class="kernel-chat-suggestion__head">' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>' +
              '<span>طلبك محظور — جرّب هذي الصياغة بدلاً منها</span>' +
            '</div>' +
            '<div class="kernel-chat-suggestion__body">' +
              '<textarea readonly rows="2" aria-label="الصياغة الآمنة المقترحة">' + safePhrasing + '</textarea>' +
            '</div>' +
            '<div class="kernel-chat-suggestion__actions">' +
              '<button type="button" class="kernel-chat-suggestion__btn kernel-chat-suggestion__btn--primary" data-kernel-use-phrasing>استخدم الصياغة</button>' +
              '<button type="button" class="kernel-chat-suggestion__btn" data-kernel-why-modified>ليش عدّلت؟</button>' +
            '</div>' +
            '<div class="kernel-chat-suggestion__reason" hidden>' + whyText + '</div>';
          aiMsg.body.appendChild(sugg);
          // Track + finalize.
          kernelTrack(KEV().MESSAGE_BLOCKED, Object.assign(
            { error_type: 'policy_' + ((data && data.decision) || 'block') },
            scenarioCtx()
          ));
          lastCompletedReply = refusal;
          typing.hidden = true;
          finalizeIdle();
          scrollThreadToEnd(thread);
          // Re-bind the suggestion buttons (reuse the existing handlers below).
          bindSuggestionButtons();
        }

        if (!apiTried) runDemoReply();
      }

      // CHAT-STATE-001: send button handler guards against the streaming
      // (Cancel) state — when the button is in cancel mode, the dedicated
      // cancel listener (registered in enterStreamingState) handles the
      // click; we must NOT also fire sendMessage.
      form.addEventListener('submit', function (e) { e.preventDefault(); sendMessage(); });
      if (sendBtn) {
        sendBtn.addEventListener('click', function (e) {
          if (sendBtn.classList.contains('kernel-chat-composer__btn--cancel')) {
            // Cancel listener (registered via {once:true}) handles this.
            return;
          }
          sendMessage();
        });
      }

      // Enter / Shift+Enter handler on textarea
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          sendMessage();
        }
      });

      // M14: C key = new chat
      document.addEventListener('keydown', function (e) {
        if (e.key === 'c' && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
          // Don't trigger when typing in an input/textarea
          if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;
          if (newBtn) newBtn.click();
        }
      });

      // M14: Esc key closes the policy banner
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && banner && !banner.hidden) {
          banner.hidden = true;
        }
      });

      // M14: Banner close button
      var bannerClose = el('[data-kernel-banner-close]');
      if (bannerClose) {
        bannerClose.addEventListener('click', function () {
          if (banner) banner.hidden = true;
        });
      }

      // Attach (demo stub with safe checking)
      if (attachBtn) {
        attachBtn.addEventListener('click', function () {
          attachBtn.classList.add('is-pulsing');
          setTimeout(function () { attachBtn.classList.remove('is-pulsing'); }, 600);
          // In demo mode, simulate a file upload with PII check
          var demoAttachments = [
            { name: 'report.xlsx', size: '1.2 MB', safe: true, piiDetected: false },
            { name: 'customers.csv', size: '340 KB', safe: false, piiDetected: true },
          ];
          var slot = el('[data-kernel-attachments-slot]');
          if (slot) {
            slot.innerHTML = demoAttachments.map(function (att) {
              return '<div class="kernel-chat-attachment kernel-chat-attachment--' + (att.safe ? 'safe' : 'unsafe') + '">' +
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14" aria-hidden="true"><path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>' +
                '<span>' + att.name + '</span>' +
                '<span class="kernel-chat-attachment__size">' + att.size + '</span>' +
                (att.piiDetected ? '<span class="kernel-chat-attachment__warn" title="PII مكتشف">⚠ PII</span>' : '') +
                '<span class="kernel-chat-attachment__status">' + (att.safe ? '✅ آمن' : '❌ محظور') + '</span>' +
                '</div>';
            }).join('');
          }
        });
      }

      // M14: Masked text toggle
      elAll('[data-kernel-mask-toggle]').forEach(function (btn) {
        if (btn.dataset.bound === '1') return;
        btn.dataset.bound = '1';
        btn.addEventListener('click', function () {
          var article = btn.closest('.kernel-chat-message');
          if (!article) return;
          var maskedView = article.querySelector('.kernel-chat-message__masked-view');
          if (maskedView) {
            var isHidden = maskedView.hasAttribute('hidden');
            if (isHidden) {
              maskedView.removeAttribute('hidden');
              btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14" aria-hidden="true"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg><span>إخفاء التعمية</span>';
            } else {
              maskedView.setAttribute('hidden', '');
              btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg><span>عرض بعد التعمية</span>';
            }
          }
        });
      });

      // M14 + CHAT-STATE-001: "Use phrasing" / "Why modified?" binders.
      // Factored into a function so renderBlockedMessage() can re-bind
      // buttons added dynamically after a 451/428 firewall response.
      function bindSuggestionButtons() {
        // "Use phrasing" — copies suggested text to input
        elAll('[data-kernel-use-phrasing]').forEach(function (btn) {
          if (btn.dataset.bound === '1') return;
          btn.dataset.bound = '1';
          btn.addEventListener('click', function () {
            var suggestion = btn.closest('.kernel-chat-suggestion');
            if (!suggestion) return;
            var textarea = suggestion.querySelector('textarea');
            if (textarea && input) {
              input.value = textarea.value;
              input.focus();
            }
          });
        });
        // "Why modified?" — toggles reason visibility
        elAll('[data-kernel-why-modified]').forEach(function (btn) {
          if (btn.dataset.bound === '1') return;
          btn.dataset.bound = '1';
          btn.addEventListener('click', function () {
            var suggestion = btn.closest('.kernel-chat-suggestion');
            if (!suggestion) return;
            var reason = suggestion.querySelector('.kernel-chat-suggestion__reason');
            if (reason) {
              var isHidden = reason.hasAttribute('hidden');
              if (isHidden) {
                reason.removeAttribute('hidden');
                btn.textContent = 'إخفاء السبب';
              } else {
                reason.setAttribute('hidden', '');
                btn.textContent = 'ليش عدّلت؟';
              }
            }
          });
        });
      }
      bindSuggestionButtons();

      // M14: "Open in Playground" button — navigates to playground with message text
      elAll('[data-kernel-open-playground]').forEach(function (btn) {
        if (btn.dataset.bound === '1') return;
        btn.dataset.bound = '1';
        btn.addEventListener('click', function () {
          var article = btn.closest('.kernel-chat-message');
          if (!article) return;
          var bubble = article.querySelector('.kernel-chat-message__bubble');
          var text = bubble ? bubble.textContent.trim() : '';
          // Encode the message text and navigate to playground
          var encoded = encodeURIComponent(text);
          window.location.href = '/kernel/playground/?prefill=' + encoded;
        });
      });

      // M14: "Convert to Evaluation" button — navigates to eval page with run data
      elAll('[data-kernel-to-evaluation]').forEach(function (btn) {
        if (btn.dataset.bound === '1') return;
        btn.dataset.bound = '1';
        btn.addEventListener('click', function () {
          var article = btn.closest('.kernel-chat-message');
          if (!article) return;
          var traceId = article.getAttribute('data-trace-id') || '';
          var runId = article.getAttribute('data-run-id') || '';
          window.location.href = '/kernel/eval/?run=' + encodeURIComponent(runId) + '&trace=' + encodeURIComponent(traceId);
        });
      });

      // New chat — clear messages + show banner again + clear input
      if (newBtn) {
        newBtn.addEventListener('click', function () {
          // Remove all message articles, keep the typing indicator
          elAll('.kernel-chat-message', messages).forEach(function (a) { a.remove(); });
          if (banner) banner.hidden = false;
          // KERNEL-AI-2026-07-14: reset CTA + error state for new chat
          userMessageCount = 0;
          if (contactCta) contactCta.hidden = true;
          clearChatError();
          input.value = '';
          input.focus();
        });
      }

      // Threads switching (visual only — updates the active thread title)
      elAll('[data-thread-id]').forEach(function (btn) {
        if (btn.dataset.bound === '1') return;
        btn.dataset.bound = '1';
        btn.addEventListener('click', function () {
          elAll('[data-thread-id]').forEach(function (b) { b.setAttribute('aria-current', 'false'); });
          btn.setAttribute('aria-current', 'true');
          var titleEl = el('[data-kernel-thread-title]');
          if (titleEl) titleEl.textContent = btn.dataset.threadTitle || 'محادثة';
        });
      });

      // KERNEL-ANALYTICS-2026-07-18: evidence_viewed — clicking any evidence
      // link/button (in-page or cross-page to /kernel/evidence/). Non-PII.
      elAll('a[href*="/kernel/evidence/"], [data-kernel-evidence-preview], [data-kernel-evidence-download]').forEach(function (node) {
        if (node.dataset.analyticsBound === '1') return;
        node.dataset.analyticsBound = '1';
        node.addEventListener('click', function () {
          var ev = {
            source: node.getAttribute('data-kernel-evidence-preview') ? 'preview' : 'link',
            evidence_id: node.getAttribute('data-kernel-evidence-preview') ||
                         node.getAttribute('data-kernel-evidence-download') || undefined,
          };
          Object.assign(ev, scenarioCtx());
          kernelTrack(KEV().EVIDENCE_VIEWED, ev);
        });
      });
    }

    /*
     * KRN-008 / EXEC-08: Mobile drawer controller.
     * - Toggle buttons (الرسائل / السياق) open the matching drawer.
     * - Only one drawer can be open at a time.
     * - role="dialog" + aria-modal="true" + focus trap (per §4.5(i)).
     * - Escape key closes the open drawer.
     * - Focus returns to the trigger button on close.
     * - Body scroll lock while drawer is open.
     * - Re-bind-safe across Astro view transitions.
     */
    var DRAWER_NAMES = ['threads', 'context'];

    function initDrawers() {
      var drawers = {};
      var triggers = {};
      DRAWER_NAMES.forEach(function (name) {
        drawers[name] = document.getElementById('kernel-chat-drawer-' + name);
        triggers[name] = document.querySelector('[data-kernel-chat-' + name + '-toggle]');
      });

      // Bail if none of the drawer elements exist on this page
      if (!drawers.threads && !drawers.context) return;

      function getFocusable(root) {
        if (!root) return [];
        var nodes = root.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        return Array.prototype.filter.call(nodes, function (node) {
          if (node.hasAttribute('disabled')) return false;
          if (node.getAttribute('aria-hidden') === 'true') return false;
          // offsetParent is null for display:none or detached nodes
          return node.offsetParent !== null || node === document.activeElement;
        });
      }

      function anyOpen() {
        return DRAWER_NAMES.some(function (name) {
          return drawers[name] && drawers[name].getAttribute('data-open') === 'true';
        });
      }

      function openDrawer(name) {
        var drawer = drawers[name];
        var trigger = triggers[name];
        if (!drawer) return;
        drawer.setAttribute('data-open', 'true');
        drawer.setAttribute('aria-hidden', 'false');
        if (trigger) trigger.setAttribute('aria-expanded', 'true');
        document.body.style.overflow = 'hidden';
        // Focus first focusable in the panel
        var panel = drawer.querySelector('.kernel-chat-drawer__panel');
        var focusable = getFocusable(panel);
        if (focusable[0]) {
          try { focusable[0].focus(); } catch (e) { /* ignore */ }
        }
      }

      function closeDrawer(name) {
        var drawer = drawers[name];
        var trigger = triggers[name];
        if (!drawer) return;
        drawer.setAttribute('data-open', 'false');
        drawer.setAttribute('aria-hidden', 'true');
        if (trigger) {
          trigger.setAttribute('aria-expanded', 'false');
          try { trigger.focus(); } catch (e) { /* ignore */ }
        }
        if (!anyOpen()) document.body.style.overflow = '';
      }

      function trapFocus(e, drawer) {
        if (e.key !== 'Tab') return;
        var panel = drawer.querySelector('.kernel-chat-drawer__panel');
        if (!panel) return;
        var focusable = getFocusable(panel);
        if (focusable.length === 0) {
          e.preventDefault();
          return;
        }
        var first = focusable[0];
        var last = focusable[focusable.length - 1];
        var active = document.activeElement;
        // If focus is outside the drawer, pull it back in
        if (!panel.contains(active)) {
          e.preventDefault();
          first.focus();
          return;
        }
        if (e.shiftKey && active === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && active === last) {
          e.preventDefault();
          first.focus();
        }
      }

      function handleDrawerKeydown(e) {
        if (e.key === 'Escape') {
          var openName = DRAWER_NAMES.find(function (name) {
            return drawers[name] && drawers[name].getAttribute('data-open') === 'true';
          });
          if (openName) {
            e.preventDefault();
            closeDrawer(openName);
            return;
          }
        }
        var openName = DRAWER_NAMES.find(function (name) {
          return drawers[name] && drawers[name].getAttribute('data-open') === 'true';
        });
        if (openName) trapFocus(e, drawers[openName]);
      }

      // Bind triggers
      DRAWER_NAMES.forEach(function (name) {
        var trigger = triggers[name];
        var drawer = drawers[name];
        if (!trigger || !drawer) return;
        if (trigger.dataset.bound === '1') return;
        trigger.dataset.bound = '1';
        trigger.addEventListener('click', function () {
          var isOpen = drawer.getAttribute('data-open') === 'true';
          if (isOpen) {
            closeDrawer(name);
          } else {
            // Close any other open drawer first
            DRAWER_NAMES.forEach(function (other) {
              if (other !== name && drawers[other] && drawers[other].getAttribute('data-open') === 'true') {
                closeDrawer(other);
              }
            });
            openDrawer(name);
          }
        });
      });

      // Bind close buttons + backdrops
      elAll('[data-kernel-chat-drawer-close]').forEach(function (btn) {
        if (btn.dataset.bound === '1') return;
        btn.dataset.bound = '1';
        btn.addEventListener('click', function () {
          var name = btn.getAttribute('data-kernel-chat-drawer-close');
          if (name) closeDrawer(name);
        });
      });

      // Global keydown handler (Escape + focus trap)
      if (typeof window.__kernelChatDrawerKeydownBound === 'undefined') {
        document.addEventListener('keydown', handleDrawerKeydown);
        window.__kernelChatDrawerKeydownBound = true;
      }
    }

    /*
     * PROMPT-2 (2026-08-04): Mobile-first chat tabs.
     * - On <768px: 3 tabs (المحادثات | المحادثة | التفاصيل) switch which
     *   pane is visible via data-tab-active. KernelTabs handles the ARIA
     *   roving-tabindex + keyboard nav; this controller wires the click →
     *   pane visibility + swipe gestures + auto-scroll + state preservation.
     * - State preservation: switching tabs never removes messages/threads
     *   from the DOM — we only toggle display. The chat thread keeps its
     *   scroll position and messages intact.
     * - Swipe: horizontal swipe (|Δx| > 50px) on the layout cycles tabs.
     * - Auto-scroll: when returning to the chat tab, scroll to the latest
     *   message so the user sees the newest content.
     * - Re-bind-safe across Astro view transitions.
     */
    var MOBILE_TAB_IDS = ['threads', 'chat', 'context'];

    function initMobileTabs() {
      var layout = el('.kernel-chat-layout');
      if (!layout) return;
      if (layout.dataset.mobileTabsBound === '1') return;
      layout.dataset.mobileTabsBound = '1';

      var panes = {};
      MOBILE_TAB_IDS.forEach(function (id) {
        panes[id] = document.getElementById('kernel-chat-tabpanel-' + id);
      });

      function setActiveTab(id) {
        if (MOBILE_TAB_IDS.indexOf(id) === -1) return;
        // Update pane visibility
        MOBILE_TAB_IDS.forEach(function (pid) {
          var pane = panes[pid];
          if (!pane) return;
          if (pid === id) {
            pane.setAttribute('data-tab-active', id);
          } else {
            pane.removeAttribute('data-tab-active');
          }
        });
        // Update tab aria-selected + tabindex (KernelTabs roving pattern)
        elAll('[role="tab"]', layout).forEach(function (tab) {
          var tid = tab.getAttribute('data-tab-id');
          var sel = tid === id;
          tab.setAttribute('aria-selected', sel ? 'true' : 'false');
          tab.setAttribute('tabindex', sel ? '0' : '-1');
        });
        // Auto-scroll to latest message when returning to chat tab
        if (id === 'chat') {
          var thread = el('[data-kernel-chat-thread]');
          if (thread) scrollThreadToEnd(thread);
        }
      }

      // Click handler on the tablist (delegation — works with KernelTabs)
      var tablist = layout.querySelector('[role="tablist"]');
      if (tablist) {
        tablist.addEventListener('click', function (e) {
          var tab = e.target.closest('[role="tab"]');
          if (!tab) return;
          var id = tab.getAttribute('data-tab-id');
          if (id) setActiveTab(id);
        });
      }

      // Swipe gestures (horizontal) — only on touch devices
      var touchStartX = 0;
      var touchStartY = 0;
      var swiping = false;
      layout.addEventListener('touchstart', function (e) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        swiping = true;
      }, { passive: true });
      layout.addEventListener('touchend', function (e) {
        if (!swiping) return;
        swiping = false;
        var deltaX = e.changedTouches[0].clientX - touchStartX;
        var deltaY = e.changedTouches[0].clientY - touchStartY;
        // Only horizontal swipes (ignore vertical scroll)
        if (Math.abs(deltaX) < 50 || Math.abs(deltaX) < Math.abs(deltaY)) return;
        var current = MOBILE_TAB_IDS.find(function (id) {
          return panes[id] && panes[id].hasAttribute('data-tab-active');
        }) || 'chat';
        var idx = MOBILE_TAB_IDS.indexOf(current);
        // RTL: swipe left (negative deltaX) = next tab, swipe right = previous
        var isRtl = (document.documentElement.getAttribute('dir') || 'rtl') === 'rtl';
        var next;
        if (isRtl) {
          next = deltaX < 0 ? idx + 1 : idx - 1;
        } else {
          next = deltaX > 0 ? idx + 1 : idx - 1;
        }
        if (next >= 0 && next < MOBILE_TAB_IDS.length) {
          setActiveTab(MOBILE_TAB_IDS[next]);
        }
      }, { passive: true });
    }

    document.addEventListener('astro:page-load', init);
    document.addEventListener('astro:page-load', initDrawers);
    document.addEventListener('astro:page-load', initMobileTabs);
    if (document.readyState !== 'loading') {
      init();
      initDrawers();
      initMobileTabs();
    }
  })();
