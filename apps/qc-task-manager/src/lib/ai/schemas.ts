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

// ── Laboratory advisory features (controlled AI assistance layer) ────────────
// Every lab schema enforces the mandatory marking and advisory-only semantics:
// human_review_required is a literal true, and ai_generated is the fixed
// banner every response must carry (AI GENERATED — HUMAN REVIEW REQUIRED).
export const LAB_AI_MARKING = 'AI GENERATED — HUMAN REVIEW REQUIRED';
const labAdvisoryMeta = {
  ...advisoryMeta,
  ai_generated: z.literal(LAB_AI_MARKING),
};

export const labTestSummarySchema = z.object({
  summary: z.string().trim().min(1).max(2_000),
  key_points: z.array(z.string().trim().min(1).max(600)).max(15),
  notable_items: z.array(z.string().trim().min(1).max(600)).max(10),
  ...labAdvisoryMeta,
}).strict();
export const labEquipmentHistorySchema = z.object({
  summary: z.string().trim().min(1).max(2_000),
  key_events: z.array(z.string().trim().min(1).max(600)).max(15),
  calibration_note: z.string().trim().min(1).max(600),
  maintenance_notes: z.array(z.string().trim().min(1).max(600)).max(10),
  ...labAdvisoryMeta,
}).strict();
export const labDocumentChangesSchema = z.object({
  summary: z.string().trim().min(1).max(2_000),
  changes: z.array(z.string().trim().min(1).max(600)).max(20),
  review_attention: z.array(z.string().trim().min(1).max(600)).max(10),
  ...labAdvisoryMeta,
}).strict();
export const labMissingFieldsSchema = z.object({
  missing_fields: z.array(z.string().trim().min(1).max(600)).max(20),
  data_gaps: z.array(z.string().trim().min(1).max(600)).max(20),
  notes: z.string().trim().min(1).max(1_000),
  ...labAdvisoryMeta,
}).strict();
export const labReviewQuestionsSchema = z.object({
  questions: z.array(z.string().trim().min(1).max(600)).max(15),
  focus_areas: z.array(z.string().trim().min(1).max(600)).max(10),
  ...labAdvisoryMeta,
}).strict();
export const labSopComparisonSchema = z.object({
  alignment: z.enum(['aligned', 'partial', 'unclear', 'no_reference_content']),
  observations: z.array(z.string().trim().min(1).max(600)).max(15),
  discrepancies: z.array(z.string().trim().min(1).max(600)).max(15),
  criteria_basis: z.string().trim().min(1).max(1_000),
  ...labAdvisoryMeta,
}).strict();
export const labFailPatternsSchema = z.object({
  patterns: z.array(z.string().trim().min(1).max(600)).max(15),
  affected_areas: z.array(z.string().trim().min(1).max(600)).max(15),
  suggested_investigations: z.array(z.string().trim().min(1).max(600)).max(15),
  ...labAdvisoryMeta,
}).strict();
export const labRetestPatternsSchema = z.object({
  patterns: z.array(z.string().trim().min(1).max(600)).max(15),
  common_reasons: z.array(z.string().trim().min(1).max(600)).max(10),
  notes: z.string().trim().min(1).max(1_000),
  ...labAdvisoryMeta,
}).strict();
export const labDataQualitySummarySchema = z.object({
  summary: z.string().trim().min(1).max(2_000),
  by_category: z.array(z.object({ category: z.enum(['tests', 'equipment', 'documents', 'products']), findings: z.number().int().min(0), highlights: z.array(z.string().trim().min(1).max(300)).max(5) }).strict()).max(4),
  top_issues: z.array(z.string().trim().min(1).max(600)).max(15),
  ...labAdvisoryMeta,
}).strict();

export type LabTestSummaryAi = z.infer<typeof labTestSummarySchema>;
export type LabEquipmentHistoryAi = z.infer<typeof labEquipmentHistorySchema>;
export type LabDocumentChangesAi = z.infer<typeof labDocumentChangesSchema>;
export type LabMissingFieldsAi = z.infer<typeof labMissingFieldsSchema>;
export type LabReviewQuestionsAi = z.infer<typeof labReviewQuestionsSchema>;
export type LabSopComparisonAi = z.infer<typeof labSopComparisonSchema>;
export type LabFailPatternsAi = z.infer<typeof labFailPatternsSchema>;
export type LabRetestPatternsAi = z.infer<typeof labRetestPatternsSchema>;
export type LabDataQualitySummaryAi = z.infer<typeof labDataQualitySummarySchema>;

export type TaskAnalysis = z.infer<typeof taskAnalysisSchema>;
export type FindingAnalysis = z.infer<typeof findingAnalysisSchema>;
export type RcaAssistance = z.infer<typeof rcaAssistanceSchema>;
export type CapaAssistance = z.infer<typeof capaAssistanceSchema>;
export type ManagementSummary = z.infer<typeof managementSummarySchema>;
export type EvidenceReview = z.infer<typeof evidenceReviewSchema>;
