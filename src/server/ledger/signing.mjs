import { createPrivateKey, createPublicKey, sign, verify } from 'node:crypto';
import { KernelError } from '../kernel/core.mjs';

// A signature authenticates this exact export snapshot, not its historical
// creation time or the absence of a subsequently omitted tail.
export const SIGNED_FORMAT = 'aigas-ledger-signed-export-v1';
export function signingKey(env = process.env) {
  try {
    const id = env.AIGAS_LEDGER_SIGNING_KEY_ID;
    if (typeof id !== 'string' || !/^[A-Za-z0-9_.:-]{1,120}$/.test(id) || !env.AIGAS_LEDGER_SIGNING_PRIVATE_KEY) throw Error('missing key');
    const key = createPrivateKey(env.AIGAS_LEDGER_SIGNING_PRIVATE_KEY.replaceAll('\\n', '\n'));
    if (key.asymmetricKeyType !== 'ed25519') throw Error('unsupported key');
    return { id, key };
  } catch { throw new KernelError(503, 'LEDGER_SIGNING_UNAVAILABLE', 'مفتاح توقيع Ledger غير مهيأ؛ لم يُصدّر الدليل.'); }
}
export function signExport(bundle, config) {
  try {
    if (!config || !/^[A-Za-z0-9_.:-]{1,120}$/.test(config.id) || config.key?.asymmetricKeyType !== 'ed25519') throw Error('missing key');
    const payload = JSON.stringify({ format: SIGNED_FORMAT, key_id: config.id, bundle });
    const signature = sign(null, Buffer.from(payload), config.key).toString('base64');
    if (!verify(null, Buffer.from(payload), createPublicKey(config.key), Buffer.from(signature, 'base64'))) throw Error('signature failed');
    return { format: SIGNED_FORMAT, key_id: config.id, bundle, signature };
  } catch { throw new KernelError(503, 'LEDGER_SIGNING_UNAVAILABLE', 'تعذر توقيع التصدير؛ لم يُصدّر الدليل.'); }
}

export const EVENT_SIGNATURE_PROFILE = 'aigas-ledger-event-ed25519-v1';
export function eventSignaturePayload(event, keyId) {
  if (!event || !/^[0-9a-f]{64}$/.test(event.integrity_hash) || !/^[A-Za-z0-9_.:-]{1,120}$/.test(keyId)) throw Error('Invalid signature input');
  return JSON.stringify([EVENT_SIGNATURE_PROFILE, keyId, event.tenant_id, event.event_id, String(event.sequence_no), event.integrity_hash]);
}
export function signEvent(event, config = signingKey()) {
  const payload = eventSignaturePayload(event, config.id);
  const signature = sign(null, Buffer.from(payload), config.key).toString('base64');
  if (!verify(null, Buffer.from(payload), createPublicKey(config.key), Buffer.from(signature, 'base64'))) throw new KernelError(503,'LEDGER_SIGNING_UNAVAILABLE','تعذر توقيع الحدث.');
  return { key_id:config.id, signature };
}
export function verifyEventSignature(event, receipt, config) {
  try {
    if (!receipt || !config || receipt.key_id !== config.id || !/^[A-Za-z0-9+/]{86}==$/.test(receipt.signature)) return false;
    return verify(null, Buffer.from(eventSignaturePayload(event, receipt.key_id)), createPublicKey(config.key), Buffer.from(receipt.signature, 'base64'));
  } catch { return false; }
}
