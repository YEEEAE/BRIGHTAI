/**
 * kernel-api-data.js — UMD mirror of src/data/kernel-api.ts (M27).
 * Byte-for-byte identical. CSP-safe. No Math.random/Date.now/toLocaleString.
 * CRITICAL: Never expose full API key — always masked.
 */
(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.KernelApiData = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var API_SEED = 0x41504921;
  var API_ENDPOINTS_COUNT = 6;
  var API_CODE_SAMPLES = 3;
  var API_ERROR_BOOK_COUNT = 6;
  var API_WEBHOOK_PAYLOADS = 3;
  var API_MIGRATION_STEPS = 3;
  var API_STATUS_CELLS = 90;
  var API_CHANGELOG_ENTRIES = 4;
  var API_SDK_DOCS = 3;
  var API_OPERATOR_DOCS = 4;

  function mulberry32(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function buildDemoKey() {
    return {
      demoKey: 'br_k_demo_a7c8f2e9d41b',
      demoKeyMasked: 'br_k_demo_\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022',
      demoRemaining: 98,
      demoLimit: 100
    };
  }

  function buildEndpoints() {
    return [
      { id: 'inspect', method: 'POST', path: '/v1/guard/inspect', title: '\u0641\u062d\u0635 \u0637\u0644\u0628 \u0642\u0628\u0644 \u0627\u0644\u0625\u0631\u0633\u0627\u0644 \u0644\u0644\u0646\u0645\u0648\u0630\u062c', desc: '\u064a\u0631\u0633\u0644 \u0627\u0644\u0637\u0644\u0628 \u0639\u0628\u0631 \u0637\u0628\u0642\u0627\u062a \u0627\u0644\u062d\u0648\u0643\u0645\u0629: \u0641\u062d\u0635 PII\u060c \u062a\u0642\u064a\u064a\u0645 \u0627\u0644\u0645\u062e\u0627\u0637\u0631\u060c \u0645\u0637\u0627\u0628\u0642\u0629 \u0627\u0644\u0633\u064a\u0627\u0633\u0627\u062a. \u064a\u0631\u062c\u0651\u0639 \u0627\u0644\u062d\u0643\u0645 \u0627\u0644\u0646\u0647\u0627\u0626\u064a (allow / review / block) \u0645\u0639 Trace ID.', params: [{ name: 'text', type: 'string', required: true, desc: '\u0646\u0635 \u0627\u0644\u0637\u0644\u0628.' }, { name: 'context', type: 'object', required: false, desc: '\u0633\u064a\u0627\u0642 \u0627\u0644\u0637\u0644\u0628.' }, { name: 'policies', type: 'string[]', required: false, desc: '\u0645\u0639\u0631\u0651\u0641\u0627\u062a \u0627\u0644\u0633\u064a\u0627\u0633\u0627\u062a.' }], response: [{ name: 'trace_id', type: 'string', desc: 'Trace ID.' }, { name: 'risk_score', type: 'integer', desc: '0-100' }, { name: 'verdict', type: 'string', desc: 'allow/review/block' }, { name: 'pii_found', type: 'integer', desc: 'PII count' }, { name: 'matched_policies', type: 'string[]', desc: 'matched policies' }], errors: ['400', '401', '403', '429'] },
      { id: 'evidence', method: 'POST', path: '/v1/evidence', title: '\u062a\u0648\u0644\u064a\u062f \u0645\u0644\u0641 \u062f\u0644\u064a\u0644 (EVD)', desc: '\u064a\u0646\u0634\u0626 \u0645\u0644\u0641 \u062f\u0644\u064a\u0644 \u0645\u0648\u0642\u0651\u0639 \u0631\u0642\u0645\u064a\u0627\u064b.', params: [{ name: 'trace_id', type: 'string', required: true, desc: 'trace id' }, { name: 'format', type: 'string', required: false, desc: 'pdf/json/both' }, { name: 'signed', type: 'boolean', required: false, desc: 'signed' }], response: [{ name: 'evidence_id', type: 'string', desc: 'EVD id' }, { name: 'hash', type: 'string', desc: 'hash' }, { name: 'download_url', type: 'string', desc: 'url' }, { name: 'verified', type: 'boolean', desc: 'verified' }], errors: ['400', '404', '429'] },
      { id: 'eval-run', method: 'POST', path: '/v1/eval/runs', title: 'Evaluation Run API', desc: '\u062a\u0634\u063a\u064a\u0644 \u062a\u0642\u064a\u064a\u0645.', params: [{ name: 'dataset_id', type: 'string', required: true, desc: 'dataset' }, { name: 'scorer_id', type: 'string', required: true, desc: 'scorer' }, { name: 'model_id', type: 'string', required: false, desc: 'model' }], response: [{ name: 'run_id', type: 'string', desc: 'run id' }, { name: 'status', type: 'string', desc: 'status' }, { name: 'total_cases', type: 'integer', desc: 'cases' }, { name: 'estimated_time', type: 'integer', desc: 'time' }], errors: ['400', '404', '429'] },
      { id: 'dataset', method: 'POST', path: '/v1/datasets', title: 'Dataset API', desc: '\u0625\u0646\u0634\u0627\u0621 \u0645\u062c\u0645\u0648\u0639\u0629 \u0628\u064a\u0627\u0646\u0627\u062a.', params: [{ name: 'name', type: 'string', required: true, desc: 'name' }, { name: 'format', type: 'string', required: true, desc: 'csv/json/jsonl/table' }, { name: 'data', type: 'string', required: true, desc: 'data' }, { name: 'compliance_pack', type: 'string', required: false, desc: 'pack' }], response: [{ name: 'dataset_id', type: 'string', desc: 'id' }, { name: 'case_count', type: 'integer', desc: 'count' }, { name: 'duplicates', type: 'integer', desc: 'dups' }, { name: 'gaps', type: 'integer', desc: 'gaps' }], errors: ['400', '422', '429'] },
      { id: 'scorer', method: 'POST', path: '/v1/scorers', title: 'Scorer API', desc: '\u0625\u0646\u0634\u0627\u0621 \u0645\u0642\u064a\u0627\u0633 \u062a\u0642\u064a\u064a\u0645.', params: [{ name: 'name', type: 'string', required: true, desc: 'name' }, { name: 'type', type: 'string', required: true, desc: 'accuracy/safety/hallucination/custom' }, { name: 'threshold', type: 'number', required: false, desc: '0-100' }, { name: 'config', type: 'object', required: false, desc: 'config' }], response: [{ name: 'scorer_id', type: 'string', desc: 'id' }, { name: 'type', type: 'string', desc: 'type' }, { name: 'threshold', type: 'number', desc: 'threshold' }], errors: ['400', '422', '429'] },
      { id: 'certificate', method: 'POST', path: '/v1/certificates/verify', title: 'Certificate Verification API', desc: '\u0627\u0644\u062a\u062d\u0642\u0642 \u0645\u0646 \u0634\u0647\u0627\u062f\u0629.', params: [{ name: 'certificate_id', type: 'string', required: true, desc: 'cert id' }, { name: 'policy_id', type: 'string', required: true, desc: 'policy id' }, { name: 'version', type: 'string', required: false, desc: 'version' }], response: [{ name: 'valid', type: 'boolean', desc: 'valid' }, { name: 'certified_by', type: 'string', desc: 'by' }, { name: 'policy_version', type: 'string', desc: 'version' }, { name: 'hash', type: 'string', desc: 'hash' }, { name: 'verified_at', type: 'string', desc: 'at' }], errors: ['400', '404', '422'] }
    ];
  }

  function buildCodeSamples() {
    return [
      { lang: 'curl', label: 'cURL', code: 'curl -X POST https://api.brightai.site/v1/guard/inspect \\\n  -H "Authorization: Bearer br_k_demo_..." \\\n  -H "Content-Type: application/json" \\\n  -d \'{"text": "test"}\'' },
      { lang: 'python', label: 'Python', code: 'import requests\nresp = requests.post("https://api.brightai.site/v1/guard/inspect", headers={"Authorization": "Bearer br_k_demo_..."}, json={"text": "test"})\nprint(resp.json())' },
      { lang: 'typescript', label: 'TypeScript', code: 'const resp = await fetch("https://api.brightai.site/v1/guard/inspect", { method: "POST", headers: { Authorization: "Bearer br_k_demo_..." }, body: JSON.stringify({ text: "test" }) });\nconsole.log(await resp.json());' }
    ];
  }

  function buildErrorBook() {
    return [
      { code: '400', meaning: 'invalid request', fix: 'check params', example: '{"error":"invalid_request"}' },
      { code: '401', meaning: 'invalid key', fix: 'check auth header', example: '{"error":"unauthorized"}' },
      { code: '403', meaning: 'blocked by governance', fix: 'check reason', example: '{"error":"forbidden"}' },
      { code: '404', meaning: 'not found', fix: 'check trace_id', example: '{"error":"not_found"}' },
      { code: '429', meaning: 'rate limited', fix: 'wait for quota', example: '{"error":"rate_limited"}' },
      { code: '500', meaning: 'server error', fix: 'retry after 30s', example: '{"error":"internal"}' }
    ];
  }

  function buildWebhookPayloads() {
    return [
      { event: 'decision.created', time: 'now', summary: 'block decision', body: '{"type":"decision.created","verdict":"block"}' },
      { event: 'approval.requested', time: '2min ago', summary: 'review request', body: '{"type":"approval.requested","verdict":"review"}' },
      { event: 'evidence.generated', time: '12min ago', summary: 'evidence generated', body: '{"type":"evidence.generated","evidence_id":"EVD-2026-10492"}' }
    ];
  }

  function buildMigrationSteps() {
    return [
      { title: '1. redirect traffic', before: 'fetch("https://api.openai.com/...")', after: 'fetch("https://api.brightai.site/v1/guard/inspect", ...)', note: 'switch endpoint' },
      { title: '2. pass context', before: 'body: JSON.stringify({ prompt })', after: 'body: JSON.stringify({ text: prompt, context: { section, role } })', note: 'add context' },
      { title: '3. read verdict', before: 'const answer = await resp.json()', after: 'const { verdict } = await resp.json()', note: 'check verdict' }
    ];
  }

  function buildStatusCells() {
    var cells = [];
    for (var i = 0; i < API_STATUS_CELLS; i += 1) {
      if (i % 47 === 0) cells.push('down');
      else if (i % 13 === 0) cells.push('degraded');
      else cells.push('ok');
    }
    return cells;
  }

  function buildChangelog() {
    return [
      { version: 'v3.7.0', date: '2026-07-20', note: 'webhook inspector + HMAC-SHA256' },
      { version: 'v3.6.0', date: '2026-06-28', note: '/v1/evidence with digital signature' },
      { version: 'v3.5.2', date: '2026-06-02', note: 'inspect speedup 128ms' },
      { version: 'v3.5.0', date: '2026-05-15', note: 'policies param in inspect' }
    ];
  }

  function buildSdkDocs() {
    return [
      { id: 'sdk-python', lang: 'python', label: 'Python SDK', install: 'pip install brightai-kernel', example: 'from brightai import Kernel\nkernel = Kernel(api_key="br_k_demo_...")\nresult = kernel.inspect(text="test")' },
      { id: 'sdk-typescript', lang: 'typescript', label: 'TypeScript SDK', install: 'npm install @brightai/kernel', example: 'import { Kernel } from "@brightai/kernel";\nconst kernel = new Kernel({ apiKey: "br_k_demo_..." });\nconst result = await kernel.inspect({ text: "test" });' },
      { id: 'sdk-curl', lang: 'bash', label: 'cURL', install: '# no install needed', example: 'curl -X POST https://api.brightai.site/v1/guard/inspect ...' }
    ];
  }

  function buildOperatorDocs() {
    return [
      { id: 'op-getting-started', title: 'Getting Started', description: '5 min setup', steps: ['get api key', 'redirect traffic', 'monitor audit', 'export reports'] },
      { id: 'op-policies', title: 'Policy Management', description: 'manage policies', steps: ['open /kernel/policies/', 'toggle policy', 'test in playground', 'monitor simulation'] },
      { id: 'op-approvals', title: 'Approval Workflow', description: 'manage approvals', steps: ['open /kernel/approvals/', 'review request', 'approve/reject/transfer', 'track decisions'] },
      { id: 'op-evidence', title: 'Evidence Generation', description: 'generate evidence', steps: ['open /kernel/evidence/', 'select period', 'generate EVD', 'share with auditor'] }
    ];
  }

  function buildNavSections() {
    return [
      { id: 'endpoints', label: 'Endpoints' },
      { id: 'webhook', label: 'Webhook' },
      { id: 'errors', label: 'Errors' },
      { id: 'migration', label: 'Migration' },
      { id: 'status', label: 'Status' },
      { id: 'releases', label: 'Releases' },
      { id: 'sdk', label: 'SDK' },
      { id: 'operator', label: 'Operator' }
    ];
  }

  function buildSampleResponse() {
    return '{"trace_id":"AI-2026-10493","risk_score":87,"verdict":"block","pii_found":1847,"matched_policies":["pdpl-12-export","nca-ecc-3-4"],"reason":"blocked","duration_ms":128}';
  }

  function buildApiData() {
    var dk = buildDemoKey();
    return {
      endpoints: buildEndpoints(),
      codeSamples: buildCodeSamples(),
      errorBook: buildErrorBook(),
      webhookPayloads: buildWebhookPayloads(),
      migrationSteps: buildMigrationSteps(),
      statusCells: buildStatusCells(),
      changelog: buildChangelog(),
      sdkDocs: buildSdkDocs(),
      operatorDocs: buildOperatorDocs(),
      demoKey: dk.demoKey,
      demoKeyMasked: dk.demoKeyMasked,
      demoRemaining: dk.demoRemaining,
      demoLimit: dk.demoLimit,
      webhookUrl: 'https://hooks.brightai.site/w/8f2e9d41b7c3',
      sampleResponse: buildSampleResponse(),
      navSections: buildNavSections()
    };
  }

  return {
    API_SEED: API_SEED,
    API_ENDPOINTS_COUNT: API_ENDPOINTS_COUNT,
    API_CODE_SAMPLES: API_CODE_SAMPLES,
    API_ERROR_BOOK_COUNT: API_ERROR_BOOK_COUNT,
    API_WEBHOOK_PAYLOADS: API_WEBHOOK_PAYLOADS,
    API_MIGRATION_STEPS: API_MIGRATION_STEPS,
    API_STATUS_CELLS: API_STATUS_CELLS,
    API_CHANGELOG_ENTRIES: API_CHANGELOG_ENTRIES,
    API_SDK_DOCS: API_SDK_DOCS,
    API_OPERATOR_DOCS: API_OPERATOR_DOCS,
    mulberry32: mulberry32,
    buildDemoKey: buildDemoKey,
    buildEndpoints: buildEndpoints,
    buildCodeSamples: buildCodeSamples,
    buildErrorBook: buildErrorBook,
    buildWebhookPayloads: buildWebhookPayloads,
    buildMigrationSteps: buildMigrationSteps,
    buildStatusCells: buildStatusCells,
    buildChangelog: buildChangelog,
    buildSdkDocs: buildSdkDocs,
    buildOperatorDocs: buildOperatorDocs,
    buildNavSections: buildNavSections,
    buildSampleResponse: buildSampleResponse,
    buildApiData: buildApiData
  };
}));
