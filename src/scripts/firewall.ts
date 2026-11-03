import { createWorkspaceAuth as createAuthClient, getWorkspaceSession, appFetch, setWorkspace } from './workspace-context';

const root = document.querySelector<HTMLElement>('[data-firewall]')!;
const status = root.querySelector<HTMLElement>('[data-status]')!;
const privateArea = root.querySelector<HTMLElement>('[data-private]')!;
const workspace = root.querySelector<HTMLSelectElement>('[data-workspace]')!;
const actionFilter = root.querySelector<HTMLSelectElement>('[data-filter]')!;
const reasonFilter = root.querySelector<HTMLSelectElement>('[data-reason]')!;
const modeFilter = root.querySelector<HTMLSelectElement>('[data-log-mode]')!;
const fromFilter = root.querySelector<HTMLInputElement>('[data-from]')!;
const toFilter = root.querySelector<HTMLInputElement>('[data-to]')!;
const evalMode = root.querySelector<HTMLSelectElement>('[data-eval-mode]')!;
const previousPage = root.querySelector<HTMLButtonElement>('[data-prev]')!;
const nextPage = root.querySelector<HTMLButtonElement>('[data-next]')!;
const text = root.querySelector<HTMLTextAreaElement>('textarea')!;
const ack = root.querySelector<HTMLInputElement>('[data-synthetic]')!;
const evalSubmit = root.querySelector<HTMLButtonElement>('[data-eval-submit]')!;
const evalError = root.querySelector<HTMLElement>('[data-eval-error]')!;
const result = root.querySelector<HTMLElement>('[data-result]')!;
const setupPanel = root.querySelector<HTMLElement>('[data-setup-panel]')!;
const setupMessage = root.querySelector<HTMLElement>('[data-setup-message]')!;
const reasonLabels: Record<string, string> = {
  NO_ACTIVE_POLICY: 'لا توجد قاعدة مفعّلة؛ حجب آمن.',
  INVALID_POLICY: 'قاعدة محفوظة غير صالحة؛ حجب آمن.',
  RULE_DENY: 'طابق النص قاعدة حجب.',
  RULE_ESCALATE: 'تصعيد للموافقة البشرية؛ لا مسار موافقة مفعّل.',
  RULE_REDACT: 'نُقّح النص وفق قاعدة تنقيح.',
  RULE_WARN: 'تحذير سياسة؛ لا يمرر تلقائيًا.',
  RULE_ALLOW: 'طابق النص قاعدة سماح.',
  NO_MATCH_LAB_ONLY: 'لم يطابق أي قاعدة؛ ليس إثبات سلامة المحتوى.',
  NO_MATCH_ENFORCED: 'حُجب التنفيذ؛ لا قاعدة سماح أو تنقيح مطابقة.',
  KERNEL_POLICY_DENIED: 'منعت سياسة Kernel العليا التنفيذ؛ لا تخففها قواعد المنتج.',
};
const setupCodes = ['FIREWALL_SCHEMA_MISSING', 'FIREWALL_SCHEMA_OUTDATED', 'FIREWALL_DB_PRIVILEGE', 'KERNEL_ADMIN_SETUP_REQUIRED'];
const riyadhTime = (value: string) => new Date(value).toLocaleString('ar-SA', { timeZone: 'Asia/Riyadh' });
const executionLabel = (data: any) => {
  if (data.external_action_executed === true) return 'نُفذ الطلب خارجيًا عبر المزود المعتمد.';
  if (data.external_action_executed === null) return 'حالة الإرسال غير مؤكدة؛ قد يكون الطلب وصل المزود. لا تعِد الإرسال تلقائيًا.';
  return 'لم يُنفذ أي إجراء خارجي.';
};
const auth = root.dataset.authUrl ? createAuthClient(root.dataset.authUrl) : null;
let busy = false;
let page = 1, hasNext = false, providerConfigured = false;
let viewEpoch = 0;

class ApiError extends Error { code: string; constructor(message: string, code = '') { super(message); this.code = code; } }
const field = <T extends keyof HTMLElementTagNameMap>(tag: T, className = '') => { const node = document.createElement(tag); if (className) node.className = className; return node; };
const messageOf = (error: unknown) => error instanceof Error && error.message ? error.message : 'تعذر إكمال الطلب.';
function note(message: string, failed = false) { status.textContent = message; status.dataset.state = failed ? 'error' : 'ok'; }
function lockControls(locked: boolean) {
  root.querySelectorAll<HTMLButtonElement | HTMLSelectElement | HTMLInputElement | HTMLTextAreaElement>('button,select,input,textarea').forEach(node => { node.disabled = locked; });
  if (!locked) {
    evalSubmit.disabled = !ack.checked;
    previousPage.disabled = page <= 1;
    nextPage.disabled = !hasNext;
    root.querySelectorAll<HTMLButtonElement>('[data-template]').forEach(button => { button.disabled = button.dataset.exists === 'true' || button.dataset.limit === 'true'; });
    const createSubmit = root.querySelector<HTMLButtonElement>('[data-create-rule] button[type=submit]');
    if (createSubmit) createSubmit.disabled = createSubmit.dataset.limit === 'true';
  }
}
async function withBusy(task: () => Promise<void>) {
  if (busy) throw new ApiError('هناك طلب جارٍ؛ انتظر نتيجته قبل تنفيذ عملية أخرى.', 'BUSY');
  busy = true; root.setAttribute('aria-busy', 'true'); lockControls(true); note('جارٍ معالجة الطلب من الخادم…');
  try { await task(); }
  finally { busy = false; root.removeAttribute('aria-busy'); lockControls(false); }
}
function clearPrivate() {
  viewEpoch++;
  privateArea.hidden = true; setupPanel.hidden = true; setupMessage.textContent = ''; text.value = ''; ack.checked = false; evalError.textContent = ''; result.textContent = ''; delete result.dataset.state;
  root.querySelector('[data-rules]')!.replaceChildren();
  root.querySelector('[data-decisions]')!.replaceChildren();
  (root.querySelector('[data-empty-rules]') as HTMLElement).hidden = true;
  root.querySelector('[data-create-rule]')!.setAttribute('hidden', '');
  root.querySelector('[data-templates]')!.setAttribute('hidden', '');
  workspace.replaceChildren();
  root.querySelector('[data-scope]')!.textContent = '';
  root.querySelector('[data-provider]')!.textContent = '';
  createForm.reset(); createError.textContent = '';
  page = 1; hasNext = false; providerConfigured = false;
  evalMode.value = 'LAB'; updateSubmitLabel();
  root.querySelector('[data-rule-count]')!.textContent = '0';
  root.querySelectorAll('[data-count]').forEach(node => { node.textContent = '—'; });
  lockControls(false);
}
async function api(path: string, method = 'GET', body?: object) {
  const epoch = viewEpoch;
  if (!auth) throw new ApiError('يلزم إعداد الدخول.', 'AUTH_SETUP');
  const session = await getWorkspaceSession(auth);
  const token = await auth.getJWTToken();
  if (session.error || !session.data?.user || !token) throw new ApiError('يلزم تسجيل الدخول عبر Kernel. تحقق أيضًا من إعداد الأصل الموثوق.', 'AUTH_REQUIRED');
  const params = new URLSearchParams();
  if (workspace.value) params.set('workspace', workspace.value);
  if (actionFilter.value) params.set('action', actionFilter.value);
  if (reasonFilter.value) params.set('reason', reasonFilter.value);
  if (modeFilter.value) params.set('mode', modeFilter.value);
  if (fromFilter.value) params.set('from', fromFilter.value);
  if (toFilter.value) params.set('to', toFilter.value);
  params.set('page', String(page));
  const response = await appFetch(auth!, `/app/api/firewall/${path}/?${params}`, {
    method, cache: 'no-store',
    headers: { Authorization: `Bearer ${token}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  let data: any = null;
  try { data = await response.json(); } catch { /* non-JSON failures are reported generically below */ }
  if (epoch !== viewEpoch) throw new ApiError('تغيرت الجلسة؛ أعد تحميل المؤسسة.', 'SESSION_CHANGED');
  if (path === 'guarded-executions' && data?.persisted === true && data?.decision?.id) return data;
  if (!response.ok && ['FORBIDDEN', 'NO_WORKSPACE', 'PRODUCT_NOT_ENABLED'].includes(data?.code)) clearPrivate();
  if (!response.ok) throw new ApiError(data?.message || 'تعذر إكمال الطلب.', data?.code ?? '');
  return data;
}
function actionBadge(action: string) {
  const badge = field('span', `fw-tag fw-${action.toLowerCase()}`);
  badge.textContent = action;
  return badge;
}
function ruleCard(rule: any, canManage: boolean, reload: () => Promise<void>, notify: (text: string, failed?: boolean) => void) {
  const card = field('article', 'fw-rule');
  const head = field('div', 'fw-rule-head');
  const heading = field('h3'); heading.textContent = rule.name;
  head.append(heading, actionBadge(rule.action));
  const meta = field('p', 'fw-rule-meta');
  meta.textContent = `${rule.enabled ? 'مفعّلة' : 'معطّلة'} · الأولوية ${rule.priority} · النسخة ${rule.version}${rule.template ? ' · قالب جاهز' : ''}`;
  const pattern = field('p', 'fw-pattern');
  pattern.append(document.createTextNode('النمط الحرفي: '));
  const literal = field('bdi'); literal.textContent = rule.pattern;
  pattern.append(literal);
  card.append(head, meta, pattern);
  if (!canManage) return card;

  const actions = field('div', 'fw-rule-actions');
  const toggle = field('button'); toggle.type = 'button'; toggle.textContent = rule.enabled ? 'تعطيل' : 'تفعيل';
  toggle.addEventListener('click', () => { void (async () => {
    try {
      await withBusy(async () => { await api('rules', 'PATCH', { id: rule.id, version: rule.version, enabled: !rule.enabled }); await reload(); });
      notify(rule.enabled ? 'عُطّلت القاعدة وحُفظ التغيير في الخادم.' : 'فُعّلت القاعدة وحُفظ التغيير في الخادم.');
    } catch (error) { notify(messageOf(error), true); }
  })(); });
  const copy = field('button'); copy.type = 'button'; copy.textContent = 'نسخ';
  copy.addEventListener('click', () => { void (async () => {
    try {
      await withBusy(async () => { await api('rules', 'POST', { duplicate_of: rule.id }); await reload(); });
      notify('نُسخت القاعدة كقاعدة مخصصة جديدة ومعطّلة حتى تراجعها.');
    } catch (error) { notify(messageOf(error), true); }
  })(); });
  const remove = field('button', 'fw-danger'); remove.type = 'button'; remove.textContent = 'حذف';
  remove.addEventListener('click', () => {
    if (!window.confirm(`حذف القاعدة «${rule.name}»؟ لا يمكن التراجع. إذا كانت مذكورة في قرارات محفوظة سيرفض الخادم الحذف ويقترح تعطيلها.`)) return;
    void (async () => {
      try {
        await withBusy(async () => { await api('rules', 'DELETE', { id: rule.id, version: rule.version }); await reload(); });
        notify('حُذفت القاعدة من الخادم بعد التأكد من عدم ارتباطها بقرارات محفوظة.');
      } catch (error) { notify(messageOf(error), true); }
    })();
  });
  actions.append(toggle, copy);

  if (rule.template) {
    const hint = field('p', 'fw-hint');
    hint.textContent = 'قالب خادم موثوق: يُفعّل أو يُعطّل أو يُنسخ فقط، ولا يُعاد تعريف نمطه. أضف قاعدة مخصصة لتعديل النمط. ';
    card.append(actions, hint);
    return card;
  }
  actions.append(remove);
  const details = field('details', 'fw-edit-details');
  const summary = field('summary'); summary.textContent = 'تعديل القاعدة';
  details.append(summary);
  const form = field('form', 'fw-edit');
  const errorLine = field('p', 'fw-error'); errorLine.setAttribute('role', 'alert');
  const idBase = `fw-edit-${rule.id}`;
  const addField = (labelText: string, control: HTMLElement, id: string) => { const label = field('label'); label.htmlFor = id; label.textContent = labelText; form.append(label, control); };

  const name = field('input') as HTMLInputElement; name.id = `${idBase}-name`; name.name = 'edit-name'; name.type = 'text'; name.maxLength = 60; name.required = true; name.value = rule.name;
  const patternInput = field('input') as HTMLInputElement; patternInput.id = `${idBase}-pattern`; patternInput.name = 'edit-pattern'; patternInput.type = 'text'; patternInput.maxLength = 80; patternInput.required = true; patternInput.spellcheck = false; patternInput.value = rule.pattern;
  const action = field('select') as HTMLSelectElement; action.id = `${idBase}-action`; action.name = 'edit-action';
  for (const value of ['ALLOW', 'WARN', 'REDACT', 'ESCALATE', 'DENY']) { const option = field('option'); option.value = value; option.textContent = value; option.selected = rule.action === value; action.append(option); }
  const priority = field('input') as HTMLInputElement; priority.id = `${idBase}-priority`; priority.name = 'edit-priority'; priority.type = 'number'; priority.min = '1'; priority.max = '999'; priority.step = '1'; priority.required = true; priority.value = String(rule.priority);
  addField('اسم القاعدة', name, name.id);
  addField('النمط الحرفي', patternInput, patternInput.id);
  addField('الإجراء', action, action.id);
  addField('الأولوية', priority, priority.id);
  form.append(errorLine);
  const save = field('button'); save.type = 'submit'; save.textContent = 'حفظ التعديل';
  form.append(save);
  form.addEventListener('submit', event => {
    event.preventDefault(); errorLine.textContent = '';
    void (async () => {
      try {
        await withBusy(async () => {
          await api('rules', 'PATCH', { id: rule.id, version: rule.version, name: name.value, pattern: patternInput.value, action: action.value, priority: Number(priority.value) });
          await reload();
        });
        notify('حُفظ تعديل القاعدة وارتفعت نسختها في الخادم.');
      } catch (error) { errorLine.textContent = messageOf(error); }
    })();
  });
  details.append(form);
  actions.append(details);
  card.append(actions);
  return card;
}
function inputLine(submitted: string) {
  const line = field('p', 'fw-result-input');
  line.append(document.createTextNode('المدخل المفحوص (اصطناعي): '));
  const value = field('bdi'); value.textContent = submitted;
  line.append(value);
  return line;
}
function metaLine(label: string, value: string) {
  const line = field('p', 'fw-result-meta');
  line.append(document.createTextNode(`${label}: `));
  const data = field('bdi'); data.textContent = value;
  line.append(data);
  return line;
}
function renderSetup(message?: string, external = false) {
  const detail = message?.trim() || 'جداول Firewall غير موجودة أو غير مطابقة على قاعدة البيانات الحالية. لم يصدر أي قرار ولم يُحفظ شيء.';
  if (external) {
    setupMessage.textContent = detail;
    setupPanel.hidden = false;
    return;
  }
  result.replaceChildren();
  result.dataset.state = 'setup';
  const head = field('p', 'fw-result-head');
  const label = field('span', 'fw-tag fw-escalate'); label.textContent = 'SETUP';
  head.append(label, document.createTextNode('التهيئة غير مكتملة'));
  const body = field('p');
  body.textContent = detail;
  const next = field('p', 'fw-result-meta');
  next.textContent = 'طبّق ترحيل Firewall المعتمد في بيئة معتمدة، ثم أعد التحميل. لا تعامل غياب البيانات كسماح.';
  result.append(head, body, next);
}
function renderResult(data: any, submitted: string) {
  result.replaceChildren();
  result.dataset.state = 'decision';
  const summary = field('p', 'fw-result-head');
  summary.append(actionBadge(data.action));
  const reason = field('span'); reason.textContent = data.reason_text ?? reasonLabels[data.reason] ?? data.reason;
  summary.append(reason);
  const rule = data.rule_id
    ? metaLine('معرّف القاعدة', `${data.rule_id}${data.rule_name ? ` · ${data.rule_name}` : ''} · النسخة ${data.rule_version}`)
    : (() => { const p = field('p'); p.textContent = 'لا توجد قاعدة مطابقة لهذا القرار.'; return p; })();
  const time = metaLine('وقت التقييم', riyadhTime(data.created_at));
  const reference = metaLine('مرجع القرار', data.id);
  const status = metaLine('الحالة', `${data.execution_status ?? 'NOT_EXECUTED'} — ${executionLabel(data)} تقييم تجريبي فقط؛ لم يُرسل إلى مزود.`);
  const output = field('p', 'fw-result-output');
  output.textContent = ['DENY', 'ESCALATE', 'WARN'].includes(data.action)
    ? 'لا يعيد الخادم النص الأصلي ضمن نتيجة هذه الحالة؛ التحذير والحجب لا يمرران النص تلقائيًا.'
    : data.action === 'REDACT'
      ? `النص بعد التنقيح: ${data.output ?? 'لم يُعد النص.'}`
      : `النص المفحوص: ${data.output ?? 'لم يُعد النص.'}`;
  const saved = field('p', 'fw-result-meta'); saved.textContent = 'حُفظ التقييم وتدقيق Kernel على الخادم دون متن النص.';
  result.append(summary, inputLine(submitted), rule, time, reference, status, output, saved);
}
function updateSubmitLabel() {
  evalSubmit.textContent = evalMode.value === 'LAB'
    ? 'تقييم تجريبي من الخادم'
    : providerConfigured ? 'تقييم وتنفيذ عبر المزود المعتمد' : 'تقييم مسار الإنفاذ — الإرسال غير مهيأ';
}
function renderGuard(data: any, submitted: string) {
  result.replaceChildren();
  result.dataset.state = 'decision';
  const decision = data.decision;
  const head = field('p', 'fw-result-head');
  head.append(actionBadge(decision.action), document.createTextNode(decision.reason_text ?? reasonLabels[decision.reason] ?? decision.reason));
  result.append(head, inputLine(submitted));
  if (decision.rule_id) result.append(metaLine('معرّف القاعدة', `${decision.rule_id} · النسخة ${decision.rule_version}`));
  result.append(metaLine('وقت التقييم', riyadhTime(decision.created_at)));
  result.append(metaLine('مرجع القرار', decision.id));
  if (data.request_id) result.append(metaLine('معرّف الطلب', data.request_id));
  if (data.policy_version) result.append(metaLine('نسخة السياسة', String(data.policy_version)));
  if (data.request_fingerprint) result.append(metaLine('بصمة الطلب', `${String(data.request_fingerprint).slice(0, 20)}…`));
  if (data.policy) result.append(metaLine('قرار Kernel', `${data.policy.decision} · ${data.policy.reason ?? '—'}${data.policy.mandatory === true ? ' · إلزامي لا ترفعه موافقة' : ''}${(data.policy.policies ?? []).length ? ` · ${data.policy.policies.length} سياسة في السلسلة` : ''}`));
  result.append(metaLine('الحالة', `${data.execution_status ?? 'NOT_EXECUTED'} — ${executionLabel(data)}`));
  if (data.review_required === true) {
    const integration = data.integration?.configured === true
      ? `طلب مراجعة معلق · ${data.integration.operation_type}`
      : `HUMAN_GATE_NOT_CONFIGURED — ${data.integration?.reason ?? 'NO_APPROVED_REVIEW_INTEGRATION'}؛ لم يُنشأ طلب موافقة.`;
    result.append(metaLine('تكامل المراجعة', integration));
  }
  const state = field('p'); state.textContent = data.message ?? executionLabel(data);
  result.append(state);
  const saved = field('p', 'fw-result-meta'); saved.textContent = 'حُفظ قرار السياسة وتدقيق Kernel وبصمة الربط دون النص؛ هذا المرجع ليس إثبات وصول للمزود.';
  result.append(saved);
  if (data.external_action_executed === true && typeof data.response_text === 'string') {
    const output = field('p', 'fw-result-output'); output.textContent = `استجابة المزود: ${data.response_text}`; result.append(output);
  }
}
function render(data: any) {
  setWorkspace(data.tenant.tenant_id);
 workspace.replaceChildren(...data.memberships.map((membership: any) => { const option = field('option'); option.value = membership.tenant_id; option.textContent = membership.name; option.selected = membership.tenant_id === data.tenant.tenant_id; return option; }));
  root.querySelector('[data-scope]')!.textContent = `الدور: ${data.tenant.role} · قواعد حرفية · بيانات اصطناعية فقط`;
  providerConfigured = data.provider?.configured === true;
  root.querySelector('[data-provider]')!.textContent = providerConfigured
    ? `مزود مهيأ للمؤسسة · النموذج ${data.provider.model} · المنطقة ${data.provider.region}؛ يخضع لشروط الاعتماد.`
    : `PROVIDER_NOT_CONFIGURED — لا مزود AI معتمد ومهيأ لهذه المؤسسة. التقييم والحفظ متاحان عند اكتمال إعداد قاعدة البيانات، والإرسال الخارجي متوقف. نقطة الإنفاذ الوحيدة: ${data.enforcement?.point ?? '/app/api/firewall/guarded-executions/'} · التنفيذ: ${data.enforcement?.execution ?? 'BLOCKED'} (${data.enforcement?.reason ?? 'PROVIDER_NOT_CONFIGURED'}) · تكامل المراجعة: ${data.enforcement?.review ?? 'HUMAN_GATE_NOT_CONFIGURED'}.`;
  updateSubmitLabel();
  const limits = data.limits ?? { maxRules: 25, maxTextLength: 4000 };
  text.maxLength = limits.maxTextLength;
  page = data.page; hasNext = data.hasNext;
  root.querySelector('[data-page]')!.textContent = `الصفحة ${page}`;
  root.querySelectorAll<HTMLElement>('[data-count]').forEach(node => { node.textContent = String(data.counts.find((count: any) => count.action === node.dataset.count)?.count ?? 0); });
  root.querySelector('[data-rule-count]')!.textContent = `${data.rules.length} / ${limits.maxRules}`;
  const reload = () => (async () => { render(await api('rules')); })();
  const notify = (message: string, failed = false) => note(message, failed);
  const list = root.querySelector('[data-rules]')!;
  list.replaceChildren(...data.rules.map((rule: any) => ruleCard(rule, data.canManage, reload, notify)));
  (root.querySelector('[data-empty-rules]') as HTMLElement).hidden = data.rules.length > 0;
  (root.querySelector('[data-create-rule]') as HTMLElement).hidden = !data.canManage;
  (root.querySelector('[data-templates]') as HTMLElement).hidden = !data.canManage;
  const limitReached = data.rules.length >= limits.maxRules;
  createForm.querySelector<HTMLButtonElement>('button[type=submit]')!.dataset.limit = String(limitReached);
  root.querySelectorAll<HTMLButtonElement>('[data-template]').forEach(button => {
    button.dataset.exists = String(data.rules.some((rule: any) => rule.template === button.dataset.template));
    button.dataset.limit = String(limitReached);
  });
  root.querySelector('[data-role]')!.textContent = data.canManage
    ? 'يمكنك إضافة القواعد وتعديلها وتفعيلها وتعطيلها ونسخها وحذف غير المرتبط منها بقرارات؛ كل تغيير يُتحقق منه ويُحفظ في الخادم.'
    : 'عرض وفحص فقط؛ تعديل القواعد للمالك والمسؤول.';
  const decisions = root.querySelector('[data-decisions]')!;
  decisions.replaceChildren();
  if (!data.decisions.length) decisions.textContent = 'لا توجد قرارات محفوظة ضمن هذه التصفية.';
  for (const decision of data.decisions) {
    const item = field('li');
    const time = field('time'); time.dateTime = decision.created_at; time.textContent = new Date(decision.created_at).toLocaleString('ar-SA', { timeZone: 'Asia/Riyadh' });
    const rule = field('p');
    rule.textContent = decision.rule_id ? `مرجع القاعدة: ${decision.rule_id} · النسخة وقت القرار ${decision.rule_version}` : 'دون قاعدة مطابقة';
    const reason = field('p', 'fw-decision-reason'); reason.textContent = reasonLabels[decision.reason] ?? decision.reason;
    const reference = field('p');
    reference.textContent = `القرار: ${decision.id} · ${decision.mode === 'GUARD'
      ? `مسار التنفيذ (قرار سياسة${decision.policy_version ? ` · نسخة ${String(decision.policy_version).slice(0, 24)}…` : ''})`
      : 'تقييم تجريبي'}`;
    item.append(time, actionBadge(decision.action), reason, rule, reference);
    decisions.append(item);
  }
  privateArea.hidden = false;
  setupPanel.hidden = true;
}
async function refresh(message = 'تم تحميل بيانات المؤسسة والتحقق من الصلاحيات في الخادم.') {
  if (busy) return;
  try { await withBusy(async () => { render(await api('rules')); }); note(message); }
  catch (error) {
    if (error instanceof ApiError && setupCodes.includes(error.code)) {
      clearPrivate(); renderSetup(error.message, true); note('التهيئة غير مكتملة؛ لم تُعرض أي بيانات أو قرار.', true); return;
    }
    if (!(error instanceof ApiError && error.code === 'INVALID_FILTER')) clearPrivate();
    note(messageOf(error), true);
  }
}
root.querySelector('[data-reload]')!.addEventListener('click', () => void refresh());
workspace.addEventListener('change', () => { text.value = ''; result.textContent = ''; void refresh(); });
[actionFilter, reasonFilter, modeFilter, fromFilter, toFilter].forEach(control => control.addEventListener('change', () => { page = 1; void refresh(); }));
previousPage.addEventListener('click', () => { if (page > 1) { page--; void refresh(); } });
nextPage.addEventListener('click', () => { if (hasNext) { page++; void refresh(); } });
evalMode.addEventListener('change', () => { result.textContent = ''; updateSubmitLabel(); });
root.querySelectorAll<HTMLButtonElement>('[data-example]').forEach(button => button.addEventListener('click', () => {
  text.value = button.dataset.example!;
  evalError.textContent = '';
  result.textContent = 'أكّد أن النص اصطناعي ثم اضغط فحص من الخادم.';
  text.focus();
}));
ack.addEventListener('change', () => { evalSubmit.disabled = busy || !ack.checked; evalError.textContent = ''; });
const createForm = root.querySelector<HTMLFormElement>('[data-create-rule]')!;
const createError = root.querySelector<HTMLElement>('[data-create-error]')!;
createForm.addEventListener('submit', event => {
  event.preventDefault(); createError.textContent = '';
  const data = new FormData(createForm);
  const payload = { name: String(data.get('name') ?? ''), pattern: String(data.get('pattern') ?? ''), action: String(data.get('action') ?? ''), priority: Number(data.get('priority')) };
  void (async () => {
    try {
      await withBusy(async () => { await api('rules', 'POST', payload); render(await api('rules')); });
      createForm.reset();
      (root.querySelector('#fw-priority') as HTMLInputElement).value = '100';
      note('حُفظت القاعدة في الخادم وظهرت في القائمة.');
    } catch (error) { createError.textContent = messageOf(error); }
  })();
});
root.querySelectorAll<HTMLButtonElement>('[data-template]').forEach(button => button.addEventListener('click', () => {
  void (async () => {
    try {
      await withBusy(async () => { await api('rules', 'POST', { template: button.dataset.template }); render(await api('rules')); });
      note('أُضيف قالب المختبر وحُفظ في الخادم.');
    } catch (error) { note(messageOf(error), true); }
  })();
}));
root.querySelector('form[data-evaluate]')!.addEventListener('submit', event => {
  event.preventDefault();
  evalError.textContent = '';
  if (!ack.checked) { evalError.textContent = 'أكّد أن النص اصطناعي قبل الفحص.'; return; }
  if (!text.value.trim()) { evalError.textContent = 'اكتب نصًا اصطناعيًا من حرف واحد على الأقل.'; return; }
  const submitted = text.value;
  void (async () => {
    try {
      await withBusy(async () => {
        result.dataset.state = 'loading';
        result.textContent = 'جارٍ تقييم السياسة وحفظ القرار…';
        const guarded = evalMode.value === 'GUARD';
        const decision = await api(guarded ? 'guarded-executions' : 'evaluate', 'POST', { text: submitted, synthetic: true, ...(guarded ? { request_id: crypto.randomUUID() } : {}) });
        if (guarded) renderGuard(decision, submitted); else renderResult(decision, submitted);
        const message = guarded ? decision.message ?? 'أعاد المزود استجابة للطلب المحكوم.' : 'حُفظ التقييم التجريبي دون إرسال للمزود.';
        page = 1;
        try { render(await api('rules')); note(message, guarded && decision.external_action_executed !== true); }
        catch { note(`${message} تعذر تحديث قائمة السجل؛ حدّثها يدويًا.`, true); }
      });
    } catch (error) {
      if (error instanceof ApiError && setupCodes.includes(error.code)) {
        renderSetup(error.message);
        evalError.textContent = '';
        return;
      }
      evalError.textContent = messageOf(error);
      result.dataset.state = 'error';
      result.textContent = 'تعذر تأكيد نتيجة الطلب. لا تتعامل معه كسماح، ولا تعِد التنفيذ تلقائيًا؛ راجع السجل أولًا.';
    }
  })();
});
window.addEventListener('pagehide', clearPrivate);
window.addEventListener('pageshow', event => { if (event.persisted) void refresh(); });
if (auth) void refresh();

document.addEventListener('workspace-session-ended', () => { clearPrivate(); status.textContent = 'انتهت الجلسة؛ سجّل الدخول مجددًا من Kernel.'; });
