#!/usr/bin/env bash
# seo-hreflang-dirs.sh
# ينشئ هياكل مجلدات للصفحات الإنجليزية في sectors و docs
# حتى تعمل الـ canonical URLs النظيفة (بدون .html) على Render
# كل مجلد يحتوي index.html كنسخة من الملف الأصلي

set -euo pipefail

PAIRS=(
  "sectors/ecommerce-en.html:sectors/ecommerce-en"
  "sectors/energy-en.html:sectors/energy-en"
  "sectors/finance-en.html:sectors/finance-en"
  "sectors/healthcare-en.html:sectors/healthcare-en"
  "sectors/logistics-en.html:sectors/logistics-en"
  "sectors/manufacturing-en.html:sectors/manufacturing-en"
  "docs/privacy-policy-en.html:docs/privacy-policy-en"
)

for PAIR in "${PAIRS[@]}"; do
  SRC="${PAIR%%:*}"
  DST="${PAIR##*:}"
  if [ -f "$SRC" ]; then
    mkdir -p "$DST"
    cp "$SRC" "$DST/index.html"
    echo "✓ $DST/index.html"
  else
    echo "✗ $SRC not found — skipping"
  fi
done
