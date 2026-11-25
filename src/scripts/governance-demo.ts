import { assetPurposes, assetTemplates, createGovernanceSession, SESSION_DURATION } from '../demo/governance.mjs';

const get = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const lab = get('governance-lab');
const status = get('governance-status');
const start = get<HTMLButtonElement>('governance-start');
const assetSelect = get<HTMLSelectElement>('governance-asset');
const reviewSelect = get<HTMLSelectElement>('review-source');
const consent = get<HTMLInputElement>('governance-consent');
const download = get<HTMLButtonElement>('governance-export');
const panels = [...lab.querySelectorAll('section')];
const links = [...lab.querySelectorAll('nav a')];
const labels: Record<string, string> = {
  'asset.added': 'إضافة أصل', 'policy.changed': 'تغيير الحزمة', 'firewall.checked': 'فحص الطلب',
  'risk.assessed': 'تقييم المخاطر', 'review.decided': 'قرار المراجعة', 'ledger.sample': 'دليل اصطناعي',
  ALLOW: 'مسموح في المحاكاة', BLOCK: 'محجوب في المحاكاة', REVIEW_REQUIRED: 'يتطلب مراجعة',
  LOW: 'منخفض', MEDIUM: 'متوسط', HIGH: 'مرتفع', APPROVED: 'معتمد افتراضيًا',
  REJECTED: 'مرفوض افتراضيًا', RECORDED: 'مسجّل',
  privacy: 'حماية البيانات', supervision: 'الإشراف البشري',
};
let session: ReturnType<typeof createGovernanceSession>;
let timer: number;
let selected = 1;

function navigate(focus = false) {
  if (lab.hidden) return;
  const current = panels.find(panel => panel.id === location.hash.slice(1)) ?? panels[0];
  for (const panel of panels) panel.hidden = panel !== current;
  for (const link of links) {
    if (link.hash === '#' + current.id) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  }
  if (focus) current.querySelector('h2')?.focus();
}

function close(message: string, focus = false) {
  session.close();
  clearTimeout(timer);
  for (const id of ['governance-summary', 'governance-detail', 'governance-inventory', 'governance-evidence',
    'firewall-result', 'risk-result', 'review-result', 'governance-asset', 'review-source']) {
    get(id).replaceChildren();
  }
  for (const form of lab.querySelectorAll('form')) form.reset();
  consent.checked = false;
  download.disabled = true;
  lab.hidden = true;
  start.hidden = false;
  status.textContent = message;
  if (focus) start.focus();
}

function read() {
  try {
    return session.read();
  } catch {
    if (!lab.hidden) close('انتهت مدة الجلسة ومُسحت البيانات.');
    return null;
  }
}

function list(id: string, entries: string[]) {
  get(id).replaceChildren(...entries.map(entry => {
    const item = document.createElement('li');
    item.textContent = entry;
    return item;
  }));
}

function render() {
  const state = read();
  if (!state) return;
  const asset = state.assets.find(item => item.id === selected)!;
  const events = state.events.filter(item => item.assetId === selected);
  const current = events.filter(item => item.version === asset.version);
  const pending = current.filter(item =>
    ['REVIEW_REQUIRED', 'HIGH'].includes(item.result ?? '') &&
    !state.reviews.some(review => review.sourceId === item.id));
  const last = (type: string) => current.findLast(item => item.type === type);
  const name = (template: string) => assetTemplates[template as keyof typeof assetTemplates];
  const previousSource = reviewSelect.value;
  assetSelect.replaceChildren(...state.assets.map(item => new Option(`#${item.id} · ${name(item.template)}`, String(item.id))));
  assetSelect.value = String(selected);
  reviewSelect.replaceChildren(new Option('مراجعة مستقلة', ''),
    ...pending.map(item => new Option(`#${item.id} · ${labels[item.type]}`, String(item.id))));
  if ([...reviewSelect.options].some(option => option.value === previousSource)) reviewSelect.value = previousSource;
  get<HTMLSelectElement>('policy-pack').value = asset.pack;
  get('governance-summary').textContent = `الأصول ${state.assets.length} · أحداث الجلسة ${state.events.length} · الإحالات المفتوحة للأصل المحدد ${pending.length}`;
  get('governance-detail').textContent = `${name(asset.template)} · النسخة ${asset.version} · ${labels[asset.pack]}. ${assetPurposes[asset.template as keyof typeof assetPurposes]}`;
  list('governance-inventory', state.assets.map(item => `#${item.id} · ${name(item.template)} · النسخة ${item.version}`));
  const check = last('firewall.checked');
  const risk = last('risk.assessed');
  const review = last('review.decided');
  const checkReview = state.reviews.find(item => item.sourceId === check?.id);
  const checkDecision = current.find(item => item.id === checkReview?.eventId)?.result;
  get('firewall-result').textContent = check ? `آخر فحص #${check.id} · ${labels[check.result!]}${checkDecision ? ' · ' + labels[checkDecision] : ''}` : 'لا يوجد فحص لهذه النسخة.';
  get('risk-result').textContent = risk ? `آخر تقييم #${risk.id} · ${risk.likelihood} × ${risk.impact} = ${risk.score} · ${labels[risk.result!]}` : 'لا يوجد تقييم لهذه النسخة.';
  get('review-result').textContent = review ? `آخر قرار #${review.id} · ${labels[review.result!]}` : 'لا يوجد قرار لهذه النسخة.';
  get('governance-evidence-empty').hidden = events.length > 0;
  list('governance-evidence', events.map(item => {
    const result = item.result ? ` · ${labels[item.result]}` : '';
    const reference = item.sourceId ? ` · مرجع #${item.sourceId}` : '';
    return `#${item.id} · ${labels[item.type]} · النسخة ${item.version}${result}${reference}`;
  }));
}

function begin() {
  selected = 1;
  session = createGovernanceSession();
  lab.hidden = false;
  start.hidden = true;
  timer = window.setTimeout(() => close('انتهت مدة الجلسة ومُسحت البيانات.'), SESSION_DURATION);
  render();
  navigate();
}

for (const form of lab.querySelectorAll('form')) {
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!read()) return;
    const values = new FormData(form);
    const type = form.dataset.action;
    try {
      ({ assetId: selected } = session.act({
        type, assetId: selected, template: values.get('template'), pack: values.get('pack'),
        sample: values.get('sample'), likelihood: Number(values.get('likelihood')), impact: Number(values.get('impact')),
        sourceId: values.get('source') ? Number(values.get('source')) : null, decision: values.get('decision'),
      }));
      render();
      const lastEvent = session.read().events.at(-1)!;
      status.textContent = `سُجّل ${labels[lastEvent.type]} #${lastEvent.id}${lastEvent.result ? ' · ' + labels[lastEvent.result] : ''}.`;
    } catch (error) {
      status.textContent = error instanceof Error ? error.message : 'تعذرت العملية.';
    }
  });
}

assetSelect.addEventListener('change', () => { selected = Number(assetSelect.value); render(); });
window.addEventListener('hashchange', () => { if (read()) navigate(true); });
window.addEventListener('pagehide', () => close('مُسحت الجلسة عند مغادرة الصفحة.'));
document.addEventListener('visibilitychange', () => { if (!document.hidden) read(); });
start.addEventListener('click', () => { begin(); status.textContent = 'بدأت جلسة جديدة.'; navigate(true); });
get('governance-clear').addEventListener('click', () => close('مُسحت الجلسة من هذه الصفحة.', true));
consent.addEventListener('change', () => { download.disabled = !consent.checked; });
download.addEventListener('click', () => {
  const state = read();
  if (!state || !consent.checked) return;
  const url = URL.createObjectURL(new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'brightai-governance-demo.json';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

begin();
