import { createWorkspaceAuth as createAuthClient, getWorkspaceSession, appFetch, setWorkspace } from './workspace-context';

const root = document.querySelector<HTMLElement>('[data-secure-chat]')!;
const status = root.querySelector<HTMLElement>('[data-status]')!;
const stateTitle = root.querySelector<HTMLElement>('[data-state-title]')!;
const login = root.querySelector<HTMLFormElement>('[data-login]')!;
const workspaceWrap = root.querySelector<HTMLElement>('[data-workspace-wrap]')!;
const workspace = root.querySelector<HTMLSelectElement>('[data-workspace]')!;
const chatArea = root.querySelector<HTMLElement>('[data-chat-area]')!;
const composer = root.querySelector<HTMLFormElement>('[data-composer]')!;
const message = root.querySelector<HTMLTextAreaElement>('#chat-message')!;
const model = root.querySelector<HTMLSelectElement>('[data-model]')!;
const messageList = root.querySelector<HTMLOListElement>('[data-messages]')!;
const sendError = root.querySelector<HTMLElement>('[data-send-error]')!;
const sendErrorText = root.querySelector<HTMLElement>('[data-send-error-text]')!;
const retrySend = root.querySelector<HTMLButtonElement>('[data-retry-send]')!;
const sendButton = root.querySelector<HTMLButtonElement>('[data-send]')!;
const cancelButton = root.querySelector<HTMLButtonElement>('[data-cancel]')!;
const signOut = root.querySelector<HTMLButtonElement>('[data-sign-out]')!;
const authUrl = root.dataset.authUrl;
const auth = authUrl ? createAuthClient(authUrl) : null;
let controller: AbortController | undefined;
let selectedTenant = '';
let busy = false;
let available = false;
let activeRequestId = '';
let history: Array<{ role: 'user' | 'assistant'; content: string }> = [];
let epoch = 0;
const consent = root.querySelector<HTMLInputElement>('[data-synthetic]')!;
const usageLabel = root.querySelector<HTMLElement>('[data-usage]')!;
function updateSend() {
  sendButton.disabled = !available || !!controller || busy || !consent.checked || !message.value.trim();
}
function sendingControls(sending: boolean) {
  signOut.disabled = sending;
  root.querySelector<HTMLButtonElement>('[data-retry]')!.disabled = sending;
  workspace.disabled = sending;
  model.disabled = sending || !available;
  message.readOnly = sending;
  root.querySelector<HTMLButtonElement>('[data-new-chat]')!.disabled = sending;
  consent.disabled = sending;
  updateSend();
}
async function requestCancellation() {
  if (!activeRequestId) return;
  try { await api('messages', 'DELETE', { requestId: activeRequestId }); }
  finally { controller?.abort(); }
}


function clearPrivate() {
  epoch++;
  controller?.abort();
  available = false;
  history = [];
  consent.checked = false;
  usageLabel.textContent = 'الرموز الفعلية: غير متاح. التكلفة: غير متاح.';
  updateSend();
  chatArea.hidden = true;
  workspaceWrap.hidden = true;
  workspace.replaceChildren();
  message.value = '';
  messageList.replaceChildren();
  sendError.hidden = true;
  sendErrorText.textContent = '';
  retrySend.hidden = true;
  root.querySelector('[data-role]')!.textContent = '';
  root.querySelector('[data-connection]')!.textContent = 'يلزم التحقق من الدخول';
  selectedTenant = '';
}

function showError(text: string, unauthorized = false) {
  clearPrivate();
  stateTitle.textContent = unauthorized ? 'يلزم تسجيل الدخول' : 'تعذر تحميل مساحة العمل';
  status.textContent = text;
  login.hidden = !unauthorized || !auth;
  signOut.hidden = true;
}

async function token() {
  if (!auth) throw new Error('يلزم إعداد Neon Auth.');
  const session = await getWorkspaceSession(auth);
  const value = session.data?.session?.token;
  if (session.error || !session.data?.user || !value) {
    const error = new Error('سجّل الدخول بحساب Neon Auth لعرض مساحة العمل.');
    Object.assign(error, { unauthorized: true });
    throw error;
  }
  return value;
}

async function api(path: string, method = 'GET', body?: object, signal?: AbortSignal) {
  const bearer = await token();
  const query = selectedTenant ? `?workspace=${encodeURIComponent(selectedTenant)}` : '';
  const response = await appFetch(auth!, `/app/api/secure-chat/${path}/${query}`, {
    method,
    cache: 'no-store',
    signal,
    headers: { Authorization: `Bearer ${bearer}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.message || 'تعذر إكمال الطلب.');
    Object.assign(error, { status: response.status, code: data.code, unauthorized: response.status === 401 });
    throw error;
  }
  return data;
}

async function load(requested?: string) {
  clearPrivate();
  login.hidden = true;
  const bearer = await token();
  const query = requested ? `?workspace=${encodeURIComponent(requested)}` : '';
  const response = await appFetch(auth!, `/app/api/kernel/${query}`, { cache: 'no-store', headers: { Authorization: `Bearer ${bearer}` } });
  const dashboard = await response.json();
  if (!response.ok) {
    const error = new Error(dashboard.message || 'تعذر التحقق من عضوية المؤسسة.');
    Object.assign(error, { status: response.status, unauthorized: response.status === 401 });
    throw error;
  }
  if (!dashboard.tenant) {
    stateTitle.textContent = 'لا توجد عضوية مؤسسة';
    status.textContent = 'أنشئ مساحة العمل من Kernel ثم افتح Secure Chat بعد تفعيل المنتج للمؤسسة.';
    root.querySelector('[data-connection]')!.textContent = 'لا توجد عضوية';
    signOut.hidden = false;
    return;
  }

  selectedTenant = dashboard.tenant.tenant_id;
  setWorkspace(selectedTenant);
  const memberships = dashboard.memberships as Array<{ tenant_id: string; name: string; role: string }>;
  workspace.replaceChildren(...memberships.map(item => {
    const option = document.createElement('option');
    option.value = item.tenant_id;
    option.textContent = item.name;
    option.selected = item.tenant_id === selectedTenant;
    return option;
  }));
  workspaceWrap.hidden = memberships.length < 2;
  root.querySelector('[data-role]')!.textContent = `الدور: ${dashboard.tenant.role}`;
  root.querySelector('[data-connection]')!.textContent = 'تحققت الهوية والعضوية';
  signOut.hidden = false;

  const access = dashboard.products.find((item: { slug: string }) => item.slug === 'secure-chat');
  if (!access?.enabled) {
    stateTitle.textContent = 'Secure Chat غير مفعّل';
    status.textContent = 'عضويتك مؤكدة، لكن هذه المؤسسة لم تفعّل المنتج. لا تُتاح واجهة الرسائل أو محتوى الجلسة.';
    return;
  }

  const data = await api('models');
  applyModelAvailability(data);
  chatArea.hidden = false;
  login.hidden = true;
}

function applyModelAvailability(data: { models: Array<{ id: string; label?: string; region?: string; ready: boolean }>; available: boolean; message: string; policy?: { message: string }; usage?: { configuredMessageCharacters?: number; limits?: Record<string, number | null> } }) {
  available = data.available;
  const previous = model.value;
  const options = data.models.map(item => new Option(`${item.label || item.id} — ${item.region || ''}${item.ready ? '' : ' (غير مهيأ)'}`, item.id));
  model.replaceChildren(...(options.length ? options : [new Option('لا يوجد نموذج متاح', '')]));
  data.models.forEach((item,index) => { options[index].disabled = !item.ready; });
  model.value = data.models.find(item => item.id === previous && item.ready)?.id || data.models.find(item => item.ready)?.id || '';
  model.disabled = !available;
  root.querySelector('[data-policy-note]')!.textContent = data.policy?.message || '';
  const names: Record<string,string> = {userMinute:'طلباتك خلال دقيقة',tenantMinute:'طلبات المؤسسة خلال دقيقة',userDay:'طلباتك خلال 24 ساعة',tenantDay:'طلبات المؤسسة خلال 24 ساعة',tenantTokensDay:'سقف رموز المؤسسة خلال 24 ساعة'};
  root.querySelector('[data-limits]')!.textContent = data.usage?.limits ? Object.entries(data.usage.limits).filter(([,value]) => value !== null).map(([key,value]) => `${names[key]}: ${value}`).join('، ') : 'الحصص غير مفعّلة حتى اعتمادها. التكلفة غير متاحة.';
  updateSend();
  const maxLength = data.usage?.configuredMessageCharacters || 4000;
  message.maxLength = maxLength;
  root.querySelector('[data-count]')!.textContent = `${Array.from(message.value).length} / ${maxLength}`;
  root.querySelector('[data-model-status]')!.textContent = data.message;
  stateTitle.textContent = data.available ? 'النماذج المعتمدة' : 'لا يوجد نموذج معتمد ومهيأ';
  status.textContent = data.message;
}

async function refreshModels() {
  const data = await api('models');
  applyModelAvailability(data);
  sendError.hidden = true;
  retrySend.hidden = true;
}

async function run(task: () => Promise<void>) {
  if (busy || controller) return;
  busy = true;
  root.setAttribute('aria-busy', 'true');
  root.querySelectorAll<HTMLButtonElement>('[data-retry], [data-retry-send], [data-sign-out], [data-new-chat]').forEach(button => button.disabled = true);
  try { await task(); }
  catch (error) {
    const value = error as Error & { unauthorized?: boolean };
    showError(value.message || 'تعذر الاتصال. لم يصدر رد من نموذج.', value.unauthorized);
  }
  finally {
    busy = false;
    root.removeAttribute('aria-busy');
    updateSend();
    root.querySelectorAll<HTMLButtonElement>('[data-retry], [data-retry-send], [data-sign-out], [data-new-chat]').forEach(button => button.disabled = false);
  }
}

function updateCount() {
  root.querySelector('[data-count]')!.textContent = `${Array.from(message.value).length} / ${message.maxLength || 4000}`;
}

root.querySelector('[data-retry]')!.addEventListener('click', () => void run(() => selectedTenant ? refreshModels() : load()));
retrySend.addEventListener('click', () => void run(refreshModels));
root.querySelector('[data-new-chat]')!.addEventListener('click', () => {
  controller?.abort();
  epoch++;
  history = [];
  usageLabel.textContent = 'الرموز الفعلية: غير متاح. التكلفة: غير متاح.';
  message.value = '';
  messageList.replaceChildren();
  root.querySelector<HTMLElement>('[data-empty]')!.hidden = false;
  sendError.hidden = true;
  sendErrorText.textContent = '';
  retrySend.hidden = true;
  updateCount();
  updateSend();
  message.focus();
});
workspace.addEventListener('change', () => void run(() => load(workspace.value)));
message.addEventListener('input', () => { updateCount(); updateSend(); });
consent.addEventListener('change', updateSend);
login.addEventListener('submit', event => {
  event.preventDefault();
  const values = new FormData(login);
  void run(async () => {
    const result = await auth!.signIn.email({ email: String(values.get('email')), password: String(values.get('password')) });
    login.reset();
    if (result.error) {
      const error = new Error('تعذر تسجيل الدخول. تحقق من بيانات الحساب وإعداد Neon Auth.');
      Object.assign(error, { unauthorized: true });
      throw error;
    }
    await load();
  });
});
signOut.addEventListener('click', () => void run(async () => {
  clearPrivate();
  const result = await auth?.signOut();
  if (result?.error) throw new Error('تعذر إنهاء جلسة الدخول. أعد المحاولة.');
  showError('تم تسجيل الخروج.', true);
}));
cancelButton.addEventListener('click', () => {
  cancelButton.disabled = true;
  status.textContent = 'جارٍ طلب إيقاف الاتصال بالمزود…';
  void requestCancellation().catch(() => { status.textContent = 'تعذر تأكيد تسجيل الإلغاء؛ توقف انتظار الواجهة فقط، وقد يكون المزود عالج الطلب.'; });
});
composer.addEventListener('submit', event => {
  event.preventDefault();
  if (!available || !consent.checked || busy || !message.value.trim() || controller) return;
  sendError.hidden = true;
  sendErrorText.textContent = '';
  const draft = message.value;
  const submittedEpoch = epoch;
  const requestId = crypto.randomUUID();
  activeRequestId = requestId;
  controller = new AbortController();
  sendingControls(true);
  sendButton.disabled = true;
  sendButton.textContent = 'جارٍ التحقق…';
  cancelButton.hidden = false;
  status.textContent = 'جارٍ التحقق من النموذج قبل الإرسال…';
  void api('messages', 'POST', { requestId, message: draft, modelId: model.value, history, syntheticAcknowledged: consent.checked }, controller.signal)
    .then(data => {
      if (submittedEpoch !== epoch) return;
      if (typeof data.reply !== 'string' || typeof data.submittedText !== 'string') throw new Error('تعذر تأكيد رد مكتمل من المزود.');
      const userMessage = document.createElement('li');
      userMessage.dataset.role = 'user';
      userMessage.textContent = data.submittedText;
      const item = document.createElement('li');
      item.dataset.role = 'assistant';
      item.textContent = data.reply;
      messageList.append(userMessage, item);
      history.push({ role:'user', content:data.submittedText }, { role:'assistant', content:data.reply });
      // Bounded ephemeral context; only complete turns, no silent partial reply.
      while (history.length > 12 || (history.length > 2 && history.reduce((sum,item) => sum + Array.from(item.content).length,0) > 18000)) history.splice(0,2);
      usageLabel.textContent = data.usage ? `آخر طلب — إدخال: ${data.usage.inputTokens}، إخراج: ${data.usage.outputTokens}، الإجمالي: ${data.usage.totalTokens} رمز. التكلفة: غير متاح.` : 'الرموز الفعلية: غير متاح. التكلفة: غير متاح.';
      root.querySelector<HTMLElement>('[data-empty]')!.hidden = true;
      message.value = '';
      updateCount();
      status.textContent = data.redacted ? 'وصل رد من النموذج بعد تنقيح أولي. السياق المؤقت يقتصر على أحدث الأدوار ضمن الحد التقني.' : 'وصل رد من النموذج. يُرسل أحدث سياق مؤقت ضمن الحد التقني؛ لا يُحفظ المتن.';
    })
    .catch(error => {
      if (submittedEpoch !== epoch) return;
      if ((error as Error).name === 'AbortError') {
        sendErrorText.textContent = 'توقف انتظار الواجهة. قد يكون المزود استلم الطلب واستهلكه؛ لا يُعاد الإرسال تلقائيًا.';
        retrySend.hidden = false;
        sendError.hidden = false;
        status.textContent = 'توقف انتظار الواجهة؛ تحقق من توفر النموذج قبل المحاولة مجددًا.';
      } else {
        const value = error as Error & { unauthorized?: boolean; status?: number };
        if (value.unauthorized || value.status === 403) { showError(value.message, !!value.unauthorized); return; }
        sendErrorText.textContent = `${value.message} بقيت المسودة في الحقل، ولا يُحفظ المتن. أي إرسال جديد طلب مستقل وقد يستهلك من المزود.`;
        retrySend.hidden = false;
        sendError.hidden = false;
        status.textContent = 'لم يصل رد من نموذج.';
      }
    })
    .finally(() => {
      controller = undefined;
      activeRequestId = '';
      sendingControls(false);
      cancelButton.disabled = false;
      sendButton.textContent = 'إرسال';
      cancelButton.hidden = true;
    });
});

window.addEventListener('pagehide', () => { controller?.abort(); clearPrivate(); });
window.addEventListener('pageshow', event => { if (event.persisted && auth) void run(() => load()); });
if (auth) void run(() => load());
else showError('يلزم إعداد Neon Auth.', true);

document.addEventListener('workspace-session-ended', () => { clearPrivate(); status.textContent = 'انتهت الجلسة؛ سجّل الدخول مجددًا من Kernel.'; });
