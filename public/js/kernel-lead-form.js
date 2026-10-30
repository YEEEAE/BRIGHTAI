(function () {
    'use strict';

    function $(q, root) { return (root || document).querySelector(q); }
    function $$(q, root) { return Array.prototype.slice.call((root || document).querySelectorAll(q)); }

    function isValidEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }
    function isValidPhone(v) { return /^\+?\d{8,15}$/.test(v.replace(/[\s-]/g, '')); }

    function validateField(field) {
      var name = field.name;
      var value = field.value.trim();
      var error = '';
      if (!value) {
        error = 'هذا الحقل مطلوب';
      } else if (name === 'name' && value.length < 2) {
        error = 'الاسم قصير جداً (الحد الأدنى حرفان)';
      } else if (name === 'name' && value.length > 100) {
        error = 'الاسم طويل جداً (الحد الأقصى 100 حرف)';
      } else if (name === 'contact') {
        if (value.length > 120) {
          error = 'القيمة طويلة جداً';
        } else if (!isValidEmail(value) && !isValidPhone(value)) {
          error = 'أدخل بريد إلكتروني صحيح أو رقم جوال دولي يبدأ بـ +';
        }
      } else if (name === 'company' && value.length < 2) {
        error = 'اسم الشركة قصير جداً (الحد الأدنى حرفان)';
      } else if (name === 'company' && value.length > 120) {
        error = 'اسم الشركة طويل جداً (الحد الأقصى 120 حرف)';
      }
      var errorEl = $('[data-kernel-lead-error="' + name + '"]', field.closest('[data-kernel-lead-form]'));
      if (error) {
        field.setAttribute('aria-invalid', 'true');
        if (errorEl) {
          errorEl.textContent = error;
          errorEl.hidden = false;
        }
        return false;
      } else {
        field.removeAttribute('aria-invalid');
        if (errorEl) {
          errorEl.textContent = '';
          errorEl.hidden = true;
        }
        return true;
      }
    }

    function buildWhatsAppUrl(name, contact, company, page, ctx) {
      // K1 (2026-07-18): include journey metadata in the WhatsApp fallback
      // so the sales team receives sector + riskBand without us storing PII
      // in the URL.
      ctx = ctx || {};
      var text = 'طلب تواصل من BrightAI Kernel' + '%0A' +
                 '— — — — — — — — — —' + '%0A' +
                 'الاسم: ' + encodeURIComponent(name) + '%0A' +
                 'التواصل: ' + encodeURIComponent(contact) + '%0A' +
                 'الشركة: ' + encodeURIComponent(company) + '%0A' +
                 'الصفحة: ' + encodeURIComponent(page) + '%0A';
      if (ctx.scenario) {
        text += 'السيناريو: ' + encodeURIComponent(ctx.scenario) + '%0A';
        text += 'القطاع: ' + encodeURIComponent(ctx.sector || '—') + '%0A';
        text += 'مستوى المخاطر: ' + encodeURIComponent(ctx.riskBand || '—') + '%0A';
        text += 'مرحلة الرحلة: ' + encodeURIComponent(ctx.journeyStage || '—') + '%0A';
      }
      text += '— — — — — — — — — —' + '%0A' +
              'أرسلت من نموذج Kernel Lead Capture';
      return 'https://wa.me/966538229013?text=' + text;
    }

    function init() {
      $$('[data-kernel-lead-form]').forEach(function (root) {
        if (root.dataset.bound === '1') return;
        root.dataset.bound = '1';

        var form = $('[data-kernel-lead-form-element]', root);
        if (!form) return;

        var page = root.dataset.page || (location.pathname.replace(/\/$/, '') || '/');
        var submitBtn = $('[data-kernel-lead-submit]', root);
        var errorAlert = $('[data-kernel-lead-alert="error"]', root);
        var successAlert = $('[data-kernel-lead-alert="success"]', root);
        var apiAvailability = null; // null = untested, true = ok, false = 404

        // تحقق فوري عند الكتابة
        $$('input', form).forEach(function (input) {
          input.addEventListener('blur', function () { validateField(input); });
        });

        function showError(msg) {
          errorAlert.textContent = msg;
          errorAlert.hidden = false;
        }
        function hideError() {
          errorAlert.textContent = '';
          errorAlert.hidden = true;
        }

        function submitForm(payload) {
          var idempotencyStorageKey = 'brightai:lead-idempotency:' + (root.dataset.formId || 'kernel-lead-form');
          var submittedStoragePrefix = 'brightai:lead-submitted:' + (root.dataset.formId || 'kernel-lead-form') + ':';
          var idempotencyKey;
          try {
            idempotencyKey = sessionStorage.getItem(idempotencyStorageKey);
            if (!idempotencyKey) {
              idempotencyKey = window.crypto && typeof window.crypto.randomUUID === 'function'
                ? window.crypto.randomUUID()
                : String(Date.now()) + '-' + Math.random().toString(36).slice(2);
              sessionStorage.setItem(idempotencyStorageKey, idempotencyKey);
            }
          } catch (e) {
            idempotencyKey = String(Date.now()) + '-' + Math.random().toString(36).slice(2);
          }
          // CSRF-LEAD-001: double-submit cookie pattern.
          // نقرأ الـ token من الـ cookie (الـ server ضبطه عبر /api/csrf-token/).
          // لو الـ 403 رجع → refresh + retry مرة وحدة.
          function doPost(csrfToken) {
            var headers = { 'Content-Type': 'application/json' };
            headers['Idempotency-Key'] = idempotencyKey;
            var analytics = window.__BRIGHTAI_ANALYTICS__;
            if (analytics && analytics.getConsent && analytics.getConsent() === 'granted') {
              headers['X-Analytics-Consent'] = 'granted';
            }
            if (csrfToken) headers['X-CSRF-Token'] = csrfToken;
            return fetch('/api/lead/', {
              method: 'POST',
              headers: headers,
              body: JSON.stringify(payload),
            });
          }

          var token = readCookie('csrf');

          doPost(token)
            .then(function (res) {
              if (res.status === 403) {
                // token expired أو غير موجود → refresh + retry مرة وحدة.
                return fetchCsrfToken().then(function (newToken) {
                  if (!newToken) {
                    // /api/csrf-token ما رجع شي (404 = static build).
                    apiAvailability = false;
                    var url = buildWhatsAppUrl(payload.name, payload.contact, payload.company, payload.page, { scenario: payload.scenario, sector: payload.sector, riskBand: payload.riskBand, journeyStage: payload.journeyStage });
                    window.open(url, '_blank', 'noopener,noreferrer');
                    showSuccess('لم نتمكن من إرسال النموذج من المتصفح. تم فتح واتساب تلقائياً مع تفاصيلك.');
                    trackLeadSubmitted('whatsapp_fallback');
                    return null;
                  }
                  return doPost(newToken);
                });
              }
              return res;
            })
            .then(function (res) {
              if (!res) return; // handled above (fallback to wa.me)
              if (res.status === 404) {
                apiAvailability = false;
                var url = buildWhatsAppUrl(payload.name, payload.contact, payload.company, payload.page, { scenario: payload.scenario, sector: payload.sector, riskBand: payload.riskBand, journeyStage: payload.journeyStage });
                window.open(url, '_blank', 'noopener,noreferrer');
                showSuccess('لم نتمكن من إرسال النموذج من المتصفح. تم فتح واتساب تلقائياً مع تفاصيلك.');
                trackLeadSubmitted('whatsapp_fallback');
                return;
              }
              if (res.status === 429) {
                showError('تم تجاوز حد الطلبات. حاول بعد دقيقة.');
                submitBtn.disabled = false;
                submitBtn.removeAttribute('data-state');
                submitBtn.setAttribute('aria-busy', 'false');
                return;
              }
              if (!res.ok) {
                showError('حدث خطأ في الإرسال. حاول مرة ثانية أو تواصل عبر واتساب 966538229013.');
                submitBtn.disabled = false;
                submitBtn.removeAttribute('data-state');
                submitBtn.setAttribute('aria-busy', 'false');
                return;
              }
              return res.json();
            })
            .then(function (data) {
              if (data && data.ok) {
                showSuccess(data.message || 'تم استلام طلبك بنجاح. فريق الحوكمة سيتواصل معك خلال 24 ساعة.');
                form.reset();
                var wasAlreadyTracked = false;
                try {
                  wasAlreadyTracked = sessionStorage.getItem(submittedStoragePrefix + idempotencyKey) === '1';
                  sessionStorage.setItem(submittedStoragePrefix + idempotencyKey, '1');
                } catch (e) {}
                if (!wasAlreadyTracked) trackLeadSubmitted('api', data.idempotencyKey || idempotencyKey);
              }
            })
            .catch(function () {
              // network error → fallback to wa.me
              var url = buildWhatsAppUrl(payload.name, payload.contact, payload.company, payload.page, { scenario: payload.scenario, sector: payload.sector, riskBand: payload.riskBand, journeyStage: payload.journeyStage });
              window.open(url, '_blank', 'noopener,noreferrer');
              showSuccess('تعذّر إرسال النموذج. تم فتح واتساب تلقائياً مع تفاصيلك.');
              trackLeadSubmitted('whatsapp_fallback');
            })
            .finally(function () {
              if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.removeAttribute('data-state');
                submitBtn.setAttribute('aria-busy', 'false');
              }
            });
        }

        // ─── CSRF helpers (CSRF-LEAD-001) ───────────────────────────
        function readCookie(name) {
          var match = document.cookie.match(
            new RegExp('(?:^|;\\s*)' + name + '=([^;]+)')
          );
          return match ? decodeURIComponent(match[1]) : null;
        }

        function fetchCsrfToken() {
          return fetch('/api/csrf-token/', {
            method: 'GET',
            credentials: 'same-origin',
          })
            .then(function (r) {
              if (!r.ok) return null;
              return r.json();
            })
            .then(function (data) {
              return data && data.token ? data.token : null;
            })
            .catch(function () {
              return null;
            });
        }

        function showSuccess(msg) {
          successAlert.querySelector('p').textContent = msg;
          successAlert.hidden = false;
          form.style.display = 'none';
          successAlert.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        form.addEventListener('submit', function (e) {
          e.preventDefault();
          hideError();

          var nameInput = $('input[name="name"]', form);
          var contactInput = $('input[name="contact"]', form);
          var companyInput = $('input[name="company"]', form);

          var ok = validateField(nameInput) &
                   validateField(contactInput) &
                   validateField(companyInput);
          if (!ok) {
            showError('يرجى تعبئة الحقول المطلوبة بشكل صحيح.');
            return;
          }

          var rt = window.__BRIGHTAI_ANALYTICS__;
          if (rt && typeof rt.track === 'function') {
            rt.track('form_submit_attempt', {
              form_id: root.dataset.formId || 'kernel-lead-form',
              form_type: 'demo',
            });
          }

          submitBtn.disabled = true;
          submitBtn.setAttribute('data-state', 'loading');
          submitBtn.setAttribute('aria-busy', 'true');

          // KERNEL-ANALYTICS: demo_submit fires only after API acceptance.
          // WhatsApp fallback is a handoff, not an accepted lead. Only the
          // form identifiers are sent; the shared runtime enforces consent.
          function trackLeadSubmitted(channel, eventId) {
            var rt = window.__BRIGHTAI_ANALYTICS__;
            if (!rt || typeof rt.track !== 'function') return;
            if (channel !== 'api') return;
            rt.track(rt.events.DEMO_SUBMIT, {
              form_id: root.dataset.formId || 'kernel-lead-form',
              form_type: 'demo',
              event_id: eventId,
            });
          }

          // K1 (2026-07-18): pick up journey context (scenario + sector +
          // riskBand + journeyStage + ts) injected by KernelJourneyContext.
          // All values are non-PII metadata (slugs only). Empty when the user
          // arrived without selecting a scenario.
          var scenarioEl = $('input[name="scenario"]', form);
          var sectorEl = $('input[name="sector"]', form);
          var riskBandEl = $('input[name="riskBand"]', form);
          var journeyStageEl = $('input[name="journeyStage"]', form);
          var journeyTsEl = $('input[name="journeyTs"]', form);

          var payload = {
            name: nameInput.value.trim(),
            contact: contactInput.value.trim(),
            company: companyInput.value.trim(),
            page: page,
            source: 'kernel-lead-form',
            ts: new Date().toISOString(),
            // K1: non-PII journey metadata (slugs only)
            scenario: scenarioEl ? scenarioEl.value : '',
            sector: sectorEl ? sectorEl.value : '',
            riskBand: riskBandEl ? riskBandEl.value : '',
            journeyStage: journeyStageEl ? journeyStageEl.value : '',
            journeyTs: journeyTsEl ? journeyTsEl.value : '',
          };

          submitForm(payload);
        });
      });
    }

    document.addEventListener('astro:page-load', init);
    if (document.readyState !== 'loading') init();
  })();
