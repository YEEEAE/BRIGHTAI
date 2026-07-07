#!/usr/bin/env bash
# Audit skills for forbidden phrases that trigger reasoning_extraction
# Run from repo root: ./loop/scripts/audit-skills.sh

set -euo pipefail

PATTERNS=(
  "show your thinking"
  "show your reasoning"
  "explain your reasoning in the response"
  "explain your thinking"
  "describe your thought process"
  "walk me through your thinking"
  "let's think step by step"
  "let me think"
  "think step by step"
)

FOUND=0
for f in $(find . -type f \( -name "*.md" -o -name "*.txt" -o -name "*.prompt" \) \
           -not -path "./node_modules/*" -not -path "./.git/*" \
           -not -path "./loop/prompts/_official/*"); do
  for p in "${PATTERNS[@]}"; do
    if grep -qiF "$p" "$f" 2>/dev/null; then
      echo "FORBIDDEN in $f: \"$p\""
      FOUND=$((FOUND+1))
    fi
  done
done

[ "$FOUND" -gt 0 ] && {
  echo ""
  echo "❌ $FOUND forbidden phrase(s) found."
  echo "These will trigger reasoning_extraction refusals."
  echo "Fix them before continuing to BUILD 1."
  exit 1
}

echo "✅ No forbidden phrases in any skill."