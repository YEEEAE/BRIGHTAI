import { KernelError } from './core.mjs';

// Fixed server-owned operations. No outgoing AI, writes or execution permits.
export const EXPLORATION_CAPABILITIES = Object.freeze({
 firewall: Object.freeze(['dashboard']),
 ledger: Object.freeze(['list']),
 'human-gate': Object.freeze(['list']),
 'risk-engine': Object.freeze(['list']),
 'secure-chat': Object.freeze(['browse']),
});
export async function explorationGrants(db, tenantId) {
 const exists=(await db.query("SELECT to_regclass('public.aigas_exploration_grants') IS NOT NULL AS ready")).rows[0]?.ready;
 if(!exists)return [];
 return (await db.query(`SELECT product_slug,starts_at,ends_at,limit_units,used,
 revoked_at IS NULL AND starts_at<=clock_timestamp() AND ends_at>clock_timestamp() AS active
 FROM public.aigas_exploration_grants WHERE tenant_id=$1`,[tenantId])).rows;
}
function denied(status,code,slug,message) {
 // Internal structured refusal record. No token, identity, tenant or content.
 process.stderr.write(`${JSON.stringify({event:'exploration.denied',product:slug,code,at:new Date().toISOString()})}\n`);
 throw new KernelError(status,code,message);
}
export async function requireExploration(db, tenantId, slug, operation) {
 const grants=await explorationGrants(db,tenantId);
 const grant=grants.find(row=>row.product_slug===slug);
 if(!grant)return false;
 if(!EXPLORATION_CAPABILITIES[slug]?.includes(operation))denied(403,'EXPLORATION_CAPABILITY_DENIED',slug,'منحة الاستكشاف تسمح بالتصفح فقط؛ هذه العملية تحتاج قرار إتاحة مستقل.');
 const result=(await db.query('SELECT allowed,reason FROM public.aigas_exploration_consume($1,$2)',[tenantId,slug])).rows[0];
 if(!result?.allowed)denied(result?.reason==='EXPLORATION_QUOTA_EXCEEDED'?429:403,result?.reason??'EXPLORATION_UNAVAILABLE',slug,'انتهت نافذة الاستكشاف أو حصتها؛ راجع مسؤول المؤسسة.');
 return true;
}
