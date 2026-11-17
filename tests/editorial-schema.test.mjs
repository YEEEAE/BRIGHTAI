import test from 'node:test';
import assert from 'node:assert/strict';
import { stripTypeScriptTypes } from 'node:module';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
const temp = await mkdtemp(join(tmpdir(), 'brightai-editorial-'));
for (const name of ['brand', 'organization', 'editorial', 'structured-data']) {
  const code = stripTypeScriptTypes(await readFile(new URL(`../src/data/${name}.ts`, import.meta.url), 'utf8'))
    .replace(/from '(\.\/[^']+)'/g, "from '$1.mjs'");
  await writeFile(join(temp, `${name}.mjs`), code);
}
const { articleStructuredData } = await import(pathToFileURL(join(temp, 'structured-data.mjs')));
const { editorialRecords, approvedReview } = await import(pathToFileURL(join(temp, 'editorial.mjs')));
const article = record => articleStructuredData('عنوان', 'وصف', '/knowledge/test/', record);
test.after(() => rm(temp, { recursive: true, force: true }));
test('No fixed modified date or access-to-modified fallback', () => {
  assert.equal(article({}).dateModified, undefined);
  assert.equal(article({published:'2026-11-03',sourcesAccessed:'2026-11-17'}).dateModified, undefined);
  assert.equal(article({modified:'2026-11-17'}).dateModified, undefined);
});
test('Only documented substantive edits emit dateModified; original publication stays', () => {
  assert.equal(Object.values(editorialRecords).filter(r => r.modified).length, 4);
  const r = editorialRecords['pdpl-and-ai'];
  assert.equal(article(r).datePublished, '2026-11-03');
  assert.equal(article(r).dateModified, '2026-11-17');
});
const record = {published:'2026-11-03',revision:'test-v1',review:{name:'Synthetic test reviewer',profileUrl:'https://example.com/reviewer',scope:'Synthetic test scope',reviewedOn:'2026-11-04',approval:{status:'approved',evidenceUrl:'https://example.com/approval',contentRevision:'test-v1'}}};
test('Pending, missing scope/evidence and stale version cannot appear as approved', () => {
  for (const mutate of [r => r.review.approval.status='pending',r => r.review.scope='',r => r.review.approval.evidenceUrl='',r => r.revision='test-v2']) {
    const r=structuredClone(record);mutate(r);
    assert.equal(approvedReview(r),undefined);
    assert.equal(article(r).mainEntityOfPage.reviewedBy,undefined);
  }
});
test('First publication can be reviewed without inventing a modification; WebPage owns reviewedBy', () => {
  const data=article(record);
  assert.equal(data.dateModified,undefined);
  assert.equal(data.mainEntityOfPage['@type'],'WebPage');
  assert.equal(data.mainEntityOfPage.reviewedBy.name,record.review.name);
  assert.equal(data.mainEntityOfPage.lastReviewed,record.review.reviewedOn);
  assert.match(data.mainEntityOfPage.description,/Synthetic test scope/);
});
test('One publisher identity without invented legal or social claims', () => {
  const data=article({});
  assert.deepEqual(data.author,data.publisher);
  assert.equal(data.publisher.name,'مؤسسة مُشرقة BRIGHT AI');
  for(const key of ['sameAs','address','legalName','taxID','hasCredential']) assert.equal(data.publisher[key],undefined);
});
