import { productNavigation, authorizedProductDestination } from '../shared/product-navigation.mjs';
import { createWorkspaceAuth as createAuthClient, getWorkspaceSession, appFetch, selectedWorkspace, setWorkspace } from './workspace-context';
import { observeLogin } from './monitoring';
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
const healthUpdated = root.querySelector<HTMLElement>('[data-health-updated]')!;
const healthError = root.querySelector<HTMLElement>('[data-health-error]')!;
const healthErrorType = root.querySelector<HTMLElement>('[data-health-error-type]')!;
const dashboardError = root.querySelector<HTMLElement>('[data-dashboard-error]')!;
const dashboardErrorType = root.querySelector<HTMLElement>('[data-dashboard-error-type]')!;
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
const departmentsPanel = root.querySelector<HTMLElement>('[data-departments-panel]')!;
const departmentsList = root.querySelector<HTMLElement>('[data-departments]')!;
const departmentsState = root.querySelector<HTMLElement>('[data-departments-state]')!;
const productSlugs = productNavigation.map(product => product.slug);
const roleNames: Record<string,string> = { OWNER: 'مالك', ADMIN: 'مدير', MEMBER: 'عضو' };
const healthNames: Record<string, string> = { auth: 'إعداد Neon Auth', database: 'اتصال قاعدة البيانات', schema: 'مخطط Kernel', administration: 'إدارة Kernel', policyEngine:'مخطط السياسات المركزية', configuration_auth: 'تهيئة Auth على الخادم', configuration_database: 'تهيئة قاعدة البيانات على الخادم', configuration_schema: 'تهيئة المخطط', configuration_administration: 'تهيئة الإدارة', configuration_policyEngine:'تهيئة السياسات المركزية' };
const healthStates: Record<string, { text: string; tone: string }> = {
  READY: { text: 'جاهز', tone: 'ok' },
  CONFIGURED: { text: 'الإعداد موجود', tone: 'ok' },
  AUTH_SETUP_REQUIRED: { text: 'يلزم إعداد خدمة الدخول', tone: 'warn' },
  UNCONFIGURED: { text: 'غير مهيأ', tone: 'muted' },
  AUTH_UNAVAILABLE: { text: 'تعذر التحقق من خدمة الدخول', tone: 'bad' },
  DB_SETUP_REQUIRED: { text: 'يلزم إعداد اتصال قاعدة البيانات', tone: 'warn' },
  DB_UNAVAILABLE: { text: 'تعذر الاتصال بقاعدة البيانات', tone: 'bad' },
  DB_PRIVILEGE_UNAVAILABLE: { text: 'صلاحية القراءة غير متاحة', tone: 'bad' },
  SCHEMA_MISSING: { text: 'جداول Kernel الأربع غير مطبّقة', tone: 'bad' },
  NOT_CHECKED: { text: 'لم يُفحص', tone: 'muted' },
  KERNEL_ADMIN_SETUP_REQUIRED: { text: 'يلزم ترحيل إدارة Kernel المعتمد', tone: 'warn' },
  NOT_CONFIGURED: { text: 'غير مهيأ', tone: 'muted' },
  SCHEMA_READY: { text: 'المخطط موجود', tone: 'ok' },
  UNKNOWN: { text: 'غير معروف', tone: 'muted' },
};
const healthOverall: Record<string, { text: string; tone: string }> = {
  ready: { text: 'جاهز', tone: 'ok' }, degraded: { text: 'متدهور', tone: 'warn' },
  blocked: { text: 'محجوب', tone: 'bad' }, unconfigured: { text: 'غير مهيأ', tone: 'muted' },
};
const invitationStatusLabels: Record<string, string> = { pending: 'بانتظار القبول', accepted: 'مقبولة لدى Auth', rejected: 'مرفوضة', canceled: 'ملغاة', expired: 'منتهية', inviter_unavailable: 'توقفت صلاحية الداعي' };
const trialStateLabels: Record<string, string> = {
  NOT_CONFIGURED: 'غير مهيأة — لا جدول تجربة معتمد',
  NONE: 'لا يوجد طلب تجربة',
  REQUESTED: 'طلب مسجل — بانتظار مراجعة الأهلية',
  ELIGIBILITY_REVIEW: 'قيد مراجعة الأهلية',
  APPROVED: 'أهلية موافقة — لا تفعيل بعد',
  ACTIVATED: 'مفعّلة — 48 ساعة من وقت التفعيل',
  EXPIRED: 'منتهية — انتهت نافذة 48 ساعة',
  CLOSED: 'مغلقة',
  REJECTED: 'مرفوضة',
  CANCELLED: 'ملغاة',
  INVALID_CONFIGURATION: 'محجوبة — نافذة 48 ساعة غير صالحة',
  ACTIVE: 'استحقاق ساري',
  PENDING: 'بانتظار التحقق',
  NOT_APPROVED: 'لا يوجد استحقاق',
  NOT_INCLUDED: 'المنتج غير مشمول',
  BLOCKED: 'محجوب',
  IN_PROGRESS: 'قيد التجربة',
  DRAFT_REQUIRES_HUMAN_REVIEW: 'مسودة تحتاج مراجعة بشرية',
  NOT_ELIGIBLE: 'غير مؤهل',
};
const date = (value: string) => { const parsed = new Date(value); return Number.isNaN(parsed.getTime()) ? '—' : parsed.toLocaleDateString('ar-SA'); };
// No browser clock or approval timestamp may start a trial.
function appendRecordedTime(target: Element, label: string, value: string | null | undefined) {
  const parsed = value ? new Date(value) : null;
  const time = document.createElement('bdi');
  time.textContent = parsed && Number.isFinite(parsed.getTime())
    ? new Intl.DateTimeFormat('ar-SA', { timeZone: 'Asia/Riyadh', dateStyle: 'medium', timeStyle: 'medium' }).format(parsed)
    : 'غير مسجل';
  target.append(document.createElement('br'), document.createTextNode(`${label}: `), time);
}
function renderProductTerms(card: HTMLElement, product: any) {
  const terms = card.querySelector('[data-product-terms]')!;
  if (product.exploration && product.accessSource === 'INTERNAL_EXPLORATION_48H') {
    terms.textContent = `استكشاف داخلي: تصفح فقط · الاستخدام ${product.exploration.used} / ${product.exploration.limit_units}.`;
    appendRecordedTime(terms, 'نهاية الاستكشاف (بتوقيت الرياض)', product.exploration.ends_at);
    card.querySelector('[data-product-commercial]')!.textContent = 'منحة استكشاف مستقلة لمدة 48 ساعة؛ لا فوترة أو تجديد تلقائي.';
    return;
  }

  const labels: Record<string, string> = {
    ACTIVE: 'إتاحة إدارية مؤقتة سارية وغير مفوترة؛ ليست اشتراكًا أو ترخيصًا أو تجربة 48 ساعة.',
    EXPIRED: 'انتهى قرار الإتاحة الإداري؛ لا يتجدد تلقائيًا.',
    REVOKED: 'أُلغي قرار الإتاحة الإداري؛ راجع المشغّل.',
    PENDING: 'لم يبدأ سريان القرار الإداري؛ لا يمنح وصولًا الآن.',
    NOT_CONFIGURED: 'نوع الإتاحة أو مدتها غير مهيأ؛ الوصول مرفوض.',
    NOT_APPROVED: 'لا يوجد قرار إتاحة إداري معتمد.'
  };
  terms.textContent = labels[product.grantState] ?? 'لم تُحمّل حالة الإتاحة.';
  appendRecordedTime(terms, 'موافقة الإتاحة الإدارية (بتوقيت الرياض)', product.approvedAt);
  appendRecordedTime(terms, 'نهاية الإتاحة الإدارية (بتوقيت الرياض)', product.expiresAt);
  // The effective source is server data. It is shown as one of three distinct
  // sources; the UI never converts a grant into a trial or a trial into a licence.
  const sourceLabels: Record<string, string> = { ADMIN_NON_BILLED: 'منحة إدارية غير مفوترة', TRIAL_48H: 'استحقاق تجربة 48 ساعة', LICENSE: 'ترخيص مدفوع' };
  const sourceLine = document.createElement('span');
  sourceLine.textContent = ` · المصدر الساري: ${product.accessSource ? sourceLabels[product.accessSource] ?? 'غير معروف' : 'لا مصدر إتاحة ساري'}${product.accessSources?.administrative?.evidence === 'MISSING_APPROVAL_REFERENCE' ? ' · مرجع اعتماد المنحة غير مسجل' : ''}`;
  terms.append(sourceLine);
  const commercial = card.querySelector('[data-product-commercial]')!;
  const details = product.trialDetails ?? {};
  const trialLabel = trialStateLabels[details.status] ?? 'غير مهيأة';
  commercial.textContent = `التجربة: ${trialLabel} · الاشتراك: غير مهيأ · الترخيص المحلي: غير مهيأ. لا تحويل تلقائي ولا خصم ولا تجديد.`;
  appendRecordedTime(commercial, 'قرار الأهلية', details.decided_at);
  appendRecordedTime(commercial, 'بداية التجربة من وقت التفعيل', details.activated_at);
  appendRecordedTime(commercial, 'نهاية التجربة', details.expires_at);
}
function setLoginError(input: HTMLInputElement | null | undefined, error: HTMLElement | null | undefined, message = '') {
  if (!input || !error) return;
  error.textContent = message; error.hidden = !message;
  input.setAttribute('aria-invalid', message ? 'true' : 'false');
  input.setAttribute('aria-describedby', error.id);
}
function renderTrialSummary(trial: any) {
  const target = root.querySelector<HTMLElement>('[data-trial-summary]');
  if (!target) return;
  const state = trial?.state ?? 'NOT_CONFIGURED';
  target.textContent = `حالة التجربة: ${trialStateLabels[state] ?? 'غير معروفة'}. الطلب لا ينشئ ترخيصًا، والموافقة لا تبدأ العداد، والتفعيل فقط يبدأ 48 ساعة من activated_at.`;
  appendRecordedTime(target, 'قرار الأهلية', trial?.decidedAt);
  appendRecordedTime(target, 'بداية التفعيل', trial?.activatedAt);
  appendRecordedTime(target, 'الانتهاء', trial?.expiresAt);
  if (trial?.exit?.state && trial.exit.state !== 'NOT_APPLICABLE') {
    const exit = document.createElement('span');
    exit.textContent = ` · الخروج/الحذف: ${trial.exit.deletionExecuted === true ? 'منفذ موثق' : 'سياسة معلقة، لم يُنفذ حذف'}`;
    target.append(exit);
  }
}
function clearPrivate() {
  currentTenant = null; invitationConfig = null;
  invitationForm.hidden = true; linkPanel.hidden = true; incomingPanel.hidden = true;
  root.querySelector('[data-invitations]')!.replaceChildren();
  root.querySelector('[data-incoming]')!.replaceChildren();
  nativeOrganizations.replaceChildren();
  adminStatus.textContent = '';
  root.querySelector('[data-policy-state]')!.textContent='غير مهيأ';
  root.querySelector('[data-policy-count]')!.textContent='لم تُحمّل حالة السياسات.';
  root.querySelector('[data-policy-detail]')!.textContent='حالة مخطط السياسات غير محمّلة؛ لا يُدّعى تفعيل الهرمية.';
  root.querySelector<HTMLElement>('[data-policy-console]')!.hidden=true;
  root.querySelector('[data-policy-list]')!.replaceChildren();
  const tenantName = root.querySelector<HTMLElement>('[data-tenant-name]')!;
  const emptyTenant = document.createElement('bdi'); emptyTenant.dir = 'auto'; emptyTenant.textContent = 'لا توجد مساحة محمّلة'; tenantName.replaceChildren(emptyTenant);
  root.querySelector('[data-tenant-detail]')!.textContent = 'تظهر البيانات بعد التحقق من العضوية.';
  root.querySelector('[data-selector]')!.setAttribute('hidden', '');
  root.querySelector('[data-selector-note]')!.textContent = '';
  selector.replaceChildren(); create.hidden = true;
  root.querySelector('[data-connection]')!.textContent = 'لم يُتحقق من الربط';
  const dashboardUpdated = root.querySelector<HTMLElement>('[data-dashboard-updated]')!;
  dashboardUpdated.hidden = true; dashboardUpdated.textContent = '';
  dashboardError.hidden = true; dashboardErrorType.textContent = '';
  metrics.hidden = true;
  membersList.replaceChildren(); memberCount.textContent = ''; membersState.textContent = 'تُحمّل الأعضاء بعد التحقق من العضوية.';
  departmentsPanel.hidden = true; departmentsList.replaceChildren(); departmentsState.textContent = 'تُحمّل الإدارات بعد التحقق من العضوية.';
  activityList.replaceChildren(); activityState.textContent = 'تُحمّل الأنشطة بعد التحقق من العضوية.';
  root.querySelector('[data-evidence-summary]')!.textContent = 'ملخص السجلات غير محمّل.';
  const trialSummary = root.querySelector<HTMLElement>('[data-trial-summary]');
  if (trialSummary) trialSummary.textContent = 'حالة التجربة غير محمّلة؛ لا تفعيل ذاتي ولا تحويل تلقائي.';
  root.querySelectorAll<HTMLElement>('[data-product]').forEach(card => {
    card.querySelector<HTMLElement>('[data-product-admin]')!.hidden = true;
    card.querySelector('[data-product-admin]')!.replaceChildren();
    card.querySelector('[data-product-setup]')!.textContent = 'حالة الإعداد غير محمّلة.';
    card.querySelector('[data-product-terms]')!.textContent = 'الإتاحة غير محمّلة.';
    card.querySelector('[data-product-commercial]')!.textContent = 'الاشتراك والترخيص وتجربة 48 ساعة غير مهيّأة.';
    card.querySelector('[data-product-status]')!.textContent = 'الإتاحة غير محمّلة';
    const button = document.createElement('button'); button.disabled = true; button.textContent = 'لم يجهز بعد';
    card.querySelector('[data-product-action]')!.replaceChildren(button);
  });
}
const errorTitles: Record<string, string> = {
  FORBIDDEN: 'لا تملك صلاحية لهذه المؤسسة',
  NO_WORKSPACE: 'لا توجد مؤسسة محددة',
  INVALID_WORKSPACE: 'اختيار المؤسسة غير صالح',
  KERNEL_ADMIN_SETUP_REQUIRED: 'إدارة Kernel غير مهيأة',
  KERNEL_SCHEMA_MISSING: 'مخطط Kernel غير مطبّق',
  DB_PRIVILEGE_UNAVAILABLE: 'صلاحية قاعدة البيانات غير متاحة',
  DB_UNAVAILABLE: 'قاعدة البيانات غير متاحة مؤقتًا',
  AUTH_UNAVAILABLE: 'خدمة الدخول غير متاحة مؤقتًا',
  AUTH_SETUP_REQUIRED: 'إعداد الدخول غير مكتمل',
  RATE_LIMITED: 'طلبات كثيرة في وقت قصير',
  WORKSPACE_LIMIT: 'بلغت حد المساحات',
};
function showError(message: string, unauthorized = false, type = '') {
  // A rejected workspace selector is discarded so a retry reads the account's own
  // memberships; the URL is never treated as authority in either case.
  if (type === 'FORBIDDEN' || type === 'INVALID_WORKSPACE') setWorkspace('');
  clearPrivate(); title.textContent = unauthorized ? 'يلزم تسجيل الدخول' : errorTitles[type] ?? 'تعذر تحميل المساحة';
  status.textContent = message; retry.hidden = false;
  if (type) { dashboardError.hidden = false; dashboardErrorType.textContent = type; }
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
  if (!response.ok) { const e = new Error(data.message); Object.assign(e, { unauthorized: response.status === 401, code: data.code, dependencyStatus: data.dependencyStatus, status: response.status }); throw e; }
  return data;
}
function renderDepartments(departments: any) {
  departmentsList.replaceChildren();
  departmentsPanel.hidden = false;
  if (!departments?.available) {
    departmentsState.textContent = 'مخطط الإدارات غير مطبّق على هذه البيئة؛ لا تظهر بيانات إدارات.';
    return;
  }
  if (!departments.rows?.length) {
    departmentsState.textContent = departments.canManage ? 'لا توجد إدارات في هذه المؤسسة بعد. تُنشأ من لوحة السياسات.' : 'لست عضوًا نشطًا في أي إدارة لهذه المؤسسة.';
    return;
  }
  departmentsState.textContent = departments.canManage
    ? 'عضوية الإدارات تُدار من لوحة السياسات؛ التعديل خادمي وليس من هذه القائمة.'
    : 'تظهر الإدارات التي تنتمي إليها فقط؛ لا تُعرض عضوية إدارات أخرى.';
  for (const department of departments.rows) {
    const item = document.createElement('li');
    const identity = document.createElement('div');
    const name = document.createElement('strong'); name.dir = 'auto'; name.textContent = department.name;
    identity.append(name);
    const members = (department.members ?? []).filter((member: any) => member.status === 'ACTIVE');
    const detail = document.createElement('span');
    detail.textContent = departments.canManage
      ? `${members.length} عضو نشط${members.length ? ` · ${members.map((member: any) => member.name).join('، ')}` : ''}`
      : 'عضويتك نشطة في هذه الإدارة';
    const status = document.createElement('span'); status.className = `role${department.status === 'ACTIVE' ? '' : ' warn'}`; status.textContent = department.status === 'ACTIVE' ? 'إدارة نشطة' : 'إدارة موقوفة';
    item.append(identity, status, detail);
    departmentsList.append(item);
  }
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
    if (data.canManage && row.canCancel) {
      const cancel = document.createElement('button'); cancel.type = 'button'; cancel.textContent = 'إلغاء الدعوة';
      cancel.addEventListener('click', () => void adminRun(async () => {
        if (!window.confirm(`إلغاء دعوة ${row.email ?? 'هذا البريد'}؟ لن تُمنح عضوية من هذه الدعوة.`)) return;
        // Provider cancellation happens first; the server then confirms and audits it.
        const native = await auth.organization.cancelInvitation({ invitationId: row.id });
        if (native.error) throw new Error('تعذر إلغاء الدعوة لدى Neon Auth؛ قد تكون مقبولة أو منتهية. حدّث القائمة.');
        await endpoint('members','POST',{operation:'cancel',invitationId:row.id},currentTenant?.tenant_id);
        await load(currentTenant?.tenant_id); adminStatus.textContent = 'أُلغيت الدعوة لدى Auth وسُجل الإلغاء في Kernel.';
      }));
      li.append(cancel);
    }
    invitations.append(li);
  }
  renderDepartments(data.departments);
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
    if (data.canManage && member.isSelf) {
      const selfNote = document.createElement('span'); selfNote.className = 'role-note';
      selfNote.textContent = 'لا يمكنك تغيير دورك بنفسك؛ يلزم عضو آخر مخوّل.';
      item.append(selfNote);
    }
    if (data.canManage && member.userId && !member.isSelf && (member.role !== 'OWNER' || currentTenant?.role === 'OWNER')) {
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
      revoke.addEventListener('click', () => void adminRun(async () => {
        if (!window.confirm(`سحب عضوية ${member.name} يمنع وصوله إلى Kernel لهذه المؤسسة. هل تريد المتابعة؟`)) return;
        await endpoint('members','POST',{operation:'revoke',userId:member.userId},currentTenant.tenant_id);
        await load(currentTenant.tenant_id); adminStatus.textContent = 'تم سحب عضوية Kernel؛ لم تتغير عضوية Neon Auth.';
      }));
      actions.append(roleSelect, saveRole, revoke);
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
  const intent = root.querySelector<HTMLElement>('[data-product-intent]');
  if (intent) intent.textContent = data.tenant
    ? 'راجع صلاحيات المنتج مع مسؤول المؤسسة، أو اختر مؤسسة أخرى من قائمتك، أو تواصل لطلب تقييم.'
    : 'اطلب الانضمام إلى مؤسسة من مسؤولها؛ إنشاء الحساب وحده لا يمنح وصولًا إلى المنتج.';
  dashboardError.hidden = true; dashboardErrorType.textContent = '';
  currentTenant = data.tenant;
  if (data.tenant) setWorkspace(data.tenant.tenant_id);
  retry.hidden = true; logout.hidden = false; if (login) login.hidden = true;
  title.textContent = data.tenant ? 'مساحة العمل متصلة' : 'أنشئ مساحة عملك الأولى';
  status.textContent = data.tenant ? 'تم التحقق من الهوية والعضوية وتحميل بيانات المؤسسة.' : 'لا توجد عضويات لهذا الحساب. يمكنك إنشاء مؤسسة جديدة.';
  const policyState = data.policyEngine?.state ?? 'NOT_CONFIGURED';
  const policyLabels: Record<string,string> = { NOT_CONFIGURED:'غير مهيأ',NO_PUBLISHED_POLICIES:'لا توجد سياسات منشورة',CONFIGURED:'مخطط وسياسات منشورة' };
  root.querySelector('[data-policy-state]')!.textContent=policyLabels[policyState] ?? 'حالة غير معروفة';
  root.querySelector('[data-policy-count]')!.textContent=`سياسات منشورة: ${data.policyEngine?.publishedPolicies ?? 0} · إدارات: ${data.policyEngine?.departments ?? 0}`;
  root.querySelector('[data-policy-detail]')!.textContent=policyState==='CONFIGURED'
    ? 'توجد نسخ منشورة ضمن المؤسسة؛ يمر مسار Firewall المحمي بتقييم Kernel الخادمي قبل أي تمرير. يظل التحقق من صلاحية المخطط وRLS والتشغيل الفعلي مطلوبًا.'
    : policyState==='NO_PUBLISHED_POLICIES'
      ? 'المخطط موجود لكن لا توجد سياسة منشورة؛ مسار التنفيذ المحمي يتوقف آمنًا حتى النشر.'
      : 'مخطط السياسات غير موجود في قاعدة البيانات الحالية؛ مسار التنفيذ المحمي لا يمر إلى مزود عند غياب التقييم.';
  const policyConsole=root.querySelector<HTMLElement>('[data-policy-console]')!;
  policyConsole.hidden=!data.tenant||!['OWNER','ADMIN'].includes(data.tenant.role);
  root.querySelector<HTMLElement>('[data-policy-department-tools]')!.hidden=data.tenant?.role!=='OWNER';
  root.querySelector<HTMLFormElement>('[data-policy-create]')!.hidden=data.tenant?.role!=='OWNER';
  root.querySelector('[data-connection]')!.textContent = data.system?.connection === 'CONNECTED' ? 'Auth + DB · متصل' : 'تعذر تأكيد الاتصال';
  const dashboardUpdated = root.querySelector<HTMLElement>('[data-dashboard-updated]')!;
  const dashboardDate = new Date(data.system?.updatedAt);
  dashboardUpdated.hidden = Number.isNaN(dashboardDate.getTime());
  if (!dashboardUpdated.hidden) dashboardUpdated.textContent = `آخر تحديث لبيانات المؤسسة: ${new Intl.DateTimeFormat('ar-SA', { timeZone: 'Asia/Riyadh', dateStyle: 'medium', timeStyle: 'short' }).format(dashboardDate)}`;
  // Any authenticated account may start its own organization; this does not copy the
  // selected tenant's members, roles, policies or access approvals.
  create.hidden = false;
  const tenantName = root.querySelector<HTMLElement>('[data-tenant-name]')!;
  const tenantDisplay = document.createElement('bdi'); tenantDisplay.dir = 'auto'; tenantDisplay.textContent = data.tenant?.name ?? 'لا توجد مؤسسة بعد'; tenantName.replaceChildren(tenantDisplay);
  root.querySelector('[data-tenant-detail]')!.textContent = data.tenant ? `العضوية موثقة · الدور: ${roleNames[data.tenant.role] ?? 'غير معروف'} · تاريخ الإنشاء: ${date(data.tenant.created_at)}` : 'لا توجد عضوية لهذه المؤسسة. إنشاء المساحة لا يفعّل المنتجات أو الاشتراك.';
  selector.replaceChildren(...data.memberships.map((m: any) => { const option = document.createElement('option'); option.value = m.tenant_id; option.textContent = m.name; option.selected = m.tenant_id === data.tenant?.tenant_id; return option; }));
  (root.querySelector('[data-selector]') as HTMLElement).hidden = !data.memberships.length;
  root.querySelector('[data-selector-note]')!.textContent = data.memberships.length > 1 ? `لديك عضوية في ${data.memberships.length} مؤسسات؛ تُحمّل بيانات المؤسسة المختارة فقط.` : '';
  metrics.hidden = !data.tenant;
  if (data.tenant) {
    root.querySelector('[data-metric="members"]')!.textContent = data.summary?.members == null ? 'لا بيانات' : String(data.summary.members);
    root.querySelector('[data-metric="coverage"]')!.textContent = data.summary?.coverage ? `${data.summary.coverage.enabled} / ${data.summary.coverage.total}` : 'لا بيانات';
    root.querySelector('[data-metric="events"]')!.textContent = data.summary?.events == null ? 'لا بيانات' : String(data.summary.events);
    renderActivity(data.activity ?? []);
    const evidence = root.querySelector('[data-evidence-summary]')!;
    const pov = data.summary?.proofOfValue;
    evidence.textContent = pov?.status === 'DRAFT_REQUIRES_HUMAN_REVIEW'
      ? `مسودة Proof of Value من سجل تدقيق Kernel: ${pov.totals?.events ?? 0} حدثًا ضمن نافذة التجربة. لا تتضمن محتوى عميل ولا نسبة إنجاز، وتحتاج مراجعة بشرية.`
      : `أحداث Kernel المحتفظ بها: ${data.summary?.events ?? 0}. تقرير Proof of Value: ${trialStateLabels[pov?.status] ?? (pov?.status === 'NOT_CONFIGURED' ? 'غير مهيأ' : pov?.status ?? 'غير متاح')}.`;
    appendRecordedTime(evidence, 'بداية نافذة PoV', pov?.activatedAt);
    appendRecordedTime(evidence, 'نهاية نافذة PoV', pov?.closedAt ?? pov?.expiresAt);
    renderTrialSummary(data.trialLifecycle);
  }
  for (const p of data.products) {
    const card = root.querySelector<HTMLElement>(`[data-product="${p.slug}"]`);
    if (!card) continue;
    card.querySelector('[data-product-status]')!.textContent = p.label;
    card.querySelector('[data-product-setup]')!.textContent = p.setupMessage ?? 'اختر مؤسسة لعرض حالة الإعداد.';
    renderProductTerms(card, p);
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
      const blocked = document.createElement('button'); blocked.type = 'button'; blocked.disabled = true; blocked.textContent = p.state === 'DISABLED' ? 'معطّل' : p.state === 'EXPIRED' ? 'انتهت الإتاحة' : p.state === 'REVOKED' ? 'أُلغي القرار' : p.state === 'NOT_CONFIGURED' ? 'غير مهيأ — لا قرار إتاحة' : !p.enabled ? 'يلزم تمكين معتمد' : 'الإعداد غير مكتمل';
      action.replaceChildren(blocked);
    }
  }
}
const policyScope = root.querySelector<HTMLSelectElement>('#policy-scope')!;
const policyDepartments = root.querySelector<HTMLSelectElement>('[data-policy-department]')!;
const policyProduct = root.querySelector<HTMLSelectElement>('[data-policy-product]')!;
const policyUser = root.querySelector<HTMLSelectElement>('[data-policy-user]')!;
function updatePolicyScopeFields() {
  const scope=policyScope.value;
  root.querySelector<HTMLElement>('[data-policy-department-field]')!.hidden=scope!=='DEPARTMENT';
  root.querySelector<HTMLElement>('[data-policy-product-field]')!.hidden=scope!=='PRODUCT';
  root.querySelector<HTMLElement>('[data-policy-user-field]')!.hidden=scope!=='USER';
  policyDepartments.required=scope==='DEPARTMENT'; policyProduct.required=scope==='PRODUCT'; policyUser.required=scope==='USER';
}
async function loadPolicyConsole(team?: any) {
  const section=root.querySelector<HTMLElement>('[data-policy-console]')!;
  const state=section.querySelector<HTMLElement>('[data-policy-console-state]')!;
  if (section.hidden||!currentTenant) return;
  state.textContent='جارٍ تحميل السياسات والإدارات…';
  try {
    const data=await endpoint('policies', 'GET', undefined, currentTenant.tenant_id);
    const activeMembers=(team?.members??[]).filter((m:any)=>m.userId&&m.status==='ACTIVE');
    const people=[new Option('اختر عضوًا',''),...activeMembers.map((m:any)=>new Option(`${m.name} · ${m.roleLabel} · ${m.userId}`,m.userId))];
    policyUser.replaceChildren(...people.map((o:HTMLOptionElement)=>o.cloneNode(true) as HTMLOptionElement));
    root.querySelector<HTMLSelectElement>('[data-department-user]')!.replaceChildren(...people.map((o:HTMLOptionElement)=>o.cloneNode(true) as HTMLOptionElement));
    root.querySelector<HTMLSelectElement>('[data-policy-delegate-user]')!.replaceChildren(new Option('اختر مديرًا',''),...activeMembers.filter((m:any)=>m.role==='ADMIN').map((m:any)=>new Option(`${m.name} · ${m.userId}`,m.userId)));
    const list=section.querySelector<HTMLElement>('[data-policy-list]')!; list.replaceChildren();
    const departments=data.departments ?? [];
    const deptOptions=[new Option('اختر إدارة',''),...departments.map((d:any)=>new Option(d.name,d.id))];
    policyDepartments.replaceChildren(...deptOptions.map((o:HTMLOptionElement)=>o.cloneNode(true) as HTMLOptionElement));
    root.querySelector<HTMLSelectElement>('[data-department-member-ref]')!.replaceChildren(...deptOptions.map((o:HTMLOptionElement)=>o.cloneNode(true) as HTMLOptionElement));
    for (const policy of data.policies ?? []) {
      const item=document.createElement('li'), summary=document.createElement('div'), title=document.createElement('strong'), detail=document.createElement('span');
      title.textContent=`${policy.policy_family} · ${policy.scope}`;
      const approvals=`${policy.approvals ?? 0}/${policy.requiredApprovals ?? 1}`;
      detail.textContent=`${policy.rule_key} · ${policy.status ?? 'DRAFT'} · v${policy.version ?? 1} · ${policy.effect ?? '—'}${policy.is_mandatory?' · إلزامية':''} · اعتماد ${approvals}`;
      summary.append(title,detail); item.append(summary);
      const actions=document.createElement('div'); actions.className='member-actions';
      const addAction=(label:string,operation:string)=>{
        const button=document.createElement('button'); button.type='button'; button.textContent=label;
        button.addEventListener('click',()=>void adminRun(async()=>{
          const why=window.prompt('اكتب سبب الإجراء (3–500 حرفًا):'); if (!why||why.trim().length<3) return;
          const payload:any={operation,policyId:policy.id,version:policy.version,reason:why.trim()};
          if(operation==='publish') payload.expectedVersion=policy.current_version;
          const response:any=await endpoint('policies','POST',payload,currentTenant?.tenant_id);
          await loadPolicyConsole();
          state.textContent=operation==='approve'&&response?.status==='IN_REVIEW'
            ? `سُجل اعتمادك (${response.approvals}/${response.requiredApprovals})؛ النسخة تبقى قيد المراجعة حتى يكتمل العدد.`
            : `تم تنفيذ الإجراء: ${label}.`;
        })); actions.append(button);
      };
      // Affordances come from server-side role, separation-of-duties and data state, not
      // from the browser role. The same rules are rechecked when the request arrives.
      if(policy.canSubmit) addAction('إحالة للمراجعة','submit');
      if(policy.canApprove) addAction('اعتماد النسخة','approve');
      if(policy.canWithdraw) addAction('سحب إلى مسودة','withdraw');
      if(policy.canPublish) addAction('نشر النسخة','publish');
      if(policy.canRetire) addAction('إيقاف النسخة','retire');
      if(!actions.childElementCount&&['DRAFT','IN_REVIEW','APPROVED'].includes(policy.status)){
        const note=document.createElement('span'); note.className='role-note';
        note.textContent=policy.status==='IN_REVIEW'?'لا يظهر إجراء متاح لهذه النسخة: يلزم معتمد مستقل أو اكتمال عدد المراجعين.':policy.status==='APPROVED'?'النشر يلزمه مالك مختلف عن المنشئ والمعتمدين.':'لا يملك دورك إجراءً على هذه النسخة.';
        actions.append(note);
      }
      if(actions.childElementCount) item.append(actions);
      list.append(item);
    }
    if(!(data.policies ?? []).length){const empty=document.createElement('li');empty.textContent='لا توجد سياسات بعد. أنشئ مسودة من النموذج أدناه.';list.append(empty);}
    const members=data.departmentMembers ?? [];
    const departmentDetails=document.createElement('li'); departmentDetails.textContent=`الإدارات: ${departments.length} · عضويات الإدارات: ${members.filter((m:any)=>m.status==='ACTIVE').length}`; list.append(departmentDetails);
    for(const grant of data.delegations ?? []){
      const item=document.createElement('li'), detail=document.createElement('span');
      detail.textContent=`تفويض اعتماد · ${grant.delegate_user_id} · ${grant.revoked_at?'ملغى':new Date(grant.expires_at).toLocaleDateString('ar-SA')}`; item.append(detail);
      if(currentTenant?.role==='OWNER'&&!grant.revoked_at){const button=document.createElement('button');button.type='button';button.textContent='إلغاء التفويض';button.addEventListener('click',()=>void adminRun(async()=>{const reason=window.prompt('اكتب سبب إلغاء التفويض:');if(!reason||reason.trim().length<3)return;await endpoint('policies','POST',{operation:'revoke-approver',userId:grant.delegate_user_id,reason:reason.trim()},currentTenant?.tenant_id);await loadPolicyConsole();}));item.append(button);}
      list.append(item);
    }
    state.textContent=currentTenant.role==='ADMIN'?'تظهر السياسات للمراجعة فقط؛ يلزم تفويض اعتماد ساري.':'تُعرض سياسات هذه المؤسسة فقط.';
  } catch(error:any) { state.textContent=`تعذر تحميل واجهة السياسات (${error.code??'REQUEST_FAILED'}): ${error.message??'أعد المحاولة.'}`; }
}
policyScope.addEventListener('change',updatePolicyScopeFields); updatePolicyScopeFields();
root.querySelector('[data-policy-refresh]')!.addEventListener('click',()=>void loadPolicyConsole());
root.querySelector<HTMLFormElement>('[data-policy-create]')!.addEventListener('submit',event=>{
  event.preventDefault(); const form=event.currentTarget as HTMLFormElement, values=new FormData(form), scope=String(values.get('scope')), operation=String(values.get('operation')??'').trim();
  const definition:any={scope,family:String(values.get('family')).trim(),ruleKey:String(values.get('ruleKey')).trim(),effect:String(values.get('effect')),obligations:[],mandatory:String(values.get('effect'))==='HARD_DENY',requiredApprovals:Number(values.get('requiredApprovals')??1),conditions:operation?{operation}: {},reason:String(values.get('reason')).trim()};
  if(scope==='DEPARTMENT') definition.departmentId=String(values.get('departmentId'));
  if(scope==='PRODUCT') definition.productSlug=String(values.get('productSlug'));
  if(scope==='USER') definition.userId=String(values.get('userId')).trim();
  void adminRun(async()=>{await endpoint('policies','POST',{operation:'create',definition},currentTenant?.tenant_id);form.reset();updatePolicyScopeFields();await loadPolicyConsole();});
});
root.querySelector<HTMLFormElement>('[data-department-create]')!.addEventListener('submit',event=>{event.preventDefault();const form=event.currentTarget as HTMLFormElement,values=new FormData(form);void adminRun(async()=>{await endpoint('policies','POST',{operation:'department-create',name:String(values.get('name')).trim(),reason:String(values.get('reason')).trim()},currentTenant?.tenant_id);form.reset();await loadPolicyConsole();});});
root.querySelector<HTMLFormElement>('[data-department-member]')!.addEventListener('submit',event=>{event.preventDefault();const form=event.currentTarget as HTMLFormElement,values=new FormData(form);void adminRun(async()=>{await endpoint('policies','POST',{operation:'department-member-add',departmentId:String(values.get('departmentId')),userId:String(values.get('userId')).trim(),reason:String(values.get('reason')).trim()},currentTenant?.tenant_id);form.reset();await loadPolicyConsole();});});
root.querySelector('[data-department-member-remove]')!.addEventListener('click',()=>{const form=root.querySelector<HTMLFormElement>('[data-department-member]')!,values=new FormData(form),reason=window.prompt('اكتب سبب إيقاف عضوية الإدارة:');if(!reason||reason.trim().length<3)return;void adminRun(async()=>{await endpoint('policies','POST',{operation:'department-member-remove',departmentId:String(values.get('departmentId')),userId:String(values.get('userId')).trim(),reason:reason.trim()},currentTenant?.tenant_id);await loadPolicyConsole();});});
root.querySelector<HTMLFormElement>('[data-policy-delegate]')!.addEventListener('submit',event=>{event.preventDefault();const form=event.currentTarget as HTMLFormElement,values=new FormData(form);void adminRun(async()=>{const expiry=new Date(String(values.get('expiresAt')));await endpoint('policies','POST',{operation:'delegate-approver',userId:String(values.get('userId')).trim(),expiresAt:expiry.toISOString(),reason:String(values.get('reason')).trim()},currentTenant?.tenant_id);form.reset();await loadPolicyConsole();});});
async function load(workspace?: string) {
  workspace ||= selectedWorkspace();
  clearPrivate();
  const session = await getWorkspaceSession(auth);
  if (session.error) { const error = new Error('تعذر استعادة جلسة الدخول؛ سجّل الدخول مجددًا أو أعد المحاولة.'); Object.assign(error, { unauthorized: true }); throw error; }
  if (!session.data?.user) { showError('سجّل الدخول بحسابك لعرض مساحة العمل.', true); logout.hidden = true; return; }
  const data = await api('GET', undefined, workspace);
  if (authorizedProductDestination(root.dataset.returnTo, data)) {
    location.replace(authorizedProductDestination(root.dataset.returnTo, data)!); return;
  }
  render(data);
  await loadIncoming();
  let policyTeam:any=null;
  if (data.tenant) {
    try { policyTeam=await members(data.tenant.tenant_id); await renderMembers(policyTeam); }
    catch (error: any) { membersState.textContent = error.message || 'تعذر تحميل الأعضاء.'; }
  } else {
    membersState.textContent = 'لا توجد مؤسسة بعد؛ أنشئ مساحة عمل لعرض الأعضاء.';
    activityState.textContent = 'لا توجد مؤسسة بعد.';
  }
  await loadPolicyConsole(policyTeam);
}
async function health() {
  healthList.replaceChildren();
  const pending = document.createElement('li'); pending.textContent = 'جارٍ فحص الدخول والقاعدة…'; healthList.append(pending);
  healthError.hidden = true; healthErrorType.textContent = '';
  try {
    const response = await fetch('/app/api/kernel/health/', { cache: 'no-store' });
    const data = await response.json();
    const overall = healthOverall[data.state] ?? healthOverall.degraded;
    const summary = document.createElement('li'); summary.className = `health-summary ${overall.tone}`;
    summary.textContent = `حالة Kernel: ${overall.text}`;
    const rows = [
      ...Object.entries(data.checks ?? {}),
      ...Object.entries(data.configuration ?? {}).map(([key, value]) => [`configuration_${key}`, value]),
    ];
    healthList.replaceChildren(summary, ...rows.map(([key, value]) => {
      const item = document.createElement('li');
      const label = document.createElement('span'); label.textContent = healthNames[key] ?? key;
      const state = healthStates[String(value)] ?? { text: 'حالة غير معروفة', tone: 'muted' };
      const badge = document.createElement('b'); badge.className = `health-state ${state.tone}`; badge.textContent = state.text;
      item.append(label, badge); return item;
    }));
    const checkedAt = new Date(data.updatedAt);
    healthUpdated.textContent = Number.isNaN(checkedAt.getTime()) ? 'وقت آخر تحديث غير متاح.' : `آخر تحديث من الخادم: ${new Intl.DateTimeFormat('ar-SA', { timeZone: 'Asia/Riyadh', dateStyle: 'medium', timeStyle: 'short' }).format(checkedAt)}`;
    if (data.errorType) { healthError.hidden = false; healthErrorType.textContent = data.errorType; }
    if (!response.ok && !data.errorType) { healthError.hidden = false; healthErrorType.textContent = `HTTP_${response.status}`; }
  } catch (error) {
    const failed = document.createElement('li'); failed.textContent = 'فشل اتصال الشبكة؛ تعذر قراءة حالة التشغيل. أعد المحاولة.'; healthList.replaceChildren(failed);
    healthUpdated.textContent = 'لم يصل تحديث جديد من الخادم.';
    healthError.hidden = false;
    healthErrorType.textContent = error instanceof TypeError ? 'NETWORK_ERROR' : 'HEALTH_RESPONSE_UNAVAILABLE';
  }
}
async function run(task: () => Promise<void>) {
  if (busy) return; busy = true; root.setAttribute('aria-busy', 'true');
  root.querySelectorAll<HTMLButtonElement | HTMLSelectElement | HTMLInputElement>('button,select,input').forEach(b => b.disabled = true);
  status.textContent = 'جارٍ تحميل المساحة…';
  try { await task(); } catch (error: any) { showError(error instanceof TypeError ? 'تعذر الاتصال بالخادم. افحص الشبكة ثم أعد المحاولة.' : error.message || 'تعذر تحميل مساحة العمل. أعد المحاولة.', !!error.unauthorized, error instanceof TypeError ? 'NETWORK_ERROR' : error.code ?? 'REQUEST_FAILED'); }
  finally { busy = false; root.removeAttribute('aria-busy'); root.querySelectorAll<HTMLButtonElement | HTMLSelectElement | HTMLInputElement>('button,select,input').forEach(b => b.disabled = false);
    root.querySelectorAll<HTMLButtonElement>('[data-product-action] button').forEach(b => b.disabled = true); }
}
async function endpoint(path: string, method = 'GET', body?: object, workspace?: string) {
  const response = await appFetch(auth, `/app/api/kernel/${path}/${workspace ? `?workspace=${encodeURIComponent(workspace)}` : ''}`, {
    method, ...(body ? {headers:{'Content-Type':'application/json'},body:JSON.stringify(body)} : {})
  });
  let data: any; try { data = await response.json(); } catch { throw new Error('الخدمة غير متاحة؛ لم يُؤكد الحفظ.'); }
  if (!response.ok) throw Object.assign(new Error(data.message || 'تعذر إكمال الطلب.'), {unauthorized: response.status === 401, code: data.code, dependencyStatus: data.dependencyStatus, status: response.status});
  return data;
}
const dependencyLabels: Record<string, string> = {
  available: 'متاحة',
  'not configured': 'غير مهيأة',
  degraded: 'متعطلة جزئيًا',
  blocked: 'موقوفة',
  'access denied': 'صلاحية مرفوضة',
  expired: 'منتهية',
  'temporarily unavailable': 'غير متاحة مؤقتًا',
};
async function adminRun(work: () => Promise<void>) {
  if (busy) return;
  busy = true; root.setAttribute('aria-busy','true');
  root.querySelectorAll<HTMLButtonElement | HTMLSelectElement | HTMLInputElement>('button,select,input').forEach(b => b.disabled = true);
  adminStatus.textContent = 'جارٍ تنفيذ العملية؛ انتظر نتيجة الخادم…';
  try { await work(); }
  catch (error: any) {
    if (error.unauthorized) showError(error.message, true, error.code ?? 'UNAUTHORIZED');
    const type = error instanceof TypeError ? 'NETWORK_ERROR' : error.code ?? 'REQUEST_FAILED';
    const dependency = error.dependencyStatus
      ? ` · التبعية: ${dependencyLabels[error.dependencyStatus] ?? 'حالة غير معروفة'}`
      : '';
    adminStatus.textContent = `${error.message || 'تعذر إكمال العملية؛ لم يُؤكد الحفظ. حدّث البيانات قبل إعادة الإرسال.'} (${type})${dependency}`;
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
            if (error.code === 'INVITATION_EXPIRED') throw new Error('انتهت مدة الدعوة قبل الاعتماد؛ اطلب دعوة جديدة من مالك المؤسسة أو مديرها.');
            if (error.code === 'INVITATION_REVOKED') throw new Error('أُلغيت الدعوة أو رُفضت؛ لم تُمنح عضوية. اطلب دعوة جديدة عند الحاجة.');
            if (error.code === 'INVITATION_ALREADY_CONSUMED') throw new Error('سبق اعتماد الدعوة ثم سُحبت العضوية؛ لا يُعاد منحها من الدعوة نفسها.');
            if (error.code === 'IDENTITY_NOT_VERIFIED') throw new Error('وثّق بريدك الإلكتروني أو استخدم حسابًا غير موقوف ثم أعد المحاولة؛ لم تُمنح عضوية.');
            if (error.code === 'INVALID_INVITATION') throw new Error('الدعوة غير متاحة الآن؛ ربما ألغيت أو سبق قبولها بحساب آخر. حدّث القائمة.');
            if (error.code === 'INVITER_AUTHORITY_REVOKED') throw new Error('توقفت صلاحية الداعي في المؤسسة؛ اطلب دعوة جديدة من مالك أو مدير حالي.');
            if (error.code === 'INVITATION_NOT_ACCEPTED') throw new Error('لم يثبت قبول الدعوة ببريدك الموثّق؛ أكمل خطوة Neon Auth ثم حدّث القائمة.');
            if (error.code === 'INVITATION_BOOTSTRAP_REQUIRED') throw new Error('قبول الدعوة يحتاج مسار تهيئة معتمدًا على هذه البيئة؛ لم تُمنح عضوية.');
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
  // Tenant switching is handled once in workspace-context: the page reloads and the
  // server re-authorizes the selected workspace before any private view is restored.
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
    login.addEventListener('submit', event => { event.preventDefault(); if (!validateLogin()) { (loginEmail.validity.valid ? loginPassword : loginEmail).focus(); login.reportValidity(); return; } const form = new FormData(login); void run(async () => {
      const result = await observeLogin(() => auth.signIn.email({ email: String(form.get('email')).trim(), password: String(form.get('password')) }));
      // One generic message for every credential failure: no account enumeration.
      if (result.error) { setLoginError(loginPassword, loginPasswordError, 'تعذر تسجيل الدخول. تحقق من البريد وكلمة المرور وحاول مرة ثانية.'); const e = new Error('تعذر تسجيل الدخول. تحقق من بياناتك وحاول مرة ثانية.'); Object.assign(e,{unauthorized:true}); throw e; }
      // A second-factor challenge is real provider state, but this portal has no
      // approved MFA/SSO step. Fail closed instead of treating it as a session.
      if ((result.data as unknown as { twoFactorRedirect?: unknown } | null)?.twoFactorRedirect) {
        throw new Error('يتطلب هذا الحساب خطوة تحقق ثانية (MFA/SSO) غير مهيأة في هذه البوابة. لم تُفتح أي مساحة؛ تواصل مع مشغّل المنصة.');
      }
      await load(); login.reset(); loginPassword.type = 'password'; loginPasswordToggle.textContent = 'إظهار كلمة المرور'; loginPasswordToggle.setAttribute('aria-pressed','false'); setLoginError(loginEmail, loginEmailError); setLoginError(loginPassword, loginPasswordError);
    }); });
  }
  create.addEventListener('submit', event => { event.preventDefault(); const name = String(new FormData(create).get('name')); void run(async () => { const data = await api('POST', name); create.reset(); await load(data.tenantId); }); });
  logout.addEventListener('click', () => { pendingInvitationId = ''; registerInvite.hidden = true; clearPrivate(); void run(async () => { const result = await auth.signOut(); if(result.error) throw new Error('تعذر إنهاء جلسة Neon Auth. أعد المحاولة.'); logout.hidden = true; showError('تم تسجيل الخروج.', true); }); });
  // Do not restore private DOM snapshots from the browser history cache.
  window.addEventListener('pagehide', clearPrivate);
  window.addEventListener('pageshow', event => { if(event.persisted) void run(() => load()); });
}
