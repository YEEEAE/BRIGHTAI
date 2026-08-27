import type { APIRoute } from 'astro';
import { isResponse, requireApiUser, requireAiRateLimit, requireCsrf, apiJsonError } from '../../../lib/api-security';
import { AiNotConfiguredError, AiServiceError } from '../../../lib/ai/service';
import { analyzeTask, analyzeFinding, assistRca, assistCapa, buildManagementSummary, reviewEvidence } from '../../../lib/ai/features';
import { compareLabTestToSop, identifyLabMissingFields, summarizeLabDataQuality, summarizeLabDocumentChanges, summarizeLabEquipmentHistory, summarizeLabFailPatterns, summarizeLabRetestPatterns, summarizeLabTest, suggestLabReviewQuestions } from '../../../lib/ai/labFeatures';
import { evidenceAiContext, findingAiContext, managementAiContext, setEvidenceAiStatus, taskAiContext } from '../../../lib/aiQcContext';
import { labDataQualitySummaryContext, labDocumentChangesContext, labEquipmentHistoryContext, labFailPatternsContext, labMissingFieldsContext, labRetestPatternsContext, labReviewQuestionsContext, labSopComparisonContext, labTestSummaryContext } from '../../../lib/lab/aiContext';
import { parsePositiveId } from '../../../lib/validation';

const json = (body: Record<string, unknown>, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });

export const POST: APIRoute = async (context) => {
  const csrf = requireCsrf(context); if (csrf) return csrf;
  const auth = requireApiUser(context); if (isResponse(auth)) return auth;
  const rateLimit = requireAiRateLimit(auth.id); if (rateLimit) return rateLimit;
  const feature = context.params.feature ?? '';
  const supported = ['task-analysis', 'finding-analysis', 'rca-assistance', 'capa-assistance', 'management-summary', 'evidence-review',
    'lab-test-summary', 'lab-equipment-history', 'lab-document-changes', 'lab-missing-fields', 'lab-review-questions', 'lab-sop-comparison', 'lab-fail-patterns', 'lab-retest-patterns', 'lab-data-quality-summary'];
  if (!supported.includes(feature)) return apiJsonError('Unknown AI feature.', 404);
  let body: Record<string, unknown> = {};
  try { const parsed = await context.request.json(); body = parsed && typeof parsed === 'object' ? parsed as Record<string, unknown> : {}; } catch { return apiJsonError('Invalid request body.', 400); }
  try {
    // Laboratory advisory features — read-only contexts guarded per feature.
    const labFeatureMap: Record<string, { scope: (id: number) => ReturnType<typeof labTestSummaryContext>; run: (userId: number, context: Record<string, unknown>) => Promise<unknown>; idRequired: boolean }> = {
      'lab-test-summary': { scope: (id) => labTestSummaryContext(id, auth), run: summarizeLabTest, idRequired: true },
      'lab-equipment-history': { scope: (id) => labEquipmentHistoryContext(id, auth), run: summarizeLabEquipmentHistory, idRequired: true },
      'lab-document-changes': { scope: (id) => labDocumentChangesContext(id, auth), run: summarizeLabDocumentChanges, idRequired: true },
      'lab-missing-fields': { scope: (id) => labMissingFieldsContext(id, auth), run: identifyLabMissingFields, idRequired: true },
      'lab-review-questions': { scope: (id) => labReviewQuestionsContext(id, auth), run: suggestLabReviewQuestions, idRequired: true },
      'lab-sop-comparison': { scope: (id) => labSopComparisonContext(id, auth), run: compareLabTestToSop, idRequired: true },
      'lab-fail-patterns': { scope: () => labFailPatternsContext(auth), run: summarizeLabFailPatterns, idRequired: false },
      'lab-retest-patterns': { scope: () => labRetestPatternsContext(auth), run: summarizeLabRetestPatterns, idRequired: false },
      'lab-data-quality-summary': { scope: () => labDataQualitySummaryContext(auth), run: summarizeLabDataQuality, idRequired: false },
    };
    const labFeature = labFeatureMap[feature];
    if (labFeature) {
      let labId = 0;
      if (labFeature.idRequired) {
        labId = parsePositiveId(typeof body.id === 'string' || typeof body.id === 'number' ? String(body.id) : undefined) ?? 0;
        if (!labId) return apiJsonError('A valid id is required.', 400);
      }
      const scope = labFeature.scope(labId);
      if (!scope.ok) return json({ ok: false, error: scope.error }, scope.status);
      return json({ ok: true, feature, result: await labFeature.run(auth.id, scope.context) });
    }
    if (feature === 'management-summary') {
      const scope = managementAiContext(auth); if (!scope.ok) return json({ ok: false, error: scope.error }, scope.status);
      return json({ ok: true, feature, result: await buildManagementSummary(auth.id, scope.context) });
    }
    const id = parsePositiveId(typeof body.id === 'string' || typeof body.id === 'number' ? String(body.id) : undefined);
    if (!id) return apiJsonError('A valid id is required.', 400);
    if (feature === 'task-analysis') { const scope = taskAiContext(id, auth); if (!scope.ok) return json({ ok: false, error: scope.error }, scope.status); return json({ ok: true, feature, result: await analyzeTask(auth.id, scope.context) }); }
    if (feature === 'evidence-review') { const taskId = parsePositiveId(typeof body.task_id === 'string' || typeof body.task_id === 'number' ? String(body.task_id) : undefined); if (!taskId) return apiJsonError('A valid task_id is required.', 400); const scope = evidenceAiContext(taskId, id, auth, body.allow_ai_processing === true); if (!scope.ok) return json({ ok: false, error: scope.error }, scope.status); setEvidenceAiStatus(taskId, id, 'AI_PENDING'); try { const result = await reviewEvidence(auth.id, scope.context); setEvidenceAiStatus(taskId, id, 'AI_REVIEWED'); return json({ ok: true, feature, result }); } catch (error) { setEvidenceAiStatus(taskId, id, 'UNVERIFIED'); throw error; } }
    const scope = findingAiContext(id, auth); if (!scope.ok) return json({ ok: false, error: scope.error }, scope.status);
    if (feature === 'finding-analysis') return json({ ok: true, feature, result: await analyzeFinding(auth.id, scope.context) });
    if (feature === 'rca-assistance') return json({ ok: true, feature, result: await assistRca(auth.id, scope.context) });
    return json({ ok: true, feature, result: await assistCapa(auth.id, scope.context) });
  } catch (error) {
    // Controlled "not configured" state: no provider credential exists in this
    // deployment. Distinct from a transient failure so the UI can render a
    // stable unavailable state; AI is advisory and core QC never depends on it.
    if (error instanceof AiNotConfiguredError) return json({ ok: false, error: 'AI advisory features are not configured for this deployment. Continue manually.', aiUnavailable: true }, 503);
    if (error instanceof AiServiceError) return json({ ok: false, error: error.message.includes('rate limit') ? 'AI rate limit exceeded.' : 'AI is temporarily unavailable. Continue manually.' }, error.message.includes('rate limit') ? 429 : 503);
    return json({ ok: false, error: 'AI feature failed safely. Continue manually.' }, 503);
  }
};
