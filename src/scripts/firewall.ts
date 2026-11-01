import { createAuthClient } from '@neon/neon-js/auth';

const root = document.querySelector<HTMLElement>('[data-firewall]')!;
const status = root.querySelector<HTMLElement>('[data-status]')!;
const privateArea = root.querySelector<HTMLElement>('[data-private]')!;
const workspace = root.querySelector<HTMLSelectElement>('[data-workspace]')!;
const actionFilter = root.querySelector<HTMLSelectElement>('[data-filter]')!;
const reasonFilter = root.querySelector<HTMLSelectElement>('[data-reason]')!;
const text = root.querySelector<HTMLTextAreaElement>('textarea')!;
const ack = root.querySelector<HTMLInputElement>('[data-synthetic]')!;
const evalSubmit = root.querySelector<HTMLButtonElement>('[data-eval-submit]')!;
const evalError = root.querySelector<HTMLElement>('[data-eval-error]')!;
const result = root.querySelector<HTMLElement>('[data-result]')!;
const reasonLabels: Record<string, string> = {
  NO_ACTIVE_POLICY: 'لا توجد قاعدة مفعّلة؛ حجب آمن.',
  INVALID_POLICY: 'قاعدة محفوظة غير صالحة؛ حجب آمن.',
  RULE_BLOCK: 'طابق النص قاعدة حجب.',
  RULE_REDACT: 'نُقّح النص وفق قاعدة تنقيح.',
  RULE_ALLOW: 'طابق النص قاعدة سماح.',
  NO_MATCH_LAB_ONLY: 'لم يطابق أي قاعدة؛ ليس إثبات سلامة المحتوى.',
};
const auth = root.dataset.authUrl ? createAuthClient(root.dataset.authUrl) : null;
let busy = false;

class ApiError extends Error { code: string; constructor(message: string, code = '') { super(message); this.code = code; } }
const field = <T extends keyof HTMLElementTagNameMap>(tag: T, className = '') => { const node = document.createElement(tag); if (className) node.className = className; return node; };
const messageOf = (error: unknown) => error instanceof Error && error.message ? error.message : 'تعذر إكمال الطلب.';
function note(message: string, failed = false) { status.textContent = message; status.dataset.state = failed ? 'error' : 'ok'; }
function lockControls(locked: boolean) {
  root.querySelectorAll<HTMLButtonElement | HTMLSelectElement | HTMLInputElement | HTMLTextAreaElement>('button,select,input,textarea').forEach(node => { node.disabled = locked; });
  if (!locked) evalSubmit.disabled = !ack.checked;
}
async function withBusy(task: () => Promise<void>) {
  if (busy) return;
  busy = true; root.setAttribute('aria-busy', 'true'); lockControls(true);
  try { await task(); }
  finally { busy = false; root.removeAttribute('aria-busy'); lockControls(false); }
}
function clearPrivate() {
  privateArea.hidden = true; text.value = ''; ack.checked = false; evalError.textContent = ''; result.textContent = '';
  root.querySelector('[data-rules]')!.replaceChildren();
  root.querySelector('[data-decisions]')!.replaceChildren();
  (root.querySelector('[data-empty-rules]') as HTMLElement).hidden = true;
  root.querySelector('[data-create-rule]')!.setAttribute('hidden', '');
  root.querySelector('[data-templates]')!.setAttribute('hidden', '');
  workspace.replaceChildren();
  root.querySelector('[data-scope]')!.textContent = '';
  root.querySelector('[data-rule-count]')!.textContent = '0';
  root.querySelectorAll('[data-count]').forEach(node => { node.textContent = '—'; });
  lockControls(false);
}
async function api(path: string, method = 'GET', body?: object) {
  if (!auth) throw new ApiError('يلزم إعداد الدخول.', 'AUTH_SETUP');
  const session = await auth.getSession();
  const token = session.data?.session?.token;
  if (session.error || !session.data?.user || !token) throw new ApiError('يلزم تسجيل الدخول عبر Kernel. تحقق أيضًا من إعداد الأصل الموثوق.', 'AUTH_REQUIRED');
  const params = new URLSearchParams();
  if (workspace.value) params.set('workspace', workspace.value);
  if (actionFilter.value) params.set('action', actionFilter.value);
  if (reasonFilter.value) params.set('reason', reasonFilter.value);
  const response = await fetch(`/app/api/firewall/${path}/?${params}`, {
    method, cache: 'no-store',
    headers: { Authorization: `Bearer ${token}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  let data: any = null;
  try { data = await response.json(); } catch { /* non-JSON failures are reported generically below */ }
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
  actions.append(toggle);

  if (rule.template) {
    const hint = field('p', 'fw-hint');
    hint.textContent = 'قالب خادم موثوق: يُفعّل أو يُعطّل فقط، ولا يُعاد تعريف نمطه. أضف قاعدة مخصصة لتعديل النمط. ';
    card.append(actions, hint);
    return card;
  }
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
  for (const value of ['BLOCK', 'REDACT', 'ALLOW']) { const option = field('option'); option.value = value; option.textContent = value; option.selected = rule.action === value; action.append(option); }
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
function renderResult(data: any) {
  result.replaceChildren();
  const summary = field('p', 'fw-result-head');
  summary.append(actionBadge(data.action));
  const reason = field('span'); reason.textContent = reasonLabels[data.reason] ?? data.reason;
  summary.append(reason);
  const rule = field('p');
  rule.textContent = data.rule_name ? `القاعدة: ${data.rule_name} · النسخة ${data.rule_version}` : 'لا توجد قاعدة مطابقة لهذا القرار.';
  const id = field('p'); id.textContent = `مرجع القرار: ${data.id}`;
  const output = field('p');
  output.textContent = data.action === 'BLOCK' ? 'لم يُعرض النص المحجوب، ولم يُحفظ.' : data.output ?? 'لم يُعد النص.';
  const saved = field('p'); saved.textContent = 'حُفظ القرار على الخادم دون متن النص.';
  result.append(summary, rule, id, output, saved);
}
function render(data: any) {
  workspace.replaceChildren(...data.memberships.map((membership: any) => { const option = field('option'); option.value = membership.tenant_id; option.textContent = membership.name; option.selected = membership.tenant_id === data.tenant.tenant_id; return option; }));
  root.querySelector('[data-scope]')!.textContent = `الدور: ${data.tenant.role} · مختبر قواعد نصية فقط`;
  root.querySelectorAll<HTMLElement>('[data-count]').forEach(node => { node.textContent = String(data.counts.find((count: any) => count.action === node.dataset.count)?.count ?? 0); });
  root.querySelector('[data-rule-count]')!.textContent = `${data.rules.length} / ${data.maxRules}`;
  const reload = () => (async () => { render(await api('rules')); })();
  const notify = (message: string, failed = false) => note(message, failed);
  const list = root.querySelector('[data-rules]')!;
  list.replaceChildren(...data.rules.map((rule: any) => ruleCard(rule, data.canManage, reload, notify)));
  (root.querySelector('[data-empty-rules]') as HTMLElement).hidden = data.rules.length > 0;
  (root.querySelector('[data-create-rule]') as HTMLElement).hidden = !data.canManage;
  (root.querySelector('[data-templates]') as HTMLElement).hidden = !data.canManage;
  root.querySelector('[data-role]')!.textContent = data.canManage
    ? 'يمكنك إضافة القواعد وتعديلها وتفعيلها وتعطيلها؛ كل تغيير يُحفظ في الخادم ويرفع النسخة.'
    : 'عرض وفحص فقط؛ تعديل القواعد للمالك والمسؤول.';
  const decisions = root.querySelector('[data-decisions]')!;
  decisions.replaceChildren();
  if (!data.decisions.length) decisions.textContent = 'لا توجد قرارات محفوظة ضمن هذه التصفية.';
  for (const decision of data.decisions) {
    const item = field('li');
    const time = field('time'); time.dateTime = decision.created_at; time.textContent = new Date(decision.created_at).toLocaleString('ar-SA');
    const rule = field('p');
    rule.textContent = decision.rule_name ? `${decision.rule_name} · النسخة ${decision.rule_version}` : 'دون قاعدة مطابقة';
    const reason = field('p', 'fw-decision-reason'); reason.textContent = reasonLabels[decision.reason] ?? decision.reason;
    item.append(time, actionBadge(decision.action), reason, rule);
    decisions.append(item);
  }
  privateArea.hidden = false;
}
async function refresh(message = 'تم تحميل بيانات المؤسسة والتحقق من الصلاحيات في الخادم.') {
  try { await withBusy(async () => { render(await api('rules')); }); note(message); }
  catch (error) { clearPrivate(); note(messageOf(error), true); }
}
root.querySelector('[data-reload]')!.addEventListener('click', () => void refresh());
workspace.addEventListener('change', () => { text.value = ''; result.textContent = ''; void refresh(); });
actionFilter.addEventListener('change', () => void refresh());
reasonFilter.addEventListener('change', () => void refresh());
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
  void (async () => {
    try {
      await withBusy(async () => { const decision = await api('evaluate', 'POST', { text: text.value }); renderResult(decision); render(await api('rules')); });
      note('أصدر الخادم القرار وحفظه دون متن النص.');
    } catch (error) { evalError.textContent = messageOf(error); result.textContent = 'لم يصدر قرار من الخادم؛ لا يُعرض سماح عند فشل الطلب.'; }
  })();
});
window.addEventListener('pagehide', clearPrivate);
window.addEventListener('pageshow', event => { if (event.persisted) void refresh(); });
if (auth) void refresh();
