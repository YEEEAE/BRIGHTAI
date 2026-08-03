/**
 * kernel-certs/in-memory-store.ts — مخزن ذاكرة للاختبارات والديمو.
 *
 * يفرض نفس قواعد الـ PrismaStore: تفرد caseId، حماية result محفوظ،
 * optimistic lock، وتجميد الـ run عند اكتماله. لا يستخدم في الإنتاج.
 */

import {
  type EvalStore,
  type StoredCase,
  type StoredEvaluationRun,
} from './eval-service';

export class InMemoryEvalStore implements EvalStore {
  private runs = new Map<string, StoredEvaluationRun>();
  private cases = new Map<string, Map<string, StoredCase>>();
  private pubKeys = new Map<string, string>();

  // ── signing key registry (يستخدمها CertStore) ────────────────────────────

  registerPublicKey(keyId: string, publicKeyPem: string): void {
    this.pubKeys.set(keyId, publicKeyPem);
  }

  getRegisteredPublicKey(keyId: string): string | null {
    return this.pubKeys.get(keyId) ?? null;
  }

  async createRun(run: StoredEvaluationRun): Promise<StoredEvaluationRun> {
    if (this.runs.has(run.evaluationId)) {
      throw new Error(`run_already_exists:${run.evaluationId}`);
    }
    const copy = structuredClone(run);
    copy.cases = [];
    this.runs.set(run.evaluationId, copy);
    this.cases.set(run.evaluationId, new Map());
    return structuredClone(copy);
  }

  async getRun(evaluationId: string): Promise<StoredEvaluationRun | null> {
    const r = this.runs.get(evaluationId);
    return r ? structuredClone(r) : null;
  }

  async listRuns(limit = 50): Promise<StoredEvaluationRun[]> {
    const all = [...this.runs.values()].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    return structuredClone(all.slice(0, limit));
  }

  async updateRun(run: StoredEvaluationRun): Promise<StoredEvaluationRun> {
    const existing = this.runs.get(run.evaluationId);
    if (!existing) throw new Error('run_not_found');
    // optimistic lock: caller must pass the same version it read
    if (existing.version !== run.version) {
      throw new Error('optimistic_lock_conflict');
    }
    // no edits after immutability (frozen on complete)
    if (existing.immutable && !run.immutable) {
      throw new Error('run_immutable');
    }
    // auto-increment version — next reader sees the new revision
    const next = structuredClone({ ...run, version: existing.version + 1 });
    this.runs.set(run.evaluationId, next);
    return structuredClone(next);
  }

  async addCase(
    evaluationId: string,
    c: StoredCase,
  ): Promise<{ ok: true } | { ok: false; code: 'duplicate' | 'immutable' }> {
    const run = this.runs.get(evaluationId);
    if (!run) throw new Error('run_not_found');
    if (run.immutable) return { ok: false, code: 'immutable' };
    const bucket = this.cases.get(evaluationId) ?? new Map();
    if (bucket.has(c.caseId)) return { ok: false, code: 'duplicate' };
    bucket.set(c.caseId, structuredClone(c));
    this.cases.set(evaluationId, bucket);
    run.cases = [...bucket.values()];
    return { ok: true };
  }

  async getCases(evaluationId: string): Promise<StoredCase[]> {
    const bucket = this.cases.get(evaluationId) ?? new Map();
    return structuredClone([...bucket.values()]);
  }
}
