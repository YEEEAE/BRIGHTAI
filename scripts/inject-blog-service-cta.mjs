import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const ROOT = '/Users/yzydalshmry/Desktop/BRIGHTAI';

const ARABIC_INLINE_CTA = `
<section class="py-10 px-6" style="background:linear-gradient(135deg,rgba(99,102,241,.04),rgba(16,185,129,.03));border-top:1px solid rgba(148,163,184,.1);border-bottom:1px solid rgba(148,163,184,.1);margin:2rem 0">
  <div class="max-w-4xl mx-auto text-center">
    <h2 class="text-2xl font-bold text-white mb-3">هل تحتاج مساعدة في تطبيق هذا الحل؟</h2>
    <p class="text-slate-400 mb-6 max-w-xl mx-auto">فريق Bright AI يقدم استشارات مجانية لتقييم احتياجك واختيار المسار الأنسب.</p>
    <div class="flex flex-wrap justify-center gap-3">
      <a href="/consultation/" class="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-white" style="background:linear-gradient(135deg,#6366f1,#8b5cf6)" data-analytics-event="consultation_request" data-cta-location="blog">احجز جلسة تشخيص AI</a>
      <a href="/demo/" class="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-slate-200" style="background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.16)" data-analytics-event="request_demo" data-cta-location="blog">جرّب نماذج Bright AI</a>
      <a href="https://api.whatsapp.com/send?phone=966538229013&text=%D8%A3%D8%B1%D9%8A%D8%AF%20%D8%A7%D8%B3%D8%AA%D8%B4%D8%A7%D8%B1%D8%A9%20%D8%AD%D9%88%D9%84%20%D8%AA%D8%B7%D8%A8%D9%8A%D9%82%20%D8%A7%D9%84%D8%B0%D9%83%D8%A7%D8%A1%20%D8%A7%D9%84%D8%A7%D8%B5%D8%B7%D9%86%D8%A7%D8%B9%D9%8A" class="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-bold" style="background:#25d36620;border:1px solid #25d36640;color:#25d366" data-analytics-event="whatsapp_click" data-cta-location="blog">تواصل عبر واتساب</a>
    </div>
  </div>
</section>`;

const ENGLISH_INLINE_CTA = `
<section class="py-10 px-6" style="background:linear-gradient(135deg,rgba(99,102,241,.04),rgba(16,185,129,.03));border-top:1px solid rgba(148,163,184,.1);border-bottom:1px solid rgba(148,163,184,.1);margin:2rem 0">
  <div class="max-w-4xl mx-auto text-center">
    <h2 class="text-2xl font-bold text-white mb-3">Need help implementing this solution?</h2>
    <p class="text-slate-400 mb-6 max-w-xl mx-auto">Bright AI offers free consultations to assess your needs and find the right path forward.</p>
    <div class="flex flex-wrap justify-center gap-3">
      <a href="/en/consultation/" class="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-white" style="background:linear-gradient(135deg,#6366f1,#8b5cf6)" data-analytics-event="consultation_request" data-cta-location="blog">Book AI Diagnosis Session</a>
      <a href="/en/demo/" class="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-slate-200" style="background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.16)" data-analytics-event="request_demo" data-cta-location="blog">Try Bright AI Models</a>
      <a href="https://api.whatsapp.com/send?phone=966538229013&text=I%27d%20like%20help%20implementing%20an%20AI%20solution" class="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-bold" style="background:#25d36620;border:1px solid #25d36640;color:#25d366" data-analytics-event="whatsapp_click" data-cta-location="blog">Chat on WhatsApp</a>
    </div>
  </div>
</section>`;

function isEnglishPath(filePath) {
  return filePath.replace(ROOT, '').startsWith('/en/');
}

function getHtmlFiles(dir, maxDepth = 5, currentDepth = 0) {
  if (currentDepth > maxDepth) return [];
  const results = [];
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === '.next') continue;
        results.push(...getHtmlFiles(fullPath, maxDepth, currentDepth + 1));
      } else if (entry.name.endsWith('.html')) {
        results.push(fullPath);
      }
    }
  } catch (e) { /* skip */ }
  return results;
}

const files = getHtmlFiles(ROOT, 3);

// Target blog articles and service pages specifically
const blogFiles = files.filter(f => f.includes('/blog/') && !f.endsWith('/blog/index.html'));
const serviceFiles = files.filter(f => f.includes('/services/') && !f.endsWith('/services/index.html'));
let injected = 0;
let skipped = 0;

for (const file of [...blogFiles, ...serviceFiles]) {
  let content = readFileSync(file, 'utf-8');
  
  // Skip if already has an inline CTA section
  if (content.includes('هل تحتاج مساعدة في تطبيق') || content.includes('Need help implementing')) {
    skipped++;
    continue;
  }

  const isEn = isEnglishPath(file);
  const ctaHtml = isEn ? ENGLISH_INLINE_CTA : ARABIC_INLINE_CTA;

  // Find the best place to inject - right before the SEO internal links or before footer
  // Try to insert before brightai-internal-links or before </footer>
  if (content.includes('BRIGHTAI_INTERNAL_LINKS_START')) {
    content = content.replace('<!-- BRIGHTAI_INTERNAL_LINKS_START -->', `${ctaHtml}\n\n<!-- BRIGHTAI_INTERNAL_LINKS_START -->`);
  } else if (content.includes('class="footer"') || content.includes('<footer')) {
    // Insert before first footer tag
    const footerMatch = content.match(/<footer[\s>]/);
    if (footerMatch) {
      const pos = footerMatch.index;
      content = content.slice(0, pos) + ctaHtml + '\n\n' + content.slice(pos);
    } else {
      skipped++;
      continue;
    }
  } else {
    skipped++;
    continue;
  }

  writeFileSync(file, content, 'utf-8');
  injected++;
  console.log(`  ✅ ${isEn ? 'EN' : 'AR'} inline CTA: ${file.replace(ROOT, '')}`);
}

console.log(`\nDone: ${injected} pages with inline CTAs, ${skipped} skipped`);
