import { buildQcPrompt, LAB_ADVISORY_SYSTEM_PROMPT } from './prompts';
import { redactContext } from './context';
import { runStructuredAi } from './service';
import {
  labDataQualitySummarySchema, labDocumentChangesSchema, labEquipmentHistorySchema,
  labFailPatternsSchema, labMissingFieldsSchema, labRetestPatternsSchema, labReviewQuestionsSchema,
  labSopComparisonSchema, labTestSummarySchema,
  type LabDataQualitySummaryAi, type LabDocumentChangesAi, type LabEquipmentHistoryAi,
  type LabFailPatternsAi, type LabMissingFieldsAi, type LabRetestPatternsAi, type LabReviewQuestionsAi,
  type LabSopComparisonAi, type LabTestSummaryAi,
} from './schemas';
import type { AiProvider, AiFeatureResult } from './types';

/**
 * Controlled AI assistance for the laboratory. Every feature is advisory only:
 * the system prompt forbids PASS/FAIL decisions, approvals and record
 * modifications, the schemas force the `ai_generated` marking plus
 * `human_review_required: true`, and runStructuredAi handles rate limiting,
 * redaction, strict zod parsing and the AI audit log — the same guardrails as
 * the QC copilot features.
 */
async function runLabFeature<T>(feature: string, userId: number, context: unknown, schema: import('zod').ZodType<T>, provider?: AiProvider): Promise<AiFeatureResult<T>> {
  const result = await runStructuredAi({ userId, feature, systemPrompt: LAB_ADVISORY_SYSTEM_PROMPT, userPrompt: buildQcPrompt(feature, redactContext(context)), schema, provider });
  return { ...result.data, requestReference: result.requestReference, responseReference: result.responseReference } as AiFeatureResult<T>;
}

export const summarizeLabTest = (userId: number, context: Record<string, unknown>, provider?: AiProvider): Promise<AiFeatureResult<LabTestSummaryAi>> => runLabFeature('lab_test_summary', userId, context, labTestSummarySchema, provider);
export const summarizeLabEquipmentHistory = (userId: number, context: Record<string, unknown>, provider?: AiProvider): Promise<AiFeatureResult<LabEquipmentHistoryAi>> => runLabFeature('lab_equipment_history', userId, context, labEquipmentHistorySchema, provider);
export const summarizeLabDocumentChanges = (userId: number, context: Record<string, unknown>, provider?: AiProvider): Promise<AiFeatureResult<LabDocumentChangesAi>> => runLabFeature('lab_document_changes', userId, context, labDocumentChangesSchema, provider);
export const identifyLabMissingFields = (userId: number, context: Record<string, unknown>, provider?: AiProvider): Promise<AiFeatureResult<LabMissingFieldsAi>> => runLabFeature('lab_missing_fields', userId, context, labMissingFieldsSchema, provider);
export const suggestLabReviewQuestions = (userId: number, context: Record<string, unknown>, provider?: AiProvider): Promise<AiFeatureResult<LabReviewQuestionsAi>> => runLabFeature('lab_review_questions', userId, context, labReviewQuestionsSchema, provider);
export const compareLabTestToSop = (userId: number, context: Record<string, unknown>, provider?: AiProvider): Promise<AiFeatureResult<LabSopComparisonAi>> => runLabFeature('lab_sop_comparison', userId, context, labSopComparisonSchema, provider);
export const summarizeLabFailPatterns = (userId: number, context: Record<string, unknown>, provider?: AiProvider): Promise<AiFeatureResult<LabFailPatternsAi>> => runLabFeature('lab_fail_patterns', userId, context, labFailPatternsSchema, provider);
export const summarizeLabRetestPatterns = (userId: number, context: Record<string, unknown>, provider?: AiProvider): Promise<AiFeatureResult<LabRetestPatternsAi>> => runLabFeature('lab_retest_patterns', userId, context, labRetestPatternsSchema, provider);
export const summarizeLabDataQuality = (userId: number, context: Record<string, unknown>, provider?: AiProvider): Promise<AiFeatureResult<LabDataQualitySummaryAi>> => runLabFeature('lab_data_quality_summary', userId, context, labDataQualitySummarySchema, provider);
