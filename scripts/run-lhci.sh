#!/bin/bash
# ═══════════════════════════════════════════════════════════
# run-lhci.sh — تشغيل Lighthouse CI على dist/client
# ═══════════════════════════════════════════════════════════
# الاستخدام:
#   ./scripts/run-lhci.sh                  # تشغيل collect فقط
#   ./scripts/run-lhci.sh --all            # collect + assert + upload
#   ./scripts/run-lhci.sh --assert         # assert فقط (بعد collect)
#   ./scripts/run-lhci.sh --psi            # PSI فقط (field data)
# ═══════════════════════════════════════════════════════════

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

REPORT_DIR="./reports/lighthouse"
mkdir -p "$REPORT_DIR"

echo "════════════════════════════════════════════"
echo "  BrightAI — Lighthouse CI Lab Runner"
echo "  التأكيد: dist/client فقط، مو نقطة"
echo "════════════════════════════════════════════"

# التحقق من وجود dist/client
if [ ! -d "dist/client" ]; then
  echo "❌ dist/client غير موجود. شغّل npm run build أول."
  exit 1
fi

# التحقق من وجود .lighthouserc.json
if [ ! -f ".lighthouserc.json" ]; then
  echo "❌ .lighthouserc.json غير موجود."
  exit 1
fi

echo ""
echo "📂 staticDistDir = ./dist/client ✅"
echo ""

case "${1:-collect}" in
  --all)
    echo "🔬 1/3: Collecting lab measurements..."
    npx @lhci/cli collect --config=.lighthouserc.json 2>&1 | tee "$REPORT_DIR/collect.log"
    echo ""
    echo "✅ 2/3: Asserting budgets..."
    npx @lhci/cli assert --config=.lighthouserc.json 2>&1 | tee "$REPORT_DIR/assert.log"
    echo ""
    echo "📤 3/3: Uploading reports..."
    npx @lhci/cli upload --config=.lighthouserc.json 2>&1 | tee "$REPORT_DIR/upload.log"
    ;;
  --assert)
    echo "✅ Running asserts..."
    npx @lhci/cli assert --config=.lighthouserc.json 2>&1 | tee "$REPORT_DIR/assert.log"
    ;;
  --psi)
    echo "🌐 Running PSI collect (field data)..."
    npx @lhci/cli collect --config=.lighthouserc.json --psiCollect 2>&1 | tee "$REPORT_DIR/psi-collect.log"
    ;;
  --upload)
    echo "📤 Uploading reports..."
    npx @lhci/cli upload --config=.lighthouserc.json 2>&1 | tee "$REPORT_DIR/upload.log"
    ;;
  *)
    echo "🔬 Collecting lab measurements..."
    npx @lhci/cli collect --config=.lighthouserc.json 2>&1 | tee "$REPORT_DIR/collect.log"
    ;;
esac

echo ""
echo "════════════════════════════════════════════"
echo "  ✅ تم. التقارير في $REPORT_DIR"
echo "════════════════════════════════════════════"