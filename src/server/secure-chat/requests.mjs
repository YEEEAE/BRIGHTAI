import { transaction } from '../kernel/db.mjs';
import { assertReferenceTenant, requireProductAccess } from '../kernel/access.mjs';
import { audit } from '../kernel/service.mjs';
import { KernelError } from '../kernel/core.mjs';
import { INPUT_POLICY, usagePolicy } from './policy.mjs';

async function scope(db, identity, tenantId) {
  // requireProductAccess verifies membership and sets the unified transaction scope
  // (aigas.tenant_id / aigas.user_id). The sc_* GUCs below feed only the read-only
  // usage aggregate; they are not an authorization source and are set after the check.
  await requireProductAccess(db, identity, tenantId, 'secure-chat');
  await db.query("SELECT set_config('aigas.sc_tenant_id',$1,true),set_config('aigas.sc_user_id',$2,true)", [tenantId,identity.userId]);
}

function isUniqueViolation(error) {
  return error?.code === '23505';
}

export async function reserve(identity, tenantId, id, model) {
  return transaction(async db => {
    await scope(db, identity, tenantId);
    // A request UUID used by another tenant is a conflict, never a replay of
    // that tenant's request. This runs before the per-tenant row lookup.
    await assertReferenceTenant(db, tenantId, 'secure_chat_request', id);
    // Serialize all reservations for this tenant across workers/replicas.
    await db.query("SELECT pg_advisory_xact_lock(hashtextextended($1,0))", [`sc:${tenantId}`]);
    if ((await db.query('SELECT 1 FROM public.aigas_sc_cancellations WHERE tenant_id=$1 AND user_id=$2 AND request_id=$3',[tenantId,identity.userId,id])).rowCount) throw new KernelError(409,'REQUEST_CANCELLED','سُجل إلغاء هذا الطلب قبل الإرسال؛ لن يُرسل إلى المزود.');
    const old = (await db.query('SELECT state FROM public.aigas_sc_requests WHERE tenant_id=$1 AND user_id=$2 AND id=$3', [tenantId,identity.userId,id])).rows[0];
    if (old) throw new KernelError(409, 'REQUEST_ALREADY_SEEN', 'هذا الطلب مسجل مسبقًا ولن يُرسل مرة أخرى. قد يكون استهلاك المزود حدث؛ لا تُعد الإرسال تلقائيًا.');
    const policy = usagePolicy();
    if (policy) {
      // Deliberate tenant-wide aggregate; no content or per-employee usage is returned.
      // Runtime role needs this reviewed aggregate access; RLS must not hide peers.
      const row = (await db.query(`SELECT * FROM public.aigas_sc_usage_window_v2($1,$2)`, [tenantId,identity.userId])).rows[0];
      const comparisons = [[policy.userMinute,row.user_minute],[policy.tenantMinute,row.tenant_minute],[policy.userDay,row.user_day],[policy.tenantDay,row.tenant_day]];
      if (comparisons.some(([limit,count]) => limit && Number(count) >= limit) ||
          (policy.userTokensDay && Number(row.user_token_charge) + model.maxRequestTokens > policy.userTokensDay) ||
          (policy.tenantTokensDay && Number(row.tenant_token_charge) + model.maxRequestTokens > policy.tenantTokensDay)) {
        throw new KernelError(429, 'USAGE_LIMIT_REACHED', 'وصلت إلى حد الاستخدام المعتمد. انتظر تجدد الحصة؛ لا يوجد خصم أو ترقية تلقائية.');
      }
    }
    try {
      // The full approved request ceiling is reserved, not an imagined provider cost.
      await db.query(`INSERT INTO public.aigas_sc_requests(tenant_id,user_id,id,model_ref,policy_version,state,reserved_tokens) VALUES($1,$2,$3,$4,$5,'RESERVED',$6)`, [tenantId,identity.userId,id,model.id,INPUT_POLICY.version,model.maxRequestTokens]);
    } catch (error) {
      // Concurrent duplicate of the same client request id is not a second send.
      if (isUniqueViolation(error)) throw new KernelError(409, 'REQUEST_ALREADY_SEEN', 'هذا الطلب مسجل مسبقًا ولن يُرسل مرة أخرى. قد يكون استهلاك المزود حدث؛ لا تُعد الإرسال تلقائيًا.');
      throw error;
    }
    await audit(db,identity,tenantId,'secure_chat.request.reserved',{correlationId:id,policyVersion:INPUT_POLICY.version,idempotencyKey:`secure-chat:${id}:reserved`});
  });
}

export async function cancellationRequested(identity, tenantId, id) {
  return transaction(async db => {
    await scope(db,identity,tenantId);
    const row = (await db.query('SELECT cancel_requested FROM public.aigas_sc_requests WHERE tenant_id=$1 AND user_id=$2 AND id=$3', [tenantId,identity.userId,id])).rows[0];
    // A missing request row means the guard cannot confirm state: stop the call.
    return !row || row.cancel_requested;
  });
}

export async function cancel(identity, tenantId, id) {
  return transaction(async db => {
    await scope(db,identity,tenantId);
    await db.query("SELECT pg_advisory_xact_lock(hashtextextended($1,0))", [`sc:${tenantId}`]);
    const request = (await db.query('SELECT state,cancel_requested FROM public.aigas_sc_requests WHERE tenant_id=$1 AND user_id=$2 AND id=$3 FOR UPDATE', [tenantId,identity.userId,id])).rows[0] ?? null;
    if (request && ['SUCCEEDED','FAILED','CANCELLED','UNKNOWN'].includes(request.state)) {
      // Recording a late cancellation must not rewrite an already settled state.
      return { requestId:id, state:'ALREADY_FINISHED', cancellationRecorded:false, meteringPending:false,
        message:'اكتملت هذه العملية مسبقًا؛ لم يتغير سجل الاستهلاك. قد يكون المزود استهلك الطلب.' };
    }
    await db.query('INSERT INTO public.aigas_sc_cancellations(tenant_id,user_id,request_id) VALUES($1,$2,$3) ON CONFLICT DO NOTHING',[tenantId,identity.userId,id]);
    const row = (await db.query(`UPDATE public.aigas_sc_requests SET cancel_requested=true WHERE tenant_id=$1 AND user_id=$2 AND id=$3 AND state='RESERVED' RETURNING id`, [tenantId,identity.userId,id])).rows[0];
    if (row) await audit(db,identity,tenantId,'secure_chat.request.cancel_requested',{correlationId:id,policyVersion:INPUT_POLICY.version,idempotencyKey:`secure-chat:${id}:cancel-requested`});
    return { requestId:id, state:'CANCEL_PENDING', cancellationRecorded:true, meteringPending:true,
      message:'سُجل طلب الإيقاف إن كان الطلب قيد التنفيذ. قد يكون المزود عالج الطلب بالفعل؛ الإلغاء لا يؤكد انعدام الاستهلاك.' };
  });
}

export async function settle(identity, tenantId, id, state, usage) {
  if (!['SUCCEEDED','FAILED','CANCELLED','UNKNOWN'].includes(state)) throw new KernelError(503,'SETTLEMENT_STATE_INVALID','تعذر تسوية الطلب؛ لم يُعلن نجاح.');
  return transaction(async db => {
    await scope(db,identity,tenantId);
    const row = (await db.query(`UPDATE public.aigas_sc_requests SET state=CASE WHEN cancel_requested THEN 'CANCELLED' ELSE $4 END,completed_at=now(),input_tokens=$5,output_tokens=$6,total_tokens=$7 WHERE tenant_id=$1 AND user_id=$2 AND id=$3 AND state='RESERVED' RETURNING state`, [tenantId,identity.userId,id,state,usage?.inputTokens ?? null,usage?.outputTokens ?? null,usage?.totalTokens ?? null])).rows[0];
    if (!row) throw new KernelError(503,'REQUEST_STATE_UNAVAILABLE','تعذر تأكيد نتيجة الطلب. لا تُعد إرساله تلقائيًا.');
    await audit(db,identity,tenantId,`secure_chat.request.${row.state.toLowerCase()}`,{correlationId:id,policyVersion:INPUT_POLICY.version,idempotencyKey:`secure-chat:${id}:settled:${row.state}`});
    return row.state;
  });
}

// Failure to record settlement must never be reported as a normal provider error.
// The RESERVED row keeps the full token ceiling counted, so quota stays conservative.
export async function settleUnknown(identity, tenantId, id, state, usage) {
  try { return await settle(identity, tenantId, id, state, usage); }
  catch {
    throw new KernelError(503,'SETTLEMENT_UNAVAILABLE','تعذر تسجيل نتيجة الطلب على الخادم. بقيت الحصة محجوزة احتياطًا؛ لا تُعد الإرسال تلقائيًا.');
  }
}
