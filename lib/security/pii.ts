const PII_PATTERNS = [
  /\b(?:1|2)\d{9}\b/u,
  /\b(?:4\d{3}|5[1-5]\d{2}|3[47]\d{2}|6(?:011|5\d{2}))[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/u,
  /\b05\d{8}\b/u,
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/iu
];

export function containsSensitivePII(value: string): boolean {
  return PII_PATTERNS.some((pattern) => pattern.test(value));
}

export function sanitizeText(value: string): string {
  return value
    .replace(/[<>]/g, "")
    .replace(/\u0000/g, "")
    .trim()
    .slice(0, 12000);
}
