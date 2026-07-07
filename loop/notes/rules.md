# The Rules — laws, not tips

> A number, a never, or a command that checks it.

These are the operating contract for the loop and every agent that touches
it. Violating any of these without a written exception in
`loop/notes/exceptions.md` is a bug, not a judgement call.

## Engine

- **The conductor plans, workers execute, neither verifies.** `--allowedTools`
  enforces it; do not pass `--allowedTools=all` to either seat.
- **Agents talk in work orders.** `done_when` = spec + stop condition + future
  invariant. If a work order can't be reduced to these three, it's not ready.
- **Spend effort where the loop branches.** Never above `high` in a loop.
  `xhigh` is for one-shot reviews and the conductor seat only.

## Cost

- **The quiet tick costs a penny or the loop costs a grand.** Every cadence
  change halves or doubles the floor; budget changes are alarms, not knobs.
- **Compute the metabolism before you cron.** A daily tick at $0.86/tick is
  not the same as a 15-min babysitter at $34/day. If you can't quote the
  daily number from `make audit`, the cron is premature.

## Goals

- **If a shell script couldn't check it, don't write it as a goal.** Adjectives
  are banned. Cheap, deterministic, read-only is the bar.
- **Goals graduate; they do not close.** `verify-goals.sh` runs daily, forever.
  Retiring a goal is a human decision logged in the goal file.

## Trust

- **Autonomy per skill: 20 runs, 95%, auto.** Demotion is automatic and loud
  (ALERT on stderr, picked up by cron).
- **Two ledgers: trust (workers) and goals (work).** Read both with coffee.

## Conduct

- **Contract in the repo: `acts-alone` / `queues` / `wakes-me`.** Anything
  not classified defaults to `queues`.
- **Never iterate on output from a model you didn't choose.** When the
  safeguard router swaps a model mid-run, the output belongs to that model.
  Re-run with the original model.
- **The sentinel detects; the pipeline fixes.** The sentinel never edits
  goal files. Violations feed the normal pipeline.

## Verification

- **Quorum before waking Fable.** Cheap models vote 2-of-3 before the
  conductor pays for a Fable call. Install when triggers fire, not before.
- **Ratchet then weld.** Once one number matters, ratchet it down; never
  edit the rule to lower it.
- **Spar daily. Compost weekly.** Sparring tests live under
  `tests/sparring/`; compost proposes ≤ 3 changes per week.
- **One graduation criterion at a time.** Don't demand L4 evidence while
  checking L3 work.
- **Every month, delete something.** If a skill, a goal, or a target is
  unused for a month, retire it.

## Engine invariants (from the official docs)

- **`max_tokens` caps thinking plus text.** Set `max_tokens=64000` minimum
  for `high` / `xhigh`, every call. The agent will truncate the thought
  if you don't.
- **Refusals are HTTP 200, not errors.** Check `stop_reason`, never exit code.
- **Never ask the model to echo its reasoning.** Any prompt containing
  "show your thinking" / "explain your reasoning in the response"
  triggers `reasoning_extraction` refusal. Audit skills before reusing.
- **Old skills degrade Fable.** If you inherit a skill that asks for echoed
  reasoning, rewrite it before the next tick.
- **Fresh-context verifiers beat self-critique.** The `loop/workers/verify.md`
  seat must be a separate session with no memory of the maker's run.

## The closing line

> The hard part was building something around it that stays honest when
> you stop watching. That is what you just built.

Treat every line above as a load-bearing wall. If you find yourself
wanting to bend one, write the exception in `loop/notes/exceptions.md`
with date + reason + reviewer — don't bend it silently.