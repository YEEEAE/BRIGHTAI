// P03 — persistence adapters for the agent runtime. The Postgres adapter uses
// the P02 tables and the Kernel transaction/RLS scope; the memory adapter has
// the same surface for local tests. Business rules live in runtime.mjs, never
// in either adapter, so a test exercises the same state machine as production.

import { randomUUID } from 'node:crypto';
import { transaction } from '../kernel/db.mjs';
import { KernelError } from '../kernel/core.mjs';
import { checkIdempotencyKey } from '../api/idempotency.mjs';

const asIso = value => value instanceof Date ? value.toISOString() : value;
const live = row => row && new Date(row.expires_at).getTime() > Date.now() ? row : null;

function pgStore(db) {
  const one = async (sql, params) => (await db.query(sql, params)).rows[0] ?? null;
  const tx = {
    db,
    async createRun(input) {
      checkIdempotencyKey(input.idempotencyKey);
      const existing = await one('SELECT * FROM public.aigas_agent_runs WHERE tenant_id=$1 AND idempotency_key=$2', [input.tenantId, input.idempotencyKey]);
      if (existing) {
        if (existing.request_fingerprint !== input.requestFingerprint || existing.agent_key !== input.agentKey || existing.policy_version !== input.policyVersion) {
          throw new KernelError(409, 'AGENT_IDEMPOTENCY_CONFLICT', 'مفتاح منع التكرار مرتبط بتشغيل مختلف.');
        }
        return live(existing);
      }
      const row = await one(`INSERT INTO public.aigas_agent_runs
        (id,tenant_id,actor_id,parent_run_id,agent_key,policy_version,status,idempotency_key,request_fingerprint,expires_at)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
        [input.id, input.tenantId, input.actorId, input.parentRunId, input.agentKey, input.policyVersion,
          input.status, input.idempotencyKey, input.requestFingerprint, asIso(input.expiresAt)]);
      return row;
    },
    getRun(tenantId, runId) {
      return one('SELECT * FROM public.aigas_agent_runs WHERE tenant_id=$1 AND id=$2 AND expires_at>now()', [tenantId, runId]);
    },
    countSteps(tenantId, runId) {
      return one('SELECT count(*)::int AS total FROM public.aigas_agent_steps WHERE tenant_id=$1 AND run_id=$2', [tenantId, runId]).then(row => row?.total ?? 0);
    },
    async updateRun(tenantId, runId, patch, expectedStatus) {
      const row = await one(`UPDATE public.aigas_agent_runs SET status=$3,updated_at=clock_timestamp()
        WHERE tenant_id=$1 AND id=$2 AND status=$4 AND expires_at>now() RETURNING *`,
        [tenantId, runId, patch.status, expectedStatus]);
      if (!row) throw new KernelError(409, 'AGENT_STATE_CHANGED', 'تغيرت حالة التشغيل؛ لم تُطبق العملية.');
      return row;
    },
    async appendStep(input) {
      checkIdempotencyKey(input.idempotencyKey);
      const existing = await one('SELECT * FROM public.aigas_agent_steps WHERE tenant_id=$1 AND run_id=$2 AND idempotency_key=$3', [input.tenantId, input.runId, input.idempotencyKey]);
      if (existing) {
        if (existing.step_no !== input.stepNo || existing.kind !== input.kind || existing.policy_version !== input.policyVersion) {
          throw new KernelError(409, 'AGENT_IDEMPOTENCY_CONFLICT', 'مفتاح الخطوة مرتبط بخطوة مختلفة.');
        }
        return existing;
      }
      return one(`INSERT INTO public.aigas_agent_steps
        (id,tenant_id,run_id,step_no,kind,status,summary,input_ref,output_ref,policy_version,idempotency_key,expires_at)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
        [input.id, input.tenantId, input.runId, input.stepNo, input.kind, input.status, input.summary,
          input.inputRef ?? null, input.outputRef ?? null, input.policyVersion, input.idempotencyKey, asIso(input.expiresAt)]);
    },
    updateStep(tenantId, stepId, patch, expectedStatus) {
      return one(`UPDATE public.aigas_agent_steps SET status=$3,output_ref=$4 WHERE tenant_id=$1 AND id=$2 AND status=$5 RETURNING *`,
        [tenantId, stepId, patch.status, patch.outputRef ?? null, expectedStatus]);
    },
    async appendTool(input) {
      checkIdempotencyKey(input.idempotencyKey);
      const existing = await one('SELECT * FROM public.aigas_tool_invocations WHERE tenant_id=$1 AND run_id=$2 AND idempotency_key=$3', [input.tenantId, input.runId, input.idempotencyKey]);
      if (existing) {
        if (existing.tool_name !== input.toolName || existing.tool_version !== input.toolVersion || existing.request_fingerprint !== input.requestFingerprint) {
          throw new KernelError(409, 'AGENT_IDEMPOTENCY_CONFLICT', 'مفتاح استدعاء الأداة مرتبط بطلب مختلف.');
        }
        return existing;
      }
      return one(`INSERT INTO public.aigas_tool_invocations
        (id,tenant_id,run_id,step_id,tool_name,tool_version,arguments_ref,result_ref,status,idempotency_key,request_fingerprint,expires_at)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
        [input.id, input.tenantId, input.runId, input.stepId, input.toolName, input.toolVersion,
          input.argumentsRef ?? null, input.resultRef ?? null, input.status, input.idempotencyKey,
          input.requestFingerprint, asIso(input.expiresAt)]);
    },
    updateTool(tenantId, toolId, patch, expectedStatus) {
      return one(`UPDATE public.aigas_tool_invocations SET status=$3,result_ref=$4 WHERE tenant_id=$1 AND id=$2 AND status=$5 RETURNING *`,
        [tenantId, toolId, patch.status, patch.resultRef ?? null, expectedStatus]);
    },
    async checkpoint(input) {
      const existing = await one('SELECT * FROM public.aigas_checkpoints WHERE tenant_id=$1 AND run_id=$2 AND version=$3', [input.tenantId, input.runId, input.version]);
      if (existing) {
        if (existing.state_ref !== input.stateRef || existing.approval_fingerprint !== input.approvalFingerprint) {
          throw new KernelError(409, 'AGENT_CHECKPOINT_CONFLICT', 'نقطة الاستئناف غير مطابقة.');
        }
        return existing;
      }
      return one(`INSERT INTO public.aigas_checkpoints
        (id,tenant_id,run_id,version,state_ref,approval_fingerprint,expires_at)
        VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
        [input.id, input.tenantId, input.runId, input.version, input.stateRef, input.approvalFingerprint ?? null, asIso(input.expiresAt)]);
    },
    getCheckpoint(tenantId, runId, version) {
      return one('SELECT * FROM public.aigas_checkpoints WHERE tenant_id=$1 AND run_id=$2 AND version=$3 AND expires_at>now()', [tenantId, runId, version]);
    },
    async appendOutbox(event) {
      const existing = await one('SELECT * FROM public.aigas_outbox WHERE tenant_id=$1 AND idempotency_key=$2', [event.tenant_id, event.idempotency_key]);
      if (existing) {
        if (existing.event_id !== event.event_id || existing.event_type !== event.event_type || existing.payload_ref !== event.payload_ref) {
          throw new KernelError(409, 'OUTBOX_KEY_CONFLICT', 'مفتاح الحدث مرتبط بحدث مختلف.');
        }
        return existing;
      }
      return one(`INSERT INTO public.aigas_outbox
        (id,tenant_id,aggregate_type,aggregate_id,event_id,event_type,schema_version,correlation_id,causation_id,payload_ref,status,attempts,idempotency_key,next_attempt_at,expires_at)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'PENDING',0,$11,now(),$12) RETURNING *`,
        [event.event_id, event.tenant_id, event.aggregate_type, event.aggregate_id, event.event_id,
          event.event_type, event.schema_version, event.correlation_id, event.causation_id,
          event.payload_ref, event.idempotency_key, new Date(Date.now() + 7 * 86400000).toISOString()]);
    },
    listOutbox(tenantId, limit = 20) {
      return db.query('SELECT * FROM public.aigas_outbox WHERE tenant_id=$1 AND expires_at>now() ORDER BY created_at,id LIMIT $2', [tenantId, Math.min(Math.max(limit, 1), 50)]).then(result => result.rows);
    },
    updateOutbox(tenantId, eventId, patch) {
      return one(`UPDATE public.aigas_outbox SET status=$3,attempts=$4,next_attempt_at=$5
        WHERE tenant_id=$1 AND event_id=$2 RETURNING *`,
        [tenantId, eventId, patch.status, patch.attempts, asIso(patch.nextAttemptAt ?? new Date())]);
    },
  };
  return tx;
}

export function createAgentStore({ transact = transaction } = {}) {
  return {
    async transact(work) {
      return transact(db => work(pgStore(db)));
    },
  };
}

// Deterministic adapter for local contract tests. A failed callback restores
// the pre-transaction snapshot, so an evidence failure cannot leave a partial
// run/step/outbox set behind — the same guarantee the SQL transaction provides.
export function createMemoryStore({ now = () => new Date() } = {}) {
  const state = { runs: new Map(), steps: new Map(), tools: new Map(), checkpoints: new Map(), outbox: new Map(), memory: new Map() };
  const key = (...parts) => parts.join('|');
  const clone = value => structuredClone(value);
  const stored = (map, k) => live(clone(map.get(k)));
  const put = (map, k, value) => { map.set(k, clone(value)); return clone(value); };
  const tx = {
    db: null,
    async createRun(input) {
      checkIdempotencyKey(input.idempotencyKey);
      const k = key(input.tenantId, 'idem', input.idempotencyKey);
      const runId = state.runs.get(k);
      if (runId) {
        const previous = stored(state.runs, key(input.tenantId, runId));
        if (previous.request_fingerprint !== input.requestFingerprint || previous.agent_key !== input.agentKey || previous.policy_version !== input.policyVersion) {
          throw new KernelError(409, 'AGENT_IDEMPOTENCY_CONFLICT', 'مفتاح منع التكرار مرتبط بتشغيل مختلف.');
        }
        return previous;
      }
      const row = { id: input.id, tenant_id: input.tenantId, actor_id: input.actorId, parent_run_id: input.parentRunId,
        agent_key: input.agentKey, policy_version: input.policyVersion, status: input.status,
        idempotency_key: input.idempotencyKey, request_fingerprint: input.requestFingerprint, expires_at: input.expiresAt,
        correlation_id: input.correlationId ?? null, handoff: input.handoff ?? null, agent_version: input.agentVersion ?? null,
        created_at: now().toISOString(), updated_at: now().toISOString() };
      state.runs.set(k, input.id);
      return put(state.runs, key(input.tenantId, input.id), row);
    },
    async getRun(tenantId, runId) { return stored(state.runs, key(tenantId, runId)); },
    countSteps(tenantId, runId) {
      const prefix = key(tenantId, runId) + '|';
      return [...state.steps.values()].filter(row => row && row.run_id === runId && row.tenant_id === tenantId).length;
    },
    async updateRun(tenantId, runId, patch, expectedStatus) {
      const k = key(tenantId, runId), row = stored(state.runs, k);
      if (!row || row.status !== expectedStatus) throw new KernelError(409, 'AGENT_STATE_CHANGED', 'تغيرت حالة التشغيل؛ لم تُطبق العملية.');
      return put(state.runs, k, { ...row, status: patch.status, updated_at: now().toISOString() });
    },
    async appendStep(input) {
      checkIdempotencyKey(input.idempotencyKey);
      const k = key(input.tenantId, input.runId, 'idem', input.idempotencyKey);
      const stepId = state.steps.get(k);
      if (stepId) {
        const previous = stored(state.steps, key(input.tenantId, stepId));
        if (previous.step_no !== input.stepNo || previous.kind !== input.kind || previous.policy_version !== input.policyVersion) {
          throw new KernelError(409, 'AGENT_IDEMPOTENCY_CONFLICT', 'مفتاح الخطوة مرتبط بخطوة مختلفة.');
        }
        return previous;
      }
      const row = { id: input.id ?? randomUUID(), tenant_id: input.tenantId, run_id: input.runId, step_no: input.stepNo,
        kind: input.kind, status: input.status, summary: input.summary, input_ref: input.inputRef ?? null,
        output_ref: input.outputRef ?? null, policy_version: input.policyVersion, idempotency_key: input.idempotencyKey,
        expires_at: input.expiresAt, created_at: now().toISOString() };
      state.steps.set(k, row.id);
      return put(state.steps, key(input.tenantId, row.id), row);
    },
    updateStep(tenantId, stepId, patch, expectedStatus) {
      const k = key(tenantId, stepId), row = stored(state.steps, k);
      if (!row || row.status !== expectedStatus) return null;
      return put(state.steps, k, { ...row, status: patch.status, output_ref: patch.outputRef ?? row.output_ref });
    },
    async appendTool(input) {
      checkIdempotencyKey(input.idempotencyKey);
      const k = key(input.tenantId, input.runId, 'idem', input.idempotencyKey);
      const toolId = state.tools.get(k);
      if (toolId) {
        const previous = stored(state.tools, key(input.tenantId, toolId));
        if (previous.tool_name !== input.toolName || previous.tool_version !== input.toolVersion || previous.request_fingerprint !== input.requestFingerprint) {
          throw new KernelError(409, 'AGENT_IDEMPOTENCY_CONFLICT', 'مفتاح استدعاء الأداة مرتبط بطلب مختلف.');
        }
        return previous;
      }
      const row = { id: input.id ?? randomUUID(), tenant_id: input.tenantId, run_id: input.runId, step_id: input.stepId ?? null,
        tool_name: input.toolName, tool_version: input.toolVersion, arguments_ref: input.argumentsRef ?? null,
        result_ref: input.resultRef ?? null, status: input.status, idempotency_key: input.idempotencyKey,
        request_fingerprint: input.requestFingerprint, expires_at: input.expiresAt, created_at: now().toISOString() };
      state.tools.set(k, row.id);
      return put(state.tools, key(input.tenantId, row.id), row);
    },
    updateTool(tenantId, toolId, patch, expectedStatus) {
      const k = key(tenantId, toolId), row = stored(state.tools, k);
      if (!row || row.status !== expectedStatus) return null;
      return put(state.tools, k, { ...row, status: patch.status, result_ref: patch.resultRef ?? row.result_ref });
    },
    async checkpoint(input) {
      const k = key(input.tenantId, input.runId, input.version), previous = stored(state.checkpoints, k);
      if (previous) {
        if (previous.state_ref !== input.stateRef || previous.approval_fingerprint !== input.approvalFingerprint) {
          throw new KernelError(409, 'AGENT_CHECKPOINT_CONFLICT', 'نقطة الاستئناف غير مطابقة.');
        }
        return previous;
      }
      return put(state.checkpoints, k, { id: input.id ?? randomUUID(), tenant_id: input.tenantId, run_id: input.runId,
        version: input.version, state_ref: input.stateRef, approval_fingerprint: input.approvalFingerprint ?? null,
        expires_at: input.expiresAt, created_at: now().toISOString() });
    },
    getCheckpoint(tenantId, runId, version) { return stored(state.checkpoints, key(tenantId, runId, version)); },
    async appendOutbox(event) {
      const k = key(event.tenant_id, 'idem', event.idempotency_key), id = state.outbox.get(k);
      if (id) {
        const previous = stored(state.outbox, key(event.tenant_id, id));
        if (previous.event_id !== event.event_id || previous.event_type !== event.event_type || previous.payload_ref !== event.payload_ref) {
          throw new KernelError(409, 'OUTBOX_KEY_CONFLICT', 'مفتاح الحدث مرتبط بحدث مختلف.');
        }
        return previous;
      }
      const row = { ...event, status: 'PENDING', attempts: 0, created_at: now().toISOString(), expires_at: new Date(now().getTime() + 7 * 86400000).toISOString() };
      state.outbox.set(k, event.event_id);
      return put(state.outbox, key(event.tenant_id, event.event_id), row);
    },
    listOutbox(tenantId, limit = 20) {
      return [...state.outbox.entries()].filter(([k]) => k.startsWith(tenantId + '|')).slice(0, limit).map(([, id]) => stored(state.outbox, key(tenantId, id))).filter(Boolean);
    },
    updateOutbox(tenantId, eventId, patch) {
      const k = key(tenantId, eventId), row = stored(state.outbox, k);
      if (!row) throw new KernelError(404, 'OUTBOX_NOT_FOUND', 'الحدث غير موجود.');
      return put(state.outbox, k, { ...row, status: patch.status, attempts: patch.attempts ?? row.attempts });
    },
    async appendMemory(input) {
      return put(state.memory, key(input.tenantId, input.agentKey, input.scope, input.memoryKey), { ...input, created_at: now().toISOString() });
    },
    getMemory(tenantId, agentKey, scope, memoryKey, actorId = null) {
      const row = stored(state.memory, key(tenantId, agentKey, scope, memoryKey));
      if (!row || row.revoked === true || (scope === 'USER' && actorId !== null && row.actorId !== actorId)) return null;
      return row;
    },
  };
  return {
    async transact(work) {
      const snapshot = structuredClone(state);
      try { return await work(tx); }
      catch (error) {
        for (const [name, map] of Object.entries(state)) { map.clear(); for (const [k, v] of snapshot[name]) map.set(k, v); }
        throw error;
      }
    },
    inspect: () => clone(state),
  };
}
