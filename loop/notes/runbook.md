# Runbook — alarm signals and what to do

Read this with coffee. Every alarm has a single owner-action; the goal is to
keep the response mechanical so we don't burn willpower on a 7am page.

| Signal | Meaning | Owner action |
|---|---|---|
| exit 2 (reroute) | safeguard router swapped models mid-run | read the checkpoint; re-run item tomorrow; **never iterate on the swapped output** |
| `stop_reason: refusal` | safety classifier declined (HTTP 200, not an error) | official path: fallback to Opus 4.8 via fallbacks or middleware; if it recurs on one skill, audit that skill for reasoning-echo or cyber/bio-adjacent phrasing |
| exit 3 (budget) | daily spend hit the line | `make audit`; find which stage grew; **fix the effort map, not the budget** |
| ALERT demoted | an established skill dropped below 90% | read its last 3 fails; usually the spec pattern, not the worker |
| goal VIOLATED | something finished stopped being true | sentinel gives suspects; **fix goes through the normal pipeline** — never directly edit the goal file to clear it |
| maker/checker standoff ×2 | neither is presumed right | **you** decide, or run the standoff-breaker (third fresh reviewer, judges evidence, may not split the difference) |
| verify-goals timeout | predicate too expensive | that is a violation; cheapen the predicate |

## Why these are the only actions

The loop's job is to keep the floor honest. The user's job is to keep the
ceiling honest. Splitting that way:

- Loop owns: detection, logging, ledger writes, auto-tier actions.
- User owns: priority calls, contract-sensitive approvals, breaker decisions,
  budget changes, the sentinel's "satisfied → VIOLATED" investigations.

Anything not in the table above is a Tier 3 signal — investigate before
acting, because the loop's classification (acts-alone / queues / wakes-me)
already triaged it.

## Anti-patterns

- **Re-running a FAILED item immediately.** The same model in the same
  state will produce the same answer. Read the diff, change the spec.
- **Raising the budget to silence exit 3.** The budget is the alarm;
  raising it is the equivalent of disabling a smoke detector.
- **Editing a goal file to flip VIOLATED → satisfied without fixing
  the predicate.** Graduation is forward-only; satisfied means the
  predicate passed. Manual flips break the graduation law.
- **Iterating on output from a model you didn't choose.** When the
  safeguard router swaps a model, the output belongs to that model. Re-run
  on the original model (or the model you trust) — never on the swap.