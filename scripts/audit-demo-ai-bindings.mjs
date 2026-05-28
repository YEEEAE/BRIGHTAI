import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const demoRoot = path.join(root, 'demo');
const requiredDemos = [
  'smart-hiring-system',
  'data-analyzer',
  'data-quality',
  'text-analysis',
  'customer-service-automation',
  'custom-ai-agent',
  'competitor-analysis-agent',
  'seo-ai-agent',
  'marketing-ai-agent',
  'opportunity-discovery-agent',
  'marketing-automation',
  'supply-chain-optimization',
  'ocr-demo',
  'smart-medical-archive',
  'smart-hospital-management',
  'ai-scolecs',
  'brightproject',
  'brightsales',
  'ai-tenders-analysis'
];

const forbiddenPatterns = [
  [/generativelanguage\.googleapis\.com/i, 'اتصال مباشر بجيميناي'],
  [/GEMINI_API_KEY/i, 'مفتاح جيميناي في HTML'],
  [/GOOGLE_API_KEY/i, 'مفتاح جوجل في HTML'],
  [/\bapiKey\b/i, 'حقل أو متغير مفتاح API في HTML']
];

function read(file) {
  return fs.readFileSync(file, 'utf8');
}

function parseConfig(html) {
  const match = html.match(/<script type="application\/json" id="demo-config">([\s\S]*?)<\/script>/);
  if (!match) return null;
  try {
    return JSON.parse(match[1]);
  } catch {
    return null;
  }
}

function hasUnifiedEngine(html) {
  return html.includes('/api/ai/chat/completions')
    || html.includes('/frontend/js/demo-premium.js')
    || html.includes('/frontend/js/gemini-demo-engine.js')
    || html.includes('/frontend/js/ai-agent-demo-suite.js')
    || html.includes('/frontend/js/ocr-demo.min.js');
}

function auditFile(file) {
  const html = read(file);
  const config = parseConfig(html);
  const issues = [];
  const warnings = [];

  for (const [pattern, label] of forbiddenPatterns) {
    if (pattern.test(html)) issues.push(label);
  }

  if (!hasUnifiedEngine(html)) issues.push('لا يوجد محرك موحد أو endpoint موحد');
  if (!config?.schemaName && !/data-schema|schemaName/i.test(html)) issues.push('لا يوجد schemaName واضح');
  if (!config?.demoType && !config?.agentType && !/data-demo-type|data-agent-demo/i.test(html)) issues.push('لا يوجد demoType أو agentType');
  if (!config?.fallbackResult && !/fallback/i.test(html)) issues.push('لا يوجد fallbackResult واضح');
  if (!/تعذر|خطأ|صار خلل بسيط|error-state|Error State/i.test(html)) warnings.push('حالة الخطأ غير واضحة نصياً');
  if (!/data-sample|استخدم مثال|عينة|Sample Data/i.test(html)) warnings.push('زر أو منطقة العينة غير واضحة');
  if (!/data-result-panel|result-panel|Result Dashboard|لوحة|النتيجة/i.test(html)) warnings.push('لوحة النتيجة غير واضحة');

  return {
    file: path.relative(root, file),
    demoType: config?.demoType || '',
    agentType: config?.agentType || '',
    schemaName: config?.schemaName || '',
    unified: hasUnifiedEngine(html),
    fallback: Boolean(config?.fallbackResult || /fallback/i.test(html)),
    issues,
    warnings,
    status: issues.length ? 'Fail' : warnings.length ? 'Warning' : 'Pass'
  };
}

const demoFiles = fs.readdirSync(demoRoot, { withFileTypes: true })
  .filter(entry => entry.isDirectory())
  .map(entry => path.join(demoRoot, entry.name, 'index.html'))
  .filter(file => fs.existsSync(file));

const reports = demoFiles.map(auditFile);
const missing = requiredDemos.filter(slug => !fs.existsSync(path.join(demoRoot, slug, 'index.html')));

console.log('=== Demo AI Binding Audit ===');
for (const report of reports) {
  const notes = [...report.issues, ...report.warnings].join(' | ') || 'لا توجد ملاحظات';
  console.log(`${report.status}\t${report.file}\t${report.demoType}\t${report.schemaName}\t${notes}`);
}

if (missing.length) {
  console.log(`Missing required demos: ${missing.join(', ')}`);
}

const failures = reports.filter(report => report.issues.length);
if (failures.length || missing.length) {
  console.error(`Demo AI audit failed: ${failures.length} files with blocking issues, ${missing.length} missing demos.`);
  process.exit(1);
}

console.log(`Demo AI audit passed with ${reports.filter(report => report.status === 'Warning').length} warnings.`);
