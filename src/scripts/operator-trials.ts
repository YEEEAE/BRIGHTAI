import { createWorkspaceAuth, getWorkspaceSession, appFetch } from './workspace-context';

// Operator console for the trial cycle. It is a client for the same server
// authorization used everywhere else: it can display state and send decisions,
// but it can never approve, activate or expire anything by itself. Activation
// remains refused until readiness exists for the exact release and environment.
const root = document.querySelector<HTMLElement>('[data-operator-trials]')!;
const state = root.querySelector<HTMLElement>('[data-op-state]')!;
const list = root.querySelector<HTMLElement>('[data-op-list]')!;
const refresh = root.querySelector<HTMLButtonElement>('[data-op-refresh]')!;
const authUrl = root.dataset.authUrl ?? '';
const labels: Record<string, string> = {
  REQUESTED: 'طلب مسجّل', ELIGIBILITY_REVIEW: 'قيد مراجعة الأهلية', APPROVED: 'معتمد — بانتظار التفعيل',
  ACTIVATED: 'مفعّل', EXPIRED: 'منتهٍ', CLOSED: 'مغلق', REJECTED: 'مرفوض', CANCELLED: 'ملغى',
};
const productNames: Record<string, string> = {
  firewall: 'Firewall', ledger: 'Ledger', 'human-gate': 'Human Gate', 'risk-engine': 'Risk Engine', 'secure-chat': 'Secure Chat',
};
const errorNames: Record<string, string> = {
  OPERATOR_REQUIRED: 'هذه القناة للمشغلين المعتمدين فقط.',
  ACTIVATION_READINESS_REQUIRED: 'التفعيل مغلق: لا توجد جاهزية حديثة لهذه المنتجات على نفس الإصدار والبيئة.',
  ACTIVATION_QUOTA_REQUIRED: 'التفعيل مغلق: لا توجد حصة معتمدة لهذه المنتجات.',
  ACTIVATION_CONTEXT_UNAVAILABLE: 'تعريف البيئة وإصدار الإصدار غير مهيأ على الخادم.',
  OPERATOR_SEPARATION_REQUIRED: 'لا يقرر مقدّم الطلب أو يفعّل تجربته؛ يلزم مشغّل مستقل.',
  TRIAL_STATE_CHANGED: 'تغيرت الحالة؛ حدّث القائمة قبل إعادة المحاولة.',
  TRIAL_WINDOW_NOT_DUE: 'لم تنتهِ نافذة التجربة بعد.',
};
const auth = authUrl ? createWorkspaceAuth(authUrl) : null;

function message(text: string, tone: 'ok' | 'warn' | 'bad' = 'warn') {
  state.textContent = text;
  state.dataset.tone = tone;
}
async function call(path: string, method = 'GET', body?: unknown) {
  if (!auth) throw Object.assign(new Error('لم يُهيأ الدخول على هذا التشغيل.'), { code: 'AUTH_SETUP_REQUIRED' });
  const session = await getWorkspaceSession(auth);
  const token = await auth.getJWTToken();
  if (session.error || !session.data?.user || !token) {
    throw Object.assign(new Error('سجّل الدخول من نواة المنظومة أولًا.'), { code: 'UNAUTHORIZED' });
  }
  const response = await appFetch(auth, path, {
    method,
    cache: 'no-store',
    headers: { Authorization: `Bearer ${token}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw Object.assign(new Error(data.message ?? 'تعذر تنفيذ الطلب.'), { code: data.code ?? `HTTP_${response.status}` });
  return data;
}
function cell(text: string, tag = 'span') {
  const element = document.createElement(tag);
  element.textContent = text;
  return element;
}
function action(label: string, run: () => Promise<unknown>, tone = '') {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = label;
  if (tone) button.dataset.tone = tone;
  button.addEventListener('click', async () => {
    button.disabled = true;
    message('جارٍ تنفيذ العملية…');
    try { const result: any = await run(); message(`تم الحفظ: ${result?.state ?? 'تم'}`, 'ok'); await load(); }
    catch (error: any) { message(errorNames[error.code] ?? error.message, 'bad'); }
    finally { button.disabled = false; }
  });
  return button;
}
function render(trials: any[]) {
  list.replaceChildren();
  if (!trials.length) { list.append(cell('لا توجد طلبات تجربة مسجلة.', 'p')); return; }
  for (const trial of trials) {
    const item = document.createElement('article');
    item.className = 'trial-row';
    const head = document.createElement('div');
    head.className = 'trial-head';
    const title = cell(`${labels[trial.state] ?? trial.state} — ${trial.products.map((slug: string) => productNames[slug] ?? slug).join('، ')}`, 'h3');
    head.append(title, cell(trial.tenantId, 'code'));
    const facts = document.createElement('ul');
    facts.className = 'trial-facts';
    for (const [label, value] of [
      ['الحالة', `${trial.state} (v${trial.version})`],
      ['النشر', trial.deploymentMode],
      ['البيانات', trial.dataMode],
      ['مقدّم الطلب', trial.requestedBy],
      ['القرار', trial.decidedBy ? `${trial.decisionSource} — ${trial.decidedBy}` : 'لا قرار'],
      ['التفعيل', trial.activatedAt ?? '—'],
      ['الانتهاء', trial.expiresAt ?? '—'],
      ['السبب', trial.reason ?? '—'],
    ]) { const li = document.createElement('li'); li.append(cell(label, 'b'), cell(String(value))); facts.append(li); }
    const reason = document.createElement('textarea');
    reason.rows = 2;
    reason.maxLength = 1000;
    reason.placeholder = 'سبب الرفض أو الإغلاق (10 أحرف على الأقل)';
    reason.setAttribute('aria-label', 'سبب القرار');
    const actions = document.createElement('div');
    actions.className = 'trial-actions';
    if (trial.state === 'ELIGIBILITY_REVIEW') {
      actions.append(
        action('اعتماد الأهلية', () => call(`/app/api/operator/trials/${trial.trialId}/decide`, 'POST', { decision: 'APPROVE' }), 'ok'),
        action('رفض', () => call(`/app/api/operator/trials/${trial.trialId}/decide`, 'POST', { decision: 'REJECT', reason: reason.value }), 'bad'),
      );
    }
    if (trial.state === 'APPROVED') {
      actions.append(action('محاولة تفعيل (تتطلب جاهزية معتمدة)', () => call(`/app/api/operator/trials/${trial.trialId}/activate`, 'POST', { customerAcknowledged: true }), 'warn'));
    }
    if (trial.state === 'ACTIVATED') {
      actions.append(action('تسجيل انتهاء النافذة', () => call(`/app/api/operator/trials/${trial.trialId}/expire`, 'POST')));
    }
    if (['EXPIRED', 'REJECTED', 'CANCELLED'].includes(trial.state)) {
      actions.append(action('إغلاق', () => call(`/app/api/operator/trials/${trial.trialId}/close`, 'POST', reason.value ? { reason: reason.value } : {})));
    }
    item.append(head, facts, reason, actions);
    list.append(item);
  }
}
async function load() {
  refresh.disabled = true;
  try {
    const data = await call('/app/api/operator/trials');
    message(`قناة المشغل معتمدة. التفعيل: ${data.activation === 'READY_CHECK_REQUIRED' ? 'يتطلب نتيجة جاهزية مطابقة' : 'غير قابل للتحقق على هذا التشغيل'}`, 'ok');
    render(data.trials ?? []);
  } catch (error: any) {
    message(errorNames[error.code] ?? error.message, 'bad');
    list.replaceChildren();
  } finally { refresh.disabled = false; }
}
refresh.addEventListener('click', load);
if (!auth) message('لم يُهيأ Neon Auth على هذا التشغيل؛ لا تظهر بيانات تجربة.', 'warn');
else load();
