// verify-badge-contrast.mjs — WCAG 2.2 AA contrast guard for badge colors.
//
// Audits every text-on-background pair used by the status/priority pills
// (src/lib/format.ts STATUS_BADGE / PRIORITY_BADGE + fallbacks) and the
// notification pills in src/components/Navbar.tsx (bell count + unread chip).
//
// Badge text is text-xs (12px, medium weight) → "normal" text → requires 4.5:1.
// No badge uses large text (≥ 18.66px bold), so the 3:1 large-text branch is
// not exercised today, but the check implements both thresholds by size.
//
// Keep the PAIRS table in sync with the class strings in the two components —
// a mismatch fails loudly here, which is the point (guard against regression).
//
// Usage: node scripts/verify-badge-contrast.mjs

const NORMAL = 4.5; // WCAG AA — normal text
const LARGE = 3.0; // WCAG AA — large text (≥18.66px bold / ≥24px)

// [label, fg, bg, sizePx, weight]
const PAIRS = [
  // ── src/lib/format.ts STATUS_BADGE (text-xs font-medium = 12px normal) ──
  ['status not_started', '#b91c1c', '#fef2f2', 12, 500], // bg-red-50 text-red-700
  ['status in_progress', '#b45309', '#fffbeb', 12, 500], // bg-amber-50 text-amber-700
  ['status on_hold', '#c2410c', '#fff7ed', 12, 500], // bg-orange-50 text-orange-700
  ['status completed', '#047857', '#ecfdf5', 12, 500], // bg-emerald-50 text-emerald-700
  ['status cancelled', '#475569', '#f1f5f9', 12, 500], // bg-slate-100 text-slate-600
  // ── src/lib/format.ts PRIORITY_BADGE ──
  ['priority low', '#0369a1', '#f0f9ff', 12, 500], // bg-sky-50 text-sky-700
  ['priority medium', '#4338ca', '#eef2ff', 12, 500], // bg-indigo-50 text-indigo-700
  ['priority high', '#be123c', '#fff1f2', 12, 500], // bg-rose-50 text-rose-700
  ['priority urgent', '#ffffff', '#dc2626', 12, 500], // bg-red-600 text-white (solid pill)
  // ── src/lib/format.ts fallback pill ──
  ['badge fallback', '#475569', '#f1f5f9', 12, 500], // bg-slate-100 text-slate-600
  // ── src/components/Navbar.tsx (fixed 2026-08-14 for WCAG AA) ──
  ['navbar bell count', '#ffffff', '#dc2626', 10, 600], // bg-red-600 text-white (was red-500 3.76:1)
  ['navbar unread chip', '#b91c1c', '#fef2f2', 12, 500], // bg-red-50 text-red-700 (was red-600 4.41:1)
  ['navbar role chip', '#475569', '#f1f5f9', 12, 500], // bg-slate-100 text-slate-600 (was slate-500 4.34:1)
];

function luminance(hex) {
  const c = hex
    .slice(1)
    .match(/../g)
    .map((h) => parseInt(h, 16) / 255);
  const lin = c.map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
}

function ratio(fg, bg) {
  const [l1, l2] = [luminance(fg), luminance(bg)].sort((a, b) => b - a);
  return (l1 + 0.05) / (l2 + 0.05);
}

/** WCAG large-text test: ≥18.66px bold or ≥24px regular. */
function isLargeText(sizePx, weight) {
  return (sizePx >= 24) || (sizePx >= 18.66 && weight >= 700);
}

let failed = 0;
console.log('Badge contrast audit (WCAG 2.2 AA):');
for (const [label, fg, bg, size, weight] of PAIRS) {
  const r = ratio(fg, bg);
  const threshold = isLargeText(size, weight) ? LARGE : NORMAL;
  const pass = r >= threshold;
  console.log(
    `  ${pass ? '✅' : '❌'} ${label.padEnd(24)} ${fg} on ${bg} → ${r.toFixed(2)}:1 (needs ${threshold}:1${isLargeText(size, weight) ? ', large text' : ''})`,
  );
  if (!pass) failed += 1;
}

if (failed > 0) {
  console.error(`\n❌ ${failed} badge pair(s) below the WCAG AA threshold.`);
  process.exit(1);
}
console.log('\n✅ All badge pairs meet WCAG 2.2 AA contrast.');
