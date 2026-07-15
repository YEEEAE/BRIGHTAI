# Streaming Redaction — إزالة HIGH-02 (redaction صحيح عبر حدود الـ chunks)

**Date**: 2026-07-15
**Agent**: BrightAI Workspace Agent
**Task ID**: STREAMING-REDACTION-2026-07-15
**Mode**: Senior
**Related KI**: KI-053 (open → **resolved**)
**Predecessors**: DASHBOARD-BUILD-FIX-2026-07-15 (CRITICAL-01), PRISMA-DETERMINISTIC-FIX-2026-07-15 (CRITICAL-02), CI-BUILD-GUARD-2026-07-15 (CRITICAL-03)

---

## الملخص التنفيذي

كان `handleStream` في `apps/dashboard/app/api/firewall/chat/completions/route.ts` يحتوي على bug privacy-critical: الـ buffer يُمسح كاملاً بعد كل flush بدون overlap → PII مقسمة عبر flush boundaries تتسرب للـ client + تُحفظ raw في DB.

أنشأت `lib/firewall/engine/streaming-redaction.ts` بـ 4 آليات:

1. **Trailing overlap buffer** (64 chars، يغطي أطول regex = SAUDI_IBAN 24 char) → PII اللي تبدأ في round N وتنتهي في round N+1 تتكشف في الـ round التالي.
2. **Safe-cutoff algorithm** يمدد `safeRawEnd` لأي detection تعبر الـ boundary → ما نصدر PII جزئية.
3. **UTF-16 boundaries** (`trimToUtf16Boundary`) → ما نكسر surrogate pairs (emoji 🔑).
4. **Closed failure** على `detect()` throw → fail-closed sentinel + stream يقفل. ما في raw output leak.

بالإضافة: **إزالة تخزين الـ raw output** من DB. `fullContent += chunk.content` (الـ raw accumulator) استُبدل بـ `fullRedactedContent` (post-redaction). الـ raw assistant text ما يلمس الـ database أبداً.

**النتيجة**: 53/53 tests جديدة passed في 7ms (cross-validation 8 samples × 4 chunk sizes = 32 property tests). Full vitest suite: **123/123 passed** (was 70، صفر regression). HIGH-02 مرفوع.

---

## ما تغيّر

| File | Change Type | الوصف |
|---|---|---|
| `apps/dashboard/lib/firewall/engine/streaming-redaction.ts` | **جديد** | ~280 سطر: `redactStream` (pure function for testing) + `redactStreamGenerator` (AsyncGenerator for streaming use) + `trimToUtf16Boundary` helper + `StreamRedactionOptions` / `StreamRedactionResult` types. |
| `apps/dashboard/app/api/firewall/chat/completions/route.ts` | Edited | `handleStream` معاد كتابتها (140 سطر). `fullContent` (raw) → `fullRedactedContent` (redacted). `totalOutputDetections: number` → `outputTypes: Set<string>` (unique types). AIRequest status يستخدم 'REJECTED' على failure (مو 'BLOCKED' — مو في Prisma enum). |
| `apps/dashboard/tests/firewall/streaming-redaction.test.ts` | **جديد** | 53 test عبر 10 describe blocks: Saudi ID (2/3/4/5 chunks)، Saudi phone (2/3 chunks)، IBAN + cards (3/4 chunks)، multi-PII، UTF-16 emoji، plain text regression، closed failure، type tracking, generator deltas, cross-validation matrix. |

**ما تمس**: `lib/firewall/detectors/ner.ts`، `lib/firewall/detectors/regex.ts`، `lib/firewall/engine/redaction.ts` (الـ `applyActions` + `dedupeOverlap` unchanged). كل الـ firewall tests الموجودة (70 tests، 0 regression).

---

## الـ Algorithm

### Trailing Overlap Buffer

```ts
const OVERLAP = 64;
let buffer = '';
let committedRawEnd = 0;

// On each flush:
let safeRawEnd = buffer.length < committedRawEnd + OVERLAP
  ? buffer.length                                  // too small for overlap
  : Math.max(committedRawEnd, buffer.length - OVERLAP);  // keep overlap

// Extend safeRawEnd for any detection crossing the boundary:
for (const det of detections) {
  if (det.start < safeRawEnd && det.end > safeRawEnd) {
    safeRawEnd = det.end;
    holds++;
  }
}

// Force-commit if buffer is dangerously large:
if (buffer.length >= MAX_BUFFER) safeRawEnd = buffer.length;

// Trim to UTF-16 boundary:
safeRawEnd = trimToUtf16Boundary(buffer, safeRawEnd);

// Emit slice [committedRawEnd..safeRawEnd] with detections in that range.
```

### Key Properties

1. **No partial PII emission**: if a detection crosses `safeRawEnd`, we extend the cutoff to include the full detection. Never emit "10294" when the actual PII is "1029482103".

2. **No raw output storage**: `fullRedactedContent += ev.delta` (post-redaction). The `groqStream` chunks are never concatenated into a "raw" accumulator.

3. **UTF-16 safety**: surrogate pairs (D83D-DD11 for 🔑) are detected and the boundary trimmed. Emitted output contains no U+FFFD replacement chars.

4. **Closed failure**: any `detect()` throw → emit `\n\n[firewall_error:msg]` sentinel + close stream. Pending buffer is discarded. Caller sees `failed: true`.

5. **Force-commit safety valve**: if buffer grows past 4096 chars without finding a safe commit point (pathological long PII), force-commit everything to avoid indefinite stalls.

### Test Cases Cross-Validation

The acceptance criterion from brief: **"response reconstructed يطابق redacted expected output"**.

Verified via **8 sample texts × 4 chunk sizes (2/3/4/5) = 32 property tests**:

```ts
const SAMPLES = [
  'simple ID',                    // 'My ID is 1029482103.'
  'ID + Arabic name',             // 'اسمي سارة ورقمي 1029482103'
  'phone only',                   // 'اتصل على +966501234567'
  'IBAN only',                    // 'SA0380000000608010167519'
  'multi PII',                    // 'ID 1029482103 phone +966501234567 IBAN SA0380000000608010167519'
  'card',                         // 'Card 4111 1111 1111 1111 here'
  'plain text',                   // 'The quick brown fox jumps over the lazy dog.'
  'Arabic plain',                 // 'السلام عليكم ورحمة الله وبركاته'
];

for (const n of [2, 3, 4, 5]) {
  it(`matches single-shot for: ${sample.name} split into ${n} chunks`, async () => {
    const chunks = splitChunks(sample.text, n);
    const result = await redactStream(chunks, { policy, ctx, detect });
    expect(result.redacted).toBe(redactOnce(sample.text));
  });
}
```

**All 32 cross-validation tests pass.**

---

## نتائج التحقق

| Check | Result | Notes |
|---|---|---|
| `pnpm exec vitest run tests/firewall/streaming-redaction.test.ts` | ✅ **53/53 passed** in 7ms | كل الـ acceptance criteria |
| `pnpm exec vitest run` (full suite) | ✅ **123/123 passed** (was 70) | +53 جديد، 0 regression |
| NER model load time | ✅ 2.0s | لم يتأثر |
| `pnpm exec tsc --noEmit` (dashboard) | ✅ 0 errors | |
| `pnpm run build` (next build full pipeline) | ✅ success | 22 routes compiled, middleware 76.8kB |
| Cross-validation: 8 samples × 4 chunk sizes | ✅ **32/32 passed** | reconstructed === single-shot |
| UTF-16 boundary safety | ✅ 2 tests | emoji ما ينكسر، صفر U+FFFD |
| Closed failure on detect throw | ✅ 2 tests | `failed: true` + sentinel |
| Type tracking | ✅ | `types` array sorted + unique |

---

## Risks المتبقية

### MaxBuffer force-commit (4096 chars)
- لو PII يتجاوز 4096 chars (pathological)، force-commit يصدر بدون redaction آمنة.
- **mitigation**: SAUDI_IBAN = 24 chars، أكبر PII regex. 4096 = margin > 100x. لو أحد أضاف PII type بطول غير عادي، يعدل `maxBuffer` في الـ options.

### Async detector transient failures
- Closed failure = stream يقفل على أول `detect()` throw.
- **tradeoff**: privacy > availability. الـ regex-only path يكمل لو NER فقط يفشل.
- **mitigation**: لو NER failure شائع، الـ user يفقد الـ response. لكن NER يستخدم lazy load + globalThis cache، يفشل بس على network errors نادرة.

### Type tracking inflation (false positives)
- لو false positive في round N+1، الـ type يضاف إلى `outputTypes` حتى لو ما كان موجود في الـ ground truth.
- **mitigation**: الـ `outputTypes` يحفظ الـ ground truth كما كشف، الـ audit log يستخدم الـ set. ما في overcounting لـ critical types.

### Bundle size
- الـ `streaming-redaction.ts` جديد يضيف ~3KB gzipped للـ server bundle.
- **mitigation**: negligible (< 0.5% زيادة). الـ firewall route هو lazy load anyway.

### `AIRequest.status: 'REJECTED'` على failure
- الـ Prisma enum: PENDING/APPROVED/REJECTED/AUTO_APPROVED/EXPIRED.
- اخترت 'REJECTED' بدل 'BLOCKED' (مو في الـ enum).
- **mitigation**: 'BLOCKED' ينقل للـ audit log (`blocked: true` field) منفصل عن الـ status.

---

## Follow-up Suggestions

1. **أولوية #1 — live integration test**: اكتب test يستخدم mock Groq stream (في `tests/integration/`) يتحقق إن الـ SSE events المسلسلة من `handleStream` تطابق الـ redacted text المتوقع end-to-end.
2. **أولوية #2 — metrics**: أضف Prometheus counter للـ `holds` (number of times overlap extended) + `failed` (number of closed failures) → visibility في production.
3. **أولوية #3 — Adaptive overlap**: لو الـ stream rate عالي (chunks صغيرة) والـ PII rate عالي، ارفع overlap ديناميكياً. تحسين أداء.
4. **أولوية #4 — Backpressure handling**: لو الـ client بطيء في الاستقبال، الـ buffer ينمو. أضف max-buffer + drop-stream behavior.

---

## خطة الـ Rollback

```bash
git revert <commit-sha>  # يحذف الـ 3 ملفات كوحدة واحدة
# الـ handleStream يرجع للـ buggy version (PII leak ممكن يرجع)
# الـ 53 tests الـ جديدة تُحذف
```

**Rollback safety**: الـ module الجديد standalone، الـ modifications على `route.ts` معزولة. لا تأثير على أي code آخر.

---

## الـ commit message المقترح

```
fix(firewall): streaming redaction across chunk boundaries (HIGH-02)

The streaming handler in /api/firewall/chat/completions had two
privacy-critical bugs:

1. Buffer reset on flush discarded all trailing chars without overlap.
   A Saudi ID "1029482103" split as "10294" (chunk N) and "82103"
   (chunk N+1) never matched the regex, so the raw PII leaked to
   the client. Same for IBANs, phones, credit cards, Arabic names.

2. fullContent += chunk.content accumulated RAW assistant text into
   the persisted AIRequest row. Even when redaction was applied to
   the streamed deltas, the database stored the original PII.

Fix (single atomic unit):

- New module lib/firewall/engine/streaming-redaction.ts:
  - Trailing overlap buffer (64 chars; covers the longest regex —
    SAUDI_IBAN = 24 chars).
  - Safe-cutoff algorithm: if a detection straddles the proposed
    boundary, extend to det.end so we never emit partial PII.
  - UTF-16 boundary safety (no surrogate-pair splits).
  - Closed failure on detect() throw (fail-closed sentinel).
  - Pure function redactStream + AsyncGenerator
    redactStreamGenerator for SSE delivery.
  - Force-commit safety valve at 4096 chars (avoids stalls on
    pathological long PII).

- handleStream rewrite in route.ts:
  - Replaces inline buffer/flush logic with the new generator.
  - fullContent (raw) → fullRedactedContent (post-redaction).
  - outputTypes: Set<string> replaces totalOutputDetections count.
  - AIRequest.status='REJECTED' on stream failure (Prisma enum
    doesn't have BLOCKED).
  - closed failure emits [firewall_error:...] sentinel then closes.

- 53 new tests in tests/firewall/streaming-redaction.test.ts:
  - Saudi ID split across 2/3/5 chunks
  - Saudi phone split across 2/3 chunks
  - IBAN + credit card mid-digit split
  - Multi-PII in same stream
  - UTF-16 surrogate pair boundaries (emoji)
  - Closed failure on detect throw
  - Cross-validation matrix: 8 samples × 4 chunk sizes = 32
    property tests confirming reconstructed === single-shot.

Verification:
- vitest tests/firewall/streaming-redaction.test.ts → 53/53 in 7ms
- vitest full suite → 123/123 (was 70; +53, 0 regression)
- tsc --noEmit → 0 errors
- next build → success
- NER model load → 2.0s (unchanged)

Refs: KI-053
```

---

## الخلاصة

- ✅ HIGH-02 — **resolved** (overlap buffer + safe-cutoff + UTF-16 + closed failure + no raw storage).
- ✅ صفر regression (123/123 tests pass، NER 2s، build success).
- ✅ Acceptance criterion: 32 cross-validation tests pass (reconstructed === single-shot).
- 🎯 **التوصية**: production deploy بعد CI passes (CI-BUILD-GUARD-2026-07-15 يكتشف أي regression).