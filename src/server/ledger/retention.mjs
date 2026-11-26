import { KernelError } from '../kernel/core.mjs';
// The operator supplies an already approved reference; this module neither
// chooses a period nor authorizes deletion or claims legal approval.
export function retentionPolicy(env=process.env) {
  const reference=env.AIGAS_LEDGER_RETENTION_POLICY_REF;
  if (typeof reference!=='string' || !/^[A-Za-z0-9_.:-]{1,120}$/.test(reference)) throw new KernelError(503,'LEDGER_RETENTION_POLICY_UNAVAILABLE','مرجع سياسة الاحتفاظ غير مهيأ؛ لم يُصدّر الدليل.');
  return reference;
}
