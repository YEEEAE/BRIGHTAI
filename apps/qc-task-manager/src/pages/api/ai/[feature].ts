import type { APIRoute } from 'astro';
import { isResponse, requireApiUser, requireCsrf, apiJsonError } from '../../../lib/api-security';
import { AiServiceError } from '../../../lib/ai/service';
import { analyzeTask, analyzeFinding, assistRca, assistCapa, buildManagementSummary, reviewEvidence } from '../../../lib/ai/features';
import { evidenceAiContext, findingAiContext, managementAiContext, setEvidenceAiStatus, taskAiContext } from '../../../lib/aiQcContext';
import { parsePositiveId } from '../../../lib/validation';

const json = (body: Record<string, unknown>, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });

export const POST: APIRoute = async (context) => {
  const csrf = requireCsrf(context); if (csrf) return csrf;
  const auth = requireApiUser(context); if (isResponse(auth)) return auth;
  const feature = context.params.feature ?? '';
  const supported = ['task-analysis', 'finding-analysis', 'rca-assistance', 'capa-assistance', 'management-summary', 'evidence-review'];
  if (!supported.includes(feature)) return apiJsonError('Unknown AI feature.', 404);
  let body: Record<string, unknown> = {};
  try { const parsed = await context.request.json(); body = parsed && typeof parsed === 'object' ? parsed as Record<string, unknown> : {}; } catch { return apiJsonError('Invalid request body.', 400); }
  try {
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
    if (error instanceof AiServiceError) return json({ ok: false, error: error.message.includes('rate limit') ? 'AI rate limit exceeded.' : 'AI is temporarily unavailable. Continue manually.' }, error.message.includes('rate limit') ? 429 : 503);
    return json({ ok: false, error: 'AI feature failed safely. Continue manually.' }, 503);
  }
};
