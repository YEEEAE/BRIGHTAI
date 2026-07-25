#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

// Hub back-links mapping
const hubBackLinks = {
  // Hub 1: AI Governance Platform spokes
  '/docs/ai-governance-saudi-arabia/': {
    hub: '/solutions/ai-governance-platform/',
    text: 'للحصول على منصة حوكمة كاملة، راجع',
    linkText: 'منصة حوكمة الذكاء الاصطناعي'
  },
  '/docs/ai-risk-management/': {
    hub: '/solutions/ai-governance-platform/',
    text: 'للحصول على منصة حوكمة كاملة، راجع',
    linkText: 'منصة حوكمة الذكاء الاصطناعي'
  },
  '/docs/ai-audit-readiness/': {
    hub: '/solutions/ai-governance-platform/',
    text: 'للحصول على منصة حوكمة كاملة، راجع',
    linkText: 'منصة حوكمة الذكاء الاصطناعي'
  },
  '/docs/governance-application/': {
    hub: '/solutions/ai-governance-platform/',
    text: 'للحصول على منصة حوكمة كاملة، راجع',
    linkText: 'منصة حوكمة الذكاء الاصطناعي'
  },
  '/solutions/continuous-ai-governance/': {
    hub: '/solutions/ai-governance-platform/',
    text: 'للحصول على منصة حوكمة كاملة، راجع',
    linkText: 'منصة حوكمة الذكاء الاصطناعي'
  },
  '/solutions/policy-to-control-mapping/': {
    hub: '/solutions/ai-governance-platform/',
    text: 'للحصول على منصة حوكمة كاملة، راجع',
    linkText: 'منصة حوكمة الذكاء الاصطناعي'
  },

  // Hub 2: AI Firewall spokes
  '/docs/ai-firewall/': {
    hub: '/solutions/ai-firewall/',
    text: 'للحصول على حل حماية بيانات كامل، راجع',
    linkText: 'AI Firewall لحماية البيانات الحساسة'
  },
  '/docs/pdpl-ai-governance/': {
    hub: '/solutions/ai-firewall/',
    text: 'للحصول على حل حماية بيانات كامل، راجع',
    linkText: 'AI Firewall لحماية البيانات الحساسة'
  },
  '/docs/pdpl-chatgpt-data-protection/': {
    hub: '/solutions/ai-firewall/',
    text: 'للحصول على حل حماية بيانات كامل، راجع',
    linkText: 'AI Firewall لحماية البيانات الحساسة'
  },
  '/pdpl-statement/': {
    hub: '/solutions/ai-firewall/',
    text: 'للحصول على حل حماية بيانات كامل، راجع',
    linkText: 'AI Firewall لحماية البيانات الحساسة'
  },
  '/kernel/chat/': {
    hub: '/solutions/ai-firewall/',
    text: 'للحصول على حل حماية بيانات كامل، راجع',
    linkText: 'AI Firewall لحماية البيانات الحساسة'
  },

  // Hub 3: AI Audit Trail spokes
  '/docs/ai-audit-trail/': {
    hub: '/solutions/ai-audit-trail/',
    text: 'للحصول على حل توثيق وتدقيق كامل، راجع',
    linkText: 'سجل تدقيق الذكاء الاصطناعي الشامل'
  },
  '/solutions/ai-evidence-file/': {
    hub: '/solutions/ai-audit-trail/',
    text: 'للحصول على حل توثيق وتدقيق كامل، راجع',
    linkText: 'سجل تدقيق الذكاء الاصطناعي الشامل'
  },
  '/docs/ai-evidence-file/': {
    hub: '/solutions/ai-audit-trail/',
    text: 'للحصول على حل توثيق وتدقيق كامل، راجع',
    linkText: 'سجل تدقيق الذكاء الاصطناعي الشامل'
  },
  '/kernel/audit/': {
    hub: '/solutions/ai-audit-trail/',
    text: 'للحصول على حل توثيق وتدقيق كامل، راجع',
    linkText: 'سجل تدقيق الذكاء الاصطناعي الشامل'
  },
  '/kernel/evidence/': {
    hub: '/solutions/ai-audit-trail/',
    text: 'للحصول على حل توثيق وتدقيق كامل، راجع',
    linkText: 'سجل تدقيق الذكاء الاصطناعي الشامل'
  }
};

function generateHubBackLink(config) {
  return `
<!-- ================= HUB BACK-LINK ================= -->
<section class="hub-backlink py-12 bg-gradient-to-b from-transparent via-brand-500/[.02] to-transparent">
  <div class="max-w-4xl mx-auto px-5 lg:px-8">
    <div class="glass rounded-2xl p-6 border border-brand-500/20 bg-brand-500/[.02]">
      <div class="flex items-start gap-4">
        <span class="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/30 flex items-center justify-center shrink-0">
          <iconify-icon class="text-brand-300 icon-arrow-up-right-from-square" icon="mdi:open-in-new"></iconify-icon>
        </span>
        <div>
          <p class="text-white/70 text-sm leading-relaxed">
            ${config.text} <a href="${config.hub}" class="text-brand-300 hover:text-white font-bold hover:underline">${config.linkText}</a>
          </p>
        </div>
      </div>
    </div>
  </div>
</section>
`;
}

function addHubBackLink(pageUrl, config) {
  // Convert URL to file path
  let filePath = path.join(ROOT, pageUrl.replace(/\/$/, ''), 'index.html');

  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf-8');

  // Check if hub back-link already exists
  if (content.includes('HUB BACK-LINK')) {
    console.log(`⏭️  Skipping ${pageUrl} - hub back-link already exists`);
    return;
  }

  const backLink = generateHubBackLink(config);

  // Find insertion point (before RELATED SOLUTIONS or BRIGHTAI_INTERNAL_LINKS)
  let insertBefore;

  if (content.includes('<!-- RELATED SOLUTIONS SECTION -->')) {
    insertBefore = '<!-- RELATED SOLUTIONS SECTION -->';
  } else if (content.includes('<!-- BRIGHTAI_INTERNAL_LINKS_START -->')) {
    insertBefore = '<!-- BRIGHTAI_INTERNAL_LINKS_START -->';
  } else if (content.includes('</main>')) {
    insertBefore = '</main>';
  } else {
    console.log(`⚠️  Could not find insertion point in ${pageUrl}`);
    return;
  }

  // Insert back-link
  content = content.replace(insertBefore, backLink + '\n' + insertBefore);

  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`✅ Added hub back-link to ${pageUrl}`);
}

// Process all pages
console.log('\n🔗 Adding Hub Back-Links...\n');

for (const [pageUrl, config] of Object.entries(hubBackLinks)) {
  addHubBackLink(pageUrl, config);
}

console.log('\n✅ Done! Hub back-links added.\n');
