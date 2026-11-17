import { complaint, complaintPath, complaintStations } from '../shared/complaint-journey';
import { appendComplaint, replayComplaint } from '../shared/complaint-run.mjs';
import { verifyChain } from '../shared/ledger-demo.mjs';

const root = document.querySelector<HTMLElement>('[data-complaint]');
if (root) void mount(root);

async function mount(root: HTMLElement) {
  const storageKey = 'brightai-complaint-v2';
  const slug = root.dataset.complaint;
  const index = complaintStations.findIndex(station => station.slug === slug);
  const status = root.querySelector<HTMLElement>('[data-journey-status]')!;
  const buttons = [...root.querySelectorAll<HTMLButtonElement>('[data-journey-action]')];
  const allowed = [
    ['start'], ['redact'], ['draft'], ['assess', 'submit', 'edit', 'return', 'approve'],
  ];
  const completedFields = ['redaction', 'draft', 'risk'];
  let events: Awaited<ReturnType<typeof appendComplaint>> = [];
  let busy = false;

  function fill(selector: string, content: string) {
    const target = root.querySelector(selector);
    if (target) target.textContent = content;
  }

  function render() {
    const state = replayComplaint(events, complaint);
    const panels = root.querySelectorAll<HTMLElement>('[data-stages], [data-field-panel]');
    for (const panel of panels) {
      panel.hidden = panel.dataset.stages
        ? !panel.dataset.stages.split(' ').includes(state.stage)
        : !state[panel.dataset.fieldPanel!];
    }
    const next = root.querySelector<HTMLAnchorElement>('[data-journey-next]');
    if (next) next.hidden = index === 3 ? !['return', 'approve'].includes(state.stage) : !state[completedFields[index]];

    const resume = root.querySelector<HTMLAnchorElement>('[data-journey-resume]')!;
    const activeIndex = ['start', 'redact', 'draft', 'assess'].indexOf(state.stage);
    const blocked = index < 4 && !allowed[index].includes(state.stage) && (index === 3 || !state[completedFields[index]]);
    resume.hidden = !blocked;
    if (blocked) resume.href = complaintPath(complaintStations[Math.max(0, activeIndex)].slug);
    status.textContent = blocked ? 'أكمل المحطات السابقة لتتوفر نتيجة هذه المحطة.' : '';

    if (state.redaction) {
      fill('[data-rule]', `${state.redaction.reason} (${state.redaction.ruleId})`);
      fill('[data-redacted]', state.redaction.output);
      fill('[data-chat-input]', state.redaction.output);
    }
    if (state.draft) fill('[data-draft]', state.draft);
    if (state.risk) {
      const { initial, residual, residualReason } = state.risk;
      fill('[data-risk]', `الاحتمال ${initial.likelihood} × الأثر ${initial.impact} = ${initial.score} (${initial.level}). بعد الإحالة ${residual.score} (${residual.level}).`);
      fill('[data-treatment]', residualReason);
    }
    if (state.revision) fill('[data-revision]', state.revision);
    if (state.stage === 'return' || state.stage === 'approve') {
      const decision = state.stage === 'return' ? 'أُعيدت المسودة' : 'اعتُمد الرد المعدّل';
      fill('[data-decision]', `${decision}. ${state.review.reason}`);
    }
    if (slug === 'ledger') {
      fill('[data-ledger-summary]', events.length ? `تم التحقق محليًا من ترابط ${events.length} أحداث.` : 'لا توجد أحداث مسجلة في هذه الجلسة. ابدأ من التنقيح لتسجيل أول حدث.');
      resume.hidden = events.length > 0;
      resume.href = complaintPath();
      const rows = events.map(event => {
        const row = document.createElement('li');
        row.textContent = `${event.reason} · ${event.actor}`;
        return row;
      });
      root.querySelector('[data-ledger-events]')?.replaceChildren(...rows);
    }
  }

  async function restore() {
    const saved = JSON.parse(sessionStorage.getItem(storageKey) ?? '[]');
    if (!Array.isArray(saved) || (await verifyChain(saved)).state === 'altered') {
      throw new Error('تعذر التحقق من سجل الجلسة.');
    }
    events = saved;
    render();
  }

  function reportFailure() {
    status.textContent = 'تعذر حفظ أحداث هذه التجربة أو التحقق منها. تأكد من إتاحة تخزين الجلسة والبصمات المحلية أو ابدأ من جديد.';
  }

  document.querySelector('[data-complaint-restart]')?.addEventListener('click', event => {
    if (event instanceof MouseEvent && (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)) return;
    if (busy) { event.preventDefault(); return; }
    try {
      sessionStorage.removeItem(storageKey);
      if (slug === 'firewall') {
        event.preventDefault();
        events = [];
        render();
        buttons[0]?.focus();
      }
    } catch {
      event.preventDefault();
      reportFailure();
    }
  });

  try {
    await restore();
  } catch {
    reportFailure();
  }

  window.addEventListener('pageshow', event => {
    if (event.persisted) void restore().catch(reportFailure);
  });

  for (const button of buttons) button.addEventListener('click', async () => {
    if (busy) return;
    busy = true;
    buttons.forEach(control => { control.disabled = true; });
    let succeeded = false;
    try {
      const next = await appendComplaint(events, button.dataset.journeyAction, complaint);
      sessionStorage.setItem(storageKey, JSON.stringify(next));
      events = next;
      render();
      succeeded = true;
    } catch {
      reportFailure();
    } finally {
      busy = false;
      buttons.forEach(control => { control.disabled = false; });
    }
    if (succeeded) {
      const nextControl = buttons.find(control => !control.closest('[hidden]')) ??
        root.querySelector<HTMLAnchorElement>('[data-journey-next]:not([hidden])');
      nextControl?.focus();
    }
  });
}
