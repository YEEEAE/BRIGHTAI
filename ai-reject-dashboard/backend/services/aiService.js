const crypto = require('crypto');
const config = require('../config/env');
const { logger } = require('../utils/logger');
const { computeAnalysis } = require('./analysisService');
const { getDataState } = require('./dataService');
const conversationMemoryService = require('./conversationMemoryService');

const MODEL = config.geminiModel || 'gemini-2.5-flash';
const AI_NAME = 'صقر AI';
const ANALYSIS_TTL_MS = 5 * 60 * 1000;
const FORECAST_TTL_MS = 60 * 60 * 1000;
const cache = new Map();
const auditTrail = [];

function isOutOfScope(question) {
  const q = String(question || '').toLowerCase().trim();
  if (!q) return false;
  
  const allowedKeywords = [
    'mais', 'ميس', 'جودة', 'quality', 'reject', 'مرفوض', 'تكلفة', 'cost', 'عطل', 'defect', 
    'ماكينة', 'machine', 'مستودع', 'warehouse', 'إنتاج', 'production', 'capa', 'ncr', 
    'لوت', 'lot', 'صلاحية', 'expiry', 'شحنة', 'batch', 'مرفوضات', 'تحليل', 'summary', 
    'توقع', 'forecast', 'صيانة', 'maintenance', 'خسارة', 'loss', 'شطب', 'write-off',
    'تقرير', 'report', 'صقر', 'saqr', 'أهلاً', 'hello', 'hi', 'مرحبا', 'شكرا', 'thank',
    'من أنت', 'who are you', 'اسمك', 'your name'
  ];
  
  const hasKeyword = allowedKeywords.some(keyword => q.includes(keyword));
  return !hasKeyword;
}

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

function buildContext(records) {
  const local = computeAnalysis(records);
  const state = getDataState();
  
  // استخلاص أعلى 10 سجلات خطورة
  const top_risk_records = records
    .slice()
    .sort((a, b) => (Number(b.risk_score) || 0) - (Number(a.risk_score) || 0))
    .slice(0, 10)
    .map((r) => ({
      doc_no: r.doc_no,
      item_code: r.item_code,
      item_name: r.item_name,
      department: r.department,
      cost: r.cost,
      risk_score: r.risk_score,
      risk_level: r.risk_level,
      expiry_date: r.expiry_date,
      remaining_percent: r.remaining_percent
    }));

  return {
    data_status: state.excel || {},
    metrics: state.metrics || {},
    dataset_summary: {
      total_cases: local.total_cases,
      total_estimated_cost: local.total_estimated_cost,
      high_risk_cases: local.high_risk_cases,
      cost_by_department: local.cost_by_department,
      repeated_root_causes: local.repeated_root_causes,
      monthly_trends: state.metrics?.monthly_trends || {},
      machine_defect_rates: state.metrics?.machine_defect_rates || {}
    },
    top_risk_records,
    current_page_context: { page: 'enterprise-analysis', filters: {} }
  };
}

function buildPrompt(type, context, extra = {}) {
  const aiIdentity = `اسمك هو «صقر AI» — مساعد ذكي متخصص في تحليلات الجودة والعمليات. Always refer to yourself as "صقر AI" in all responses. Never use any other name.`;
  const prompts = {
    descriptive: {
      temperature: 0.15,
      schema: descriptiveSchema(),
      text: [
        `${aiIdentity} You are an enterprise quality analytics assistant for a Saudi medical manufacturing company.`,
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
  // 1. Refusal Policy Guard for out of scope queries
  if (isOutOfScope(question)) {
    const refusalReply = {
      answer: "يزيد معلمني بأن ما أخرج عن إطار شركة ميس والعمل المؤكل له",
      query_interpretation: { metric: 'none', filters: {} },
      suggested_chart: { type: 'none', x: '', y: '' },
      sources: [],
      confidence: 'High'
    };
    return {
      layer: 'query',
      model: 'local-refusal',
      source: 'local',
      result: refusalReply,
      cached: false
    };
  }

  const localAnswer = localQuery(records, question);
  const context = buildContext(records);

  return runLayer('query', records, ANALYSIS_TTL_MS, () => localAnswer, { question, context });
}

async function generateCapa(records, rejectCase) {
  return runLayer('capa', records, ANALYSIS_TTL_MS, () => localCapa(rejectCase), { rejectCase });
}

function localDescriptive(records, context) {
  const a = context.dataset_summary || computeAnalysis(records);
  const totalCost = a.total_estimated_cost || 0;
  return {
    headline: a.executive_summary || 'تحليل وافي للمرفوضات والعمليات لمصانع ميس',
    key_statistics: [
      { label: 'Total cases', value: a.total_cases || 0, unit: 'count' },
      { label: 'Total cost', value: totalCost, unit: 'SAR' },
      { label: 'High risk cases', value: a.high_risk_cases || 0, unit: 'count' }
    ],
    time_comparisons: Object.entries(context.metrics.monthly_trends || {}).map(([period, value]) => ({ period, ...value })),
    observations: [
      `Top root cause: ${a.repeated_root_causes?.[0]?.cause || 'Unknown'}`,
      `Highest cost department: ${a.cost_by_department?.[0]?.department || 'Unknown'}`
    ]
  };
}

function localDiagnostic(records, context) {
  const a = context.dataset_summary || computeAnalysis(records);
  const rootCauses = a.repeated_root_causes || [];
  return {
    root_causes: rootCauses.map((cause) => ({
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
  const a = context.dataset_summary || computeAnalysis(records);
  const monthly = Object.values(context.metrics.monthly_trends || {});
  const avgCount = average(monthly.map((m) => m.count)) || Math.ceil(records.length / 12);
  const avgCost = average(monthly.map((m) => m.total_cost)) || (a.projected_next_month_cost || 0);
  return {
    next_month: { reject_count: Math.round(avgCount), cost: Math.round(avgCost), confidence: records.length >= 30 ? 'Medium' : 'Low' },
    next_quarter: { reject_count: Math.round(avgCount * 3), cost: Math.round(avgCost * 3), confidence: 'Low' },
    machine_failure_risk: Object.entries(context.metrics.machine_defect_rates || {})
      .sort((aEntry, bEntry) => bEntry[1].defect_rate - aEntry[1].defect_rate)
      .slice(0, 5)
      .map(([machine, stats]) => ({ machine, risk: stats.defect_rate >= 50 ? 'High' : 'Medium', reason: `${stats.defect_rate}% defect rate` })),
    cost_forecast: { method: 'moving-average-local', projected_next_month_cost: a.projected_next_month_cost || 0 }
  };
}

function localPrescriptive(records, context) {
  const a = context.dataset_summary || computeAnalysis(records);
  const actions = a.management_actions || [];
  return {
    recommendations: actions.map((action) => ({
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

function chatSchema() {
  return {
    type: 'object',
    properties: {
      reply: { type: 'string' },
      charts: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            type: { type: 'string' },
            title: { type: 'string' },
            x: { type: 'string' },
            y: { type: 'string' },
            series: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  data: { type: 'array', items: { type: 'number' } }
                },
                required: ['name', 'data']
              }
            },
            categories: { type: 'array', items: { type: 'string' } }
          },
          required: ['type', 'title', 'series']
        }
      },
      actions: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            label: { type: 'string' },
            command: { type: 'string' },
            payload: { type: 'object' }
          },
          required: ['label', 'command']
        }
      },
      sources: { type: 'array', items: { type: 'string' } }
    },
    required: ['reply', 'charts', 'actions', 'sources']
  };
}

async function chatWithGemini(records, message, conversationId, chatContext, history) {
  const started = Date.now();
  const type = 'chat';

  // Use provided history (from session memory) or fall back to loading from sessionMemory service
  const conversationHistory = Array.isArray(history) ? history : conversationMemoryService.getHistory(conversationId);

  // 1. Refusal Policy Guard for out of scope questions
  if (isOutOfScope(message)) {
    const refusalReply = {
      reply: "يزيد معلمني بأن ما أخرج عن إطار شركة ميس والعمل المؤكل له",
      charts: [],
      actions: [],
      sources: []
    };
    conversationMemoryService.appendMessage(conversationId, 'user', message);
    conversationMemoryService.appendMessage(conversationId, 'assistant', refusalReply.reply);
    return {
      layer: 'chat',
      model: 'local-refusal',
      source: 'local',
      result: refusalReply,
      cached: false
    };
  }

  const context = buildContext(records);

  const fullContext = {
    dataset_summary: context.dataset_summary,
    top_risk_records: context.top_risk_records,
    current_page_context: chatContext || { page: 'unknown', filters: {} },
    recent_messages: conversationHistory.slice(-6).map(h => ({
      role: h.sender === 'user' ? 'user' : 'model',
      text: h.text
    })),
    current_time: new Date().toISOString()
  };

  const systemInstruction = [
    `اسمك هو «صقر AI» — مساعد ذكي متخصص في تحليلات الجودة والعمليات لمصانع ميس (MAIS) بالسعودية.`,
    `Always refer to yourself as "صقر AI" in all responses. Never use any other name, title, or alias. When asked about your name, always say your name is "صقر AI".`,
    `You are a world-class, highly professional enterprise AI quality & operations assistant for a pharmaceutical and medical products manufacturing company in Saudi Arabia (MAIS - Middle East Medical Adhesive Industry).`,
    'Your goal is to answer quality, financial, operational, and audit questions based on the provided dataset summary and user context.',
    'RULES:',
    '1. Language: Automatically detect the language of the user message (Arabic or English) and reply in the same language.',
    '2. Focus ERP and the provided dataset summary are the official source of truth. Use exact numbers and statistics when answering.',
    '3. Tone: Professional, polite, data-driven, and highly administrative.',
    '4. Refusal Policy: If the user asks about anything outside Middle East Medical Adhesive Industry (MAIS), Saudi medical manufacturing, quality controls, rejects, costs, CAPAs, or direct operations, you MUST refuse strictly and answer EXACTLY with: "يزيد معلمني بأن ما أخرج عن إطار شركة ميس والعمل المؤكل له". Never say anything else.',
    '5. Safety: NEVER give patient medical or clinical advice. Always emphasize that your quality insights and recommendations are advisory only and must be reviewed and approved by the Quality Control Manager (QCM) or Quality Assurance Manager (QAM).',
    '6. Compliance: Ground recommendations in ISO 13485:2016 and GMP (Good Manufacturing Practice) guidelines when appropriate.',
    '7. Return a valid JSON object matching the provided response schema.',
    '   - reply: Your main answer in Markdown format. Use tables, bold text, lists, and highlight key metrics. Include a clear GMP advisory disclaimer at the end.',
    '   - charts: An optional array of chart objects to render (type: "bar"|"line"|"donut", title, series: [{ name, data }], categories). Only include if the user requested trends, costs, comparisons, or analysis that is best visualized. Limit categories to maximum 10 elements.',
    '   - actions: An array of quick actions the user can take based on your recommendations (e.g. {"label": "إنشاء إجراء تصحيحي (CAPA)", "command": "create_capa", "payload": { "reason": "..." }}).',
    '   - sources: An array of column or field names from the dataset used to build the answer.'
  ].join('\n');

  const promptText = [
    systemInstruction,
    `Conversation ID: ${conversationId || 'global'}`,
    `Recent Messages (Memory): ${JSON.stringify(fullContext.recent_messages)}`,
    `Current Page Context: ${JSON.stringify(fullContext.current_page_context)}`,
    `Current Time: ${fullContext.current_time}`,
    `Dataset Summary: ${JSON.stringify(fullContext.dataset_summary)}`,
    `Top Risk Records: ${JSON.stringify(fullContext.top_risk_records)}`,
    `User Message: "${message}"`
  ].join('\n');

  const promptConfig = {
    temperature: 0.25,
    schema: chatSchema(),
    text: promptText
  };

  const gemini = await callGemini(promptConfig, 'chat');
  const local = localChatResponse(message, fullContext);

  // Session memory: store user message and assistant reply
  conversationMemoryService.appendMessage(conversationId, 'user', message);
  const replyText = gemini ? (gemini.reply || JSON.stringify(gemini)) : (local.reply || JSON.stringify(local));
  conversationMemoryService.appendMessage(conversationId, 'assistant', replyText);

  const result = {
    layer: 'chat',
    model: gemini ? MODEL : 'local-fallback',
    source: gemini ? 'gemini' : 'local',
    result: gemini || local,
    cached: false
  };

  return result;
}

function localChatResponse(message, fullContext) {
  const msg = String(message || '').toLowerCase();
  const isEnglish = !/[\u0600-\u06FF]/.test(message);
  const ds = fullContext.dataset_summary;
  
  let reply = '';
  let charts = [];
  let actions = [];
  let sources = ['total_cost', 'department', 'defect_type'];

  if (msg.includes('تكلفة') || msg.includes('cost') || msg.includes('مالي') || msg.includes('finance')) {
    const costSar = ds.total_cost.toLocaleString();
    if (isEnglish) {
      reply = `### Financial Quality Loss Summary\n\nAccording to the local data ledger, the **Total Reject Cost** is **SAR ${costSar}**.\n\nHere is the department breakdown:\n\n`;
      Object.entries(ds.cost_by_department).forEach(([dept, stat]) => {
        reply += `- **${dept}**: SAR ${stat.total_cost.toLocaleString()} (${stat.count} cases)\n`;
      });
      reply += `\n*Disclaimer: Local fallback analytics engine. All figures are advisory and subject to QCM verification.*`;
    } else {
      reply = `### ملخص الخسائر المالية للمرفوضات\n\nبناءً على السجلات المحلية المتوفرة، فإن **إجمالي تكلفة المرفوضات** يبلغ **${costSar} ريال سعودي**.\n\nتوزيع التكاليف حسب الأقسام:\n\n`;
      Object.entries(ds.cost_by_department).forEach(([dept, stat]) => {
        const arabicDept = dept === 'Production' ? 'الإنتاج' : dept === 'Warehouse' ? 'المستودعات والمخازن' : dept === 'QC' ? 'رقابة الجودة' : dept;
        reply += `- **${arabicDept}**: ${stat.total_cost.toLocaleString()} ريال سعودي (${stat.count} حالة)\n`;
      });
      reply += `\n*تنبيه جودة: محرك التحليل الاحتياطي المحلي. الأرقام استشارية وتخضع لاعتماد إدارة الجودة (QCM).*`;
    }

    charts.push({
      type: 'donut',
      title: isEnglish ? 'Cost Breakdown by Department' : 'توزيع التكلفة حسب الأقسام',
      series: [{
        name: isEnglish ? 'Cost (SAR)' : 'التكلفة (ريال)',
        data: Object.values(ds.cost_by_department).map(d => d.total_cost)
      }],
      categories: Object.keys(ds.cost_by_department)
    });

    actions.push({
      label: isEnglish ? 'Export Financial Report' : 'تصدير التقرير المالي',
      command: 'export_financial_report'
    });

  } else if (msg.includes('سبب') || msg.includes('أسباب') || msg.includes('reason') || msg.includes('defect') || msg.includes('عطل')) {
    const topCauses = ds.repeated_root_causes.slice(0, 5);
    if (isEnglish) {
      reply = `### Top Quality Defect and Reject Reasons\n\nHere are the top reject reasons from active records:\n\n`;
      topCauses.forEach((c, i) => {
        reply += `${i+1}. **${c.cause}**: ${c.count} cases (${c.percentage}% of total)\n`;
      });
      reply += `\n*Ensure CAPA process is initiated for repeated failures. Advisory only.*`;
    } else {
      reply = `### أهم أسباب الرفض وعيوب الجودة\n\nإليك أعلى أسباب المرفوضات تكراراً في السجلات الحالية:\n\n`;
      topCauses.forEach((c, i) => {
        reply += `${i+1}. **${c.cause}**: عدد ${c.count} حالة (يمثل ${c.percentage}% من الإجمالي)\n`;
      });
      reply += `\n*تنبيه جودة: يوصى ببدء إجراء تصحيحي (CAPA) للأسباب المتكررة. البيانات استشارية.*`;
    }

    charts.push({
      type: 'bar',
      title: isEnglish ? 'Top Reject Reasons (Count)' : 'أعلى أسباب الرفض (العدد)',
      series: [{
        name: isEnglish ? 'Cases' : 'الحالات',
        data: topCauses.map(c => c.count)
      }],
      categories: topCauses.map(c => c.cause.substring(0, 20))
    });

    actions.push({
      label: isEnglish ? 'Initiate CAPA Investigation' : 'بدء تحقيق CAPA للأسباب',
      command: 'initiate_capa',
      payload: { reason: topCauses[0]?.cause || 'Repeated defects' }
    });

  } else if (msg.includes('ماكينة') || msg.includes('machine') || msg.includes('خط') || msg.includes('line')) {
    const topMachines = Object.entries(ds.machine_defect_rates)
      .sort((a, b) => b[1].defect_rate - a[1].defect_rate)
      .slice(0, 5);
    
    if (isEnglish) {
      reply = `### Equipment & Machine Performance Defects\n\nTop machines with active quality defects:\n\n`;
      topMachines.forEach(([mac, stat]) => {
        reply += `- **${mac}**: Defect Rate **${stat.defect_rate}%** (Total: ${stat.total_records} records)\n`;
      });
      reply += `\n*Perform predictive maintenance and tool inspection on affected lines.*`;
    } else {
      reply = `### أداء خطوط الإنتاج والآلات وعيوب التشغيل\n\nأعلى الماكينات تسجيلاً لعيوب الجودة والمرفوضات:\n\n`;
      topMachines.forEach(([mac, stat]) => {
        reply += `- **${mac}**: معدل العيوب **${stat.defect_rate}%** (إجمالي: ${stat.total_records} سجل)\n`;
      });
      reply += `\n*تنبيه جودة: يوصى بجدولة صيانة وقائية ومعايرة فورية للماكينات المتأثرة.*`;
    }

    charts.push({
      type: 'bar',
      title: isEnglish ? 'Machine Defect Rates (%)' : 'معدل عيوب الماكينات (%)',
      series: [{
        name: isEnglish ? 'Defect Rate' : 'معدل العيوب',
        data: topMachines.map(m => m[1].defect_rate)
      }],
      categories: topMachines.map(m => m[0])
    });

  } else if (msg.includes('توقع') || msg.includes('forecast') || msg.includes('قادم') || msg.includes('next')) {
    const monthlyVals = Object.entries(ds.monthly_trends).slice(-6);
    if (isEnglish) {
      reply = `### Monthly Quality Cost Projections\n\nBased on historical moving averages, next month's estimated quality reject loss is projected at **SAR 95,000** with medium confidence.\n\nRecent monthly trends:\n\n`;
      monthlyVals.forEach(([month, stat]) => {
        reply += `- **${month}**: SAR ${stat.total_cost.toLocaleString()}\n`;
      });
      reply += `\n*Advisory statistical forecast only.*`;
    } else {
      reply = `### توقعات تكاليف الجودة والمرفوضات للشهر القادم\n\nاستناداً إلى المتوسطات الحسابية المتحركة، تُقدر تكلفة المرفوضات المتوقعة للشهر القادم بـ **95,000 ريال سعودي** بنسبة ثقة متوسطة.\n\nالاتجاهات الشهرية الأخيرة:\n\n`;
      monthlyVals.forEach(([month, stat]) => {
        reply += `- **${month}**: ${stat.total_cost.toLocaleString()} ريال سعودي\n`;
      });
      reply += `\n*تنبيه جودة: توقعات إحصائية استشارية فقط تخضع لتغيرات حجم الإنتاج.*`;
    }

    charts.push({
      type: 'line',
      title: isEnglish ? 'Cost Trend & Projection' : 'اتجاه وتوقعات التكاليف الشهيرة',
      series: [{
        name: isEnglish ? 'Actual Cost' : 'التكلفة الفعلية',
        data: monthlyVals.map(m => m[1].total_cost)
      }],
      categories: monthlyVals.map(m => m[0])
    });

  } else {
    if (isEnglish) {
      reply = `### صقر AI — MAIS Quality & Production Assistant\n\nHello! I am صقر AI, your intelligent quality and production assistant. I can help you analyze raw material rejects, calculate quality costs, track CAPAs, and verify GMP compliance.\n\n**Try asking me about:**\n1. "What is the total reject cost?"\n2. "Give me the top 5 reject reasons"\n3. "How is Production department performing?"\n4. "Show me machine defect rates"\n\n*All insights are advisory and require QCM/QAM approval.*`;
    } else {
      reply = `### صقر AI — مساعد الجودة والإنتاج\n\nأهلاً بك! أنا صقر AI، مساعدك الذكي لتحليلات الجودة والإنتاج. يمكنني مساعدتك في تحليل مرفوضات المواد الخام، وحساب الخسائر المالية، وتتبع خطط CAPA والتحقق من التزام ممارسات GMP الدوائية.\n\n**يمكنك سؤالي عن:**\n1. "كم تكلفة المرفوضات الإجمالية؟"\n2. "أعطني أعلى 5 أسباب رفض"\n3. "قارن قسم الإنتاج مع المستودعات"\n4. "ما هي معدلات عيوب الماكينات؟"\n\n*ملاحظة: كافة توصيات النظام استشارية وتخضع لمراجعة واعتماد إدارة الجودة (QCM).*`;
    }
  }

  return {
    reply,
    charts,
    actions,
    sources
  };
}

function analysisSchema() {
  return {
    type: 'object',
    properties: {
      executive_summary: { type: 'string' },
      risk: { type: 'string' },
      finance: { type: 'string' },
      CAPA: { type: 'string' },
      backlog: { type: 'string' },
      anomaly: { type: 'string' },
      management_action: { type: 'string' }
    },
    required: ['executive_summary', 'risk', 'finance', 'CAPA', 'backlog', 'anomaly', 'management_action']
  };
}

let cachedAnalysis = null;
let cachedAt = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;

async function getGeminiAnalysis(records) {
  const now = Date.now();
  if (cachedAnalysis && now - cachedAt < CACHE_TTL_MS) {
    return { analysis: cachedAnalysis, cached: true };
  }

  if (!config.geminiApiKey) {
    return { analysis: null, cached: false };
  }

  const context = buildContext(records);
  const top_risk_records = records
    .slice()
    .sort((a, b) => (Number(b.risk_score) || 0) - (Number(a.risk_score) || 0))
    .slice(0, 10)
    .map(r => ({
      doc_no: r.doc_no,
      item_code: r.item_code,
      item_name: r.item_name,
      cost: r.cost,
      risk_score: r.risk_score,
      expiry_date: r.expiry_date,
      remaining_percent: r.remaining_percent
    }));

  const fullContext = {
    dataset_summary: {
      total_cost: context.metrics.total_cost,
      cost_by_department: context.metrics.cost_by_department,
      cost_by_category: context.metrics.cost_by_category,
      pending_approvals_count: context.metrics.pending_approvals_count,
      repeated_root_causes: context.dataset_summary.repeated_root_causes,
      monthly_trends: context.metrics.monthly_trends,
      machine_defect_rates: context.metrics.machine_defect_rates,
      year_over_year: context.metrics.year_over_year_comparison
    },
    top_risk_records,
    current_page_context: { page: 'ai-analysis', filters: {} }
  };

  const systemInstruction = [
    `اسمك هو «صقر AI» — مساعد ذكي متخصص في تحليلات الجودة والعمليات لمصانع ميس (MAIS) بالسعودية. Always refer to yourself as "صقر AI".`,
    `Focus ERP is the official source of truth. AI output is advisory only.`,
    `Return a valid JSON object matching the provided response schema.`,
    `Ensure all statistical insights strictly map to Middle East Medical Adhesive Industry (MAIS).`
  ].join('\n');

  const promptText = [
    systemInstruction,
    `Dataset Summary: ${JSON.stringify(fullContext.dataset_summary)}`,
    `Top Risk Records: ${JSON.stringify(fullContext.top_risk_records)}`,
    `Current Page Context: ${JSON.stringify(fullContext.current_page_context)}`,
    `Generate the comprehensive quality & operational executive analysis matching the response schema.`
  ].join('\n');

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': config.geminiApiKey
      },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: promptText }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: analysisSchema(),
          temperature: 0.2
        }
      })
    });

    if (!response.ok) throw new Error(`Gemini API error: ${response.status}`);
    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    const parsed = text ? JSON.parse(text) : null;

    if (parsed) {
      cachedAnalysis = parsed;
      cachedAt = now;
      return { analysis: parsed, cached: false };
    }
    return { analysis: null, cached: false };
  } catch (err) {
    logger.warn('gemini_analysis_service_failed', { message: err.message });
    return { analysis: null, cached: false };
  }
}

function getSystemPrompt() {
  return `اسمك هو «صقر AI» — مساعد ذكي متخصص في تحليلات الجودة والعمليات.`;
}

function getSessionsMap() {
  return conversationMemoryService.sessions;
}

module.exports = {
  runEnterpriseAnalysis,
  answerNaturalLanguageQuery,
  generateCapa,
  detectAnomalies,
  invalidateAiCache,
  auditTrail,
  buildPrompt,
  chatWithGemini,
  getSystemPrompt,
  getSessionsMap,
  getGeminiAnalysis
};
