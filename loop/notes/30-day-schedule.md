# 30-day trust schedule

> Do not skip graduations; each unlocks the next. The levels are earned,
> not declared.

## Week 1 — L1 report

**Level**: report

**You do**: Build 1–6; `make tick` by hand, daily; read every line of
every log. No cron. No auto-tier. The point of L1 is to learn what each
script *actually* prints in your environment, not what the spec says it
prints.

**Graduate when**: 3 consecutive ticks route exactly as you would have
routed them by hand. The test is whether your judgement matches the
loop's — not whether the loop is "right" in some abstract sense.

## Week 2 — L2 draft

**Level**: draft

**You do**: cron on; `make queue` with coffee; reviews feed the ledger.
Read `make trust`, `make audit`, `make goals` once a day. Skills reach
queue tier (≥ 10 runs).

Wire the cron (in user crontab, not the loop's):

```cron
0 7 * * 1-5  cd /Users/yzydalshmry/Desktop/BRIGHTAI && make tick >> loop/memory/cron.log 2>&1
30 7 * * *   cd /Users/yzydalshmry/Desktop/BRIGHTAI && make goals >> loop/memory/cron.log 2>&1
```

(Weekdays only for the tick; goals run daily. Adjust if your cadence differs.)

**Graduate when**: 2 skills cross 20 logged runs at ≥ 95% pass.

## Week 3 — L3 ship

**Level**: ship

**You do**: `make audit` against the formula ($0.86/tick at full pipeline);
the best-performing skill goes unattended (auto tier); you stop opening
`STATE.md` every day and only check it when something paged you.

**Graduate when**: 1 week with zero interventions. No ALERTs, no VIOLATED
goals, no exit-2s, no FAILED items in `STATE.md`. Not "I happened to
look and saw clean" — actually zero pages.

## Week 4 — L4 grow

**Level**: grow

**You do**: install `Compost` (the trigger is now satisfied); approve 1
proposed skill per week; run the delete pass — retire goals/skills that
have not been touched in 30 days.

**Graduate when**: you removed something and nothing broke. This is the
hardest graduation; the system's first instinct is to add, not to
delete. If you can retire a goal cleanly, the loop is mature.

## After L4

The loop becomes infrastructure. You stop running it by hand. The
weekly checks reduce to:

- `make audit` — confirm spend is on the curve.
- `make trust` — confirm no skill is silently demoted.
- `make queue` — confirm nothing is stuck.

Compost signs off on the system's own next improvement. The closing line
of the BUILD 8 spec holds: the model was never the hard part; building
something around it that stays honest when you stop watching was.