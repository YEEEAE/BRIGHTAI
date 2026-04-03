#!/usr/bin/env node
/**
 * BrightAI Smoke Test — يتحقق من نجاح اتصال API الإنتاج
 *
 * الاستخدام:
 *   node scripts/smoke-test-api.mjs
 *   node scripts/smoke-test-api.mjs https://brightai.site
 *
 * يفحص:
 *   1. GET /api/health
 *   2. POST /api/gemini/chat
 *   3. POST /api/gemini/chat/stream
 */

const BASE_URL = process.argv[2] || 'https://brightai.site';

const TESTS = [
    {
        name: 'GET /api/health',
        method: 'GET',
        path: '/api/health',
        expectedStatus: [200, 503], // 503 = key missing but server works
        validateBody: (body) => {
            if (!body.status) return 'حقل status مفقود';
            if (!body.timestamp) return 'حقل timestamp مفقود';
            if (body.status === 'degraded') {
                return `⚠️ الخادم يعمل لكن في وضع degraded: ${body.providers?.gemini?.message || 'مفتاح API غير مُعد'}`;
            }
            return null;
        }
    },
    {
        name: 'POST /api/gemini/chat',
        method: 'POST',
        path: '/api/gemini/chat',
        body: { message: 'مرحبا' },
        expectedStatus: [200, 503],
        validateBody: (body) => {
            if (body.errorCode === 'GEMINI_NOT_CONFIGURED') {
                return `⚠️ الخدمة غير متاحة — ${body.error}`;
            }
            if (!body.reply) return 'حقل reply مفقود — قد يكون مفتاح API خاطئ';
            return null;
        }
    },
    {
        name: 'POST /api/gemini/chat/stream',
        method: 'POST',
        path: '/api/gemini/chat/stream',
        body: { message: 'مرحبا' },
        expectedStatus: [200, 503],
        isStream: true,
        validateBody: (body) => {
            if (body.errorCode === 'GEMINI_NOT_CONFIGURED') {
                return `⚠️ الخدمة غير متاحة — ${body.error}`;
            }
            return null;
        }
    }
];

function colorText(text, code) {
    return `\x1b[${code}m${text}\x1b[0m`;
}

const green = (t) => colorText(t, '32');
const yellow = (t) => colorText(t, '33');
const red = (t) => colorText(t, '31');
const bold = (t) => colorText(t, '1');

async function runTest(test) {
    const url = BASE_URL + test.path;
    const options = {
        method: test.method,
        headers: { 'Content-Type': 'application/json' }
    };
    if (test.body) {
        options.body = JSON.stringify(test.body);
    }

    try {
        const response = await fetch(url, options);

        if (!test.expectedStatus.includes(response.status)) {
            return {
                name: test.name,
                status: 'FAIL',
                message: `HTTP ${response.status} غير متوقع (المتوقع: ${test.expectedStatus.join(' أو ')})`
            };
        }

        let body;
        if (test.isStream && response.status === 200) {
            // قراءة أول chunk من SSE
            const text = await response.text();
            const firstData = text.split('\n').find(l => l.startsWith('data:'));
            if (firstData) {
                const payload = firstData.replace(/^data:\s*/, '');
                if (payload && payload !== '[DONE]') {
                    try { body = JSON.parse(payload); } catch { body = {}; }
                } else {
                    body = {};
                }
            } else {
                body = {};
            }
        } else {
            body = await response.json().catch(() => ({}));
        }

        const warning = test.validateBody ? test.validateBody(body) : null;

        if (warning && warning.startsWith('⚠️')) {
            return { name: test.name, status: 'WARN', message: warning };
        }
        if (warning) {
            return { name: test.name, status: 'FAIL', message: warning };
        }

        return {
            name: test.name,
            status: 'PASS',
            message: `HTTP ${response.status} — ${JSON.stringify(body).slice(0, 120)}`
        };

    } catch (error) {
        return {
            name: test.name,
            status: 'FAIL',
            message: `خطأ في الاتصال: ${error.message}`
        };
    }
}

async function main() {
    console.log('');
    console.log(bold('═══════════════════════════════════════════════'));
    console.log(bold('  BrightAI Production Smoke Test'));
    console.log(bold(`  Target: ${BASE_URL}`));
    console.log(bold('═══════════════════════════════════════════════'));
    console.log('');

    let passed = 0;
    let warned = 0;
    let failed = 0;

    for (const test of TESTS) {
        const result = await runTest(test);

        if (result.status === 'PASS') {
            console.log(green(`  ✅ ${result.name}`));
            console.log(`     ${result.message}`);
            passed++;
        } else if (result.status === 'WARN') {
            console.log(yellow(`  ⚠️  ${result.name}`));
            console.log(`     ${result.message}`);
            warned++;
        } else {
            console.log(red(`  ❌ ${result.name}`));
            console.log(`     ${result.message}`);
            failed++;
        }
        console.log('');
    }

    console.log(bold('─────────────────────────────────────────────'));
    console.log(`  ${green('نجح')}: ${passed}  |  ${yellow('تحذير')}: ${warned}  |  ${red('فشل')}: ${failed}`);
    console.log(bold('─────────────────────────────────────────────'));

    if (failed > 0) {
        console.log('');
        console.log(red('  ❌ فشل الفحص — راجع الأخطاء أعلاه'));
        console.log('');
        console.log('  خطوات التشخيص:');
        console.log('  1. تأكد أن مسارات /api على الدومين الحالي موجهة إلى الـ backend/runtime الصحيح');
        console.log('  2. تأكد أن GEMINI_API_KEY مُعد في متغيرات البيئة على الخادم');
        console.log('  3. تحقق من logs الخاصة بالـ runtime أو السيرفر الذي يشغل الـ API');
        console.log('');
        process.exit(1);
    }

    if (warned > 0) {
        console.log('');
        console.log(yellow('  ⚠️  الخادم يعمل لكن بعض الخدمات غير مكتملة'));
        console.log('  أضف GEMINI_API_KEY في متغيرات البيئة على الخادم لتفعيل الذكاء الاصطناعي');
        console.log('');
        process.exit(0);
    }

    console.log('');
    console.log(green('  ✅ جميع الفحوصات نجحت — الإنتاج يعمل بالكامل'));
    console.log('');
    process.exit(0);
}

main();
