# LeadForm unification + event taxonomy (CRO audit Prompt 4)

**التاريخ:** 18 يوليو 2026
**المصدر:** `audit/CRO/MASTER-CRO-AUDIT-AR.md` (Prompt 4)
**المُنفّذ:** BrightAI Workspace Agent
**الوضع:** Verified locally — 40/40 Playwright checks + 0 critical axe-core

---

## الملخص التنفيذي

وحّدنا كل نماذج الـlead capture في الموقع بمكوّن واحد canonical
(`LeadForm.astro` v2)، حافظنا على Attribution كامل (UTM + referrer + landing
page)، خفّفنا الاحتكاك بحالات loading/success/error واضحة مع retry، أضفنا
honeypot للحماية من البوتات، وطلقنا taxonomy أحداث متوافق مع الـ audit
بدون PII. الصفحة `/contact/` والنموذج في الصفحة الرئيسية (section 12) صاروا
يشتغلون بنفس الـ form وبنفس الحقول ونفس الـ success path. `/thank-you/`
يتعرف على `?id=...` ويعرض رقم الطلب للمستخدم.

النتيجة: نموذج واحد = تجربة موحدة + قياس موحد + تطوير أسرع.

---

## الملفات المتأثرة

| الملف | نوع التغيير | الوصف |
|---|---|---|
| `src/lib/lead-tracker.ts` | جديد | PII-safe events abstraction (6 أحداث + 9 error codes). يرسل لـ dataLayer + gtag + mixpanel، كل payload آمن. |
| `src/scripts/lead-form-handler.js` | جديد | runtime behavior للـ form: UTM capture, validation, honeypot, submit interception, sessionStorage, ARIA state machine. |
| `src/data/marketing.ts` | محدّث | إضافة `LEAD_FORM_ENDPOINTS` (native + AJAX) + `FORM_TAXONOMY` (10 form_id) + `SESSION_KEYS` + `DEFAULT_CONTACT_FIELDS` (8 حقول). |
| `src/components/LeadForm.astro` | rewrite | من formsubmit-only wrapper إلى canonical form مع honeypot + error summary + success panel + form state machine. |
| `src/pages/contact/index.astro` | معدّل | النموذج الداخلي (~150 سطر inline form) استُبدل بـ `<LeadForm>` مع `DEFAULT_CONTACT_FIELDS` و `formId="contact_main"`. حُذف `sectors` array (dead code). |
| `src/pages/index.astro` | معدّل | نموذج section 12 (~12 سطر inline form) استُبدل بـ `<LeadForm>` مع `formId="home_cta"`. CTA والـ trust signals بقوا زي ما هم. |
| `src/pages/thank-you/index.astro` | محدّث | يقرأ `?id=...` من URL ويعرض رقم الطلب + 3 next-step cards. |
| `scripts/playwright/verify-leadform.mjs` | جديد | 40-check end-to-end verification suite (form fields, validation, honeypot, success, retry, ARIA, UTM). |

**الإجمالي:** 4 جديد + 4 معدّل.

---

## الـ Form Contract الجديد

### Fields (DEFAULT_CONTACT_FIELDS)

| الحقل | النوع | مطلوب؟ | autocomplete |
|---|---|---|---|
| `full_name` | text | ✅ | name |
| `work_email` | email | ✅ | email |
| `company` | text | ✅ | organization |
| `role` | select | ✅ | — |
| `primary_need` | select | ✅ | — |
| `phone` | tel | اختياري | tel |
| `message` | textarea | اختياري | — |
| `pdpl_consent` | checkbox | ✅ | — |

`work_email` يستخدم soft check (لا يحظر gmail/hotmail صراحةً، Product يقرر).

### Events (من MASTER-CRO-AUDIT-AR.md §10)

| Event | متى يُطلق | Payload (آمن) |
|---|---|---|
| `form_view` | scroll into view (IntersectionObserver) | form_id, page_path |
| `form_start` | أول focus على أي حقل | form_id, page_path |
| `form_field_error` | blur على حقل فيه خطأ | form_id, page_path, field_name, error_code |
| `form_submit_attempt` | click على submit | form_id, page_path, source, medium, campaign |
| `form_submit_success` | 2xx من الـ AJAX endpoint | form_id, page_path, duration_ms, lead_id, mode |
| `form_submit_failure` | 4xx/5xx/timeout/network | form_id, page_path, error_code, duration_ms |

**قاعدة PII:** `assertNoPii()` يفحص كل payload قبل الإرسال. أي مفتاح في
قائمة المسدود (`email`, `phone`, `message`, إلخ) أو ينتهي بـ `_email` /
`_phone` / `_name` يرمي exception في dev. الـ keys المسموحة: `form_id`,
`page_path`, `source`, `medium`, `campaign`, `field_name`, `error_code`,
`duration_ms`, `lead_id`, `mode`.

### Error Codes (ERROR_CODES)

```
validation_required, validation_email, validation_phone,
validation_min_length, validation_consent,
honeypot_filled, network_error, timeout, server_error,
rate_limited, unknown
```

### Honeypot

- field مخفي بـ `name="_honey"` (formsubmit يتجاهل underscore fields)
- CSS: position absolute, left -9999px, opacity 0, tabindex -1
- لو filled → client يصدر `form_submit_success` (fake)، ما يرسل أي POST حقيقي، يعرض success panel + redirect

### sessionStorage

| Key | الغرض |
|---|---|
| `brightai:lead:<formId>:values` | يحفظ قيم الحقول (ما عدا `pdpl_consent`) للـ Back/Retry |
| `brightai:lead:landing_page` | أول landing page من session، يُحفظ مرة وحدة ويُعاد استخدامه |
| `brightai:lead:<formId>:submitted` | lock بعد submit ناجح عشان success panel يبقى ظاهر عبر view transitions |

`pdpl_consent` **ما ينحفظ أبداً** (privacy by default).

---

## Submit Flow

```
1. user clicks submit
2. handler intercepts (event.preventDefault)
3. honeypot check → if filled: fake success, no POST
4. validate all fields → if any invalid:
   - show error summary
   - set aria-invalid on each invalid field
   - focus first invalid
   - emit form_submit_failure
   - abort
5. emit form_submit_attempt
6. set form state = "loading" (button disabled + spinner)
7. fetch(formsubmit.co/ajax/<inbox>, { body: FormData, signal: AbortController(5s) })
8. on 2xx:
   - emit form_submit_success with duration_ms + lead_id
   - set form state = "success" (success panel replaces form)
   - sessionStorage lock
   - redirect to /thank-you/?id=<lead_id> after 1500ms
9. on 4xx/5xx:
   - emit form_submit_failure (server_error)
   - show form-level error banner
   - reset form state = "idle"
10. on timeout/network error:
    - emit form_submit_failure (timeout or network_error)
    - fallback: native form submit (action=formsubmit.co, _next=/thank-you/)
    - remove JS listener to prevent infinite loop
```

---

## Acceptance Criteria — نتائج التحقق

| الشرط | النتيجة | الدليل |
|---|---|---|
| نموذج واحد canonical لكل الموقع | ✅ | LeadForm.astro المُستخدم في contact + homepage + newsletter + partners + referral + ROI + events |
| Attribution يصل مع الإرسال | ✅ | UTM inputs populated من URL + sessionStorage؛ Playwright test 4/4 ✅ |
| نجاح الإرسال يصل إلى Thank You | ✅ | redirect to `/thank-you/?id=<lead_id>` بعد 1500ms؛ Playwright test ✅ |
| Back/Retry لا يفقد القيم | ✅ | sessionStorage يحفظ + يستعيد القيم؛ consent لا يُحفظ (privacy) |
| Screen reader يعلن الأخطاء | ✅ | role=alert + aria-live على كل error span، role=alert + aria-live=assertive على error summary |
| Honeypot يرفض البوتات | ✅ | Playwright test: filled honeypot → success panel بدون POST + form_submit_success emitted |
| لا PII في Analytics | ✅ | assertNoPii() يطلق exception لو دخل PII؛ events payloads ثابتة |
| loading / success / error states | ✅ | form data-state = idle/loading/success/error؛ success panel يستبدل النموذج |
| build + verify:all | ✅ | 190 صفحة، 0 أخطاء SEO، 0 broken links |
| axe-core (a11y) | ✅ | 0 critical، 0 serious، 0 moderate على /contact/ و / |
| Playwright e2e | ✅ | 40/40 checks passed (ملف: `scripts/playwright/verify-leadform.mjs`) |

---

## القرارات المعمارية (Decisions)

### DEC-CRO-LEADFORM-2026-07-18-001
**نموذج LeadForm.astro = canonical واحد لكل الموقع.** أي نموذج lead جديد
يجب يستخدمه. inline forms ممنوعة. الـ rationale: تجربة موحدة، قياس موحد،
تطوير أسرع، حماية PII موحدة، honeypot موحد.

### DEC-CRO-LEADFORM-2026-07-18-002
**submit mode = `both` افتراضياً** (AJAX + native fallback). الـ JS يعترض
ويستخدم fetch للـ AJAX endpoint → JSON response + state machine. لو فشل
fetch (network/timeout) → fallback إلى native form submit. بدون JS → native
submit مباشرة. كذا الـ UX نفسه في كل الحالات.

### DEC-CRO-LEADFORM-2026-07-18-003
**honeypot style = `name="_honey"` + CSS hidden + tabindex -1.** الـ
formsubmit يتجاهل underscore fields تلقائياً. لو البوت ملأه → silent
success (form_submit_success emitted) + لا POST حقيقي. هذا يكشف البوتات
في analytics بدون alert للـ user.

### DEC-CRO-LEADFORM-2026-07-18-004
**email validation = soft.** الـ Product قرار: ما نحظر gmail/hotmail
صراحةً. لكن نعطي hint في الـ analytics (softHint: 'personal_email') عشان
الـ sales يقدر يميّز B2B من B2C. rationale: مو كل B2B يستخدم بريد الشركة.

### DEC-CRO-LEADFORM-2026-07-18-005
**sessionStorage يحفظ كل القيم ما عدا `pdpl_consent`.** rationale: PDPL
يتطلب موافقة صريحة في كل interaction — حفظ الـ checkbox يخالف روح القانون.
Back/Retry يحفظ name/email/company/phone/message عشان الـ user ما يملأ
كل شي مرة ثانية.

### DEC-CRO-LEADFORM-2026-07-18-006
**redirect بعد success = `/thank-you/?id=<lead_id>`.** شكر page يعرض
رقم الطلب + next steps. الـ lead_id من formsubmit.co (آمن — opaque
identifier، مو PII). يُسجَّل في analytics عشان الـ funnel يربط session
بالـ lead.

---

## Risks المتبقية

1. **formsubmit.co rate limits:** الـ endpoint يقبل ~50 submissions/يوم
   على الـ free tier. لو الـ traffic زاد، نرحّل للـ `/api/lead/` (موجود
   جاهز في `src/pages/api/lead.ts`). البنية قابلة للترقية — نغير
   `LEAD_FORM_ENDPOINTS.ajax` فقط.
2. **CSRF:** formsubmit.co ما يدعم CSRF tokens. لو حساسية عالية،
   نرحّل لـ `/api/lead/` اللي يدعم double-submit cookie pattern.
3. **PII في `referrer`:** الـ referrer قد يكشف الصفحة السابقة (مثل
   `/blog/pdpl-and-ai-saudi/`). هذا أقل حساسية من email/phone لكن يُسجَّل
   في form data. لو الـ privacy team اعترض، نحذف الحقل من الفورم.
4. **`redirectUrl` يُسمح يكون من `form.dataset.redirectUrl`:** لو
   page ضارة set `data-redirect-url`، يقدر يوجه لـ phishing site.
   mitigated: `redirectUrl` يُمرَّر من الـ Astro props (server-rendered)
   ما من الـ user. لا client-side setter.

---

## Follow-up

1. **ترحيل لـ `/api/lead/`** لما يصير free tier من formsubmit.co مشكلة.
   - البنية جاهزة: غيّر `LEAD_FORM_ENDPOINTS.ajax` من formsubmit.co لـ `/api/lead/`
   - عدّل الـ handler يقرأ CSRF token من cookie
   - الـ `/api/lead/` يدعم `Idempotency-Key` header (موجود بالفعل)
2. **Server-side field validation** للـ soft email hint (gmail/hotmail)
   في الـ CRM/HubSpot بدل analytics — عشان الـ sales يشوف الـ hint في الـ lead view.
3. **A/B test على CTA copy** — "احجز ديمو" vs "تواصل معنا" (CRO Prompt 1 يخطط لهذا).
4. **CSP لـ formsubmit.co** — الـ endpoint خارجي. الـ headers الحالية
   قد تحظر fetch. لازم اختبار على الإنتاج. لو فشل، نرحّل لـ `/api/lead/`.

---

## Commit Message المقترحة

```
feat(cro): unify lead forms + add event taxonomy (Prompt 4)

Replaces the inline forms in /contact/ and the homepage section 12 with
a single canonical LeadForm.astro. Adds UTM/referrer/landing-page auto-
capture, a PII-safe event taxonomy (leadTracker), inline validation,
honeypot, sessionStorage Back/Retry, and a state machine for
idle/loading/success/error.

- Create src/lib/lead-tracker.ts (events, PII guard)
- Create src/scripts/lead-form-handler.js (runtime behavior)
- Rewrite src/components/LeadForm.astro (canonical form)
- Add FORM_TAXONOMY + DEFAULT_CONTACT_FIELDS to src/data/marketing.ts
- Replace inline form in src/pages/contact/index.astro
- Replace inline form in src/pages/index.astro (section 12)
- Update src/pages/thank-you/index.astro to display lead_id
- Create scripts/playwright/verify-leadform.mjs (40 checks)

Verification:
- pnpm run build → 190 pages, 0 errors ✅
- pnpm run verify:all → 0 broken links, 0 SEO errors ✅
- pnpm run a11y:scan → 0 critical on /contact/ and / ✅
- node scripts/playwright/verify-leadform.mjs → 40/40 PASSED ✅
```

---

## المرجع

- `audit/CRO/MASTER-CRO-AUDIT-AR.md` §10 (event taxonomy) + §12 (Prompt 4)
- `src/lib/lead-tracker.ts`
- `src/scripts/lead-form-handler.js`
- `src/components/LeadForm.astro`
- `src/data/marketing.ts`
- `scripts/playwright/verify-leadform.mjs`
- `download/qa/leadform-verification.json` (machine-readable report)
