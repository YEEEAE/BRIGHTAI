import { riyadhToday } from '../risk-engine/core.mjs';
import { digest } from '../ledger/core.mjs';
import { assetSchema, axes, evidenceSchema, packSchema, products, reviewSchema } from './contract.mjs';

const key = (...parts) => JSON.stringify(parts);
const copy = value => structuredClone(value);
const initial = requirement => requirement.appliesTo
  ? { status: 'Needs Evidence', reason: 'Evidence has not been submitted.', evidence: null, review: null }
  : { status: 'N/A', reason: 'Asset kind falls outside this requirement scope.', evidence: null, review: null };

export function createGovernanceRegistry({ today = riyadhToday } = {}) {
  const assets = new Map();
  const packs = new Map();
  const assessments = new Map();

  function publish(catalog, entry) {
    const revisions = catalog.get(entry.id) ?? new Map();
    const latest = [...revisions.keys()].at(-1) ?? 0;
    if (revisions.has(entry.version)) {
      if (key(revisions.get(entry.version)) !== key(entry)) throw Error('Revision is immutable');
    } else {
      if (entry.version <= latest) throw Error('Revision must advance');
      revisions.set(entry.version, entry);
      catalog.set(entry.id, revisions);
    }
    return copy(entry);
  }

  function current(catalog, id, applicable = () => true) {
    const entries = [...(catalog.get(id)?.values() ?? [])].reverse();
    return entries.find(applicable);
  }

  function activePack(id) {
    const date = today();
    return current(packs, id, pack => pack.effectiveOn <= date);
  }

  function isCurrent(record) {
    return current(assets, record.asset.id)?.version === record.asset.version &&
      activePack(record.pack.id)?.version === record.pack.version;
  }

  function assessment(id, checkId, revision) {
    const record = assessments.get(id);
    if (!record || !isCurrent(record)) throw Error('Assessment is missing or superseded');
    const row = record.checks.find(item => item.check.id === checkId);
    if (!row || !row.appliesTo) throw Error('Check is missing or out of scope');
    if (row.revision !== revision) throw Error('Check revision conflict');
    return { record, row };
  }

  return {
    registerAsset: value => publish(assets, assetSchema.parse(value)),
    publishPack(value) {
      const pack = packSchema.parse(value);
      const latest = current(packs, pack.id);
      if (latest && pack.version > latest.version && pack.effectiveOn < latest.effectiveOn) {
        throw Error('Pack effective date cannot move backwards');
      }
      return publish(packs, pack);
    },
    applyPack(assetId, packId) {
      const asset = current(assets, assetId);
      const pack = activePack(packId);
      if (!asset || !pack?.appliesTo.includes(asset.kind)) throw Error('No effective applicable pack');
      const id = digest(key(asset.id, asset.version, pack.id, pack.version));
      if (!assessments.has(id)) {
        const checks = pack.requirements.map(requirement => {
          const appliesTo = requirement.appliesTo.includes(asset.kind);
          const row = { ...requirement, applicableKinds: requirement.appliesTo, appliesTo, revision: 0 };
          return { ...row, ...initial(row), history: [] };
        });
        assessments.set(id, { id, asset, pack, appliedOn: today(), checks });
      }
      return this.exportAssessment(id);
    },
    submitEvidence(id, checkId, revision, owner, value) {
      const { row } = assessment(id, checkId, revision);
      if (owner !== row.owner) throw Error('Check owner required');
      const evidence = evidenceSchema.parse(value);
      if (evidence.kind !== row.expectedEvidence.kind) throw Error('Unexpected evidence kind');
      row.history.push({ revision: row.revision, status: row.status, reason: row.reason, evidence: row.evidence, review: row.review });
      Object.assign(row, { revision: row.revision + 1, status: 'Needs Review',
        reason: 'Evidence submitted for independent review.', evidence, review: null });
      return copy(row);
    },
    reviewCheck(id, checkId, revision, value) {
      const { record, row } = assessment(id, checkId, revision);
      const review = reviewSchema.parse(value);
      if (review.reviewer !== record.asset.review.reviewer || review.reviewer === row.owner) {
        throw Error('Assigned independent reviewer required');
      }
      if (row.status !== 'Needs Review' || record.asset.review.dueOn < today()) throw Error('Review unavailable');
      Object.assign(row, { revision: row.revision + 1, status: review.outcome, reason: review.reason, review: { ...review, reviewedOn: today() } });
      return copy(row);
    },
    exportAssessment(id) {
      const record = assessments.get(id);
      if (!record) throw Error('Assessment not found');
      const effective = isCurrent(record);
      const { requirements, ...pack } = record.pack;
      const data = copy({ contractVersion: 1, synthetic: true, id, effective, asset: record.asset,
        pack, appliedOn: record.appliedOn, reviewOverdue: record.asset.review.dueOn < today(), checks: record.checks });
      if (!effective) {
        for (const row of data.checks) {
          if (!row.appliesTo) continue;
          row.previousStatus = row.status;
          row.status = 'Needs Review';
          row.reason = 'Asset or pack revision superseded. Historical evidence is retained.';
        }
      }
      return { ...data, sha256: digest(JSON.stringify(data)) };
    },
    gate(id) {
      const record = this.exportAssessment(id);
      const groups = (values, key) => Object.fromEntries(values.map(value => {
        const rows = record.checks.filter(row => row[key] === value && row.appliesTo);
        const pass = rows.filter(row => row.status === 'Pass').length;
        return [value, { pass, total: rows.length, meetsThreshold: rows.length > 0 && pass * 5 >= rows.length * 4 }];
      }));
      const byAxis = groups(axes, 'axis');
      const byProduct = groups(products, 'product');
      const openP0 = record.checks.filter(row => row.appliesTo && row.severity === 'P0' && row.status !== 'Pass').map(row => row.id);
      const criticalPass = record.checks.every(row => !row.appliesTo || !row.critical || row.status === 'Pass');
      const passed = record.effective && !record.reviewOverdue && criticalPass && openP0.length === 0 &&
        [...Object.values(byAxis), ...Object.values(byProduct)].every(group => group.meetsThreshold);
      return { passed, byAxis, byProduct, openP0, criticalPass };
    },
    getAsset: id => copy(current(assets, id)),
  };
}
