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

async function api<T>(body?: object): Promise<T> {
  if (!auth) throw new Error('خدمة الدخول غير مهيأة حاليًا.');
  const url = new URL('/app/api/trial/', location.origin);
  if (tenant) url.searchParams.set('workspace', tenant);
  const response = await appFetch(auth, url.href, body
    ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
    : {});
  const data = await response.json();
  if (response.status === 401) throw Object.assign(new Error('سجّل الدخول لاستعراض حالة تجربتك.'), { unauthorized: true });
  if (!response.ok) {
    throw Object.assign(new Error(data.message || 'تعذر التحقق من التجربة.'), {
      verifyEmail: data.code === 'IDENTITY_NOT_VERIFIED',
    });
  }
  return data;
}

function clear() {
  clearInterval(timer);
  grid.replaceChildren();
  summary.hidden = start.hidden = signin.hidden = true;
}

async function run(work: () => Promise<void>) {
  if (busy) return;
  busy = true;
  start.disabled = refresh.disabled = true;
  try {
    await work();
  } catch (error) {
    clear();
    const session = error as { unauthorized?: boolean; verifyEmail?: boolean };
    signin.hidden = !(session?.unauthorized || session?.verifyEmail);
    status.textContent = error instanceof Error ? error.message : 'تعذر التحقق. حاول مرة ثانية.';
  } finally {
    busy = false;
    start.disabled = refresh.disabled = false;
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

async function load() {
  clear();
  const data = await api<Trial>();
  const received = performance.now();
  if (data.tenantId) setTrialWorkspace(data.tenantId);
  start.hidden = data.status !== 'NOT_STARTED';
  const readable = data.products.filter(product => product.status === 'READ_ONLY').length;
  status.textContent = {
    NOT_STARTED: 'بريدك موثّق. يمكنك بدء تجربة في مساحة مخصصة.',
    NOT_CONFIGURED: 'خدمة التجربة غير مهيأة حاليًا. المختبرات العامة متاحة.',
    ACTIVE: `التجربة نشطة. المنتجات المتاحة للقراءة: ${readable} من ${data.products.length}.`,
    EXPIRED: 'انتهت مدة التجربة. المختبرات العامة متاحة.',
  }[data.status];
  for (const product of data.products) {
    const card = element('article', '');
    card.append(element('h2', product.name), element('p', productStatus[product.status]));
    if (product.slug === 'secure-chat') card.append(element('p', 'إرسال المحادثات ومزود الذكاء الاصطناعي غير مهيأين في التجربة.'));
    if (product.status === 'READ_ONLY') {
      card.append(element('p', `المتاح: ${product.operations.map(operation => operations[operation]).join('، ')} · المتبقي: ${product.remaining} عملية قراءة`));
      const open = element('button', 'فتح المنتج');
      open.type = 'button';
      open.addEventListener('click', () => void run(async () => {
        const result = await api<{ href: string }>({ operation: 'open', product: product.slug });
        location.assign(result.href);
      }));
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

start.addEventListener('click', () => void run(async () => {
  const data = await api<{ tenantId: string }>({ operation: 'start' });
  setTrialWorkspace(data.tenantId);
  await load();
}));
refresh.addEventListener('click', () => void run(load));
document.addEventListener('workspace-session-ended', () => {
  clear();
  signin.hidden = false;
  status.textContent = 'انتهت الجلسة. سجّل الدخول مجددًا.';
});
window.addEventListener('pagehide', clear);
window.addEventListener('pageshow', event => { if (event.persisted) void run(load); });
void run(load);
