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
  5) Waits for required checks.
  6) Merges PR and returns local repo to updated base branch.
USAGE
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "Missing required command: $1"
}

BASE_BRANCH="main"
BRANCH_NAME=""
COMMIT_MESSAGE="chore: automated update"
PR_TITLE=""
PR_BODY=""
WAIT_FOR_CHECKS=1
DO_MERGE=1

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
elif [[ "$current_branch" == "$BASE_BRANCH" ]]; then
  branch_for_pr="${BRANCH_NAME:-codex/update-$(date +%Y%m%d-%H%M%S)}"
  log "Creating feature branch from ${BASE_BRANCH}: ${branch_for_pr}"
  git switch -c "$branch_for_pr" >/dev/null
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
  log "Waiting for required checks on PR #${pr_number}"
  gh pr checks "$pr_number" --watch --required
  log "Required checks passed"
fi

if [[ "$DO_MERGE" -eq 1 ]]; then
  log "Merging PR #${pr_number}"
  gh pr merge "$pr_number" --merge --delete-branch
fi

log "Switching back to ${BASE_BRANCH} and syncing"
git switch "$BASE_BRANCH" >/dev/null
git pull --ff-only origin "$BASE_BRANCH" >/dev/null
git fetch --prune origin >/dev/null

log "Done"
