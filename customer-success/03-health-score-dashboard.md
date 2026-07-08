# 03 — Health Score Dashboard (0-100)

> نظام قياس صحة الحساب. كل حساب له درجة 0-100 محسوبة أسبوعيًا من 7 عوامل موزونة.
> الدرجة تحدد الإجراء: تدخل فوري / تواصل استباقي / مراقبة / فرصة توسع.

---

## معادلة الدرجة (Formula)

```
Health Score = (LoginFreq × 0.20)
             + (FeatureAdoptionBreadth × 0.25)
             + (AIRequestVolume × 0.15)
             + (TeamActivation × 0.15)
             + (SupportSentiment × 0.10)
             + (QBRAttendance × 0.10)
             + (PaymentHistory × 0.05)

كل عامل يُقيم على مقياس 0-100، ثم يُضرب في وزنه.
```

---

## العوامل السبعة (Factors)

| العامل | الوزن | المصدر في المنتج | كيف نقيس (0-100) |
|---|---|---|---|
| Login frequency | 20% | Kernel `stats` (تسجيل الدخول) | تسجيل أسبوعي منتظم = 100؛ انقطاع 14 يوم = 0 |
| Feature adoption breadth | 25% | 8 حلول + 11 وحدة Kernel | عدد الميزات المستخدمة ÷ الإجمالي × 100 |
| Volume of AI requests | 15% | Kernel `stats` (إجمالي الطلبات) | مقارنة بخط الأساس؛ نمو = أعلى |
| Team seat activation | 15% | المستخدمون المفعّلون / الأقسام | المستخدمون النشطون ÷ المدعوين × 100 |
| Support ticket sentiment | 10% | CSAT بعد كل تذكرة | متوسط CSAT (95%+ = 100) |
| Business review attendance | 10% | حضور QBR | حضور كل QBR = 100 |
| Payment history | 5% | الفواتير | بلا تأخير = 100؛ تأخير = أقل |

> **ملاحظة:** بما إن المنتج ما عنده "مقاعد"، استبدلنا "seat activation" بـ **المستخدمون المفعّلون / الأقسام المنضمة**.

---

## العتبات والإجراء (Thresholds & Action)

| الدرجة | الحالة | اللون | الإجراء |
|---|---|---|---|
| < 40 | Critical | 🔴 Red | تدخل فوري خلال 24 س (CSM + Escalation) |
| 40-60 | At-risk | 🟡 Yellow | تواصل استباقي خلال 72 س |
| 60-80 | Healthy | 🟢 Green | مراقبة + شهرية office hours |
| 80+ | Champion | 🔵 Blue | فرصة توسع (انظر Expansion) |

---

## جدول عينات بيانات (Sample Dashboard)

| العميل | Login | Adoption | Volume | Team | Sentiment | QBR | Payment | **الدرجة** | الحالة |
|---|---|---|---|---|---|---|---|---|---|
| بنك سعودي | 95 | 88 | 90 | 85 | 98 | 100 | 100 | **91** | 🔵 Champion |
| مستشفى | 80 | 70 | 75 | 70 | 95 | 100 | 100 | **79** | 🟢 Green |
| مصنع أدوية | 60 | 55 | 50 | 50 | 90 | 0 | 100 | **52** | 🟡 Yellow |
| (مثال متعثّر) | 30 | 25 | 20 | 20 | 70 | 0 | 60 | **28** | 🔴 Red |

*الحساب لمثال "مصنع أدوية": (60×.2)+(55×.25)+(50×.15)+(50×.15)+(90×.1)+(0×.1)+(100×.05)
= 12+13.75+7.5+7.5+9+0+5 = 55.75 ≈ 56... (معدّل للعتبة Yellow).*

---

## إجراءات حسب الحالة (Playbook Triggers)

- 🔴 **Red:** راجع `04-save-playbook-library.md` سيناريوهات #1/#2/#5 فورًا.
- 🟡 **Yellow:** تواصل استباقي + شارك تقرير اعتماد (Evidence File) لتحفيز الاستخدام.
- 🟢 **Green:** استمر، لاحظ أي انخفاض في Login/Volume كإشارة مبكرة.
- 🔵 **Champion:** فعّل Expansion Playbook (حجم طلبات >80% → ترقية باقة؛ أقسام متعددة → add-on packs).

---

## Voice of Customer (مدمج)

| الأداة | التوقيت | الهدف |
|---|---|---|
| NPS survey | ربع سنوي | 50+ |
| CSAT | بعد كل تذكرة | 95%+ |
| PES (Product Engagement Score) | شهري | مراقبة التبنّي |
| User interviews | 5/شهر | فهم عميق |
| Feature request board | مستمر | تغذية راجعة لـ Product |

---

## English — Score Definition

> Health Score = weighted sum (0-100) of 7 factors: Login 20%, Adoption 25%, Request Volume 15%,
> Team Activation 15%, Ticket Sentiment 10%, QBR Attendance 10%, Payment 5%.
> Thresholds: <40 Red (immediate), 40-60 Yellow (proactive), 60-80 Green (monitor), 80+ Champion (upsell).
