# D07 — مركز المعرفة والتحويل

- الحالة: PARTIAL؛ المصدر يحتوي الإصلاح أصلًا، بلا تعديل شكلي للشيفرة أو المحتوى.
- النسخة: `main` / `b0c1bd415911aec4d24326a7c89dc5f3811c8ae8`؛ working tree نظيف قبل التوثيق؛ المرجع المطلوب `6a3d53f41b5bd1af59eb320245745498765bd320` مختلف.
- البيئة: macOS، Node v22.22.2؛ 2026-11-11، النتائج أدناه UTC (التوقيت السعودي +03:00).

| الدليل | النتيجة | الوقت UTC |
|---|---|---|
| HTTP عام: `/knowledge/?q=governance&topic=privacy` | FAIL — 404 بلا Location؛ `/docs/` 200 | 17:13:28 |
| `node --test tests/knowledge-search.test.mjs` | PASS 3/3؛ تطبيع العربية، AND/OR للفلاتر، استخراج المحتوى | نحو 17:15 |
| خادم التشغيل `scripts/server.mjs` على 127.0.0.1:4427؛ `/knowledge` و`/knowledge/` | PASS — 301 واحد إلى `/docs/` ثم200؛ query عربي وtopic ومنتجان مكرران محفوظة حرفيًا | 17:16:31 |
| المصدر الحالي عبر `npm run dev -- --host 127.0.0.1 --port 4428`؛ docs ومقال `ai-governance-saudi` | PASS —200؛ محتوى المركز/المقال وRTL في HTML | 17:16:31 |
| Browser: البحث المتغير، الفلاتر، back/forward، عرض التاريخ والروابط | BLOCKED — IAB timeout؛ Browser extension بلا profile؛ Safari بلا Computer Use permissions | 17:13–17:15 |
| OpenSEO `list_projects` | projects=[]؛ GSC NOT VERIFIED؛ لم يُنشأ مشروع أو اتصال | هذه الجولة |

## حدود الدليل

- خادم التشغيل استخدم wrapper وredirects.json الحاليين، لكن `dist` يعود إلى SHA `0baadba434057b960901722416666384083f7485`، builtAt `2026-11-11T03:54:18.153Z`. نجاح docs200 فيه ليس إثبات artifact حديث؛ فُحص محتوى المصدر الحالي منفصلًا عبر dev، دون build.
- dev ليس بديلًا عن wrapper: محاولة `/knowledge` بلا slash أعادت404، ومحاولة `/knowledge/` مع query أعادت301 إلىdocs دونquery. لا يُعمم نجاح wrapper على dev؛ المسار المعتمد يطبق التحويل قبل Astro ويحفظ query.
- المقال الممثل يحتوي مصدرًا `datePublished=2026-10-31` و`dateModified=2026-11-08` و`time datetime=2026-11-08`؛ عرض التاريخ بالمتصفح NOT VERIFIED.
- لا تعديل canonical أوsitemap أوllms أوanalytics؛ لذلك لا إعادة تدقيق لها. لا إرسال q/token للتحليلات ولا بيانات عملاء. Similarweb/GSC estimates NOT VERIFIED؛ لا API estimate ولا شراء أو ربط حساب.
- لا تغيير تحريري مطلوب ثبت في العينة؛ لم تُراجع المقالات32 بالجملة. Hero/header/logo/Constellation وCSS لم تُمس.

## القرار والمالك

- المصدر: الإصلاح موجود؛ المحلي: التحويل والبحث المنطقي مثبتان ضمن الحدود أعلاه؛ المنشور: التحويل FAIL؛ الاعتماد: غير ممنوح.
- Internal: NOT READY — قبول المتصفح غير مكتمل. Public: NO-GO لإغلاق D07 — الحي404. Commercial: NO-GO؛ لا دليل قياس أو إطلاق.
- المانع: DevOps/T01 لتفعيل التوجيه الحي بتفويض مستقل؛ Arabic Editorial/Technical SEO لقبول المتصفح؛ مالك القياس/T06 لربط GSC مستقلًا. غياب GSC لا يبرر اختبارات محلية إضافية.
- لا branch/commit/push/deploy/DNS أوenv/workflow؛ التراجع يقتصر على حذف تقرير هذه الجولة وإعادة سطر حالتها، إذ لا تعديل وظيفي.
