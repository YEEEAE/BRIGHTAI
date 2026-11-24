import { createWorkspaceAuth, appFetch } from './workspace-context';

type Product = {
  slug: string;
  name: string;
  demo: string;
  status: 'NOT_CONFIGURED' | 'READ_ONLY' | 'UNAVAILABLE';
  providerStatus: 'NOT_CONFIGURED';
  operations: string[];
  remaining: number;
};
type Trial = {
  tenantId: string | null;
  status: 'NOT_STARTED' | 'NOT_CONFIGURED' | 'ACTIVE' | 'EXPIRED';
  expiresAt: string | null;
  remainingSeconds: number;
  products: Product[];
};
const root = document.querySelector<HTMLElement>('[data-trial-home]')!;
const status = root.querySelector<HTMLElement>('[data-trial-status]')!;
const grid = root.querySelector<HTMLElement>('[data-trial-products]')!;
const empty = root.querySelector<HTMLElement>('[data-trial-empty]')!;
const badge = document.getElementById('trial-access-status')!;
const start = root.querySelector<HTMLButtonElement>('[data-trial-start]')!;
const refresh = root.querySelector<HTMLButtonElement>('[data-trial-refresh]')!;
const signin = root.querySelector<HTMLAnchorElement>('[data-trial-signin]')!;
const summary = root.querySelector<HTMLElement>('[data-trial-summary]')!;
const clock = root.querySelector<HTMLElement>('[data-trial-clock]')!;
const auth = root.dataset.authConfigured === 'true' ? createWorkspaceAuth() : null;
const productStatus = {
  NOT_CONFIGURED: 'غير مهيأ',
  READ_ONLY: 'متاح للقراءة فقط',
  UNAVAILABLE: 'غير متاح في مساحة التجربة',
};
const operations: Record<string, string> = {
  dashboard: 'لوحة الحماية', list: 'السجلات', actions: 'المتابعات', history: 'التقييمات',
  revisions: 'النسخ', treatments: 'المعالجات', browse: 'حالة ربط المحادثة والنماذج',
};
let tenant = new URL(location.href).searchParams.get('workspace') || '';
let timer: ReturnType<typeof setInterval>;
let busy = false;
let sessionVersion = 0;
const report = (message: string, unavailable = false) => {
  status.textContent = message;
  badge.dataset.accessStatus = unavailable ? 'unavailable' : 'account';
  badge.textContent = unavailable ? 'غير متاح حاليًا' : 'يتطلب حسابًا';
};

async function api<T>(body?: object): Promise<T> {
  if (!auth) throw new Error('خدمة الدخول غير مهيأة حاليًا.');
  const url = new URL('/app/api/trial/', location.origin);
  if (tenant) url.searchParams.set('workspace', tenant);
  const response = await appFetch(auth, url.href, body
    ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
    : {});
  if (response.status === 401) throw Object.assign(new Error('سجّل الدخول لاستعراض حالة تجربتك.'), { unauthorized: true });
  const data = await response.json().catch(() => null);
  if (!data) throw new Error('تعذر تحميل حالة التجربة. أعد المحاولة.');
  if (!response.ok) {
    throw Object.assign(new Error(data.message || 'تعذر التحقق من التجربة.'), {
      verifyEmail: data.code === 'IDENTITY_NOT_VERIFIED',
      unavailable: response.status >= 500,
    });
  }
  return data;
}

function clear() {
  clearInterval(timer);
  grid.replaceChildren();
  summary.hidden = empty.hidden = start.hidden = signin.hidden = true;
}

async function run(work: (version: number) => Promise<void>, pending = 'جارٍ تحميل مساحة التجربة…') {
  if (busy) return;
  busy = true;
  const version = sessionVersion;
  const buttons = [start, refresh, ...grid.querySelectorAll('button')];
  buttons.forEach(button => { button.disabled = true; });
  grid.setAttribute('aria-busy', 'true');
  status.textContent = pending;
  try {
    await work(version);
    if (version === sessionVersion) refresh.textContent = 'تحديث الحالة';
  } catch (error) {
    if (version !== sessionVersion) return;
    clear();
    const session = error as { unauthorized?: boolean; verifyEmail?: boolean; unavailable?: boolean };
    signin.hidden = !(session?.unauthorized || session?.verifyEmail);
    const message = error instanceof Error && !(error instanceof TypeError)
      ? error.message : 'تعذر الاتصال. أعد المحاولة.';
    report(message, session?.unavailable);
    refresh.textContent = 'إعادة المحاولة';
  } finally {
    busy = false;
    buttons.forEach(button => { button.disabled = false; });
    grid.removeAttribute('aria-busy');
  }
}

function element<K extends keyof HTMLElementTagNameMap>(tag: K, text: string) {
  const node = document.createElement(tag);
  node.textContent = text;
  return node;
}

function setTrialWorkspace(id: string) {
  tenant = id;
  const url = new URL(location.href);
  url.searchParams.set('workspace', id);
  history.replaceState(history.state, '', url);
}

async function load(version: number) {
  const data = await api<Trial>();
  if (version !== sessionVersion) return;
  clear();
  const received = performance.now();
  if (data.tenantId) setTrialWorkspace(data.tenantId);
  start.hidden = data.status !== 'NOT_STARTED';
  const readable = data.products.filter(product => product.status === 'READ_ONLY').length;
  report({
    NOT_STARTED: 'بريدك موثّق. يمكنك بدء تجربة في مساحة مخصصة.',
    NOT_CONFIGURED: 'خدمة التجربة غير مهيأة حاليًا. المختبرات العامة متاحة.',
    ACTIVE: `التجربة نشطة. المنتجات المتاحة للقراءة: ${readable} من ${data.products.length}.`,
    EXPIRED: 'انتهت مدة التجربة. المختبرات العامة متاحة.',
  }[data.status], data.status === 'NOT_CONFIGURED');
  empty.hidden = !(data.status === 'ACTIVE' && readable === 0);
  const selected = data.products.find(product => product.slug === root.dataset.trialProduct);
  const products = selected ? [selected, ...data.products.filter(product => product !== selected)] : data.products;
  for (const product of data.status === 'ACTIVE' ? products : []) {
    const card = element('article', '');
    const name = element('h2', product.name);
    name.dir = 'auto';
    card.append(name, element('p', productStatus[product.status]));
    if (product.slug === 'secure-chat') card.append(element('p', 'إرسال المحادثات ومزود الذكاء الاصطناعي غير مهيأين في التجربة.'));
    if (product.status === 'READ_ONLY') {
      card.append(element('p', `المتاح: ${product.operations.map(operation => operations[operation]).join('، ')} · المتبقي: ${product.remaining} عملية قراءة`));
      const open = element('button', 'فتح المنتج');
      open.type = 'button';
      open.addEventListener('click', () => void run(async version => {
        const result = await api<{ href: string }>({ operation: 'open', product: product.slug });
        if (version === sessionVersion) location.assign(result.href);
      }, 'جارٍ فتح المنتج…'));
      card.append(open);
    }
    const demo = element('a', 'فتح المختبر العام');
    demo.href = product.demo;
    card.append(demo);
    grid.append(card);
  }
  if (!data.expiresAt) return;
  summary.hidden = false;
  const ends = new Date(data.expiresAt).toLocaleString('ar-SA', {
    timeZone: 'Asia/Riyadh', calendar: 'gregory', dateStyle: 'medium', timeStyle: 'short',
  });
  const renderClock = () => {
    const seconds = Math.max(0, data.remainingSeconds - Math.floor((performance.now() - received) / 1000));
    clock.textContent = `المتبقي: ${Math.floor(seconds / 3600)} ساعة و${Math.floor(seconds % 3600 / 60)} دقيقة و${seconds % 60} ثانية · الانتهاء: ${ends} (الرياض)`;
    return seconds;
  };
  if (renderClock() > 0) {
    timer = setInterval(() => {
      if (renderClock() === 0 && !busy) void run(load);
    }, 1000);
  }
}

start.addEventListener('click', () => void run(async version => {
  const data = await api<{ tenantId: string }>({ operation: 'start' });
  if (version !== sessionVersion) return;
  setTrialWorkspace(data.tenantId);
  await load(version);
}, 'جارٍ تجهيز مساحة التجربة…'));
refresh.addEventListener('click', () => void run(load));
document.addEventListener('workspace-session-ended', () => {
  sessionVersion++;
  clear();
  signin.hidden = false;
  report('انتهت الجلسة. سجّل الدخول مجددًا.');
});
if (auth) {
  refresh.hidden = false;
  window.addEventListener('pagehide', () => { sessionVersion++; clear(); });
  window.addEventListener('pageshow', event => { if (event.persisted) void run(load); });
  void run(load);
}
