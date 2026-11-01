import { createAuthClient } from '@neon/neon-js/auth';
const root = document.querySelector<HTMLElement>('[data-kernel]')!;
const status = root.querySelector<HTMLElement>('[data-status]')!;
const title = root.querySelector<HTMLElement>('[data-state-title]')!;
const login = root.querySelector<HTMLFormElement>('[data-login]');
const create = root.querySelector<HTMLFormElement>('[data-create]')!;
const selector = root.querySelector<HTMLSelectElement>('[data-workspace]')!;
const retry = root.querySelector<HTMLButtonElement>('[data-retry]')!;
const logout = root.querySelector<HTMLButtonElement>('[data-sign-out]')!;
const url = root.dataset.authUrl;
const makeAuth = (base: string) => createAuthClient(base);
let auth: ReturnType<typeof makeAuth>;
let busy = false;
function clearPrivate() {
  root.querySelector('[data-tenant-name]')!.textContent = 'لا توجد مساحة محمّلة';
  root.querySelector('[data-tenant-detail]')!.textContent = 'تظهر البيانات بعد التحقق من العضوية.';
  root.querySelector('[data-selector]')!.setAttribute('hidden', '');
  selector.replaceChildren(); create.hidden = true;
  root.querySelector('[data-connection]')!.textContent = 'لم يُتحقق من الربط';
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
function render(data: any) {
  retry.hidden = true; logout.hidden = false; if (login) login.hidden = true;
  title.textContent = data.tenant ? 'مساحة العمل متصلة' : 'أنشئ مساحة عملك الأولى';
  status.textContent = data.tenant ? 'تم التحقق من الهوية والعضوية وتحميل بيانات المؤسسة.' : 'لا توجد عضويات لهذا الحساب. يمكنك إنشاء مؤسسة جديدة.';
  root.querySelector('[data-connection]')!.textContent = 'Auth + DB · متصل';
  create.hidden = data.memberships.length > 0;
  root.querySelector('[data-tenant-name]')!.textContent = data.tenant?.name ?? 'لا توجد مؤسسة بعد';
  root.querySelector('[data-tenant-detail]')!.textContent = data.tenant ? `الدور: ${data.tenant.role} · تاريخ الإنشاء: ${new Date(data.tenant.created_at).toLocaleDateString('ar-SA')}` : 'إنشاء المساحة لا يفعّل المنتجات أو الاشتراك.';
  selector.replaceChildren(...data.memberships.map((m: any) => { const option = document.createElement('option'); option.value = m.tenant_id; option.textContent = m.name; option.selected = m.tenant_id === data.tenant?.tenant_id; return option; }));
  (root.querySelector('[data-selector]') as HTMLElement).hidden = !data.memberships.length;
  for (const p of data.products) {
    const card = root.querySelector<HTMLElement>(`[data-product="${p.slug}"]`);
    if (!card) continue;
    card.querySelector('[data-product-status]')!.textContent = p.label;
    const action = card.querySelector('[data-product-action]')!;
    // Product paths are an explicit allowlist, never arbitrary URLs from data.
    if (p.href === `/app/${p.slug}/` && ['firewall','ledger','human-gate','risk-engine','secure-chat'].includes(p.slug)) {
      const link = document.createElement('a'); link.href = p.href; link.textContent = 'فتح المنتج'; action.replaceChildren(link);
    }
  }
}
async function run(task: () => Promise<void>) {
  if (busy) return; busy = true; root.setAttribute('aria-busy','true');
  root.querySelectorAll<HTMLButtonElement>('form button, [data-retry], [data-sign-out]').forEach(b => b.disabled = true);
  status.textContent = 'جارٍ تحميل المساحة…';
  try { await task(); } catch (error: any) { showError(error.message || 'تعذر الاتصال. حاول لاحقًا.', !!error.unauthorized); }
  finally { busy = false; root.removeAttribute('aria-busy'); root.querySelectorAll<HTMLButtonElement>('form button, [data-retry], [data-sign-out]').forEach(b => b.disabled = false); }
}
async function load(workspace?: string) {
  clearPrivate();
  const session = await auth.getSession();
  if (session.error) throw new Error('تعذر التحقق من Neon Auth. راجع إعداد الأصل الموثوق واتصال الخدمة.');
  if (!session.data?.user) { showError('سجّل الدخول بحسابك لعرض مساحة العمل.', true); logout.hidden = true; return; }
  render(await api('GET', undefined, workspace));
}
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
  create.addEventListener('submit', event => { event.preventDefault(); const name = String(new FormData(create).get('name')); void run(async () => { render(await api('POST', name)); create.reset(); }); });
  logout.addEventListener('click', () => { clearPrivate(); void run(async () => { const result = await auth.signOut(); if(result.error) throw new Error('تعذر إنهاء جلسة Neon Auth. أعد المحاولة.'); logout.hidden = true; showError('تم تسجيل الخروج.', true); }); });
  // Do not restore private DOM snapshots from the browser history cache.
  window.addEventListener('pagehide', clearPrivate);
  window.addEventListener('pageshow', event => { if(event.persisted) void run(() => load()); });
}
