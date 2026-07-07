# Contract — what the loop does and does not do

The loop classifies every action into one of three buckets. Nothing else.

## acts-alone

The loop closes the loop on these without waking the user. Trust is per-skill,
gated by `loop/scripts/trust-log.sh` (auto tier only).

- quiet ticks (no findings)
- logging row writes (cost, trust, goals ledger)
- worktree cleanup (`make clean-worktrees`)
- file edits that satisfy an auto-tier skill's done_when

## queues

The loop prepares and waits. These land in `loop/memory/STATE.md` as
`review:` / `queued:` lines, surfaced by `make queue`.

- queue-tier skill outputs (verified draft, waiting for human push)
- contract-sensitive changes (auth, billing, schema, layouts, RTL,
  canonical, hreflang, fonts — see `loop/conductor.md`)
- ambiguous work orders (likely >400-line diff, unclear scope)
- any new dependency proposal

## wakes-me

The loop never touches these; it pages the user and stops.

- merged-to-main with a VIOLATED goal (sentinel reports)
- ALERT: a watched skill demoted (cron mails stderr)
- exit 3 (budget breach) — unless budget is raised, no further ticks
- exit 2 (refusal) recurring on the same skill — pattern, not noise
- maker/checker standoff unresolved after one round

## The seam

Every script in `loop/` is on one side of this seam. The conductor decides
which bucket; nothing else does. If a script wants to escalate, it appends
to `loop/memory/STATE.md`. If a script wants to act, it must already be
trusted (`auto` tier in `loop/memory/trust.tsv`).

Default disposition when unsure: **queues**. The cost of a needless
human review is a notification; the cost of an unsolicited autonomous
action is the user's trust. Pick the cheap failure mode.