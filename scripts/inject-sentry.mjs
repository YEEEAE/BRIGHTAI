#!/usr/bin/env node
/**
 * inject-sentry.mjs
 * يضيف سكريبتات Sentry (CDN + init) في <head> لجميع صفحات HTML
 * الاستخدام: node scripts/inject-sentry.mjs [--dry-run]
 */
import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';
import { resolve, relative } from 'path';

const ROOT = resolve(import.meta.dirname, '..');
const DRY_RUN = process.argv.includes('--dry-run');

// سكريبتات Sentry المراد حقنها
const SENTRY_SNIPPET = `
<!-- Sentry Error Tracking -->
<script src="https://js.sentry-cdn.com/655a2e73b738777ce12e3ec8eaa91e6c.min.js" crossorigin="anonymous"></script>
<script src="/frontend/js/sentry-init.js" defer></script>
`;

// marker لتجنب الحقن المكرر
const MARKER = 'sentry-cdn.com';

async function main() {
    console.log('🔍 جاري البحث عن ملفات HTML...');

    const htmlFiles = await glob('**/*.html', {
        cwd: ROOT,
        ignore: [
            'node_modules/**',
            '.git/**',
            'brightai-platform/**',
            'backend/**',
            'الاهم/**',
            'reports/**',
            'docs/**',
        ],
        absolute: true,
    });

    console.log(`📄 عدد الملفات: ${htmlFiles.length}\n`);

    let injected = 0;
    let skipped = 0;

    for (const filePath of htmlFiles) {
        const rel = relative(ROOT, filePath);
        let html = readFileSync(filePath, 'utf-8');

        // تجاهل الملفات التي تحتوي بالفعل على Sentry
        if (html.includes(MARKER)) {
            console.log(`⏭️  تم تخطيه (موجود مسبقاً): ${rel}`);
            skipped++;
            continue;
        }

        // البحث عن نهاية Clarity script أو أول <meta charset
        // نحقن بعد إغلاق سكريبت Clarity مباشرة
        const clarityEndIdx = html.indexOf('</script>', html.indexOf('clarity'));
        const metaCharsetIdx = html.indexOf('<meta charset');

        let insertIdx = -1;

        if (clarityEndIdx !== -1 && html.includes('clarity')) {
            // وجدنا سكريبت Clarity — نحقن بعده
            insertIdx = html.indexOf('\n', clarityEndIdx) + 1;
        } else if (metaCharsetIdx !== -1) {
            // نحقن قبل meta charset
            insertIdx = metaCharsetIdx;
        } else {
            // fallback: نحقن بعد <head>
            const headIdx = html.indexOf('<head>');
            if (headIdx !== -1) {
                insertIdx = headIdx + '<head>'.length;
            }
        }

        if (insertIdx === -1) {
            console.log(`⚠️  لم يُعثر على موضع مناسب: ${rel}`);
            continue;
        }

        const newHtml = html.slice(0, insertIdx) + SENTRY_SNIPPET + html.slice(insertIdx);

        if (DRY_RUN) {
            console.log(`🏜️  [dry-run] سيتم الحقن في: ${rel}`);
        } else {
            writeFileSync(filePath, newHtml, 'utf-8');
            console.log(`✅ تم الحقن: ${rel}`);
        }
        injected++;
    }

    console.log(`\n${'═'.repeat(50)}`);
    console.log(`📊 النتائج:`);
    console.log(`   ✅ تم الحقن: ${injected}`);
    console.log(`   ⏭️  تم التخطي: ${skipped}`);
    console.log(`   📄 الإجمالي: ${htmlFiles.length}`);
    if (DRY_RUN) console.log(`   🏜️  وضع المعاينة — لم يتم تعديل أي ملف`);
    console.log(`${'═'.repeat(50)}`);
}

main().catch(console.error);
