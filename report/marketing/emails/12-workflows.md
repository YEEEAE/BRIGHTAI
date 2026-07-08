# BrightAI — 12 Email Workflow Templates

**الإصدار**: 1.0 | **اللغة**: فصحى سعودية (B2B)
**المنصة**: Customer.io / Braze (أو formsubmit.co مؤقتاً)
**القاعدة**: كل إيميل له subject + preheader + body + CTA واحد واضح.

---

## 1) Welcome Series (5 إيميلات)
**Trigger**: اشتراك جديد (نشرة / ديمو / تقييم).
**الجمهور**: MQL جديد.

**Email 1 — ترحيب (فوراً)**
- Subject: مرحباً بك في BrightAI — خطوتك الأولى لحوكمة AI
- Body: شكراً لاشتراكك. BrightAI يبني حوكمة الذكاء الاصطناعي للمنشآت السعودية بامتثال محلي لـ PDPL وضوابط NCA. خلنا نبدأ: [ابدأ تقييم الجاهزية].
- CTA: ابدأ التقييم

**Email 2 — المشكلة (يوم 2)**
- Subject: وش اللي ما تدرين عنه عن Shadow AI في مؤسستك؟
- Body: أغلب المنشآت تستخدم أدوات AI بدون رؤية موحدة... [اقرأ المقال].
- CTA: اقرأ: حوكمة AI في السعودية

**Email 3 — الحل (يوم 4)**
- Subject: كيف تبني حوكمة قابلة للتدقيق في ٩٠ يوم
- Body: خطة من ٣ مراحل... [شوف الحلول].
- CTA: استكشف الحلول

**Email 4 — دليل (يوم 7)**
- Subject: قالب سياسة استخدام AI جاهز للتحميل
- Body: حمّل القالب وطبّقه... [حمّل].
- CTA: حمّل القالب

**Email 5 — دعوة (يوم 10)**
- Subject: خلنا نتكلم — عرض مخصص مجاني
- Body: فريقنا جاهز... [احجز].
- CTA: احجز عرضاً

---

## 2) Trial Ending Soon (3 إيميلات)
**Trigger**: تبقى ٧ / ٣ / ٠ يوم على انتهاء التجربة.
- E1 (٧ أيام): "تجربتك تنتهي قريباً — وش أنجزت؟" + ملخص الفائدة.
- E2 (٣ أيام): "خطوة وحدة تفصلك عن الامتثال الكامل" + عرض تمديد.
- E3 (٠): "انتهت التجربة — ترجع متى تبي" + رابط إعادة تفعيل.

---

## 3) Feature Adoption Nudges
**Trigger**: مستخدم ما فعّل ميزة (Firewall / Audit Trail / Approval) خلال ١٤ يوم.
- Subject: جرّب [الميزة] في خطوتين
- Body: فيديو Loom قصير + خطوات.
- CTA: فعّل الآن

---

## 4) Upsell Campaigns
**Trigger**: عميل أنهى تفعيف وحدة وما اشترك بوحدة ثانية.
- Subject: هل جهزت موافقاتك البشرية؟
- Body: عملاؤنا يضيفون Human Approval Layer بعد الـ Firewall.
- CTA: اكتشف الإضافة

---

## 5) Win-back Campaigns
**Trigger**: عميل صامت ٦٠ يوم.
- Subject: فقدناك؟ نبي نسمع رأيك
- Body: استبيان قصير + عرض رجوع.
- CTA: شاركنا رأيك

---

## 6) Post-cancel Exit Survey
**Trigger**: إلغاء الاشتراك.
- Subject: وداعاً — بس نبي نعرف السبب
- Body: ٣ أسئلة (السعر / الميزات / التوقيت).
- CTA: أكمل الاستبيان

---

## 7) Product Update Announcements
**Trigger**: إطلاق feature جديد.
- Subject: جديد في BrightAI: [اسم الميزة]
- Body: وش تغير + كيف تستفيد.
- CTA: شوف التحديث

---

## 8) Compliance News Alerts
**Trigger**: تحديث PDPL / NCA / SDAIA.
- Subject: تحديث تنظيمي مهم لـ [الجهة]
- Body: الخلاصة + تأثير على مؤسستك + خطوة عملية.
- CTA: طلب تقييم

---

## 9) Case Study Drops
**Trigger**: نشر case study جديد.
- Subject: كيف قلّل [بنك/مستشفى] مخاطر AI بـ ٩٤٪
- Body: ملخص + رابط.
- CTA: اقرأ القصة

---

## 10) Webinar Invitations
**Trigger**: قبل الويبنار بـ ٧ / ١ أيام.
- E1 (٧): "ويبنار شهري: حوكمة AI — سجّل مجاناً"
- E2 (١): "بكره الويبنار — الرابط معك"
- CTA: سجّل / شارك

---

## 11) Feedback Requests
**Trigger**: بعد إغلاق تذكرة دعم / بعد ٣٠ يوم استخدام.
- Subject: كيف كانت تجربتك؟
- Body: رابط NPS.
- CTA: قيّمنا

---

## 12) Referral Prompts
**Trigger**: عميل سعيد (NPS ≥ 9) أو بعد تجديد.
- Subject: تعرف جهة تستفيد من BrightAI؟
- Body: برنامج الإحالة — ٢٠٪ عمولة.
- CTA: أحِل جهة

---

## ملاحظات تقنية
- كل الإيميلات ترسل من `info@brightai.site` مع اسم المرسل "BrightAI".
- UTM على كل رابط: `?utm_source=email&utm_medium=<workflow>&utm_campaign=<name>`.
- إلغاء الاشتراك بزر واضح في كل إيميل (يلبي PDPL).
- النسخ الإنجليزي يُنشأ للـ EN segments لاحقاً.
