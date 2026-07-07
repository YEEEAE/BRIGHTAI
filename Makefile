# BRIGHTAI — ops entry points
#
# The loop is at ./loop/. Use these targets for daily operation:
#
#   make tick       — run one heartbeat (triage → conduct → execute → verify)
#   make queue      — list items waiting on human review
#   make trust      — render the trust ledger (auto/queue/watch per skill)
#   make audit      — render the 7-day cost report (per role, in $)
#   make goals      — re-verify every standing goal against its predicate
#   make clean-worktrees   — prune stale worktrees from prior loop runs
#
# On install: targets that touch the running loop (tick, goals) refuse to run
# if no model bridge is configured. Set MINIMAX_BRIDGE before invoking them.

.PHONY: tick queue trust audit goals clean-worktrees help

tick:            ; @./loop/loop.sh
queue:           ; @grep -E "review:|queued:|FAILED:|rerouted" loop/memory/STATE.md || echo empty
trust:           ; @./loop/scripts/trust-log.sh --render
audit:           ; @./loop/scripts/cost-check.sh --report
goals:           ; @./loop/verify-goals.sh
clean-worktrees: ; @git worktree list | awk '/wt-/{print $$1}' | xargs -rn1 git worktree remove --force

help:
	@echo "make tick              — run one heartbeat"
	@echo "make queue             — list items waiting on human review"
	@echo "make trust             — render trust ledger (per-skill tier)"
	@echo "make audit             — render 7-day cost report (per role)"
	@echo "make goals             — re-verify every standing goal"
	@echo "make clean-worktrees   — prune stale wt-* worktrees"