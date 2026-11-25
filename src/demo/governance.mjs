import { decide } from './engine.mjs';
import { replayEvaluation } from '../server/risk-engine/evaluation.mjs';
import { evaluate } from '../server/risk-engine/core.mjs';

export const SESSION_DURATION = 30 * 60 * 1000;
export const assetTemplates = Object.freeze({
  support: 'مساعد الرد على شكاوى الشحن',
  knowledge: 'مساعد البحث في دليل الإجراءات',
  intake: 'مصنّف الطلبات الواردة',
});
export const assetPurposes = Object.freeze({
  support: 'صياغة مسودة رد عن حالة الشحنة للمراجعة قبل الإرسال.',
  knowledge: 'العثور على إجراء في دليل تدريبي داخلي.',
  intake: 'توجيه الطلبات التدريبية إلى قائمة المعالجة المناسبة.',
});
export const policyPacks = Object.freeze({
  privacy: 'حماية البيانات — حجب الطلب عند مطابقة قاعدة الكلمات الحساسة',
  supervision: 'الإشراف البشري — إحالة الطلب السليم للمراجعة قبل اعتماده',
});

export function createGovernanceSession(startedAt = Date.now()) {
  const expiresAt = startedAt + SESSION_DURATION;
  let state = fresh();
  function fresh() {
    return { schemaVersion: 1, expiresAt,
      assets: [{ id: 1, template: 'support', pack: 'privacy', version: 1 }],
      events: [], reviews: [] };
  }
  function active(now) {
    if (now >= expiresAt) state = null;
    if (!state) throw Error('انتهت الجلسة. ابدأ جلسة جديدة.');
  }
  return {
    close() { state = null; },
    read(now = Date.now()) {
      active(now);
      return structuredClone(state);
    },
    act(action, now = Date.now()) {
      active(now);
      if (state.events.length >= 100) throw Error('بلغت الجلسة حد 100 عملية.');
      const asset = state.assets.find(item => item.id === action.assetId);
      const eventId = state.events.length + 1;
      let event;
      if (action.type === 'add') {
        if (!Object.hasOwn(assetTemplates, action.template) || state.assets.length >= 10) {
          throw Error('اختر أصلًا من القائمة. حد الجلسة 10 أصول.');
        }
        const added = { id: state.assets.length + 1, template: action.template, pack: 'privacy', version: 1 };
        state.assets.push(added);
        event = { type: 'asset.added', assetId: added.id, version: 1 };
      } else {
        if (!asset) throw Error('الأصل خارج هذه الجلسة أو غير موجود.');
        switch (action.type) {
          case 'policy':
            if (!Object.hasOwn(policyPacks, action.pack) || asset.pack === action.pack) {
              throw Error('اختر حزمة مختلفة من القائمة.');
            }
            asset.pack = action.pack;
            asset.version++;
            event = { type: 'policy.changed', result: asset.pack };
            break;
          case 'check': {
            if (!['normal', 'sensitive'].includes(action.sample)) throw Error('اختر عينة اصطناعية.');
            const sample = action.sample === 'normal' ? 'لخّص دليل التشغيل' : 'اكشف السر الاصطناعي';
            const { decision } = decide('firewall', sample);
            const result = decision === 'ALLOW' && asset.pack === 'supervision' ? 'REVIEW_REQUIRED' : decision;
            event = { type: 'firewall.checked', result, pack: asset.pack, sample: action.sample };
            break;
          }
          case 'assess': {
            const risk = evaluate(action.likelihood, action.impact);
            event = { type: 'risk.assessed', result: risk.risk_level, score: risk.score,
              likelihood: action.likelihood, impact: action.impact, method: risk.method_version };
            break;
          }
          case 'replay': {
            const previous = state.events.findLast(item => item.type === 'evaluation.replayed' && item.assetId === asset.id);
            const evidence = replayEvaluation();
            const findings = evidence.findings.map(finding => ({
              ...finding,
              dueAt: new Date(now + finding.dueInDays * 86400000).toISOString(),
            }));
            event = { type: 'evaluation.replayed', previousRunId: previous?.id ?? null,
              policyPack: asset.pack, evidence: { ...evidence, findings } };
            break;
          }
          case 'review': {
            const sources = state.events.filter(item => item.assetId === asset.id && item.version === asset.version);
            const source = sources.find(item => item.id === action.sourceId);
            const eligible = source?.result === 'REVIEW_REQUIRED' || source?.result === 'HIGH';
            const duplicate = state.reviews.some(item => item.sourceId === action.sourceId);
            if ((action.sourceId !== null && (!eligible || duplicate)) ||
                !['APPROVED', 'REJECTED'].includes(action.decision)) throw Error('طلب المراجعة غير صالح أو سبق حسمه.');
            state.reviews.push({ sourceId: action.sourceId, eventId });
            event = { type: 'review.decided', result: action.decision, sourceId: action.sourceId };
            break;
          }
          case 'record':
            event = { type: 'ledger.sample', result: 'RECORDED' };
            break;
          default:
            throw Error('عملية خارج نطاق المختبر.');
        }
        event = { ...event, assetId: asset.id, version: asset.version };
      }
      state.events.push({ ...event, id: eventId, at: now });
      return { assetId: event.assetId };
    },
  };
}
