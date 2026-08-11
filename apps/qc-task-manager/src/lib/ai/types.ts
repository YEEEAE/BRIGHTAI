import type { z } from 'zod';
import type { CapaAssistance, EvidenceReview, FindingAnalysis, ManagementSummary, RcaAssistance, TaskAnalysis } from './schemas';

export type AiCompletionRequest = { system: string; user: string };

export interface AiProvider {
  readonly model: string;
  complete(request: AiCompletionRequest): Promise<string>;
}

export type StructuredAiRequest<T> = {
  userId: number;
  feature: string;
  systemPrompt: string;
  userPrompt: string;
  schema: z.ZodType<T>;
  provider?: AiProvider;
};

export type AiFeatureResult<T> = T & { confidence: number; evidence_used: string[]; human_review_required: true; requestReference: string; responseReference: string };
export type TaskAiContext = Record<string, unknown>;
export type FindingAiContext = Record<string, unknown>;
export type ManagementAiContext = Record<string, unknown>;
export type EvidenceAiContext = Record<string, unknown>;
export type AiFeatureOutput = TaskAnalysis | FindingAnalysis | RcaAssistance | CapaAssistance | ManagementSummary | EvidenceReview;
