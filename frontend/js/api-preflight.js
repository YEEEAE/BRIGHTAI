/**
 * BrightAI API Preflight — يُحمّل بعد api-gateway.js
 * يفحص الاتصال بالخادم عند بدء التطبيق ويعرض رسالة تشخيص واضحة إذا فشل.
 */
(function () {
    'use strict';

    // لا تفحص في بيئة التطوير المحلي (file://)
    if (typeof window === 'undefined') return;
    if (window.location.protocol === 'file:') return;

    var gw = window.BrightAIGateway;
    if (!gw || typeof gw.preflight !== 'function') {
        console.warn('[BrightAI Preflight] api-gateway.js غير محمل. تخطي فحص الاتصال.');
        return;
    }

    // تأخير بسيط للسماح للـ DOM بالتحميل أولاً
    var runPreflight = function () {
        gw.preflight({ timeoutMs: 8000, silent: false }).then(function (result) {
            if (!result.healthy) {
                // إضافة بيانات إلى window للمكونات الأخرى
                window.__BRIGHTAI_HEALTH_STATUS__ = result;
            }
        }).catch(function () {
            // تجاهل أخطاء الـ preflight نفسه
        });
    };

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        setTimeout(runPreflight, 1000);
    } else {
        window.addEventListener('DOMContentLoaded', function () {
            setTimeout(runPreflight, 1000);
        }, { once: true });
    }
})();
