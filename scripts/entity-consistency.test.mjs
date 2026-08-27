import assert from 'node:assert/strict';
import fs from 'node:fs';

const site = fs.readFileSync('src/data/site.ts', 'utf8');
const helpers = fs.readFileSync('src/data/schema-helpers.ts', 'utf8');
const seoHead = fs.readFileSync('src/components/SEOHead.astro', 'utf8');
const about = fs.readFileSync('src/pages/about/index.astro', 'utf8');
const contact = fs.readFileSync('src/pages/contact/index.astro', 'utf8');
const ai = fs.readFileSync('public/ai.txt', 'utf8');
const llms = fs.readFileSync('public/llms.txt', 'utf8');
const llmsFull = fs.readFileSync('public/llms-full.txt', 'utf8');
const publicSchema = JSON.parse(fs.readFileSync('public/schema-saudi-seo.json', 'utf8'));

const organization = publicSchema['@graph'].find((node) => node['@id'] === 'https://brightai.live/#organization');
assert.ok(organization, 'public schema must expose the canonical Organization node');
assert.equal(organization['@type'], 'Organization');
assert.equal(organization.url, 'https://brightai.live');
assert.equal(organization.logo.url, 'https://brightai.live/assets/images/logo.png');
assert.equal(organization.description, 'BrightAI is a Saudi AI governance and safety platform for organizations in Saudi Arabia.');
assert.deepEqual(organization.sameAs, [
  'https://x.com/brightai_sa',
  'https://www.linkedin.com/company/brightai-saudi/',
  'https://github.com/YEEEAE/BRIGHTAI',
]);
assert.equal('taxID' in organization, false, 'placeholder tax identifiers must not be published');
assert.doesNotMatch(about, /hasCredential|EducationalOccupationalCredential/, 'About schema must not fabricate credentials');
assert.match(site, /descriptionAr:/);
assert.match(site, /descriptionEn:/);
assert.match(helpers, /sameAs: SITE\.social\.official/);
assert.match(seoHead, /twitter:site/);
assert.match(seoHead, /twitter:creator/);
assert.match(about, /منهجية|مصدر|آخر تحديث/);
assert.match(contact, /منهجية|مصدر|آخر تحديث/);
for (const content of [ai, llms, llmsFull]) {
  assert.doesNotMatch(content, /brightai-site|BrightAISite|BrightAiSaudi|bright1ai|crunchbase\.com/);
  assert.match(content, /https:\/\/x\.com\/brightai_sa/);
  assert.match(content, /https:\/\/www\.linkedin\.com\/company\/brightai-saudi\//);
}

console.log('entity consistency contract: PASS');
