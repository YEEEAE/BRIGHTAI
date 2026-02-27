/**
 * BRIGHT AI - INDEX THEME INTERACTIONS
 * Shared, guarded behaviors extracted from index.html
 */
(function () {
    'use strict';

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const whenIdle = (cb, timeout = 1200) => {
        if ('requestIdleCallback' in window) {
            requestIdleCallback(cb, { timeout });
        } else {
            setTimeout(cb, timeout);
        }
    };

    function initializeGa4ConversionTracking() {
        if (window.__brightAiGa4TrackingInitialized) return;
        window.__brightAiGa4TrackingInitialized = true;

        const trackerVersion = '2026-02-23';
        const pagePath = window.location.pathname || '/';
        let chatStartTracked = false;
        let chatWidgetOpenTracked = false;
        let technicalPerformanceSent = false;
        let pendingFlushTimer = null;
        const pendingEvents = [];
        const performanceState = {
            fcp: null,
            lcp: null,
            cls: 0,
        };

        function sanitizePayload(payload) {
            const clean = {};
            Object.keys(payload || {}).forEach((key) => {
                const value = payload[key];
                if (value !== undefined && value !== null && value !== '') clean[key] = value;
            });
            return clean;
        }

        function flushPendingEvents() {
            if (typeof window.gtag !== 'function' || pendingEvents.length === 0) return;
            while (pendingEvents.length) {
                const queued = pendingEvents.shift();
                window.gtag('event', queued.eventName, queued.payload);
            }
            if (pendingFlushTimer) {
                clearInterval(pendingFlushTimer);
                pendingFlushTimer = null;
            }
        }

        function schedulePendingFlush() {
            if (pendingFlushTimer) return;
            pendingFlushTimer = setInterval(() => {
                if (typeof window.gtag === 'function') flushPendingEvents();
            }, 250);
            setTimeout(() => {
                if (pendingFlushTimer) {
                    clearInterval(pendingFlushTimer);
                    pendingFlushTimer = null;
                }
            }, 20000);
        }

        function trackEvent(eventName, payload) {
            const eventPayload = sanitizePayload({
                page_path: pagePath,
                tracker_version: trackerVersion,
                ...payload,
            });
            try {
                if (typeof window.gtag === 'function') {
                    window.gtag('event', eventName, eventPayload);
                } else {
                    pendingEvents.push({ eventName, payload: eventPayload });
                    schedulePendingFlush();
                }
            } catch (error) {
                console.warn('[GA4] Failed to track event:', eventName, error);
            }
        }

        function inferFormType(form) {
            const explicitType = (form.getAttribute('data-form-type') || '').trim().toLowerCase();
            if (explicitType) return explicitType;

            const hint = [
                form.id,
                form.getAttribute('name'),
                form.getAttribute('class'),
                form.getAttribute('action'),
                pagePath,
            ].join(' ').toLowerCase();

            if (hint.includes('search')) return null;
            if (hint.includes('contact') || pagePath.includes('/contact/')) return 'contact';
            if (hint.includes('consult') || pagePath.includes('/consultation/')) return 'consultation';
            if (hint.includes('demo')) return 'demo';
            return 'general';
        }

        function inferChatProfile(target) {
            const container = target && target.closest
                ? target.closest('.chat-container, #chatWindow, #chatWidget, .chat-window, .chat-widget')
                : null;
            const profile = container && container.dataset ? container.dataset.chatbotProfile : '';
            if (profile) return profile;
            if (pagePath.includes('/ai-bots/')) return 'ai-bot-page';
            return 'default';
        }

        function findChatInput(target) {
            const container = target && target.closest
                ? target.closest('.chat-container, #chatWindow, #chatWidget, .chat-window, .chat-widget')
                : null;
            if (container) {
                return container.querySelector('#chatInput, #userInput, textarea, input[type="text"], input:not([type])');
            }
            return document.querySelector('#chatInput, #userInput');
        }

        function trackChatStart(source, target) {
            if (chatStartTracked) return;
            chatStartTracked = true;
            const profile = inferChatProfile(target || document.body);
            trackEvent('chat_start', {
                trigger_source: source,
                chat_profile: profile,
            });
            trackEvent('generate_lead', {
                lead_channel: 'chat',
                interaction_type: 'chat_start',
                chat_profile: profile,
            });
            trackEvent('qualify_lead', {
                lead_channel: 'chat',
                qualification_stage: 'mql',
                qualification_source: source,
                chat_profile: profile,
            });
        }

        function trackLeadClosed(detail = {}) {
            trackEvent('close_convert_lead', {
                lead_channel: detail.lead_channel || 'crm',
                lead_id: detail.lead_id,
                deal_id: detail.deal_id,
                value: detail.value,
                currency: detail.currency || 'SAR',
                close_reason: detail.close_reason || 'won',
            });
        }

        function trackPurchase(detail = {}) {
            trackEvent('purchase', {
                transaction_id: detail.transaction_id || detail.order_id || `tx_${Date.now()}`,
                value: detail.value,
                currency: detail.currency || 'SAR',
                payment_method: detail.payment_method,
                coupon: detail.coupon,
                tax: detail.tax,
                shipping: detail.shipping,
                affiliation: detail.affiliation || 'BrightAI',
            });
        }

        function trackTechnicalPerformance() {
            if (technicalPerformanceSent) return;
            technicalPerformanceSent = true;

            const navigation = performance.getEntriesByType('navigation')[0];
            const payload = {
                navigation_type: navigation ? navigation.type : 'unknown',
            };

            if (navigation) {
                if (navigation.loadEventEnd > 0) payload.page_load_ms = Math.round(navigation.loadEventEnd);
                if (navigation.domContentLoadedEventEnd > 0) payload.dom_content_loaded_ms = Math.round(navigation.domContentLoadedEventEnd);
                if (navigation.responseStart > 0) payload.ttfb_ms = Math.round(navigation.responseStart);
            }
            if (typeof performanceState.fcp === 'number') payload.fcp_ms = Math.round(performanceState.fcp);
            if (typeof performanceState.lcp === 'number') payload.lcp_ms = Math.round(performanceState.lcp);
            if (typeof performanceState.cls === 'number') payload.cls_milli = Math.round(performanceState.cls * 1000);

            trackEvent('technical_performance', payload);
        }

        document.addEventListener('submit', (event) => {
            const form = event.target;
            if (!(form instanceof HTMLFormElement)) return;
            const formType = inferFormType(form);
            if (!formType) return;

            const formAction = form.getAttribute('action') || 'inline';
            const formId = form.id || form.getAttribute('name') || 'anonymous_form';
            const inputCount = form.querySelectorAll('input, textarea, select').length;

            trackEvent('lead_form_submit', {
                form_type: formType,
                form_id: formId,
                form_action: formAction.slice(0, 120),
                input_count: inputCount,
            });
            trackEvent('generate_lead', {
                lead_channel: 'form',
                form_type: formType,
                form_id: formId,
            });
            trackEvent('qualify_lead', {
                lead_channel: 'form',
                qualification_stage: 'mql',
                qualification_source: 'form_submit',
                form_type: formType,
                form_id: formId,
            });
        }, true);

        document.addEventListener('click', (event) => {
            const link = event.target && event.target.closest ? event.target.closest('a[href]') : null;
            if (link) {
                const href = (link.getAttribute('href') || '').trim();
                if (/wa\.me|whatsapp\.com/i.test(href)) {
                    trackEvent('whatsapp_click', {
                        destination_host: 'whatsapp',
                    });
                    trackEvent('generate_lead', {
                        lead_channel: 'whatsapp',
                        interaction_type: 'click',
                    });
                    trackEvent('qualify_lead', {
                        lead_channel: 'whatsapp',
                        qualification_stage: 'mql',
                        qualification_source: 'whatsapp_click',
                    });
                } else if (href.startsWith('mailto:')) {
                    trackEvent('contact_email_click', {
                        lead_channel: 'email',
                    });
                } else if (href.startsWith('tel:')) {
                    trackEvent('contact_phone_click', {
                        lead_channel: 'phone',
                    });
                }
            }

            const chatToggle = event.target && event.target.closest
                ? event.target.closest('#chatFab, #chatToggle, .chat-fab, [data-chat-open="true"]')
                : null;
            if (chatToggle && !chatWidgetOpenTracked) {
                chatWidgetOpenTracked = true;
                trackEvent('chat_widget_open', {
                    chat_profile: inferChatProfile(chatToggle),
                });
            }

            const quickAction = event.target && event.target.closest
                ? event.target.closest('.qbtn, .quick-action-btn, .option-button')
                : null;
            if (quickAction) {
                trackChatStart('quick_action', quickAction);
            }

            const chatSendTrigger = event.target && event.target.closest
                ? event.target.closest('#chatSend, #sendButton, .chat-container button[type="submit"], [data-chat-send]')
                : null;
            if (chatSendTrigger) {
                const input = findChatInput(chatSendTrigger);
                const hasText = input && typeof input.value === 'string' && input.value.trim().length > 0;
                if (hasText) trackChatStart('message_send_click', chatSendTrigger);
            }
        }, true);

        document.addEventListener('keydown', (event) => {
            if (event.key !== 'Enter') return;
            const target = event.target;
            if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) return;
            if (!target.matches('#chatInput, #userInput, .chat-container input, .chat-container textarea')) return;
            if (!target.value.trim()) return;
            trackChatStart('message_send_enter', target);
        }, true);

        window.addEventListener('brightai:lead_status', (event) => {
            const detail = event && event.detail && typeof event.detail === 'object' ? event.detail : {};
            const stage = String(detail.stage || '').toLowerCase();
            if (stage === 'qualified') {
                trackEvent('qualify_lead', {
                    lead_channel: detail.lead_channel || 'crm',
                    qualification_stage: 'sql',
                    qualification_source: detail.source || 'crm_update',
                    lead_id: detail.lead_id,
                    value: detail.value,
                    currency: detail.currency || 'SAR',
                });
            } else if (stage === 'closed') {
                trackLeadClosed(detail);
            } else if (stage === 'purchase') {
                trackPurchase(detail);
            }
        });

        if ('PerformanceObserver' in window) {
            try {
                const paintObserver = new PerformanceObserver((entryList) => {
                    entryList.getEntries().forEach((entry) => {
                        if (entry.name === 'first-contentful-paint') {
                            performanceState.fcp = entry.startTime;
                        }
                    });
                });
                paintObserver.observe({ type: 'paint', buffered: true });
            } catch (error) {
                console.warn('[GA4] Paint observer unavailable:', error);
            }

            try {
                const lcpObserver = new PerformanceObserver((entryList) => {
                    const entries = entryList.getEntries();
                    const last = entries[entries.length - 1];
                    if (last) performanceState.lcp = last.startTime;
                });
                lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
            } catch (error) {
                console.warn('[GA4] LCP observer unavailable:', error);
            }

            try {
                const clsObserver = new PerformanceObserver((entryList) => {
                    entryList.getEntries().forEach((entry) => {
                        if (!entry.hadRecentInput) {
                            performanceState.cls += entry.value;
                        }
                    });
                });
                clsObserver.observe({ type: 'layout-shift', buffered: true });
            } catch (error) {
                console.warn('[GA4] CLS observer unavailable:', error);
            }
        }

        window.addEventListener('pagehide', trackTechnicalPerformance, { once: true });
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') trackTechnicalPerformance();
        });
        window.addEventListener('load', () => {
            setTimeout(trackTechnicalPerformance, 6000);
        }, { once: true });
        window.addEventListener('online', flushPendingEvents);
        window.addEventListener('focus', flushPendingEvents);
    }

    function initializeGa4GovernanceLayer() {
        if (window.__brightAiGa4GovernanceInitialized) return;
        window.__brightAiGa4GovernanceInitialized = true;

        const measurementId = 'G-8LLESL207Q';
        const pagePath = window.location.pathname || '/';
        const commandQueue = [];
        const storageKeys = {
            userId: 'brightai_user_id_v1',
            attribution: 'brightai_attribution_v1',
        };
        let queueFlushTimer = null;

        function safeGet(storage, key) {
            try {
                return storage.getItem(key);
            } catch (error) {
                return null;
            }
        }

        function safeSet(storage, key, value) {
            try {
                storage.setItem(key, value);
                return true;
            } catch (error) {
                return false;
            }
        }

        function generateAnonId() {
            if (window.crypto && typeof window.crypto.randomUUID === 'function') {
                return `ba_${window.crypto.randomUUID().replace(/-/g, '').slice(0, 24)}`;
            }
            return `ba_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
        }

        function getAnonymousUserId() {
            const existing = safeGet(window.localStorage, storageKeys.userId);
            if (existing) return existing;

            const created = generateAnonId();
            if (!safeSet(window.localStorage, storageKeys.userId, created)) {
                safeSet(window.sessionStorage, storageKeys.userId, created);
            }
            return created;
        }

        function parseAttribution(search) {
            const params = new URLSearchParams(search || '');
            const fields = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'gbraid', 'wbraid'];
            const result = {};
            fields.forEach((field) => {
                const value = (params.get(field) || '').trim();
                if (value) result[field] = value.slice(0, 120);
            });
            return result;
        }

        function readStoredAttribution() {
            const raw = safeGet(window.sessionStorage, storageKeys.attribution);
            if (!raw) return {};
            try {
                const parsed = JSON.parse(raw);
                return parsed && typeof parsed === 'object' ? parsed : {};
            } catch (error) {
                return {};
            }
        }

        function captureAttribution() {
            const previous = readStoredAttribution();
            const current = parseAttribution(window.location.search);
            const hasNewAttribution = Object.keys(current).length > 0;
            const merged = hasNewAttribution
                ? {
                    ...previous,
                    ...current,
                    landing_page: pagePath,
                    captured_at: new Date().toISOString(),
                }
                : previous;

            if (Object.keys(merged).length > 0) {
                safeSet(window.sessionStorage, storageKeys.attribution, JSON.stringify(merged));
            }
            return merged;
        }

        function buildAttributionPayload(attribution) {
            return {
                captured_utm_source: attribution.utm_source,
                captured_utm_medium: attribution.utm_medium,
                captured_utm_campaign: attribution.utm_campaign,
                captured_utm_term: attribution.utm_term,
                captured_utm_content: attribution.utm_content,
                captured_gclid: attribution.gclid,
                captured_gbraid: attribution.gbraid,
                captured_wbraid: attribution.wbraid,
                attribution_landing_page: attribution.landing_page,
            };
        }

        function hasCookieConsent() {
            return safeGet(window.localStorage, 'cookies_ok') === '1';
        }

        function trySendCommand(args) {
            applyEventDefaultsWrapper();
            if (typeof window.gtag === 'function') {
                window.gtag.apply(window, args);
                return true;
            }
            return false;
        }

        function flushQueue() {
            applyEventDefaultsWrapper();
            if (typeof window.gtag !== 'function' || commandQueue.length === 0) return;
            while (commandQueue.length) {
                const args = commandQueue.shift();
                window.gtag.apply(window, args);
            }
            if (queueFlushTimer) {
                clearInterval(queueFlushTimer);
                queueFlushTimer = null;
            }
        }

        function scheduleQueueFlush() {
            if (queueFlushTimer) return;
            queueFlushTimer = setInterval(() => {
                applyEventDefaultsWrapper();
                if (typeof window.gtag === 'function') flushQueue();
            }, 250);
            setTimeout(() => {
                if (queueFlushTimer) {
                    clearInterval(queueFlushTimer);
                    queueFlushTimer = null;
                }
            }, 20000);
        }

        function sendCommand() {
            const args = Array.from(arguments);
            if (!trySendCommand(args)) {
                commandQueue.push(args);
                scheduleQueueFlush();
            }
        }

        function updateConsent(granted, source) {
            sendCommand('consent', 'update', {
                analytics_storage: granted ? 'granted' : 'denied',
                ad_storage: granted ? 'granted' : 'denied',
                ad_user_data: granted ? 'granted' : 'denied',
                ad_personalization: granted ? 'granted' : 'denied',
            });
            sendCommand('event', 'consent_state_update', {
                consent_analytics: granted ? 'granted' : 'denied',
                consent_source: source || 'unknown',
                page_path: pagePath,
            });
        }

        const anonymousUserId = getAnonymousUserId();
        const attribution = captureAttribution();
        const attributionPayload = buildAttributionPayload(attribution);
        const consentGranted = hasCookieConsent();
        const defaultEventPayload = {
            anonymous_user_id: anonymousUserId,
            ...attributionPayload,
        };

        function applyEventDefaultsWrapper() {
            if (typeof window.gtag !== 'function') return;
            if (window.gtag.__brightAiEventDefaultsWrapped) return;

            const originalGtag = window.gtag;
            const wrappedGtag = function () {
                const args = Array.from(arguments);
                if (args[0] === 'event' && typeof args[1] === 'string') {
                    const originalPayload = args[2] && typeof args[2] === 'object' ? args[2] : {};
                    args[2] = {
                        ...defaultEventPayload,
                        ...originalPayload,
                    };
                }
                return originalGtag.apply(window, args);
            };
            wrappedGtag.__brightAiEventDefaultsWrapped = true;
            window.gtag = wrappedGtag;
        }

        sendCommand('consent', 'default', {
            analytics_storage: 'denied',
            ad_storage: 'denied',
            ad_user_data: 'denied',
            ad_personalization: 'denied',
            functionality_storage: 'granted',
            security_storage: 'granted',
            wait_for_update: 500,
        });

        if (consentGranted) {
            updateConsent(true, 'stored_preference');
        }

        sendCommand('config', measurementId, {
            send_page_view: false,
            user_id: anonymousUserId,
        });

        sendCommand('set', 'user_properties', {
            tracking_consent: consentGranted ? 'granted' : 'denied',
            user_type: 'anonymous',
        });

        if (Object.keys(attribution).length > 0) {
            sendCommand('event', 'utm_attribution_capture', {
                ...attributionPayload,
                attribution_scope: 'session',
                page_path: pagePath,
            });
        }

        const cookieOk = document.getElementById('cookieOk');
        if (cookieOk) {
            cookieOk.addEventListener('click', () => {
                updateConsent(true, 'cookie_banner_accept');
            });
        }

        window.addEventListener('online', flushQueue);
        window.addEventListener('focus', flushQueue);
    }

    initializeGa4ConversionTracking();
    initializeGa4GovernanceLayer();

    // Iconify handles icons without runtime setup

    // Loading screen — CLS-Safe approach:
    // 1. Starts with class="loading hide" in HTML (invisible → CLS = 0)
    // 2. JS shows it immediately (removes 'hide') — position:fixed won't cause CLS
    // 3. After page load + 300ms, re-adds 'hide' to fade out
    // 4. After transition ends, removes from DOM entirely
    const loading = document.getElementById('loading');
    if (loading) {
        // Show loading screen (safe: position:fixed doesn't trigger CLS)
        loading.classList.remove('hide');

        window.addEventListener('load', () => {
            setTimeout(() => {
                loading.classList.add('hide');
                // Remove from DOM after fade-out transition completes
                loading.addEventListener('transitionend', () => {
                    loading.remove();
                }, { once: true });
            }, 300);
        });
    }

    // Matrix code background (fake) — optimized for performance
    const matrixEl = document.getElementById('matrixBackground');
    const codeWall = document.querySelector('.code-wall');
    if (matrixEl) {
        const renderMatrix = () => {
            const seedLines = [
                "GET /api/v1/nlp/sentiment 200 78ms",
                "POST /api/v1/nlp/ner 200 64ms",
                "POST /api/v1/nlp/summarize 200 83ms",
                "POST /api/v1/nlp/translate 200 71ms",
                "POST /api/v1/predict/forecast 200 92ms",
                "POST /api/v1/predict/demand 200 88ms",
                "POST /api/v1/predict/risk 200 95ms",
                "POST /api/v1/predict/anomaly 200 69ms",
                "WS /api/v1/speech/stream CONNECTED",
                "POST /api/v1/speech/stt 200 84ms",
                "POST /api/v1/speech/tts 200 79ms",
                "OAuth2 token issued: *****",
                "SDK: python | javascript | java",
                "OpenAPI: swagger.json loaded",
            ];
            // Reduced lines for better Style & Layout performance
            const isMobile = window.matchMedia('(max-width: 768px)').matches;
            const maxLines = isMobile ? 60 : 90;
            let bg = "";
            for (let i = 0; i < maxLines; i++) {
                bg += (seedLines[i % seedLines.length] + "   " + Math.random().toString(16).slice(2) + "\n");
            }
            matrixEl.textContent = bg;
            if (codeWall) codeWall.classList.add('ready');
        };

        // Delay rendering to avoid competing with LCP
        const scheduleMatrix = () => whenIdle(renderMatrix, 2000);
        if (document.readyState === 'complete') scheduleMatrix();
        else window.addEventListener('load', scheduleMatrix, { once: true });
    }

    // Terminal typing animation
    const terminal = document.getElementById('terminalTyping');
    if (terminal && !prefersReducedMotion) {
        const lines = [
            `$ curl -X POST https://api.brightai.site/api/v1/nlp\n  -H "Authorization: Bearer <token>"\n  -d '{"task":"sentiment","text":"الخدمة ممتازة ولكن الدعم يحتاج تحسين"}'`,
            `{ "sentiment":"mixed", "score":0.62, "latency_ms":78 }`,
            "",
            `$ curl -X POST https://api.brightai.site/api/v1/predict\n  -H "Authorization: Bearer <token>"\n  -d '{"task":"forecast","series":[120,140,160,155,172]}'`,
            `{ "forecast":[180, 188, 196], "confidence":0.94, "latency_ms":92 }`,
            "",
            `$ wscat -c wss://api.brightai.site/api/v1/speech/stream`,
            `[connected] real-time transcription: ON`,
            `"مرحبا… أنا أتكلم الآن"  →  "مرحبا… أنا أتكلم الآن"`,
            "",
            `// Swagger/OpenAPI + SDKs Ready`,
            `// SLA: 99.9% | Response: <100ms`,
        ];
        let tLine = 0;
        let tChar = 0;
        let output = "";

        function typeTick() {
            const current = lines[tLine] ?? "";
            output += current.slice(tChar, tChar + 1);
            tChar++;

            if (tChar > current.length) {
                output += "\n";
                tLine++;
                tChar = 0;
                if (tLine >= lines.length) {
                    terminal.innerHTML = output + '<span class="cursor"></span>';
                    setTimeout(() => {
                        output = "";
                        terminal.textContent = "";
                        tLine = 0;
                        tChar = 0;
                        setTimeout(typeTick, 250);
                    }, 1600);
                    return;
                }
                setTimeout(typeTick, 260);
                return;
            }
            terminal.innerHTML = output + '<span class="cursor"></span>';
            setTimeout(typeTick, 18 + Math.random() * 22);
        }

        whenIdle(() => setTimeout(typeTick, 600), 1500);
    }

    // Bento reveal — CLS FIX: show immediately (no staggered delay)
    // Original code used random delays that caused CLS = 1.000
    const bento = [...document.querySelectorAll('[data-order]')];
    if (bento.length) {
        // Show all bentos immediately to prevent CLS
        bento.forEach(el => el.classList.add('show'));
    }

    // Scroll progress + toTop button
    const progressBar = document.getElementById('progressBar');
    const toTop = document.getElementById('toTop');
    if (progressBar || toTop) {
        window.addEventListener('scroll', () => {
            const h = document.documentElement;
            const sc = h.scrollTop;
            const max = h.scrollHeight - h.clientHeight;
            const p = max ? (sc / max) * 100 : 0;
            if (progressBar) progressBar.style.width = p + "%";
            if (toTop) {
                if (sc > 300) toTop.classList.add('show');
                else toTop.classList.remove('show');
            }
        });
    }
    if (toTop) {
        toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    }

    // Interactive 3D tabs demo
    const demoArea = document.getElementById('demoArea');
    const tabs = [...document.querySelectorAll('.tab')];

    function renderDemo(mode) {
        if (!demoArea) return;
        if (mode === 'obj') {
            demoArea.innerHTML = `
          <div class="hint">
            <div>
              <div style="font-weight:1000">Object Detection</div>
              <div style="color:rgba(255,255,255,.62);font-weight:900;margin-top:4px">جرب تحميل صورة (Demo)</div>
            </div>
            <div class="fake-upload"><iconify-icon style="width:16px;height:16px" icon="lucide:upload"></iconify-icon> Upload Image</div>
          </div>
          <div class="viz">
            <div class="box" style="top:28px;right:26px;width:160px;height:170px">
              <div class="label">شخص: 98%</div>
            </div>
            <div class="box" style="top:92px;right:210px;width:220px;height:140px;border-color:rgba(255,209,102,.75)">
              <div class="label" style="border-color:rgba(255,209,102,.35)">سيارة: 95%</div>
            </div>
          </div>
        `;
        }
        if (mode === 'face') {
            demoArea.innerHTML = `
          <div class="hint">
            <div>
              <div style="font-weight:1000">Face Recognition</div>
              <div style="color:rgba(255,255,255,.62);font-weight:900;margin-top:4px">كشف الوجوه والمشاعر (Demo)</div>
            </div>
            <div class="fake-upload"><iconify-icon style="width:16px;height:16px" icon="lucide:user"></iconify-icon> Analyze</div>
          </div>
          <div class="viz">
            <div class="box" style="top:35px;right:120px;width:230px;height:190px;border-color:rgba(255,79,216,.75)">
              <div class="label" style="border-color:rgba(255,79,216,.35)">سعيد: 85% · عمر ~ 29 · ذكر</div>
            </div>
          </div>
        `;
        }
        if (mode === 'ocr') {
            demoArea.innerHTML = `
          <div class="hint">
            <div>
              <div style="font-weight:1000">Text Extraction (OCR)</div>
              <div style="color:rgba(255,255,255,.62);font-weight:900;margin-top:4px">صورة وثيقة → نص مستخرج</div>
            </div>
            <div class="fake-upload"><iconify-icon style="width:16px;height:16px" icon="lucide:scan-text"></iconify-icon> Extract</div>
          </div>
          <div class="viz" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:12px">
            <div style="border:1px solid rgba(255,255,255,.08);border-radius:14px;background:rgba(0,0,0,.26);position:relative;overflow:hidden">
              <div style="padding:12px;color:rgba(255,255,255,.70);font-weight:900">وثيقة (Demo)</div>
              <div style="position:absolute;inset:auto 12px 12px 12px;height:120px;border-radius:12px;border:1px dashed rgba(255,255,255,.14);opacity:.8"></div>
            </div>
            <div style="border:1px solid rgba(255,255,255,.08);border-radius:14px;background:rgba(0,0,0,.26);overflow:hidden">
              <div style="padding:12px;color:rgba(255,255,255,.70);font-weight:900">النص المستخرج</div>
              <div style="padding:0 12px 12px;font-family:var(--mono);font-size:11px;line-height:1.7;color:rgba(87,255,154,.90)">
                رقم المعاملة: 87421<br/>
                الاسم: Bright AI<br/>
                الحالة: مكتمل<br/>
                التاريخ: 2026-02-06
              </div>
            </div>
          </div>
        `;
        }
        if (mode === 'pred') {
            demoArea.innerHTML = `
          <div class="hint">
            <div>
              <div style="font-weight:1000">Predictive Analysis</div>
              <div style="color:rgba(255,255,255,.62);font-weight:900;margin-top:4px">تنبؤات في الوقت الفعلي (Demo)</div>
            </div>
            <div class="fake-upload"><iconify-icon style="width:16px;height:16px" icon="lucide:activity"></iconify-icon> Live</div>
          </div>
          <div class="viz">
            <div class="chart">
              <div class="spark"></div>
              <div class="line"></div>
              <div class="curve"></div>
              <div style="position:absolute;top:14px;right:14px;font-family:var(--mono);color:rgba(255,255,255,.70);font-weight:900;font-size:11px">
                forecast: +12% MoM
              </div>
            </div>
          </div>
        `;
        }

    }

    if (demoArea && tabs.length) {
        renderDemo('obj');
        tabs.forEach(t => {
            t.addEventListener('click', () => {
                tabs.forEach(x => x.classList.remove('active'));
                t.classList.add('active');
                renderDemo(t.dataset.tab);
            });
        });
    }

    // Live stats (fake updating)
    const acc = document.getElementById('acc');
    const lat = document.getElementById('lat');
    const req = document.getElementById('req');
    const models = document.getElementById('models');
    if (acc && lat && req && models) {
        whenIdle(() => {
            setInterval(() => {
                const a = (98.2 + Math.random() * 0.8).toFixed(1);
                const l = (0.11 + Math.random() * 0.10).toFixed(2);
                const r = (15200 + Math.floor(Math.random() * 200)).toLocaleString('en-US');
                const m = 10 + Math.floor(Math.random() * 5);
                acc.textContent = a + "%";
                lat.textContent = l + "s";
                req.textContent = r;
                models.textContent = m;
            }, 1400);
        }, 1500);
    }

    // Portfolio filters
    const filters = [...document.querySelectorAll('.filter')];
    const projects = [...document.querySelectorAll('.project')];
    if (filters.length && projects.length) {
        filters.forEach(f => {
            f.addEventListener('click', () => {
                filters.forEach(x => x.classList.remove('active'));
                f.classList.add('active');
                const val = f.dataset.filter;
                projects.forEach(p => {
                    const ok = val === 'all' || p.dataset.cat === val;
                    p.style.display = ok ? '' : 'none';
                });
            });
        });
    }

    // KPI count-up + bars on view
    const kpiNumbers = [...document.querySelectorAll('.metric .big')];
    const bars = [...document.querySelectorAll('.bar > div')];
    const results = document.getElementById('results');
    if (results && (kpiNumbers.length || bars.length)) {
        whenIdle(() => {
            const obs = new IntersectionObserver((entries) => {
                entries.forEach(e => {
                    if (!e.isIntersecting) return;
                    if (bars.length) bars.forEach(b => b.style.width = b.dataset.fill + "%");
                    if (kpiNumbers.length) {
                        kpiNumbers.forEach(el => {
                            const target = parseFloat(el.dataset.count);
                            const isFloat = ("" + target).includes(".");
                            const start = 0;
                            const duration = 1100;
                            const t0 = performance.now();
                            function step(now) {
                                const p = Math.min(1, (now - t0) / duration);
                                const v = start + (target - start) * p;
                                el.textContent = (isFloat ? v.toFixed(1) : Math.round(v)) + (el.textContent.includes("%") ? "%" : "");
                                if (p < 1) requestAnimationFrame(step);
                            }
                            const suffixPercent = (target <= 100 && el.dataset.count !== "256");
                            el.textContent = suffixPercent ? "0%" : "0";
                            requestAnimationFrame(step);
                        });
                    }
                    obs.disconnect();
                });
            }, { threshold: .25 });
            obs.observe(results);
        }, 1600);
    }

    // ROI calculator (simple fake formula)
    const emp = document.getElementById('emp');
    const ops = document.getElementById('ops');
    const mins = document.getElementById('mins');
    const empVal = document.getElementById('empVal');
    const opsVal = document.getElementById('opsVal');
    const minVal = document.getElementById('minVal');
    const roiOut = document.getElementById('roiOut');

    if (emp && ops && mins && empVal && opsVal && minVal && roiOut) {
        function calcROI() {
            empVal.textContent = emp.value;
            opsVal.textContent = Number(ops.value).toLocaleString('en-US');
            minVal.textContent = mins.value;

            const automation = 0.55;
            const hours = (ops.value * mins.value / 60) * 12 * automation;
            const costPerHour = 120;
            const saving = hours * costPerHour;
            const million = saving / 1_000_000;
            roiOut.textContent = `~${million.toFixed(1)} مليون ريال/سنة`;
        }
        [emp, ops, mins].forEach(x => x.addEventListener('input', calcROI));
        calcROI();
    }

    // FAQ plus/minus icon toggling
    document.querySelectorAll('details').forEach(d => {
        d.addEventListener('toggle', () => {
            const ico = d.querySelector('.pm iconify-icon');
            if (!ico) return;
            ico.setAttribute('icon', d.open ? 'lucide:minus' : 'lucide:plus');
        });
    });

    // Search modal
    const modal = document.getElementById('searchModal');
    const openSearch = document.getElementById('openSearch');
    const searchInput = document.getElementById('searchInput');

    if (modal && openSearch && searchInput) {
        function showModal() {
            modal.classList.add('show');
            setTimeout(() => searchInput.focus(), 50);
        }
        function hideModal() { modal.classList.remove('show'); }

        openSearch.addEventListener('click', showModal);
        modal.addEventListener('click', (e) => { if (e.target === modal) hideModal(); });
        window.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key.toLowerCase() === 'k') { e.preventDefault(); showModal(); }
            if (e.key === 'Escape') hideModal();
        });
        document.querySelectorAll('.res').forEach(r => {
            r.addEventListener('click', () => {
                const jump = r.dataset.jump;
                hideModal();
                const target = document.querySelector(jump);
                if (target) setTimeout(() => target.scrollIntoView({ behavior: 'smooth' }), 120);
            });
        });
    }

    // Chat widget
    const chatFab = document.getElementById('chatFab');
    const chatWindow = document.getElementById('chatWindow');
    const chatClose = document.getElementById('chatClose');
    const chatMin = document.getElementById('chatMin');
    const chatBadge = document.getElementById('chatBadge');
    const chatBody = document.getElementById('chatBody');
    const chatInput = document.getElementById('chatInput');
    const chatSend = document.getElementById('chatSend');
    const typing = document.getElementById('typing');
    const chatApiEndpoint = '/api/ai/chat';
    const chatSearchEndpoint = '/api/ai/search';

    if (chatFab && chatWindow) {
        const CHAT_FAB_DELAY_MS = 3000;
        let chatSessionId = null;
        let isSending = false;
        const chatHistory = [];

        chatFab.style.visibility = 'hidden';
        chatFab.style.opacity = '0';
        chatFab.style.pointerEvents = 'none';

        setTimeout(() => {
            chatFab.style.visibility = '';
            chatFab.style.opacity = '';
            chatFab.style.pointerEvents = '';
        }, CHAT_FAB_DELAY_MS);

        if (chatBody) {
            chatBody.setAttribute('aria-live', 'polite');
            chatBody.setAttribute('aria-atomic', 'false');
        }

        function getShortQuickReply(label) {
            const compact = (label || '').replace(/[؟?!.,،]/g, '').trim();
            const words = compact.split(/\s+/).filter(Boolean);

            if (window.innerWidth > 768 || words.length <= 3) {
                return label;
            }

            return words.slice(0, 3).join(' ');
        }

        function applyResponsiveQuickReplies() {
            document.querySelectorAll('.qbtn').forEach((btn) => {
                const fullText = btn.dataset.fullText || btn.dataset.q || btn.textContent.trim();
                btn.dataset.fullText = fullText;
                btn.textContent = getShortQuickReply(fullText);
            });
        }

        applyResponsiveQuickReplies();

        function toggleChat() {
            const willOpen = !chatWindow.classList.contains('active') && !chatWindow.classList.contains('show');
            chatWindow.classList.toggle('active', willOpen);
            chatWindow.classList.toggle('show', willOpen);
            chatFab.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
            chatWindow.setAttribute('aria-hidden', willOpen ? 'false' : 'true');
            if (willOpen) {
                if (chatBadge) chatBadge.style.display = 'none';
                if (chatInput) setTimeout(() => chatInput.focus(), 80);
            }
        }
        chatFab.addEventListener('click', toggleChat);
        chatClose?.addEventListener('click', () => {
            chatWindow.classList.remove('active', 'show');
            chatFab.setAttribute('aria-expanded', 'false');
            chatWindow.setAttribute('aria-hidden', 'true');
        });
        chatMin?.addEventListener('click', () => {
            chatWindow.classList.remove('active', 'show');
            chatFab.setAttribute('aria-expanded', 'false');
            chatWindow.setAttribute('aria-hidden', 'true');
        });

        document.addEventListener('click', (event) => {
            const target = event.target;
            if (!(target instanceof Element)) return;
            const isOpen = chatWindow.classList.contains('active') || chatWindow.classList.contains('show');
            if (!isOpen) return;
            if (chatWindow.contains(target) || chatFab.contains(target)) return;
            chatWindow.classList.remove('active', 'show');
            chatFab.setAttribute('aria-expanded', 'false');
            chatWindow.setAttribute('aria-hidden', 'true');
        });

        function addMsg(text, who = 'user') {
            if (!chatBody || !typing) return null;
            const div = document.createElement('div');
            div.className = 'msg ' + who;
            div.textContent = text;
            chatBody.insertBefore(div, typing);
            chatBody.scrollTop = chatBody.scrollHeight;
            return div;
        }

        function pushChatHistory(sender, text) {
            const normalized = String(text || '').trim();
            if (!normalized) return;
            chatHistory.push({ sender, text: normalized });
            if (chatHistory.length > 12) {
                chatHistory.splice(0, chatHistory.length - 12);
            }
        }

        function normalizeIntentText(value) {
            return String(value || '')
                .toLowerCase()
                .replace(/[؟?!.,،]/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
        }

        function buildSmartIntentReply(question) {
            const q = normalizeIntentText(question);
            const links = {
                services: '/frontend/pages/our-products/index.html',
                automation: '/frontend/pages/smart-automation/index.html',
                data: '/frontend/pages/data-analysis/index.html',
                aiagent: '/frontend/pages/ai-agent/index.html',
                consultation: '/frontend/pages/consultation/index.html',
                contact: '/frontend/pages/contact/index.html'
            };

            if (/(خدم|خدمات|وش تقدمون|ما تقدمون|حلولكم)/.test(q)) {
                return `أكيد. خدماتنا الأساسية:\n1) AIaaS وحلول مخصصة للمؤسسات\n2) أتمتة العمليات الذكية\n3) تحليل البيانات ولوحات KPI\n4) وكلاء ذكاء اصطناعي للدعم والتشغيل\nالتفاصيل: ${links.services}`;
            }

            if (/(استشار|استشاره|استشارة|حجز|موعد|جلسه|جلسة)/.test(q)) {
                return `ممتاز. نقدر نبدأ بجلسة استشارية سريعة لتحديد:\n- القطاع\n- التحدي التشغيلي\n- مؤشرات النجاح\nاحجز من هنا: ${links.consultation}\nأو تواصل مباشر: https://wa.me/966538229013`;
            }

            if (/(سعر|تكلف|باقه|باقة|عرض سعر|عرض)/.test(q)) {
                return `التكلفة تعتمد على نطاق المشروع والتكامل المطلوب. نوصي بجلسة تقييم قصيرة ثم نرفع تصور تنفيذي واضح. ابدأ من: ${links.consultation}`;
            }

            if (/(اتمت|أتمت|workflow|سير عمل|تشغيل|rpa)/.test(q)) {
                return `لو هدفك تقليل الجهد اليدوي ورفع الإنتاجية، مسار الأتمتة هو الأنسب. نبدأ بتحليل العمليات ثم نحدد حالات الاستخدام ذات العائد الأعلى. التفاصيل: ${links.automation}`;
            }

            if (/(بيان|kpi|dashboard|لوحه|لوحة|تحليل)/.test(q)) {
                return `ممتاز. نقدر نبني لك مسار بيانات من المصدر إلى لوحة تنفيذية واضحة تساعد الإدارة بالقرار. اطلع على الحل: ${links.data}`;
            }

            if (/(وكيل|chatbot|شات بوت|دعم فني|مساعد)/.test(q)) {
                return `نقدر نوفر وكيل ذكي للدعم الفني يجاوب العملاء، يصنف الطلبات، ويرفع التذاكر لفريقك تلقائياً. نظرة عامة: ${links.aiagent}`;
            }

            if (/(تواصل|رقم|ايميل|بريد|واتساب|whatsapp)/.test(q)) {
                return `تواصل معنا عبر صفحة الاتصال: ${links.contact}\nواتساب مباشر: https://wa.me/966538229013\nالهاتف: +966 53 822 9013`;
            }

            return 'فهمت عليك. اكتب لي القطاع (مثل: صحي/تجزئة/صناعة) والهدف (مثل: خفض التكاليف/أتمتة/تحسين خدمة العملاء) وبعطيك خطة مناسبة مباشرة.';
        }

        async function trySearchFallback(question) {
            try {
                const response = await fetch(chatSearchEndpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query: question })
                });
                if (!response.ok) return '';
                const payload = await response.json();
                const answer = typeof payload?.answer === 'string' ? payload.answer.trim() : '';
                if (!answer) return '';

                const topSource = Array.isArray(payload.sources) && payload.sources.length
                    ? payload.sources[0]
                    : null;
                if (topSource?.url) {
                    return `${answer}\n\nمرجع مفيد: ${topSource.url}`;
                }
                return answer;
            } catch (_error) {
                return '';
            }
        }

        async function fetchGeminiReply(question) {
            if (!chatBody || !typing || !chatSend) {
                addMsg(buildSmartIntentReply(question), 'bot');
                return;
            }
            typing.style.display = 'flex';
            chatBody.scrollTop = chatBody.scrollHeight;

            try {
                const response = await fetch(chatApiEndpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        message: question,
                        sessionId: chatSessionId,
                        history: chatHistory.slice(-8)
                    })
                });

                if (!response.ok) {
                    throw new Error(`Gemini request failed: ${response.status}`);
                }

                const payload = await response.json();
                if (payload?.sessionId) {
                    chatSessionId = payload.sessionId;
                }

                const reply = typeof payload?.reply === 'string' ? payload.reply.trim() : '';
                if (!reply) {
                    throw new Error('Gemini response is empty');
                }

                addMsg(reply, 'bot');
                pushChatHistory('user', question);
                pushChatHistory('ai', reply);
            } catch (error) {
                console.error('Gemini support request error:', error);
                const searchFallback = await trySearchFallback(question);
                const fallback = searchFallback || buildSmartIntentReply(question);
                addMsg(fallback, 'bot');
                pushChatHistory('user', question);
                pushChatHistory('ai', fallback);
            } finally {
                typing.style.display = 'none';
            }
        }

        chatSend?.addEventListener('click', async () => {
            if (!chatInput) return;
            if (isSending) return;
            const v = chatInput.value.trim();
            if (!v) return;
            addMsg(v, 'user');
            chatInput.value = '';
            isSending = true;
            chatSend.disabled = true;
            await fetchGeminiReply(v);
            isSending = false;
            chatSend.disabled = false;
        });
        chatInput?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') chatSend?.click();
        });
        document.querySelectorAll('.qbtn').forEach(b => {
            b.addEventListener('click', async () => {
                if (isSending) return;
                const q = b.dataset.q;
                addMsg(q, 'user');
                isSending = true;
                if (chatSend) chatSend.disabled = true;
                await fetchGeminiReply(q);
                isSending = false;
                if (chatSend) chatSend.disabled = false;
            });
        });

        window.addEventListener('resize', applyResponsiveQuickReplies);
    }

    // Cookies notice (optional)
    const cookies = document.getElementById('cookies');
    const cookieOk = document.getElementById('cookieOk');
    if (cookies && cookieOk) {
        setTimeout(() => {
            try {
                if (!localStorage.getItem('cookies_ok')) cookies.classList.add('show');
            } catch (e) {
                cookies.classList.add('show');
            }
        }, 1500);
        cookieOk.addEventListener('click', () => {
            try {
                localStorage.setItem('cookies_ok', '1');
            } catch (e) {
                // ignore storage errors
            }
            cookies.classList.remove('show');
        });
    }
})();

(function () {
    'use strict';

    if (window.__brightAiDeviceEngagementInitialized) return;
    window.__brightAiDeviceEngagementInitialized = true;

    const pagePath = window.location.pathname || '/';
    const scrollMilestones = [25, 50, 75, 90];
    const timeMilestones = [10, 30, 60, 120];
    const firedScrollMilestones = new Set();
    const firedTimeMilestones = new Set();
    const viewedSections = new Set();
    const pendingEvents = [];

    let queueFlushTimer = null;
    let heartbeatTimer = null;
    let maxScrollPercent = 0;
    let interactionCount = 0;
    let engagedSignalSent = false;
    let activeMs = 0;
    const sessionStartMs = Date.now();
    let visibleSince = document.visibilityState === 'visible' ? Date.now() : null;

    function detectDeviceCategory() {
        const width = Math.max(window.innerWidth || 0, window.screen ? window.screen.width || 0 : 0);
        if (width <= 767) return 'mobile';
        if (width <= 1024) return 'tablet';
        return 'desktop';
    }

    const deviceCategory = detectDeviceCategory();

    function sanitizeText(value, maxLength = 120) {
        if (!value) return '';
        return String(value).replace(/\s+/g, ' ').trim().slice(0, maxLength);
    }

    function flushPendingEvents() {
        if (typeof window.gtag !== 'function' || pendingEvents.length === 0) return;
        while (pendingEvents.length) {
            const payload = pendingEvents.shift();
            window.gtag('event', payload.name, payload.params);
        }
        if (queueFlushTimer) {
            clearInterval(queueFlushTimer);
            queueFlushTimer = null;
        }
    }

    function scheduleQueueFlush() {
        if (queueFlushTimer) return;
        queueFlushTimer = setInterval(() => {
            if (typeof window.gtag === 'function') flushPendingEvents();
        }, 250);
        setTimeout(() => {
            if (queueFlushTimer) {
                clearInterval(queueFlushTimer);
                queueFlushTimer = null;
            }
        }, 20000);
    }

    function sendEvent(name, params = {}) {
        const payload = {
            page_path: pagePath,
            device_category: deviceCategory,
            ...params,
        };
        if (typeof window.gtag === 'function') {
            window.gtag('event', name, payload);
        } else {
            pendingEvents.push({ name, params: payload });
            scheduleQueueFlush();
        }
    }

    function updateActiveClock() {
        if (visibleSince) {
            activeMs += Math.max(0, Date.now() - visibleSince);
            visibleSince = Date.now();
        }
    }

    function getActiveSeconds() {
        if (!visibleSince) return Math.round(activeMs / 1000);
        return Math.round((activeMs + (Date.now() - visibleSince)) / 1000);
    }

    function getScrollPercent() {
        const doc = document.documentElement;
        const total = doc.scrollHeight - doc.clientHeight;
        if (total <= 0) return 0;
        return Math.max(0, Math.min(100, Math.round((doc.scrollTop / total) * 100)));
    }

    function handleScrollMilestones() {
        const current = getScrollPercent();
        if (current > maxScrollPercent) maxScrollPercent = current;

        scrollMilestones.forEach((milestone) => {
            if (current >= milestone && !firedScrollMilestones.has(milestone)) {
                firedScrollMilestones.add(milestone);
                sendEvent('scroll_depth_milestone', {
                    scroll_percent: milestone,
                    interaction_count: interactionCount,
                });
            }
        });
    }

    function maybeSendEngagedSignal(activeSeconds) {
        if (engagedSignalSent) return;
        const qualifies = activeSeconds >= 15 && maxScrollPercent >= 35 && interactionCount >= 1;
        if (!qualifies) return;
        engagedSignalSent = true;

        sendEvent('content_engaged', {
            active_time_seconds: activeSeconds,
            max_scroll_percent: Math.round(maxScrollPercent),
            interaction_count: interactionCount,
        });
        sendEvent('key_event_reliability_signal', {
            reliability_state: 'baseline_met',
            active_time_seconds: activeSeconds,
            max_scroll_percent: Math.round(maxScrollPercent),
            interaction_count: interactionCount,
        });
    }

    function startHeartbeat() {
        if (heartbeatTimer) return;
        heartbeatTimer = setInterval(() => {
            const activeSeconds = getActiveSeconds();

            timeMilestones.forEach((milestone) => {
                if (activeSeconds >= milestone && !firedTimeMilestones.has(milestone)) {
                    firedTimeMilestones.add(milestone);
                    sendEvent('engagement_time_milestone', {
                        engagement_seconds: milestone,
                        max_scroll_percent: Math.round(maxScrollPercent),
                        interaction_count: interactionCount,
                    });
                    sendEvent('engagement_time', {
                        engagement_seconds: milestone,
                    });
                }
            });

            maybeSendEngagedSignal(activeSeconds);
        }, 1000);
    }

    function setupSectionTracking() {
        if (!('IntersectionObserver' in window)) return;
        const sections = [...document.querySelectorAll('section, article, [data-section]')].slice(0, 25);
        if (sections.length === 0) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting || entry.intersectionRatio < 0.5) return;
                const element = entry.target;
                const index = sections.indexOf(element);
                const sectionId = sanitizeText(
                    element.id
                    || element.getAttribute('data-section')
                    || element.getAttribute('aria-label')
                    || `section_${index + 1}`,
                    80
                );

                if (!sectionId || viewedSections.has(sectionId)) return;
                viewedSections.add(sectionId);
                sendEvent('content_section_view', {
                    section_id: sectionId,
                    section_order: index + 1,
                });
            });
        }, { threshold: [0.5] });

        sections.forEach((section) => observer.observe(section));
    }

    function handleInteraction(event) {
        const target = event.target;
        if (!(target instanceof Element)) return;

        const interactiveElement = target.closest('a, button, input, select, textarea, [role="button"]');
        if (!interactiveElement) return;
        interactionCount += 1;

        const actionElement = target.closest('a[href], button, [role="button"]');
        if (!actionElement) return;

        const href = sanitizeText(actionElement.getAttribute('href') || '', 140);
        const label = sanitizeText(
            actionElement.getAttribute('aria-label')
            || actionElement.textContent
            || actionElement.id
            || 'cta'
        );

        const isLeadIntent = /wa\.me|whatsapp|mailto:|tel:|\/contact\/|\/consultation\//i.test(href)
            || /(تواصل|استشارة|احجز|ابدأ|contact|consult|book|demo)/i.test(label);

        if (!isLeadIntent) return;

        sendEvent('lead_intent_click', {
            cta_label: label,
            cta_target: href || 'button',
            interaction_count: interactionCount,
        });

        if (!window.__brightAiLeadIntentQualified) {
            window.__brightAiLeadIntentQualified = true;
            sendEvent('qualify_lead', {
                lead_channel: 'cta_intent',
                qualification_stage: 'mql',
                qualification_source: 'lead_intent_click',
                cta_label: label,
                cta_target: href || 'button',
            });
        }
    }

    function finalizeEngagement() {
        if (heartbeatTimer) {
            clearInterval(heartbeatTimer);
            heartbeatTimer = null;
        }

        updateActiveClock();
        const activeSeconds = getActiveSeconds();
        const sessionSeconds = Math.max(1, Math.round((Date.now() - sessionStartMs) / 1000));
        const quality = activeSeconds >= 45 && maxScrollPercent >= 60
            ? 'high'
            : (activeSeconds >= 20 && maxScrollPercent >= 30 ? 'medium' : 'low');

        sendEvent('content_engagement_summary', {
            active_time_seconds: activeSeconds,
            session_duration_seconds: sessionSeconds,
            max_scroll_percent: Math.round(maxScrollPercent),
            interaction_count: interactionCount,
            engagement_quality: quality,
            key_event_reliability: engagedSignalSent ? 'baseline_met' : 'needs_attention',
        });

        if (!engagedSignalSent && (activeSeconds >= 15 || maxScrollPercent >= 25 || interactionCount >= 1)) {
            sendEvent('key_event_reliability_signal', {
                reliability_state: 'weak_signal',
                active_time_seconds: activeSeconds,
                max_scroll_percent: Math.round(maxScrollPercent),
                interaction_count: interactionCount,
            });
        }

        flushPendingEvents();
    }

    sendEvent('device_engagement_init', {
        viewport_width: window.innerWidth || 0,
        viewport_height: window.innerHeight || 0,
    });

    window.addEventListener('scroll', handleScrollMilestones, { passive: true });
    document.addEventListener('click', handleInteraction, true);
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            visibleSince = Date.now();
        } else {
            updateActiveClock();
            visibleSince = null;
        }
    });
    window.addEventListener('resize', () => {
        sendEvent('viewport_resize', {
            viewport_width: window.innerWidth || 0,
            viewport_height: window.innerHeight || 0,
        });
    });
    window.addEventListener('online', flushPendingEvents);
    window.addEventListener('focus', flushPendingEvents);
    window.addEventListener('pagehide', finalizeEngagement, { once: true });

    setupSectionTracking();
    startHeartbeat();
})();
