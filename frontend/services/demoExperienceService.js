const aiGateway = require('./aiGateway');
const { validateDemoRunRequest } = require('./demoValidation');

function buildUserPrompt(input) {
  const contextLines = Object.entries(input.context || {})
    .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join('، ') : value}`)
    .join('\n');

  return [
    `الديمو: ${input.promptConfig.title}`,
    `القطاع: ${input.industry}`,
    `حجم الجهة: ${input.companySize}`,
    `الهدف التجاري: ${input.businessGoal}`,
    `العملية أو التحدي الحالي: ${input.currentProcess || 'غير محدد'}`,
    `مؤشر النجاح المطلوب: ${input.successMetric || 'غير محدد'}`,
    `أفق القرار: ${input.urgency}`,
    contextLines ? `سياق إضافي:\n${contextLines}` : '',
    'أعد تقريراً تنفيذياً منظماً يساعد صاحب القرار على تقييم شراء حل BrightAI.'
  ].filter(Boolean).join('\n');
}

function normalizeDemoResult(input, gatewayResult) {
  const data = gatewayResult?.data && typeof gatewayResult.data === 'object'
    ? gatewayResult.data
    : {};

  const score = Number(data.readiness_score || data.score || 0);
  return {
    ok: true,
    demoKey: input.demoKey,
    title: input.promptConfig.title,
    requestId: gatewayResult?.requestId,
    provider: gatewayResult?.provider || 'gemini',
    model: gatewayResult?.model || 'unknown',
    score: Number.isFinite(score) && score > 0 ? Math.min(100, Math.max(0, Math.round(score))) : 72,
    report: {
      executiveSummary: data.executive_summary_ar || 'تم توليد ملخص تنفيذي أولي بناءً على مدخلات الديمو.',
      keyInsights: Array.isArray(data.key_insights) ? data.key_insights.slice(0, 6) : [],
      risks: Array.isArray(data.risks) ? data.risks.slice(0, 5) : [],
      recommendedActions: Array.isArray(data.recommended_actions) ? data.recommended_actions.slice(0, 6) : [],
      businessImpact: data.business_impact_ar || '',
      integrationReadiness: Array.isArray(data.integration_readiness) ? data.integration_readiness.slice(0, 5) : [],
      nextAction: data.next_action_ar || 'احجز جلسة تقييم تنفيذية لتحديد نطاق التطبيق والربط.',
      whatsappSummary: data.whatsapp_summary_ar || ''
    },
    raw: data
  };
}

async function runDemoExperience(body) {
  const input = validateDemoRunRequest(body);
  const gatewayResult = await aiGateway.runGeminiCompletion({
    messages: [{ role: 'user', content: buildUserPrompt(input) }],
    system: input.promptConfig.system,
    temperature: 0.18,
    maxOutputTokens: 1700,
    schemaName: input.promptConfig.schemaName,
    demoType: input.demoKey,
    locale: input.locale,
    sourcePage: input.sourcePage,
    safetyProfile: input.promptConfig.safetyProfile,
    metadata: { prompt: input.businessGoal, maxOutputTokens: 1700 }
  });

  if (!gatewayResult?.ok) {
    return {
      ok: false,
      demoKey: input.demoKey,
      title: input.promptConfig.title,
      requestId: gatewayResult?.requestId,
      provider: gatewayResult?.provider || 'gemini',
      model: gatewayResult?.model || 'unknown',
      error: gatewayResult?.error || {
        code: 'DEMO_AI_UNAVAILABLE',
        message_ar: 'تعذر تشغيل التحليل الآن. استخدم السيناريو الجاهز أو أعد المحاولة.'
      }
    };
  }

  return normalizeDemoResult(input, gatewayResult);
}

module.exports = {
  runDemoExperience,
  buildUserPrompt,
  normalizeDemoResult
};
