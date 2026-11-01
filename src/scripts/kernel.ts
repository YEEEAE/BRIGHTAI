import { createWorkspaceAuth as createAuthClient, getWorkspaceSession, appFetch, selectedWorkspace, setWorkspace } from './workspace-context';
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
const healthNames: Record<string, string> = { auth: 'الدخول (Neon Auth)', database: 'قاعدة البيانات', schema: 'مخطط Kernel', administration: 'إدارة Kernel' };
const healthStates: Record<string, { text: string; tone: string }> = {
  READY: { text: 'جاهز', tone: 'ok' },
  AUTH_SETUP_REQUIRED: { text: 'AUTH_SETUP_REQUIRED — يلزم إعداد الدخول', tone: 'warn' },
  AUTH_UNAVAILABLE: { text: 'تعذر التحقق من خدمة الدخول', tone: 'bad' },
  DB_SETUP_REQUIRED: { text: 'DB_SETUP_REQUIRED — يلزم إعداد اتصال القاعدة', tone: 'warn' },
  DB_UNAVAILABLE: { text: 'تعذر الاتصال بقاعدة البيانات', tone: 'bad' },
  SCHEMA_MISSING: { text: 'جداول Kernel الأربع غير مطبّقة', tone: 'bad' },
  NOT_CHECKED: { text: 'لم يُفحص', tone: 'muted' },
  KERNEL_ADMIN_SETUP_REQUIRED: { text: 'يلزم ترحيل إدارة Kernel المعتمد', tone: 'warn' },
  UNKNOWN: { text: 'غير معروف', tone: 'muted' },
};
const date = (value: string) => { const parsed = new Date(value); return Number.isNaN(parsed.getTime()) ? '—' : parsed.toLocaleDateString('ar-SA'); };
function clearPrivate() {
  currentTenant = null; invitationConfig = null;
  invitationForm.hidden = true; linkPanel.hidden = true; incomingPanel.hidden = true;
  root.querySelector('[data-invitations]')!.replaceChildren();
  root.querySelector('[data-incoming]')!.replaceChildren();
  nativeOrganizations.replaceChildren();
  adminStatus.textContent = '';
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
  // Installed @neon/auth 0.8.2 replaces session.token with set-auth-jwt.
  const session = await getWorkspaceSession(auth);
  const token = session.data?.session?.token;
  if (session.error || !session.data?.user || !token) { const e = new Error('سجّل الدخول لعرض بيانات مؤسستك.'); Object.assign(e, { unauthorized: true }); throw e; }
  const response = await appFetch(auth, `/app/api/kernel/${workspace ? `?workspace=${encodeURIComponent(workspace)}` : ''}`, {
    method, cache: 'no-store', headers: { Authorization: `Bearer ${token}`, ...(method === 'POST' ? { 'Content-Type': 'application/json' } : {}) },
    ...(method === 'POST' ? { body: JSON.stringify({ name }) } : {}),
  });
  const data = await response.json();
  if (!response.ok) { const e = new Error(data.message); Object.assign(e, { unauthorized: response.status === 401 }); throw e; }
  return data;
}
async function members(workspace?: string) {
  const session = await getWorkspaceSession(auth);
  const token = session.data?.session?.token;
  if (!token) { const e = new Error('سجّل الدخول لعرض أعضاء المؤسسة.'); Object.assign(e, { unauthorized: true }); throw e; }
  const response = await appFetch(auth, `/app/api/kernel/members/${workspace ? `?workspace=${encodeURIComponent(workspace)}` : ''}`, { cache: 'no-store', headers: { Authorization: `Bearer ${token}` } });
  const data = await response.json();
  if (!response.ok) { const e = new Error(data.message); Object.assign(e, { unauthorized: response.status === 401 }); throw e; }
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
  const labels: Record<string,string> = {pending:'بانتظار القبول',accepted:'مقبولة لدى Auth',rejected:'مرفوضة',canceled:'ملغاة',expired:'منتهية'};
  for (const row of invitationConfig?.invitations ?? []) {
    const li = document.createElement('li');
    li.textContent = `${row.email} · ${row.accepted_at ? 'عضوية Kernel معتمدة' : labels[row.status] ?? 'غير متاحة'} · تنتهي ${date(row.expires_at)}`;
    invitations.append(li);
  }
  if (invitationConfig?.canLink) await loadNativeOrganizations();
  if (invitationConfig?.available) await loadProviderPending(data.invitation.invitations ?? []);
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
    card.querySelector('[data-product-setup]')!.textContent = p.setupMessage ?? 'اختر مؤسسة لعرض حالة الإعداد.';
    card.querySelector('[data-product-terms]')!.textContent = p.accessKind === 'ADMIN_NON_BILLED' ? `إتاحة إدارية مؤقتة غير مفوترة حتى ${date(p.expiresAt)}؛ ليست اشتراكًا أو تجربة مدفوعة.` : 'لا قرار إتاحة إداري ساري. الاشتراك والتجربة غير مهيّأين.';
    const admin = card.querySelector<HTMLElement>('[data-product-admin]')!; admin.replaceChildren(); admin.hidden = !p.canManage;
    if (p.canManage) {
      const form = document.createElement('form'), select = document.createElement('select'), label = document.createElement('label');
      select.id = `state-${p.slug}`; label.htmlFor = select.id; label.textContent = 'إدارة حالة المنتج (للمالك)';
      for (const [value,text] of [['FOUNDATION','قيد التأسيس'],['ENABLED','تمكين'],['DISABLED','تعطيل']]) {
        const option = new Option(text, value); option.selected = p.state === value; option.disabled = value === 'ENABLED' && !p.canEnable; select.append(option);
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
      const blocked = document.createElement('button'); blocked.type = 'button'; blocked.disabled = true; blocked.textContent = p.state === 'DISABLED' ? 'معطّل' : !p.enabled ? 'يلزم تمكين معتمد' : 'الإعداد غير مكتمل';
      action.replaceChildren(blocked);
    }
  }
}
async function load(workspace?: string) {
  workspace ||= selectedWorkspace();
  clearPrivate();
  const session = await getWorkspaceSession(auth);
  if (session.error) throw new Error('تعذر التحقق من Neon Auth. راجع إعداد الأصل الموثوق واتصال الخدمة.');
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
  root.querySelectorAll<HTMLButtonElement | HTMLSelectElement>('button,select').forEach(b => b.disabled = true);
  status.textContent = 'جارٍ تحميل المساحة…';
  try { await task(); } catch (error: any) { showError(error.message || 'تعذر الاتصال. حاول لاحقًا.', !!error.unauthorized); }
  finally { busy = false; root.removeAttribute('aria-busy'); root.querySelectorAll<HTMLButtonElement | HTMLSelectElement>('button,select').forEach(b => b.disabled = false);
    root.querySelectorAll<HTMLButtonElement>('[data-product-action] button').forEach(b => b.disabled = true); }
}
async function endpoint(path: string, method = 'GET', body?: object, workspace?: string) {
  const response = await appFetch(auth, `/app/api/kernel/${path}/${workspace ? `?workspace=${encodeURIComponent(workspace)}` : ''}`, {
    method, ...(body ? {headers:{'Content-Type':'application/json'},body:JSON.stringify(body)} : {})
  });
  let data: any; try { data = await response.json(); } catch { throw new Error('الخدمة غير متاحة؛ لم يُؤكد الحفظ.'); }
  if (!response.ok) throw Object.assign(new Error(data.message || 'تعذر إكمال الطلب.'), {unauthorized: response.status === 401});
  return data;
}
async function adminRun(work: () => Promise<void>) {
  if (busy) return;
  busy = true; root.setAttribute('aria-busy','true');
  root.querySelectorAll<HTMLButtonElement | HTMLSelectElement>('button,select').forEach(b => b.disabled = true);
  adminStatus.textContent = 'جارٍ تنفيذ العملية؛ انتظر نتيجة الخادم…';
  try { await work(); }
  catch (error: any) {
    if (error.unauthorized) showError(error.message, true);
    adminStatus.textContent = error.message || 'تعذر إكمال العملية؛ لم يُؤكد الحفظ. حدّث البيانات قبل إعادة الإرسال.';
  } finally {
    busy = false; root.removeAttribute('aria-busy');
    root.querySelectorAll<HTMLButtonElement | HTMLSelectElement>('button,select').forEach(b => b.disabled = false);
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
      text.textContent = `${row.email} · دعوة لدى Auth لم تُسجل في Kernel بعد`;
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
    incomingPanel.hidden = !data.invitations.length;
    const list = root.querySelector('[data-incoming]')!; list.replaceChildren();
    for (const invite of data.invitations) {
      const li = document.createElement('li'), name = document.createElement('span'), accept = document.createElement('button');
      name.textContent = `${invite.name} · تنتهي ${date(invite.expires_at)}`;
      accept.type = 'button'; accept.textContent = invite.status === 'accepted' ? 'إكمال اعتماد العضوية' : 'قبول الانضمام بدور عضو';
      accept.addEventListener('click', () => void adminRun(async () => {
        if (invite.status !== 'accepted') { const result = await auth.organization.acceptInvitation({invitationId:invite.id}); if (result.error) throw new Error('لم يُقبل طلب الدعوة لدى Auth؛ تحقق من البريد الموثّق وصلاحية الدعوة.'); }
        const result = await endpoint('members','POST',{operation:'accept',invitationId:invite.id});
        setWorkspace(result.tenantId); await load(result.tenantId); adminStatus.textContent = 'اعتمد الخادم عضويتك في المؤسسة.';
      }));
      li.append(name,accept); list.append(li);
    }
    state.textContent = '';
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
  login?.addEventListener('submit', event => { event.preventDefault(); const form = new FormData(login); void run(async () => {
    const result = await auth.signIn.email({ email: String(form.get('email')), password: String(form.get('password')) });
    login.reset(); if (result.error) { const e = new Error('تعذر الدخول. تحقق من بيانات الحساب وإعداد Neon Auth.'); Object.assign(e,{unauthorized:true}); throw e; }
    await load();
  }); });
  create.addEventListener('submit', event => { event.preventDefault(); const name = String(new FormData(create).get('name')); void run(async () => { const data = await api('POST', name); create.reset(); await load(data.tenantId); }); });
  logout.addEventListener('click', () => { pendingInvitationId = ''; registerInvite.hidden = true; clearPrivate(); void run(async () => { const result = await auth.signOut(); if(result.error) throw new Error('تعذر إنهاء جلسة Neon Auth. أعد المحاولة.'); logout.hidden = true; showError('تم تسجيل الخروج.', true); }); });
  // Do not restore private DOM snapshots from the browser history cache.
  window.addEventListener('pagehide', clearPrivate);
  window.addEventListener('pageshow', event => { if(event.persisted) void run(() => load()); });
}
