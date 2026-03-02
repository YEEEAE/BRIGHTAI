#!/usr/bin/env node
/**
 * verify-sentry.mjs
 * يتحقق من وجود Sentry في جميع ملفات HTML
 * الاستخدام: node scripts/verify-sentry.mjs
 */
import { readFileSync } from 'fs';
import { glob } from 'glob';
import { resolve, relative } from 'path';

const ROOT = resolve(import.meta.dirname, '..');
const MARKER = 'sentry-cdn.com';
const INIT_MARKER = 'sentry-init.js';

async function main() {
    console.log('🔍 جاري التحقق من Sentry في ملفات HTML...\n');

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

    let ok = 0;
    let missing = 0;
    const missingFiles = [];

    for (const filePath of htmlFiles) {
        const rel = relative(ROOT, filePath);
        const html = readFileSync(filePath, 'utf-8');

        const hasCDN = html.includes(MARKER);
        const hasInit = html.includes(INIT_MARKER);

        if (hasCDN && hasInit) {
            ok++;
        } else {
            missing++;
            const issues = [];
            if (!hasCDN) issues.push('CDN مفقود');
            if (!hasInit) issues.push('sentry-init.js مفقود');
            missingFiles.push({ file: rel, issues: issues.join(' + ') });
            console.log(`❌ ${rel} → ${issues.join(' + ')}`);
        }
    }

    console.log(`\n${'═'.repeat(50)}`);
    console.log(`📊 نتائج التحقق من Sentry:`);
    console.log(`   ✅ مثبت: ${ok}/${htmlFiles.length}`);
    console.log(`   ❌ مفقود: ${missing}/${htmlFiles.length}`);
    console.log(`${'═'.repeat(50)}`);

    if (missing > 0) {
        console.log('\n⚠️  لإصلاح الملفات المفقودة، شغّل:');
        console.log('   node scripts/inject-sentry.mjs\n');
        process.exit(1);
    } else {
        console.log('\n✅ Sentry مثبت في جميع الصفحات بنجاح!\n');
    }
}

main().catch(console.error);
