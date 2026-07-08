# 04 — Save Playbook Library (10 سيناريوهات إنقاذ)

> كل سيناريو فيه: **Trigger (المثير) · Signal (الإشارة) · CSM Action (الإجراء) · Save Lever (رافعة الإنقاذ) · Template (قالب جاهز)**.
> الأولوية: 🔴 حرجة (خلال 24س) · 🟡 متوسطة (72س).

---

## سيناريو 1 — هبوط تسجيل الدخول 50%+ (Login Drop)

- **Trigger:** انخفاض تسجيل الدخول >50% مقارنة بخط الأساس لـ14 يوم.
- **Signal:** Kernel `stats` يوري انقطاع.
- **CSM Action:** اتصال خلال 24س، فهم السبب (تغيير عملية؟ تغيير موظف؟).
- **Save Lever:** إعادة تفعيل + جلسة تدريب سريعة + ربط بقيمة واضحة (تقرير الامتثال الجاهز).
- **Template:**
```
يا [الاسم]، لاحظنا انخفاض استخدام BrightAI هالأسبوعين. نبي نتأكد إن ما فيه عائق.
نقدر نسوي جلسة 15 دقيقة نراجع فيها لوحة الامتثال ونولّد تقرير جاهء للتدقيق؟
```

---

## سيناريو 2 — تزايد التذاكر السلبية (Ticket Spike)

- **Trigger:** ≥3 تذاكر سلبية/أسبوع أو CSAT < 80%.
- **Signal:** CSAT after-ticket منخفض + نبرة سلبية.
- **CSM Action:** مراجعة التذاكر مع Support، حل الجذر، اتصال اعتذار خلال 48س.
- **Save Lever:** free consultation + أولوية في قائمة الانتظار (Business/Enterprise).
- **Template:**
```
نعتذر عن التجربة الأخيرة. فريقنا راجع [المشكلة] وحلها. نبي نعوضك بجلسة استشارية مجانية
مع [مختص] لنتأكد إن مسار الامتثال عندكم يمشي صح.
```

---

## سيناريو 3 — تفويت QBR (Missed Review)

- **Trigger:** العميل ما حضر QBR مجدول أو أجّله مرتين.
- **Signal:** غياب + عدم رد على إعادة الجدولة.
- **CSM Action:** تصعيد للراعي (Sponsor) عبر القناة المشتركة، إعادة جدولة بوقت مرن.
- **Save Lever:** Exec escalation + تقرير قيمة مكتوب بديل عن الجلسة.
- **Template:**
```
يا [الراعي]، فاتنا لقاء المراجعة مع [العميل]. نبي نتأكد إن القيمة واصلة. نشارك تقرير إنجازات
جاهز، ونثبّت موعد يناسبكم. الامتثال ما يستنى.
```

---

## سيناريو 4 — مغادرة الـ Champion (Champion Leaves)

- **Trigger:** المستخدم الأساسي/المدافع يغادر الشركة.
- **Signal:** إشعار العميل أو توقف الحساب الرئيسي.
- **CSM Action:** لقاء فوري مع البديل + إعادة توجيه Success Plan للقيادة الجديدة.
- **Save Lever:** re-onboarding مجاني + تدريب للفريق الجديد + contract restructure إن لزم.
- **Template:**
```
سمعنا إن [الاسم] انتقل لجهة ثانية — نتمنى له التوفيق. نبي نضمن إن [العميل] يكمل مسار الامتثال
بدون انقطاع. نعرض تدريب مجاني للفريق الجديد وجلسة تعريف للقيادة.
```

---

## سيناريو 5 — تأخير الدفعات (Payment Delay)

- **Trigger:** فاتورة متأخرة >15 يوم.
- **Signal:** تنبيه مالي + انخفاض Payment factor في Health Score.
- **CSM Action:** تواصل ودي، فهم السيولة، عرض خيار مرن.
- **Save Lever:** discount authorization (حتى حد معتمد) + contract restructure (تقسيط/تأجيل).
- **Template:**
```
يا [الاسم]، لاحظنا تأخير بسيط بالدفعة. نبي نسهّلها. نقدر نقدّم تقسيط أو خصم مؤقت مقابل التزام
بالسنة. وش الأنسب لكم؟
```

---

## سيناريو 6 — ضعف تبنّي Evidence File (السيناريو الأكثر شيوعًا)

- **Trigger:** مضى >14 يوم والعميل ما ولّد أي Evidence File.
- **Signal:** Kernel `evidence` فارغ بعد أول أسبوعين.
- **CSM Action:** جلسة hands-on مدتها 30 دقيقة لتوليد أول ملف معهم.
- **Save Lever:** white-glove generation + قالب جاهز لجهة التنظيمية.
- **Template:**
```
نبي نوصلك أول Evidence File جاهز للمدقق. نسويها مع بعض اليوم؟ 30 دقيقة تكفي ونولّد ملف PDPL
موقّع يجلس بملفكم للتدقيق.
```

---

## سيناريو 7 — قفزة كشف PII (PII Spike)

- **Trigger:** نسبة كشف PII ترتفع فجأة (مثلاً >10% مقابل 4.2% baseline).
- **Signal:** Kernel `stats` (PII detected) يقفز.
- **CSM Action:** تنبيه أمني للعميل + مراجعة السياسات معهم.
- **Save Lever:** tuning session للـ AI Firewall + تقرير مخاطر للإدارة.
- **Template:**
```
رصدنا ارتفاع بكشف بيانات شخصية (PII) هالفترة. هذا إنذار مبكر ممتاز — خلنا نضبط سياسات
الجدار الوقائي سوا عشان نقلل المخاطر قبل أي تدقيق.
```

---

## سيناريو 8 — حزمة امتثال عالقة "Partial" (Stuck Pack)

- **Trigger:** حزمة (SFDA/ISO 13485) ثابتة على "partial" لـ60 يوم.
- **Signal:** Kernel `compliance` يوري درجة متجمدة.
- **CSM Action:** ورشة ردم الفجوات + ربط الضوابط بالسياسات.
- **Save Lever:** Policy-to-Control Mapping session + خطة 30 يوم للوصول compliant.
- **Template:**
```
حزمة [SFDA] عندكم على 64% (partial). عندنا خطة 30 يوم نرفعها لـ compliant عبر ربط الضوابط
بسياساتكم. نبدأ متى؟
```

---

## سيناريو 9 — توسع أقسام متعددة متعثّر (Multi-Dept Stalled)

- **Trigger:** قسم ثانٍ بدأ لكن تبنّيه راكد بعد 30 يوم.
- **Signal:** Team Activation منخفض في القسم الجديد.
- **CSM Action:** تدريب مخصص للقسم + ربط بقيمة القطاع (مثلاً بنك/صحة).
- **Save Lever:** add-on pack + department onboarding sprint.
- **Template:**
```
قسم [الاسم] بدأ بس ما اكتمل التبنّي. نسوي سبرينت تدريب أسبوعي نوصله لـ Green، ونضيف حزمة
الامتثال الخاصة بقطاعكم.
```

---

## سيناريو 10 — اقتراب موعد تدقيق (Audit Deadline)

- **Trigger:** العميل يقرّب من تدقيق خارجي لكن Health Score أقل من 60.
- **Signal:** تواصل العميل + درجة منخفضة.
- **CSM Action:** sprint امتثال طارئ + توليد Evidence Files لكل الحزم ذات الصلة.
- **Save Lever:** free consultation + priority evidence generation + exec alignment.
- **Template:**
```
قرب موعد التدقيق — وضعنا خطة 14 يوم نجهّز فيها كل Evidence Files (PDPL/NCA/SAMA) ونرفع
الدرجات لـ compliant. نبدأ باجتماع تنسيق اليوم؟
```

---

## English — Escalation Matrix

| Scenario | Priority | SLA | Lever |
|---|---|---|---|
| 1 Login drop | 🔴 | 24h | Re-activation + training |
| 2 Ticket spike | 🟡 | 48h | Free consultation + priority |
| 3 Missed QBR | 🟡 | 72h | Exec escalation |
| 4 Champion leaves | 🔴 | 24h | Re-onboarding |
| 5 Payment delay | 🟡 | 72h | Discount / restructure |
| 6 No Evidence File | 🔴 | 24h | White-glove generation |
| 7 PII spike | 🔴 | 24h | Firewall tuning |
| 8 Stuck pack | 🟡 | 72h | Gap-remediation workshop |
| 9 Multi-dept stall | 🟡 | 72h | Add-on + sprint |
| 10 Audit deadline | 🔴 | 24h | Sprint + priority evidence |
