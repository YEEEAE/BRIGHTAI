import { z } from 'zod';

export const aiSummarySchema = z.object({ summary: z.string().trim().min(1).max(4_000) }).strict();
export type AiSummary = z.infer<typeof aiSummarySchema>;

const advisoryMeta = {
  confidence: z.number().min(0).max(1),
  evidence_used: z.array(z.string().trim().min(1).max(300)).max(30),
  human_review_required: z.literal(true),
};

export const taskAnalysisSchema = z.object({
  risk_assessment: z.enum(['low', 'medium', 'high', 'critical']),
  reasons: z.array(z.string().trim().min(1).max(600)).max(10),
  recommended_actions: z.array(z.string().trim().min(1).max(600)).max(10),
  missing_information: z.array(z.string().trim().min(1).max(600)).max(10),
  ...advisoryMeta,
}).strict();
export const findingAnalysisSchema = z.object({
  potential_classification: z.enum(['conforming', 'minor', 'major', 'critical', 'observation']),
  potential_severity: z.enum(['low', 'medium', 'high', 'critical']),
  risk_factors: z.array(z.string().trim().min(1).max(600)).max(10),
  missing_evidence: z.array(z.string().trim().min(1).max(600)).max(10),
  questions_for_reviewer: z.array(z.string().trim().min(1).max(600)).max(10),
  ...advisoryMeta,
}).strict();
export const rcaAssistanceSchema = z.object({
  potential_root_causes: z.array(z.string().trim().min(1).max(600)).max(10),
  five_whys: z.array(z.string().trim().min(1).max(600)).max(5),
  fishbone_categories: z.array(z.object({ category: z.string().trim().min(1).max(100), factors: z.array(z.string().trim().min(1).max(300)).max(8) }).strict()).max(10),
  contributing_factors: z.array(z.string().trim().min(1).max(600)).max(10),
  ...advisoryMeta,
}).strict();
export const capaAssistanceSchema = z.object({
  corrective_action: z.string().trim().min(1).max(2_000),
  preventive_action: z.string().trim().min(1).max(2_000),
  verification_method: z.string().trim().min(1).max(2_000),
  effectiveness_check: z.string().trim().min(1).max(2_000),
  ...advisoryMeta,
}).strict();
export const managementSummarySchema = z.object({
  sla_risks: z.array(z.string().trim().min(1).max(600)).max(20),
  critical_findings: z.array(z.string().trim().min(1).max(600)).max(20),
  open_capa: z.array(z.string().trim().min(1).max(600)).max(20),
  workload: z.array(z.string().trim().min(1).max(600)).max(20),
  overdue_tasks: z.array(z.string().trim().min(1).max(600)).max(20),
  evidence_gaps: z.array(z.string().trim().min(1).max(600)).max(20),
  ...advisoryMeta,
}).strict();
export const evidenceReviewSchema = z.object({
  completeness: z.enum(['complete', 'partial', 'insufficient', 'unknown']),
  relevance: z.enum(['relevant', 'partially_relevant', 'irrelevant', 'unknown']),
  document_type: z.string().trim().min(1).max(200),
  missing_information: z.array(z.string().trim().min(1).max(600)).max(10),
  potential_inconsistency: z.array(z.string().trim().min(1).max(600)).max(10),
  extracted_metadata: z.array(z.object({ key: z.string().trim().min(1).max(100), value: z.string().trim().max(500) }).strict()).max(20),
  ...advisoryMeta,
}).strict();

export type TaskAnalysis = z.infer<typeof taskAnalysisSchema>;
export type FindingAnalysis = z.infer<typeof findingAnalysisSchema>;
export type RcaAssistance = z.infer<typeof rcaAssistanceSchema>;
export type CapaAssistance = z.infer<typeof capaAssistanceSchema>;
export type ManagementSummary = z.infer<typeof managementSummarySchema>;
export type EvidenceReview = z.infer<typeof evidenceReviewSchema>;
