import { KernelError } from '../kernel/core.mjs';
import { operate } from './service.mjs';
import { uuid } from './core.mjs';

// Read-only evidence analysis. Authorization and tenant selection remain in the
// Ledger service; this agent never accepts a tenant from an evidence record.
export function createLedgerAgent(service = operate) {
  return async function analyze(identity, workspace, eventId) {
    if (!identity?.userId || !uuid(eventId)) throw new KernelError(400, 'INVALID_EVIDENCE_REQUEST', 'طلب الدليل غير صالح.');
    const detail = await service(identity, workspace, 'detail', {}, new URLSearchParams(), eventId);
    const event = detail?.event;
    if (!event || event.event_id !== eventId) throw new KernelError(503, 'EVIDENCE_UNAVAILABLE', 'تعذر استرجاع الدليل.');
    // This describes only what the service established; no model creates or
    // alters hashes, evidence, verification results, or authorization decisions.
    return {
      event_id: event.event_id,
      source: event.source,
      event_type: event.event_type,
      policy_version: event.policy_version,
      created_at: event.created_at,
      metadata: event.metadata_json,
      integrity: detail.integrity,
      chain: detail.chain,
      state: detail.state === 'VERIFIED' && detail.assurance !== 'SIGNED_EVENTS' ? 'UNVERIFIED' : detail.state,
      prefix_state: detail.state,
      mismatch: detail.mismatch,
      reasons: detail.state === 'VERIFIED' && detail.assurance !== 'SIGNED_EVENTS' ? [...(detail.reasons ?? []), 'SIGNATURE_NOT_VERIFIED'] : detail.reasons,
      assurance: detail.assurance,
      interpretation: detail.state === 'VERIFIED' && detail.assurance === 'SIGNED_EVENTS'
        ? 'تطابقت التوقيعات وسلسلة البادئة المفحوصة؛ لا يثبت ذلك اكتمال ذيل السجل.'
        : detail.state === 'VERIFIED' ? 'تطابق البصمة لا يثبت التوقيع أو اكتمال السجل.'
        : 'لم تثبت سلامة الدليل ضمن النطاق المفحوص.',
    };
  };
}

export const analyzeLedgerEvidence = createLedgerAgent();
