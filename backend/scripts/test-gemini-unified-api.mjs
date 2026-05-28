import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { setTimeout as delay } from 'node:timers/promises';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(new URL(import.meta.url).pathname);
const backendRoot = path.resolve(__dirname, '..');
const projectRoot = path.resolve(backendRoot, '..');

try {
  const dotenv = require('dotenv');
  for (const file of [path.join(projectRoot, '.env'), path.join(backendRoot, '.env')]) {
    if (fs.existsSync(file)) dotenv.config({ path: file, override: false });
  }
} catch {
  // dotenv is optional for hosted environments.
}

const liveMode = process.argv.includes('--live');
const mockMode = process.env.AI_GATEWAY_MOCK_MODE === '1' && !liveMode;
const hasGeminiKey = Boolean(String(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '').trim());

if (liveMode && !hasGeminiKey) {
  console.log('Live test skipped: GEMINI_API_KEY is not configured');
  process.exit(0);
}

process.env.PORT = process.env.AI_GATEWAY_TEST_PORT || String(3410 + Math.floor(Math.random() * 200));

const BASE_URL = `http://127.0.0.1:${process.env.PORT}`;
const ENDPOINT = `${BASE_URL}/api/ai/chat/completions`;
const REQUIRED_FIELDS = [
  'executive_summary_ar',
  'readiness_score',
  'key_insights',
  'risks',
  'recommended_actions',
  'business_impact_ar',
  'integration_readiness',
  'next_action_ar',
  'whatsapp_summary_ar'
];

const DEMOS = [
  ['smart_hiring_system', 'smartHiringSchema', 'recruitment_agent'],
  ['data_analyzer', 'dataAnalyzerSchema', 'data_analysis_agent'],
  ['customer_support', 'customerSupportSchema', 'support_agent'],
  ['custom_ai_agent', 'customAiAgentSchema', 'custom_agent'],
  ['competitor_analysis_agent', 'competitorAnalysisAgentSchema', 'competitor_analysis_agent'],
  ['seo_agent', 'seoAgentSchema', 'seo_agent'],
  ['marketing_agent', 'marketingAgentSchema', 'marketing_agent'],
  ['opportunity_discovery_agent', 'opportunityDiscoveryAgentSchema', 'sales_leads_agent'],
  ['marketing_automation', 'marketingAutomationSchema', 'marketing_automation_agent'],
  ['supply_chain', 'supplyChainSchema', 'supply_chain_agent'],
  ['document_automation', 'documentAutomationSchema', 'document_automation_agent'],
  ['medical_archive', 'medicalArchiveSchema', 'medical_archive_agent'],
  ['hospital_ops', 'hospitalOpsSchema', 'hospital_ops_agent'],
  ['education', 'educationSchema', 'education_agent']
];

function demoPath(demoType) {
  const aliases = {
    smart_hiring_system: 'smart-hiring-system',
    customer_support: 'customer-service-automation',
    supply_chain: 'supply-chain-optimization',
    document_automation: 'ocr-demo',
    medical_archive: 'smart-medical-archive',
    hospital_ops: 'smart-hospital-management',
    seo_agent: 'seo-ai-agent',
    marketing_agent: 'marketing-ai-agent',
    education: 'ai-scolecs'
  };
  return `/demo/${aliases[demoType] || demoType.replaceAll('_', '-')}/`;
}

function payloadFor(demoType, schemaName, agentType) {
  return {
    model: 'gemini-2.5-flash',
    demoType,
    agentType,
    schemaName,
    locale: 'ar-SA',
    sourcePage: demoPath(demoType),
    messages: [
      {
        role: 'system',
        content: 'أنت مساعد تحليلي يعيد JSON منظم فقط.'
      },
      {
        role: 'user',
        content: 'استخدم بيانات تجريبية مختصرة واعد تقريراً عربياً منظماً.'
      }
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: schemaName,
        schema: {}
      }
    },
    temperature: 0.2
  };
}

function scanForUnsafeOutput(value) {
  const text = typeof value === 'string' ? value : JSON.stringify(value);
  return {
    apiKey: /(AIza[0-9A-Za-z_-]{20,}|sk-[0-9A-Za-z_-]{20,}|gsk_[0-9A-Za-z_-]{20,}|GEMINI_API_KEY\s*[:=]\s*[A-Za-z0-9_-]{8,})/.test(text),
    stackTrace: /\b(at\s+\w+|Traceback|Unhandled|Module\._compile|node:internal)\b/.test(text),
    rawProviderError: /(generativelanguage\.googleapis\.com|"error"\s*:\s*\{\s*"code"\s*:\s*\d+|GEMINI_API_\d{3}|API key not valid)/i.test(text)
  };
}

function validateResponse({ status, body, schemaName }) {
  const data = body?.data;
  const structuredProviderError = liveMode
    && body?.ok === false
    && body?.error
    && ['AI_PROVIDER_RATE_LIMITED', 'AI_PROVIDER_UNAVAILABLE', 'AI_PROVIDER_TIMEOUT'].includes(body.error.code);
  const missingFields = REQUIRED_FIELDS.filter((field) => !(data && Object.prototype.hasOwnProperty.call(data, field)));
  const unsafe = scanForUnsafeOutput(body);
  const failures = [];

  if (mockMode && status !== 200) failures.push(`expected 200 got ${status}`);
  if (mockMode && body?.ok !== true) failures.push('ok is not true');
  if (mockMode && body?.provider !== 'mock-gemini') failures.push(`provider is ${body?.provider || 'missing'}`);
  if (!structuredProviderError && (!data || typeof data !== 'object')) failures.push('data is missing');
  if (!structuredProviderError && missingFields.length) failures.push(`missing fields: ${missingFields.join(', ')}`);
  if (body?.schemaName && body.schemaName !== schemaName) failures.push(`schema mismatch: ${body.schemaName}`);
  if (unsafe.apiKey) failures.push('API key leak detected');
  if (unsafe.stackTrace) failures.push('stack trace detected');
  if (unsafe.rawProviderError) failures.push('raw provider error detected');

  return {
    failures,
    fieldsValidated: structuredProviderError ? 0 : REQUIRED_FIELDS.length - missingFields.length,
    structuredProviderError
  };
}

async function waitForServer() {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      const res = await fetch(`${BASE_URL}/api/ai/status`);
      if (res.ok) return;
    } catch {
      // Server is still starting.
    }
    await delay(150);
  }
  throw new Error(`Server did not start on ${BASE_URL}`);
}

async function closeServer(server) {
  await new Promise((resolve) => server.close(resolve));
}

async function main() {
  const { startServer } = require('../server.js');
  const server = startServer();
  await waitForServer();

  const rows = [];
  let failed = false;

  try {
    for (const [demoType, schemaName, agentType] of DEMOS) {
      let status = 0;
      let body = null;
      let jsonValid = false;
      let notes = '';

      try {
        const res = await fetch(ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payloadFor(demoType, schemaName, agentType))
        });
        status = res.status;
        const text = await res.text();
        try {
          body = JSON.parse(text);
          jsonValid = true;
        } catch {
          notes = `invalid JSON: ${text.slice(0, 120)}`;
        }
      } catch (error) {
        notes = `request failed: ${error.message}`;
      }

      const validation = jsonValid
        ? validateResponse({ status, body, schemaName })
        : { failures: ['invalid JSON'], fieldsValidated: 0 };
      if (validation.failures.length) failed = true;

      rows.push({
        demoType,
        schemaName,
        status,
        jsonValid,
        provider: body?.provider || '',
        ok: body?.ok === true,
        fieldsValidated: `${validation.fieldsValidated}/${REQUIRED_FIELDS.length}`,
        notes: notes || (validation.structuredProviderError ? body.error.code : (validation.failures.length ? validation.failures.join('; ') : 'passed'))
      });
    }
  } finally {
    await closeServer(server);
  }

  console.table(rows);
  process.exit(failed ? 1 : 0);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
