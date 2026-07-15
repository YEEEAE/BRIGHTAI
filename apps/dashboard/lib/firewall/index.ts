/**
 * BrightAI AI Firewall — Layer 1 (PII Detection & Redaction) — Dashboard barrel.
 *
 * Re-exports the lightweight detector core from @brightai/firewall-detectors,
 * then wires the dashboard-specific NER detector (XLM-RoBERTa via
 * @huggingface/transformers) at module load. This keeps the marketing
 * site bundle free of ONNX/transformers (it imports the package directly
 * and never triggers this wiring).
 *
 * Consumers (app/api/firewall/chat/completions, app/api/firewall/redact,
 * tests/firewall/ner.test.ts, etc.) should import from this barrel
 * rather than reaching into subfolders.
 */

import { setNerDetector } from '@brightai/firewall-detectors';
import { nerDetect } from './detectors/ner';

// Wire NER into the shared detector at module load. Side effect:
// any subsequent detectAndRedact() call will use Arabic NER
// (Xenova/bert-base-multilingual-cased-ner-hrl) when policy.nerEnabled
// is true. Marketing site imports the package directly and never
// triggers this wiring → NER is never loaded there.
setNerDetector(nerDetect);

// Re-export the package API + dashboard-only NER symbols.
export * from '@brightai/firewall-detectors';
export { nerDetect, isNerReady, NER_MODEL_ID } from './detectors/ner';
