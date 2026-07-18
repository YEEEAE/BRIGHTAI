/**
 * extract-solutions-content.mjs
 *
 * REPORT-10 — Extension.
 *
 * يستخرج structured content من كل migrated JSON:
 *   - 8 solutions migrated → .content (lead / sections / faqs / finalTitle / finalText)
 *   - 4 sectors migrated  → .regulations (compliance badges)
 *
 * Input : src/data/migrated-pages/solution-*.json + sector-*.json
 * Output : src/data/migrated-pages-extracted.json
 *
 * الـ strategy:
 *  1. cheerio-based HTML parse
 *  2. lead: أول 2-3 <p> في section يحوي h1 أو chip (hero)
 *  3. sections: كل <section> فيه h2 → { title, intro, cards?, paragraphs? }
 *  4. faqs: <details> مع question/answer
 *  5. finalTitle: من آخر h2 يحوي "ابدأ" / "تواصل"
 *
 * كل content يحافظ على الـ Arabic verbatim.
 */
import { load } from 'cheerio';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = '/Users/yzydalshmry/Desktop/BRIGHTAI/src/data/migrated-pages';

function cleanText(html) {
  return html
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/(p|h\d|div|li|details|summary)>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isAfter($a, $b) {
  /* fallback: تعتمد على cheerio parent index.
     الـ migrated HTML يضع الـ h3s داخل نفس container كـ h2 */
  if (!$a.length || !$b.length) return false;
  /* ابحث في الـ root document order باستخدام indexOf pattern */
  try {
    const allTop = $a.closest('html').addBack().find('*');
    return allTop.index($a) > allTop.index($b);
  } catch { return false; }
}

/* ---------- solution extractors ---------- */

function extractLead($, $heroSection) {
  const paragraphs = [];
  $heroSection.find('p').each((_, el) => {
    const t = cleanText($heroSection.find(el).html() || '');
    if (t.length > 30 && paragraphs.length < 3) paragraphs.push(t);
  });
  return paragraphs;
}

function extractCardsInSection($, $section) {
  const cards = [];
  $section.find('h3, h4').each((_, el) => {
    const $el = $(el);
    const title = cleanText($el.text() || '');
    if (!title) return;

    let cardTitle = title;
    let cardSubtitle = undefined;
    const parensMatch = title.match(/^([^(]+?)\s*\(([^)]+)\)\s*$/);
    if (parensMatch) {
      cardTitle = parensMatch[1].trim();
      cardSubtitle = parensMatch[2].trim();
    }

    /* body: من أقرب enclosing card-ish parent */
    const $card = $el.closest('article, .feature-card, .card, .inner-card, li, .grid > div');
    const $scan = $card.length ? $card : $el.parent();
    let bodyText = '';
    const $p = $scan.find('p').first();
    if ($p.length && $p.text().trim().length > 0) {
      bodyText = cleanText($p.text());
    }
    if (!bodyText || bodyText.length < 20) return;

    const card = { title: cardTitle };
    if (cardSubtitle) card.subtitle = cardSubtitle;
    if (!bodyText.match(/^(YES|NO)$/i)) card.text = bodyText;
    cards.push(card);
  });
  return cards;
}

function extractSection($, $section) {
  const $h2 = $section.find('h2').first();
  if (!$h2.length) return null;
  const title = cleanText($h2.text() || '');
  if (!title) return null;
  /* skip FAQ + final CTA */
  if (/FAQ|أسئلة/.test(title)) return null;
  if (title.startsWith('ابدأ') && title.length < 50) return null;
  if (/تواصل.*للحصول/.test(title)) return null;

  const result = { title };

  /* intro: أول <p> داخل section بطول كافي */
  const allP = $section.find('p').toArray();
  for (const p of allP) {
    const t = cleanText($(p).text() || '');
    if (t.length > 30) { result.intro = t; break; }
  }

  /* cards: كل h3/h4 داخل section (بما فيها أسفل h2 الـ heading) */
  result.cards = extractCardsInSection($, $section);

  /* paragraphs: لو ما في cards كافي، نجمع الـ <p> المتبقية (أكثر من intro) */
  if (!result.cards || result.cards.length === 0) {
    const paragraphs = [];
    for (const p of allP) {
      const t = cleanText($(p).text() || '');
      if (t.length > 30 && t !== result.intro && paragraphs.length < 3) {
        paragraphs.push(t);
      }
    }
    if (paragraphs.length > 0) result.paragraphs = paragraphs;
  }

  return result;
}

function extractFaqs($) {
  const faqs = [];
  $('details').each((_, det) => {
    const $det = $(det);
    const $summary = $det.find('summary').first();
    if (!$summary.length) return;
    const question = cleanText($summary.text() || '');
    if (!question || question.length < 8) return;
    const answer = cleanText($det.clone().children('summary').remove().end().text() || '');
    if (!answer || answer.length < 20) return;
    faqs.push({ question, answer });
  });
  return faqs;
}

function extractFinalCta($) {
  let title = '';
  let text = '';
  const matches = [];
  $('section').each((_, sec) => {
    const $sec = $(sec);
    const $h2 = $sec.find('h2').first();
    if (!$h2.length) return;
    const h2Text = cleanText($h2.text() || '');
    if (h2Text.match(/^ابدأ|تواصل|مكالمة|تشغيل|نطلق|انضم/)) {
      matches.push({ h2Text, $sec });
    }
  });
  if (matches.length > 0) {
    const last = matches[matches.length - 1];
    title = last.h2Text;
    const $p = last.$sec.find('p').first();
    if ($p.length) text = cleanText($p.text() || '');
  }
  if (!title) {
    const $lastH2 = $('h2').last();
    if ($lastH2.length) {
      title = cleanText($lastH2.text() || '');
      const $p = $lastH2.parent().find('p').first();
      if ($p.length) text = cleanText($p.text() || '');
    }
  }
  return {
    title: title || 'ابدأ الآن',
    text: text || 'تواصل مع فريق BrightAI للحصول على عرض توضيحي مخصص.',
  };
}

function extractSolutionContent(migratedJson) {
  const $ = load(migratedJson.html || '');
  if (!$('section').length) return null;

  /* 1) lead: من أول section يحوي hero */
  let lead = [];
  $('section').each((_, sec) => {
    if (lead.length > 0) return false;
    const $sec = $(sec);
    const hasHero = $sec.find('h1').length || $sec.find('.chip').length;
    if (hasHero) lead = extractLead($, $sec);
  });
  if (lead.length === 0) {
    $('section p').each((_, p) => {
      const t = cleanText($(p).text() || '');
      if (t.length > 40 && lead.length < 3) lead.push(t);
    });
  }

  /* 2) sections */
  const sections = [];
  $('section').each((_, sec) => {
    const $sec = $(sec);
    const data = extractSection($, $sec);
    if (data && data.title) sections.push(data);
  });

  /* 3) faqs */
  const faqs = extractFaqs($);

  /* 4) final CTA */
  const { title: fTitle, text: fText } = extractFinalCta($);

  return { lead, sections, faqs, finalTitle: fTitle, finalText: fText };
}

/* ---------- sector extractors ---------- */

function extractSectorRegulations(slug) {
  const matrix = {
    'banking-ai-governance': [
      { abbr: 'SAMA',     name: 'البنك المركزي السعودي',          scope: 'حوكمة الائتمان، كشف الاحتيال، مكافحة غسل الأموال.' },
      { abbr: 'NCA ECC',  name: 'ضوابط الأمن السيبراني',          scope: 'حماية البيانات، إدارة المخاطر التقنية، مراقبة الأحداث.' },
      { abbr: 'PDPL',     name: 'نظام حماية البيانات الشخصية',  scope: 'موافقة العميل، حق الحذف، الإفصاح، أمن البيانات.' },
      { abbr: 'FATF',     name: 'مكافحة غسل الأموال وتمويل الإرهاب', scope: 'KYC، الإبلاغ عن المعاملات المشبوهة، توثيق AI.' },
    ],
    'government-ai-governance': [
      { abbr: 'DGA',       name: 'هيئة الحكومة الرقمية',          scope: 'معايير الخدمات الرقمية الحكومية، البنية الرقمية.' },
      { abbr: 'PDPL',      name: 'نظام حماية البيانات الشخصية',  scope: 'بيانات المستفيدين من الخدمات، تخزين آمن.' },
      { abbr: 'NCA ECC',   name: 'ضوابط الأمن السيبراني الحكومي', scope: 'تطبيقات AI الحكومية، سرية المستندات، إدارة الوصول.' },
      { abbr: 'SDAIA',     name: 'سدايا',                         scope: 'إرشادات الذكاء الاصطناعي التوليدي، أخلاقيات AI.' },
      { abbr: 'Vision 2030', name: 'رؤية 2030',                   scope: 'التحول الرقمي الحكومي، الخدمات الذكية.' },
    ],
    'healthcare-ai-governance': [
      { abbr: 'SFDA',      name: 'الهيئة العامة للغذاء والدواء',  scope: 'تطبيقات AI الطبية، الأجهزة الطبية الذكية، سلامة المرضى.' },
      { abbr: 'ISO 13485', name: 'إدارة جودة الأجهزة الطبية',     scope: 'تصميم وتطوير أنظمة AI الطبية، توثيق المنتج.' },
      { abbr: 'PDPL',      name: 'نظام حماية البيانات الشخصية',   scope: 'بيانات المرضى (PHI)، تشفير، حق الحذف.' },
      { abbr: 'NCA ECC',   name: 'الأمن السيبراني الصحي',         scope: 'حماية سجلات المرضى، إدارة الوصول، مراقبة الأحداث.' },
      { abbr: 'CBAHI',     name: 'مركز اعتماد المنشآت الصحية',    scope: 'معايير الاعتماد المؤسسي، سلامة المرضى.' },
    ],
    'manufacturing-ai-governance': [
      { abbr: 'NCA ECC',   name: 'الأمن السيبراني الصناعي',        scope: 'حماية شبكات OT، فصل IT/OT، إدارة الحوادث.' },
      { abbr: 'ISO 42001', name: 'إدارة الذكاء الاصطناعي',        scope: 'نظام حوكمة AI متكامل، تقييم المخاطر.' },
      { abbr: 'PDPL',      name: 'نظام حماية البيانات الشخصية',   scope: 'بيانات المشغلين والموردين، نقل آمن.' },
      { abbr: 'SASO/IEC',  name: 'الهيئة السعودية للمواصفات والمقاييس', scope: 'الجودة الصناعية، الامتثال الفني.' },
    ],
  };
  return matrix[slug] || [];
}

/* ---------- main ---------- */

const SOLUTION_SLUGS = [
  'ai-firewall',
  'ai-audit-trail',
  'ai-evidence-file',
  'human-approval-layer',
  'continuous-ai-governance',
  'ai-risk-classification',
  'ai-use-case-discovery',
  'policy-to-control-mapping',
];

const SECTOR_SLUGS = [
  'banking-ai-governance',
  'government-ai-governance',
  'healthcare-ai-governance',
  'manufacturing-ai-governance',
];

const out = { solutions: {}, sectors: {} };

for (const slug of SOLUTION_SLUGS) {
  const file = join(ROOT, `solution-${slug}.json`);
  const json = JSON.parse(readFileSync(file, 'utf8'));
  const content = extractSolutionContent(json);
  if (!content) continue;
  out.solutions[slug] = content;
  const c0 = content.sections[0];
  console.log(`✓ solution-${slug}: ${content.sections.length} sections, ${content.faqs.length} FAQs, ${content.lead.length} lead paragraphs, s0.cards=${c0?.cards?.length ?? 0}`);
}

for (const slug of SECTOR_SLUGS) {
  const file = join(ROOT, `sector-${slug}.json`);
  const json = JSON.parse(readFileSync(file, 'utf8'));
  const regulations = extractSectorRegulations(slug);
  /* استخرج FAQs أيضاً من migrated HTML */
  const $sec = load(json.html || '');
  const faqs = extractFaqs($sec);
  out.sectors[slug] = { regulations, faqs };
  console.log(`✓ sector-${slug}: ${regulations.length} regulations, ${faqs.length} FAQs`);
}

writeFileSync(
  '/Users/yzydalshmry/Desktop/BRIGHTAI/src/data/migrated-pages-extracted.json',
  JSON.stringify(out, null, 2),
  'utf8'
);
console.log(`\n✅ استخراج ${SOLUTION_SLUGS.length} solutions + ${SECTOR_SLUGS.length} sectors → migrated-pages-extracted.json`);
