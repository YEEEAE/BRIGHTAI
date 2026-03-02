#!/usr/bin/env bash
set -euo pipefail

log() {
  printf '[pr-automerge] %s\n' "$*"
}

die() {
  printf '[pr-automerge] ERROR: %s\n' "$*" >&2
  exit 1
}

usage() {
  cat <<'USAGE'
Usage:
  scripts/pr-automerge.sh [options]

Options:
  -b, --branch <name>         Branch name to use/create (default: auto-generated codex/...)
  -m, --commit-message <msg>  Commit message (default: "chore: automated update")
  -t, --pr-title <title>      PR title (default: commit message)
  -d, --pr-body <body>        PR body (default: auto-generated)
  -B, --base <branch>         Base branch (default: main)
      --no-wait               Do not wait for checks before exit
      --no-merge              Do not merge PR automatically
  -h, --help                  Show help

What it does:
  1) Syncs local base branch.
  2) If you are on base branch and ahead with local commits, it creates rescue branch automatically.
  3) Stages and commits current changes (if any).
  4) Pushes branch and creates (or reuses) PR.
  5) Waits for all PR checks to be SUCCESS.
  6) Merges PR, syncs/pushes base branch, deletes temp local branch, and prunes remotes.
USAGE
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "Missing required command: $1"
}

cleanup_old_local_branches() {
  local base_branch="$1"
  local protected_branch="$2"
  local deleted=0
  local branch=""

  while IFS= read -r branch; do
    [[ -n "$branch" ]] || continue
    [[ "$branch" == "$base_branch" ]] && continue
    [[ "$branch" == "$protected_branch" ]] && continue
    [[ "$branch" == "master" ]] && continue

    # Keep cleanup conservative: remove only merged codex/* branches.
    if [[ "$branch" == codex/* ]]; then
      log "Cleaning old merged local branch: ${branch}"
      git branch -d "$branch" >/dev/null && deleted=$((deleted + 1))
    fi
  done < <(git for-each-ref --format='%(refname:short)' refs/heads)

  log "Old merged local branches cleaned: ${deleted}"
}

wait_for_all_checks_success() {
  local pr_number="$1"
  local max_attempts=90
  local attempt=1

  while [[ "$attempt" -le "$max_attempts" ]]; do
    local checks_json=""
    checks_json="$(gh pr view "$pr_number" --json statusCheckRollup --jq '.statusCheckRollup')"

    # Exclude synthetic/null entries from GitHub rollup.
    local total=0
    total="$(jq '[.[] | select(.name != null and .status != null)] | length' <<<"$checks_json")"
    if [[ "$total" -eq 0 ]]; then
      log "No checks reported yet for PR #${pr_number} (attempt ${attempt}/${max_attempts})"
      sleep 8
      attempt=$((attempt + 1))
      continue
    fi

    local completed=0
    local success=0
    local failed=0
    completed="$(jq '[.[] | select(.name != null and .status == "COMPLETED")] | length' <<<"$checks_json")"
    success="$(jq '[.[] | select(.name != null and .status == "COMPLETED" and .conclusion == "SUCCESS")] | length' <<<"$checks_json")"
    failed="$(jq '[.[] | select(.name != null and .status == "COMPLETED" and (.conclusion != "SUCCESS"))] | length' <<<"$checks_json")"

    if [[ "$failed" -gt 0 ]]; then
      log "At least one check failed for PR #${pr_number}:"
      gh pr view "$pr_number" --json statusCheckRollup --jq '.statusCheckRollup[] | select(.name != null and .status == "COMPLETED" and .conclusion != "SUCCESS") | "\(.name): \(.conclusion)"'
      return 1
    fi

    if [[ "$completed" -eq "$total" && "$success" -eq "$total" ]]; then
      log "All checks are SUCCESS for PR #${pr_number}"
      return 0
    fi

    log "Checks still running for PR #${pr_number} (${completed}/${total} completed, attempt ${attempt}/${max_attempts})"
    sleep 8
    attempt=$((attempt + 1))
  done

  log "Timed out waiting for checks on PR #${pr_number}"
  return 1
}

BASE_BRANCH="main"
BRANCH_NAME=""
COMMIT_MESSAGE="chore: automated update"
PR_TITLE=""
PR_BODY=""
WAIT_FOR_CHECKS=1
DO_MERGE=1
BRANCH_WAS_CREATED=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    -b|--branch)
      [[ $# -ge 2 ]] || die "Missing value for $1"
      BRANCH_NAME="$2"
      shift 2
      ;;
    -m|--commit-message)
      [[ $# -ge 2 ]] || die "Missing value for $1"
      COMMIT_MESSAGE="$2"
      shift 2
      ;;
    -t|--pr-title)
      [[ $# -ge 2 ]] || die "Missing value for $1"
      PR_TITLE="$2"
      shift 2
      ;;
    -d|--pr-body)
      [[ $# -ge 2 ]] || die "Missing value for $1"
      PR_BODY="$2"
      shift 2
      ;;
    -B|--base)
      [[ $# -ge 2 ]] || die "Missing value for $1"
      BASE_BRANCH="$2"
      shift 2
      ;;
    --no-wait)
      WAIT_FOR_CHECKS=0
      shift
      ;;
    --no-merge)
      DO_MERGE=0
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      die "Unknown argument: $1"
      ;;
  esac
done

require_cmd git
require_cmd gh
require_cmd jq

git rev-parse --is-inside-work-tree >/dev/null 2>&1 || die "Not inside a git repository"

git fetch origin

current_branch="$(git rev-parse --abbrev-ref HEAD)"

# Ensure base exists locally and is up to date.
log "Syncing base branch: ${BASE_BRANCH}"
git switch "$BASE_BRANCH" >/dev/null 2>&1 || die "Base branch '${BASE_BRANCH}' does not exist locally"
git pull --ff-only origin "$BASE_BRANCH" >/dev/null

# Return to original branch context if needed.
if [[ "$current_branch" != "$BASE_BRANCH" ]]; then
  git switch "$current_branch" >/dev/null
fi

branch_for_pr=""

ahead_on_base=0
if [[ "$current_branch" == "$BASE_BRANCH" ]]; then
  ahead_on_base="$(git rev-list --count "origin/${BASE_BRANCH}..${BASE_BRANCH}")"
fi

if [[ "$current_branch" == "$BASE_BRANCH" && "$ahead_on_base" -gt 0 ]]; then
  # Rescue accidental commits made on base branch.
  branch_for_pr="${BRANCH_NAME:-codex/rescue-$(date +%Y%m%d-%H%M%S)}"
  log "Detected ${ahead_on_base} local commit(s) on ${BASE_BRANCH}; creating rescue branch: ${branch_for_pr}"
  git switch -c "$branch_for_pr" >/dev/null
  BRANCH_WAS_CREATED=1
elif [[ "$current_branch" == "$BASE_BRANCH" ]]; then
  branch_for_pr="${BRANCH_NAME:-codex/update-$(date +%Y%m%d-%H%M%S)}"
  log "Creating feature branch from ${BASE_BRANCH}: ${branch_for_pr}"
  git switch -c "$branch_for_pr" >/dev/null
  BRANCH_WAS_CREATED=1
else
  branch_for_pr="$current_branch"
  log "Using current branch: ${branch_for_pr}"
fi

# Stage and commit if there are changes.
if [[ -n "$(git status --porcelain)" ]]; then
  log "Staging changes"
  git add -A
  if ! git diff --cached --quiet; then
    log "Committing changes"
    git commit -m "$COMMIT_MESSAGE"
  fi
else
  log "No working tree changes detected"
fi

# Ensure there is something to PR.
ahead_of_base="$(git rev-list --count "origin/${BASE_BRANCH}..${branch_for_pr}")"
[[ "$ahead_of_base" -gt 0 ]] || die "No commits to open PR. Branch '${branch_for_pr}' has no commits ahead of origin/${BASE_BRANCH}."

log "Pushing branch: ${branch_for_pr}"
git push -u origin "$branch_for_pr"

if [[ -z "$PR_TITLE" ]]; then
  PR_TITLE="$COMMIT_MESSAGE"
fi
if [[ -z "$PR_BODY" ]]; then
  PR_BODY="Automated PR created by scripts/pr-automerge.sh"
fi

# Reuse open PR if it exists.
pr_number="$(gh pr list --state open --base "$BASE_BRANCH" --head "$branch_for_pr" --json number --jq '.[0].number // empty')"

if [[ -z "$pr_number" ]]; then
  log "Creating PR into ${BASE_BRANCH}"
  pr_url="$(gh pr create --base "$BASE_BRANCH" --head "$branch_for_pr" --title "$PR_TITLE" --body "$PR_BODY")"
  pr_number="$(gh pr view --json number --jq .number "$pr_url")"
  log "Created PR #${pr_number}: ${pr_url}"
else
  pr_url="$(gh pr view "$pr_number" --json url --jq .url)"
  log "Using existing open PR #${pr_number}: ${pr_url}"
fi

if [[ "$WAIT_FOR_CHECKS" -eq 1 ]]; then
  log "Waiting for all PR checks to reach SUCCESS on PR #${pr_number}"
  wait_for_all_checks_success "$pr_number" || die "Checks did not reach SUCCESS for PR #${pr_number}"
fi

if [[ "$DO_MERGE" -eq 1 ]]; then
  log "Merging PR #${pr_number}"
  merged=0
  for attempt in {1..12}; do
    if gh pr merge "$pr_number" --merge --delete-branch; then
      merged=1
      break
    fi
    log "Merge attempt ${attempt}/12 did not complete yet; waiting 10s then retrying"
    sleep 10
  done
  [[ "$merged" -eq 1 ]] || die "Unable to merge PR #${pr_number} after multiple attempts"

  pr_state="$(gh pr view "$pr_number" --json state --jq .state)"
  [[ "$pr_state" == "MERGED" ]] || die "PR #${pr_number} is not merged (state: ${pr_state})"
fi

log "Switching back to ${BASE_BRANCH} and syncing"
git switch "$BASE_BRANCH" >/dev/null
git pull --ff-only origin "$BASE_BRANCH" >/dev/null
log "Pushing ${BASE_BRANCH} (no-op if already up to date)"
git push origin "$BASE_BRANCH" >/dev/null

if [[ "$BRANCH_WAS_CREATED" -eq 1 ]] && git show-ref --verify --quiet "refs/heads/${branch_for_pr}"; then
  log "Cleaning local branch: ${branch_for_pr}"
  git branch -D "$branch_for_pr" >/dev/null
fi

git fetch --prune origin >/dev/null
git remote prune origin >/dev/null || true
cleanup_old_local_branches "$BASE_BRANCH" "$branch_for_pr"

log "Done"
