import { createAuthClient } from '@neon/neon-js/auth';

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
const sendButton = root.querySelector<HTMLButtonElement>('[data-send]')!;
const cancelButton = root.querySelector<HTMLButtonElement>('[data-cancel]')!;
const signOut = root.querySelector<HTMLButtonElement>('[data-sign-out]')!;
const authUrl = root.dataset.authUrl;
const auth = authUrl ? createAuthClient(authUrl) : null;
let controller: AbortController | undefined;
let selectedTenant = '';
let busy = false;

function clearPrivate() {
  chatArea.hidden = true;
  workspaceWrap.hidden = true;
  workspace.replaceChildren();
  message.value = '';
  messageList.replaceChildren();
  sendError.hidden = true;
  sendError.textContent = '';
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
  const session = await auth.getSession();
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
  const response = await fetch(`/app/api/secure-chat/${path}/${query}`, {
    method,
    cache: 'no-store',
    signal,
    headers: { Authorization: `Bearer ${bearer}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.message || 'تعذر إكمال الطلب.');
    Object.assign(error, { status: response.status, unauthorized: response.status === 401 });
    throw error;
  }
  return data;
}

async function load(requested?: string) {
  clearPrivate();
  login.hidden = true;
  const bearer = await token();
  const query = requested ? `?workspace=${encodeURIComponent(requested)}` : '';
  const response = await fetch(`/app/api/kernel/${query}`, { cache: 'no-store', headers: { Authorization: `Bearer ${bearer}` } });
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
  if (access?.state !== 'ENABLED') {
    stateTitle.textContent = 'Secure Chat غير مفعّل';
    status.textContent = 'عضويتك مؤكدة، لكن هذه المؤسسة لم تفعّل المنتج. لا تُتاح واجهة الرسائل أو محتوى الجلسة.';
    return;
  }

  const data = await api('models');
  chatArea.hidden = false;
  login.hidden = true;
  stateTitle.textContent = 'لا يوجد نموذج معتمد ومهيأ';
  status.textContent = data.message;
  root.querySelector('[data-model-status]')!.textContent = data.message;
  model.replaceChildren(new Option('لا يوجد نموذج متاح', ''));
  model.disabled = data.models.length === 0;
}

async function run(task: () => Promise<void>) {
  if (busy) return;
  busy = true;
  root.setAttribute('aria-busy', 'true');
  root.querySelectorAll<HTMLButtonElement>('[data-retry], [data-sign-out], [data-new-chat]').forEach(button => button.disabled = true);
  try { await task(); }
  catch (error) {
    const value = error as Error & { unauthorized?: boolean };
    showError(value.message || 'تعذر الاتصال. لم يصدر رد من نموذج.', value.unauthorized);
  }
  finally {
    busy = false;
    root.removeAttribute('aria-busy');
    root.querySelectorAll<HTMLButtonElement>('[data-retry], [data-sign-out], [data-new-chat]').forEach(button => button.disabled = false);
  }
}

function updateCount() {
  root.querySelector('[data-count]')!.textContent = `${message.value.length} / 4000`;
}

root.querySelector('[data-retry]')!.addEventListener('click', () => void run(() => load(selectedTenant || undefined)));
root.querySelector('[data-new-chat]')!.addEventListener('click', () => {
  controller?.abort();
  message.value = '';
  messageList.replaceChildren();
  root.querySelector<HTMLElement>('[data-empty]')!.hidden = false;
  sendError.hidden = true;
  sendError.textContent = '';
  updateCount();
  message.focus();
});
workspace.addEventListener('change', () => void run(() => load(workspace.value)));
message.addEventListener('input', updateCount);
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
cancelButton.addEventListener('click', () => controller?.abort());
composer.addEventListener('submit', event => {
  event.preventDefault();
  if (!message.value.trim() || controller) return;
  sendError.hidden = true;
  sendError.textContent = '';
  const draft = message.value;
  controller = new AbortController();
  sendButton.disabled = true;
  sendButton.textContent = 'جارٍ التحقق…';
  cancelButton.hidden = false;
  status.textContent = 'جارٍ التحقق من النموذج قبل الإرسال…';
  void api('messages', 'POST', { message: draft, modelId: model.value }, controller.signal)
    .then(data => {
      const userMessage = document.createElement('li');
      userMessage.dataset.role = 'user';
      userMessage.textContent = draft;
      const item = document.createElement('li');
      item.dataset.role = 'assistant';
      item.textContent = data.reply;
      messageList.append(userMessage, item);
      root.querySelector<HTMLElement>('[data-empty]')!.hidden = true;
      message.value = '';
      updateCount();
      status.textContent = 'وصل رد من النموذج.';
    })
    .catch(error => {
      if ((error as Error).name === 'AbortError') {
        sendError.textContent = 'أُوقف الطلب قبل إرسال النص إلى أي مزود.';
        status.textContent = 'أُوقف الطلب.';
      } else {
        const value = error as Error & { unauthorized?: boolean };
        sendError.textContent = `${value.message} مسودتك لم تُحفظ.`;
        sendError.hidden = false;
        status.textContent = 'لم يصل رد من نموذج.';
      }
    })
    .finally(() => {
      controller = undefined;
      sendButton.disabled = false;
      sendButton.textContent = 'إرسال';
      cancelButton.hidden = true;
    });
});

window.addEventListener('pagehide', () => { controller?.abort(); clearPrivate(); });
window.addEventListener('pageshow', event => { if (event.persisted && auth) void run(() => load()); });
if (auth) void run(() => load());
else showError('يلزم إعداد Neon Auth.', true);
