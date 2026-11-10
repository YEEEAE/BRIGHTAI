import { randomUUID } from 'node:crypto';
import { transaction, setActorScope } from './db.mjs';
import { env } from './env.mjs';
import { KernelError, isUuid, requireRole, products } from './core.mjs';
import { canTransitionTrial, TRIAL_DATA_MODE } from './trial.mjs';
import { tenantGuard, audit } from './service.mjs';

// Server-side trial cycle for P06-A. Request, review, approval and activation are
// separate steps with separate actors: a tenant request never approves itself, an
// approval never starts the clock, and activation needs an operator identity, a
// verified release/environment, fresh product readiness and an approved quota.
// Nothing here creates a payment, invoice, renewal or automatic conversion.

const PRODUCT_SLUGS = products.map(product => product.slug);
const DEPLOYMENT_MODES = ['SAAS', 'ON_PREMISE', 'AIR_GAPPED'];
const ENVIRONMENTS = ['local', 'staging', 'production'];
const RELEASE_SHA = /^[0-9a-f]{7,40}$/;

function invalid(code, message) {
  return new KernelError(400, code, message);
}

function trialId(value) {
  if (!isUuid(value)) throw new KernelError(400, 'INVALID_TRIAL', 'معرّف التجربة غير صالح.');
  return value;
}

function trialProducts(value) {
  if (!Array.isArray(value) || value.length < 1 || value.length > 5) {
    throw invalid('INVALID_TRIAL_SCOPE', 'اختر منتجًا واحدًا على الأقل من المنتجات المتاحة (خمسة كحد أقصى).');
  }
  const unique = [...new Set(value)];
  if (unique.length !== value.length || unique.some(slug => !PRODUCT_SLUGS.includes(slug))) {
    throw invalid('INVALID_TRIAL_SCOPE', 'قائمة المنتجات تحتوي عنصرًا مكررًا أو غير معروف.');
  }
  return unique;
}

function trialGoal(value) {
  const goal = typeof value === 'string' ? value.trim() : '';
  if (goal.length < 20 || goal.length > 1000) {
    throw invalid('INVALID_TRIAL_GOAL', 'اكتب هدف التقييم بين 20 و1000 حرف.');
  }
  return goal;
}

function trialReason(value, code) {
  const reason = typeof value === 'string' ? value.trim() : '';
  if (reason.length < 10 || reason.length > 1000) {
    throw invalid(code, 'اكتب سببًا واضحًا من 10 إلى 1000 حرف.');
  }
  return reason;
}

function activationContext() {
  const environment = (env('AIGAS_ENVIRONMENT') ?? '').trim().toLowerCase();
  const releaseSha = (env('AIGAS_RELEASE_SHA') ?? env('RENDER_GIT_COMMIT') ?? '').trim().toLowerCase();
  if (!ENVIRONMENTS.includes(environment) || !RELEASE_SHA.test(releaseSha)) return null;
  return { environment, releaseSha };
}

async function appendEvent(db, { trialId: id, tenantId, from, to, actorSource, actorUserId, reason = null }) {
  await db.query(`INSERT INTO public.aigas_trial_events
    (id,trial_id,tenant_id,from_state,to_state,actor_user_id,actor_source,reason)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8)`,
    [randomUUID(), id, tenantId, from, to, actorUserId, actorSource, reason]);
}

async function requestScope(db, identity, requested) {
  const scope = await tenantGuard(identity, requested, db);
  if (!scope.tenant) throw new KernelError(403, 'NO_WORKSPACE', 'أنشئ مساحة عمل من Kernel أولًا.');
  const member = (await db.query('SELECT role FROM public.aigas_lock_member($1,$2)', [scope.tenant.tenant_id, identity.userId])).rows[0];
  requireRole(member, ['OWNER', 'ADMIN']);
  return { ...scope.tenant, role: member.role };
}

// Metering is a product operation, so any active member may consume; it never
// changes a trial decision and never crosses the tenant.
async function memberScope(db, identity, requested) {
  const scope = await tenantGuard(identity, requested, db);
  if (!scope.tenant) throw new KernelError(403, 'NO_WORKSPACE', 'أنشئ مساحة عمل من Kernel أولًا.');
  const member = (await db.query('SELECT role FROM public.aigas_lock_member($1,$2)', [scope.tenant.tenant_id, identity.userId])).rows[0];
  requireRole(member, ['OWNER', 'ADMIN', 'MEMBER']);
  return { ...scope.tenant, role: member.role };
}

// Operator identity comes from an owner-provisioned row, never from a token claim,
// an email pattern, a request parameter or a UI toggle.
async function operatorScope(db, identity) {
  await setActorScope(db, identity.userId);
  const row = (await db.query(`SELECT status FROM public.aigas_trial_operators
    WHERE user_id=$1 AND status='ACTIVE'`, [identity.userId])).rows[0];
  if (!row) throw new KernelError(403, 'OPERATOR_REQUIRED', 'هذه القناة للمشغلين المعتمدين فقط.');
  return true;
}

async function loadTrial(db, id) {
  return (await db.query(`SELECT id,tenant_id,requested_by,requested_products,deployment_mode,data_mode,
    state,decision_source,decided_by,decided_at,activated_at,expires_at,closed_at,reason,version
    FROM public.aigas_trial_requests WHERE id=$1 FOR UPDATE`, [id])).rows[0] ?? null;
}

function transition(row, to, context) {
  const decision = canTransitionTrial(row.state, to, context);
  if (!decision.allowed) throw new KernelError(409, decision.code, 'لا يمكن تنفيذ هذا الانتقال في الحالة الحالية للتجربة.');
}

// The tenant functions raise SQLSTATE for a refused transition; map them to the
// shared contract instead of leaking a driver code as DB_UNAVAILABLE.
function tenantTransitionError(error) {
  if (error?.code === 'P0001') return new KernelError(409, 'TRANSITION_NOT_ALLOWED', 'لا يمكن تنفيذ هذا الانتقال في الحالة الحالية للتجربة.');
  if (error?.code === '22023') return new KernelError(400, 'TRIAL_REASON_REQUIRED', 'اكتب سببًا واضحًا من 10 إلى 1000 حرف.');
  if (error?.code === '42501') return new KernelError(403, 'FORBIDDEN', 'صلاحياتك لا تسمح بهذه العملية.');
  return error;
}
async function tenantTransition(db, tenantId, id, to, reason) {
  try {
    return (await db.query('SELECT from_state,state,version FROM public.aigas_trial_tenant_transition($1,$2,$3,$4)',
      [id, tenantId, to, reason])).rows[0] ?? null;
  } catch (error) {
    throw tenantTransitionError(error);
  }
}

export async function operatorState(identity) {
  return transaction(async db => {
    await setActorScope(db, identity.userId);
    const row = (await db.query("SELECT 1 FROM public.aigas_trial_operators WHERE user_id=$1 AND status='ACTIVE'", [identity.userId])).rowCount;
    return { operator: row === 1 };
  });
}

// P06-A tenant path: create and review. It cannot approve or activate.
export async function requestTrial(identity, requested, body) {
  const entries = Object.keys(body ?? {});
  if (entries.some(key => !['products', 'deploymentMode', 'businessGoal', 'dataMode'].includes(key))) {
    throw invalid('INVALID_BODY', 'يحتوي الطلب حقولًا غير مسموحة.');
  }
  const requestedProducts = trialProducts(body?.products);
  if (!DEPLOYMENT_MODES.includes(body?.deploymentMode)) {
    throw invalid('INVALID_DEPLOYMENT_MODE', 'اختر نوع النشر: SaaS أو On-Premise أو Air-Gapped.');
  }
  const businessGoal = trialGoal(body?.businessGoal);
  if (body?.dataMode != null && body.dataMode !== TRIAL_DATA_MODE) {
    throw new KernelError(400, 'SYNTHETIC_DATA_ONLY', 'التجربة ببيانات اصطناعية فقط؛ البيانات الحقيقية تحتاج موافقة مكتوبة وبيئة معتمدة.');
  }
  return transaction(async db => {
    const tenant = await requestScope(db, identity, requested);
    const id = randomUUID();
    await db.query('SAVEPOINT trial_request_insert');
    try {
      const inserted = await db.query(`INSERT INTO public.aigas_trial_requests
        (id,tenant_id,requested_by,requested_products,deployment_mode,data_mode,business_goal,state)
        VALUES($1,$2,$3,$4,$5,'SYNTHETIC',$6,'REQUESTED') RETURNING id,state,version`,
        [id, tenant.tenant_id, identity.userId, requestedProducts, body.deploymentMode, businessGoal]);
      await appendEvent(db, { trialId: id, tenantId: tenant.tenant_id, from: 'REQUESTED', to: 'REQUESTED', actorSource: 'TENANT', actorUserId: identity.userId });
      await audit(db, identity, tenant.tenant_id, 'trial.request.created');
      return { persisted: true, trialId: inserted.rows[0].id, state: inserted.rows[0].state, version: inserted.rows[0].version, activationClosed: true };
    } catch (error) {
      if (error?.code !== '23505') throw error;
      // One open evaluation per tenant (0023 partial unique index). A duplicate
      // submit returns the open record instead of creating a second trial.
      await db.query('ROLLBACK TO SAVEPOINT trial_request_insert');
      const open = (await db.query(`SELECT id,state FROM public.aigas_trial_requests
        WHERE tenant_id=$1 AND state IN ('REQUESTED','ELIGIBILITY_REVIEW','APPROVED','ACTIVATED')
        ORDER BY created_at DESC LIMIT 1`, [tenant.tenant_id])).rows[0];
      throw new KernelError(409, 'TRIAL_ALREADY_OPEN', open
        ? 'توجد تجربة مفتوحة لهذه المؤسسة؛ أكملها أو ألغِها قبل طلب جديد.'
        : 'تعذر إنشاء الطلب بسبب طلب متزامن؛ حدّث الصفحة قبل إعادة المحاولة.');
    }
  });
}

export async function submitTrial(identity, requested, trial, body = {}) {
  if (Object.keys(body ?? {}).length) throw invalid('INVALID_BODY', 'لا يقبل هذا الطلب حقولًا.');
  trialId(trial);
  return transaction(async db => {
    const tenant = await requestScope(db, identity, requested);
    const result = await tenantTransition(db, tenant.tenant_id, trial, 'ELIGIBILITY_REVIEW', null);
    if (!result) throw new KernelError(404, 'TRIAL_NOT_FOUND', 'لا توجد تجربة بهذا المعرّف في مؤسستك.');
    await appendEvent(db, { trialId: trial, tenantId: tenant.tenant_id, from: result.from_state, to: 'ELIGIBILITY_REVIEW', actorSource: 'TENANT', actorUserId: identity.userId });
    await audit(db, identity, tenant.tenant_id, 'trial.request.submitted');
    return { persisted: true, trialId: trial, state: result.state, version: result.version };
  });
}

export async function cancelTrial(identity, requested, trial, body = {}) {
  if (Object.keys(body ?? {}).some(key => key !== 'reason')) throw invalid('INVALID_BODY', 'يحتوي الطلب حقولًا غير مسموحة.');
  trialId(trial);
  const reason = trialReason(body?.reason, 'TRIAL_REASON_REQUIRED');
  return transaction(async db => {
    const tenant = await requestScope(db, identity, requested);
    const result = await tenantTransition(db, tenant.tenant_id, trial, 'CANCELLED', reason);
    if (!result) throw new KernelError(404, 'TRIAL_NOT_FOUND', 'لا توجد تجربة بهذا المعرّف في مؤسستك.');
    await appendEvent(db, { trialId: trial, tenantId: tenant.tenant_id, from: result.from_state, to: 'CANCELLED', actorSource: 'TENANT', actorUserId: identity.userId, reason });
    await audit(db, identity, tenant.tenant_id, 'trial.request.cancelled');
    return { persisted: true, trialId: trial, state: result.state, version: result.version };
  });
}

export async function operatorListTrials(identity) {
  return transaction(async db => {
    await operatorScope(db, identity);
    const rows = (await db.query(`SELECT id,tenant_id,requested_by,requested_products,deployment_mode,data_mode,
      state,decision_source,decided_by,decided_at,activated_at,expires_at,closed_at,reason,version,created_at,updated_at
      FROM public.aigas_trial_requests ORDER BY created_at DESC,id DESC LIMIT 100`)).rows;
    return {
      operator: true,
      activation: activationContext() ? 'READY_CHECK_REQUIRED' : 'CONTEXT_UNAVAILABLE',
      trials: rows.map(row => ({
        trialId: row.id,
        tenantId: row.tenant_id,
        requestedBy: row.requested_by,
        products: row.requested_products,
        deploymentMode: row.deployment_mode,
        dataMode: row.data_mode,
        state: row.state,
        decisionSource: row.decision_source,
        decidedBy: row.decided_by,
        decidedAt: row.decided_at,
        activatedAt: row.activated_at,
        expiresAt: row.expires_at,
        closedAt: row.closed_at,
        reason: row.reason,
        version: row.version,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })),
    };
  });
}

export async function operatorDecideTrial(identity, trial, body = {}) {
  if (Object.keys(body ?? {}).some(key => !['decision', 'reason'].includes(key))) throw invalid('INVALID_BODY', 'يحتوي الطلب حقولًا غير مسموحة.');
  trialId(trial);
  const approve = body?.decision === 'APPROVE';
  if (!approve && body?.decision !== 'REJECT') throw invalid('INVALID_DECISION', 'اختر اعتمادًا أو رفضًا صريحًا.');
  const reason = approve ? null : trialReason(body?.reason, 'OPERATOR_REASON_REQUIRED');
  return transaction(async db => {
    await operatorScope(db, identity);
    const row = await loadTrial(db, trial);
    if (!row) throw new KernelError(404, 'TRIAL_NOT_FOUND', 'لا توجد تجربة بهذا المعرّف.');
    const to = approve ? 'APPROVED' : 'REJECTED';
    transition(row, to, { actor: 'OPERATOR', reason: reason ?? '' });
    if (row.requested_by === identity.userId) {
      throw new KernelError(409, 'OPERATOR_SEPARATION_REQUIRED', 'لا يقرر مقدّم الطلب أو تفعيله؛ يلزم مشغّل مستقل.');
    }
    const updated = await db.query(`UPDATE public.aigas_trial_requests
      SET state=$3, decision_source='OPERATOR', decided_by=$4, decided_at=now(),
        reason=COALESCE($5,reason), version=version+1
      WHERE id=$1 AND tenant_id=$2 AND state=$6 RETURNING state,version`,
      [row.id, row.tenant_id, to, identity.userId, reason, row.state]);
    if (!updated.rowCount) throw new KernelError(409, 'TRIAL_STATE_CHANGED', 'تغيرت حالة التجربة؛ حدّث الصفحة قبل إعادة المحاولة.');
    await appendEvent(db, { trialId: row.id, tenantId: row.tenant_id, from: row.state, to, actorSource: 'OPERATOR', actorUserId: identity.userId, reason: reason ?? 'ELIGIBILITY_APPROVED' });
    return { persisted: true, trialId: row.id, state: to, version: updated.rows[0].version };
  });
}

// P06-A closes activation on purpose. This path is implemented so the refusal is
// testable and so P06-B only has to add evidence rows, not new code paths.
export async function operatorActivateTrial(identity, trial, body = {}) {
  if (Object.keys(body ?? {}).some(key => !['customerAcknowledged'].includes(key))) throw invalid('INVALID_BODY', 'يحتوي الطلب حقولًا غير مسموحة.');
  trialId(trial);
  const context = activationContext();
  if (!context) throw new KernelError(503, 'ACTIVATION_CONTEXT_UNAVAILABLE', 'تعريف البيئة وإصدار الإصدار غير مهيأ؛ لا يمكن التحقق من الجاهزية.');
  if (body?.customerAcknowledged !== true) throw new KernelError(400, 'CUSTOMER_ACKNOWLEDGEMENT_REQUIRED', 'يلزم إقرار العميل الصريح بشروط التجربة والبيانات الاصطناعية.');
  return transaction(async db => {
    await operatorScope(db, identity);
    const row = await loadTrial(db, trial);
    if (!row) throw new KernelError(404, 'TRIAL_NOT_FOUND', 'لا توجد تجربة بهذا المعرّف.');
    transition(row, 'ACTIVATED', { actor: 'OPERATOR', readinessVerified: true, dataMode: row.data_mode, customerAcknowledged: true });
    if (row.requested_by === identity.userId) {
      throw new KernelError(409, 'OPERATOR_SEPARATION_REQUIRED', 'لا يفعّل مقدّم الطلب تجربته؛ يلزم مشغّل مستقل.');
    }
    await db.query("SELECT set_config('aigas.environment',$1,true),set_config('aigas.release_sha',$2,true)", [context.environment, context.releaseSha]);
    const gaps = (await db.query('SELECT kind,product_slug FROM public.aigas_trial_activation_gaps($1::text[])', [row.requested_products])).rows;
    if (gaps.some(gap => gap.kind === 'READINESS')) {
      throw new KernelError(409, 'ACTIVATION_READINESS_REQUIRED', 'التفعيل مغلق: لا توجد نتيجة جاهزية حديثة ناجحة لهذه المنتجات على نفس الإصدار والبيئة.');
    }
    if (gaps.some(gap => gap.kind === 'QUOTA')) {
      throw new KernelError(409, 'ACTIVATION_QUOTA_REQUIRED', 'التفعيل مغلق: لا توجد حصة معتمدة لهذه المنتجات.');
    }
    const updated = await db.query(`UPDATE public.aigas_trial_requests
      SET state='ACTIVATED', decision_source='OPERATOR', decided_by=$3, decided_at=now(),
        activated_at=now(), expires_at=now() + interval '48 hours', version=version+1
      WHERE id=$1 AND tenant_id=$2 AND state='APPROVED'
      RETURNING state,activated_at,expires_at,version`, [row.id, row.tenant_id, identity.userId]);
    if (!updated.rowCount) throw new KernelError(409, 'TRIAL_STATE_CHANGED', 'تغيرت حالة التجربة؛ حدّث الصفحة قبل إعادة المحاولة.');
    // Copy the window inside SQL: a JS Date round-trip truncates microseconds and
    // would make the entitlement differ from activated_at/expires_at.
    await db.query(`INSERT INTO public.aigas_trial_entitlements
      (trial_id,tenant_id,product_slug,entitlement_kind,status,starts_at,ends_at)
      SELECT r.id,r.tenant_id,unnest($3::text[]),'TRIAL','ACTIVE',r.activated_at,r.expires_at
      FROM public.aigas_trial_requests r WHERE r.id=$1 AND r.tenant_id=$2`,
      [row.id, row.tenant_id, row.requested_products]);
    const window = (await db.query('SELECT activated_at,expires_at,version FROM public.aigas_trial_requests WHERE id=$1', [row.id])).rows[0];
    await appendEvent(db, { trialId: row.id, tenantId: row.tenant_id, from: 'APPROVED', to: 'ACTIVATED', actorSource: 'OPERATOR', actorUserId: identity.userId, reason: 'ACTIVATED_AFTER_READINESS' });
    return {
      persisted: true,
      trialId: row.id,
      state: 'ACTIVATED',
      activatedAt: window.activated_at,
      expiresAt: window.expires_at,
      durationSeconds: 172800,
      version: window.version,
      products: row.requested_products,
      environment: context.environment,
      releaseSha: context.releaseSha,
    };
  });
}

export async function operatorExpireTrial(identity, trial) {
  trialId(trial);
  return transaction(async db => {
    await operatorScope(db, identity);
    const row = await loadTrial(db, trial);
    if (!row) throw new KernelError(404, 'TRIAL_NOT_FOUND', 'لا توجد تجربة بهذا المعرّف.');
    transition(row, 'EXPIRED', { actor: 'SYSTEM' });
    if (!row.expires_at || new Date(row.expires_at).getTime() > Date.now()) {
      throw new KernelError(409, 'TRIAL_WINDOW_NOT_DUE', 'لم تنتهِ نافذة التجربة بعد؛ لا تُنهى قبل موعدها.');
    }
    await db.query("UPDATE public.aigas_trial_entitlements SET status='EXPIRED' WHERE trial_id=$1 AND tenant_id=$2 AND status='ACTIVE'", [row.id, row.tenant_id]);
    const updated = await db.query(`UPDATE public.aigas_trial_requests
      SET state='EXPIRED', version=version+1 WHERE id=$1 AND state=$2 RETURNING state,version`,
      [row.id, row.state]);
    if (!updated.rowCount) throw new KernelError(409, 'TRIAL_STATE_CHANGED', 'تغيرت حالة التجربة؛ حدّث الصفحة قبل إعادة المحاولة.');
    await appendEvent(db, { trialId: row.id, tenantId: row.tenant_id, from: row.state, to: 'EXPIRED', actorSource: 'SYSTEM', actorUserId: null });
    return { persisted: true, trialId: row.id, state: 'EXPIRED', version: updated.rows[0].version };
  });
}

export async function operatorCloseTrial(identity, trial, body = {}) {
  if (Object.keys(body ?? {}).some(key => key !== 'reason')) throw invalid('INVALID_BODY', 'يحتوي الطلب حقولًا غير مسموحة.');
  trialId(trial);
  const reason = body?.reason == null ? null : trialReason(body.reason, 'TRIAL_REASON_REQUIRED');
  return transaction(async db => {
    await operatorScope(db, identity);
    const row = await loadTrial(db, trial);
    if (!row) throw new KernelError(404, 'TRIAL_NOT_FOUND', 'لا توجد تجربة بهذا المعرّف.');
    transition(row, 'CLOSED', { actor: 'OPERATOR', reason: reason ?? '' });
    const updated = await db.query(`UPDATE public.aigas_trial_requests
      SET state='CLOSED', closed_at=now(), reason=COALESCE($3,reason), version=version+1
      WHERE id=$1 AND state=$2 RETURNING state,version`, [row.id, row.state, reason]);
    if (!updated.rowCount) throw new KernelError(409, 'TRIAL_STATE_CHANGED', 'تغيرت حالة التجربة؛ حدّث الصفحة قبل إعادة المحاولة.');
    await appendEvent(db, { trialId: row.id, tenantId: row.tenant_id, from: row.state, to: 'CLOSED', actorSource: 'OPERATOR', actorUserId: identity.userId, reason: reason ?? 'CLOSED_BY_OPERATOR' });
    return { persisted: true, trialId: row.id, state: 'CLOSED', version: updated.rows[0].version };
  });
}

// Metering is fail-closed: with no approved profile the server refuses instead of
// treating a missing quota as unlimited. Product routes (P07–P11) call this.
export async function consumeTrialQuota(identity, requested, body = {}) {
  if (Object.keys(body ?? {}).some(key => !['trialId', 'product', 'units', 'idempotencyKey'].includes(key))) {
    throw invalid('INVALID_BODY', 'يحتوي الطلب حقولًا غير مسموحة.');
  }
  trialId(body?.trialId);
  if (!PRODUCT_SLUGS.includes(body?.product)) throw invalid('INVALID_PRODUCT', 'المنتج غير معروف.');
  if (!Number.isSafeInteger(body?.units) || body.units < 1 || body.units > 1_000_000) {
    throw invalid('INVALID_UNITS', 'عدد الوحدات غير صالح.');
  }
  const key = typeof body?.idempotencyKey === 'string' ? body.idempotencyKey.trim() : '';
  if (key.length < 8 || key.length > 120) throw invalid('INVALID_IDEMPOTENCY_KEY', 'مفتاح التكرار غير صالح.');
  return transaction(async db => {
    const tenant = await memberScope(db, identity, requested);
    const row = (await db.query(`SELECT allowed,reason,used,limit_units,remaining
      FROM public.aigas_trial_consume_quota($1,$2,$3,$4,$5)`,
      [body.trialId, tenant.tenant_id, body.product, body.units, key])).rows[0];
    return {
      allowed: row.allowed,
      reason: row.reason,
      used: Number(row.used),
      limitUnits: row.limit_units == null ? null : Number(row.limit_units),
      remaining: row.remaining == null ? null : Number(row.remaining),
      persisted: true,
    };
  });
}
