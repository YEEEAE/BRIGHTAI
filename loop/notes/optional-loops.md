# Optional Loops — install conditions

> **Reading rule**: do **not** install any of these speculatively. Each one
> has a trigger condition; install only when the trigger fires. Speculative
> installs are how systems bloat and the loop's signal-to-noise collapses.

| Loop | Status | Trigger | Decision |
|---|---|---|---|
| Quorum | ⏳ not installed | dispatch shows ≥3 Fable wake-ups producing `action: stop` in 7 days | install when ≥3 stops/week |
| Ratchet | ⏳ not installed | one number matters (lint count, bundle size, kB per route, error rate) | install per-metric, on request |
| Sparring | ⏳ not installed | you ship code daily for a sustained week | install when daily-merge rate ≥ 5/week for 2 weeks |
| Compost | ⏳ not installed | always (weekly cron) | install when loop has been running ≥ 2 weeks |

---

## 1. Quorum

**Install when**: `STATE.md` shows ≥ 3 conductor wake-ups with `action: stop` (i.e. the conductor keeps deciding "nothing worth doing") in a 7-day window. The pattern means triage is finding actionables but the conductor is rejecting them — we need a second opinion from cheap models before paying for a Fable call.

**What gets installed**:
- `loop/quorum.sh` — bash that runs three cheap models on the same triage prompt and votes 2-of-3. Voters never see each other's answers.
- Wire into `loop/loop.sh` between `triage` and `conduct`: if quorum votes actionable, then `conduct` is invoked; otherwise quiet.

**Voter models** (cheapest available on the host):
- `deepseek/deepseek-v4-flash`
- `qwen/qwen-3.6`
- `moonshotai/kimi-k2.6`

**Sketch** (don't install yet):

```bash
#!/usr/bin/env bash
# loop/quorum.sh — 3 cheap voters, 2-of-3 must agree before Fable wakes
V=0
for m in deepseek/deepseek-v4-flash qwen/qwen-3.6 moonshotai/kimi-k2.6; do
  if MiniMax -m "$m" -s "$(cat triage.md)" < /tmp/signals.txt 2>/dev/null \
       | grep -q "status: actionable"; then
    V=$((V+1))
  fi
done
[ "$V" -ge 2 ] && exec ./conduct.sh || echo "quorum: quiet ($V/3)"
```

**Why wait**: a quorum is a tax. If the conductor rarely says `stop`, you're paying for 3 cheap calls + the conductor anyway — and the cheap calls have no shared context, so they re-derive facts each time. Only install when the signal shows the conductor is unreliable, not as a default.

---

## 2. Ratchet

**Install when**: there's a single number that's a meaningful proxy for project health, **and** it's currently not improving. Examples:
- `npm run lint 2>&1 | grep -c warning` > 0 and stable for 2 weeks
- `dist/_astro/*.css` size creeping up over 3 builds
- A specific route's LCP > 2.5s on Slow 4G

**What gets installed**:
- A `/goal` block with strict walls (number NEVER goes up; revert if it does)
- A standing goal (BUILD 5) that re-verifies the metric daily

**Sketch** (don't install yet — one per metric, on demand):

```markdown
/goal Reduce `npm run lint 2>&1 | grep -c warning` to 0.
Permissions: edit src/; commit per fix; re-measure after every change.
Walls: the number NEVER goes up; revert any change that raises it or breaks a
test; never edit lint config to lower it.
Timebox: stop after 3 attempts with no movement; report survivors.
```

**Why wait**: a ratchet without a real target becomes busywork. The metric must be:
- Cheap to measure (one command, sub-second)
- Deterministic (no flakes)
- Not gamable (editing the rule is the failure mode, not the fix)

If any of these is missing, fix the metric first, then install the ratchet.

---

## 3. Sparring

**Install when**: you ship code daily for a sustained week. The trigger pattern: ≥ 5 merges/week for 2 consecutive weeks. Below that cadence, the breaker produces noise without enough builder cycles to amortise it.

**What gets installed**:
- A pair of daily `/loop 1d` jobs (builder + breaker)
- A folder `tests/sparring/` where the breaker commits `@sparring`-tagged tests
- The breaker never edits builder's output; the builder never edits breaker's tests

**Sketch** (don't install yet):

```markdown
/loop 1d [breaker] Read yesterday's merged diffs. Write ONE failing test
exposing a real weakness. Commit under tests/sparring/ tagged @sparring.
Fix nothing. Solid code = say so, write nothing.
/loop 1d [builder] If any @sparring test fails, fix the CODE until it passes.
Never edit, weaken, or delete a sparring test; disputes queue for me.
```

**Why wait**: sparring without enough ship volume is theatre. The breaker test needs to land within 24h of the builder's cycle or it gets stale. If merges are sparse, the breaker writes a test that fails forever because the code path it targeted was already replaced by next week's work.

---

## 4. Compost

**Install when**: the loop has been running ≥ 2 weeks. Earlier than that and you don't have enough failure signal to extract patterns from.

**What gets installed**:
- A weekly `/loop 7d` cron that reads the week's exhaust and proposes ≤ 3 changes
- Output goes to a Markdown file under `loop/memory/compost/YYYY-Wnn.md`; human review required before any change lands

**Sketch** (don't install yet):

```markdown
/loop 7d Read this week's exhaust: FAILED in STATE.md, fails in trust.tsv,
FAILs in goal-ledger.tsv, PRs closed unmerged. Extract AT MOST 3 proposals:
a new CLAUDE.md law (quote incidents), a skill fix (same failure repeating),
or a standing goal we lacked. Propose only. Clean week = say so.
```

**Why wait**: compost without enough churn produces noise. The first 2 weeks of any new loop are full of one-off mistakes (path issues, wrong flags, missing dependencies) — turning those into laws would over-fit the system. Wait for the failure distribution to stabilise.

---

## Decision audit

When any of these triggers fire, the install is **a single commit** with:

1. The trigger evidence (commit SHA, ledger row, STATE.md excerpt).
2. The exact spec/sketch from this notes file, unchanged.
3. An entry in `loop/notes/install-history.md` with date + trigger + reviewer.

If the trigger is ambiguous (e.g. 2 `action: stop` in 7 days), do NOT install. Wait for the threshold to clear cleanly.