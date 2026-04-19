#!/usr/bin/env node
/**
 * Creates missing English (/en/) pages from Arabic source pages.
 * Handles: dir, lang, canonical, hreflang, title, description, keywords,
 * schema JSON-LD, og/twitter meta, navigation text, and font swaps.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { dirname } from 'path';

const ROOT = '/Users/yzydalshmry/Desktop/BRIGHTAI';

const pages = [
  {
    src: 'ai-bots/BrightMath/index.html',
    dest: 'en/ai-bots/BrightMath/index.html',
    title: 'BrightMath | Smart Math Assistant in Saudi Arabia',
    description: 'BrightMath - AI-powered smart math assistant by Bright AI. Solve complex math problems, analyze data, and enhance education in Saudi Arabia with clear, accurate steps.',
    keywords: 'smart math assistant, AI math solver, math education Saudi Arabia, smart learning tech, BrightMath, Bright AI, AI for students',
    ogTitle: 'BrightMath - Smart Math Assistant',
    ogDescription: 'BrightMath - AI-powered smart math assistant by Bright AI. Solve complex math problems and enhance education in Saudi Arabia.',
    schemaName: 'BrightMath',
    schemaDesc: 'Smart assistant for solving mathematical problems and analyses in English.',
  },
  {
    src: 'ai-bots/BrightProject/index.html',
    dest: 'en/ai-bots/BrightProject/index.html',
    title: 'BrightProject | Smart Project Management Bot in Saudi Arabia',
    description: 'BrightProject - Smart project management bot by Bright AI. Organize tasks, track progress, and automate workflows to boost productivity for Saudi and Middle East enterprises.',
    keywords: 'AI project management, task management bot, project automation, project management software Saudi Arabia, smart project planning, BrightProject, Bright AI',
    ogTitle: 'BrightProject - Smart Project Management Bot',
    ogDescription: 'BrightProject - Smart project management bot by Bright AI. Organize tasks and automate workflows for Saudi enterprises.',
    schemaName: 'BrightProject',
    schemaDesc: 'Smart project management bot for Saudi enterprises with task tracking and workflow automation.',
  },
  {
    src: 'ai-bots/BrightRecruiter/index.html',
    dest: 'en/ai-bots/BrightRecruiter/index.html',
    title: 'BrightRecruiter | Smart Recruitment Bot in Saudi Arabia',
    description: 'BrightRecruiter - Smart recruitment bot by Bright AI. Automate CV screening and initial interviews to hire the best talent for Saudi companies and institutions efficiently.',
    keywords: 'smart recruitment bot, AI hiring, automated recruitment systems Saudi Arabia, automated CV screening, smart interviews, BrightRecruiter, Bright AI',
    ogTitle: 'BrightRecruiter - Smart Recruitment Bot',
    ogDescription: 'BrightRecruiter - Smart recruitment bot by Bright AI. Automate CV screening and interviews for Saudi enterprises.',
    schemaName: 'BrightRecruiter',
    schemaDesc: 'Smart recruitment bot for Saudi enterprises with automated CV screening and interview capabilities.',
  },
  {
    src: 'ai-bots/BrightSales/index.html',
    dest: 'en/ai-bots/BrightSales/index.html',
    title: 'BrightSales | Smart Sales Bot in Saudi Arabia',
    description: 'BrightSales - Smart sales bot by Bright AI. Convert visitors into real customers and increase your company revenue in Saudi Arabia through smart lead qualification and automated sales pipelines.',
    keywords: 'smart sales bot, AI sales increase, lead qualification Saudi Arabia, sales automation, B2B solutions Saudi, BrightSales, Bright AI',
    ogTitle: 'BrightSales - Smart Sales Bot',
    ogDescription: 'BrightSales - Smart sales bot by Bright AI. Convert visitors into customers and boost revenue for Saudi enterprises.',
    schemaName: 'BrightSales',
    schemaDesc: 'Smart sales bot for Saudi enterprises with lead qualification and automated sales pipelines.',
  },
  {
    src: 'ai-bots/BrightSupport/index.html',
    dest: 'en/ai-bots/BrightSupport/index.html',
    title: 'BrightSupport | Smart Customer Service Bot in Saudi Arabia',
    description: 'BrightSupport - Smart customer service bot by Bright AI. Elevate your customer experience in Saudi Arabia with 24/7 automated support in natural advanced Arabic.',
    keywords: 'smart customer service bot, Arabic chatbot, AI tech support Saudi Arabia, customer service automation, improve customer experience, BrightSupport, Bright AI',
    ogTitle: 'BrightSupport - Smart Customer Service Bot',
    ogDescription: 'BrightSupport - Smart customer service bot by Bright AI. 24/7 automated support for Saudi enterprises.',
    schemaName: 'BrightSupport',
    schemaDesc: 'Smart customer service bot for Saudi enterprises with Arabic support and instant integration.',
  },
  {
    src: 'contact/index.html',
    dest: 'en/contact/index.html',
    title: 'Contact Bright AI | AI Experts in Riyadh',
    description: 'Contact the Bright AI team in Riyadh to book a consultation on enterprise AI solutions, data analysis, and smart automation for Saudi companies.',
    ogTitle: 'Contact Us | Bright AI - AI Experts in Saudi Arabia',
    ogDescription: 'Contact the Bright AI team in Riyadh. Free consultations for enterprise AI solutions and data analysis for Saudi companies.',
  },
  {
    src: 'privacy-cookies/index.html',
    dest: 'en/privacy-cookies/index.html',
    title: 'Cookie Policy | Bright AI Saudi Arabia',
    description: 'Bright AI Saudi Arabia cookie policy explains how cookies and tracking technologies are used to improve performance, browsing experience, and manage preferences.',
    keywords: 'cookie policy, Bright AI Saudi Arabia, Bright AI, cookies, tracking technologies, privacy',
    ogTitle: 'Cookie Policy | Bright AI Saudi Arabia',
    ogDescription: 'Bright AI cookie policy explains how cookies and tracking technologies are used to improve performance and browsing experience.',
  },
  {
    src: 'terms/index.html',
    dest: 'en/terms/index.html',
    title: 'Terms of Use for Customers and Visitors in Saudi Arabia | Bright AI',
    description: 'Review Bright AI terms of use for customers and visitors in Saudi Arabia, including access to digital services, usage limits, and basic obligations between parties.',
    keywords: 'terms of use, Bright AI, Saudi Arabia, digital services, usage limits, legal terms',
    ogTitle: 'Terms of Use | Bright AI Saudi Arabia',
    ogDescription: 'Review Bright AI terms of use for customers and visitors in Saudi Arabia, including digital services access and usage limits.',
  },
];

function escRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

function transformHtml(html, page) {
  let h = html;
  const arPath = page.src.replace('index.html', '');
  const enPath = page.dest.replace('index.html', '');
  const arUrl = `https://brightai.site/${arPath}`;
  const enUrl = `https://brightai.site/${enPath}`;

  // 1. dir rtl → ltr
  h = h.replace(/dir="rtl"/g, 'dir="ltr"');

  // 2. lang on <html> tag only (NOT hreflang="ar-SA")
  h = h.replace(/(<html[^>]*\slang=")ar-SA(")/g, '$1en-SA$2');

  // 3. Add scroll-smooth if missing
  if (!h.includes('class="scroll-smooth"')) {
    h = h.replace(/<html\s+/, '<html class="scroll-smooth" ');
  }

  // 4. Canonical URL - only in <link rel="canonical">
  h = h.replace(
    new RegExp(`(<link\\s+rel="canonical"\\s+href=")${escRe(arUrl)}("\\s*/?>)`),
    `$1${enUrl}$2`
  );

  // 5. og:url - only in <meta property="og:url">
  h = h.replace(
    new RegExp(`(<meta\\s+property="og:url"\\s+content=")${escRe(arUrl)}("\\s*/?>)`),
    `$1${enUrl}$2`
  );

  // 6. Title
  if (page.title) {
    h = h.replace(/<title>[^<]*<\/title>/, `<title>${page.title}</title>`);
  }

  // 7. Meta description
  if (page.description) {
    h = h.replace(
      /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/,
      `<meta name="description" content="${page.description}" />`
    );
    // variant format
    h = h.replace(
      /<meta\s+name="description"\s*content="[^"]*"/,
      `<meta name="description" content="${page.description}"`
    );
  }

  // 8. Keywords
  if (page.keywords) {
    h = h.replace(
      /<meta\s+name="keywords"\s+content="[^"]*"\s*\/?>/,
      `<meta name="keywords" content="${page.keywords}" />`
    );
    h = h.replace(
      /<meta\s+name="keywords"\s*content="[^"]*"/,
      `<meta name="keywords" content="${page.keywords}"`
    );
  }

  // 9. og:title / og:description
  if (page.ogTitle) {
    h = h.replace(/property="og:title"\s*content="[^"]*"/g, `property="og:title" content="${page.ogTitle}"`);
    h = h.replace(/content="[^"]*"\s*property="og:title"/g, `content="${page.ogTitle}" property="og:title"`);
  }
  if (page.ogDescription) {
    h = h.replace(/property="og:description"\s*content="[^"]*"/g, `property="og:description" content="${page.ogDescription}"`);
    h = h.replace(/content="[^"]*"\s*property="og:description"/g, `content="${page.ogDescription}" property="og:description"`);
  }

  // 10. og:locale swap
  h = h.replace(/property="og:locale"\s*content="ar_SA"/g, 'property="og:locale" content="en_SA"');
  h = h.replace(/content="ar_SA"\s*property="og:locale"/g, 'content="en_SA" property="og:locale"');
  h = h.replace(/property="og:locale:alternate"\s*content="en_SA"/g, 'property="og:locale:alternate" content="ar_SA"');
  h = h.replace(/content="en_SA"\s*property="og:locale:alternate"/g, 'content="ar_SA" property="og:locale:alternate"');

  // 11. og:site_name
  h = h.replace(/property="og:site_name"\s*content="مُشرقة AI"/g, 'property="og:site_name" content="Bright AI"');
  h = h.replace(/property="og:site_name"\s*content="Bright AI - مُشرقة للذكاء الاصطناعي"/g, 'property="og:site_name" content="Bright AI"');

  // 12. Twitter meta
  if (page.ogTitle) {
    h = h.replace(/name="twitter:title"\s*content="[^"]*"/g, `name="twitter:title" content="${page.ogTitle}"`);
    h = h.replace(/content="[^"]*"\s*name="twitter:title"/g, `content="${page.ogTitle}" name="twitter:title"`);
  }
  if (page.ogDescription) {
    h = h.replace(/name="twitter:description"\s*content="[^"]*"/g, `name="twitter:description" content="${page.ogDescription}"`);
    h = h.replace(/content="[^"]*"\s*name="twitter:description"/g, `content="${page.ogDescription}" name="twitter:description"`);
  }

  // 13. Schema JSON-LD
  h = h.replace(/"inLanguage"\s*:\s*"ar"/g, '"inLanguage": "en"');
  h = h.replace(/"inLanguage"\s*:\s*"ar-SA"/g, '"inLanguage": "en-SA"');
  // Update schema URLs - targeted replacements only (NOT global, to preserve hreflang)
  // Schema "url" field
  const arUrlEsc = escRe(arUrl);
  h = h.replace(
    new RegExp(`("url"\\s*:\\s*")${arUrlEsc}"`),
    `$1${enUrl}"`
  );
  // Breadcrumb "item" field that matches this page's Arabic URL
  h = h.replace(
    new RegExp(`("item"\\s*:\\s*")${arUrlEsc}"`),
    `$1${enUrl}"`
  );
  // Update schema descriptions for ai-bots
  if (page.schemaDesc) {
    h = h.replace(
      /"description"\s*:\s*"[^"]*(?:مساعد|روبوت)[^"]*"/,
      `"description": "${page.schemaDesc}"`
    );
  }
  // Breadcrumb names
  h = h.replace(/"name"\s*:\s*"الرئيسية"/g, '"name": "Home"');
  h = h.replace(/"name"\s*:\s*"روبوتات AI"/g, '"name": "AI Bots"');
  h = h.replace(/"name"\s*:\s*"وكلاء الذكاء الاصطناعي"/g, '"name": "AI Agents"');
  // Schema name for terms/privacy
  if (page.schemaName) {
    h = h.replace(/"name"\s*:\s*"سياسة ملفات تعريف الارتباط"/g, `"name": "${page.schemaName}"`);
    h = h.replace(/"name"\s*:\s*"شروط استخدام منصة Bright AI"/g, `"name": "${page.schemaName}"`);
  }

  // 14. Font swap
  h = h.replace(/font-family:\s*'Tajawal'/g, "font-family: 'IBM Plex Sans Arabic'");
  h = h.replace(/family=Tajawal/g, 'family=IBM+Plex+Sans+Arabic');

  // 15. Navigation text replacements
  const navMap = {
    'الحلول الذكية': 'Smart Solutions',
    'نظام تحليل العقود والمناقصات': 'Contract & Tender Analysis System',
    'ContractAI للعقود والاعتمادات': 'ContractAI for Docs & Approvals',
    'منصة Bright AI Agents': 'Bright AI Agents Platform',
    'بناء وإدارة الوكلاء الأذكياء': 'Build & Manage Smart Agents',
    'الأتمتة الذكية': 'Smart Automation',
    'وسير العمل المتقدم': 'Next-Gen Workflows',
    'الذكاء الاصطناعي كخدمة': 'AI as a Service',
    'استشارات': 'Consultation',
    'حلول مخصصة لشركتك': 'Custom Solutions for Your Biz',
    'تحليل البيانات': 'Data Analysis',
    'رؤى دقيقة وقرارات ذكية': 'Spot-On Insights & Smart Moves',
    'النماذج الذكية': 'Smart Models',
    'الأرشيف الطبي الذكي': 'Smart Medical Archive',
    'منصة التوظيف الذكي': 'Smart Hiring Platform',
    'المنصة التعليمية الذكية': 'Smart Ed Platform',
    'حلول AI الطبية المتقدمة': 'Advanced Health AI Solutions',
    'عن برايت': 'About Bright',
    'المستندات': 'Docs',
    'المكتبة الذكية': 'Smart Library',
    'البحث في الموقع': 'Search the site',
    'بحث...': 'Search...',
    'ابدأ رحلة التحول عبر الواتساب': 'Start your transformation journey on WhatsApp',
    'تواصل معنا عبر الواتساب': 'Hit us up on WhatsApp',
    'ابدأ رحلة التحول': 'Start Your Glow-Up',
    'فتح القائمة': 'Open Menu',
    'إغلاق القائمة': 'Close Menu',
    'القائمة': 'Menu',
    'الحلول والخدمات': 'Solutions & Services',
    'AIaaS — الذكاء كخدمة': 'AIaaS — AI as a Service',
    'Bright AI — الصفحة الرئيسية': 'Bright AI — Home Page',
    'الرئيسية — Bright AI حلول ذكاء اصطناعي': 'Home — Bright AI Smart Solutions',
    'مُشرقة للذكاء الاصطناعي': 'Bright AI',
    'مُشرقة AI': 'Bright AI',
    'أرسل رسالتك...': 'Type your message...',
    'يرجى كتابة رسالة': 'Please type a message',
    'جاري الكتابة...': 'Typing...',
    'مساعد ذكي': 'Smart Assistant',
  };
  // Sort by length descending to avoid partial replacements
  const navEntries = Object.entries(navMap).sort((a, b) => b[0].length - a[0].length);
  for (const [ar, en] of navEntries) {
    h = h.split(ar).join(en);
  }

  // 16. Fix nav links for English pages
  h = h.replace(/href="\/about\/"/g, 'href="/en/about/"');
  h = h.replace(/href="\/smart-automation\/"/g, 'href="/en/smart-automation/"');
  h = h.replace(/href="\/ai-agent\/"/g, 'href="/en/ai-agent/"');
  h = h.replace(/href="\/tenders\/landing\/"/g, 'href="/en/tenders/landing/"');
  h = h.replace(/href="\/data-analysis\/"/g, 'href="/en/data-analysis/"');
  h = h.replace(/href="\/contact\/"/g, 'href="/en/contact/"');
  h = h.replace(/href="\/smart-medical-archive\/"/g, 'href="/en/smart-medical-archive/"');
  h = h.replace(/href="\/interview\/"/g, 'href="/en/interview/"');
  h = h.replace(/href="\/health\/"/g, 'href="/en/health/"');
  h = h.replace(/href="\/docs\/"/g, 'href="/en/docs/docs.html"');

  // 17. LTR CSS fixes
  h = h.replace(/margin-right:\s*10px;/g, 'margin-left: 10px;');

  return h;
}

// Process each page
for (const page of pages) {
  const srcPath = `${ROOT}/${page.src}`;
  const destPath = `${ROOT}/${page.dest}`;

  if (!existsSync(srcPath)) {
    console.error(`❌ Source not found: ${srcPath}`);
    continue;
  }

  if (existsSync(destPath)) {
    console.log(`⏭️  Already exists: ${destPath}`);
    continue;
  }

  console.log(`📝 Creating: ${destPath}`);

  const srcHtml = readFileSync(srcPath, 'utf-8');
  const enHtml = transformHtml(srcHtml, page);

  mkdirSync(dirname(destPath), { recursive: true });
  writeFileSync(destPath, enHtml, 'utf-8');
  console.log(`✅ Created: ${destPath}`);
}

console.log('\n🎉 Done! All missing /en/ pages created.');
