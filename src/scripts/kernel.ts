import { createWorkspaceAuth as createAuthClient, getWorkspaceSession, appFetch, selectedWorkspace, setWorkspace } from './workspace-context';
const root = document.querySelector<HTMLElement>('[data-kernel]')!;
const status = root.querySelector<HTMLElement>('[data-status]')!;
const title = root.querySelector<HTMLElement>('[data-state-title]')!;
const login = root.querySelector<HTMLFormElement>('[data-login]');
const loginEmail = login?.querySelector<HTMLInputElement>('#email');
const loginPassword = login?.querySelector<HTMLInputElement>('#password');
const loginSubmit = login?.querySelector<HTMLButtonElement>('[data-login-submit]');
const loginPasswordToggle = login?.querySelector<HTMLButtonElement>('[data-login-password-toggle]');
const loginEmailError = login?.querySelector<HTMLElement>('[data-login-email-error]');
const loginPasswordError = login?.querySelector<HTMLElement>('[data-login-password-error]');
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
let currentTenant: any = null;
let invitationConfig: any = null;
let pendingInvitationId = '';
const adminStatus = root.querySelector<HTMLElement>('[data-admin-status]')!;
const invitationForm = root.querySelector<HTMLFormElement>('[data-invite]')!;
const linkPanel = root.querySelector<HTMLElement>('[data-auth-link]')!;
const nativeOrganizations = root.querySelector<HTMLSelectElement>('[data-auth-organizations]')!;
const registerInvite = root.querySelector<HTMLButtonElement>('[data-register-invite]')!;
const incomingPanel = root.querySelector<HTMLElement>('[data-incoming-panel]')!;
const productSlugs = ['firewall', 'ledger', 'human-gate', 'risk-engine', 'secure-chat'];
const roleNames: Record<string,string> = { OWNER: 'مالك', ADMIN: 'مدير', MEMBER: 'عضو' };
const healthNames: Record<string, string> = { auth: 'الدخول (Neon Auth)', database: 'قاعدة البيانات', schema: 'مخطط Kernel', administration: 'إدارة Kernel' };
const healthStates: Record<string, { text: string; tone: string }> = {
  READY: { text: 'جاهز', tone: 'ok' },
  AUTH_SETUP_REQUIRED: { text: 'يلزم إعداد خدمة الدخول', tone: 'warn' },
  AUTH_UNAVAILABLE: { text: 'تعذر التحقق من خدمة الدخول', tone: 'bad' },
  DB_SETUP_REQUIRED: { text: 'يلزم إعداد اتصال قاعدة البيانات', tone: 'warn' },
  DB_UNAVAILABLE: { text: 'تعذر الاتصال بقاعدة البيانات', tone: 'bad' },
  SCHEMA_MISSING: { text: 'جداول Kernel الأربع غير مطبّقة', tone: 'bad' },
  NOT_CHECKED: { text: 'لم يُفحص', tone: 'muted' },
  KERNEL_ADMIN_SETUP_REQUIRED: { text: 'يلزم ترحيل إدارة Kernel المعتمد', tone: 'warn' },
  UNKNOWN: { text: 'غير معروف', tone: 'muted' },
};
const invitationStatusLabels: Record<string, string> = { pending: 'بانتظار القبول', accepted: 'مقبولة لدى Auth', rejected: 'مرفوضة', canceled: 'ملغاة', expired: 'منتهية', inviter_unavailable: 'توقفت صلاحية الداعي' };
const date = (value: string) => { const parsed = new Date(value); return Number.isNaN(parsed.getTime()) ? '—' : parsed.toLocaleDateString('ar-SA'); };
function setLoginError(input: HTMLInputElement | null | undefined, error: HTMLElement | null | undefined, message = '') {
  if (!input || !error) return;
  error.textContent = message; error.hidden = !message;
  input.setAttribute('aria-invalid', message ? 'true' : 'false');
  input.setAttribute('aria-describedby', error.id);
}
function clearPrivate() {
  currentTenant = null; invitationConfig = null;
  invitationForm.hidden = true; linkPanel.hidden = true; incomingPanel.hidden = true;
  root.querySelector('[data-invitations]')!.replaceChildren();
  root.querySelector('[data-incoming]')!.replaceChildren();
  nativeOrganizations.replaceChildren();
  adminStatus.textContent = '';
  const tenantName = root.querySelector<HTMLElement>('[data-tenant-name]')!;
  const emptyTenant = document.createElement('bdi'); emptyTenant.dir = 'auto'; emptyTenant.textContent = 'لا توجد مساحة محمّلة'; tenantName.replaceChildren(emptyTenant);
  root.querySelector('[data-tenant-detail]')!.textContent = 'تظهر البيانات بعد التحقق من العضوية.';
  root.querySelector('[data-selector]')!.setAttribute('hidden', '');
  root.querySelector('[data-selector-note]')!.textContent = '';
  selector.replaceChildren(); create.hidden = true;
  root.querySelector('[data-connection]')!.textContent = 'لم يُتحقق من الربط';
  metrics.hidden = true;
  membersList.replaceChildren(); memberCount.textContent = ''; membersState.textContent = 'تُحمّل الأعضاء بعد التحقق من العضوية.';
  activityList.replaceChildren(); activityState.textContent = 'تُحمّل الأنشطة بعد التحقق من العضوية.';
  root.querySelectorAll<HTMLElement>('[data-product]').forEach(card => {
    card.querySelector<HTMLElement>('[data-product-admin]')!.hidden = true;
    card.querySelector('[data-product-admin]')!.replaceChildren();
    card.querySelector('[data-product-setup]')!.textContent = 'حالة الإعداد غير محمّلة.';
    card.querySelector('[data-product-terms]')!.textContent = 'الاشتراك والتجربة غير مهيّأين.';
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
  const session = await getWorkspaceSession(auth);
  const token = await auth.getJWTToken();
  if (session.error || !session.data?.user || !token) { const e = new Error('سجّل الدخول لعرض بيانات مؤسستك.'); Object.assign(e, { unauthorized: true }); throw e; }
  const response = await appFetch(auth, `/app/api/kernel/${workspace ? `?workspace=${encodeURIComponent(workspace)}` : ''}`, {
    method, cache: 'no-store', headers: { Authorization: `Bearer ${token}`, ...(method === 'POST' ? { 'Content-Type': 'application/json' } : {}) },
    ...(method === 'POST' ? { body: JSON.stringify({ name }) } : {}),
  });
  const data = await response.json();
  if (!response.ok) { const e = new Error(data.message); Object.assign(e, { unauthorized: response.status === 401, code: data.code }); throw e; }
  return data;
}
async function members(workspace?: string) {
  await getWorkspaceSession(auth);
  const token = await auth.getJWTToken();
  if (!token) { const e = new Error('سجّل الدخول لعرض أعضاء المؤسسة.'); Object.assign(e, { unauthorized: true }); throw e; }
  const response = await appFetch(auth, `/app/api/kernel/members/${workspace ? `?workspace=${encodeURIComponent(workspace)}` : ''}`, { cache: 'no-store', headers: { Authorization: `Bearer ${token}` } });
  const data = await response.json();
  if (!response.ok) { const e = new Error(data.message); Object.assign(e, { unauthorized: response.status === 401, code: data.code }); throw e; }
  return data;
}
async function renderMembers(data: any) {
  membersList.replaceChildren();
  memberCount.textContent = `${data.members.length} عضو`;
  membersState.textContent = data.members.length ? '' : 'لا يوجد أعضاء محمّلون لهذه المؤسسة.';
  const note = root.querySelector<HTMLElement>('[data-invite-note]')!;
  invitationConfig = data.invitation;
  note.textContent = data.invitation?.reason ?? 'الدعوات غير مفعّلة بعد.';
  invitationForm.hidden = !invitationConfig?.available;
  linkPanel.hidden = !invitationConfig?.canLink;
  const invitations = root.querySelector('[data-invitations]')!; invitations.replaceChildren();
  const labels: Record<string,string> = {pending:'بانتظار القبول',accepted:'مقبولة لدى Auth',rejected:'مرفوضة',canceled:'ملغاة',expired:'منتهية',inviter_unavailable:'توقفت صلاحية الداعي'};
  for (const row of invitationConfig?.invitations ?? []) {
    const li = document.createElement('li');
    const email = document.createElement('bdi'); email.dir = 'ltr'; email.textContent = row.email ?? '';
    const details = document.createElement('span'); details.textContent = `${row.accepted_at ? 'عضوية Kernel معتمدة' : labels[row.status] ?? 'غير متاحة'} · تنتهي ${date(row.expires_at)}`;
    li.append(email, details);
    invitations.append(li);
  }
  if (invitationConfig?.canLink) await loadNativeOrganizations();
  if (invitationConfig?.available) await loadProviderPending(data.invitation.invitations ?? []);
  for (const member of data.members) {
    const item = document.createElement('li');
    const identity = document.createElement('div');
    const name = document.createElement('strong'); name.dir = 'auto'; name.textContent = member.name;
    identity.append(name);
    if (member.email) { const email = document.createElement('bdi'); email.dir = 'ltr'; email.textContent = member.email; identity.append(email); }
    const role = document.createElement('span'); role.className = 'role'; role.textContent = member.roleLabel;
    const joined = document.createElement('time'); joined.textContent = `انضم: ${date(member.created_at)}`;
    item.append(identity, role);
    if (member.status === 'BANNED') { const banned = document.createElement('span'); banned.className = 'role warn'; banned.textContent = 'موقوف لدى Auth'; item.append(banned); }
    item.append(joined);
    if (data.canManage && member.userId && (member.role !== 'OWNER' || currentTenant?.role === 'OWNER')) {
      const actions = document.createElement('div'); actions.className = 'member-controls';
      const roleSelect = document.createElement('select'); roleSelect.setAttribute('aria-label', `تغيير دور ${member.name}`);
      for (const [value, label] of [...(member.role === 'OWNER' ? [['OWNER','مالك']] : []), ['MEMBER','عضو'],['ADMIN','مدير']]) {
        const option = new Option(label, value); option.selected = member.role === value;
        if (value === 'ADMIN' && currentTenant?.role !== 'OWNER' || value === 'OWNER') option.disabled = true;
        roleSelect.append(option);
      }
      const saveRole = document.createElement('button'); saveRole.type = 'button'; saveRole.textContent = 'حفظ الدور'; saveRole.disabled = true;
      roleSelect.addEventListener('change', () => { saveRole.disabled = roleSelect.value === member.role; });
      saveRole.addEventListener('click', () => void adminRun(async () => {
        await endpoint('members','POST',{operation:'set-role',userId:member.userId,role:roleSelect.value},currentTenant.tenant_id);
        await load(currentTenant.tenant_id); adminStatus.textContent = 'تم تحديث دور العضو في Kernel.';
      }));
      const revoke = document.createElement('button'); revoke.type = 'button'; revoke.textContent = 'سحب عضوية Kernel';
      if (member.isSelf) revoke.disabled = true;
      revoke.addEventListener('click', () => void adminRun(async () => {
        if (!window.confirm(`سحب عضوية ${member.name} يمنع وصوله إلى Kernel لهذه المؤسسة. هل تريد المتابعة؟`)) return;
        await endpoint('members','POST',{operation:'revoke',userId:member.userId},currentTenant.tenant_id);
        await load(currentTenant.tenant_id); adminStatus.textContent = 'تم سحب عضوية Kernel؛ لم تتغير عضوية Neon Auth.';
      }));
      if (!member.isSelf) actions.append(roleSelect, saveRole, revoke);
      else if (currentTenant?.role === 'OWNER' || currentTenant?.role === 'ADMIN') actions.append(roleSelect, saveRole);
      item.append(actions);
    }
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
    text.append(label);
    const actor = document.createElement('span'); actor.textContent = row.actor ? `بواسطة ${row.actor}` : 'بواسطة عضو';
    const time = document.createElement('time'); time.textContent = date(row.created_at);
    item.append(text, actor, time);
    activityList.append(item);
  }
}
function render(data: any) {
  currentTenant = data.tenant;
  if (data.tenant) setWorkspace(data.tenant.tenant_id);
  retry.hidden = true; logout.hidden = false; if (login) login.hidden = true;
  title.textContent = data.tenant ? 'مساحة العمل متصلة' : 'أنشئ مساحة عملك الأولى';
  status.textContent = data.tenant ? 'تم التحقق من الهوية والعضوية وتحميل بيانات المؤسسة.' : 'لا توجد عضويات لهذا الحساب. يمكنك إنشاء مؤسسة جديدة.';
  root.querySelector('[data-connection]')!.textContent = 'Auth + DB · متصل';
  create.hidden = data.memberships.length > 0;
  const tenantName = root.querySelector<HTMLElement>('[data-tenant-name]')!;
  const tenantDisplay = document.createElement('bdi'); tenantDisplay.dir = 'auto'; tenantDisplay.textContent = data.tenant?.name ?? 'لا توجد مؤسسة بعد'; tenantName.replaceChildren(tenantDisplay);
  root.querySelector('[data-tenant-detail]')!.textContent = data.tenant ? `الدور: ${roleNames[data.tenant.role] ?? 'غير معروف'} · تاريخ الإنشاء: ${date(data.tenant.created_at)}` : 'إنشاء المساحة لا يفعّل المنتجات أو الاشتراك.';
  selector.replaceChildren(...data.memberships.map((m: any) => { const option = document.createElement('option'); option.value = m.tenant_id; option.textContent = m.name; option.selected = m.tenant_id === data.tenant?.tenant_id; return option; }));
  (root.querySelector('[data-selector]') as HTMLElement).hidden = !data.memberships.length;
  root.querySelector('[data-selector-note]')!.textContent = data.memberships.length > 1 ? `لديك عضوية في ${data.memberships.length} مؤسسات؛ تُحمّل بيانات المؤسسة المختارة فقط.` : '';
  metrics.hidden = !data.tenant;
  if (data.tenant) {
    root.querySelector('[data-metric="members"]')!.textContent = data.summary?.members == null ? 'لا بيانات' : String(data.summary.members);
    root.querySelector('[data-metric="coverage"]')!.textContent = data.summary?.coverage ? `${data.summary.coverage.enabled} / ${data.summary.coverage.total}` : 'لا بيانات';
    root.querySelector('[data-metric="events"]')!.textContent = data.summary?.events == null ? 'لا بيانات' : String(data.summary.events);
    renderActivity(data.activity ?? []);
  }
  for (const p of data.products) {
    const card = root.querySelector<HTMLElement>(`[data-product="${p.slug}"]`);
    if (!card) continue;
    card.querySelector('[data-product-status]')!.textContent = p.label;
    card.querySelector('[data-product-setup]')!.textContent = p.setupMessage ?? 'اختر مؤسسة لعرض حالة الإعداد.';
    card.querySelector('[data-product-terms]')!.textContent = p.grantState === 'EXPIRED' ? `انتهت الإتاحة الإدارية بتاريخ ${date(p.expiresAt)}. الاشتراك والتجربة غير مهيّأين.` : p.grantState === 'REVOKED' ? 'أُلغي قرار الإتاحة الإداري؛ راجع مشغّل النظام.' : p.accessKind === 'ADMIN_NON_BILLED' ? `إتاحة إدارية مؤقتة غير مفوترة حتى ${date(p.expiresAt)}؛ ليست اشتراكًا أو تجربة مدفوعة.` : 'لا قرار إتاحة إداري ساري. الاشتراك والتجربة غير مهيّأين.';
    const admin = card.querySelector<HTMLElement>('[data-product-admin]')!; admin.replaceChildren(); admin.hidden = !p.canManage;
    if (p.canManage) {
      const form = document.createElement('form'), select = document.createElement('select'), label = document.createElement('label');
      select.id = `state-${p.slug}`; label.htmlFor = select.id; label.textContent = 'إدارة حالة المنتج (للمالك)';
      for (const [value,text] of [['FOUNDATION','قيد التأسيس'],['ENABLED','تمكين'],['DISABLED','تعطيل']]) {
        const option = new Option(text, value); option.selected = (p.configuredStatus ?? p.state) === value; option.disabled = value === 'ENABLED' && !p.canEnable; select.append(option);
      }
      const save = document.createElement('button'); save.type = 'submit'; save.textContent = 'حفظ الحالة';
      form.append(label,select,save); admin.append(form);
      form.addEventListener('submit', event => { event.preventDefault(); const workspace = currentTenant?.tenant_id; void adminRun(async () => { await endpoint('products','PATCH',{slug:p.slug,status:select.value,version:p.version},workspace); await load(workspace); adminStatus.textContent = 'حُفظت حالة المنتج في الخادم.'; }); });
    }
    const action = card.querySelector('[data-product-action]')!;
    // Product paths are an explicit allowlist, never arbitrary URLs from data.
    if (data.tenant && p.href === `/app/${p.slug}/` && productSlugs.includes(p.slug)) {
      const link = document.createElement('a'); link.href = `${p.href}?workspace=${encodeURIComponent(data.tenant.tenant_id)}`; link.textContent = 'فتح صفحة المنتج'; action.replaceChildren(link);
    } else {
      const blocked = document.createElement('button'); blocked.type = 'button'; blocked.disabled = true; blocked.textContent = p.state === 'DISABLED' ? 'معطّل' : p.state === 'EXPIRED' ? 'انتهت الإتاحة' : p.state === 'REVOKED' ? 'أُلغي القرار' : !p.enabled ? 'يلزم تمكين معتمد' : 'الإعداد غير مكتمل';
      action.replaceChildren(blocked);
    }
  }
}
async function load(workspace?: string) {
  workspace ||= selectedWorkspace();
  clearPrivate();
  const session = await getWorkspaceSession(auth);
  if (session.error) { const error = new Error('تعذر استعادة جلسة الدخول؛ سجّل الدخول مجددًا أو أعد المحاولة.'); Object.assign(error, { unauthorized: true }); throw error; }
  if (!session.data?.user) { showError('سجّل الدخول بحسابك لعرض مساحة العمل.', true); logout.hidden = true; return; }
  const data = await api('GET', undefined, workspace);
  render(data);
  await loadIncoming();
  if (data.tenant) {
    try { await renderMembers(await members(data.tenant.tenant_id)); }
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
  root.querySelectorAll<HTMLButtonElement | HTMLSelectElement | HTMLInputElement>('button,select,input').forEach(b => b.disabled = true);
  status.textContent = 'جارٍ تحميل المساحة…';
  try { await task(); } catch (error: any) { showError(error.message || 'تعذر الاتصال. حاول لاحقًا.', !!error.unauthorized); }
  finally { busy = false; root.removeAttribute('aria-busy'); root.querySelectorAll<HTMLButtonElement | HTMLSelectElement | HTMLInputElement>('button,select,input').forEach(b => b.disabled = false);
    root.querySelectorAll<HTMLButtonElement>('[data-product-action] button').forEach(b => b.disabled = true); }
}
async function endpoint(path: string, method = 'GET', body?: object, workspace?: string) {
  const response = await appFetch(auth, `/app/api/kernel/${path}/${workspace ? `?workspace=${encodeURIComponent(workspace)}` : ''}`, {
    method, ...(body ? {headers:{'Content-Type':'application/json'},body:JSON.stringify(body)} : {})
  });
  let data: any; try { data = await response.json(); } catch { throw new Error('الخدمة غير متاحة؛ لم يُؤكد الحفظ.'); }
  if (!response.ok) throw Object.assign(new Error(data.message || 'تعذر إكمال الطلب.'), {unauthorized: response.status === 401, code: data.code});
  return data;
}
async function adminRun(work: () => Promise<void>) {
  if (busy) return;
  busy = true; root.setAttribute('aria-busy','true');
  root.querySelectorAll<HTMLButtonElement | HTMLSelectElement | HTMLInputElement>('button,select,input').forEach(b => b.disabled = true);
  adminStatus.textContent = 'جارٍ تنفيذ العملية؛ انتظر نتيجة الخادم…';
  try { await work(); }
  catch (error: any) {
    if (error.unauthorized) showError(error.message, true);
    adminStatus.textContent = error.message || 'تعذر إكمال العملية؛ لم يُؤكد الحفظ. حدّث البيانات قبل إعادة الإرسال.';
  } finally {
    busy = false; root.removeAttribute('aria-busy');
    root.querySelectorAll<HTMLButtonElement | HTMLSelectElement | HTMLInputElement>('button,select,input').forEach(b => b.disabled = false);
    root.querySelectorAll<HTMLButtonElement>('[data-product-action] button').forEach(b => b.disabled = true);
    registerInvite.hidden = !pendingInvitationId || !currentTenant;
  }
}
async function loadNativeOrganizations() {
  const tenant = currentTenant?.tenant_id;
  try {
    const result = await auth.organization.list();
    if (tenant !== currentTenant?.tenant_id) return;
    if (result.error) throw new Error('تعذر تحميل مؤسسات Auth؛ تحقق من إتاحة Organization لدى المزود.');
    nativeOrganizations.replaceChildren(...(result.data ?? []).map((org: any) => new Option(org.name, org.id)));
  } catch { if (tenant === currentTenant?.tenant_id) adminStatus.textContent = 'ربط الدعوات معلّق؛ تعذر تحميل مؤسسات Neon Auth.'; }
}
async function loadProviderPending(registered: any[]) {
  const workspace = currentTenant?.tenant_id;
  try {
    const session = await getWorkspaceSession(auth);
    const result = await auth.organization.listInvitations({query:{organizationId:invitationConfig.organizationId}});
    if (workspace !== currentTenant?.tenant_id || result.error) return;
    for (const row of result.data ?? []) {
      if (row.status !== 'pending' || row.inviterId !== session.data?.user?.id || registered.some(item => item.id === row.id)) continue;
      const li = document.createElement('li'), text = document.createElement('span'), button = document.createElement('button');
      const email = document.createElement('bdi'); email.dir = 'ltr'; email.textContent = row.email;
      text.append(email, document.createTextNode(' · دعوة لدى Auth لم تُسجل في Kernel بعد'));
      button.type = 'button'; button.textContent = 'تسجيل متابعة الدعوة';
      button.addEventListener('click', () => void adminRun(async () => {
        await endpoint('members','POST',{operation:'register',invitationId:row.id},workspace);
        await load(workspace); adminStatus.textContent = 'سُجلت متابعة الدعوة؛ لم تُمنح عضوية قبل القبول.';
      }));
      li.append(text,button); root.querySelector('[data-invitations]')!.append(li);
    }
  } catch { if (workspace === currentTenant?.tenant_id) adminStatus.textContent = 'تعذر جلب الدعوات غير المسجلة من Auth؛ قائمة Kernel الحالية محفوظة.'; }
}
async function loadIncoming() {
  const state = root.querySelector<HTMLElement>('[data-incoming-state]')!;
  try {
    const data = await endpoint('invitations');
    incomingPanel.hidden = false;
    const list = root.querySelector('[data-incoming]')!; list.replaceChildren();
    if (!data.available) state.textContent = 'لم تُجهز متابعة الدعوات على هذه البيئة بعد.';
    else if (!data.invitations.length) state.textContent = 'ما ظهرت دعوة مؤهلة؛ تحقق من تسجيل الدخول بالبريد المدعو وتوثيق البريد الإلكتروني.';
    else state.textContent = '';
    for (const invite of data.invitations) {
      const li = document.createElement('li'), name = document.createElement('span'), accept = document.createElement('button');
      const orgName = document.createElement('bdi'); orgName.dir = 'auto'; orgName.textContent = invite.name;
      name.append(orgName, document.createTextNode(` · ${invite.status === 'inviter_unavailable' ? 'لم تعد الدعوة صالحة لأن صلاحية الداعي انتهت.' : `تنتهي ${date(invite.expires_at)}`}`));
      if (invite.status === 'pending' || invite.status === 'accepted') {
        accept.type = 'button'; accept.textContent = invite.status === 'accepted' ? 'إكمال اعتماد العضوية' : 'قبول الانضمام بدور عضو';
        accept.addEventListener('click', () => void adminRun(async () => {
          if (invite.status !== 'accepted') {
            const result = await auth.organization.acceptInvitation({invitationId:invite.id});
            if (result.error) throw new Error('تعذر قبول الدعوة لدى Neon Auth. قد تكون منتهية أو ملغاة؛ حدّث القائمة أو تواصل مع مالك المؤسسة.');
          }
          try {
            const result = await endpoint('members','POST',{operation:'accept',invitationId:invite.id});
            setWorkspace(result.tenantId); await load(result.tenantId); adminStatus.textContent = 'اعتمد الخادم عضويتك في المؤسسة بدور عضو.';
          } catch (error: any) {
            if (error.code === 'INVALID_INVITATION') throw new Error('الدعوة غير متاحة الآن؛ ربما ألغيت أو سبق قبولها بحساب آخر. حدّث القائمة.');
            if (error.code === 'INVITER_AUTHORITY_REVOKED') throw new Error('توقفت صلاحية الداعي في المؤسسة؛ اطلب دعوة جديدة من مالك أو مدير حالي.');
            if (error.code === 'INVITATION_NOT_ACCEPTED') throw new Error('لم يثبت قبول الدعوة ببريدك الموثّق؛ أكمل خطوة Neon Auth ثم حدّث القائمة.');
            throw error;
          }
        }));
        li.append(name,accept);
      } else li.append(name, document.createTextNode(` · ${invitationStatusLabels[invite.status] ?? 'غير متاحة'}`));
      list.append(li);
    }
  } catch { incomingPanel.hidden = false; state.textContent = 'تعذر تحميل الدعوات؛ بيانات المؤسسة الحالية لا تتغير. حدّث اللوحة للمحاولة.'; }
}
async function linkOrganization(id: string) {
  await endpoint('members','POST',{operation:'link',organizationId:id},currentTenant.tenant_id);
  await load(currentTenant.tenant_id); adminStatus.textContent = 'حُفظ ربط مؤسسة الدخول؛ لا تُستورد عضويات تلقائيًا.';
}
root.querySelector('[data-link-existing]')!.addEventListener('click', () => void adminRun(async () => {
  if (!nativeOrganizations.value) throw new Error('اختر مؤسسة Auth تملكها أو أنشئ مؤسسة من الزر المخصص.');
  await linkOrganization(nativeOrganizations.value);
}));
root.querySelector('[data-create-auth]')!.addEventListener('click', () => void adminRun(async () => {
  if (!currentTenant || !invitationConfig?.canLink) return;
  const result = await auth.organization.create({name:currentTenant.name,slug:`aigas-${currentTenant.tenant_id}`});
  if (result.error || !result.data?.id) throw new Error('لم يكتمل إنشاء مؤسسة Auth. إذا سبق إنشاؤها، اخترها من القائمة واربطها؛ لا تكرر الإنشاء.');
  try { await linkOrganization(result.data.id); }
  catch { await loadNativeOrganizations(); throw new Error('أُنشئت مؤسسة Auth لكن لم يُؤكد ربطها؛ اخترها من القائمة لإكمال الربط دون إنشاء أخرى.'); }
}));
invitationForm.addEventListener('submit', event => { event.preventDefault(); const email = String(new FormData(invitationForm).get('email')); void adminRun(async () => {
  if (!invitationConfig?.available || !currentTenant) throw new Error('الدعوات غير متاحة لهذه العضوية.');
  const result = await auth.organization.inviteMember({email,role:'member',organizationId:invitationConfig.organizationId});
  if (result.error || !result.data?.id) throw new Error('تعذر إنشاء الدعوة لدى Auth. تحقق من إعداد Organization وصلاحيات حسابك؛ لم تُمنح عضوية Kernel.');
  pendingInvitationId = result.data.id;
  await endpoint('members','POST',{operation:'register',invitationId:pendingInvitationId},currentTenant.tenant_id);
  pendingInvitationId = ''; invitationForm.reset(); await load(currentTenant.tenant_id);
  adminStatus.textContent = 'سُجلت الدعوة المعلقة في الخادم؛ إرسال البريد غير مؤكد. تظهر للمدعو داخل Kernel بعد توثيق بريده.';
}); });
registerInvite.addEventListener('click', () => void adminRun(async () => {
  await endpoint('members','POST',{operation:'register',invitationId:pendingInvitationId},currentTenant.tenant_id);
  pendingInvitationId = ''; await load(currentTenant.tenant_id); adminStatus.textContent = 'سُجلت الدعوة في Kernel.';
}));
document.addEventListener('workspace-session-ended', () => showError('انتهت الجلسة؛ سجّل الدخول مجددًا.',true));
void health();
healthRefresh.addEventListener('click', () => { healthRefresh.disabled = true; void health().finally(() => { healthRefresh.disabled = false; }); });
if (url) {
  auth = makeAuth(url);
  void run(() => load());
  retry.addEventListener('click', () => void run(() => load()));
  selector.addEventListener('change', () => { const workspace = selector.value; void run(() => load(workspace)); });
  if (login && loginEmail && loginPassword && loginSubmit && loginPasswordToggle) {
    const validateLogin = () => {
      const emailValid = loginEmail.validity.valid;
      setLoginError(loginEmail, loginEmailError, emailValid ? '' : loginEmail.value ? 'تحقق من صيغة البريد الإلكتروني.' : 'اكتب بريدك الإلكتروني.');
      setLoginError(loginPassword, loginPasswordError, loginPassword.value ? '' : 'اكتب كلمة المرور.');
      return emailValid && !!loginPassword.value;
    };
    loginEmail.addEventListener('blur', validateLogin); loginPassword.addEventListener('blur', validateLogin);
    loginEmail.addEventListener('input', () => { if (!loginEmailError?.hidden) setLoginError(loginEmail, loginEmailError, loginEmail.validity.valid ? '' : 'تحقق من صيغة البريد الإلكتروني.'); });
    loginPassword.addEventListener('input', () => { if (!loginPasswordError?.hidden && loginPassword.value) setLoginError(loginPassword, loginPasswordError); });
    loginPasswordToggle.addEventListener('click', () => {
      const visible = loginPassword.type === 'password'; loginPassword.type = visible ? 'text' : 'password';
      loginPasswordToggle.textContent = visible ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'; loginPasswordToggle.setAttribute('aria-pressed', String(visible));
    });
    login.addEventListener('submit', event => { event.preventDefault(); if (!validateLogin()) { login.reportValidity(); return; } const form = new FormData(login); void run(async () => {
      const result = await auth.signIn.email({ email: String(form.get('email')).trim(), password: String(form.get('password')) });
      if (result.error) { setLoginError(loginPassword, loginPasswordError, 'تعذر تسجيل الدخول. تحقق من البريد وكلمة المرور وحاول مرة ثانية.'); const e = new Error('تعذر تسجيل الدخول. تحقق من بياناتك وحاول مرة ثانية.'); Object.assign(e,{unauthorized:true}); throw e; }
      await load(); login.reset(); loginPassword.type = 'password'; loginPasswordToggle.textContent = 'إظهار كلمة المرور'; loginPasswordToggle.setAttribute('aria-pressed','false'); setLoginError(loginEmail, loginEmailError); setLoginError(loginPassword, loginPasswordError);
    }); });
  }
  create.addEventListener('submit', event => { event.preventDefault(); const name = String(new FormData(create).get('name')); void run(async () => { const data = await api('POST', name); create.reset(); await load(data.tenantId); }); });
  logout.addEventListener('click', () => { pendingInvitationId = ''; registerInvite.hidden = true; clearPrivate(); void run(async () => { const result = await auth.signOut(); if(result.error) throw new Error('تعذر إنهاء جلسة Neon Auth. أعد المحاولة.'); logout.hidden = true; showError('تم تسجيل الخروج.', true); }); });
  // Do not restore private DOM snapshots from the browser history cache.
  window.addEventListener('pagehide', clearPrivate);
  window.addEventListener('pageshow', event => { if(event.persisted) void run(() => load()); });
}
