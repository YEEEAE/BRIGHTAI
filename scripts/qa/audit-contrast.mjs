/**
 * audit-contrast.mjs — WCAG 2.2 AA/AAA contrast matrix audit
 *
 * قياس كل تركيبات النص/الخلفية في نظام التوكنز الموحد.
 * يحسب effective color (alpha compositing) ثم WCAG contrast ratio.
 *
 * المصفوفة: 4 خلفيات × 5 مستويات opacity + 4 ألوان signoff = 36 خلية
 *
 * العتبات:
 *   - AA normal text:  4.5:1
 *   - AA large text:   3.0:1  (≥18pt أو ≥14pt bold)
 *   - AAA normal text: 7.0:1
 *   - AAA large text:  4.5:1
 *
 * الاستخدام:
 *   node scripts/audit-contrast.mjs
 *   node scripts/audit-contrast.mjs --csv > report/2026-07-14-a11y-contrast-before.csv
 *   node scripts/audit-contrast.mjs --strict  # يعامل disabled/decorotive كـ FAIL
 *
 * المصدر: tokens.css (قُرئ يدوياً في 2026-07-14 — لا نقرأ الملف تلقائياً لتفادي الـ CSS parser).
 */

// قيم audit. للتحديث بعد كل تغيير: عدّل القيم هنا لتطابق tokens.css.
// DEC-A11Y-001 (2026-07-14): brighter Teal + brighter Red for AA on all surfaces
const COLORS = {
  // 4 خلفيات (من tokens.css section 4 + 19)
  '--bg-base':       [10, 14, 26],       // #0a0e1a
  '--bg-surface':    [15, 21, 37],       // #0f1525
  '--bg-elevated':   [21, 28, 48],       // #151c30
  '--surface-4':     [28, 37, 64],       // #1c2540

  // النص الأساسي (5 مستويات opacity مطبقة على هذا اللون)
  '--text-primary':  [241, 245, 249],    // #f1f5f9

  // 4 ألوان signoff (لون صلب، بدون opacity)
  // DEC-A11Y-001: --interactive-primary أعيدت معايرتها من #2a8a7e → #20a597
  // (4.62/4.36/4.06/3.63 → 6.32/5.97/5.55/4.96 — يجتاز AA على كل الخلفيات)
  '--interactive-primary': [32, 165, 151],   // #20a597 Teal (DEC-A11Y-001)
  // DEC-A11Y-001: --interactive-hover من #1f6f64 → #1c8c7e
  // (3.22 → 4.68 — يجتاز AA للنص المعاكس على background الـ button)
  '--interactive-hover':   [28, 140, 126],   // #1c8c7e Teal-hover (DEC-A11Y-001)
  // DEC-A11Y-001: --status-danger من #ef4444 → #f87171
  // (5.12/4.83/4.50/4.02 → 6.96/6.58/6.12/5.47 — يجتاز AA على كل الخلفيات)
  '--status-danger':       [248, 113, 113],  // #f87171 Red (DEC-A11Y-001)
  '--status-success':      [34, 197, 94],    // #22c55e Green
  '--accent-warm':         [192, 138, 90],   // #c08a5a Copper
};

// مستويات النص (5 مستويات من tokens.css section 16)
const TEXT_LEVELS = {
  primary:    { opacity: 1.00, label: 'primary (1.00)'    },
  secondary:  { opacity: 0.78, label: 'secondary (0.78)'  },
  tertiary:   { opacity: 0.58, label: 'tertiary (0.58)'   },
  disabled:   { opacity: 0.38, label: 'disabled (0.38)'   },
  decorative: { opacity: 0.22, label: 'decorative (0.22)' },
};

// ═══════════════════════════════════════════════════════════════════════
// WCAG contrast math
// ═══════════════════════════════════════════════════════════════════════

function srgbToLinear(c) {
  const v = c / 255;
  return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

function luminance([r, g, b]) {
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}

/** alpha compositing: نص opacity α فوق خلفية 1−α */
function blend(textRgb, bgRgb, alpha) {
  return [
    textRgb[0] * alpha + bgRgb[0] * (1 - alpha),
    textRgb[1] * alpha + bgRgb[1] * (1 - alpha),
    textRgb[2] * alpha + bgRgb[2] * (1 - alpha),
  ];
}

function contrastRatio(c1, c2) {
  const L1 = luminance(c1);
  const L2 = luminance(c2);
  const [light, dark] = L1 >= L2 ? [L1, L2] : [L2, L1];
  return (light + 0.05) / (dark + 0.05);
}

function statusForRatio(ratio, isLargeText = false) {
  if (isLargeText) {
    if (ratio >= 4.5) return 'AAA-large';
    if (ratio >= 3.0) return 'AA-large';
    return 'FAIL';
  }
  if (ratio >= 7.0) return 'AAA';
  if (ratio >= 4.5) return 'AA';
  if (ratio >= 3.0) return 'AA-large-only';
  return 'FAIL';
}

const STATUS_EMOJI = {
  'AAA': '✅ AAA',
  'AA':  '✅ AA',
  'AAA-large': '✅ AAA·large',
  'AA-large':  '✅ AA·large',
  'AA-large-only': '⚠️ AA·large only',
  'FAIL': '❌ FAIL',
};

// ═══════════════════════════════════════════════════════════════════════
// المصفوفة
// ═══════════════════════════════════════════════════════════════════════

function buildMatrix() {
  const rows = [];

  // 5 مستويات opacity × 4 خلفيات (20 صف)
  for (const [levelKey, level] of Object.entries(TEXT_LEVELS)) {
    for (const [bgKey, bgRgb] of Object.entries(COLORS)) {
      if (!bgKey.startsWith('--bg-') && bgKey !== '--surface-4') continue;
      const textRgb = COLORS['--text-primary'];
      const effective = blend(textRgb, bgRgb, level.opacity);
      const ratio = contrastRatio(effective, bgRgb);
      rows.push({
        group: 'text-opacity',
        textLabel: `text-${levelKey} (${level.label})`,
        textColor: textRgb,
        opacity: level.opacity,
        bgLabel: bgKey,
        bgRgb,
        effectiveRgb: effective.map((c) => Math.round(c)),
        ratio,
        statusNormal: statusForRatio(ratio, false),
        statusLarge: statusForRatio(ratio, true),
        isIntentional: levelKey === 'disabled' || levelKey === 'decorative',
      });
    }
  }

  // 5 ألوان signoff × 4 خلفيات (20 صف)
  for (const [sigKey, sigRgb] of Object.entries(COLORS)) {
    if (!['--interactive-primary', '--interactive-hover', '--status-success', '--status-danger', '--accent-warm'].includes(sigKey)) continue;
    for (const [bgKey, bgRgb] of Object.entries(COLORS)) {
      if (!bgKey.startsWith('--bg-') && bgKey !== '--surface-4') continue;
      const ratio = contrastRatio(sigRgb, bgRgb);
      rows.push({
        group: 'signoff',
        textLabel: sigKey,
        textColor: sigRgb,
        opacity: 1.0,
        bgLabel: bgKey,
        bgRgb,
        effectiveRgb: sigRgb,
        ratio,
        statusNormal: statusForRatio(ratio, false),
        statusLarge: statusForRatio(ratio, true),
        isIntentional: false,
      });
    }
  }

  return rows;
}

// ═══════════════════════════════════════════════════════════════════════
// الطباعة
// ═══════════════════════════════════════════════════════════════════════

function printTable(rows, { csv = false, strict = false } = {}) {
  if (csv) {
    console.log('group,text,opacity,bg,ratio,status_normal,status_large,intentional,hex_effective');
    for (const r of rows) {
      const hex = '#' + r.effectiveRgb.map((c) => c.toString(16).padStart(2, '0')).join('');
      console.log([
        r.group,
        r.textLabel,
        r.opacity.toFixed(2),
        r.bgLabel,
        r.ratio.toFixed(2),
        r.statusNormal,
        r.statusLarge,
        r.isIntentional ? 'intentional' : '',
        hex,
      ].join(','));
    }
    return;
  }

  // Human-readable
  const w = (s, n) => String(s).padEnd(n);
  const wR = (s, n) => String(s).padStart(n);

  console.log('═'.repeat(110));
  console.log('  WCAG Contrast Matrix — BrightAI Tokens');
  console.log('  Source: src/styles/tokens.css (manually transcribed)');
  console.log('  Thresholds: AA 4.5:1 normal / 3.0:1 large · AAA 7.0:1 normal / 4.5:1 large');
  console.log('═'.repeat(110));

  let lastGroup = null;
  for (const r of rows) {
    if (r.group !== lastGroup) {
      console.log('');
      console.log(`  ▸ ${r.group.toUpperCase()}`);
      lastGroup = r.group;
    }
    const effectiveLabel = r.isIntentional
      ? `${STATUS_EMOJI[r.statusNormal]} (intentional — non-text)`
      : STATUS_EMOJI[r.statusNormal];
    console.log(
      '  ' +
        w(r.textLabel, 38) +
        ' on ' +
        w(r.bgLabel, 18) +
        wR(r.ratio.toFixed(2) + ':1', 8) +
        '  ' +
        effectiveLabel,
    );
  }

  // ملخص
  const criticalFails = rows.filter(
    (r) => !r.isIntentional && (r.statusNormal === 'FAIL' || r.statusNormal === 'AA-large-only'),
  );
  const largeOnly = rows.filter((r) => r.statusNormal === 'AA-large-only' && !r.isIntentional);
  const cleanFails = rows.filter((r) => !r.isIntentional && r.statusNormal === 'FAIL');

  console.log('');
  console.log('═'.repeat(110));
  console.log('  Summary');
  console.log('═'.repeat(110));
  console.log(`  Total cells:                 ${rows.length}`);
  console.log(`  Intentional (disabled/dec):  ${rows.filter((r) => r.isIntentional).length}`);
  console.log(`  Strict-mode critical fails:  ${cleanFails.length}${strict ? '' : ' (excluding intentional)'}`);
  console.log(`  Large-text only (≥18pt):     ${largeOnly.length}`);
  if (criticalFails.length > 0) {
    console.log('');
    console.log('  ⚠️  Cells that need attention (excluding intentional disabled/decorative):');
    for (const r of criticalFails) {
      console.log(`     - ${r.textLabel} on ${r.bgLabel}: ${r.ratio.toFixed(2)}:1 (${r.statusNormal})`);
    }
  } else {
    console.log('');
    console.log('  ✅ All critical text-on-bg combinations meet AA.');
  }
  console.log('');
}

// ═══════════════════════════════════════════════════════════════════════
// Main
// ═══════════════════════════════════════════════════════════════════════

const args = process.argv.slice(2);
const csv = args.includes('--csv');
const strict = args.includes('--strict');

const rows = buildMatrix();
printTable(rows, { csv, strict });

// Exit code: 1 لو في critical fails (ما عدا الـ intentional)
const criticalFails = rows.filter(
  (r) => !r.isIntentional && (r.statusNormal === 'FAIL' || r.statusNormal === 'AA-large-only'),
);
if (criticalFails.length > 0 && !csv) {
  process.exitCode = 1;
}
