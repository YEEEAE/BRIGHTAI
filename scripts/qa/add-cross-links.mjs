#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

// Mapping between solutions and docs
const solutionDocsMap = {
  'ai-governance-platform': [
    { path: '/docs/ai-governance-platform/', title: 'دليل منصة حوكمة الذكاء الاصطناعي', icon: 'mdi:book' },
    { path: '/docs/ai-governance-saudi-arabia/', title: 'حوكمة الذكاء الاصطناعي في السعودية', icon: 'mdi:flag' },
    { path: '/docs/ai-risk-management/', title: 'إدارة مخاطر الذكاء الاصطناعي', icon: 'mdi:alert-triangle' }
  ],
  'ai-firewall': [
    { path: '/docs/ai-firewall/', title: 'دليل جدار حماية الذكاء الاصطناعي', icon: 'mdi:shield-half-full' },
    { path: '/docs/pdpl-ai-governance/', title: 'PDPL والذكاء الاصطناعي', icon: 'mdi:lock' },
    { path: '/docs/ai-governance-saudi-arabia/', title: 'حوكمة الذكاء الاصطناعي في السعودية', icon: 'mdi:flag' }
  ],
  'ai-audit-trail': [
    { path: '/docs/ai-audit-trail/', title: 'دليل سجل تدقيق الذكاء الاصطناعي', icon: 'mdi:clipboard-list' },
    { path: '/docs/ai-audit-readiness/', title: 'جاهزية التدقيق للذكاء الاصطناعي', icon: 'mdi:clipboard-check' },
    { path: '/docs/nca-ecc-ai-governance/', title: 'ضوابط NCA ECC للذكاء الاصطناعي', icon: 'mdi:shield' }
  ],
  'human-approval-layer': [
    { path: '/docs/human-approval-layer/', title: 'دليل طبقة الموافقة البشرية', icon: 'mdi:account-check' },
    { path: '/docs/ai-governance-platform/', title: 'دليل منصة حوكمة الذكاء الاصطناعي', icon: 'mdi:book' },
    { path: '/docs/ai-risk-management/', title: 'إدارة مخاطر الذكاء الاصطناعي', icon: 'mdi:alert-triangle' }
  ],
  'ai-evidence-file': [
    { path: '/docs/ai-evidence-file/', title: 'دليل ملف أدلة الذكاء الاصطناعي', icon: 'mdi:folder-open' },
    { path: '/docs/ai-audit-readiness/', title: 'جاهزية التدقيق للذكاء الاصطناعي', icon: 'mdi:clipboard-check' },
    { path: '/docs/ai-audit-trail/', title: 'دليل سجل تدقيق الذكاء الاصطناعي', icon: 'mdi:clipboard-list' }
  ],
  'continuous-ai-governance': [
    { path: '/docs/ai-governance-platform/', title: 'دليل منصة حوكمة الذكاء الاصطناعي', icon: 'mdi:book' },
    { path: '/docs/ai-governance-saudi-arabia/', title: 'حوكمة الذكاء الاصطناعي في السعودية', icon: 'mdi:flag' },
    { path: '/docs/ai-risk-management/', title: 'إدارة مخاطر الذكاء الاصطناعي', icon: 'mdi:alert-triangle' }
  ],
  'ai-risk-classification': [
    { path: '/docs/ai-risk-management/', title: 'إدارة مخاطر الذكاء الاصطناعي', icon: 'mdi:alert-triangle' },
    { path: '/docs/ai-governance-platform/', title: 'دليل منصة حوكمة الذكاء الاصطناعي', icon: 'mdi:book' },
    { path: '/docs/ai-audit-readiness/', title: 'جاهزية التدقيق للذكاء الاصطناعي', icon: 'mdi:clipboard-check' }
  ],
  'ai-use-case-discovery': [
    { path: '/docs/ai-governance-platform/', title: 'دليل منصة حوكمة الذكاء الاصطناعي', icon: 'mdi:book' },
    { path: '/docs/ai-governance-saudi-arabia/', title: 'حوكمة الذكاء الاصطناعي في السعودية', icon: 'mdi:flag' },
    { path: '/docs/ai-risk-management/', title: 'إدارة مخاطر الذكاء الاصطناعي', icon: 'mdi:alert-triangle' }
  ],
  'policy-to-control-mapping': [
    { path: '/docs/ai-governance-platform/', title: 'دليل منصة حوكمة الذكاء الاصطناعي', icon: 'mdi:book' },
    { path: '/docs/nca-ecc-ai-governance/', title: 'ضوابط NCA ECC للذكاء الاصطناعي', icon: 'mdi:shield' },
    { path: '/docs/pdpl-ai-governance/', title: 'PDPL والذكاء الاصطناعي', icon: 'mdi:lock' }
  ]
};

// Mapping docs to solutions
const docsSolutionsMap = {
  'ai-governance-platform': [
    { path: '/solutions/ai-governance-platform/', title: 'منصة حوكمة الذكاء الاصطناعي' },
    { path: '/solutions/continuous-ai-governance/', title: 'حوكمة مستمرة للذكاء الاصطناعي' },
    { path: '/solutions/policy-to-control-mapping/', title: 'ربط السياسات بالضوابط' }
  ],
  'ai-firewall': [
    { path: '/solutions/ai-firewall/', title: 'جدار حماية الذكاء الاصطناعي' },
    { path: '/solutions/ai-governance-platform/', title: 'منصة حوكمة الذكاء الاصطناعي' }
  ],
  'ai-audit-trail': [
    { path: '/solutions/ai-audit-trail/', title: 'سجل تدقيق الذكاء الاصطناعي' },
    { path: '/solutions/ai-evidence-file/', title: 'ملف أدلة الذكاء الاصطناعي' }
  ],
  'human-approval-layer': [
    { path: '/solutions/human-approval-layer/', title: 'طبقة الموافقة البشرية' },
    { path: '/solutions/ai-governance-platform/', title: 'منصة حوكمة الذكاء الاصطناعي' }
  ],
  'ai-evidence-file': [
    { path: '/solutions/ai-evidence-file/', title: 'ملف أدلة الذكاء الاصطناعي' },
    { path: '/solutions/ai-audit-trail/', title: 'سجل تدقيق الذكاء الاصطناعي' }
  ],
  'ai-governance-saudi-arabia': [
    { path: '/solutions/ai-governance-platform/', title: 'منصة حوكمة الذكاء الاصطناعي' },
    { path: '/solutions/continuous-ai-governance/', title: 'حوكمة مستمرة للذكاء الاصطناعي' }
  ],
  'pdpl-ai-governance': [
    { path: '/solutions/ai-firewall/', title: 'جدار حماية الذكاء الاصطناعي' },
    { path: '/solutions/ai-governance-platform/', title: 'منصة حوكمة الذكاء الاصطناعي' }
  ],
  'nca-ecc-ai-governance': [
    { path: '/solutions/ai-governance-platform/', title: 'منصة حوكمة الذكاء الاصطناعي' },
    { path: '/solutions/policy-to-control-mapping/', title: 'ربط السياسات بالضوابط' }
  ],
  'ai-risk-management': [
    { path: '/solutions/ai-risk-classification/', title: 'تصنيف مخاطر الذكاء الاصطناعي' },
    { path: '/solutions/ai-governance-platform/', title: 'منصة حوكمة الذكاء الاصطناعي' }
  ],
  'ai-audit-readiness': [
    { path: '/solutions/ai-audit-trail/', title: 'سجل تدقيق الذكاء الاصطناعي' },
    { path: '/solutions/ai-evidence-file/', title: 'ملف أدلة الذكاء الاصطناعي' }
  ]
};

function generateRelatedDocsSection(docs) {
  const cards = docs.map(doc => `
      <article class="glass rounded-2xl p-6 hover:border-brand-500/40 transition-all">
        <div class="flex items-center gap-3 mb-3">
          <span class="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/30 flex items-center justify-center shrink-0">
            <iconify-icon icon="${doc.icon}" class="text-brand-300"></iconify-icon>
          </span>
          <h3 class="text-lg font-bold">${doc.title}</h3>
        </div>
        <p class="text-white/60 text-sm leading-relaxed mb-4">دليل تفصيلي يساعدك على فهم وتطبيق هذا الحل.</p>
        <a href="${doc.path}" class="text-brand-300 hover:text-white text-sm inline-flex items-center gap-2">
          <span>اقرأ الدليل</span>
          <iconify-icon class="text-xs icon-arrow-left" icon="mdi:arrow-left"></iconify-icon>
        </a>
      </article>`).join('\n');

  return `
<!-- ================= RELATED DOCS SECTION ================= -->
<section class="related-docs py-16 bg-gradient-to-b from-transparent via-brand-500/[.03] to-transparent">
  <div class="max-w-7xl mx-auto px-5 lg:px-8">
    <div class="text-center max-w-3xl mx-auto mb-10">
      <h2 class="text-2xl sm:text-3xl font-black">📚 الوثائق ذات الصلة</h2>
      <p class="mt-3 text-white/70 leading-loose text-sm">أدلة تفصيلية تساعدك على فهم وتطبيق هذا الحل</p>
    </div>

    <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
${cards}
    </div>
  </div>
</section>
`;
}

function generateRelatedSolutionsSection(solutions) {
  const links = solutions.map(sol =>
    `        <li><a href="${sol.path}" class="text-brand-300 hover:text-white hover:underline">${sol.title}</a></li>`
  ).join('\n');

  return `
<!-- ================= RELATED SOLUTIONS SECTION ================= -->
<section class="related-solutions py-16 bg-gradient-to-b from-transparent via-brand-500/[.03] to-transparent">
  <div class="max-w-4xl mx-auto px-5 lg:px-8">
    <div class="glass rounded-2xl p-8">
      <h2 class="text-2xl font-black mb-3">💼 الحلول التجارية</h2>
      <p class="text-white/70 mb-6">للحصول على حل كامل وجاهز للتطبيق، راجع:</p>
      <ul class="space-y-3 text-lg">
${links}
      </ul>
    </div>
  </div>
</section>
`;
}

function addSectionBeforeFooter(filePath, section, isDocsPage = false) {
  let content = fs.readFileSync(filePath, 'utf-8');

  // Check if section already exists
  if (content.includes('RELATED DOCS SECTION') || content.includes('RELATED SOLUTIONS SECTION')) {
    console.log(`⏭️  Skipping ${filePath} - section already exists`);
    return;
  }

  let insertBefore;

  if (isDocsPage) {
    // For docs pages, insert before </main> or BRIGHTAI_INTERNAL_LINKS
    if (content.includes('<!-- BRIGHTAI_INTERNAL_LINKS_START -->')) {
      insertBefore = '<!-- BRIGHTAI_INTERNAL_LINKS_START -->';
    } else if (content.includes('</main>')) {
      insertBefore = '</main>';
    } else {
      console.log(`⚠️  Warning: Could not find insertion point in ${filePath}`);
      return;
    }
  } else {
    // For solution pages
    const footerMarker = '<!-- ================= FOOTER ================= -->';
    const floatingWAMarker = '<!-- ================= FLOATING WHATSAPP BUTTON ================= -->';

    insertBefore = footerMarker;
    if (content.includes(floatingWAMarker)) {
      insertBefore = floatingWAMarker;
    }

    if (!content.includes(insertBefore)) {
      console.log(`⚠️  Warning: Could not find insertion point in ${filePath}`);
      return;
    }
  }

  // Insert section before marker
  content = content.replace(insertBefore, section + '\n' + insertBefore);

  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`✅ Added section to ${filePath}`);
}

// Process all solution pages
console.log('\n📄 Processing Solution Pages...\n');
for (const [solutionName, docs] of Object.entries(solutionDocsMap)) {
  const filePath = path.join(ROOT, 'solutions', solutionName, 'index.html');
  if (fs.existsSync(filePath)) {
    const section = generateRelatedDocsSection(docs);
    addSectionBeforeFooter(filePath, section);
  } else {
    console.log(`⚠️  File not found: ${filePath}`);
  }
}

// Process all docs pages
console.log('\n📚 Processing Docs Pages...\n');
for (const [docName, solutions] of Object.entries(docsSolutionsMap)) {
  const filePath = path.join(ROOT, 'docs', docName, 'index.html');
  if (fs.existsSync(filePath)) {
    const section = generateRelatedSolutionsSection(solutions);
    addSectionBeforeFooter(filePath, section, true); // true = isDocsPage
  } else {
    console.log(`⚠️  File not found: ${filePath}`);
  }
}

console.log('\n✅ Done! Cross-linking completed.\n');
