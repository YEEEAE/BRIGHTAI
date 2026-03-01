/**
 * Sentry Browser SDK — BrightAI Frontend Error Tracking
 * يتتبع الأخطاء في الواجهة الأمامية ويرسلها إلى لوحة تحكم Sentry
 * يعمل مع CDN bundle المحمّل قبل هذا الملف
 */
(function () {
    'use strict';

    // تأكد أن Sentry SDK محمّل من CDN
    if (typeof Sentry === 'undefined') {
        console.warn('[BrightAI] Sentry SDK not loaded — skipping init');
        return;
    }

    Sentry.init({
        dsn: 'https://6fb19ef8d5c41c0fa0adb86852054394@o4510966719840256.ingest.us.sentry.io/4510966859366400',

        // إرسال بيانات PII الافتراضية (مثل IP)
        sendDefaultPii: true,

        // بيئة التشغيل: إنتاج أو تطوير
        environment: location.hostname === 'brightai.site' ? 'production' : 'development',

        // نسبة أخذ عينات الأخطاء (100% = كل خطأ يُرسل)
        sampleRate: 1.0,

        // تجاهل أخطاء الطرف الثالث (إعلانات، إضافات المتصفح)
        ignoreErrors: [
            'ResizeObserver loop',
            'Non-Error promise rejection',
            'Load failed',
            /^Script error\.?$/,
            /^ChunkLoadError/,
            'Network request failed',
        ],

        // تجاهل أخطاء من نطاقات خارجية
        denyUrls: [
            /extensions\//i,
            /^chrome:\/\//i,
            /^moz-extension:\/\//i,
            /googletagmanager\.com/i,
            /googlesyndication\.com/i,
            /clarity\.ms/i,
        ],

        // السماح فقط بأخطاء من نطاقنا
        allowUrls: [
            /brightai\.site/i,
            /localhost/i,
            /127\.0\.0\.1/i,
        ],

        // إضافة معلومات إضافية لكل حدث
        beforeSend(event) {
            // إضافة معلومات الصفحة
            event.tags = event.tags || {};
            event.tags.page_url = location.pathname;
            event.tags.page_title = document.title;
            event.tags.locale = document.documentElement.lang || 'ar';
            return event;
        },
    });

    // تسجيل معلومات المستخدم الأساسية (مجهول)
    Sentry.setTag('site', 'brightai');
    Sentry.setTag('platform', 'static-html');

    // إعلام في وضع التطوير
    if (location.hostname !== 'brightai.site') {
        console.info('[BrightAI] Sentry initialized (dev mode)');
    }
})();
