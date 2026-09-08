(function () {
    'use strict';

    var DEMO_RESPONSES = [
      'في وضع البيانات التوضيحية، هذا نموذج لإجابة المساعد الذكي. في البيئة الإنتاجية، يتم استدعاء نموذج لغوي كبير عبر /api/ai/chat مع طبقات حوكمة (PDPL filter + risk scoring + policy match). جرّب سؤالاً متخصصاً في مجال هذه الصفحة وستحصل على رد مخصص في الإنتاج.',
      'في الوضع التجريبي: تتطلب هذه الحالة مراجعة سياسات المؤسسة وإطار PDPL قبل أي تنفيذ. فعّل نقطة الاتصال /api/ai/chat في بيئتك (Vercel أو @astrojs/node على Render) لتفعيل الردود الفعلية.',
      'وضع تجريبي: تذكّر — كل استدعاء AI في BrightAI Kernel يمر عبر فلتر PII، تقييم مخاطر، فحص سياسات، ثم توثيق الدليل. لمشاهدة المكدس الكامل، افتح /kernel/audit/ و /kernel/evidence/.',
    ];

    function $(q, root) { return (root || document).querySelector(q); }
    function $$(q, root) { return Array.prototype.slice.call((root || document).querySelectorAll(q)); }
    function pickDemo() { return DEMO_RESPONSES[Math.floor(Math.random() * DEMO_RESPONSES.length)]; }

    function safeStorage() {
      try {
        var t = '__kass_test__';
        window.sessionStorage.setItem(t, '1');
        window.sessionStorage.removeItem(t);
        return window.sessionStorage;
      } catch (e) { return null; }
    }

    function loadHistory(storage, key) {
      if (!storage) return [];
      try {
        var raw = storage.getItem(key);
        if (!raw) return [];
        var parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) { return []; }
    }

    function saveHistory(storage, key, history) {
      if (!storage) return;
      try {
        var raw = JSON.stringify(history);
        if (raw.length > 50000) {
          history = history.slice(-10); // keep last 10 turns if too long
          raw = JSON.stringify(history);
        }
        storage.setItem(key, raw);
      } catch (e) { /* ignore quota errors silently */ }
    }

    function renderMessage(thread, role, text) {
      // إخفاء empty state إن وُجد
      var empty = $('.kernel-ai-assistant__empty', thread);
      if (empty) empty.remove();

      var article = document.createElement('article');
      article.className = 'kernel-ai-assistant__message kernel-ai-assistant__message--' + role;

      var avatar = document.createElement('span');
      avatar.className = 'kernel-ai-assistant__avatar';
      avatar.setAttribute('aria-hidden', 'true');
      avatar.textContent = role === 'user' ? 'ي' : 'AI';
      article.appendChild(avatar);

      var wrapper = document.createElement('div');
      wrapper.style.flex = '1';
      wrapper.style.minInlineSize = '0';

      var bubble = document.createElement('div');
      bubble.className = 'kernel-ai-assistant__bubble';
      bubble.textContent = text;
      wrapper.appendChild(bubble);

      var meta = document.createElement('span');
      meta.className = 'kernel-ai-assistant__meta';
      meta.textContent = 'الآن · ' + (role === 'user' ? 'سؤالك' : 'المساعد');
      wrapper.appendChild(meta);

      article.appendChild(wrapper);
      thread.appendChild(article);

      // scroll to end
      thread.scrollTop = thread.scrollHeight;
      return article;
    }

    function streamInto(bubble, text, onDone) {
      // تأثير "ظهور تدريجي" للنص الكامل — يُستخدم فقط في مسار fallback
      // (JSON response أو demo/degraded). المسار الأساسي يستخدم SSE streaming
      // حقيقي من chat.ts (CHAT-STREAM-2026-07-15): event: token / data: {"delta":"..."}
      // يحدّث الـ DOM مباشرة في handleStream() فوق. يحترم prefers-reduced-motion.
      var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduce) {
        bubble.textContent = text;
        if (onDone) onDone();
        return;
      }
      var chars = Array.from(text);
      var idx = 0;
      bubble.textContent = '';
      var interval = setInterval(function () {
        if (idx >= chars.length) {
          clearInterval(interval);
          if (onDone) onDone();
          return;
        }
        bubble.textContent += chars[idx];
        idx++;
      }, 14);
    }

    function showError(slot, type, retryAfterSec, onRetry) {
      slot.innerHTML = '';
      var banner = document.createElement('div');
      banner.className = 'kernel-chat-policy-banner kernel-chat-policy-banner--' + (type === 'rate_limit' || type === 'network' || type === 'timeout' ? 'warning' : type === 'unavailable' ? 'info' : 'danger');
      banner.setAttribute('role', 'alert');
      banner.setAttribute('aria-live', 'polite');

      var title, msg;
      switch (type) {
        case 'rate_limit':
          title = 'تم تجاوز حد الطلبات';
          msg = retryAfterSec ? 'حاول بعد ' + retryAfterSec + ' ثانية.' : 'حاول بعد لحظات.';
          break;
        case 'unavailable':
          title = 'المساعد في وضع تجريبي';
          msg = 'نقطة الاتصال /api/ai/chat غير متاحة في هذه البيئة. سترى ردوداً توضيحية. للتفعيل الكامل، تواصل مع فريق BrightAI.';
          break;
        case 'provider_failed':
          title = 'الخدمة مؤقتاً غير متاحة';
          msg = 'حاول مرة أخرى لاحقاً.';
          break;
        case 'network':
          title = 'تعذّر الاتصال';
          msg = 'تحقق من اتصالك بالإنترنت.';
          break;
        case 'timeout':
          title = 'انتهت مهلة الاستجابة';
          msg = 'حاول بسؤال أقصر.';
          break;
        default:
          title = 'حدث خطأ غير متوقع';
          msg = 'حاول مرة ثانية.';
      }

      var bodyHtml =
        '<div class="kernel-chat-policy-banner__body">' +
          '<p class="kernel-chat-policy-banner__title">' + title + '</p>' +
          '<p class="kernel-chat-policy-banner__msg">' + msg + '</p>';

      // Add retry button for provider_failed when a retry callback is provided
      if (type === 'provider_failed' && typeof onRetry === 'function') {
        bodyHtml +=
          '<button type="button" class="kernel-ai-assistant__retry-btn" data-kai-retry>' +
            'إعادة المحاولة' +
          '</button>';
      }

      bodyHtml += '</div>';

      banner.innerHTML =
        '<span class="kernel-chat-policy-banner__icon" aria-hidden="true">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>' +
        '</span>' +
        bodyHtml;

      slot.appendChild(banner);

      // Bind retry click
      if (type === 'provider_failed' && typeof onRetry === 'function') {
        var retryBtn = banner.querySelector('[data-kai-retry]');
        if (retryBtn) {
          retryBtn.addEventListener('click', function (e) {
            e.preventDefault();
            onRetry();
          });
        }
      }
    }
    function hideError(slot) {
      slot.innerHTML = '';
    }

    function init() {
      $$('[data-kernel-ai-assistant]').forEach(function (root) {
        if (root.dataset.bound === '1') return;
        root.dataset.bound = '1';

        var form = $('[data-kernel-ai-form]', root);
        var input = $('[data-kernel-ai-input]', root);
        var sendBtn = $('[data-kernel-ai-send]', root);
        var thread = $('[data-kernel-ai-thread]', root);
        var typing = $('[data-kernel-ai-typing]', root);
        var skeleton = $('[data-kernel-ai-skeleton]', root);
        var errorSlot = $('[data-kernel-ai-error-slot]', root);
        var cta = $('[data-kernel-ai-cta]', root);
        var ctaLink = $('[data-kernel-ai-cta-link]', root);
        var clearBtn = $('[data-kernel-ai-clear]', root);

        if (!form || !input || !thread) return;

        var promptId = root.dataset.promptId || '';
        var maxTurns = parseInt(root.dataset.maxTurns, 10) || 6;
        var storageKey = root.dataset.storageKey;
        var storage = safeStorage();
        var apiAvailability = null; // null = untested, true = ok, false = 404
        var userTurnCount = 0;
        var currentController = null;
        var lastUserText = ''; // stores last sent text for retry

        // استرجاع المحادثة من sessionStorage
        var history = loadHistory(storage, storageKey);
        if (history.length > 0) {
          history.forEach(function (turn) {
            renderMessage(thread, turn.role, turn.text);
          });
          userTurnCount = history.filter(function (t) { return t.role === 'user'; }).length;
          if (userTurnCount >= 3) cta.hidden = false;
        }

        // مسح المحادثة
        if (clearBtn) {
          clearBtn.addEventListener('click', function () {
            if (currentController) {
              currentController.abort();
              currentController = null;
            }
            history = [];
            if (storage) storage.removeItem(storageKey);
            thread.innerHTML = '<div class="kernel-ai-assistant__empty" data-kernel-ai-empty><p>لم يبدأ أي سؤال بعد. اكتب سؤالك في الأسفل وستحصل على إجابة متخصصة.</p></div>';
            cta.hidden = true;
            userTurnCount = 0;
            input.focus();
          });
        }

        // CTA link → smooth scroll to lead form
        if (ctaLink) {
          ctaLink.addEventListener('click', function (e) {
            var targetId = ctaLink.getAttribute('href');
            if (targetId && targetId.startsWith('#')) {
              var target = document.querySelector(targetId);
              if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                var firstInput = target.querySelector('input,textarea');
                if (firstInput) setTimeout(function () { firstInput.focus(); }, 400);
              }
            }
          });
        }

        function send(retryText) {
          var raw = retryText || input.value;
          if (!raw || !raw.trim()) return;

          var userText = raw.trim();
          lastUserText = userText;
          if (!retryText) input.value = '';
          if (sendBtn) sendBtn.disabled = true;
          hideError(errorSlot);
          typing.hidden = false;
          if (skeleton) skeleton.hidden = false;
          thread.setAttribute('aria-busy', 'true');

          // ارسم رسالة المستخدم
          renderMessage(thread, 'user', userText);
          history.push({ role: 'user', text: userText });
          saveHistory(storage, storageKey, history);

          // EXEC-10 (2026-07-29): chat_started — fires on every user send.
          // Best-effort via the global analytics surface (inline script,
          // can't import TS directly like lead-form-handler.js).
          if (window.__BRIGHTAI_ANALYTICS__ && typeof window.__BRIGHTAI_ANALYTICS__.track === 'function') {
            window.__BRIGHTAI_ANALYTICS__.track('chat_started', {
              prompt_id: promptId,
              page_path: window.location.pathname,
            });
          }

          // عند 3+ رسائل، أظهر CTA
          userTurnCount++;
          if (userTurnCount >= 3 && cta) cta.hidden = false;

          function finalize(text, isDemo) {
            typing.hidden = true;
            if (skeleton) skeleton.hidden = true;
            var article = renderMessage(thread, 'ai', '');
            streamInto(article.querySelector('.kernel-ai-assistant__bubble'), text, function () {
              thread.setAttribute('aria-busy', 'false');
              if (sendBtn) sendBtn.disabled = false;
              input.focus();
              // EXEC-10 (2026-07-29): chat_completed — fires only after a
              // REAL API reply finishes streaming. Demo/degraded replies
              // (isDemo === true) are excluded so the event counts genuine
              // model turns only.
              if (!isDemo && window.__BRIGHTAI_ANALYTICS__ && typeof window.__BRIGHTAI_ANALYTICS__.track === 'function') {
                window.__BRIGHTAI_ANALYTICS__.track('chat_completed', {
                  prompt_id: promptId,
                  page_path: window.location.pathname,
                });
              }
            });
            history.push({ role: 'ai', text: text, demo: !!isDemo });
            saveHistory(storage, storageKey, history);
          }

          // لو الـ API مو متاح (404 سابقاً) → demo مباشرة
          if (apiAvailability === false) {
            showError(errorSlot, 'unavailable');
            setTimeout(function () {
              finalize(pickDemo(), true);
            }, 600);
            return;
          }

          var activeControllers = window.__kassActiveControllers || [];
          window.__kassActiveControllers = activeControllers;

          if (!window.__kassNavListenerBound) {
            window.__kassNavListenerBound = true;
            document.addEventListener('astro:before-preparation', function () {
              while (activeControllers.length > 0) {
                var ctrl = activeControllers.pop();
                if (ctrl) ctrl.abort();
              }
            });
          }

          if (currentController) {
            currentController.abort();
          }
          currentController = new AbortController();
          activeControllers.push(currentController);

          function handleStream(res) {
            var reader = res.body.getReader();
            var decoder = new TextDecoder('utf-8');
            var buffer = '';
            var fullReplyText = '';
            var bubble = null;
            var messageArticle = null;

            var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

            function finishStream() {
              var idx = activeControllers.indexOf(currentController);
              if (idx > -1) activeControllers.splice(idx, 1);
              currentController = null;

              thread.setAttribute('aria-busy', 'false');
              if (sendBtn) sendBtn.disabled = false;
              input.focus();
            }

            function processEvent(event, dataStr) {
              try {
                var data = JSON.parse(dataStr);
                if (event === 'token') {
                  if (data.delta) {
                    fullReplyText += data.delta;
                    if (!bubble) {
                      typing.hidden = true;
                      if (skeleton) skeleton.hidden = true;
                      messageArticle = renderMessage(thread, 'ai', '');
                      bubble = messageArticle.querySelector('.kernel-ai-assistant__bubble');
                    }
                    if (!reduceMotion) {
                      bubble.textContent = fullReplyText;
                      thread.scrollTop = thread.scrollHeight;
                    }
                  }
                } else if (event === 'done') {
                  if (!bubble) {
                    typing.hidden = true;
                    if (skeleton) skeleton.hidden = true;
                    messageArticle = renderMessage(thread, 'ai', '');
                    bubble = messageArticle.querySelector('.kernel-ai-assistant__bubble');
                  }
                  if (reduceMotion) {
                    bubble.textContent = fullReplyText;
                    thread.scrollTop = thread.scrollHeight;
                  }
                  history.push({ role: 'ai', text: fullReplyText, demo: false });
                  saveHistory(storage, storageKey, history);
                } else if (event === 'error') {
                  showError(errorSlot, 'provider_failed', undefined, function () {
                    send(lastUserText);
                  });
                  if (!bubble) {
                    typing.hidden = true;
                    if (skeleton) skeleton.hidden = true;
                  }
                }
              } catch (e) {
                // Ignore malformed JSON frames
              }
            }

            function read() {
              return reader.read().then(function (result) {
                if (result.done) {
                  finishStream();
                  return;
                }
                buffer += decoder.decode(result.value, { stream: true });
                var lines = buffer.split('\n');
                buffer = lines.pop();

                var currentEvent = '';
                for (var i = 0; i < lines.length; i++) {
                  var line = lines[i].trim();
                  if (!line) continue;

                  if (line.indexOf('event: ') === 0) {
                    currentEvent = line.slice(7).trim();
                  } else if (line.indexOf('data: ') === 0) {
                    var dataStr = line.slice(6).trim();
                    processEvent(currentEvent, dataStr);
                  }
                }
                return read();
              }).catch(function (err) {
                if (err.name === 'AbortError') return;
                showError(errorSlot, 'network');
                typing.hidden = true;
                if (skeleton) skeleton.hidden = true;
                thread.setAttribute('aria-busy', 'false');
                if (sendBtn) sendBtn.disabled = false;
              });
            }

            return read();
          }

          // جرّب /api/ai/chat/ (مع trailing slash لتفادي 301 → method change)
          // KRN-001 / EXEC-02: نرسل promptId فقط — السيرفر يرفض أي prompt نصي من العميل.
          // السيرفر يبحث عن النص الفعلي من allowlist الخادم (server-side).
          fetch('/api/ai/chat/', {
            method: 'POST',
            headers: {
              'Accept': 'text/event-stream, application/json',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message: userText, promptId: promptId, provider: 'auto' }),
            signal: currentController.signal
          })
            .then(function (res) {
              if (res.status === 404) {
                apiAvailability = false;
                showError(errorSlot, 'unavailable');
                return null;
              }
              if (res.status === 429) {
                var retryAfter = parseInt(res.headers.get('Retry-After') || '60', 10);
                showError(errorSlot, 'rate_limit', retryAfter);
                return null;
              }
              if (res.status === 502) {
                showError(errorSlot, 'provider_failed', undefined, function () {
                  send(lastUserText);
                });
                return null;
              }
              if (res.status === 504) {
                showError(errorSlot, 'timeout');
                return null;
              }
              if (!res.ok) {
                showError(errorSlot, 'unknown');
                return null;
              }

              var contentType = res.headers.get('content-type') || '';
              // Check for X-Stream-Status header on non-SSE responses
              var streamStatus = res.headers.get('X-Stream-Status');
              if (streamStatus === 'all_providers_failed') {
                showError(errorSlot, 'provider_failed', undefined, function () {
                  send(lastUserText);
                });
                typing.hidden = true;
                if (skeleton) skeleton.hidden = true;
                thread.setAttribute('aria-busy', 'false');
                if (sendBtn) sendBtn.disabled = false;
                return null;
              }
              if (contentType.indexOf('text/event-stream') > -1) {
                apiAvailability = true;
                return handleStream(res);
              } else {
                return res.json().then(function (data) {
                  if (!data) return;
                  if (data && data.reply) {
                    apiAvailability = true;
                    finalize(data.reply, false);
                  } else {
                    showError(errorSlot, 'unknown');
                    typing.hidden = true;
                    if (skeleton) skeleton.hidden = true;
                    thread.setAttribute('aria-busy', 'false');
                    if (sendBtn) sendBtn.disabled = false;
                  }
                });
              }
            })
            .catch(function (err) {
              if (err.name === 'AbortError') return;
              showError(errorSlot, 'network');
              typing.hidden = true;
              if (skeleton) skeleton.hidden = true;
              thread.setAttribute('aria-busy', 'false');
              if (sendBtn) sendBtn.disabled = false;
            });
        }

        form.addEventListener('submit', function (e) { e.preventDefault(); send(); });
        if (sendBtn) sendBtn.addEventListener('click', send);
        input.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            send();
          }
        });
      });
    }

    document.addEventListener('astro:page-load', init);
    if (document.readyState !== 'loading') init();
  })();
