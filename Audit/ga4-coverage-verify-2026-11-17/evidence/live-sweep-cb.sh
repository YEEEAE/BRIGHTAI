#!/usr/bin/env bash
# Live HTML sweep: no JavaScript executes, so no GA4 hits are sent by this sweep.
set -u
OUT="$(dirname "$0")/live-html-sweep-cb.csv"
SITEMAP="$(dirname "$0")/live-sitemap-now.xml"
echo "url,status,final_url,measurement_ids,loader_count,config_count,snippet_version,bytes" > "$OUT"
grep -o '<loc>[^<]*</loc>' "$SITEMAP" | sed 's/<[^>]*>//g' | sort -u | while read -r url; do
  body=$(mktemp)
  meta=$(curl -sL --max-time 25 -o "$body" -w "%{http_code}|%{url_effective}|%{size_download}" "$url?cb=$(date +%s)")
  status=${meta%%|*}; rest=${meta#*|}; final=${rest%%|*}; bytes=${rest##*|}
  ids=$(grep -o 'G-[A-Z0-9]\{8,12\}' "$body" | sort -u | tr '\n' ';' | sed 's/;$//')
  loaders=$(grep -c 'googletagmanager.com/gtag/js' "$body" || true)
  configs=$(grep -o "gtag('config'" "$body" | wc -l | tr -d ' ')
  ver="NONE"
  if grep -q '__brightaiGa4Initialized' "$body"; then ver="NEW_GUARDED"
  elif grep -q 'analyticsQueryAllowlist' "$body"; then ver="ALLOWLIST"
  elif grep -q 'brightai-analytics-path' "$body"; then ver="STRICT_DRAFT"
  elif grep -q 'gtag' "$body"; then ver="OTHER_GTAG"
  fi
  echo "\"$url\",$status,\"$final\",\"$ids\",$loaders,$configs,$ver,$bytes" >> "$OUT"
  rm -f "$body"
done
echo "DONE rows=$(( $(wc -l < "$OUT") - 1 ))"