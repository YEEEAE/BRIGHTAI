import { transaction, setActorScope, setTenantScope } from './db.mjs';
import { explorationGrants, EXPLORATION_CAPABILITIES } from './exploration.mjs';
import { productNavigation } from '../../shared/product-navigation.mjs';
import { isUuid, KernelError } from './core.mjs';

const dependenciesUnavailable = () => new KernelError(503, 'TRIAL_DEPENDENCIES_UNAVAILABLE',
  'خدمة التجربة غير مهيأة حاليًا. يمكنك زيارة المختبرات العامة.', 'not configured');

async function withTrialActor(identity, tenantId, work) {
  if (tenantId !== null && !isUuid(tenantId)) {
    throw new KernelError(400, 'INVALID_WORKSPACE', 'حدد مساحة عمل صالحة.');
  }
  return transaction(async db => {
    const ready = (await db.query(`SELECT current_user='aigas_runtime'
      AND NOT rolsuper AND NOT rolbypassrls AS ready FROM pg_roles WHERE rolname=current_user`)).rows[0]?.ready;
    if (!ready) throw dependenciesUnavailable();
    await setActorScope(db, identity.userId);
    try {
      return await work(db);
    } catch (error) {
      if (error.code === '42501') {
        if (error.message === 'IDENTITY_NOT_VERIFIED') {
          throw new KernelError(403, 'IDENTITY_NOT_VERIFIED', 'وثّق بريدك بحساب نشط أولًا.');
        }
        if (['TRIAL_WORKSPACE_MISMATCH', 'TRIAL_MEMBERSHIP_REVOKED'].includes(error.message)) {
          throw new KernelError(403, 'TRIAL_WORKSPACE_UNAVAILABLE', 'مساحة التجربة غير متاحة لهذا الحساب.');
        }
        throw dependenciesUnavailable();
      }
      if (['55000', '42883', '42P01', '42703'].includes(error.code)) throw dependenciesUnavailable();
      throw error;
    }
  });
}

export function startTrial(identity, tenantId = null) {
  return withTrialActor(identity, tenantId, async db => {
    const { id } = (await db.query('SELECT public.aigas_start_self_service_trial($1) AS id', [tenantId])).rows[0];
    return { tenantId: id };
  });
}

export function trialHome(identity, tenantId = null) {
  return withTrialActor(identity, tenantId, async db => {
    const trial = (await db.query('SELECT * FROM public.aigas_read_self_service_trial($1)', [tenantId])).rows[0];
    const dependencies = (await db.query('SELECT * FROM public.aigas_self_service_dependencies()')).rows;
    const readyProducts = new Set(dependencies.filter(row => row.ready).map(row => row.product_slug));
    const kernelReady = readyProducts.has('kernel');
    const configured = kernelReady && productNavigation.every(product => readyProducts.has(product.slug));
    let grants = [];
    if (trial) {
      await setTenantScope(db, trial.tenant_id, identity.userId);
      grants = await explorationGrants(db, trial.tenant_id);
    }
    const remainingSeconds = trial?.status === 'ACTIVE'
      ? Math.max(0, Math.ceil((trial.expires_at - trial.server_time) / 1000))
      : 0;

    return {
      tenantId: trial?.tenant_id ?? null,
      status: trial?.status ?? (configured ? 'NOT_STARTED' : 'NOT_CONFIGURED'),
      startedAt: trial?.started_at ?? null,
      expiresAt: trial?.expires_at ?? null,
      serverTime: trial?.server_time ?? null,
      activationSource: trial?.activation_source ?? null,
      remainingSeconds,
      dataset: trial?.dataset ?? null,
      products: productNavigation.map(product => {
        const grant = grants.find(row => row.product_slug === product.slug);
        const ready = kernelReady && readyProducts.has(product.slug);
        const remaining = grant ? Math.max(0, grant.limit_units - grant.used) : 0;
        const readable = ready && trial?.status === 'ACTIVE' && grant?.active && remaining > 0;
        return {
          slug: product.slug, name: product.name, demo: product.publicPath + '#lab',
          status: !ready ? 'NOT_CONFIGURED' : readable ? 'READ_ONLY' : 'UNAVAILABLE',
          providerStatus: 'NOT_CONFIGURED',
          operations: readable ? EXPLORATION_CAPABILITIES[product.slug] : [],
          remaining,
        };
      }),
    };
  });
}

export async function openTrialProduct(identity, tenantId, slug) {
  const product = productNavigation.find(item => item.slug === slug);
  if (!product) throw new KernelError(400, 'INVALID_PRODUCT', 'اختر منتجًا صالحًا.');
  if (tenantId == null) throw new KernelError(400, 'INVALID_WORKSPACE', 'حدد مساحة التجربة أولًا.');
  const home = await trialHome(identity, tenantId);
  if (!home.products.some(item => item.slug === slug && item.status === 'READ_ONLY')) {
    throw new KernelError(403, 'TRIAL_UNAVAILABLE', 'هذا المنتج غير متاح في التجربة. يمكنك زيارة المختبر العام.');
  }
  return { href: `${product.workspacePath}?workspace=${encodeURIComponent(home.tenantId)}` };
}
