# Playbook المتابعة

## أسبوعيًا

- FACT: أعد `site_audit/info` و`site_audit/snapshot` للحملة `31075135` بعد recrawl منشور.
- FACT: أعد `organic_research` للـstriking distance و`domain_rank` لقاعدة `sa`.
- FACT: لا توجد أداة balance في Semrush MCP؛ تكلفة الوحدات = `not available`، لذلك لا يوجد ادعاء بنسبة 20%.
- استخدم الملفات الموجودة في `seo/raw/` كـcache، ولا تعيد السحب إذا كان snapshot/date مطابقًا.

## شهريًا

- `phrase_these` للكلمات الجديدة (server-side `export_columns` و`display_limit` إن دعم التقرير).
- `phrase_related` و`phrase_questions` لكل cluster.
- `competitors_research` و`backlinks_overview` للقياس المقارن.
- شغّل build ثم Lighthouse محليًا، واحفظ النتائج في `seo/lighthouse/`.

كل مقياس لازم يشير إلى raw file؛ القيم غير المتاحة تظل `not available`.
