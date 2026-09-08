# BRIGHTAI — الكلمات المفتاحية الموحّدة والمحسّنة

تاريخ التحديث: 2026-09-08 — النطاق: `https://brightai.live` — السوق: السعودية (`sa`).

النتيجة: **312 كلمة فريدة**؛ 250 كلمة أصلية و62 اقتراحًا جديدًا (7 منها له قياس Semrush).
Semrush: **68 كلمة بقياسات فعلية** و**244 كلمة بدون صف مطابق**. لا توجد بيانات GSC فعلية.

## ما تغير

- تحديث كل الكلمات الأصلية والمقترحة عبر Semrush `phrase_these` في السعودية، مع حفظ الطلب والرد وتوقيت السحب.
- تصحيح خلط أعمدة العربية والإنجليزية في المصدر الثنائي، والحفاظ على أصفار CPC والحجم الحقيقية.
- فصل مقاييس DataForSEO التاريخية في أعمدة مستقلة؛ لم تُخلط أو تُجمع أو تُحسب متوسطاتها مع Semrush.
- الاحتفاظ بكل الكلمات الأصلية؛ الكلمات العامة أو الملاحية غير المناسبة معلّمة P3 للمرجع.
- اختيار صفحة هدف تحريرية واحدة لكل كلمة، وتوحيد الروابط وفحص وجودها في sitemap المحلي.
- إضافة نية البحث، مرحلة القمع، المدينة المذكورة في العبارة، ملاءمة العمل، الأولوية، وسبب الخطوة التالية.

## قواعد القراءة

- `origin=assistant_suggestion`: كلمة أضيفت باجتهاد تحريري؛ لا يعني أنها ظهرت في GSC أو بحث مستخدم فعلي.
- `search_volume_sa` و`cpc_usd` و`paid_competition` و`keyword_difficulty`: قيم Semrush فقط. `no_data` يعني عدم إرجاع صف مطابق وليس صفر طلب.
- `kd_status=returned_zero_not_used_in_score`: أعاد Semrush الصفر؛ احتُفظ به لكن لم يمنح نقاط سهولة منافسة.
- `semrush_intent_codes` و`semrush_trend`: قيم المزود الخام. لم تُخترع أسماء أشهر لسلسلة trend لأن التقرير لا يحدد فترتها.
- `intent` و`cluster` و`business_relevance` وملكية URL والأولوية: استنتاج تحريري، وليست قياسًا من المزود.
- `dfs_*`: معلومات محفوظة من ملف DataForSEO المحلي مع مطابقة suffix اللغة. تاريخ 2026-09-03 هو تاريخ التقرير، وليس إثبات توقيت API.
- `metric_disagreement`: اختلاف بين مزودين/فترتين؛ لا يعني بالضرورة خطأ أحدهما. Semrush الحالي يملك الأعمدة الأساسية.
- `city`: المدينة المذكورة في الكلمة فقط؛ القياسات على السعودية كلها وليست حجم بحث المدينة.
- `target_status=listed_in_local_sitemap`: وجود محلي فقط؛ لا يثبت HTTP حي أو فهرسة Google. `needs_url_review` رابط موروث يحتاج مراجعة.
- `target_language_fit=english_content_needed`: المالك الحالي عربي ويحتاج محتوى إنجليزي قبل الاستهداف. لم يُفترض وجود ترجمة منشورة.
- `primary_candidate`: مرشح تحريري واحد لكل مالك ولغة، مع تفضيل كلمات الأساس المحددة للصفحات الرئيسية ثم الأولوية والدرجة؛ الباقي كلمات مساندة داخل الصفحة نفسها.
- `alternative_target_urls`: اقتراحات المصادر السابقة للاحتفاظ بالأثر؛ تعددها ليس إثبات cannibalization من GSC.
- أعمدة GSC فارغة و`gsc_status=not_provided`. حجم البحث تقدير سوقي وليس نقرات BrightAI.

## الأولوية وطريقة الحساب

الدرجة `priority_score` حد أدنى من 100: ملاءمة العمل ×0.45 + ملاءمة النية ×20 + الطلب ×20 + سهولة المنافسة ×10 + فجوة صفحة/لغة ×5.
ملاءمة النية: commercial/transactional=1، informational=0.6، navigational=0.3. الطلب = min(1, ln(1+volume)/ln(2001)). سهولة المنافسة = 1−KD/100 عندما KD>0. فجوة الصفحة/اللغة تساوي 5 عند غياب المالك أو الحاجة لمحتوى إنجليزي، وإلا صفر.
المكوّن غير المقاس لا يمنح نقاطًا؛ لا يُعتبر حجمًا صفريًا. `score_completeness_pct` يساوي 70 +20 عند توفر الحجم +10 عند KD>0. لا تقارن الدرجات دون هذا العمود.
P0: صفحات الأساس الخمس المحددة في السكربت أو كلمة ملاءمتها ≥85 وحجمها ≥20 وKD بين 1 و30. P1: الكلمات الأساسية الأخرى أو فجوات اللغة الإنجليزية. P2: كلمات مجاورة. P3: مؤجلة/مستبعدة أو ملاءمتها <50. الأولوية التحريرية منفصلة عن الدرجة؛ ليست توقعًا للترتيب أو الزيارات.

التوزيع: {"P0": 11, "P1": 230, "P2": 37, "P3": 34}.

## مصادر وأدلة

- [CSV المحدث](BRIGHTAI-KEYWORDS-MERGED-2026-09-08.csv)
- [نسخة ما قبل التحسين](raw/merged-before-improvement-2026-09-08.json)
- [سحب Semrush للكلمات الأصلية](raw/semrush-merged-refresh-2026-09-08.json)
- [سحب الاقتراحات الأولى](raw/semrush-suggestions-refresh-2026-09-08.json)
- [سحب الاقتراحات الإضافية](raw/semrush-additional-refresh-2026-09-08.json)
- [نتيجة التحقق](raw/improvement-validation-2026-09-08.json)
- [سكربت إعادة الإنتاج](improve-merged-keywords.py)

مسارات المصادر القديمة محفوظة في `source_files` حتى لو أُزيلت لاحقًا من الشجرة؛ بعض مصادر مجلد `sa-ar/2026-09-08` لم تعد موجودة وقت التحسين. النسخة السابقة محفوظة في JSON للمراجعة. `inherited_source_row_count` عدّ موروث غير معاد إثباته؛ `original_source_file_count` عدد أسماء الملفات الفريدة فقط.
الطلب الأول الكبير أعاد HTTP 414؛ صُغّرت الدفعات ونجحت تغطية كل الكلمات. ERROR 50 NOTHING FOUND يعامل كغياب بيانات، وأي خطأ آخر يوقف إعادة الإنتاج.

## خطوات التنفيذ

1. ابدأ بكلمات P0 وصفحاتها، ثم كلمات P1 الملائمة للمنتج ولو كانت بلا حجم مثبت.
2. استخدم الكلمات المساندة في أقسام وأسئلة الصفحة المالكة؛ راجع النية قبل إنشاء صفحة جديدة.
3. راجع صفوف `needs_url_review` و`english_content_needed` قبل استخدام روابطها أو بناء محتوى جديد.
4. استورد GSC بفترة وبلد وجهاز محددين لاحقًا لتقييم الظهور والنقرات وتنافس الصفحات فعليًا.

## قائمة الكلمات الكاملة

| الكلمة | أصل الكلمة | الأولوية | العنقود | الحجم السعودي | KD | حالة القياس | الصفحة المالكة |
|---|---|---|---|---:|---:|---|---|
| نظام حماية البيانات الشخصية | أصلية | P0 | pdpl | 1900 | 17 | measured | https://brightai.live/pdpl-statement/ |
| شركات الذكاء الاصطناعي في السعودية | أصلية | P0 | brand | 170 | 8 | measured | https://brightai.live/ |
| شركة أتمتة | أصلية | P0 | services | 170 | 12 | measured | https://brightai.live/services/ |
| ai firewall | أصلية | P0 | ai-firewall | 20 | 0 | measured | https://brightai.live/solutions/ai-firewall/ |
| حوكمة البيانات | أصلية | P0 | data-governance | 480 | 23 | measured | https://brightai.live/blog/ndmo-data-governance-saudi/ |
| حماية البيانات الشخصية | أصلية | P0 | pdpl | 260 | 23 | measured | https://brightai.live/docs/pdpl-ai-complete-guide/ |
| مخاطر الذكاء الاصطناعي | أصلية | P0 | risk | 110 | 20 | measured | https://brightai.live/docs/ai-risk-management/ |
| تقييم جاهزية حوكمة الذكاء الاصطناعي | أصلية | P0 | governance | غير متاح | غير متاح | no_data | https://brightai.live/assessment/ai-governance-readiness/ |
| جدار حماية الذكاء الاصطناعي | أصلية | P0 | ai-firewall | غير متاح | غير متاح | no_data | https://brightai.live/solutions/ai-firewall/ |
| حوكمة الذكاء الاصطناعي في السعودية | أصلية | P0 | brand | غير متاح | غير متاح | no_data | https://brightai.live/ |
| منصة حوكمة الذكاء الاصطناعي | أصلية | P0 | governance | غير متاح | غير متاح | no_data | https://brightai.live/solutions/ai-governance-platform/ |
| AI automation tools | أصلية | P1 | services | 480 | 60 | measured | https://brightai.live/services/ |
| AI automation | أصلية | P1 | services | 90 | 41 | measured | https://brightai.live/services/ |
| AI and automation | أصلية | P1 | services | 110 | 48 | measured | https://brightai.live/services/ |
| الأمن السيبراني السعودية | أصلية | P1 | nca | 1600 | 36 | measured | https://brightai.live/blog/nca-cybersecurity-requirements-saudi/ |
| AI and security | أصلية | P1 | ai-firewall | 20 | 0 | measured | https://brightai.live/solutions/ai-firewall/ |
| استشارات التحول الرقمي | أصلية | P1 | services | 30 | 0 | measured | https://brightai.live/services/ |
| AI governance | أصلية | P1 | governance | 90 | 58 | measured | https://brightai.live/hub/ai-governance/ |
| AI governance consulting Saudi Arabia | مقترحة | P1 | governance | غير متاح | غير متاح | no_data | https://brightai.live/services/ |
| PDPL | مقترحة | P1 | pdpl | 1300 | 0 | measured | https://brightai.live/en/pdpl-statement/ |
| نظام حماية البيانات الشخصية السعودي | أصلية | P1 | pdpl | 10 | 0 | measured | https://brightai.live/pdpl-statement/ |
| AI audit readiness | مقترحة | P1 | audit | غير متاح | غير متاح | no_data | https://brightai.live/docs/ai-audit-readiness/ |
| ai audit trail | أصلية | P1 | audit | غير متاح | غير متاح | no_data | https://brightai.live/solutions/ai-audit-trail/ |
| AI automation company Saudi Arabia | أصلية | P1 | services | غير متاح | غير متاح | no_data | https://brightai.live/services/ |
| AI business automation Saudi Arabia | أصلية | P1 | services | غير متاح | غير متاح | no_data | https://brightai.live/services/ |
| AI compliance evidence file | أصلية | P1 | evidence | غير متاح | غير متاح | no_data | https://brightai.live/solutions/ai-evidence-file/ |
| AI compliance Saudi Arabia | أصلية | P1 | compliance | غير متاح | غير متاح | no_data | https://brightai.live/trust/ |
| AI data loss prevention | مقترحة | P1 | ai-firewall | غير متاح | غير متاح | no_data | https://brightai.live/solutions/ai-firewall/ |
| AI data protection | أصلية | P1 | compliance | غير متاح | غير متاح | no_data | https://brightai.live/trust/ |
| AI decision documentation | أصلية | P1 | audit | غير متاح | غير متاح | no_data | https://brightai.live/solutions/ai-audit-trail/ |
| ai evidence file | أصلية | P1 | evidence | غير متاح | غير متاح | no_data | https://brightai.live/solutions/ai-evidence-file/ |
| ai firewall vs dlp | أصلية | P1 | ai-firewall | غير متاح | غير متاح | no_data | https://brightai.live/solutions/ai-firewall/ |
| ai firewall vs waf | أصلية | P1 | ai-firewall | غير متاح | غير متاح | no_data | https://brightai.live/solutions/ai-firewall/ |
| ai gateway vs ai firewall | أصلية | P1 | ai-firewall | غير متاح | غير متاح | no_data | https://brightai.live/solutions/ai-firewall/ |
| ai governance assessment | أصلية | P1 | governance | غير متاح | غير متاح | no_data | https://brightai.live/assessment/ai-governance-readiness/ |
| AI governance banking Saudi Arabia | أصلية | P1 | banking | غير متاح | غير متاح | no_data | https://brightai.live/solutions/banking-ai-governance/ |
| AI governance company Saudi Arabia | أصلية | P1 | services | غير متاح | غير متاح | no_data | https://brightai.live/services/ |
| AI governance for companies | أصلية | P1 | governance | غير متاح | غير متاح | no_data | https://brightai.live/solutions/ai-governance-platform/ |
| AI governance for government Saudi Arabia | أصلية | P1 | government | غير متاح | غير متاح | no_data | https://brightai.live/solutions/government-ai-governance/ |
| AI governance for Saudi enterprises | أصلية | P1 | governance | غير متاح | غير متاح | no_data | https://brightai.live/solutions/ai-governance-platform/ |
| AI governance healthcare Saudi Arabia | أصلية | P1 | healthcare | غير متاح | غير متاح | no_data | https://brightai.live/solutions/healthcare-ai-governance/ |
| AI governance manufacturing Saudi Arabia | أصلية | P1 | manufacturing | غير متاح | غير متاح | no_data | https://brightai.live/solutions/manufacturing-ai-governance/ |
| AI governance platform | أصلية | P1 | governance | غير متاح | غير متاح | no_data | https://brightai.live/solutions/ai-governance-platform/ |
| AI governance readiness assessment | أصلية | P1 | governance | غير متاح | غير متاح | no_data | https://brightai.live/assessment/ai-governance-readiness/ |
| AI readiness assessment Saudi Arabia | أصلية | P1 | governance | غير متاح | غير متاح | no_data | https://brightai.live/assessment/ai-governance-readiness/ |
| AI risk classification | أصلية | P1 | risk | غير متاح | غير متاح | no_data | https://brightai.live/solutions/ai-risk-classification/ |
| ai risk register | أصلية | P1 | risk | غير متاح | غير متاح | no_data | https://brightai.live/tools/ai-risk-register/ |
| AI solutions for Saudi companies | أصلية | P1 | general | غير متاح | غير متاح | no_data | https://brightai.live/solutions/ |
| AI usage audit | أصلية | P1 | audit | غير متاح | غير متاح | no_data | https://brightai.live/solutions/ai-audit-trail/ |
| AI usage policy template Saudi Arabia | أصلية | P1 | policy | غير متاح | غير متاح | no_data | https://brightai.live/blog/ai-usage-policy-template-saudi/ |
| AI use case discovery | أصلية | P1 | discovery | غير متاح | غير متاح | no_data | https://brightai.live/solutions/ai-use-case-discovery/ |
| ChatGPT protection for companies | أصلية | P1 | ai-firewall | غير متاح | غير متاح | no_data | https://brightai.live/solutions/ai-firewall/ |
| human approval for AI decisions | أصلية | P1 | human-approval | غير متاح | غير متاح | no_data | https://brightai.live/solutions/human-approval-layer/ |
| human approval layer ai | أصلية | P1 | human-approval | غير متاح | غير متاح | no_data | https://brightai.live/solutions/human-approval-layer/ |
| llm firewall | أصلية | P1 | ai-firewall | غير متاح | غير متاح | no_data | https://brightai.live/solutions/ai-firewall/ |
| LLM security Saudi Arabia | مقترحة | P1 | ai-firewall | غير متاح | غير متاح | no_data | https://brightai.live/solutions/ai-firewall/ |
| PDPL compliance for AI | أصلية | P1 | compliance | غير متاح | غير متاح | no_data | https://brightai.live/trust/ |
| policy to control mapping ai | أصلية | P1 | policy | غير متاح | غير متاح | no_data | https://brightai.live/solutions/policy-to-control-mapping/ |
| prevent data leakage to ChatGPT | أصلية | P1 | ai-firewall | غير متاح | غير متاح | no_data | https://brightai.live/solutions/ai-firewall/ |
| Shadow AI discovery Saudi Arabia | مقترحة | P1 | discovery | غير متاح | غير متاح | no_data | https://brightai.live/solutions/ai-use-case-discovery/ |
| AI company Riyadh | أصلية | P1 | brand | غير متاح | غير متاح | no_data | https://brightai.live/contact/ |
| AI implementation cost Saudi Arabia | أصلية | P1 | pricing | غير متاح | غير متاح | no_data | https://brightai.live/blog/ai-implementation-cost-saudi/ |
| AI risk assessment template | مقترحة | P1 | risk | غير متاح | غير متاح | no_data | https://brightai.live/tools/ai-risk-register/ |
| best AI company in Saudi Arabia | أصلية | P1 | providers | غير متاح | غير متاح | no_data | https://brightai.live/blog/best-ai-companies-saudi-2026/ |
| ISO 42001 certification Saudi Arabia | أصلية | P1 | iso-42001 | غير متاح | غير متاح | no_data | https://brightai.live/blog/iso-42001-certification-cost-saudi/ |
| PDPL compliance checklist | مقترحة | P1 | pdpl | غير متاح | غير متاح | no_data | https://brightai.live/blog/pdpl-compliance-guide-saudi-companies/ |
| إخفاء البيانات الشخصية في الذكاء الاصطناعي | مقترحة | P1 | ai-firewall | غير متاح | غير متاح | no_data | https://brightai.live/solutions/ai-firewall/ |
| استشارات حوكمة الذكاء الاصطناعي | مقترحة | P1 | governance | غير متاح | غير متاح | no_data | https://brightai.live/services/ |
| تجهيز أدلة تدقيق الذكاء الاصطناعي | مقترحة | P1 | audit | غير متاح | غير متاح | no_data | https://brightai.live/docs/ai-audit-readiness/ |
| قالب سجل مخاطر الذكاء الاصطناعي | مقترحة | P1 | risk | غير متاح | غير متاح | no_data | https://brightai.live/tools/ai-risk-register/ |
| منع تسريب بيانات الشركة إلى ChatGPT | مقترحة | P1 | ai-firewall | غير متاح | غير متاح | no_data | https://brightai.live/solutions/ai-firewall/ |
| shadow ai | أصلية | P1 | discovery | 20 | 0 | measured | https://brightai.live/blog/shadow-ai-discovery-saudi-company/ |
| AI policy template | مقترحة | P1 | policy | غير متاح | غير متاح | no_data | https://brightai.live/blog/ai-usage-policy-template-saudi/ |
| AI and Saudi PDPL | أصلية | P1 | pdpl | غير متاح | غير متاح | no_data | https://brightai.live/en/pdpl-statement/ |
| AI governance Saudi Arabia | أصلية | P1 | brand | غير متاح | غير متاح | no_data | https://brightai.live/en/ |
| ai governance السعودية | أصلية | P1 | governance | غير متاح | غير متاح | no_data | https://brightai.live/solutions/ai-governance-platform/ |
| BrightAI حوكمة الذكاء الاصطناعي السعودية | أصلية | P1 | brand | غير متاح | غير متاح | no_data | https://brightai.live/ |
| أتمتة الأعمال بالذكاء الاصطناعي السعودية | أصلية | P1 | services | غير متاح | غير متاح | no_data | https://brightai.live/services/ |
| أدلة امتثال الذكاء الاصطناعي | أصلية | P1 | evidence | غير متاح | غير متاح | no_data | https://brightai.live/solutions/ai-evidence-file/ |
| أدلة تدقيق الذكاء الاصطناعي | أصلية | P1 | evidence | غير متاح | غير متاح | no_data | https://brightai.live/solutions/ai-evidence-file/ |
| إدارة استخدام الذكاء الاصطناعي في الشركات | أصلية | P1 | governance | غير متاح | غير متاح | no_data | https://brightai.live/solutions/ai-governance-platform/ |
| استخدام الذكاء الاصطناعي غير المصرح به | أصلية | P1 | discovery | غير متاح | غير متاح | no_data | https://brightai.live/solutions/ai-use-case-discovery/ |
| اكتشاف استخدامات الذكاء الاصطناعي في الشركة | أصلية | P1 | discovery | غير متاح | غير متاح | no_data | https://brightai.live/solutions/ai-use-case-discovery/ |
| اكتشاف حالات استخدام الذكاء الاصطناعي | أصلية | P1 | discovery | غير متاح | غير متاح | no_data | https://brightai.live/solutions/ai-use-case-discovery/ |
| الإشراف البشري على الذكاء الاصطناعي | أصلية | P1 | human-approval | غير متاح | غير متاح | no_data | https://brightai.live/solutions/human-approval-layer/ |
| الموافقات البشرية لوكلاء الذكاء الاصطناعي | مقترحة | P1 | human-approval | غير متاح | غير متاح | no_data | https://brightai.live/solutions/human-approval-layer/ |
| الموافقة البشرية على قرارات الذكاء الاصطناعي | أصلية | P1 | human-approval | غير متاح | غير متاح | no_data | https://brightai.live/solutions/human-approval-layer/ |
| امتثال PDPL للذكاء الاصطناعي | أصلية | P1 | compliance | غير متاح | غير متاح | no_data | https://brightai.live/trust/ |
| امتثال الذكاء الاصطناعي في السعودية | أصلية | P1 | compliance | غير متاح | غير متاح | no_data | https://brightai.live/trust/ |
| برنامج حوكمة الذكاء الاصطناعي للشركات | أصلية | P1 | governance | غير متاح | غير متاح | no_data | https://brightai.live/solutions/ai-governance-platform/ |
| تدقيق استخدام الذكاء الاصطناعي | أصلية | P1 | audit | غير متاح | غير متاح | no_data | https://brightai.live/solutions/ai-audit-trail/ |
| تصنيف مخاطر الذكاء الاصطناعي | أصلية | P1 | risk | غير متاح | غير متاح | no_data | https://brightai.live/solutions/ai-risk-classification/ |
| تقييم جاهزية ISO 42001 للشركات | مقترحة | P1 | iso-42001 | غير متاح | غير متاح | no_data | https://brightai.live/blog/iso-42001-audit-checklist-saudi/ |
| تقييم جاهزية الذكاء الاصطناعي للشركات | أصلية | P1 | governance | غير متاح | غير متاح | no_data | https://brightai.live/assessment/ai-governance-readiness/ |
| تقييم جاهزية الذكاء الاصطناعي للشركات السعودية | أصلية | P1 | governance | غير متاح | غير متاح | no_data | https://brightai.live/assessment/ai-governance-readiness/ |
| توثيق قرارات الذكاء الاصطناعي | أصلية | P1 | audit | غير متاح | غير متاح | no_data | https://brightai.live/solutions/ai-audit-trail/ |
| جدار حماية النماذج اللغوية الكبيرة | أصلية | P1 | ai-firewall | غير متاح | غير متاح | no_data | https://brightai.live/solutions/ai-firewall/ |
| حصر أدوات الذكاء الاصطناعي في الشركة | مقترحة | P1 | discovery | غير متاح | غير متاح | no_data | https://brightai.live/solutions/ai-use-case-discovery/ |
| حلول أمان وحوكمة الذكاء الاصطناعي | أصلية | P1 | general | غير متاح | غير متاح | no_data | https://brightai.live/solutions/ |
| حلول الذكاء الاصطناعي للشركات السعودية | أصلية | P1 | general | غير متاح | غير متاح | no_data | https://brightai.live/solutions/ |
| حلول حوكمة الذكاء الاصطناعي | أصلية | P1 | governance | غير متاح | غير متاح | no_data | https://brightai.live/solutions/ai-governance-platform/ |
| حماية ChatGPT للشركات | أصلية | P1 | ai-firewall | غير متاح | غير متاح | no_data | https://brightai.live/solutions/ai-firewall/ |
| حماية البيانات عند استخدام الذكاء الاصطناعي | أصلية | P1 | ai-firewall | غير متاح | غير متاح | no_data | https://brightai.live/solutions/ai-firewall/ |
| حماية بيانات الذكاء الاصطناعي | أصلية | P1 | compliance | غير متاح | غير متاح | no_data | https://brightai.live/trust/ |
| حماية بيانات الشركات من chatgpt | أصلية | P1 | ai-firewall | غير متاح | غير متاح | no_data | https://brightai.live/solutions/ai-firewall/ |
| حوكمة ai | أصلية | P1 | governance | غير متاح | غير متاح | no_data | https://brightai.live/solutions/ai-governance-platform/ |
| حوكمة ai للبنوك السعودية | أصلية | P1 | banking | غير متاح | غير متاح | no_data | https://brightai.live/solutions/banking-ai-governance/ |
| حوكمة ai للجهات الحكومية السعودية | أصلية | P1 | government | غير متاح | غير متاح | no_data | https://brightai.live/solutions/government-ai-governance/ |
| حوكمة ai للرعاية الصحية السعودية | أصلية | P1 | healthcare | غير متاح | غير متاح | no_data | https://brightai.live/solutions/healthcare-ai-governance/ |
| حوكمة ai للقطاع الصناعي | أصلية | P1 | manufacturing | غير متاح | غير متاح | no_data | https://brightai.live/solutions/manufacturing-ai-governance/ |
| حوكمة الذكاء الاصطناعي في البنوك | أصلية | P1 | banking | غير متاح | غير متاح | no_data | https://brightai.live/solutions/banking-ai-governance/ |
| حوكمة الذكاء الاصطناعي في الجهات الحكومية | أصلية | P1 | government | غير متاح | غير متاح | no_data | https://brightai.live/solutions/government-ai-governance/ |
| حوكمة الذكاء الاصطناعي في القطاع المالي السعودي | مقترحة | P1 | banking | غير متاح | غير متاح | no_data | https://brightai.live/solutions/banking-ai-governance/ |
| حوكمة الذكاء الاصطناعي في المستشفيات | أصلية | P1 | healthcare | غير متاح | غير متاح | no_data | https://brightai.live/solutions/healthcare-ai-governance/ |
| حوكمة الذكاء الاصطناعي في المصانع | أصلية | P1 | manufacturing | غير متاح | غير متاح | no_data | https://brightai.live/solutions/manufacturing-ai-governance/ |
| حوكمة الذكاء الاصطناعي للبنوك السعودية | أصلية | P1 | banking | غير متاح | غير متاح | no_data | https://brightai.live/solutions/banking-ai-governance/ |
| حوكمة الذكاء الاصطناعي للبنوك في الرياض | أصلية | P1 | banking | غير متاح | غير متاح | no_data | https://brightai.live/solutions/banking-ai-governance/riyadh/ |
| حوكمة الذكاء الاصطناعي للتصنيع السعودية | أصلية | P1 | manufacturing | غير متاح | غير متاح | no_data | https://brightai.live/solutions/manufacturing-ai-governance/ |
| حوكمة الذكاء الاصطناعي للجهات الحكومية | أصلية | P1 | government | غير متاح | غير متاح | no_data | https://brightai.live/solutions/government-ai-governance/ |
| حوكمة الذكاء الاصطناعي للجهات الحكومية في الدمام | أصلية | P1 | government | غير متاح | غير متاح | no_data | https://brightai.live/solutions/government-ai-governance/dammam/ |
| حوكمة الذكاء الاصطناعي للشركات | أصلية | P1 | governance | غير متاح | غير متاح | no_data | https://brightai.live/solutions/ai-governance-platform/ |
| حوكمة الذكاء الاصطناعي للقطاع الصحي السعودية | أصلية | P1 | healthcare | غير متاح | غير متاح | no_data | https://brightai.live/solutions/healthcare-ai-governance/ |
| حوكمة الذكاء الاصطناعي للمؤسسات السعودية | أصلية | P1 | governance | غير متاح | غير متاح | no_data | https://brightai.live/solutions/ai-governance-platform/ |
| حوكمة الذكاء الاصطناعي للمستشفيات في جدة | أصلية | P1 | healthcare | غير متاح | غير متاح | no_data | https://brightai.live/solutions/healthcare-ai-governance/jeddah/ |
| خدمات حوكمة الذكاء الاصطناعي | أصلية | P1 | services | غير متاح | غير متاح | no_data | https://brightai.live/services/ |
| خدمات حوكمة الذكاء الاصطناعي في الرياض | مقترحة | P1 | governance | غير متاح | غير متاح | no_data | https://brightai.live/services/ |
| ربط سياسات الذكاء الاصطناعي بالضوابط | أصلية | P1 | policy | غير متاح | غير متاح | no_data | https://brightai.live/solutions/policy-to-control-mapping/ |
| سجل تدقيق الذكاء الاصطناعي | أصلية | P1 | audit | غير متاح | غير متاح | no_data | https://brightai.live/solutions/ai-audit-trail/ |
| سجل مخاطر الذكاء الاصطناعي | أصلية | P1 | risk | غير متاح | غير متاح | no_data | https://brightai.live/tools/ai-risk-register/ |
| سجل مراجعة قرارات الذكاء الاصطناعي | مقترحة | P1 | audit | غير متاح | غير متاح | no_data | https://brightai.live/solutions/ai-audit-trail/ |
| سياسة استخدام الذكاء الاصطناعي في الشركات | أصلية | P1 | policy | غير متاح | غير متاح | no_data | https://brightai.live/blog/ai-usage-policy-template-saudi/ |
| سياسة استخدام الذكاء الاصطناعي للشركات السعودية | أصلية | P1 | policy | غير متاح | غير متاح | no_data | https://brightai.live/blog/ai-usage-policy-template-saudi/ |
| شركة أتمتة الذكاء الاصطناعي السعودية | أصلية | P1 | services | غير متاح | غير متاح | no_data | https://brightai.live/services/ |
| شركة حوكمة الذكاء الاصطناعي السعودية | أصلية | P1 | services | غير متاح | غير متاح | no_data | https://brightai.live/services/ |
| شركة حوكمة ذكاء اصطناعي السعودية | أصلية | P1 | services | غير متاح | غير متاح | no_data | https://brightai.live/services/ |
| شركة ذكاء اصطناعي في السعودية | أصلية | P1 | brand | غير متاح | غير متاح | no_data | https://brightai.live/ |
| ضوابط حوكمة الذكاء الاصطناعي | أصلية | P1 | governance | غير متاح | غير متاح | no_data | https://brightai.live/tools/ai-governance-controls/ |
| قائمة تدقيق حوكمة الذكاء الاصطناعي | مقترحة | P1 | governance | غير متاح | غير متاح | no_data | https://brightai.live/tools/ai-governance-controls/ |
| مخاطر الذكاء الاصطناعي في المصانع | أصلية | P1 | manufacturing | غير متاح | غير متاح | no_data | https://brightai.live/solutions/manufacturing-ai-governance/ |
| مراجعة بشرية للذكاء الاصطناعي | أصلية | P1 | human-approval | غير متاح | غير متاح | no_data | https://brightai.live/solutions/human-approval-layer/ |
| مراقبة استخدام الذكاء الاصطناعي في المؤسسة | مقترحة | P1 | discovery | غير متاح | غير متاح | no_data | https://brightai.live/solutions/ai-use-case-discovery/ |
| ملف أدلة الامتثال للذكاء الاصطناعي | أصلية | P1 | evidence | غير متاح | غير متاح | no_data | https://brightai.live/solutions/ai-evidence-file/ |
| ملف أدلة امتثال الذكاء الاصطناعي | أصلية | P1 | evidence | غير متاح | غير متاح | no_data | https://brightai.live/solutions/ai-evidence-file/ |
| منع تسرب البيانات إلى ChatGPT | أصلية | P1 | ai-firewall | غير متاح | غير متاح | no_data | https://brightai.live/solutions/ai-firewall/ |
| منع تسريب البيانات للذكاء الاصطناعي | أصلية | P1 | ai-firewall | غير متاح | غير متاح | no_data | https://brightai.live/solutions/ai-firewall/ |
| نظام حوكمة الذكاء الاصطناعي | أصلية | P1 | governance | غير متاح | غير متاح | no_data | https://brightai.live/solutions/ai-governance-platform/ |
| نموذج سياسة استخدام الذكاء الاصطناعي | مقترحة | P1 | policy | غير متاح | غير متاح | no_data | https://brightai.live/blog/ai-usage-policy-template-saudi/ |
| أسعار منصة حوكمة الذكاء الاصطناعي | أصلية | P1 | pricing | غير متاح | غير متاح | no_data | https://brightai.live/pricing/ |
| أفضل شركة ذكاء اصطناعي في السعودية | أصلية | P1 | providers | غير متاح | غير متاح | no_data | https://brightai.live/blog/best-ai-companies-saudi-2026/ |
| أفضل منصة حوكمة الذكاء الاصطناعي | أصلية | P1 | governance | غير متاح | غير متاح | no_data | https://brightai.live/blog/best-ai-governance-platforms-2026/ |
| اختيار شركة ذكاء اصطناعي | أصلية | P1 | providers | غير متاح | غير متاح | no_data | https://brightai.live/blog/best-ai-companies-saudi-2026/ |
| الفرق بين AI Firewall و DLP | مقترحة | P1 | firewall-comparison | غير متاح | غير متاح | no_data | https://brightai.live/solutions/ai-firewall/ |
| تكلفة تطبيق الذكاء الاصطناعي للشركات السعودية | أصلية | P1 | pricing | غير متاح | غير متاح | no_data | https://brightai.live/blog/ai-implementation-cost-saudi/ |
| تكلفة حوكمة الذكاء الاصطناعي | أصلية | P1 | pricing | غير متاح | غير متاح | no_data | https://brightai.live/pricing/ |
| تكلفة شهادة ISO 42001 في السعودية | أصلية | P1 | iso-42001 | غير متاح | غير متاح | no_data | https://brightai.live/blog/iso-42001-certification-cost-saudi/ |
| تواصل مع BrightAI | أصلية | P1 | brand | غير متاح | غير متاح | no_data | https://brightai.live/contact/ |
| حماية البيانات الشخصية في الشركات السعودية | مقترحة | P1 | pdpl | غير متاح | غير متاح | no_data | https://brightai.live/blog/pdpl-compliance-guide-saudi-companies/ |
| سعر منصة حوكمة الذكاء الاصطناعي | أصلية | P1 | pricing | غير متاح | غير متاح | no_data | https://brightai.live/pricing/ |
| شركة ذكاء اصطناعي الرياض | أصلية | P1 | brand | غير متاح | غير متاح | no_data | https://brightai.live/contact/ |
| شهادة ISO 42001 السعودية | أصلية | P1 | iso-42001 | غير متاح | غير متاح | no_data | https://brightai.live/blog/iso-42001-certification-cost-saudi/ |
| agentic AI governance | مقترحة | P1 | agentic-governance | غير متاح | غير متاح | no_data | https://brightai.live/hub/agentic-ai-governance/ |
| agentic AI security | مقترحة | P1 | agentic-security | غير متاح | غير متاح | no_data | https://brightai.live/hub/agentic-ai-security/ |
| AI risk management | مقترحة | P1 | risk | غير متاح | غير متاح | no_data | https://brightai.live/docs/ai-risk-management/ |
| أخلاقيات الذكاء الاصطناعي | مقترحة | P1 | governance | 20 | 0 | measured | https://brightai.live/hub/ai-governance/ |
| حوكمة الذكاء الاصطناعي | أصلية | P1 | governance | 20 | 0 | measured | https://brightai.live/hub/ai-governance/ |
| حوكمة الذكاء الاصطناعي pdf | أصلية | P1 | governance | 20 | 0 | measured | https://brightai.live/hub/ai-governance/ |
| ما هي حوكمة البيانات | أصلية | P1 | data-governance | 20 | 0 | measured | https://brightai.live/blog/ndmo-data-governance-saudi/ |
| معنى حوكمة البيانات | أصلية | P1 | data-governance | 20 | 0 | measured | https://brightai.live/blog/ndmo-data-governance-saudi/ |
| generative AI governance | مقترحة | P1 | governance | غير متاح | غير متاح | no_data | https://brightai.live/blog/generative-ai-governance-vs-traditional/ |
| ISO 42001 | مقترحة | P1 | iso-42001 | غير متاح | غير متاح | no_data | https://brightai.live/blog/iso-42001-saudi-implementation-guide/ |
| ISO 42001 requirements | مقترحة | P1 | iso-42001 | غير متاح | غير متاح | no_data | https://brightai.live/blog/iso-42001-saudi-implementation-guide/ |
| LLM security | مقترحة | P1 | ai-firewall | غير متاح | غير متاح | no_data | https://brightai.live/docs/ai-firewall/ |
| prompt injection | مقترحة | P1 | ai-firewall | غير متاح | غير متاح | no_data | https://brightai.live/docs/ai-firewall/ |
| AI governance PDF | أصلية | P1 | governance | غير متاح | غير متاح | no_data | https://brightai.live/hub/ai-governance/ |
| AI governance Vision 2030 | أصلية | P1 | general | غير متاح | غير متاح | no_data | https://brightai.live/blog/ai-vision-2030-saudi/ |
| ChatGPT security for business | أصلية | P1 | pdpl | غير متاح | غير متاح | no_data | https://brightai.live/blog/chatgpt-pdpl-data-compliance/ |
| human review AI | أصلية | P1 | human-approval | غير متاح | غير متاح | no_data | https://brightai.live/docs/human-approval-layer/ |
| ISO 42001 AI implementation | أصلية | P1 | iso-42001 | غير متاح | غير متاح | no_data | https://brightai.live/blog/iso-42001-saudi-implementation-guide/ |
| ISO 42001 Saudi Arabia | أصلية | P1 | iso-42001 | غير متاح | غير متاح | no_data | https://brightai.live/blog/iso-42001-saudi-implementation-guide/ |
| NCA AI requirements Saudi Arabia | أصلية | P1 | nca | غير متاح | غير متاح | no_data | https://brightai.live/docs/nca-ai-cybersecurity-guidelines/ |
| NCA ECC AI controls Saudi Arabia | أصلية | P1 | nca | غير متاح | غير متاح | no_data | https://brightai.live/docs/nca-ecc-ai-controls/ |
| NCA ECC compliance | أصلية | P1 | nca | غير متاح | غير متاح | no_data | https://brightai.live/docs/nca-ecc-ai-controls/ |
| NCA PDPL SDAIA | أصلية | P1 | pdpl | غير متاح | غير متاح | no_data | https://brightai.live/blog/sdaia-nca-pdpl-regulatory-map/ |
| personal data protection AI | أصلية | P1 | pdpl | غير متاح | غير متاح | no_data | https://brightai.live/docs/pdpl-ai-complete-guide/ |
| Saudi PDPL AI compliance | أصلية | P1 | pdpl | غير متاح | غير متاح | no_data | https://brightai.live/blog/chatgpt-pdpl-data-compliance/ |
| SDAIA AI governance | أصلية | P1 | pdpl | غير متاح | غير متاح | no_data | https://brightai.live/blog/sdaia-nca-pdpl-regulatory-map/ |
| SDAIA AI guidelines | أصلية | P1 | sdaia | غير متاح | غير متاح | no_data | https://brightai.live/docs/sdaia-generative-ai-guidelines/ |
| أمن النماذج اللغوية الكبيرة | مقترحة | P1 | ai-firewall | غير متاح | غير متاح | no_data | https://brightai.live/docs/ai-firewall/ |
| أمن وكلاء الذكاء الاصطناعي | مقترحة | P1 | agentic-security | غير متاح | غير متاح | no_data | https://brightai.live/hub/agentic-ai-security/ |
| إطار سدايا لإدارة مخاطر الذكاء الاصطناعي | مقترحة | P1 | sdaia | غير متاح | غير متاح | no_data | https://brightai.live/docs/sdaia-ai-risk-management-framework/ |
| اكتشاف الذكاء الاصطناعي الخفي في الشركات | مقترحة | P1 | discovery | غير متاح | غير متاح | no_data | https://brightai.live/blog/shadow-ai-discovery-saudi-company/ |
| تقييم أثر الذكاء الاصطناعي على الخصوصية | مقترحة | P1 | pdpl | غير متاح | غير متاح | no_data | https://brightai.live/blog/pdpl-impact/ |
| حماية الذكاء الاصطناعي من حقن التعليمات | مقترحة | P1 | ai-firewall | غير متاح | غير متاح | no_data | https://brightai.live/docs/ai-firewall/ |
| حوكمة الذكاء الاصطناعي التوليدي | مقترحة | P1 | governance | غير متاح | غير متاح | no_data | https://brightai.live/blog/generative-ai-governance-vs-traditional/ |
| حوكمة وكلاء الذكاء الاصطناعي | مقترحة | P1 | agentic-governance | غير متاح | غير متاح | no_data | https://brightai.live/hub/agentic-ai-governance/ |
| سياسة استخدام ChatGPT في العمل | مقترحة | P1 | policy | غير متاح | غير متاح | no_data | https://brightai.live/blog/ai-usage-policy-template-saudi/ |
| حماية بيانات الموظفين عند استخدام الذكاء الاصطناعي | مقترحة | P1 | pdpl | غير متاح | غير متاح | no_data | https://brightai.live/blog/pdpl-employee-data-rights-saudi/ |
| سياسات الذكاء الاصطناعي | مقترحة | P1 | policy | غير متاح | غير متاح | no_data | https://brightai.live/blog/ai-usage-policy-template-saudi/ |
| ضوابط NCA ECC للذكاء الاصطناعي | مقترحة | P1 | nca | غير متاح | غير متاح | no_data | https://brightai.live/docs/nca-ecc-ai-controls/ |
| متطلبات ISO 42001 | مقترحة | P1 | iso-42001 | غير متاح | غير متاح | no_data | https://brightai.live/blog/iso-42001-saudi-implementation-guide/ |
| BrightAI Kernel | أصلية | P1 | brand | غير متاح | غير متاح | no_data | https://brightai.live/kernel/ |
| iso 42001 السعودية | أصلية | P1 | iso-42001 | غير متاح | غير متاح | no_data | https://brightai.live/blog/iso-42001-saudi-implementation-guide/ |
| nca ecc والذكاء الاصطناعي | أصلية | P1 | nca | غير متاح | غير متاح | no_data | https://brightai.live/docs/nca-ecc-ai-controls/ |
| pdpl والذكاء الاصطناعي | أصلية | P1 | pdpl | غير متاح | غير متاح | no_data | https://brightai.live/blog/pdpl-ai-safety/ |
| sama الذكاء الاصطناعي البنوك | أصلية | P1 | banking | غير متاح | غير متاح | no_data | https://brightai.live/blog/banking-ai-governance-sama-requirements/ |
| sdaia حوكمة الذكاء الاصطناعي | أصلية | P1 | pdpl | غير متاح | غير متاح | no_data | https://brightai.live/blog/sdaia-nca-pdpl-regulatory-map/ |
| أمان استخدام ChatGPT في الشركات | أصلية | P1 | pdpl | غير متاح | غير متاح | no_data | https://brightai.live/blog/chatgpt-pdpl-data-compliance/ |
| إخفاء البيانات الشخصية قبل chatgpt | أصلية | P1 | pdpl | غير متاح | غير متاح | no_data | https://brightai.live/blog/chatgpt-pdpl-data-compliance/ |
| إدارة مخاطر الذكاء الاصطناعي | أصلية | P1 | risk | غير متاح | غير متاح | no_data | https://brightai.live/docs/ai-risk-management/ |
| إرشادات سدايا للذكاء الاصطناعي | أصلية | P1 | sdaia | غير متاح | غير متاح | no_data | https://brightai.live/docs/sdaia-generative-ai-guidelines/ |
| إطار حوكمة الذكاء الاصطناعي | أصلية | P1 | governance | غير متاح | غير متاح | no_data | https://brightai.live/docs/governance-application/ |
| استخدام ChatGPT في الشركات السعودية | أصلية | P1 | pdpl | غير متاح | غير متاح | no_data | https://brightai.live/blog/chatgpt-pdpl-data-compliance/ |
| الامتثال لضوابط NCA ECC | أصلية | P1 | nca | غير متاح | غير متاح | no_data | https://brightai.live/docs/nca-ecc-ai-controls/ |
| الذكاء الاصطناعي dga sdaia nca | أصلية | P1 | pdpl | غير متاح | غير متاح | no_data | https://brightai.live/blog/sdaia-nca-pdpl-regulatory-map/ |
| الذكاء الاصطناعي ونظام حماية البيانات الشخصية | أصلية | P1 | pdpl | غير متاح | غير متاح | no_data | https://brightai.live/docs/pdpl-ai-governance/ |
| الفرق بين حوكمة البيانات وحوكمة الذكاء الاصطناعي | أصلية | P1 | data-governance | غير متاح | غير متاح | no_data | https://brightai.live/blog/ndmo-data-governance-saudi/ |
| امتثال PDPL للشركات السعودية | أصلية | P1 | pdpl | غير متاح | غير متاح | no_data | https://brightai.live/blog/pdpl-compliance-guide-saudi-companies/ |
| تطبيق ISO 42001 | أصلية | P1 | iso-42001 | غير متاح | غير متاح | no_data | https://brightai.live/blog/iso-42001-saudi-implementation-guide/ |
| تطبيق ISO 42001 في السعودية | أصلية | P1 | iso-42001 | غير متاح | غير متاح | no_data | https://brightai.live/blog/iso-42001-saudi-implementation-guide/ |
| تطبيق ISO 42001 للذكاء الاصطناعي | أصلية | P1 | iso-42001 | غير متاح | غير متاح | no_data | https://brightai.live/blog/iso-42001-saudi-implementation-guide/ |
| تطبيق حوكمة الذكاء الاصطناعي | أصلية | P1 | governance | غير متاح | غير متاح | no_data | https://brightai.live/docs/governance-application/ |
| تطبيق حوكمة الذكاء الاصطناعي في الشركة | أصلية | P1 | governance | غير متاح | غير متاح | no_data | https://brightai.live/docs/governance-application/ |
| تقييم أثر حماية البيانات | مقترحة | P1 | pdpl | غير متاح | غير متاح | no_data | https://brightai.live/blog/pdpl-impact/ |
| تقييم مخاطر الذكاء الاصطناعي | أصلية | P1 | risk | غير متاح | غير متاح | no_data | https://brightai.live/docs/ai-risk-management/ |
| حماية البيانات الشخصية مع الذكاء الاصطناعي | أصلية | P1 | pdpl | غير متاح | غير متاح | no_data | https://brightai.live/docs/pdpl-ai-complete-guide/ |
| حماية بيانات المرضى عند استخدام الذكاء الاصطناعي | أصلية | P1 | healthcare | غير متاح | غير متاح | no_data | https://brightai.live/blog/healthcare-ai-governance-saudi-hospitals/ |
| حوكمة الذكاء الاصطناعي رؤية 2030 | أصلية | P1 | general | غير متاح | غير متاح | no_data | https://brightai.live/blog/ai-vision-2030-saudi/ |
| حوكمة الذكاء الاصطناعي سدايا | أصلية | P1 | pdpl | غير متاح | غير متاح | no_data | https://brightai.live/blog/sdaia-nca-pdpl-regulatory-map/ |
| خطوات حوكمة AI | أصلية | P1 | governance | غير متاح | غير متاح | no_data | https://brightai.live/docs/governance-application/ |
| سدايا والذكاء الاصطناعي | أصلية | P1 | pdpl | غير متاح | غير متاح | no_data | https://brightai.live/blog/sdaia-nca-pdpl-regulatory-map/ |
| ضوابط الأمن السيبراني للذكاء الاصطناعي السعودية | أصلية | P1 | nca | غير متاح | غير متاح | no_data | https://brightai.live/docs/nca-ecc-ai-controls/ |
| ضوابط الذكاء الاصطناعي nca | أصلية | P1 | nca | غير متاح | غير متاح | no_data | https://brightai.live/docs/nca-ecc-ai-controls/ |
| قائمة تدقيق ISO 42001 | أصلية | P1 | iso-42001 | غير متاح | غير متاح | no_data | https://brightai.live/blog/iso-42001-audit-checklist-saudi/ |
| ما هي حوكمة الذكاء الاصطناعي | أصلية | P1 | governance | غير متاح | غير متاح | no_data | https://brightai.live/hub/ai-governance/ |
| متطلبات NCA للذكاء الاصطناعي | أصلية | P1 | nca | غير متاح | غير متاح | no_data | https://brightai.live/docs/nca-ai-cybersecurity-guidelines/ |
| متطلبات الهيئة الوطنية للأمن السيبراني | أصلية | P1 | nca | غير متاح | غير متاح | no_data | https://brightai.live/blog/nca-cybersecurity-requirements-saudi/ |
| مخاطر shadow ai | أصلية | P1 | risk | غير متاح | غير متاح | no_data | https://brightai.live/blog/hidden-ai-risks-saudi-organizations/ |
| مسؤول حوكمة الذكاء الاصطناعي | أصلية | P1 | governance | غير متاح | غير متاح | no_data | https://brightai.live/blog/what-is-ai-governance-saudi-companies/ |
| نظام إدارة الذكاء الاصطناعي | أصلية | P1 | iso-42001 | غير متاح | غير متاح | no_data | https://brightai.live/blog/iso-42001-saudi-implementation-guide/ |
| نظام حماية البيانات الشخصية والذكاء الاصطناعي السعودية | أصلية | P1 | pdpl | غير متاح | غير متاح | no_data | https://brightai.live/blog/chatgpt-pdpl-data-compliance/ |
| نقل البيانات الشخصية خارج المملكة | مقترحة | P1 | pdpl | غير متاح | غير متاح | no_data | https://brightai.live/blog/pdpl-cross-border-data-transfer-ai/ |
| data loss prevention | مقترحة | P2 | ai-firewall | 140 | 54 | measured | https://brightai.live/solutions/ai-firewall/ |
| التحول الرقمي | أصلية | P2 | automation | 1600 | 31 | measured | https://brightai.live/blog/digital-transformation-sme-saudi/ |
| قياس التحول الرقمي | أصلية | P2 | automation | 880 | 17 | measured | https://brightai.live/blog/digital-transformation-sme-saudi/ |
| شات بوت | أصلية | P2 | chatbot | 720 | 16 | measured | https://brightai.live/blog/arabic-chatbot-customer-service-saudi/ |
| إدارة المخاطر | أصلية | P2 | risk | 320 | 20 | measured | https://brightai.live/docs/ai-risk-management/ |
| إدارة المخاطر pdf | أصلية | P2 | risk | 210 | 13 | measured | https://brightai.live/docs/ai-risk-management/ |
| human in the loop ai | أصلية | P2 | human-approval | 30 | 0 | measured | https://brightai.live/solutions/human-approval-layer/ |
| التحول الرقمي في السعودية | أصلية | P2 | automation | 210 | 21 | measured | https://brightai.live/blog/digital-transformation-sme-saudi/ |
| AI security | أصلية | P2 | ai-firewall | 20 | 0 | measured | https://brightai.live/solutions/ai-firewall/ |
| حماية البيانات | أصلية | P2 | pdpl | 110 | 16 | measured | https://brightai.live/docs/pdpl-ai-complete-guide/ |
| الذكاء الاصطناعي في السعودية | أصلية | P2 | saudi-ai | 140 | 28 | measured | https://brightai.live/blog/saudi-ai-landscape-sdaia-humain-allam-scai/ |
| chatgpt saudi arabia | أصلية | P2 | pdpl | 50 | 0 | measured | https://brightai.live/blog/chatgpt-pdpl-data-compliance/ |
| إدارة البيانات | مقترحة | P2 | data-governance | 170 | 21 | measured | https://brightai.live/blog/ndmo-data-governance-saudi/ |
| Human in the loop | أصلية | P2 | human-approval | غير متاح | غير متاح | no_data | https://brightai.live/solutions/human-approval-layer/ |
| الفرق بين حوكمة الشركات وحوكمة الذكاء الاصطناعي | أصلية | P2 | general | غير متاح | غير متاح | no_data | مؤجل / غير مخصص |
| شركة ذكاء اصطناعي الدمام | مقترحة | P2 | providers | غير متاح | غير متاح | no_data | https://brightai.live/services/ |
| شركة ذكاء اصطناعي جدة | مقترحة | P2 | providers | غير متاح | غير متاح | no_data | https://brightai.live/services/ |
| شات بوت عربي | أصلية | P2 | chatbot | 70 | 0 | measured | https://brightai.live/blog/arabic-chatbot-customer-service-saudi/ |
| تطبيقات الذكاء الاصطناعي في السعودية | أصلية | P2 | saudi-ai | 20 | 0 | measured | https://brightai.live/blog/saudi-ai-landscape-sdaia-humain-allam-scai/ |
| روبوت دردشة | أصلية | P2 | chatbot | 20 | 0 | measured | https://brightai.live/blog/arabic-chatbot-customer-service-saudi/ |
| أمن الذكاء الاصطناعي | أصلية | P2 | ai-firewall | غير متاح | غير متاح | no_data | https://brightai.live/solutions/ai-firewall/ |
| الأمن السيبراني والذكاء الاصطناعي | مقترحة | P2 | agentic-security | غير متاح | غير متاح | no_data | https://brightai.live/hub/agentic-ai-security/ |
| الفرق بين ISO 27001 و ISO 42001 | مقترحة | P2 | iso-42001 | غير متاح | غير متاح | no_data | https://brightai.live/blog/iso-27001-vs-iso-42001-ai-governance/ |
| اللائحة التنفيذية لنظام حماية البيانات الشخصية | مقترحة | P2 | pdpl | غير متاح | غير متاح | no_data | https://brightai.live/blog/pdpl-executive-regulations-explained/ |
| AI for Saudi ecommerce | أصلية | P2 | ecommerce | غير متاح | غير متاح | no_data | https://brightai.live/blog/ai-ecommerce-saudi/ |
| Arabic customer service chatbot Saudi Arabia | أصلية | P2 | chatbot | غير متاح | غير متاح | no_data | https://brightai.live/blog/arabic-chatbot-customer-service-saudi/ |
| منع تسرب البيانات | مقترحة | P2 | ai-firewall | غير متاح | غير متاح | no_data | https://brightai.live/solutions/ai-firewall/ |
| حماية المعلومات | مقترحة | P2 | ai-firewall | 20 | 0 | measured | https://brightai.live/docs/ai-firewall/ |
| حوكمة تقنية المعلومات | مقترحة | P2 | data-governance | 20 | 0 | measured | https://brightai.live/blog/ndmo-data-governance-saudi/ |
| التحول الرقمي للشركات | أصلية | P2 | automation | غير متاح | غير متاح | no_data | https://brightai.live/blog/digital-transformation-sme-saudi/ |
| الذكاء الاصطناعي التوليدي | مقترحة | P2 | governance | غير متاح | غير متاح | no_data | https://brightai.live/blog/generative-ai-governance-vs-traditional/ |
| الذكاء الاصطناعي والتحول الرقمي | أصلية | P2 | automation | غير متاح | غير متاح | no_data | https://brightai.live/blog/digital-transformation-sme-saudi/ |
| تسريب البيانات | مقترحة | P2 | ai-firewall | غير متاح | غير متاح | no_data | https://brightai.live/docs/ai-firewall/ |
| ذكاء اصطناعي للمتاجر الإلكترونية السعودية | أصلية | P2 | ecommerce | غير متاح | غير متاح | no_data | https://brightai.live/blog/ai-ecommerce-saudi/ |
| شات بوت عربي لخدمة العملاء السعودية | أصلية | P2 | chatbot | غير متاح | غير متاح | no_data | https://brightai.live/blog/arabic-chatbot-customer-service-saudi/ |
| شات بوت للشركات السعودية | أصلية | P2 | chatbot | غير متاح | غير متاح | no_data | https://brightai.live/blog/arabic-chatbot-customer-service-saudi/ |
| منظومة الذكاء الاصطناعي السعودية | أصلية | P2 | saudi-ai | غير متاح | غير متاح | no_data | https://brightai.live/blog/saudi-ai-landscape-sdaia-humain-allam-scai/ |
| سياسة الخصوصية | أصلية | P3 | policy | 2400 | 23 | measured | https://brightai.live/privacy-policy/ |
| لائحة حوكمة الشركات | أصلية | P3 | broad-support-only | 1000 | 12 | measured | مؤجل / غير مخصص |
| تحليل البيانات | أصلية | P3 | broad-support-only | 1900 | 34 | measured | مؤجل / غير مخصص |
| الخصوصية | أصلية | P3 | broad-support-only | 2900 | 38 | measured | مؤجل / غير مخصص |
| ماهو الذكاء الاصطناعي | أصلية | P3 | broad-support-only | 2400 | 39 | measured | مؤجل / غير مخصص |
| الذكاء الاصطناعي السعودية | أصلية | P3 | broad-support-only | 1300 | 27 | measured | مؤجل / غير مخصص |
| حوكمة الشركات | أصلية | P3 | broad-support-only | 720 | 17 | measured | مؤجل / غير مخصص |
| تطبيق الذكاء الاصطناعي | أصلية | P3 | broad-support-only | 2400 | 48 | measured | مؤجل / غير مخصص |
| تطبيقات الذكاء الاصطناعي | أصلية | P3 | broad-support-only | 2400 | 48 | measured | مؤجل / غير مخصص |
| الأمن السيبراني | أصلية | P3 | broad-support-only | 22200 | 50 | measured | مؤجل / غير مخصص |
| الذكاء الاصطناعي بالعربي | أصلية | P3 | broad-support-only | 1600 | 46 | measured | مؤجل / غير مخصص |
| ذكاء اصطناعي | أصلية | P3 | broad-support-only | 60500 | 67 | measured | مؤجل / غير مخصص |
| استخدام الذكاء الاصطناعي | أصلية | P3 | broad-support-only | 480 | 31 | measured | مؤجل / غير مخصص |
| استخدامات الذكاء الاصطناعي | أصلية | P3 | broad-support-only | 480 | 31 | measured | مؤجل / غير مخصص |
| الذكاء الاصطناعي | أصلية | P3 | broad-support-only | 165000 | 71 | measured | مؤجل / غير مخصص |
| تعلم الآلة | أصلية | P3 | broad-support-only | 260 | 23 | measured | مؤجل / غير مخصص |
| ذكاء الأعمال | أصلية | P3 | broad-support-only | 260 | 23 | measured | مؤجل / غير مخصص |
| حوكمة الشركات في السعودية | أصلية | P3 | broad-support-only | 30 | 0 | measured | مؤجل / غير مخصص |
| دورات الذكاء الاصطناعي | أصلية | P3 | excluded-external-or-consumer | 590 | 45 | measured | مؤجل / غير مخصص |
| تقنيات الذكاء الاصطناعي | مقترحة | P3 | governance | 50 | 0 | measured | https://brightai.live/hub/ai-governance/ |
| وظائف الذكاء الاصطناعي | أصلية | P3 | excluded-external-or-consumer | 170 | 20 | measured | مؤجل / غير مخصص |
| سدايا | أصلية | P3 | excluded-external-or-consumer | 33100 | 39 | measured | مؤجل / غير مخصص |
| شات جي بي تي | أصلية | P3 | excluded-external-or-consumer | 165000 | 53 | measured | مؤجل / غير مخصص |
| منصة حوكمة البيانات الوطنية | أصلية | P3 | excluded-external-or-consumer | 1300 | 42 | measured | مؤجل / غير مخصص |
| برمجة الذكاء الاصطناعي | أصلية | P3 | broad-support-only | 50 | 0 | measured | مؤجل / غير مخصص |
| saudi company for artificial intelligence | أصلية | P3 | excluded-external-or-consumer | 480 | 42 | measured | مؤجل / غير مخصص |
| AI network security | أصلية | P3 | broad-support-only | 30 | 0 | measured | مؤجل / غير مخصص |
| chatgpt | أصلية | P3 | excluded-external-or-consumer | 246000 | 100 | measured | مؤجل / غير مخصص |
| الامتثال | أصلية | P3 | broad-support-only | غير متاح | غير متاح | no_data | مؤجل / غير مخصص |
| الذكاء الاصطناعي في | أصلية | P3 | broad-support-only | غير متاح | غير متاح | no_data | مؤجل / غير مخصص |
| إنشاء صور بالذكاء الاصطناعي | أصلية | P3 | excluded-external-or-consumer | غير متاح | غير متاح | no_data | مؤجل / غير مخصص |
| محادثة مع الذكاء الاصطناعي | أصلية | P3 | excluded-external-or-consumer | غير متاح | غير متاح | no_data | مؤجل / غير مخصص |
| AI governance association | أصلية | P3 | excluded-external-or-consumer | غير متاح | غير متاح | no_data | مؤجل / غير مخصص |
| جمعية حوكمة الذكاء الاصطناعي | أصلية | P3 | excluded-external-or-consumer | غير متاح | غير متاح | no_data | مؤجل / غير مخصص |
