import { evaluateDemo } from './firewall-demo.mjs';
import { simulateChat } from './secure-chat-demo.mjs';
import { riskDemo } from './risk-demo.mjs';
import { act } from './human-gate-demo.mjs';
import { digest } from './ledger-demo.mjs';

export const reviewerRevision = 'نعتذر عن تأخر شحنتك. سنراجع حالة الشحنة وأهلية الاسترجاع ثم نوافيك بما تأكد.';
const reviewRequest = {
  id: 'HG-COMPLAINT', status: 'PENDING', authority: true, history: [], permit: null,
};

const actions = {
  redact: {
    from: ['start'], event: 'firewall.redacted', label: 'نُقّح مرجع العميل', actor: 'Firewall',
    apply: (_, complaint) => {
      const result = evaluateDemo(complaint);
      if (result.code !== 'REDACT') throw new Error('لم تُنتج السياسة نصًا منقحًا قابلًا للمتابعة.');
      return { redaction: result };
    },
  },
  draft: {
    from: ['redact'], event: 'secure_chat.drafted', label: 'أُنشئت مسودة المساعد', actor: 'Secure Chat',
    apply: state => {
      const result = simulateChat(state.redaction.output, 'shipping-complaint');
      if (result.kernel !== 'ALLOW') throw new Error('أوقفت سياسة المحادثة صياغة المسودة.');
      return { draft: result.reply };
    },
  },
  assess: {
    from: ['draft'], event: 'risk.assessed', label: 'قُيّم خطر الوعد غير المؤكد', actor: 'Risk Engine',
    apply: () => ({
      risk: riskDemo({ asset: 'content', likelihood: 3, impact: 2, context: 'sandbox', treatment: 'review', control: 'human' }),
    }),
  },
  submit: {
    from: ['assess'], event: 'human_gate.requested', label: 'أُحيلت المسودة إلى المشرف', actor: 'مقدم الطلب',
    apply: () => ({ review: reviewRequest }),
  },
  edit: {
    from: ['submit'], event: 'human_gate.revised', label: 'استبدل المشرف الوعد بصياغة مشروطة بالتحقق', actor: 'المشرف',
    apply: () => ({ revision: reviewerRevision }),
  },
  return: {
    from: ['submit'], event: 'human_gate.returned', label: 'أعاد المشرف المسودة بسبب وعد الاسترجاع', actor: 'المشرف',
    apply: state => ({ review: act(state.review, 'reviewer', 'REJECT', 'تتضمن المسودة وعدًا بالاسترجاع قبل التحقق من الأهلية.') }),
  },
  approve: {
    from: ['edit'], event: 'human_gate.approved', label: 'اعتمد المشرف النسخة المعدلة داخل التجربة', actor: 'المشرف',
    apply: state => ({ review: act(state.review, 'reviewer', 'APPROVE', 'أزيل الوعد بالاسترجاع وأصبحت الصياغة مشروطة بالتحقق.') }),
  },
};

export function replayComplaint(events, complaint) {
  let state = { stage: 'start' };
  for (const record of events) {
    const stage = Object.keys(actions).find(key => actions[key].event === record.event);
    const action = actions[stage];
    if (!action?.from.includes(state.stage)) throw new Error('ترتيب أحداث التجربة غير صالح.');
    state = { ...state, ...action.apply(state, complaint), stage };
  }
  return state;
}

export async function appendComplaint(events, actionName, complaint) {
  const action = actions[actionName];
  if (!action || !Object.hasOwn(actions, actionName)) throw new Error('الإجراء غير متاح.');
  const record = {
    sequence: events.length + 1,
    event: action.event,
    actor: action.actor,
    time: new Date().toISOString(),
    reason: action.label,
    reference: 'DEMO-COMPLAINT',
    previousHash: events.at(-1)?.hash ?? 'GENESIS',
  };
  const next = [...events, record];
  replayComplaint(next, complaint);
  record.hash = await digest(record);
  return next;
}
