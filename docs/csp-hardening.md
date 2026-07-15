# CSP Hardening — BrightAI

> توثيق خطة إزالة `'unsafe-inline'` من CSP. multi-phase rollout.

---

## الوضع الحالي (ما قبل Phase 1)

`render.yaml` يضبط CSP enforcement على كل responses:

```
script-src 'self' 'unsafe-inline' https://www.googletagmanager.com ...
script-src-elem 'self' 'unsafe-inline' ...
script-src-attr 'unsafe-inline'
```

**المشكلة**: `'unsafe-inline'` يلغي defense-in-depth ضد XSS. أي ثغرة في `<script>` injection تسمح للـ attacker بتنفيذ JavaScript.

**السبب التاريخي**: الموقع hybrid (output: 'static' + @astrojs/node adapter) → prerendered HTML فيه scripts ثابتة → `'unsafe-inline'` كان أبسط حل.

---

## الخطة (3 phases)

### Phase 1 — Soft Enforcement (CURRENT — 2026-07-15)

**الهدف**: راقب violations بدون ما يكسر الموقع.

**ما اتغيّر**:
- `src/middleware.ts` يولّد nonce لكل request عبر `crypto.getRandomValues(16)`.
- middleware يضبط `Content-Security-Policy-Report-Only` (مو enforcement) مع:
  - `'unsafe-inline'` (backward compat مع prerendered)
  - `'nonce-{NONCE}'` (للـ scripts اللي عندها `nonce` attribute)
  - `'strict-dynamic'` (GTM injection الآمن)
  - `report-uri /api/csp-report` (CSP violations تروح للـ endpoint)
- `src/layouts/BaseLayout.astro`: كل الـ `<script>` الـ inline imports عندها `nonce={Astro.locals.cspNonce}`.
- `render.yaml`: CSP enforcement محدّث بـ `report-uri /api/csp-report` للـ prerendered pages.
- `src/pages/api/csp-report.ts`: endpoint جديد يجمع violations → stdout (Sentry يلتقطها).

**التحقق**: 0 violations في الـ Report-Only header لمدة أسبوع.

### Phase 2 — Hard Enforcement (بعد أسبوع 0 violations)

**الهدف**: إزالة `'unsafe-inline'` نهائياً.

**التعديلات**:
1. middleware: غيّر `'Content-Security-Policy-Report-Only'` → `'Content-Security-Policy'`.
2. render.yaml: شيل `'unsafe-inline'` من `script-src`, `script-src-elem`.
3. BaseLayout + KernelLayout: أضف `nonce` على أي `<script>` نسيه الفريق.
4. أي inline script ما عنده `nonce` → نحتاج ننقله لـ `public/js/*.js` (external).

**التحقق**: 
- `curl -I` يعرض CSP بدون `'unsafe-inline'`.
- Console ما يعرض CSP violations.
- GTM/GA/Clarity يشتغلون.

### Phase 3 — Sentry + 3rd-party (لاحقاً)

**الهدف**: حماية Sentry SDK injection + أي 3rd-party inline scripts.

**التعديلات**:
1. Sentry SDK: لازم يستخدم nonce-based أو external script.
2. MarketingScripts.astro: أي inline scripts تحتاج nonce أو external.
3. JSON-LD scripts: `<script type="application/ld+json">` — لا يتأثر بـ `script-src` (لكن نتأكد).

---

## كيف تشتغل الـ Nonce؟

### Generation

`src/middleware.ts` يولّد nonce جديد لكل request:

```ts
const bytes = new Uint8Array(16);
crypto.getRandomValues(bytes);
const nonce = btoa(String.fromCharCode(...bytes)).replace(/=+$/, '');
```

- 128 bits من randomness → مستحيل يتكرر.
- Base64 encoding (22 chars URL-safe).
- جديد كل request → لا reuse.

### Distribution

1. **Middleware** يولّد nonce → يحقن في `Astro.locals.cspNonce`.
2. **Layouts** تستخدم `nonce={Astro.locals.cspNonce}` على كل `<script>` tag.
3. **CSP header** يحل `'nonce-{NONCE}'` placeholder بقيمة الـ nonce الحالي.

### Verification Flow

```
Browser → GET /page/
Middleware → generates nonce=ABC123
Middleware → context.locals.cspNonce = 'ABC123'
Astro page render → <script nonce="ABC123">...</script>
Middleware → Content-Security-Policy-Report-Only: ... 'nonce-ABC123' ...
Browser → executes <script nonce="ABC123"> ✓
```

---

## ملفات معدّلة (Phase 1)

| المسار | النوع | الوصف |
|---|---|---|
| `src/middleware.ts` | معدّل | Report-Only header + strict-dynamic + report-uri |
| `src/layouts/BaseLayout.astro` | معدّل | nonce على الـ 4 inline `<script>` imports |
| `render.yaml` | معدّل | CSP enforcement محدّث بـ report-uri |
| `src/pages/api/csp-report.ts` | جديد | violation report endpoint |

---

## المخاطر

| المخاطرة | الاحتمال | التخفيف |
|---|---|---|
| Phase 1 violations كثيرة (لو فيه inline scripts نسيها الفريق) | متوسط | `'unsafe-inline'` يبقى — violations تنجمع بس ما تكسر شي |
| Astro يحقن inline hydration scripts بدون nonce | متوسط | Phase 2 ينقلها لـ external أو يحقن nonce في build time |
| Sentry SDK يحقن inline script بدون nonce | منخفض | `'strict-dynamic'` يسمح بـ scripts محمّلة من nonced scripts |
| middleware overhead (CPU) | منخفض | يتجاوز static assets (CSS, JS, images) |

---

## Rollback

لو Phase 1 أظهر violations كارثية:

```bash
# 1. علّق الـ Report-Only header في middleware
#    (newHeaders.delete('Content-Security-Policy-Report-Only'))

# 2. أو ارجع لـ commit قبل CSP-HARDENING-001
git revert HEAD
```

لو Phase 2 كسر الموقع (0 violations في Report-Only لكن enforcement يكسر شي):

```bash
# 1. رجّع الـ middleware لـ Report-Only
#    (set 'Content-Security-Policy-Report-Only' بدل 'Content-Security-Policy')

# 2. أو علّق الـ enforcement في render.yaml مؤقتاً
```

---

## المرجعيات

- [CSP nonce-based](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP#nonce-based_csp)
- [CSP strict-dynamic](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP/Strict-Transport-Security)
- [CSP report-uri](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP/report-uri)
- [Astro middleware](https://docs.astro.build/en/guides/middleware/)

---

**صاحب الملف**: BrightAI Workspace Agent
**آخر تحديث**: 2026-07-15
**الإصدار**: 1.0