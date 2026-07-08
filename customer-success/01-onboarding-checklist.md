# 01 — Onboarding Checklist (أول 30 يوم)

> الهدف: **Time to First Value < 7 أيام** ووصول العميل لأول نتيجة ملموسة (أول Evidence File + أول فحص امتثال).
> مربوط بوحدات BrightAI الحقيقية: Kernel (11 وحدة) + 8 حلول + 6 حزم امتثال.

---

## كيف تستخدم الشيك ليست

كل صف يحوي: **المهمة · المسؤول (CSM/Support/العميل) · الحالة · التاريخ**. شِكل الـ CSM يحدّث الحالة يوميًا خلال أول 30 يوم.

| الرمز | المعنى |
|---|---|
| ⬜ | لم تبدأ |
| 🔵 | قيد التنفيذ |
| ✅ | مكتملة |
| ⚠️ | متعثّرة (تحتاج تدخل) |

---

## Day 0 — Kick-off (إطلاق)

| # | المهمة | المسؤول | الحالة | تاريخ |
|---|---|---|---|---|
| 1 | Welcome call مع CSM (30 دقيقة) — تعريف بالرؤية والنتائج المستهدفة | CSM | ⬜ | |
| 2 | كتابة **Success Plan** بمشاركة العميل (النتيجة المرجوة + مؤشرات 90 يوم) | CSM + الراعي | ⬜ | |
| 3 | فتح قناة مشتركة (Slack/Teams) + إضافة العميل لقناة القطاع | CSM | ⬜ | |
| 4 | جدولة أول مراجعة رسمية (Day 15-30) | CSM | ⬜ | |

**English — Day 0**
- Welcome call (30 min) with CSM; co-author the Success Plan (target outcomes + 90-day KPIs); open shared Slack/Teams channel; schedule first formal review.

---

## Day 1-7 — Setup (التأسيس)

| # | المهمة | مربوطة بـ | المسؤول | الحالة | تاريخ |
|---|---|---|---|---|---|
| 5 | النشر التقني لـ Kernel تحت نماذج AI للعميل | Kernel `connectors` | CSM + Technical | ⬜ | |
| 6 | دعوة الفريق + تدريب المستخدمين الأساسيين | Kernel `chat` / `stats` | CSM | ⬜ | |
| 7 | تهيئة أول **Policy** في محرر السياسات البصري | Kernel `policies` | CSM + العميل | ⬜ | |
| 8 | أول **test transaction** تمر بالـ AI Firewall (إخفاء PII) | `ai-firewall` | Technical | ⬜ | |
| 9 | تفعيل **طبقة الموافقات البشرية** للقرارات الحساسة | `human-approval-layer` | CSM | ⬜ | |

**English — Day 1-7**
- Technical deployment of Kernel; team invites + training; first policy configured in the visual policy editor; first test transaction through AI Firewall; Human Approval Layer activated.

---

## Day 8-14 — First Value (أول قيمة)

| # | المهمة | مربوطة بـ | المسؤول | الحالة | تاريخ |
|---|---|---|---|---|---|
| 10 | أول فحص امتثال **PDPL/NCA** عبر حزمة الامتثال | Kernel `compliance` | CSM | ⬜ | |
| 11 | توليد أول **Evidence File** (PDF موقّع جاهز للمدقق) | Kernel `evidence` / `ai-evidence-file` | CSM | ⬜ | |
| 12 | جولة لوحة المؤشرات + شرح Risk Score 0-100 | Kernel `stats` / `reports` | CSM | ⬜ | |
| 13 | جدولة أول تقرير دوري (أسبوعي/شهري/ربعي) | `ai-evidence-file` (scheduled) | CSM | ⬜ | |

**English — Day 8-14**
- First PDPL/NCA compliance check; first auditor-ready Evidence File generated; dashboard tour (Risk Score 0-100); scheduled recurring report.

---

## Day 15-30 — Habit Formation (تثبيت العادة)

| # | المهمة | المسؤول | الحالة | تاريخ |
|---|---|---|---|---|
| 14 | قياس الاستخدام اليومي (عدد الطلبات + المستخدمون المفعّلون) | CSM | ⬜ | |
| 15 | متابعة تبنّي الميزات (أي من الـ8 حلول مستخدم؟) | CSM | ⬜ | |
| 16 | أول اجتماع مراجعة رسمي (تحقق من TTV < 7 أيام) | CSM + الراعي | ⬜ | |
| 17 | تحديث **Success Plan** بالنتائج الفعلية | CSM | ⬜ | |

**English — Day 15-30**
- Measure daily usage; feature adoption check-ins; first formal review meeting; update Success Plan with realized outcomes.

---

## مؤشرات النجاح عند Day 30 (Exit Criteria)

- [ ] العميل ولّد **≥ 1 Evidence File** معتمد.
- [ ] فحص امتثال **PDPL/NCA** ظاهر في لوحة `compliance` (درجة قابلة للقياس).
- [ ] **≥ 3 مستخدمين** مفعّلين من فريق العميل.
- [ ] تقرير دوري مجدول and running.
- [ ] Health Score أولي **≥ 60 (Green)** — انظر `03-health-score-dashboard.md`.

---

## ملاحظات للـ CSM

- لو العميل ما ولّد Evidence File بحلول Day 14 → حالة 🔴، استخدم سيناريو #6 من `04-save-playbook-library.md`.
- لو الاستخدام اليومي ينخفض بعد Day 15 → حالة ⚠️، استخدم سيناريو #1.
- كل التواصل يتم عبر القناة المشتركة + WhatsApp للطوارئ (`+966 538229013`).
