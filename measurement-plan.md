# Measurement Plan — Floating Chat Gemini Gateway
**Deploy Date:** 2026-02-27

## KPI Target
- KPI: Chat Lead Conversion Rate
- Baseline: 2.1%
- Goal: 3.0% (+0.9pp)

## Tracking Event
- Event Name: `chat_ai_response_success`
- Trigger: نجاح استلام رد من `POST /api/gemini/chat` مع `reply` غير فارغ
- Payload: `session_id`, `latency_ms`, `has_suggestions`, `entry_page`, `message_length_bucket`

## Success Criteria
- Minimum Improvement: +15% في عدد المحادثات المكتملة (جلسة فيها على الأقل رسالتين)
- Evaluation Window: 14 days
- Rollback Trigger: ارتفاع أخطاء الشات (`4xx/5xx`) فوق 5% لمدة 60 دقيقة متصلة
