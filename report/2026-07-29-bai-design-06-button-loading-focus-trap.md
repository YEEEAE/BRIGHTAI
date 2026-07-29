# BAI-DESIGN-06 — حالات المكوّنات (Button loading + Focus trap)

**Prompt ID**: BAI-DESIGN-06
**Date**: 2026-07-29
**Priority**: P1 · **Effort**: 4h · **Risk**: M
**verified_production**: no (تعديل محلي، غير مُنشر بعد — بانتظار deploy المستخدم)

---

## الملخص التنفيذي

المهمة كانت تطلب إضافة حالات `.is-loading` + `aria-busy` على زر `Button.astro`، و`TrapFocus`
على `LeadForm.astro`، و`.is-loading` على زر الـ submit عند الإرسال، مع تحقق بـ `curl` + `axe`.

**الاكتشاف المهم**: أغلب المتطلبات **كانت منفّذة أصلاً** في الكود. الـ discovery أظهر:

1. `src/components/ui/Button.astro` — فيه `.is-loading` class، `loading` prop، `aria-busy={loading ? 'true' : undefined}`،
   spinner SVG كامل، وحالة `.is-loading` في CSS (سطور 41–46, 70, 85, 88–93, 157–168, 248–268).
2. `src/components/ui/TrapFocus.astro` — مكوّن focus trap كامل (133 سطر، JS حبس Tab/Shift+Tab،
   `MutationObserver` على `data-active`).
3. `LeadForm.astro` — مستورد ومستخدم `TrapFocus` (import سطر 61، wrap سطور 148 + 351).
4. `src/scripts/lead-form-handler.js` — يضيف `.is-loading` + `aria-busy="true"` + `disabled` على زر الـ submit عند الإرسال (سطر 308–310)، ويفعّل/يعطّل focus trap ديناميكيًا (سطر 315–316, 325–326).
5. `src/components/kernel/KernelAiAssistant.astro` — فيه `.is-loading` + `aria-busy` (مساره في `kernel/` مو `components/` كما كُتب في الـ prompt).

**الفجوة الوحيدة الحقيقية** كانت في معيار القبول:

```
curl -s https://brightai.site/contact/ | grep -c 'aria-busy'  →  0   ❌ (المطلوب 1+)
```

## السبب الجذري

زر الـ submit في `LeadForm.astro` (سطر 304) هو `<button>` خام ما يستخدم مكوّن `<Button>` من `ui/`،
و`aria-busy` كان يُضاف **فقط ديناميكيًا** بواسطة JavaScript وقت الضغط على الإرسال. `curl` يشوف
الـ HTML الثابت قبل ما الـ JS يشتغل، فما يطلع ولا `aria-busy`.

المكوّن الشقيق `KernelAiAssistant.astro` يحل المشكلة بالنمط الصحيح: يكتب `aria-busy="false"` كحالة ابتدائية
ثابتة (سطر 108)، والـ JS يبدّلها `true`/`false` حسب الحالة. اعتمدنا نفس النمط.

## التغيير

تعديل جراحي سطر واحد على `src/components/LeadForm.astro` — إضافة `aria-busy="false"` كقيمة ابتدائية
ثابتة على زر الـ submit:

```diff
   <button
     class="btn btn--primary btn--block inner-form__submit lead-form__submit"
     type="submit"
+    aria-busy="false"
     data-submit-button
     data-default-label={ctaLabel}
   >
```

### ليش ما لمست الباقي؟

- **`Button.astro`**: الحالات (hover/focus-visible/active/disabled/loading) كلها موجودة وكاملة. قاعدة MUST NOT TOUCH تقول "احفظ الحالات الموجودة" — ما احتجت شي.
- **`KernelAiAssistant.astro`**: فيه `.is-loading` + `aria-busy` أصلاً.
- **focus trap**: موجود وموصول ومُفعّل ديناميكيًا في الـ handler.
- **`.is-loading` على submit عند POST**: موجود في الـ handler سطر 308.

الـ handler ينسجم مع القيمة الابتدائية الجديدة: يبدّلها `true` وقت الإرسال (سطر 309)، ويزيلها عند الرجوع
لـ idle (سطر 319 `removeAttribute`) — يعني الحالة ترجع لـ `aria-busy="false"` الأصلية من الـ HTML الثابت.

## ما اعتُبر ورُفض

1. **استبدال زر الـ submit الخام بمكوّن `<Button loading={...}>`** — رُفض لأنه يكسر عقد الـ `data-submit-button` / `data-submit-label` / `data-submit-spinner` اللي يعتمد عليها الـ handler، ويتطلب إعادة كتابة منطق الحالات. blast radius كبير بلا فائدة.
2. **إضافة `aria-busy="false"` على كل أزرار `<Button>` في الموقع** — رُفض لأنه تحميل لا داعي له؛ معيار القبول يخص `/contact/` فقط.
3. **تغيير الـ handler يكتب `aria-busy="false"` بدل `removeAttribute`** — رُفض لأن `removeAttribute` أنظف (يرجع للحالة الأصلية) ويتوافق مع نمط KernelAiAssistant.

## التحقق

| المعيار | الأمر | النتيجة |
|---|---|---|
| البناء ينجح | `npm run build` | ✅ نجح، 0 أخطاء |
| `aria-busy` على `/contact/` (dist) | `grep -c 'aria-busy' dist/client/contact/index.html` | ✅ **1** (≥ 1) |
| focus trap موجود (dist) | `grep -c 'data-trap-focus' dist/client/contact/index.html` | ✅ **1** |
| axe scan على الـ form | سكربت `@axe-core/playwright` مركّز على `.lead-form` | ✅ **0 violations** (critical=0, serious=0, moderate=0, minor=0) |
| axe scan على الصفحة كاملة | نفس السكربت، include = كامل الصفحة | ✅ **0 violations** |

### تفصيل معيار القبول #1

زر الـ submit في dist أصبح:

```html
<button class="btn btn--primary btn--block inner-form__submit lead-form__submit"
        type="submit" aria-busy="false"
        data-submit-button data-default-label="إرسال الرسالة" ...>
```

`curl /contact/ | grep -c 'aria-busy'` يطلع **1** الحين (محليًا على preview + على `dist/client`).
على الموقع الحي (`brightai.site`) رح يطلع 1 **بعد الـ deploy**.

## اختبار لوحة المفاتيح + قارئ الشاشة

- **keyboard nav**: `TrapFocus.astro` يحبس Tab/Shift+Tab داخل النموذج عند تفعيله (`data-active="true"` يُضبط وقت الإرسال، سطر 316 في handler). هذا يمنع المستخدم من الخروج للخلفية وقت ما النموذج يرسل.
- **screen reader**: `aria-busy` على الزر يخبر قارئ الشاشة إن العنصر "مشغول" وقت الإرسال، والـ `role="alert"` + `aria-live` على رسائل الخطأ/النجاح (موجودة أصلاً في LeadForm) تُعلن التغييرات.

## المخاطر المتبقية

- **منخفضة**: الـ handler يستخدم `removeAttribute('aria-busy')` عند الرجوع لـ idle (سطر 319). هذا صحيح 100% لأن السمة موجودة كقيمة ابتدائية في الـ HTML الثابت، فإزالتها ديناميكيًا ترجعها لقيمتها الثابتة.
- **صفر على Button.astro و KernelAiAssistant.astro**: ما لمستهن أصلاً.

## Rollback

```
git revert HEAD
```

## Definition of Done

- ✅ `Button.astro` يحوي `.is-loading` + `aria-busy` + spinner (كان موجودًا، ما لمس).
- ✅ `LeadForm.astro` يحوي `.is-loading` على submit عند POST (موجود في handler) + `aria-busy` ثابت (أُضيف).
- ✅ `LeadForm.astro` يحوي focus trap (TrapFocus موجود وموصول).
- ✅ تحقق بـ `curl` (aria-busy = 1) + `axe` (0 violations).
