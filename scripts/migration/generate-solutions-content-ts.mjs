/**
 * generate-solutions-content-ts.mjs
 *
 * يُولّد TS object literals لـ solutions.ts من extracted JSON.
 * يُستخدم مرة واحدة لتحديث solutions.ts ثم يُحفظ.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const extracted = JSON.parse(
  readFileSync('/Users/yzydalshmry/Desktop/BRIGHTAI/src/data/migrated-pages-extracted.json', 'utf8')
);

function quote(s) {
  if (s === undefined || s === null) return 'undefined';
  return JSON.stringify(s);
}

function arrayItems(arr, indent = '          ') {
  if (!arr || arr.length === 0) return '';
  return arr.map(item => `${indent}${quote(item)},`).join('\n');
}

function formatSection(section, indent = '      ') {
  const lines = [];
  lines.push(`${indent}{`);
  lines.push(`${indent}  title: ${quote(section.title)},`);
  if (section.intro) {
    lines.push(`${indent}  intro: ${quote(section.intro)},`);
  }
  if (section.cards && section.cards.length > 0) {
    lines.push(`${indent}  cards: [`);
    for (const card of section.cards) {
      const cardParts = [];
      cardParts.push(`title: ${quote(card.title)}`);
      if (card.subtitle) cardParts.push(`subtitle: ${quote(card.subtitle)}`);
      if (card.text) cardParts.push(`text: ${quote(card.text)}`);
      lines.push(`${indent}    { ${cardParts.join(', ')} },`);
    }
    lines.push(`${indent}  ],`);
  }
  if (section.paragraphs && section.paragraphs.length > 0) {
    lines.push(`${indent}  paragraphs: [`);
    lines.push(arrayItems(section.paragraphs, `${indent}    `));
    lines.push(`${indent}  ],`);
  }
  lines.push(`${indent}},`);
  return lines.join('\n');
}

function formatContent(content, indent = '    ') {
  const lines = [];
  /* format يبني object literal كاملاً — الـ caller يضعه داخل {...} */
  lines.push(`${indent}lead: [`);
  lines.push(arrayItems(content.lead, `${indent}  `));
  lines.push(`${indent}],`);
  if (content.sections && content.sections.length > 0) {
    lines.push(`${indent}sections: [`);
    for (const section of content.sections) {
      lines.push(formatSection(section, `${indent}  `));
    }
    lines.push(`${indent}],`);
  }
  if (content.faqs && content.faqs.length > 0) {
    lines.push(`${indent}faqs: [`);
    for (const faq of content.faqs) {
      const fParts = [];
      fParts.push(`question: ${quote(faq.question)}`);
      fParts.push(`answer: ${quote(faq.answer)}`);
      lines.push(`${indent}  { ${fParts.join(', ')} },`);
    }
    lines.push(`${indent}],`);
  }
  lines.push(`${indent}finalTitle: ${quote(content.finalTitle)},`);
  lines.push(`${indent}finalText: ${quote(content.finalText)},`);
  return lines.join('\n');
}

const out = [];
out.push('/* AUTO-GENERATED from scripts/extract-solutions-content.mjs → migrated-pages-extracted.json');
out.push('   كُل منتج migrated له content مصدّر (lead / sections / faqs / finalTitle / finalText).');
out.push('   كل قطاع migrated له regulations في .regulations داخل SectorData. */\n');

for (const [slug, content] of Object.entries(extracted.solutions)) {
  out.push(`export const content_${slug.replace(/-/g, '_')} = {\n${formatContent(content)}\n};\n`);
}

out.push('/* Sector regulations + FAQs matrix */');
out.push('export const regulationsBySectorSlug: Record<string, { abbr: string; name: string; scope: string }[]> = {');
for (const [slug, data] of Object.entries(extracted.sectors)) {
  out.push(`  '${slug}': ${JSON.stringify(data.regulations, null, 2)},`);
}
out.push('};');

out.push('');
out.push('export const faqsBySectorSlug: Record<string, { question: string; answer: string }[]> = {');
for (const [slug, data] of Object.entries(extracted.sectors)) {
  out.push(`  '${slug}': ${JSON.stringify(data.faqs || [], null, 2)},`);
}
out.push('};');

writeFileSync('/Users/yzydalshmry/Desktop/BRIGHTAI/src/data/solutions-content-generated.ts', out.join('\n'), 'utf8');
console.log(`✓ Generated src/data/solutions-content-generated.ts (${out.length} lines)`);
