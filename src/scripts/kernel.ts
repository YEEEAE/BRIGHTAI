import { createAuthClient } from '@neon/neon-js/auth';
const root = document.querySelector<HTMLElement>('[data-kernel]')!;
const status = root.querySelector<HTMLElement>('[data-status]')!;
const title = root.querySelector<HTMLElement>('[data-state-title]')!;
const login = root.querySelector<HTMLFormElement>('[data-login]');
const create = root.querySelector<HTMLFormElement>('[data-create]')!;
const selector = root.querySelector<HTMLSelectElement>('[data-workspace]')!;
const retry = root.querySelector<HTMLButtonElement>('[data-retry]')!;
const logout = root.querySelector<HTMLButtonElement>('[data-sign-out]')!;
const metrics = root.querySelector<HTMLElement>('[data-metrics]')!;
const membersList = root.querySelector<HTMLElement>('[data-members]')!;
const membersState = root.querySelector<HTMLElement>('[data-members-state]')!;
const memberCount = root.querySelector<HTMLElement>('[data-member-count]')!;
const activityList = root.querySelector<HTMLElement>('[data-activity]')!;
const activityState = root.querySelector<HTMLElement>('[data-activity-state]')!;
const healthList = root.querySelector<HTMLElement>('[data-health-list]')!;
const healthRefresh = root.querySelector<HTMLButtonElement>('[data-health-refresh]')!;
const url = root.dataset.authUrl;
const makeAuth = (base: string) => createAuthClient(base);
let auth: ReturnType<typeof makeAuth>;
let busy = false;
const productSlugs = ['firewall', 'ledger', 'human-gate', 'risk-engine', 'secure-chat'];
const healthNames: Record<string, string> = { auth: 'الدخول (Neon Auth)', database: 'قاعدة البيانات', schema: 'مخطط Kernel' };
const healthStates: Record<string, { text: string; tone: string }> = {
  READY: { text: 'جاهز', tone: 'ok' },
  AUTH_SETUP_REQUIRED: { text: 'AUTH_SETUP_REQUIRED — يلزم إعداد الدخول', tone: 'warn' },
  AUTH_UNAVAILABLE: { text: 'تعذر التحقق من خدمة الدخول', tone: 'bad' },
  DB_SETUP_REQUIRED: { text: 'DB_SETUP_REQUIRED — يلزم إعداد اتصال القاعدة', tone: 'warn' },
  DB_UNAVAILABLE: { text: 'تعذر الاتصال بقاعدة البيانات', tone: 'bad' },
  SCHEMA_MISSING: { text: 'جداول Kernel الأربع غير مطبّقة', tone: 'bad' },
  NOT_CHECKED: { text: 'لم يُفحص', tone: 'muted' },
  UNKNOWN: { text: 'غير معروف', tone: 'muted' },
};
const date = (value: string) => { const parsed = new Date(value); return Number.isNaN(parsed.getTime()) ? '—' : parsed.toLocaleDateString('ar-SA'); };
function clearPrivate() {
  root.querySelector('[data-tenant-name]')!.textContent = 'لا توجد مساحة محمّلة';
  root.querySelector('[data-tenant-detail]')!.textContent = 'تظهر البيانات بعد التحقق من العضوية.';
  root.querySelector('[data-selector]')!.setAttribute('hidden', '');
  root.querySelector('[data-selector-note]')!.textContent = '';
  selector.replaceChildren(); create.hidden = true;
  root.querySelector('[data-connection]')!.textContent = 'لم يُتحقق من الربط';
  metrics.hidden = true;
  membersList.replaceChildren(); memberCount.textContent = ''; membersState.textContent = 'تُحمّل الأعضاء بعد التحقق من العضوية.';
  activityList.replaceChildren(); activityState.textContent = 'تُحمّل الأنشطة بعد التحقق من العضوية.';
  root.querySelectorAll<HTMLElement>('[data-product]').forEach(card => {
    card.querySelector('[data-product-status]')!.textContent = 'الإتاحة غير محمّلة';
    const button = document.createElement('button'); button.disabled = true; button.textContent = 'لم يجهز بعد';
    card.querySelector('[data-product-action]')!.replaceChildren(button);
  });
}
function showError(message: string, unauthorized = false) {
  clearPrivate(); title.textContent = unauthorized ? 'يلزم تسجيل الدخول' : 'تعذر تحميل المساحة';
  status.textContent = message; retry.hidden = false;
  if (login) login.hidden = !unauthorized;
}
async function api(method = 'GET', name?: string, workspace?: string) {
  // Installed @neon/auth 0.8.2 replaces session.token with set-auth-jwt.
  const session = await auth.getSession();
  const token = session.data?.session?.token;
  if (session.error || !session.data?.user || !token) { const e = new Error('سجّل الدخول لعرض بيانات مؤسستك.'); Object.assign(e, { unauthorized: true }); throw e; }
  const response = await fetch(`/app/api/kernel/${workspace ? `?workspace=${encodeURIComponent(workspace)}` : ''}`, {
    method, cache: 'no-store', headers: { Authorization: `Bearer ${token}`, ...(method === 'POST' ? { 'Content-Type': 'application/json' } : {}) },
    ...(method === 'POST' ? { body: JSON.stringify({ name }) } : {}),
  });
  const data = await response.json();
  if (!response.ok) { const e = new Error(data.message); Object.assign(e, { unauthorized: response.status === 401 }); throw e; }
  return data;
}
async function members(workspace?: string) {
  const session = await auth.getSession();
  const token = session.data?.session?.token;
  if (!token) { const e = new Error('سجّل الدخول لعرض أعضاء المؤسسة.'); Object.assign(e, { unauthorized: true }); throw e; }
  const response = await fetch(`/app/api/kernel/members/${workspace ? `?workspace=${encodeURIComponent(workspace)}` : ''}`, { cache: 'no-store', headers: { Authorization: `Bearer ${token}` } });
  const data = await response.json();
  if (!response.ok) { const e = new Error(data.message); Object.assign(e, { unauthorized: response.status === 401 }); throw e; }
  return data;
}
function renderMembers(data: any) {
  membersList.replaceChildren();
  memberCount.textContent = `${data.members.length} عضو`;
  membersState.textContent = data.members.length ? '' : 'لا يوجد أعضاء محمّلون لهذه المؤسسة.';
  const note = root.querySelector<HTMLElement>('[data-invite-note]')!;
  note.textContent = data.invitation?.reason ?? 'الدعوات غير مفعّلة بعد.';
  for (const member of data.members) {
    const item = document.createElement('li');
    const identity = document.createElement('div');
    const name = document.createElement('strong'); name.textContent = member.name;
    identity.append(name);
    if (member.email) { const email = document.createElement('span'); email.textContent = member.email; identity.append(email); }
    const role = document.createElement('span'); role.className = 'role'; role.textContent = member.roleLabel;
    const joined = document.createElement('time'); joined.textContent = `انضم: ${date(member.created_at)}`;
    if (member.status === 'BANNED') { const banned = document.createElement('span'); banned.className = 'role warn'; banned.textContent = 'موقوف'; item.append(identity, role, banned, joined); }
    else item.append(identity, role, joined);
    membersList.append(item);
  }
}
function renderActivity(rows: any[]) {
  activityList.replaceChildren();
  if (!rows.length) { activityState.textContent = 'لا توجد أنشطة مسجّلة لهذه المؤسسة بعد. ستظهر هنا أول عملية موثقة.'; return; }
  activityState.textContent = '';
  for (const row of rows) {
    const item = document.createElement('li');
    const text = document.createElement('div');
    const label = document.createElement('strong'); label.textContent = row.label;
    const action = document.createElement('code'); action.textContent = row.action;
    text.append(label, action);
    const actor = document.createElement('span'); actor.textContent = row.actor ? `بواسطة ${row.actor}` : 'بواسطة عضو';
    const time = document.createElement('time'); time.textContent = date(row.created_at);
    item.append(text, actor, time);
    activityList.append(item);
  }
}
function render(data: any) {
  retry.hidden = true; logout.hidden = false; if (login) login.hidden = true;
  title.textContent = data.tenant ? 'مساحة العمل متصلة' : 'أنشئ مساحة عملك الأولى';
  status.textContent = data.tenant ? 'تم التحقق من الهوية والعضوية وتحميل بيانات المؤسسة.' : 'لا توجد عضويات لهذا الحساب. يمكنك إنشاء مؤسسة جديدة.';
  root.querySelector('[data-connection]')!.textContent = 'Auth + DB · متصل';
  create.hidden = data.memberships.length > 0;
  root.querySelector('[data-tenant-name]')!.textContent = data.tenant?.name ?? 'لا توجد مؤسسة بعد';
  root.querySelector('[data-tenant-detail]')!.textContent = data.tenant ? `الدور: ${data.tenant.role} · تاريخ الإنشاء: ${date(data.tenant.created_at)}` : 'إنشاء المساحة لا يفعّل المنتجات أو الاشتراك.';
  selector.replaceChildren(...data.memberships.map((m: any) => { const option = document.createElement('option'); option.value = m.tenant_id; option.textContent = m.name; option.selected = m.tenant_id === data.tenant?.tenant_id; return option; }));
  (root.querySelector('[data-selector]') as HTMLElement).hidden = !data.memberships.length;
  root.querySelector('[data-selector-note]')!.textContent = data.memberships.length > 1 ? `لديك عضوية في ${data.memberships.length} مؤسسات؛ تُحمّل بيانات المؤسسة المختارة فقط.` : '';
  metrics.hidden = !data.tenant;
  if (data.tenant) {
    root.querySelector('[data-metric="members"]')!.textContent = String(data.summary?.members ?? 0);
    root.querySelector('[data-metric="events"]')!.textContent = String(data.summary?.events ?? 0);
    renderActivity(data.activity ?? []);
  }
  for (const p of data.products) {
    const card = root.querySelector<HTMLElement>(`[data-product="${p.slug}"]`);
    if (!card) continue;
    card.querySelector('[data-product-status]')!.textContent = p.label;
    const action = card.querySelector('[data-product-action]')!;
    // Product paths are an explicit allowlist, never arbitrary URLs from data.
    if (p.href === `/app/${p.slug}/` && productSlugs.includes(p.slug)) {
      const link = document.createElement('a'); link.href = p.href; link.textContent = 'فتح صفحة المنتج'; action.replaceChildren(link);
    } else {
      const blocked = document.createElement('button'); blocked.type = 'button'; blocked.disabled = true; blocked.textContent = p.state === 'DISABLED' ? 'معطّل من المشغّل' : 'قيد التأسيس';
      action.replaceChildren(blocked);
    }
  }
}
async function load(workspace?: string) {
  clearPrivate();
  const session = await auth.getSession();
  if (session.error) throw new Error('تعذر التحقق من Neon Auth. راجع إعداد الأصل الموثوق واتصال الخدمة.');
  if (!session.data?.user) { showError('سجّل الدخول بحسابك لعرض مساحة العمل.', true); logout.hidden = true; return; }
  const data = await api('GET', undefined, workspace);
  render(data);
  if (data.tenant) {
    try { renderMembers(await members(data.tenant.tenant_id)); }
    catch (error: any) { membersState.textContent = error.message || 'تعذر تحميل الأعضاء.'; }
  } else {
    membersState.textContent = 'لا توجد مؤسسة بعد؛ أنشئ مساحة عمل لعرض الأعضاء.';
    activityState.textContent = 'لا توجد مؤسسة بعد.';
  }
}
async function health() {
  healthList.replaceChildren();
  const pending = document.createElement('li'); pending.textContent = 'جارٍ فحص الدخول والقاعدة…'; healthList.append(pending);
  try {
    const response = await fetch('/app/api/kernel/health/', { cache: 'no-store' });
    const data = await response.json();
    healthList.replaceChildren(...Object.entries(data.checks ?? {}).map(([key, value]) => {
      const item = document.createElement('li');
      const label = document.createElement('span'); label.textContent = healthNames[key] ?? key;
      const state = healthStates[String(value)] ?? { text: 'حالة غير معروفة', tone: 'muted' };
      const badge = document.createElement('b'); badge.className = `health-state ${state.tone}`; badge.textContent = state.text;
      item.append(label, badge); return item;
    }));
    if (data.status === 'operational') { const ok = document.createElement('li'); ok.className = 'health-summary'; ok.textContent = 'الإعدادات الأساسية مكتملة. هذا فحص اتصال فقط.'; healthList.append(ok); }
  } catch {
    const failed = document.createElement('li'); failed.textContent = 'تعذر قراءة حالة التشغيل من الخادم. أعد المحاولة.'; healthList.replaceChildren(failed);
  }
}
async function run(task: () => Promise<void>) {
  if (busy) return; busy = true; root.setAttribute('aria-busy', 'true');
  root.querySelectorAll<HTMLButtonElement>('form button, [data-retry], [data-sign-out]').forEach(b => b.disabled = true);
  status.textContent = 'جارٍ تحميل المساحة…';
  try { await task(); } catch (error: any) { showError(error.message || 'تعذر الاتصال. حاول لاحقًا.', !!error.unauthorized); }
  finally { busy = false; root.removeAttribute('aria-busy'); root.querySelectorAll<HTMLButtonElement>('form button, [data-retry], [data-sign-out]').forEach(b => b.disabled = false); }
}
void health();
healthRefresh.addEventListener('click', () => { healthRefresh.disabled = true; void health().finally(() => { healthRefresh.disabled = false; }); });
if (url) {
  auth = makeAuth(url);
  void run(() => load());
  retry.addEventListener('click', () => void run(() => load()));
  selector.addEventListener('change', () => { const workspace = selector.value; void run(() => load(workspace)); });
  login?.addEventListener('submit', event => { event.preventDefault(); const form = new FormData(login); void run(async () => {
    const result = await auth.signIn.email({ email: String(form.get('email')), password: String(form.get('password')) });
    login.reset(); if (result.error) { const e = new Error('تعذر الدخول. تحقق من بيانات الحساب وإعداد Neon Auth.'); Object.assign(e,{unauthorized:true}); throw e; }
    await load();
  }); });
  create.addEventListener('submit', event => { event.preventDefault(); const name = String(new FormData(create).get('name')); void run(async () => { render(await api('POST', name)); create.reset(); await load(); }); });
  logout.addEventListener('click', () => { clearPrivate(); void run(async () => { const result = await auth.signOut(); if(result.error) throw new Error('تعذر إنهاء جلسة Neon Auth. أعد المحاولة.'); logout.hidden = true; showError('تم تسجيل الخروج.', true); }); });
  // Do not restore private DOM snapshots from the browser history cache.
  window.addEventListener('pagehide', clearPrivate);
  window.addEventListener('pageshow', event => { if(event.persisted) void run(() => load()); });
}
