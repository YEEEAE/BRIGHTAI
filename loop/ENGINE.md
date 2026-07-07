# Engine Spec Sheet — MiniMax Code (MiniMax-M3)

> Source: official Anthropic docs for Fable 5, adapted to MiniMax Code.

| Setting        | Value                                            |
|----------------|--------------------------------------------------|
| Model string   | `MiniMax-M3`                                     |
| Context        | 1M tokens                                        |
| Output         | up to 128k per request                           |
| Price          | $10/M in · $50/M out                             |
| Thinking       | adaptive, always on                              |
| Effort         | low · medium · high · xhigh · max                |
| Effort default | `high` (omit parameter)                          |
| Effort xhigh   | reserved for conductor seat only                 |

## Five facts that change how you build

1. **`max_tokens` is a hard cap on thinking + response text.**

   At `high`/`xhigh`, set `max_tokens=64000` minimum, أو الـ agent بيقطع في نص الـ thought.

   ينطبق على **كل** call في الـ scripts.

2. **`xhigh` is for long-running agentic tasks (>30 min) only.**

   للـ conductor seat بس. الـ workers يفضلوا على `high` أو أقل.

   مقولة الـ docs: "lower effort on Fable 5 often exceeds xhigh performance on prior models"

   → لا ترقّي workers لـ xhigh.

3. **Refusals are HTTP 200, not errors.**

   الـ safety classifier بيرجّع `stop_reason: "refusal"` كـ success response.

   **سكربتاتك لازم تفحص `stop_reason`، مش exit code.**

   Fallback: روتر server-side أو middleware يرجّع للـ model الاحتياطي.

4. **Never ask the model to echo its reasoning.**

   أي prompt فيه طلب صريح للاستدلال في الرد (نمط reasoning_extraction)

   → triggers the refusal category.

   **دقق على skills قديمة عند الترحيل.**

5. **Turns are long by design.**

   المهام الصعبة بتاخد دقايق لكل request على effort عالي.

   الـ autonomous runs بتتمد لساعات.

   → الـ heartbeat لازم يبقى **cron** (scheduled)، مش blocking loop.

## Routing rules

- Reads >50k tokens (logs/PDFs/screenshots) → cheap reader model only.
- Ships to users (UI/API/copy) → taste ≥ 8 gets final pass.
- Spec complete → medium effort.
- Decision (plan/review/route) → xhigh, read-only.