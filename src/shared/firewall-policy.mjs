// Browser-safe, deterministic policy. Bump the version when matcher behavior changes.
export const policyVersion = 'firewall-v3';
export const actionRank = Object.freeze({ DENY: 0, ESCALATE: 1, REDACT: 2, WARN: 3, ALLOW: 4 });

/** @typedef {'DENY' | 'ESCALATE' | 'REDACT' | 'WARN' | 'ALLOW'} Action */
/** @typedef {{id: string, name: string, action: Action, version: number, candidate: RegExp, validate?: (value: string) => boolean}} Matcher */

function normalize(text) {
  let value = '';
  const starts = [], ends = [];
  let offset = 0;
  for (const character of text) {
    const folded = character.normalize('NFKC')
      .replace(/[\u061c\u0640\u064b-\u065f\u0670\u200b-\u200f\u202a-\u202e\u2060\u2066-\u2069\ufeff]/gu, '')
      .replace(/[٠-٩۰-۹]/gu, digit => String(digit.charCodeAt(0) & 15));
    for (let index = 0; index < folded.length; index++) {
      starts.push(offset);
      ends.push(offset + character.length);
    }
    value += folded;
    offset += character.length;
  }
  return { value, starts, ends };
}

function validIdentity(value) {
  const digits = value.replace(/ /g, '');
  let sum = 0;
  for (let index = 0; index < digits.length; index++) {
    const digit = Number(digits[index]) * (index % 2 === 0 ? 2 : 1);
    sum += digit > 9 ? digit - 9 : digit;
  }
  return sum % 10 === 0;
}

function validIban(value) {
  const compact = value.replace(/ /g, '').toUpperCase();
  let remainder = 0;
  for (const character of compact.slice(4) + compact.slice(0, 4)) {
    const letter = character >= 'A';
    remainder = (remainder * (letter ? 100 : 10) + (letter ? character.charCodeAt(0) - 55 : Number(character))) % 97;
  }
  return remainder === 1;
}

function validEmail(value) {
  const local = value.split('@')[0];
  return local.length <= 64 && !local.startsWith('.') && !local.endsWith('.') && !local.includes('..');
}

/** @type {Matcher[]} */
const catalog = [
  { id: 'injection-ar', name: 'تعليمات تجاوز السياسة بالعربية', action: 'DENY',
    candidate: /(?:تجاهل|تخط[ّىي]|تجاوز|أهمل)\s+(?:جميع\s+)?(?:ال(?:تعليمات|سياسة|قيود)|قيد\s+السياسة)(?:\s+السابقة)?/giu },
  { id: 'injection-en', name: 'تعليمات تجاوز السياسة بالإنجليزية', action: 'DENY',
    candidate: /\b(?:ignore|disregard|override|bypass)\s+(?:(?:all|the|previous|prior|system)\s+){0,4}(?:instructions?|rules?|polic(?:y|ies)|safeguards?)\b/giu },
  { id: 'external-publication', name: 'مشاركة خارج المؤسسة', action: 'ESCALATE',
    candidate: /(?:انشر|أرسل|شارك)[^.!؟\n]{0,70}خارج\s+المؤسسة|\b(?:publish|share|send)\b[^.!?\n]{0,70}\b(?:externally|outside the organi[sz]ation)\b/giu },
  { id: 'credential', name: 'سر أو بيانات اعتماد', action: 'REDACT',
    candidate: /(?:\b(?:api[_ -]?key|access[_ -]?token|secret|password)\b|كلمة\s+المرور|مفتاح\s+الواجهة)\s*[:=]\s*(?:"[^"\r\n]*(?:"|(?=\r?$))|'[^'\r\n]*(?:'|(?=\r?$))|[^\s,;،]+)|\bbearer\s+[a-z0-9._~+/=-]{8,}|-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----|\b(?:sk-[a-z0-9_-]{16,}|ghp_[a-z0-9]{16,}|AKIA[A-Z0-9]{16})\b/gimu },
  { id: 'sa-national-id', name: 'صيغة الهوية السعودية واجتياز خانة التحقق', action: 'REDACT',
    candidate: /(?<![\p{L}\p{N}])1(?: ?[0-9]){9}(?![\p{L}\p{N}])/gu, validate: validIdentity },
  { id: 'sa-iqama', name: 'صيغة الإقامة واجتياز خانة التحقق', action: 'REDACT',
    candidate: /(?<![\p{L}\p{N}])2(?: ?[0-9]){9}(?![\p{L}\p{N}])/gu, validate: validIdentity },
  { id: 'sa-iban', name: 'صيغة IBAN السعودية واجتياز MOD 97', action: 'REDACT',
    candidate: /(?<![\p{L}\p{N}])SA(?: ?[0-9]){4}(?: ?[A-Z0-9]){18}(?![\p{L}\p{N}])/giu, validate: validIban },
  { id: 'email', name: 'صيغة بريد إلكتروني', action: 'REDACT',
    candidate: /(?<![a-z0-9._%+@-])[a-z0-9._%+-]{1,64}@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*\.[a-z]{2,63}(?![a-z0-9@_-])/giu, validate: validEmail },
  { id: 'sa-mobile', name: 'صيغة جوال سعودي', action: 'REDACT',
    candidate: /(?<![\p{L}\p{N}+])(?:\+966[ -]?|00966[ -]?|0)5(?:[ -]?[0-9]){8}(?![\p{L}\p{N}])/gu },
  { id: 'synthetic-id', name: 'معرّف المثال الاصطناعي', action: 'REDACT', candidate: /\bDEMO-0000\b/giu },
  { id: 'unreviewed-use', name: 'اعتماد المخرج دون مراجعة', action: 'WARN',
    candidate: /(?:دون|بدون)\s+مراجعة|\bwithout\s+(?:a\s+)?review\b/giu },
].map(rule => Object.freeze({ ...rule, version: 1 }));

export const matcherNotes = Object.freeze(catalog.map(({id, name, action, version}) => Object.freeze({id, name, action, version})));

export function scanTyped(text) {
  const { value, starts, ends } = normalize(text);
  return catalog.flatMap(rule => {
    const spans = [];
    for (const match of value.matchAll(rule.candidate)) {
      if (!rule.validate || rule.validate(match[0])) {
        spans.push([starts[match.index], ends[match.index + match[0].length - 1]]);
      }
    }
    return spans.length ? [{ ...rule, spans }] : [];
  });
}

export function redactSpans(text, spans) {
  const sorted = [...spans].sort((a, b) => a[0] - b[0] || b[1] - a[1]);
  const merged = [];
  for (const [start, end] of sorted) {
    const previous = merged.at(-1);
    if (previous && start <= previous[1]) previous[1] = Math.max(previous[1], end);
    else merged.push([start, end]);
  }
  let output = '', offset = 0;
  for (const [start, end] of merged) {
    output += text.slice(offset, start) + '[نص منقّح]';
    offset = end;
  }
  return output + text.slice(offset);
}

export function decideMatches(text, hits) {
  const ordered = [...hits].sort((a, b) => actionRank[a.action] - actionRank[b.action]);
  const winner = ordered[0];
  if (!winner) return null;
  return {
    winner,
    warnings: ordered.filter(rule => rule.action === 'WARN'),
    output: winner.action === 'ALLOW' ? text : winner.action === 'REDACT'
      ? redactSpans(text, ordered.filter(rule => rule.action === 'REDACT').flatMap(rule => rule.spans))
      : null,
  };
}
