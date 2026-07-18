# CHAT-SESSION-2026-07-15 — Redis-backed multi-turn context store for /api/ai/chat/

**Date**: 2026-07-15
**Agent**: Mavis (BrightAI Workspace Agent v2.3)
**Task**: إضافة session store عبر Redis لحفظ آخر 8 رسائل per session، TTL 10 دقائق، تمريرها كـ conversation context لـ Groq/Gemini.
**Mode**: Senior
**Branch**: not created (per brain.md "لاتنشئ اي commits جديده")

## Executive Summary

ضيفنا session store متعدد الأدوار لـ `/api/ai/chat/`. لما الـ client يبعت `sessionId` (UUID v4 أو v7) في request body، الـ endpoint يجيب آخر 8 رسائل من Redis ويرسلها كـ context history لـ Groq/Gemini. بعد ما يرد الـ provider، نخزّن الـ user message + assistant reply في نفس الـ Redis LIST بـ `LPUSH + LTRIM 0 7 + EXPIRE 600` (pipeline واحد، round-trip واحد).

النظام graceful: لو Redis unavailable، يصير "degraded mode" (في-ذاكرة Map) مع `X-Chat-Session: degraded` header بدلًا من 503. الـ endpoint ما يفشل في outage.

الـ acceptance: **حوار 5 دورات يحافظ على السياق** ✅ (مبرهن بـ test #10 — turn 6 يشوف turns 2-5 المخزّنة بعد LTRIM). الـ "+12% AI" claim حُذف من الهدف لأنه ما كان مبني على benchmark.

## Problem Context

### الفرضية الأصلية vs الواقع

طلب المستخدم: "Redis (موجود بالفعل للـ rate limit)". اكتشفت إن الـ rate limit في `src/pages/api/ai/chat.ts` في الحقيقة in-memory Map (`const buckets = new Map<string, Bucket>();`). Redis شغّال في `apps/dashboard/lib/firewall/ratelimit/redis-bucket.ts` (الـ dashboard المنفصل)، مو في الـ marketing site. لذلك احتاجنا نضيف ioredis + REDIS_URL للـ marketing site (موافقة المستخدم على المساس بـ `package.json` و `render.yaml` المحميّين).

### الـ acceptance الفعلي

- ✅ "حوار 5 دورات يحافظ على السياق" — test #10 يثبت هذا.
- ❌ "+12% AI" — حُذف لأنه رقم تخميني بدون مرجع.

## Files Changed

| File | Type | Lines | Purpose |
|---|---|---|---|
| `src/lib/redis.ts` | جديد | 11.7KB | Lazy-init ioredis + ChatSessionStore interface + RedisStore + InMemoryStore fallback + pipeline |
| `scripts/test-ts-loader.mjs` | جديد | 2.8KB | Self-registering Node 22 ESM loader hook (حلّ extension resolution gap) |
| `scripts/test-ts-loader-hook.mjs` | جديد | 1.8KB | Companion hook file (referenced by loader) |
| `scripts/test-chat-session.mjs` | جديد | 16.9KB | 16 اختبار node --test (5 store-level + 11 handler-level) |
| `src/pages/api/ai/chat.ts` | معدّل | +~80 سطر | UUID validator + sessionId handling + history fetch + context injection + persist + header |
| `packages/config/src/constants.ts` | معدّل | +30 سطر | CHAT_SESSION_LIMITS block (MAX_MESSAGES=8, TTL_SECONDS=600, SESSION_ID_MAX_CHARS=64, STORED_MESSAGE_MAX_CHARS=4000) |
| `packages/config/src/types.ts` | معدّل | +1 سطر | export CHAT_SESSION_LIMITS |
| `package.json` (root) | معدّل | +5 أسطر | +ioredis@^5.4.1 + @brightai/config@workspace:* + test:chat-session script + إضافته لـ verify:all chain |
| `render.yaml` | معدّل | +7 أسطر | +REDIS_URL env sync:false + documentation block |
| `.env.example` | معدّل | +5 أسطر | +REDIS_URL= documentation |

**Net**: 4 جديد + 6 معدّل + 0 محذوف. `apps/dashboard/**` ما تمسّ.

## Architecture

### Store Abstraction (`src/lib/redis.ts`)

```ts
interface ChatSessionStore {
  push(sessionId, messages, { maxMessages, ttlSeconds }): Promise<StoreResult<true>>;
  recent(sessionId, max): Promise<StoreResult<ChatMessage[]>>;
  close(): Promise<void>;
}
```

تطبيقان بنفس الـ interface:
- **RedisStore** (production): ioredis client، lazy-connect، pipeline `LPUSH + LTRIM + EXPIRE` في round-trip واحد.
- **InMemoryStore** (fallback): Map per session، prepend newest-first، LTRIM via slice، TTL via resetAt + evictIfExpired. Bounded بـ 10k sessions (يفلت الأقدم إذا زاد).

Factory: `getChatSessionStore()` يرجّع singleton. يكتشف تلقائيًا أي backend متاح (Redis URL set + connection ready → Redis؛ غير ذلك → InMemory).

### Handler Flow (`src/pages/api/ai/chat.ts`)

```
POST /api/ai/chat/
  ↓
1. Origin allowlist (KRN-003)
2. Rate limit (10/min/IP)
3. Parse JSON body
4. Validate message (≤ 4000 chars)
5. Reject client-supplied systemPrompt (KRN-001)
6. Resolve server-side systemPrompt via promptId allowlist
7. NEW: Validate optional sessionId (UUID regex, ≤ 64 chars)
   ├─ valid:   recent(sessionId, 8) → history + degraded flag
   └─ invalid: 400 invalid_session_id
8. Provider selection (groq | gemini | auto)
9. NEW: Build providerMessages = [...history, currentUserMessage]
10. Call provider (with abort timeout)
11. NEW: persist([currentUser, currentAssistant], { max: 8, ttl: 600 })
12. Return { reply, provider, sessionId, X-Chat-Session: ok|degraded }
```

### Provider Mapping

| Provider | API shape | Our mapping |
|---|---|---|
| Groq (OpenAI-compatible) | `messages: [{role: "system\|user\|assistant", content}]` | Direct: history + current user mapped to `user`/`assistant` roles |
| Gemini (Google) | `contents: [{role: "user\|model", parts: [{text}]}]` | `assistant` → `model`; system prompt → separate `systemInstruction` field |

Both APIs support multi-turn natively، فقط نضيف history قبل current user message.

## Verification

### Test Results

```
$ npm run test:chat-session
# Subtest: store: push + recent returns chronological order        ok
# Subtest: store: LTRIM keeps only the most recent maxMessages     ok
# Subtest: store: different sessionIds are isolated                ok
# Subtest: store: degraded flag is true when in-memory fallback     ok
# Subtest: store: recent() on unknown sessionId returns empty      ok
# Subtest: handler: missing sessionId → no Redis access             ok
# Subtest: handler: malformed sessionId → 400                       ok
# Subtest: handler: oversized sessionId → 400 (defensive cap)       ok
# Subtest: handler: first turn with valid sessionId                ok
# Subtest: handler: 5-turn conversation preserves context          ok  ← ACCEPTANCE
# Subtest: handler: different sessionIds do not see each other     ok
# Subtest: handler: provider failure on auto mode → Gemini fallback ok
# Subtest: handler: when both providers fail → 502                  ok
# Subtest: handler: rejects client-supplied systemPrompt (KRN-001)  ok
# Subtest: handler: rejects non-string message                      ok
# Subtest: handler: 5-turn conversation survives a provider write   ok
# tests 16  pass 16  fail 0  duration_ms 170
```

### Build + Verify

```
$ npm run build
[build] 190 pages built, 0 errors ✅

$ npm run verify:all
- 16/16 chat-session tests pass
- 190 HTML files checked
- 0 broken links (63,724 references scanned)
- 6/6 hreflang pairs
- 5/5 service pages
- 166 sitemap URLs
- 0 errors, 0 warnings ✅
```

### E2E Curl (no GROQ_API_KEY in dev → provider 502 expected)

```bash
# No sessionId → 502 (provider error, expected)
curl -X POST /api/ai/chat/ -d '{"message":"hi"}' -H "Origin: https://brightai.site"
→ {"error":"provider_failed","detail":"GEMINI_API_KEY not configured"} HTTP 502

# Invalid sessionId → 400
curl -X POST /api/ai/chat/ -d '{"message":"hi","sessionId":"not-a-uuid"}'
→ {"error":"invalid_session_id","hint":"sessionId must be a UUID v4 or v7..."} HTTP 400

# Valid sessionId → 502 (provider error; X-Chat-Session: ok is set on success path)
curl -X POST /api/ai/chat/ -d '{"message":"hi","sessionId":"550e8400-..."}'
→ {"error":"provider_failed","detail":"..."} HTTP 502
  (Cache-Control: no-store, X-Content-Type-Options: nosniff ✓)

# Oversized sessionId → 400
curl -X POST /api/ai/chat/ -d '{"message":"hi","sessionId":"xxx...200chars"}'
→ {"error":"invalid_session_id",...} HTTP 400
```

## Decisions (3 new)

### DEC-CHAT-SESSION-2026-07-15-001: In-memory fallback (no Redis)

**Decision**: الـ endpoint ما يفشل لو Redis unavailable. يصير degraded (X-Chat-Session: degraded header) ويستخدم in-memory Map.

**Rationale**: UX أولوية على infra durability. لو user يكتب رسالة وRedis down، أفضل ما نخسره بدل 503.

**Reversal cost**: low (just add a Redis check at boot, fail-fast if missing).

**Rejected alternative**: fail-closed (503 لو Redis down) — يكسر UX في outage.

### DEC-CHAT-SESSION-2026-07-15-002: Pipeline LPUSH + LTRIM + EXPIRE (3 commands, 1 round-trip)

**Decision**: RedisStore.push() uses `pipeline.lpush(key, ...msgs).ltrim(key, 0, MAX-1).expire(key, TTL)`.

**Rationale**: 
- Atomicity: Redis applies them in order without interleaving from other clients.
- Latency: one TCP round-trip instead of three.
- Correctness: prevents a race where a push extends the list but EXPIRE gets lost (e.g. timeout).

**Reversal cost**: zero (no separate EXPIRE call to maintain).

### DEC-CHAT-SESSION-2026-07-15-003: Drop +12% AI claim

**Decision**: Removed the "Expected score improvement: AI +12%" metric from the original task.

**Rationale**: The number had no benchmark, no human-eval, no A/B test behind it. The actual acceptance criterion ("5 turns preserve context") is testable and was verified.

**Reversal cost**: zero (the number was the only reference).

## Risks

1. **REDIS_URL في Render env** (sync:false في render.yaml) — user يلزم يحدّث Render dashboard يدويًا. لو نسيان، الـ endpoint يصير degraded mode (يشتغل بس ما يحفظ عبر restart).

2. **ioredis bundle** (41KB on disk) — server-only (API route)، ما يوصل لـ client bundle. **لا تأثير على Core Web Vitals**. يقاس: `node_modules/ioredis` total + sub-deps.

3. **Redis key namespace collision** — namespace `chat:sess:` prefix يضمن isolation. لو مشروع ثاني يشارك نفس Redis، يلزم coordination (ما في حالياً).

4. **Race condition** بين push و read على نفس sessionId — Redis pipeline atomic. In-memory fallback single-process، race-free.

5. **PII in history** — kernel prompts تتعامل مع بيانات حساسة (PDPL context). stored messages لا تحتوي systemPrompt (فقط user/assistant). لو client يمرّر PII في message، يُخزّن as-is. **later**: encryption-at-rest option.

6. **render.yaml protected file** — تم تعديله بموافقة المستخدم. لو philosophy صارمة: "أي تعديل على render.yaml = approval gate"، نقدر نرجع للـ in-memory فقط (الخيار B اللي رفضه المستخدم).

7. **Test infrastructure** — uses Node 22 `--experimental-strip-types` (could change in future Node versions). Test loader (`scripts/test-ts-loader.mjs`) هو حل مخصّص للـ Node 22.22. لو رقيت Node، يلزم تتحقق.

8. **Performance**: 8 messages × 4000 chars max × 8 = 256KB max context per request. GPT/Gemini context windows are 32k-128k tokens ≈ 130-500KB. **OK** at 8 messages.

## Rollback Plan

```bash
# 1. Revert the file changes
git checkout -- src/lib/redis.ts src/pages/api/ai/chat.ts \
  packages/config/src/constants.ts packages/config/src/types.ts \
  scripts/test-chat-session.mjs scripts/test-ts-loader.mjs scripts/test-ts-loader-hook.mjs

# 2. Remove from package.json (2 deps + 2 scripts)
# 3. Remove REDIS_URL from render.yaml
# 4. Verify
npm run build
npm run verify:all
```

Time to rollback: ~10 min. **No data migration needed** (the in-memory Map dies with the process; the Redis namespace is `chat:sess:` so old keys can be deleted with `redis-cli --scan --pattern 'chat:sess:*' | xargs redis-cli del`).

## What's NOT Done (User Action Required)

1. **Render dashboard → set REDIS_URL secret**. The `sync: false` in render.yaml means the value is not committed; it must be set in the Render UI.

2. **Choose Redis provider**. Render Key Value (built-in, ~$10/mo for 256MB), Upstash (free tier 10K commands/day), or Redis Cloud. Recommendation: **Render Key Value** (lowest ops cost; same region as the Node service).

3. **Update `src/components/kernel/KernelAiAssistant.astro`** (client-side):
   - Generate `sessionId` (UUID v4) on first interaction, persist in `sessionStorage` (already used per KERNEL-AI-2026-07-14).
   - Send `sessionId` with every fetch to `/api/ai/chat/`.
   - Read `X-Chat-Session` response header; if `degraded`, show a notice "السياق ما يحفظ عبر reloads في الوقت الحالي".

4. **Branch + commit + PR** (per brain.md "لاتنشئ اي commits جديده"). User must initiate.

5. **Smoke test on production** after deploy: 5-turn conversation in the kernel AI assistant → verify context preserved.

6. **(Optional) Playwright E2E** on Render preview — measures real 5-turn context with real GROQ_API_KEY. Current unit tests use mocked fetch, so they prove the *plumbing* works, not the *quality* of context. Optional follow-up.

## Suggested Follow-up

- (1) Render deploy + REDIS_URL secret + post-deploy smoke (5-turn E2E).
- (2) Update KernelAiAssistant.astro (client-side sessionId generation).
- (3) Measure Core Web Vitals after deploy — verify LCP didn't regress.
- (4) Document REDIS_URL in ops runbook (deploy + monitoring + restart recovery).
- (5) Branch + PR + commit (user decision).
- (6) Optional: Playwright E2E on Render preview (real 5-turn test).
- (7) Optional: add `"type": "module"` to `packages/config/package.json` to silence Node test warning.
- (8) Optional: add `engines: { node: ">=22.22" }` to `package.json` (root) to make the Node version requirement explicit for future agents.
