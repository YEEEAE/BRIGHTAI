function srgbToLinear(v) {
  v = v / 255;
  return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}
function relativeLuminance(r, g, b) {
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}
function contrastRatio(l1, l2) {
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// --bg-base: #0a0e1a
const bgLum = relativeLuminance(0x0a, 0x0e, 0x1a);
console.log(`--bg-base (#0a0e1a) luminance: ${bgLum.toFixed(6)}`);

// Current --text-muted: #64748b
const currentLum = relativeLuminance(0x64, 0x74, 0x8b);
const currentCR = contrastRatio(currentLum, bgLum);
console.log(`Current --text-muted (#64748b) luminance: ${currentLum.toFixed(6)}, contrast: ${currentCR.toFixed(2)}:1 ${currentCR >= 4.5 ? '✅ AA' : '❌'}`);

// --bg-elevated: #151c30
const elevLum = relativeLuminance(0x15, 0x1c, 0x30);
const currentCRElev = contrastRatio(currentLum, elevLum);
console.log(`On --bg-elevated (#151c30): contrast: ${currentCRElev.toFixed(2)}:1 ${currentCRElev >= 4.5 ? '✅ AA' : '❌'}`);

// --bg-surface: #0f1525
const surfLum = relativeLuminance(0x0f, 0x15, 0x25);
const currentCRSurf = contrastRatio(currentLum, surfLum);
console.log(`On --bg-surface (#0f1525): contrast: ${currentCRSurf.toFixed(2)}:1 ${currentCRSurf >= 4.5 ? '✅ AA' : '❌'}`);

// Try values between slate-500 (#64748b) and slate-400 (#94a3b8)
const candidates = [
  '#6e7f99',
  '#7587a0',
  '#7789a3',
  '#7a8ba5',
  '#7c8aa8',
  '#7e8dab',
  '#808fae',
  '#8291b0',
];

console.log('\nCandidates:');
for (const hex of candidates) {
  const r = parseInt(hex.slice(1,3), 16);
  const g = parseInt(hex.slice(3,5), 16);
  const b = parseInt(hex.slice(5,7), 16);
  const lum = relativeLuminance(r, g, b);
  const cr = contrastRatio(lum, bgLum);
  const crElev = contrastRatio(lum, elevLum);
  console.log(`${hex} → CR on bg-base: ${cr.toFixed(2)}:1 ${cr >= 4.5 ? '✅ AA' : '❌'} | on bg-elevated: ${crElev.toFixed(2)}:1 ${crElev >= 4.5 ? '✅ AA' : '❌'}`);
}

// Also check --text-secondary and --text-primary for reference
const secondaryLum = relativeLuminance(0x94, 0xa3, 0xb8);
const secondaryCR = contrastRatio(secondaryLum, bgLum);
console.log(`\n--text-secondary (#94a3b8): ${secondaryCR.toFixed(2)}:1 ✅`);

const primaryLum = relativeLuminance(0xf1, 0xf5, 0xf9);
const primaryCR = contrastRatio(primaryLum, bgLum);
console.log(`--text-primary (#f1f5f9): ${primaryCR.toFixed(2)}:1 ✅`);
