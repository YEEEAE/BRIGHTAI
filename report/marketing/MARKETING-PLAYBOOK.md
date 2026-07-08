# BrightAI — Marketing Playbook (محرك النمو 90 يوم)

**تاريخ**: 2026-07-08
**الإصدار**: 1.0
**الكاتب**: BrightAI Workspace Agent
**الجمهور**: فريق النمو + المؤسس (يزيد)

> هذا المستند هو الدليل التشغيلي الكامل لمحرك نمو BrightAI. يغطي القنوات الثمان، طبقة الأدوات، نموذج الـ lead scoring، خط أنابيب الصفقات، الموازنة، ومؤشرات الأداء. الأصول الرقمية (الصفحات، الحاسبة، النماذج) مبنية داخل الريبو؛ العمليات الحية (بوستات، إعلانات، شراكات، فعاليات) تشغّل يدوياً حسب هذا الدليل.

---

## ٠. الملخص التنفيذي

BrightAI منتج B2B سعودي في مجال حوكمة وأمان الذكاء الاصطناعي. جمهورنا: مسؤولو الامتثال، CISOs، CIOs، وصناع القرار في البنوك والصحة والجهات الحكومية والصناعة. أهم قناة لنا هي **LinkedIn** لأنها حيث يقرأ هؤلاء ويبنون الثقة.

المحرك مبني على ثلاث ركائز:
1. **محتوى سلطة (Authority)** — موقعنا فيه 57 مقال + 41 doc، وهذا أساس الـ SEO/AEO.
2. **تحويل (Conversion)** — صفحات حملات + نماذج leads + حاسبة ROI + case studies.
3. **عمليات (Operations)** — لينkedIn، إعلانات، فعاليات، شراكات، مجتمع.

الهدف بـ 90 يوم: تحويل الزيارات إلى leads مُؤهّلة (MQL→SQL) عبر أنبوب صفقات واضح، مع قياس كل خطوة.

---

## ١. وضع السوق والجمهور

### ١.١ الجمهور المستهدف (Personas)
| Persona | الدور | الألم الأساسي | وش يبي من BrightAI |
|---|---|---|---|
| الامتثال (Compliance Officer) | يتبع PDPL/NCA | "كيف أثبت الامتثال للجهة التنظيمية؟" | أدلة تشغيلية + سجل تدقيق |
| CISO | أمن المعلومات | Shadow AI غير مرصود | رصد + منع تسرب البيانات |
| CIO / CTO | التحول الرقمي | ربط الذكاء الاصطناعي بأنظمة العمل | تكامل + حوكمة |
| طبيب / مدير صحي | قطاع الصحة | حماية بيانات المرضى | موافقة بشرية + سجل |
| مدير مالي / بنكي | قطاع البنوك | مخاطر النماذج على العملاء | تدقيق + تصنيف مخاطر |

### ١.٢ خريطة الرحلة (Journey)
```
وعي (LinkedIn / SEO) → اهتمام (مقال/حاسبة) → اعتبار (case study / تقييم) 
→ قرار (ديمو / عرض سعر) → استخدام (تفعيل) → توسّع (upsell / إحالة)
```

---

## ٢. القنوات الثمان (Channel Strategy)

### ٢.١ Organic Search (Google + Bing)
- **المحتوى**: نعتمد على hub-and-spoke (6 عناقيد: حوكمة، PDPL، NCA ECC، SDAIA، القطاعات، ISO). نضيف 10 مقالات في الشهر 2.
- **IndexNow**: مفعل (`npm run indexnow:trigger` بعد كل نشر).
- **Rich snippets**: FAQPage + Speakable + SoftwareApplication موجودة — نوسّعها.
- **AEO**: llms.txt جاهز. نضيف قسم Citations يبرز المصادر لـ ChatGPT/Perplexity/Claude.
- **Bing**: نفعّل Bing Webmaster + UET (scaffold جاهز، يحتاج الـ ID).

### ٢.٢ AEO (Answer Engine Optimization)
- **ChatGPT/Claude/Perplexity**: llms.txt + محتوى دقيق تقنياً. نكتب فقرات AEO (40-50 كلمة) بصيغة سؤال-جواب في أهم المقالات.
- **Google SGE**: FAQPage + Speakable على الصفحات الرئيسية.
- قياس: ظهور في citations عبر manual search شهرياً.

### ٢.٣ LinkedIn (الأهم)
- **Company page**: نحسّن الوصف + الـ cover بصور الحلول.
- **يومي**: بوست من يزيد (personal) + بوست من صفحة BrightAI.
- **Employee advocacy**: 5 موظفين يشاركون البوستات (جدول تناوب).
- **LinkedIn Ads**: استهداف Compliance Officers / CISO / CIO في السعودية. ميزانية 15,000 من 25,000 المقترحة.
- **Newsletter**: نشرة عربية شهرية (موزعة عبر LinkedIn + البريد).

### ٢.٤ X / Twitter
- **Threads**: تعليمية بالسعودي عن حوكمة AI (3/أسبوع).
- **Live tweets**: من LEAP/GITEX/Money 20/20.
- **Engagement**: الرد على @sdaia، @ncakingdom، @SAMA_Gov.

### ٢.٥ WhatsApp Business
- **Broadcast**: قائمة prospects (يدوي، احترام الخصوصية).
- **Auto-reply**: رد آلي على الأسئلة الشائعة (عربي).
- **Rich cards**: صور الحلول + رابط للصفحة.
- **Click-to-WhatsApp Ads**: من LinkedIn/Meta.

### ٢.٦ Email
- **نشرة أسبوعية**: اشتراك من blog + صفحة /newsletter/.
- **Drip**: بعد التسجيل (5 رسائل ترحيب).
- **Nurture**: حسب persona (امتثال / أمن / تحول).
- **Re-engagement**: للـ churned users.

### ٢.٧ Events
- **LEAP Riyadh**: جناح + speaking (الشهر 2-3).
- **GITEX Dubai**، **Money 20/20 Riyadh**، **Cybersecurity Week**.
- **حدثنا الخاص**: "AI Governance Day Riyadh" (صفحة /events/ai-governance-day/).
- **Webinars**: شهرية بالعربي (صفحة /events/webinar/).

### ٢.٨ Partnerships
- **System Integrators**: بيان، تكامل، ELM.
- **Cloud**: STC Cloud، Salam Cloud.
- **Consulting**: Big 4 + محليات.
- **Law firms**: Al-Sabti، Al-Ghazzawi.
- برنامج شراكة: صفحة /partners/ + عمولة 30% للشريك.

---

## ٣. طبقة الأدوات (Marketing Stack)

### ٣.١ CRM — HubSpot (scaffold)
- **Lead scoring**: نموذج قائم على النقاط (انظر ٤).
- **Automation**: 12 workflow (انظر الملفات في `report/marketing/emails/`).
- **Deal pipeline**: 5 stages (انظر ٥).
- **Integration مع dashboard**: عبر API لاحقاً (dashboard في `apps/dashboard/`).
- **الحالة**: scaffold جاهز (MarketingScripts + marketing.ts)، يُفعّل بعد تعبئة الـ portal ID + تحديث CSP.

### ٣.٢ Marketing Automation
- Customer.io أو Braze — 12 workflows جاهزة (نصوص الإيميلات في `report/marketing/emails/`).
- بديل مؤقت: formsubmit.co يجمع leads، وننقلها يدوياً للـ CRM.

### ٣.٣ Analytics
- **GA4**: موجود (G-8LLESL207Q).
- **Microsoft Clarity**: scaffold جاهز (يحتاج ID).
- **Mixpanel**: scaffold جاهز (يحتاج token).
- **Attribution**: multi-touch — نرمي UTM على كل حملة.
- **Dashboard**: Metabase/Looker (spec في `KPI-DASHBOARD-SPEC.md`).

### ٣.٤ Content Distribution
- Buffer/Hootsuite للجدولة.
- Notion/Airtable للتقويم (نموذج في `CONTENT-CALENDAR-90D.md`).
- Grammarly Business (الإنجليزي).
- Loom للفيديو.

### ٣.٥ Community
- Discord/Slack "BrightAI Compliance Circle".
- AMA شهري.
- برنامج شهادة: "BrightAI Certified Compliance Officer".

---

## ٤. نموذج Lead Scoring

| السلوك | النقاط |
|---|---|
| فتح إيميل | +1 |
| ضغط رابط في إيميل | +3 |
| زيارة /pricing/ أو /solutions/ | +5 |
| تحميل قالب سياسة / تقييم | +10 |
| زيارة /customers/ | +8 |
| استخدم حاسبة ROI | +12 |
| طلب ديمو / تواصل | +20 |
| القطاع (بنك/صحة/حكومي) | +15 |
| حجم فريق +200 | +10 |

**العتبات**:
- MQL: ≥ 30 نقطة
- SQL: ≥ 60 نقطة + مكالمة
- من يصل SQL يدخل أنبوب الصفقات.

---

## ٥. خط أنابيب الصفقات (5 Stages)

1. **Lead** — دخل للنظام (MQL).
2. **Qualified** — تأكدنا القطاع + الحجم (SQL).
3. **Demo / Assessment** — عرض أو تقييم جاهزية.
4. **Proposal** — عرض سعر.
5. **Closed Won / Lost** — إغلاق.

متوسط حجم الصفقة (ASU): يُقدَّر 80,000–250,000 SAR/سنوياً حسب القطاع.

---

## ٦. الموازنة الشهرية (المقترحة)

| البند | المبلغ (SAR) |
|---|---|
| إعلانات مدفوعة (LinkedIn+Google+Meta) | 25,000 |
| إنتاج محتوى | 15,000 |
| أدوات (HubSpot وغيرها) | 8,000 |
| فعاليات ورعاية | 20,000 |
| PR ووكالات | 12,000 |
| **المجموع** | **~80,000** |

تتعدّل حسب التمويل. الأولوية: LinkedIn Ads + إنتاج محتوى + فعاليات.

---

## ٧. Case Studies (الأولوية 1)

3 case studies جاهزة (مجهولة المصدر) في `/customers/`:
- بنك سعودي رائد (مصرفي)
- مستشفى كبير (صحي)
- مصنع أدوية (صناعة دواء)

كل واحدة: صفحة ويب + فيديو + PDF + PR release (مسودات في `case-studies-PR.md`).
الشهر 3: نضيف #4-5 (حكومي + تقني).

---

## ٨. Thought Leadership

- يزيد = واجهة BrightAI.
- مقال شهري في HBR Arabia.
- مقال شهري في Argaam / Al Eqtisadiah.
- بودكاست أسبوعي "حوكمة AI بالسعودي".

---

## ٩. Referral Program

- **موظف**: 2,500 SAR لكل توظيف محال.
- **عميل**: 20% عمولة لـ 3 أشهر.
- **شريك**: 30% عمولة.
- صفحة /referral/ + شروط في `referral-program.md`.

---

## ١٠. Sales Enablement

- **Battle cards**: IBM Watsonx Governance / Palo Alto Prisma (في `battle-cards.md`).
- **ROI calculator**: تفاعلي في `/calculator/roi/`.
- **Compliance readiness assessment**: صفحة `/assessment/ai-governance-readiness/`.
- **Discovery call template** + **Demo script** + **Objection handling** (في `battle-cards.md`).

---

## ١١. KPIs (مؤشرات الأداء)

### ١١.١ Traffic
- Sessions, Users, Sources, Top Pages.
- الهدف: نمو 20% شهرياً في الزيارات العضوية.

### ١١.٢ Leads
- MQL, SQL, Conversion rates.
- الهدف: 50 MQL / شهر بنهاية الـ 90 يوم.

### ١١.٣ Pipeline
- Deals per stage, Average deal size.
- الهدف: 10 SQL / شهر.

### ١١.٤ Revenue
- MRR, ARR, NRR, Churn, LTV.

### ١١.٥ Product
- DAU/MAU, Feature adoption, NPS.

### ١١.٦ Support
- Tickets, CSAT, Resolution time.

التفصيل + مخطط أحداث GA4 في `KPI-DASHBOARD-SPEC.md`.

---

## ١٢. خطة 90 يوم

### الشهر 1 — Foundation
- إعداد HubSpot + integration (scaffold).
- 5 email workflows.
- حضور LinkedIn (بوست يومي).
- 3 case studies (تم بناؤها).
- أول ويبنار.

### الشهر 2 — Amplification
- Content sprint (10 مقالات).
- إعلانات مدفوعة (LinkedIn + Google).
- إطلاق بودكاست.
- إعلانات شراكة.
- تجهيز LEAP.

### الشهر 3 — Scale
- إطلاق المجتمع.
- برنامج إحالة علني.
- ويبنار ثاني.
- case study #4-5.
- مراجعة نمو + تكرار.

---

## ١٣. المخاطر

| المخاطرة | الاحتمال | التخفيف |
|---|---|---|
| Clarity/Bing/HubSpot ما تشتغل (CSP) | متوسط | تحديث `_headers` بموافقة المالك |
| نقص محتوى إنجليزي | منخفض | نركز عربي أولاً |
| جودة leads من إعلانات | متوسط | تحسين الاستهداف + lead scoring |
| صعوبة قياس AEO | متوسط | فحص يدوي شهري + طلب فهارس |

---

## ١٤. الأصول المبنية في الريبو (Batch 1)

- `src/data/marketing.ts` — معرّفات تتبع (placeholders).
- `src/components/MarketingScripts.astro` + `public/js/bing-uet.js` + `public/js/mixpanel-init.js`.
- `src/components/LeadForm.astro` — نموذج leads (formsubmit.co).
- `/thank-you/` — صفحة تأكيد.
- `/customers/` + 3 case studies.
- `/newsletter/` — اشتراك نشرة.
- (قادم): `/calculator/roi/`، `/partners/`، `/referral/`، `/events/*`، `/sales-deck/`.

---

*هذا المستند حيّ — يُحدّث كل 30 يوم مع نتائج القياس.*
