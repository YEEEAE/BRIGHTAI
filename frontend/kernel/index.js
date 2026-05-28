'use strict';

const { scan } = require('./firewall');
const { computeRiskScore } = require('./risk-scorer');
const { logInteraction, queryAuditTrail, getAuditEntry, verifyChainIntegrity } = require('./audit');
const { queueForApproval, approve, reject, getPendingApprovals } = require('./approval');
const { runComplianceChecks, saveComplianceChecks, getComplianceStatus } = require('./compliance');
const { generateEvidenceFile, generateComplianceReport } = require('./evidence');
const { generateId } = require('../db/init');

function buildSystemInstruction(compliancePack) {
  const base = 'You are BrightAI Saqr AI, a secure AI assistant for Saudi enterprises. Respond in Arabic unless the user writes in English. Be professional, concise, and compliant with Saudi regulations.';
  const packInstructions = {
    pdpl: base + ' You are operating under PDPL (Personal Data Protection Law) compliance. Never request or output personal data. Warn if the user shares sensitive information.',
    nca_ecc: base + ' You are operating under NCA ECC 2-2024 cybersecurity controls. Prioritize security best practices. Log-relevant responses.',
    sfda: base + ' You are operating under SFDA/ISO 13485 medical device quality compliance. Assist with CAPA, rejections, complaints, and quality management. Reference ISO 13485 clauses when relevant.',
    procurement: base + ' You are operating in procurement/tenders context. Help analyze contracts, detect risks, and ensure compliance with Saudi procurement regulations.',
    healthcare: base + ' You are operating in healthcare context. Protect patient data. Assist with medical workflows while maintaining strict data confidentiality.',
  };
  return packInstructions[compliancePack] || base;
}

async function callGemini(maskedMessage, compliancePack) {
  const { config } = require('../config');
  const model = config.gemini.model || 'gemini-2.5-flash';
  const apiKey = config.gemini.apiKey;
  const endpoint = `${config.gemini.endpoint}/${model}:generateContent`;

  if (!apiKey) {
    return {
      response: '[BrightAI Kernel] Error: GEMINI_API_KEY not configured. Please set it in environment variables.',
      model,
      inputTokens: 0,
      outputTokens: 0,
      latencyMs: 0,
      error: 'GEMINI_API_KEY not configured'
    };
  }

  const systemInstruction = buildSystemInstruction(compliancePack);
  const body = {
    contents: [{ role: 'user', parts: [{ text: maskedMessage }] }],
    systemInstruction: { parts: [{ text: systemInstruction }] },
    generationConfig: { temperature: 0.3, maxOutputTokens: 4096 }
  };

  const startTime = Date.now();
  try {
    const fetchResponse = await fetch(`${endpoint}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const latencyMs = Date.now() - startTime;
    const data = await fetchResponse.json();

    if (data.error) {
      return {
        response: `[BrightAI Kernel] Gemini API error: ${data.error.message}`,
        model,
        inputTokens: 0,
        outputTokens: 0,
        latencyMs,
        error: data.error.message
      };
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const usage = data.usageMetadata || {};

    return {
      response: text,
      model,
      inputTokens: usage.promptTokenCount || 0,
      outputTokens: usage.candidatesTokenCount || 0,
      latencyMs,
      error: null
    };
  } catch (err) {
    return {
      response: `[BrightAI Kernel] Network error: ${err.message}`,
      model,
      inputTokens: 0,
      outputTokens: 0,
      latencyMs: Date.now() - startTime,
      error: err.message
    };
  }
}

async function processChat(params) {
  const { message, userId, userName, ipAddress, userAgent, compliancePack, metadata } = params;
  const pack = compliancePack || 'general';

  // Layer 1: AI Firewall
  const firewallResult = await scan(message, pack);

  if (firewallResult.firewallAction === 'block') {
    const blockedInteraction = await logInteraction({
      user_id: userId,
      user_name: userName,
      ip_address: ipAddress,
      user_agent: userAgent,
      request_message: message,
      request_metadata: JSON.stringify(metadata || {}),
      pii_detected: firewallResult.piiDetected ? 1 : 0,
      pii_types: JSON.stringify(firewallResult.piiTypes),
      pii_items: JSON.stringify(firewallResult.piiItems),
      sensitive_data_categories: JSON.stringify(firewallResult.sensitiveCategories),
      firewall_action: 'block',
      masked_message: null,
      risk_score: 100,
      risk_level: 'critical',
      risk_reasons: JSON.stringify(['Request blocked by AI Firewall']),
      approval_status: 'blocked',
      gemini_response: null,
      response_model: null,
      response_tokens_input: 0,
      response_tokens_output: 0,
      response_time_ms: 0,
      response_error: 'Blocked by firewall',
      compliance_pack: pack,
      compliance_flags: JSON.stringify([`Blocked: ${firewallResult.piiTypes.join(', ')}`])
    });

    return {
      status: 'blocked',
      interactionId: blockedInteraction.id,
      reason: 'Request blocked by AI Firewall',
      piiTypes: firewallResult.piiTypes,
      kernel: { firewall: firewallResult, risk: { score: 100, level: 'critical' }, compliance: { pack, result: 'fail' } }
    };
  }

  // Layer 4: Compliance checks
  const complianceResult = runComplianceChecks(pack, {
    firewallResult,
    requestMessage: message,
    user: userId ? { id: userId, name: userName } : null,
    metadata
  });

  // Layer 2: Risk scoring
  const riskResult = computeRiskScore({
    firewallResult,
    compliancePack: pack,
    requestMetadata: { messageLength: message.length },
    user: userId ? { id: userId, name: userName } : null
  });

  // Layer 3: Approval gate
  if (riskResult.requiresApproval) {
    const pendingInteraction = await logInteraction({
      user_id: userId,
      user_name: userName,
      ip_address: ipAddress,
      user_agent: userAgent,
      request_message: message,
      request_metadata: JSON.stringify(metadata || {}),
      pii_detected: firewallResult.piiDetected ? 1 : 0,
      pii_types: JSON.stringify(firewallResult.piiTypes),
      pii_items: JSON.stringify(firewallResult.piiItems),
      sensitive_data_categories: JSON.stringify(firewallResult.sensitiveCategories),
      firewall_action: firewallResult.firewallAction,
      masked_message: firewallResult.maskedText,
      risk_score: riskResult.score,
      risk_level: riskResult.level,
      risk_reasons: JSON.stringify(riskResult.reasons),
      approval_status: 'pending',
      gemini_response: null,
      response_model: null,
      response_tokens_input: 0,
      response_tokens_output: 0,
      response_time_ms: 0,
      response_error: null,
      compliance_pack: pack,
      compliance_flags: JSON.stringify(complianceResult.flags)
    });

    await saveComplianceChecks(pendingInteraction.id, complianceResult);
    await queueForApproval(pendingInteraction.id, riskResult.score, riskResult.level);

    return {
      status: 'pending_approval',
      interactionId: pendingInteraction.id,
      riskScore: riskResult.score,
      riskLevel: riskResult.level,
      reasons: riskResult.reasons,
      kernel: { firewall: firewallResult, risk: riskResult, compliance: complianceResult }
    };
  }

  // Auto-approved: call Gemini
  const geminiResult = await callGemini(firewallResult.maskedText, pack);

  // Audit trail
  const interaction = await logInteraction({
    user_id: userId,
    user_name: userName,
    ip_address: ipAddress,
    user_agent: userAgent,
    request_message: message,
    request_metadata: JSON.stringify(metadata || {}),
    pii_detected: firewallResult.piiDetected ? 1 : 0,
    pii_types: JSON.stringify(firewallResult.piiTypes),
    pii_items: JSON.stringify(firewallResult.piiItems),
    sensitive_data_categories: JSON.stringify(firewallResult.sensitiveCategories),
    firewall_action: firewallResult.firewallAction,
    masked_message: firewallResult.maskedText,
    risk_score: riskResult.score,
    risk_level: riskResult.level,
    risk_reasons: JSON.stringify(riskResult.reasons),
    approval_status: 'auto_approved',
    gemini_response: geminiResult.response,
    response_model: geminiResult.model,
    response_tokens_input: geminiResult.inputTokens,
    response_tokens_output: geminiResult.outputTokens,
    response_time_ms: geminiResult.latencyMs,
    response_error: geminiResult.error,
    compliance_pack: pack,
    compliance_flags: JSON.stringify(complianceResult.flags)
  });

  await saveComplianceChecks(interaction.id, complianceResult);

  return {
    status: 'completed',
    interactionId: interaction.id,
    response: geminiResult.response,
    kernel: {
      firewall: { piiDetected: firewallResult.piiDetected, piiTypes: firewallResult.piiTypes, action: firewallResult.firewallAction },
      risk: { score: riskResult.score, level: riskResult.level },
      compliance: { pack, result: complianceResult.overallResult, flags: complianceResult.flags },
      tokens: { input: geminiResult.inputTokens, output: geminiResult.outputTokens },
      latencyMs: geminiResult.latencyMs,
      chainHash: interaction.record_hash
    }
  };
}

async function getStats() {
  const { getDb } = require('../db/init');
  const pool = getDb();

  const { rows: [{ c: total }] } = await pool.query('SELECT COUNT(*) as c FROM kernel_interactions');
  const { rows: [{ c: blocked }] } = await pool.query("SELECT COUNT(*) as c FROM kernel_interactions WHERE firewall_action = 'block'");
  const { rows: [{ c: pending }] } = await pool.query("SELECT COUNT(*) as c FROM kernel_interactions WHERE approval_status = 'pending'");
  const { rows: [{ c: approved }] } = await pool.query("SELECT COUNT(*) as c FROM kernel_interactions WHERE approval_status = 'approved'");
  const { rows: [{ c: autoApproved }] } = await pool.query("SELECT COUNT(*) as c FROM kernel_interactions WHERE approval_status = 'auto_approved'");
  const { rows: [{ c: rejected }] } = await pool.query("SELECT COUNT(*) as c FROM kernel_interactions WHERE approval_status = 'rejected'");
  const { rows: [{ c: piiDetected }] } = await pool.query('SELECT COUNT(*) as c FROM kernel_interactions WHERE pii_detected = 1');
  const { rows: [{ avg }] } = await pool.query('SELECT AVG(risk_score)::numeric as avg FROM kernel_interactions');
  const chain = await verifyChainIntegrity();

  const { rows: byPack } = await pool.query('SELECT compliance_pack, COUNT(*) as count FROM kernel_interactions GROUP BY compliance_pack');
  const { rows: byRiskLevel } = await pool.query('SELECT risk_level, COUNT(*) as count FROM kernel_interactions GROUP BY risk_level');

  return {
    total, blocked, pending, approved, autoApproved, rejected, piiDetected,
    avgRiskScore: Math.round(parseFloat(avg || 0) * 10) / 10,
    complianceRate: total > 0 ? (((total - blocked - rejected) / total) * 100).toFixed(1) + '%' : '100%',
    byCompliancePack: byPack,
    byRiskLevel,
    chainIntegrity: chain
  };
}

module.exports = {
  processChat,
  approve,
  reject,
  getPendingApprovals,
  queryAuditTrail,
  getAuditEntry,
  getComplianceStatus,
  generateEvidenceFile,
  generateComplianceReport,
  getStats
};
