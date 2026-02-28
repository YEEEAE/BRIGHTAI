/**
 * BrightAI API Gateway — طبقة موحدة لجميع نداءات الواجهة
 *
 * تبني URL الإنتاج الصحيح تلقائياً بناءً على:
 * 1) window.BRIGHTAI_API_BASE (تُعيَّن يدوياً أو من ENV عبر build)
 * 2) Same-origin fallback (افتراضي آمن لـ Netlify/Vercel/أي بيئة تدعم proxy)
 *
 * جميع الملفات تستورد هذا الـ module بدل hardcoded paths.
 *
 * @module api-gateway
 */
(function (root, factory) {
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = factory();
    } else {
        root.BrightAIGateway = factory();
    }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    // ─── 1. API Base Resolution ─────────────────────────────────
    function resolveApiBase() {
        // أولوية 1: متغير صريح (يُعيَّن في الـ HTML أو build pipeline)
        if (
            typeof window !== 'undefined' &&
            window.BRIGHTAI_API_BASE &&
            typeof window.BRIGHTAI_API_BASE === 'string'
        ) {
            return window.BRIGHTAI_API_BASE.replace(/\/+$/, '');
        }

        // أولوية 2: same-origin (يعمل على Netlify بفضل redirect /api/* -> functions)
        if (typeof window !== 'undefined' && window.location) {
            return window.location.origin;
        }

        // fallback مطلق (development)
        return '';
    }

    let _cachedBase = null;

    function getApiBase() {
        if (_cachedBase !== null) return _cachedBase;
        _cachedBase = resolveApiBase();
        return _cachedBase;
    }

    /**
     * يعيد ضبط الـ cache عند تغيير window.BRIGHTAI_API_BASE ديناميكياً
     */
    function resetApiBase() {
        _cachedBase = null;
    }

    // ─── 2. URL Builder ─────────────────────────────────────────
    /**
     * يبني URL كامل من مسار نسبي
     * @param {string} path - مثال: '/api/gemini/chat'
     * @returns {string} - URL كامل
     */
    function buildUrl(path) {
        const base = getApiBase();
        const normalizedPath = path.startsWith('/') ? path : '/' + path;
        // إذا base فارغ → يستخدم relative path مباشرة (same-origin)
        if (!base) return normalizedPath;
        return base + normalizedPath;
    }

    // ─── 3. Endpoint Constants ──────────────────────────────────
    var ENDPOINTS = Object.freeze({
        GEMINI_CHAT: '/api/gemini/chat',
        GEMINI_CHAT_STREAM: '/api/gemini/chat/stream',
        AI_STREAM: '/api/ai/stream',
        AI_CHAT: '/api/ai/chat',
        AI_SEARCH: '/api/ai/search',
        AI_MEDICAL: '/api/ai/medical',
        AI_SUMMARY: '/api/ai/summary',
        AI_OCR: '/api/ai/ocr',
        AI_EXTRACT_TEXT: '/api/ai/extract-text',
        AI_TRANSCRIBE: '/api/ai/transcribe',
        AI_MEDICAL_AGENT: '/api/ai/medical-agent',
        AI_FAQ: '/api/ai/faq',
        AI_MEDICAL_ARCHIVE: '/api/ai/medical-archive',
        AI_MODELS: '/api/ai/models',
        AI_OPENAI_CHAT: '/api/ai/openai-chat',
        HEALTH: '/api/health',
        HEALTH_AI: '/api/health/ai',
        ANALYTICS_CONVERSION: '/api/analytics/ga4/conversion'
    });

    // ─── 4. Health Check (Preflight) ────────────────────────────
    var _healthState = {
        checked: false,
        healthy: false,
        message: '',
        timestamp: 0
    };

    /**
     * فحص preflight عند بدء التطبيق
     * يستدعي /api/health ويعرض رسالة تشخيص واضحة إذا فشل
     * @param {object} options
     * @param {number} options.timeoutMs - مهلة الفحص (افتراضي 6000ms)
     * @param {boolean} options.silent - عدم العرض في console
     * @returns {Promise<{healthy: boolean, message: string}>}
     */
    async function preflight(options) {
        var opts = options || {};
        var timeoutMs = opts.timeoutMs || 6000;
        var silent = opts.silent || false;

        var controller = new AbortController();
        var timeoutId = setTimeout(function () {
            controller.abort();
        }, timeoutMs);

        try {
            var url = buildUrl(ENDPOINTS.HEALTH);
            var response = await fetch(url, {
                method: 'GET',
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                var errorText = '';
                try {
                    var errorBody = await response.json();
                    errorText = errorBody.error || errorBody.message || '';
                } catch (_) {
                    errorText = 'HTTP ' + response.status;
                }

                var diagnosticMessage = _buildDiagnosticMessage(response.status, errorText);

                _healthState = {
                    checked: true,
                    healthy: false,
                    message: diagnosticMessage,
                    timestamp: Date.now()
                };

                if (!silent) {
                    console.error('[BrightAI Gateway] ❌ فحص الاتصال فشل:', diagnosticMessage);
                    _showHealthBanner(diagnosticMessage);
                }

                return { healthy: false, message: diagnosticMessage };
            }

            _healthState = {
                checked: true,
                healthy: true,
                message: 'الاتصال بالخادم يعمل بنجاح',
                timestamp: Date.now()
            };

            if (!silent) {
                console.info('[BrightAI Gateway] ✅ الاتصال بالخادم يعمل بنجاح');
            }

            return { healthy: true, message: 'ok' };

        } catch (error) {
            clearTimeout(timeoutId);

            var msg = '';
            if (error && error.name === 'AbortError') {
                msg = 'انتهت مهلة الاتصال بالخادم (' + (timeoutMs / 1000) + ' ثوانٍ). تأكد أن الخادم يعمل وأن الـ API endpoint متاح.';
            } else {
                msg = 'تعذر الاتصال بالخادم: ' + (error.message || 'خطأ غير معروف') + '. تأكد من إعدادات الشبكة والنشر.';
            }

            _healthState = {
                checked: true,
                healthy: false,
                message: msg,
                timestamp: Date.now()
            };

            if (!silent) {
                console.error('[BrightAI Gateway] ❌ فحص الاتصال فشل:', msg);
                _showHealthBanner(msg);
            }

            return { healthy: false, message: msg };
        }
    }

    function _buildDiagnosticMessage(status, errorText) {
        if (status === 503) {
            if (errorText && (errorText.includes('key') || errorText.includes('API') || errorText.includes('configured'))) {
                return 'الخادم يعمل لكن مفتاح API غير مُعد (GEMINI_API_KEY). أضف المفتاح في إعدادات بيئة الإنتاج (Netlify Environment Variables).';
            }
            return 'الخادم يعمل لكن الخدمة غير متاحة حالياً (503). تحقق من إعدادات المزود.';
        }
        if (status === 404) {
            return 'مسار /api/health غير موجود (404). تأكد من أن redirect /api/* -> /.netlify/functions/all مُعد في netlify.toml وأن الـ function deployed بنجاح.';
        }
        if (status === 500) {
            return 'خطأ داخلي في الخادم (500). راجع logs الـ Netlify Functions في لوحة التحكم.';
        }
        return 'فشل الاتصال بالخادم (HTTP ' + status + '). ' + (errorText || '');
    }

    function _showHealthBanner(message) {
        if (typeof document === 'undefined') return;

        // لا تعرض أكثر من بانر واحد
        if (document.getElementById('brightai-health-banner')) return;

        var banner = document.createElement('div');
        banner.id = 'brightai-health-banner';
        banner.setAttribute('role', 'alert');
        banner.setAttribute('dir', 'rtl');
        banner.style.cssText =
            'position:fixed;top:0;left:0;right:0;z-index:999999;' +
            'background:linear-gradient(135deg,#991b1b,#7f1d1d);' +
            'color:#fecaca;padding:14px 20px;font-size:14px;line-height:1.7;' +
            'font-family:system-ui,-apple-system,sans-serif;text-align:right;' +
            'box-shadow:0 4px 20px rgba(0,0,0,.4);border-bottom:2px solid #dc2626;';

        var closeBtn = document.createElement('button');
        closeBtn.textContent = '✕';
        closeBtn.style.cssText =
            'position:absolute;top:8px;left:12px;background:none;border:none;' +
            'color:#fecaca;font-size:18px;cursor:pointer;padding:4px;';
        closeBtn.addEventListener('click', function () {
            banner.remove();
        });

        banner.textContent = '⚠️ ' + message;
        banner.appendChild(closeBtn);
        document.body.insertBefore(banner, document.body.firstChild);
    }

    /**
     * @returns {{checked:boolean,healthy:boolean,message:string,timestamp:number}}
     */
    function getHealthState() {
        return Object.assign({}, _healthState);
    }

    // ─── 5. Enhanced Fetch Helper ───────────────────────────────
    /**
     * fetch مع timeout وبناء URL تلقائي
     * @param {string} endpointPath - مسار نسبي مثل '/api/gemini/chat'
     * @param {RequestInit} fetchOptions - خيارات fetch القياسية
     * @param {number} timeoutMs - مهلة (افتراضي 15000ms)
     * @returns {Promise<Response>}
     */
    async function apiFetch(endpointPath, fetchOptions, timeoutMs) {
        var timeout = timeoutMs || 15000;
        var url = buildUrl(endpointPath);
        var controller = new AbortController();
        var timeoutId = setTimeout(function () {
            controller.abort();
        }, timeout);

        var opts = Object.assign({}, fetchOptions || {});
        opts.signal = controller.signal;

        try {
            var response = await fetch(url, opts);
            clearTimeout(timeoutId);
            return response;
        } catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    }

    // ─── 6. Public API ──────────────────────────────────────────
    return {
        getApiBase: getApiBase,
        resetApiBase: resetApiBase,
        buildUrl: buildUrl,
        ENDPOINTS: ENDPOINTS,
        preflight: preflight,
        getHealthState: getHealthState,
        apiFetch: apiFetch
    };
});
