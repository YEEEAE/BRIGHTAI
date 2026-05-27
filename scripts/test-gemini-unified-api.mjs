import http from 'node:http';
import { once } from 'node:events';

const port = Number(process.env.AI_GATEWAY_TEST_PORT || 3199);
const baseUrl = process.env.AI_GATEWAY_TEST_BASE_URL || `http://127.0.0.1:${port}`;
const endpoint = `${baseUrl}/api/ai/chat/completions`;

const demoTypes = [
  'smart_hiring_system',
  'data_analyzer',
  'customer_support',
  'custom_ai_agent',
  'competitor_analysis_agent',
  'seo_agent',
  'marketing_agent',
  'opportunity_discovery_agent',
  'marketing_automation',
  'supply_chain',
  'document_automation',
  'medical_archive',
  'hospital_ops',
  'education'
];

const schemaByDemo = {
  smart_hiring_system: 'smartHiringSchema',
  data_analyzer: 'dataAnalyzerSchema',
  customer_support: 'customerSupportSchema',
  custom_ai_agent: 'customAiAgentSchema',
  competitor_analysis_agent: 'competitorAnalysisAgentSchema',
  seo_agent: 'seoAgentSchema',
  marketing_agent: 'marketingAgentSchema',
  opportunity_discovery_agent: 'opportunityDiscoveryAgentSchema',
  marketing_automation: 'marketingAutomationSchema',
  supply_chain: 'supplyChainSchema',
  document_automation: 'documentAutomationSchema',
  medical_archive: 'medicalArchiveSchema',
  hospital_ops: 'hospitalOpsSchema',
  education: 'educationSchema'
};

let server;

async function ensureServer() {
  if (process.env.AI_GATEWAY_TEST_BASE_URL) return;
  process.env.PORT = String(port);
  const mod = await import('../backend/server.js');
  const api = mod.default || mod;
  server = api.startServer();
  await once(server, 'listening');
}

async function postJson(body) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const text = await response.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`استجابة غير JSON من ${endpoint}: ${text.slice(0, 120)}`);
  }
  return { response, text, json };
}

function assertNoSensitiveLeak(text) {
  if (/<html[\s>]/i.test(text)) throw new Error('الاستجابة تحتوي HTML خام');
  if (/at\s+\S+\s+\(/.test(text)) throw new Error('الاستجابة تحتوي stack trace');
  if (/AIza[0-9A-Za-z_-]{20,}/.test(text)) throw new Error('الاستجابة قد تحتوي مفتاح Google');
  if (/GEMINI_API_KEY\s*[:=]/i.test(text)) throw new Error('الاستجابة تكشف اسم أو قيمة مفتاح');
}

function assertStructuredSuccess(json, demoType) {
  if (json.ok !== true) return;
  if (!json.data || typeof json.data !== 'object') throw new Error(`${demoType}: data object مفقود`);
  const fields = [
    'executive_summary_ar',
    'key_insights',
    'risks',
    'recommended_actions',
    'business_impact_ar',
    'integration_readiness',
    'next_action_ar',
    'whatsapp_summary_ar'
  ];
  const missing = fields.filter(field => !(field in json.data));
  if (missing.length) throw new Error(`${demoType}: حقول schema ناقصة: ${missing.join(', ')}`);
}

function assertSafeError(json, demoType) {
  if (json.ok === true) return;
  const message = json?.error?.message_ar || json?.error || '';
  if (!message || typeof message !== 'string') throw new Error(`${demoType}: خطأ غير مفهوم`);
  if (!json?.error?.code && !json?.errorCode) throw new Error(`${demoType}: error code مفقود`);
}

try {
  await ensureServer();
  console.log('=== Unified Gemini API Test ===');

  for (const demoType of demoTypes) {
    const schemaName = schemaByDemo[demoType];
    const payload = {
      model: 'gemini-2.5-flash',
      demoType,
      agentType: demoType,
      schemaName,
      locale: 'ar-SA',
      sourcePage: `/demo/${demoType.replaceAll('_', '-')}/`,
      messages: [
        { role: 'system', content: 'أعد JSON عربياً منظماً للديمو فقط.' },
        { role: 'user', content: `بيانات اختبار مختصرة للديمو: ${demoType}.` }
      ],
      response_format: {
        type: 'json_schema',
        json_schema: { name: schemaName, schema: {} }
      },
      temperature: 0.2
    };

    const { response, text, json } = await postJson(payload);
    assertNoSensitiveLeak(text);
    if (![200, 400, 408, 429, 500, 502, 503].includes(response.status)) {
      throw new Error(`${demoType}: status غير متوقع ${response.status}`);
    }
    assertStructuredSuccess(json, demoType);
    assertSafeError(json, demoType);
    console.log(`${json.ok === true ? 'OK' : 'SAFE_ERROR'}\t${demoType}\t${response.status}\t${json.requestId || '-'}`);
  }
} finally {
  if (server) {
    await new Promise(resolve => server.close(resolve));
  }
}

process.exit(0);
