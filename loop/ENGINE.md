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

## Current host — model bridge gap

This BRIGHTAI host (`/Users/yzydalshmry/Desktop/BRIGHTAI`) does **not** expose a
direct MiniMax-M3 chat CLI:

- `MiniMax` (Mavis daemon manager) has no `chat` / `model` / `-m` subcommand.
- `MiniMax-M3` exists in `/Users/yzydalshmry/.mavis/config.yaml` under the
  `minimax` provider, but the daemon does not serve an OpenAI-compatible
  chat completions endpoint on `localhost:15321` (all probed paths 404).
- `claude` (Claude Code v2.1.177) is interactive by default and hangs on
  non-interactive `-p` use on this host.

Therefore `loop/scripts/call.sh` ships with a multi-strategy probe that:

1. First honours `MINIMAX_BRIDGE` if set (recommended — see contract below).
2. Falls back to the spec'd `MiniMax -m ... --effort ...` syntax on hosts
   where it works.
3. Tries `claude --print --bare` as a last resort, but only if the probe
   exits cleanly under the 5s timeout.
4. Otherwise exits `2` ("refusal-or-no-backend") with a stderr message
   that names the missing piece. The heartbeat treats this as
   "no model backend available — skip iteration, do not crash".

### MINIMAX_BRIDGE contract

The heartbeat will `eval` the bridge string in a child bash with the
following env vars exported:

| Var                   | Meaning                                     |
|-----------------------|---------------------------------------------|
| `MINIMAX_MODEL`       | e.g. `MiniMax-M3`                           |
| `MINIMAX_EFFORT`      | `low`/`medium`/`high`/`xhigh`/`max`         |
| `MINIMAX_MAX_TOKENS`  | integer, default `64000`                    |

The prompt is piped to the bridge's **stdin**. The bridge must write
JSON to **stdout** with one of these shapes:

```json
{"result": "...", "stop_reason": "end_turn"}
{"content": [{"text": "..."}], "stop_reason": "end_turn"}
```

`stop_reason` must be one of `end_turn|stop|tool_use|finished|succeeded`
(proceeds) or `refusal|content_filter` (rerouted via `check-refusal.sh`).

### Quick smoke test

```bash
# Synthetic bridge that just echoes a fixed response:
MINIMAX_BRIDGE='echo "{\"result\":\"pong\",\"stop_reason\":\"end_turn\"}"' \
  loop/scripts/call.sh MiniMax-M3 high /tmp/any-prompt.txt
# expect: pong (exit 0)
```

### When you wire a real bridge

Replace the synthetic bridge with your real HTTP/SDK call, e.g.:

```bash
export MINIMAX_BRIDGE='curl -sS -X POST "$BRIDGE_URL/v1/chat/completions" \
  -H "Authorization: Bearer $BRIDGE_KEY" \
  -H "Content-Type: application/json" \
  -d @- <<JSONEOF
{
  "model":      "$MINIMAX_MODEL",
  "max_tokens": $MINIMAX_MAX_TOKENS,
  "messages":   [{"role":"user","content":$(jq -Rs . < /dev/stdin)}]
}
JSONEOF'
```

(curl here doesn't read stdin — adapt the `-d` to your bridge contract.)

Until a real bridge is wired, the heartbeat's triage/conductor/worker/
verifier calls all exit `2` and the loop logs "no model backend" per
iteration. This is by design — we refuse to fake calls that aren't real.