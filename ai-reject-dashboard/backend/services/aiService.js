const crypto = require('crypto');
const config = require('../config/env');
const { logger } = require('../utils/logger');
const { computeAnalysis } = require('./analysisService');
const { getDataState } = require('./dataService');

const MODEL = 'gemini-2.5-flash';
const ANALYSIS_TTL_MS = 5 * 60 * 1000;
const FORECAST_TTL_MS = 60 * 60 * 1000;
const cache = new Map();
const auditTrail = [];

function cacheKey(prefix, payload) {
  return `${prefix}:${crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex')}`;
}

function getCached(key) {
  const item = cache.get(key);
  if (!item) return null;
  if (Date.now() > item.expiresAt) {
    cache.delete(key);
    return null;
  }
  return item.value;
}

function setCached(key, value, ttlMs) {
  cache.set(key, { value, expiresAt: Date.now() + ttlMs, createdAt: new Date().toISOString() });
}

function invalidateAiCache(reason) {
  cache.clear();
  logger.info('ai_cache_invalidated', { reason });
}

function estimateTokens(text) {
  return Math.ceil(String(text || '').length / 4);
}

function estimateCost(inputTokens, outputTokens) {
  // AR: تقدير تقريبي فقط، الأسعار الفعلية تعتمد على حساب Google/Vertex.
  // EN: Rough estimate only; actual pricing depends on Google/Vertex billing.
  return Math.round(((inputTokens * 0.0000001) + (outputTokens * 0.0000004)) * 1000000) / 1000000;
}

function auditAiRequest(entry) {
  auditTrail.unshift({
    ...entry,
    timestamp: new Date().toISOString()
  });
  auditTrail.splice(100);
  logger.info('ai_audit', entry);
}

function compactDataset(records, limit = 250) {
  return records.slice(0, limit).map((record) => ({
    doc_no: record.doc_no,
    date: record.date,
    department: record.department,
    category: record.category,
    item_code: record.item_code,
    item_name: record.item_name,
    machine: record.machine,
    reason: record.reason || record.defect_type,
    root_cause: record.root_cause,
    status: record.approval_status,
    days_pending: record.days_pending,
    quantity: record.quantity,
    cost: record.cost || record.total_cost,
    risk_score: record.risk_score,
    risk_level: record.risk_level
  }));
}

function buildContext(records) {
  const local = computeAnalysis(records);
  const state = getDataState();
  return {
    data_status: state.excel || {},
    metrics: state.metrics || {},
    local_analysis: local,
    sample_records: compactDataset(records)
  };
}

function buildPrompt(type, context, extra = {}) {
  const prompts = {
    descriptive: {
      temperature: 0.15,
      schema: descriptiveSchema(),
      text: [
        'You are an enterprise quality analytics assistant for a Saudi medical manufacturing company.',
        'Layer 1 - Descriptive Analytics: answer What happened?',
        'Use exact numbers from context. Do not invent missing columns.',
        'Few-shot example:',
        '{"headline":"Reject cost increased in Warehouse","key_statistics":[{"label":"Total cost","value":120000,"unit":"SAR"}],"time_comparisons":[{"period":"2026-05","change_percent":12.5}],"observations":["Warehouse drives 70% of cost"]}',
        'Return JSON only matching the schema.',
        JSON.stringify(context)
      ].join('\n')
    },
    diagnostic: {
      temperature: 0.2,
      schema: diagnosticSchema(),
      text: [
        'Layer 2 - Diagnostic Analytics: explain why it happened.',
        'Connect root causes to departments, machines, costs, and delays.',
        'Use cautious language when data is incomplete.',
        'Few-shot example:',
        '{"root_causes":[{"cause":"Inventory rotation failure","evidence":["Expired lots in Warehouse"],"impact":"High cost exposure","confidence":"Medium"}],"relationships":[{"from":"Pending approvals","to":"Destruction backlog","strength":"High"}]}',
        'Return JSON only matching the schema.',
        JSON.stringify(context)
      ].join('\n')
    },
    predictive: {
      temperature: 0.25,
      schema: predictiveSchema(),
      text: [
        'Layer 3 - Predictive Analytics: forecast what may happen next month and next quarter.',
        'Include rejects, machines likely to fail, and cost forecast.',
        'If seasonality is weak, say confidence is Low.',
        'Few-shot example:',
        '{"next_month":{"reject_count":42,"cost":90000,"confidence":"Medium"},"next_quarter":{"reject_count":120,"cost":260000,"confidence":"Low"},"machine_failure_risk":[{"machine":"Line 1","risk":"High","reason":"Rising defect trend"}]}',
        'Return JSON only matching the schema.',
        JSON.stringify(context)
      ].join('\n')
    },
    prescriptive: {
      temperature: 0.3,
      schema: prescriptiveSchema(),
      text: [
        'Layer 4 - Prescriptive Analytics: recommend what the company should do.',
        'Prioritize CAPA, containment, owner, timeline, and expected impact.',
        'Respect: AI output is advisory. QCM/QAM approval remains required.',
        'Few-shot example:',
        '{"recommendations":[{"priority":"Critical","action":"Quarantine expired lots","owner":"Warehouse Manager","timeline":"48 hours","expected_impact":"Reduce destruction backlog"}]}',
        'Return JSON only matching the schema.',
        JSON.stringify(context)
      ].join('\n')
    },
    query: {
      temperature: 0.2,
      schema: querySchema(),
      text: [
        'You answer natural language analytics questions in Arabic or English.',
        'First interpret the question into a data query, then answer from the provided context only.',
        'Include a suggested chart and source fields.',
        'Few-shot example:',
        'Question: كم تكلفة مرفوضات قسم الإنتاج هذا الشهر؟',
        '{"answer":"تكلفة مرفوضات قسم الإنتاج هذا الشهر 50,000 SAR.","query_interpretation":{"metric":"cost","filters":{"department":"Production","period":"current_month"}},"suggested_chart":{"type":"bar","x":"department","y":"cost"},"sources":["department","cost","date"],"confidence":"Medium"}',
        `Question: ${extra.question}`,
        'Return JSON only matching the schema.',
        JSON.stringify(context)
      ].join('\n')
    },
    capa: {
      temperature: 0.25,
      schema: capaSchema(),
      text: [
        'Generate a complete CAPA for a medical manufacturing reject case.',
        'Use 5 Whys, immediate action, corrective action, preventive action, owner, timeline, success criteria, and ISO/GMP references.',
        'Few-shot example:',
        '{"problem_statement":"Lot failed due to material expiry.","five_whys":["Why 1..."],"immediate_action":"Quarantine affected lot","corrective_action":"Update FEFO process","preventive_action":"Weekly expiry dashboard","owner_suggestion":"Warehouse Manager","timeline":"30 days","success_criteria":["No expired lots for 90 days"],"iso_gmp_references":["ISO 13485:2016 Clause 8.5.2"]}',
        'Return JSON only matching the schema.',
        JSON.stringify({ reject_case: extra.rejectCase, context })
      ].join('\n')
    }
  };
  return prompts[type];
}

async function callGemini(promptConfig, type) {
  if (!config.geminiApiKey) return null;
  const started = Date.now();
  const inputTokens = estimateTokens(promptConfig.text);

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': config.geminiApiKey
      },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: promptConfig.text }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: promptConfig.schema,
          temperature: promptConfig.temperature
        }
      })
    });

    if (!response.ok) throw new Error(`Gemini API error: ${response.status}`);
    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    const parsed = JSON.parse(text);
    const outputTokens = estimateTokens(text);
    auditAiRequest({
      type,
      model: MODEL,
      provider: 'gemini',
      success: true,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      estimated_cost_usd: estimateCost(inputTokens, outputTokens),
      response_time_ms: Date.now() - started
    });
    return parsed;
  } catch (err) {
    auditAiRequest({
      type,
      model: MODEL,
      provider: 'gemini',
      success: false,
      error: err.message,
      input_tokens: inputTokens,
      output_tokens: 0,
      estimated_cost_usd: estimateCost(inputTokens, 0),
      response_time_ms: Date.now() - started
    });
    logger.warn('gemini_ai_service_failed', { type, message: err.message });
    return null;
  }
}

async function runLayer(type, records, ttlMs, fallbackBuilder, extra = {}) {
  const started = Date.now();
  const context = buildContext(records);
  const key = cacheKey(type, { hash: context.data_status.hash, extra });
  const cached = getCached(key);
  if (cached) {
    auditAiRequest({
      type,
      model: cached.model || MODEL,
      provider: cached.source || 'cache',
      success: true,
      cache_hit: true,
      input_tokens: 0,
      output_tokens: estimateTokens(JSON.stringify(cached.result || cached)),
      estimated_cost_usd: 0,
      response_time_ms: Date.now() - started
    });
    return { ...cached, cached: true };
  }

  const promptConfig = buildPrompt(type, context, extra);
  const gemini = await callGemini(promptConfig, type);
  const local = fallbackBuilder(records, context, extra);
  const result = {
    layer: type,
    model: gemini ? MODEL : 'local-fallback',
    source: gemini ? 'gemini' : 'local',
    result: gemini || local,
    prompt_example: promptConfig.text,
    cached: false
  };

  setCached(key, result, ttlMs);
  if (!gemini) {
    const outputTokens = estimateTokens(JSON.stringify(local));
    auditAiRequest({
      type,
      model: 'local-fallback',
      provider: 'local',
      success: true,
      fallback_used: true,
      input_tokens: 0,
      output_tokens: outputTokens,
      estimated_cost_usd: 0,
      response_time_ms: Date.now() - started
    });
  }
  return result;
}

async function runEnterpriseAnalysis(records) {
  const descriptive = await runLayer('descriptive', records, ANALYSIS_TTL_MS, localDescriptive);
  const diagnostic = await runLayer('diagnostic', records, ANALYSIS_TTL_MS, localDiagnostic);
  const predictive = await runLayer('predictive', records, FORECAST_TTL_MS, localPredictive);
  const prescriptive = await runLayer('prescriptive', records, ANALYSIS_TTL_MS, localPrescriptive);

  return {
    model: MODEL,
    generated_at: new Date().toISOString(),
    layers: {
      descriptive,
      diagnostic,
      predictive,
      prescriptive
    },
    anomalies: detectAnomalies(records)
  };
}

async function answerNaturalLanguageQuery(records, question) {
  const localAnswer = localQuery(records, question);
  return runLayer('query', records, ANALYSIS_TTL_MS, () => localAnswer, { question });
}

async function generateCapa(records, rejectCase) {
  return runLayer('capa', records, ANALYSIS_TTL_MS, () => localCapa(rejectCase), { rejectCase });
}

function localDescriptive(records, context) {
  const a = context.local_analysis;
  return {
    headline: a.executive_summary,
    key_statistics: [
      { label: 'Total cases', value: a.total_cases, unit: 'count' },
      { label: 'Total cost', value: a.total_estimated_cost, unit: 'SAR' },
      { label: 'High risk cases', value: a.high_risk_cases, unit: 'count' }
    ],
    time_comparisons: Object.entries(context.metrics.monthly_trends || {}).map(([period, value]) => ({ period, ...value })),
    observations: [
      `Top root cause: ${a.repeated_root_causes[0]?.cause || 'Unknown'}`,
      `Highest cost department: ${a.cost_by_department[0]?.department || 'Unknown'}`
    ]
  };
}

function localDiagnostic(records, context) {
  const a = context.local_analysis;
  return {
    root_causes: a.repeated_root_causes.map((cause) => ({
      cause: cause.cause,
      evidence: [`${cause.count} cases`, `${cause.percentage}% of analyzed cases`],
      impact: 'Cost, delay, and CAPA exposure',
      confidence: cause.count >= 5 ? 'Medium' : 'Low'
    })),
    relationships: [
      { from: 'Pending approvals', to: 'Destruction backlog', strength: 'Medium' },
      { from: 'Repeated root causes', to: 'CAPA requirement', strength: 'High' }
    ]
  };
}

function localPredictive(records, context) {
  const a = context.local_analysis;
  const monthly = Object.values(context.metrics.monthly_trends || {});
  const avgCount = average(monthly.map((m) => m.count)) || Math.ceil(records.length / 12);
  const avgCost = average(monthly.map((m) => m.total_cost)) || a.projected_next_month_cost;
  return {
    next_month: { reject_count: Math.round(avgCount), cost: Math.round(avgCost), confidence: records.length >= 30 ? 'Medium' : 'Low' },
    next_quarter: { reject_count: Math.round(avgCount * 3), cost: Math.round(avgCost * 3), confidence: 'Low' },
    machine_failure_risk: Object.entries(context.metrics.machine_defect_rates || {})
      .sort((aEntry, bEntry) => bEntry[1].defect_rate - aEntry[1].defect_rate)
      .slice(0, 5)
      .map(([machine, stats]) => ({ machine, risk: stats.defect_rate >= 50 ? 'High' : 'Medium', reason: `${stats.defect_rate}% defect rate` })),
    cost_forecast: { method: 'moving-average-local', projected_next_month_cost: a.projected_next_month_cost }
  };
}

function localPrescriptive(records, context) {
  const a = context.local_analysis;
  return {
    recommendations: a.management_actions.map((action) => ({
      priority: action.priority,
      action: action.action,
      owner: action.priority === 'Critical' ? 'QCM / Operations Manager' : 'Department Owner',
      timeline: action.priority === 'Critical' ? '48 hours' : '14 days',
      expected_impact: 'Reduce reject cost, backlog, or recurrence risk'
    }))
  };
}

function detectAnomalies(records) {
  const byItem = groupNumeric(records, 'item_name', 'cost');
  const values = Object.values(byItem).map((item) => item.total);
  const mean = average(values);
  const sd = standardDeviation(values, mean);
  const moving = movingAverage(values, 3);

  return Object.values(byItem)
    .map((item, index) => ({
      key: item.key,
      total_cost: round(item.total),
      count: item.count,
      z_score: sd ? round((item.total - mean) / sd) : 0,
      moving_average: round(moving[index] || 0),
      seasonal_signal: seasonalSignal(index, values),
      is_outlier: sd ? Math.abs((item.total - mean) / sd) >= 2.5 : false
    }))
    .filter((item) => item.is_outlier)
    .sort((a, b) => Math.abs(b.z_score) - Math.abs(a.z_score))
    .slice(0, 25);
}

function localQuery(records, question) {
  const q = String(question || '').toLowerCase();
  const department = inferDepartment(q);
  const filtered = department ? records.filter((record) => String(record.department || '').toLowerCase() === department.toLowerCase()) : records;
  const totalCost = filtered.reduce((sum, record) => sum + (Number(record.cost) || 0), 0);
  const count = filtered.length;
  const asksCost = /cost|تكلفة|قيمة|مبلغ/.test(q);

  return {
    answer: asksCost
      ? `إجمالي التكلفة${department ? ` لقسم ${department}` : ''}: SAR ${round(totalCost).toLocaleString()}.`
      : `عدد السجلات${department ? ` لقسم ${department}` : ''}: ${count}.`,
    query_interpretation: {
      metric: asksCost ? 'cost' : 'count',
      filters: department ? { department } : {},
      language: /[\u0600-\u06FF]/.test(question) ? 'ar' : 'en'
    },
    suggested_chart: { type: 'bar', x: department ? 'item_name' : 'department', y: asksCost ? 'cost' : 'count' },
    sources: ['department', 'cost', 'date', 'item_name'],
    confidence: filtered.length ? 'Medium' : 'Low'
  };
}

function localCapa(rejectCase) {
  const item = rejectCase.item_name || rejectCase.item_code || 'the rejected item';
  const reason = rejectCase.reason || rejectCase.root_cause || rejectCase.defect_type || 'unconfirmed reject reason';
  return {
    problem_statement: `${item} was rejected due to ${reason}.`,
    five_whys: [
      `Why was ${item} rejected? Because ${reason}.`,
      'Why did the issue reach reject stage? Detection or process control did not prevent it earlier.',
      'Why was control ineffective? Current monitoring, ownership, or acceptance criteria may be insufficient.',
      'Why was recurrence possible? Preventive controls may not be embedded in routine checks.',
      'Why was systemic prevention weak? CAPA effectiveness checks may not be linked to trend data.'
    ],
    immediate_action: 'Quarantine affected lot, stop release, and notify QCM/QAM.',
    corrective_action: 'Investigate process records, update work instruction, and retrain the responsible team.',
    preventive_action: 'Add weekly trend review, automated threshold alerts, and CAPA effectiveness verification.',
    owner_suggestion: rejectCase.department === 'Production' ? 'Production Manager' : 'QCM / Department Owner',
    timeline: '30 days',
    success_criteria: ['No recurrence for 90 days', 'CAPA effectiveness approved by QAM', 'Trend metric below alert threshold'],
    iso_gmp_references: ['ISO 13485:2016 Clause 8.5.2', 'ISO 13485:2016 Clause 8.5.3', 'GMP CAPA and deviation control expectations']
  };
}

function inferDepartment(question) {
  if (/production|الإنتاج|انتاج/.test(question)) return 'Production';
  if (/warehouse|المستودع|مستودع|المخزن/.test(question)) return 'Warehouse';
  if (/\bqc\b|quality|الجودة/.test(question)) return 'QC';
  return null;
}

function groupNumeric(records, key, valueKey) {
  return records.reduce((acc, record) => {
    const label = record[key] || 'Unknown';
    if (!acc[label]) acc[label] = { key: label, total: 0, count: 0 };
    acc[label].total += Number(record[valueKey]) || 0;
    acc[label].count += 1;
    return acc;
  }, {});
}

function movingAverage(values, windowSize) {
  return values.map((_, index) => {
    const start = Math.max(0, index - windowSize + 1);
    return average(values.slice(start, index + 1));
  });
}

function seasonalSignal(index, values) {
  if (values.length < 12) return 'insufficient_data';
  const seasonIndex = index % 12;
  const seasonValues = values.filter((_, i) => i % 12 === seasonIndex);
  const signal = average(seasonValues);
  return signal > average(values) ? 'above_seasonal_average' : 'normal';
}

function average(values) {
  const clean = values.filter((value) => Number.isFinite(value));
  return clean.length ? clean.reduce((a, b) => a + b, 0) / clean.length : 0;
}

function standardDeviation(values, mean) {
  if (!values.length) return 0;
  return Math.sqrt(values.reduce((sum, value) => sum + ((value - mean) ** 2), 0) / values.length);
}

function round(value) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

function descriptiveSchema() {
  return {
    type: 'object',
    properties: {
      headline: { type: 'string' },
      key_statistics: { type: 'array', items: { type: 'object' } },
      time_comparisons: { type: 'array', items: { type: 'object' } },
      observations: { type: 'array', items: { type: 'string' } }
    },
    required: ['headline', 'key_statistics', 'time_comparisons', 'observations']
  };
}

function diagnosticSchema() {
  return {
    type: 'object',
    properties: {
      root_causes: { type: 'array', items: { type: 'object' } },
      relationships: { type: 'array', items: { type: 'object' } }
    },
    required: ['root_causes', 'relationships']
  };
}

function predictiveSchema() {
  return {
    type: 'object',
    properties: {
      next_month: { type: 'object' },
      next_quarter: { type: 'object' },
      machine_failure_risk: { type: 'array', items: { type: 'object' } },
      cost_forecast: { type: 'object' }
    },
    required: ['next_month', 'next_quarter', 'machine_failure_risk', 'cost_forecast']
  };
}

function prescriptiveSchema() {
  return {
    type: 'object',
    properties: {
      recommendations: { type: 'array', items: { type: 'object' } }
    },
    required: ['recommendations']
  };
}

function querySchema() {
  return {
    type: 'object',
    properties: {
      answer: { type: 'string' },
      query_interpretation: { type: 'object' },
      suggested_chart: { type: 'object' },
      sources: { type: 'array', items: { type: 'string' } },
      confidence: { type: 'string' }
    },
    required: ['answer', 'query_interpretation', 'suggested_chart', 'sources', 'confidence']
  };
}

function capaSchema() {
  return {
    type: 'object',
    properties: {
      problem_statement: { type: 'string' },
      five_whys: { type: 'array', items: { type: 'string' } },
      immediate_action: { type: 'string' },
      corrective_action: { type: 'string' },
      preventive_action: { type: 'string' },
      owner_suggestion: { type: 'string' },
      timeline: { type: 'string' },
      success_criteria: { type: 'array', items: { type: 'string' } },
      iso_gmp_references: { type: 'array', items: { type: 'string' } }
    },
    required: ['problem_statement', 'five_whys', 'immediate_action', 'corrective_action', 'preventive_action', 'owner_suggestion', 'timeline', 'success_criteria', 'iso_gmp_references']
  };
}

module.exports = {
  runEnterpriseAnalysis,
  answerNaturalLanguageQuery,
  generateCapa,
  detectAnomalies,
  invalidateAiCache,
  auditTrail,
  buildPrompt
};
