# Measurement Plan — RAG Smart Search (Groq)
**Deploy Date:** 2026-02-23

## KPI Target
- KPI: `search_to_lead_rate`
- Baseline: متوسط آخر 28 يوم قبل الإطلاق من `search` إلى `generate_lead`
- Goal: رفع المعدل بنسبة +18% خلال 45 يوم

## Tracking Event
- Event Name: `rag_search_answer_served`
- Trigger: عند استلام استجابة ناجحة من `/api/ai/search` وتحتوي `answer` + `sources`
- Payload: `query_length`, `mode`, `retrieval_count`, `sources_count`, `results_count`, `page_path`

## Success Criteria
- Minimum Improvement: خفض `search_exit_rate` بنسبة 12% على الأقل مع رفع `search_to_lead_rate` بنسبة 10%+ كحد أدنى
- Evaluation Window: 45 يوم
- Rollback Trigger: زيادة `search_error_rate` فوق 8% لمدة 3 أيام متتالية أو هبوط `search_to_lead_rate` أكثر من 15%

## Supporting Events
- `rag_source_click`: نقر المستخدم على مصدر داخل نتائج RAG
- `rag_search_fallback`: تشغيل وضع fallback (`retrieval_only` أو `retrieval_fallback`)
- `search_no_matches`: عدم وجود نتائج قابلة للاسترجاع

## Validation Method
- Platforms: GA4 + Looker Studio + server logs
- Validation: مطابقة عدد أحداث `rag_search_answer_served` بين GA4 والسجلات الخلفية يومياً
- Data Quality: عدم إرسال أي PII في query payload (تخزين طول النص فقط + mode/metering)
