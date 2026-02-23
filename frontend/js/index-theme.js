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

    initializeGa4ConversionTracking();

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

    if (chatFab && chatWindow && chatClose && chatMin && chatBadge && chatBody && chatInput && chatSend && typing) {
        function toggleChat() {
            chatWindow.classList.toggle('show');
            if (chatWindow.classList.contains('show')) {
                chatBadge.style.display = 'none';
                setTimeout(() => chatInput.focus(), 80);
            }
        }
        chatFab.addEventListener('click', toggleChat);
        chatClose.addEventListener('click', () => chatWindow.classList.remove('show'));
        chatMin.addEventListener('click', () => chatWindow.classList.remove('show'));

        function addMsg(text, who = 'user') {
            const div = document.createElement('div');
            div.className = 'msg ' + who;
            div.textContent = text;
            chatBody.insertBefore(div, typing);
            chatBody.scrollTop = chatBody.scrollHeight;
        }
        function botReply(q) {
            typing.style.display = 'flex';
            chatBody.scrollTop = chatBody.scrollHeight;
            setTimeout(() => {
                typing.style.display = 'none';
                let ans = "تمام. اكتبلي احتياجك بالتفصيل وأنا أرشدك لأفضل حل.";
                if (q.includes("خدماتكم")) ans = "بنقدم: APIs جاهزة (NLP/Prediction/Speech) + BI & Dashboards + AIaaS + أتمتة سير العمل + حلول روبوتات + أنظمة معرفة زي المكتبة الذكية.";
                if (q.includes("أتواصل")) ans = "تقدر تتواصل عبر البريد info@brightai.site أو الهاتف +966 53 822 9013، وكمان تقدر تحجز عرض توضيحي من أزرار الصفحة.";
                if (q.includes("استشارة")) ans = "أكيد. قولي القطاع (حكومي/صحي/تجزئة/صناعة/اتصالات/HR) وهدفك (تنبؤ/أتمتة/Chatbot/BI) عشان أحدد المسار الأنسب.";
                addMsg(ans, 'bot');
            }, 900);
        }

        chatSend.addEventListener('click', () => {
            const v = chatInput.value.trim();
            if (!v) return;
            addMsg(v, 'user');
            chatInput.value = '';
            botReply(v);
        });
        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') chatSend.click();
        });
        document.querySelectorAll('.qbtn').forEach(b => {
            b.addEventListener('click', () => {
                const q = b.dataset.q;
                addMsg(q, 'user');
                botReply(q);
            });
        });
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
