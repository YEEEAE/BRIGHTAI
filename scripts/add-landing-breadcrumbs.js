const fs = require('fs');
const path = require('path');

const root = process.cwd();
const landingDir = path.join(root, 'frontend/pages/landing');

const siloByFile = {
  'saudi-ai-consulting-riyadh.html': { name: 'سلة التسعير والاستشارة', url: 'https://brightai.site/frontend/pages/silos/pricing-consultation.html' },
  'saudi-ai-data-compliance-consulting.html': { name: 'سلة التسعير والاستشارة', url: 'https://brightai.site/frontend/pages/silos/pricing-consultation.html' },
  'saudi-process-automation.html': { name: 'سلة حلول الأعمال', url: 'https://brightai.site/frontend/pages/silos/business-solutions.html' },
  'saudi-customer-service-ai-agent.html': { name: 'سلة حلول الأعمال', url: 'https://brightai.site/frontend/pages/silos/business-solutions.html' },
  'saudi-enterprise-data-analytics.html': { name: 'سلة حلول الأعمال', url: 'https://brightai.site/frontend/pages/silos/business-solutions.html' },
  'saudi-bank-fraud-detection.html': { name: 'سلة القطاعات', url: 'https://brightai.site/frontend/pages/silos/sectors.html' },
  'saudi-predictive-maintenance-manufacturing.html': { name: 'سلة القطاعات', url: 'https://brightai.site/frontend/pages/silos/sectors.html' },
  'saudi-smart-medical-archive.html': { name: 'سلة القطاعات', url: 'https://brightai.site/frontend/pages/silos/sectors.html' },
  'saudi-hospitality-dynamic-pricing.html': { name: 'سلة القطاعات', url: 'https://brightai.site/frontend/pages/silos/sectors.html' },
  'saudi-logistics-route-optimization.html': { name: 'سلة القطاعات', url: 'https://brightai.site/frontend/pages/silos/sectors.html' }
};

const files = fs.readdirSync(landingDir).filter((name) => name.endsWith('.html'));
let updated = 0;

for (const file of files) {
  const filePath = path.join(landingDir, file);
  const html = fs.readFileSync(filePath, 'utf8');

  if (html.includes('"@type":"BreadcrumbList"')) {
    continue;
  }

  const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
  const canonicalMatch = html.match(/<link\s+rel="canonical"\s+href="([^"]+)"\s*\/?\s*>/i);

  const pageName = titleMatch ? titleMatch[1].split('|')[0].trim() : file.replace('.html', '');
  const pageUrl = canonicalMatch ? canonicalMatch[1].trim() : `https://brightai.site/frontend/pages/landing/${file}`;
  const silo = siloByFile[file] || { name: 'سلة حلول الأعمال', url: 'https://brightai.site/frontend/pages/silos/business-solutions.html' };

  const breadcrumbJson = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'الرئيسية', item: 'https://brightai.site/' },
      { '@type': 'ListItem', position: 2, name: silo.name, item: silo.url },
      { '@type': 'ListItem', position: 3, name: pageName, item: pageUrl }
    ]
  };

  const scriptTag = `<script type="application/ld+json">${JSON.stringify(breadcrumbJson)}</script>\n`;

  if (!html.includes('</head>')) {
    continue;
  }

  const next = html.replace('</head>', `${scriptTag}</head>`);
  fs.writeFileSync(filePath, next, 'utf8');
  updated += 1;
}

console.log(`تم تحديث ${updated} صفحة هبوط بإضافة BreadcrumbList.`);
