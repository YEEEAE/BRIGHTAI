import { buildQcPrompt, QC_ADVISORY_SYSTEM_PROMPT } from './prompts';
import { redactContext } from './context';
import { runStructuredAi } from './service';
import { capaAssistanceSchema, evidenceReviewSchema, findingAnalysisSchema, managementSummarySchema, rcaAssistanceSchema, taskAnalysisSchema, type CapaAssistance, type EvidenceReview, type FindingAnalysis, type ManagementSummary, type RcaAssistance, type TaskAnalysis } from './schemas';
import type { AiProvider, AiFeatureResult } from './types';

async function runFeature<T>(feature: string, userId: number, context: unknown, schema: import('zod').ZodType<T>, provider?: AiProvider): Promise<AiFeatureResult<T>> {
  const result = await runStructuredAi({ userId, feature, systemPrompt: QC_ADVISORY_SYSTEM_PROMPT, userPrompt: buildQcPrompt(feature, redactContext(context)), schema, provider });
  return { ...result.data, requestReference: result.requestReference, responseReference: result.responseReference } as AiFeatureResult<T>;
}

export const analyzeTask = (userId: number, context: Record<string, unknown>, provider?: AiProvider): Promise<AiFeatureResult<TaskAnalysis>> => runFeature('task_analysis', userId, context, taskAnalysisSchema, provider);
export const analyzeFinding = (userId: number, context: Record<string, unknown>, provider?: AiProvider): Promise<AiFeatureResult<FindingAnalysis>> => runFeature('finding_analysis', userId, context, findingAnalysisSchema, provider);
export const assistRca = (userId: number, context: Record<string, unknown>, provider?: AiProvider): Promise<AiFeatureResult<RcaAssistance>> => runFeature('rca_assistance', userId, context, rcaAssistanceSchema, provider);
export const assistCapa = (userId: number, context: Record<string, unknown>, provider?: AiProvider): Promise<AiFeatureResult<CapaAssistance>> => runFeature('capa_assistance', userId, context, capaAssistanceSchema, provider);
export const buildManagementSummary = (userId: number, context: Record<string, unknown>, provider?: AiProvider): Promise<AiFeatureResult<ManagementSummary>> => runFeature('management_summary', userId, context, managementSummarySchema, provider);
export const reviewEvidence = (userId: number, context: Record<string, unknown>, provider?: AiProvider): Promise<AiFeatureResult<EvidenceReview>> => runFeature('evidence_review', userId, context, evidenceReviewSchema, provider);
