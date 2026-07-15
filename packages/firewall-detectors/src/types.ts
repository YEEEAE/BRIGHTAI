/**
 * BrightAI AI Firewall — Layer 1 (PII Detection & Redaction)
 *
 * Core types shared across detectors, engine, and API routes.
 *
 * Detector model:
 *   - Regex detectors run on every request — cheap, deterministic.
 *   - NER detector (Arabic names) is lazy-loaded, opt-in via NER_ENABLED.
 *
 * Action model:
 *   - redact:   replace with [REDACTED:TYPE] (lossy, default-safe)
 *   - mask:     partial display (e.g. 1********0) — useful when LLM needs context
 *   - tokenize: reversible via HMAC token + org-scoped vault
 *   - block:    abort request with HTTP 451 (Unavailable For Legal Reasons)
 *
 * Confidence: 0..1 float. Regex hits are 0.7-1.0; NER hits are 0.5-0.95.
 *
 * Saudi specificity:
 *   - SAUDI_ID: 10 digits starting with 1 (citizen) or 2 (citizen, born 2000+)
 *   - IQAMA:    10 digits starting with 3-8 (resident)
 *   - SAUDI_IBAN: SA + 22 alphanumeric
 *   - SAUDI_PHONE: +966 5X XXX XXXX or 05XXXXXXXX
 *   - NATIONAL_ADDRESS: 8 digits (short) + 4 + 4 (full)
 *   - COMMERCIAL_REGISTRATION: 10 digits prefixed by CR/cr
 */

export type PIIType =
  | 'SAUDI_ID'
  | 'IQAMA'
  | 'SAUDI_IBAN'
  | 'SAUDI_PHONE'
  | 'EMAIL'
  | 'SAUDI_PLATE'
  | 'NATIONAL_ADDRESS'
  | 'COMMERCIAL_REGISTRATION'
  | 'BIRTH_DATE_GREGORIAN'
  | 'BIRTH_DATE_HIJRI'
  | 'CARD_OR_ACCOUNT'
  | 'PATIENT_ID'
  | 'CREDENTIAL'
  | 'PERSON_NAME';

export type Action = 'redact' | 'mask' | 'tokenize' | 'block';

export type DetectorKind = 'regex' | 'ner';

export interface Detection {
  type: PIIType;
  /** UTF-16 start offset (inclusive) — matches OpenAI/JS string indexing. */
  start: number;
  /** UTF-16 end offset (exclusive). */
  end: number;
  /** Raw substring that was detected. */
  value: string;
  /** Confidence 0..1. Regex hits tend to 0.7-1.0; NER hits 0.5-0.95. */
  confidence: number;
  detector: DetectorKind;
}

/** Per-PII-type action config. Defaults to `mask` if unspecified. */
export type PolicyConfig = {
  actions: Partial<Record<PIIType, Action>>;
  /** If true, any `block` action in a detection set short-circuits the request. */
  blockOnCritical: boolean;
  /** Toggle the Arabic NER (XLM-RoBERTa). Off in Phase 1a, on in 1b. */
  nerEnabled: boolean;
};

export const DEFAULT_POLICY: PolicyConfig = {
  actions: {
    CREDENTIAL: 'block',
    PATIENT_ID: 'redact',
    SAUDI_ID: 'mask',
    IQAMA: 'mask',
    SAUDI_IBAN: 'mask',
    SAUDI_PHONE: 'mask',
    EMAIL: 'mask',
    NATIONAL_ADDRESS: 'mask',
    COMMERCIAL_REGISTRATION: 'mask',
    BIRTH_DATE_GREGORIAN: 'mask',
    BIRTH_DATE_HIJRI: 'mask',
    CARD_OR_ACCOUNT: 'mask',
    SAUDI_PLATE: 'mask',
    PERSON_NAME: 'mask',
  },
  blockOnCritical: true,
  nerEnabled: false,
};

export interface FirewallContext {
  organizationId: string;
  userId: string | null;
  policy: PolicyConfig;
  /** Correlation id — copied to audit log and response headers. */
  requestId: string;
}

export interface RedactionResult {
  redactedText: string;
  detections: Detection[];
  /** Map from token to original value (tokenize action only). Never logged. */
  tokens: Record<string, string>;
  /** True if any detection had action=block and blockOnCritical is on. */
  blocked: boolean;
  /** Wall-clock latency of detection + action in ms. */
  latencyMs: number;
}
