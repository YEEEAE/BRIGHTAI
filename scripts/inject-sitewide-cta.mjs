import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

const ROOT = '/Users/yzydalshmry/Desktop/BRIGHTAI';

const ARABIC_CTA = `\n<div class="sitewide-cta" data-cta-section="footer">
<p>اتخذ الخطوة الأولى نحو التحول الرقمي</p>
<a href="/consultation/" class="sitewide-cta-primary" data-analytics-event="consultation_request" data-cta-location="footer">احجز جلسة تشخيص AI</a>
<a href="/demo/" class="sitewide-cta-secondary" data-analytics-event="request_demo" data-cta-location="footer">جرّب نماذج Bright AI</a>
<a href="https://api.whatsapp.com/send?phone=966538229013&text=%D8%A3%D8%B1%D9%8A%D8%AF%20%D8%A7%D8%B3%D8%AA%D8%B4%D8%A7%D8%B1%D8%A9%20%D8%AD%D9%88%D9%84%20%D8%AD%D9%84%D9%88%D9%84%20%D8%A7%D9%84%D8%B0%D9%83%D8%A7%D8%A1%20%D8%A7%D9%84%D8%A7%D8%B5%D8%B7%D9%86%D8%A7%D8%B9%D9%8A" class="sitewide-cta-whatsapp" data-analytics-event="whatsapp_click" data-cta-location="footer">تواصل عبر واتساب</a>
</div>`;

const ENGLISH_CTA = `\n<div class="sitewide-cta" data-cta-section="footer">
<p>Take the first step toward digital transformation</p>
<a href="/en/consultation/" class="sitewide-cta-primary" data-analytics-event="consultation_request" data-cta-location="footer">Book AI Diagnosis Session</a>
<a href="/en/demo/" class="sitewide-cta-secondary" data-analytics-event="request_demo" data-cta-location="footer">Try Bright AI Models</a>
<a href="https://api.whatsapp.com/send?phone=966538229013&text=I%27d%20like%20an%20AI%20consultation" class="sitewide-cta-whatsapp" data-analytics-event="whatsapp_click" data-cta-location="footer">Chat on WhatsApp</a>
</div>`;

function isArabicDir(filePath) {
  const rel = filePath.replace(ROOT, '');
  return rel.startsWith('/en/') ? false : true;
}

function getAllHtmlFiles(dir) {
  const results = [];
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === '.next') continue;
      results.push(...getAllHtmlFiles(fullPath));
    } else if (entry.name.endsWith('.html')) {
      results.push(fullPath);
    }
  }
  return results;
}

const files = getAllHtmlFiles(ROOT);
console.log(`Found ${files.length} HTML files`);

let injected = 0;
let skipped = 0;

for (const file of files) {
  const content = readFileSync(file, 'utf-8');
  
  // Skip if already has sitewide-cta
  if (content.includes('sitewide-cta') && content.includes('footer')) {
    skipped++;
    continue;
  }

  const isArabic = isArabicDir(file);
  const ctaHtml = isArabic ? ARABIC_CTA : ENGLISH_CTA;

  // Inject before </footer>
  const newContent = content.replace('</footer>', `${ctaHtml}\n</footer>`);

  if (newContent !== content) {
    writeFileSync(file, newContent, 'utf-8');
    injected++;
    console.log(`  ✅ INJECTED (${isArabic ? 'AR' : 'EN'}): ${file.replace(ROOT, '')}`);
  } else {
    skipped++;
  }
}

console.log(`\nDone: ${injected} injected, ${skipped} skipped (already have CTAs or no footer)`);
