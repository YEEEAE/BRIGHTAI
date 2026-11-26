import test from 'node:test';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { DELTA_ORDER, UPGRADE_ONLY, freshOrder, resumeOrder, migrationBody } from '../scripts/migration-order.mjs';
const dir = new URL('../migrations/', import.meta.url);
const files = await Promise.all((await readdir(dir)).filter(f => f.endsWith('.sql')).sort().map(async name => {
  const body = await readFile(new URL(name, dir), 'utf8');
  return {key: name.slice(0,4), name, body, sha256: createHash('sha256').update(body).digest('hex')};
}));
const prefix = files.filter(f => freshOrder(files).includes(f.key) && f.key < '0030').map(f => ({filename:f.name,sha256:f.sha256,status:'APPLIED'}));
test('delta includes treatment lock after all its dependencies', () => {
  for (const key of ['0026','0028','0030']) assert(DELTA_ORDER.indexOf('0031') > DELTA_ORDER.indexOf(key));
  assert.deepEqual(UPGRADE_ONLY, ['0011','0012','0013','0019']);
});
test('25 matching receipts resume with 0030–0051 only; complete ledger is a no-op', () => {
  assert.equal(prefix.length,25);
  const pending=resumeOrder(files,prefix);
  assert.deepEqual(pending.map(f=>f.key),['0030','0031','0032','0033','0034','0035','0036','0037','0038','0039','0040','0041','0042','0043','0044','0045','0046','0047','0048','0049','0050','0051']);
  assert.deepEqual(resumeOrder(files,[...prefix,...pending.map(f=>({filename:f.name,sha256:f.sha256,status:'APPLIED'}))]),[]);
});
test('resume refuses changed hashes, holes, unknown and empty ledgers', () => {
  const next = files.find(f=>f.key==='0030');
  const after = files.find(f=>f.key==='0031');
  for (const rows of [[],prefix.slice(1),[...prefix,{filename:'unknown',sha256:'x',status:'APPLIED'}],prefix.map((r,i)=>i? r:{...r,sha256:'changed'}),[...prefix,{filename:next.name,sha256:next.sha256,status:'FAILED'},{filename:after.name,sha256:after.sha256,status:'APPLIED'}]]) assert.throws(()=>resumeOrder(files,rows));
});
test('resume retries a staged FAILED receipt with its verified hash instead of skipping it', () => {
  const next = files.find(f=>f.key==='0030');
  const failed = {filename:next.name,sha256:next.sha256,status:'FAILED'};
  assert.deepEqual(resumeOrder(files,[...prefix,failed]).map(f=>f.key),['0030','0031','0032','0033','0034','0035','0036','0037','0038','0039','0040','0041','0042','0043','0044','0045','0046','0047','0048','0049','0050','0051']);
  assert.throws(()=>resumeOrder(files,[...prefix,{...failed,sha256:'changed'}]));
});
test('all planned SQL files support an atomic schema and receipt transaction', () => {
  for (const key of new Set([...freshOrder(files),...DELTA_ORDER])) assert(migrationBody(files.find(f=>f.key===key).body).length>0,key);
  assert.throws(()=>migrationBody('CREATE TABLE x(id int);'));
  assert.throws(()=>migrationBody('BEGIN;\nCOMMIT;\nCOMMIT;'));
});

test('delta closure includes 0046/0047 and never replays upgrade-only files on fresh', () => {
  assert(DELTA_ORDER.includes('0046') && DELTA_ORDER.includes('0047'));
  assert.deepEqual(DELTA_ORDER.slice(-6), ['0046','0047','0048','0049','0050','0051']);
  assert(!freshOrder(files).some(key => UPGRADE_ONLY.includes(key)));
  assert(freshOrder(files).includes('0046') && freshOrder(files).includes('0047'));
});

test('target delta runner never replays baseline CREATE migrations', () => {
  const result = JSON.parse(execFileSync(process.execPath, ['scripts/apply-migrations.mjs','--mode','delta','--dry-run'], {encoding:'utf8'}));
  assert.deepEqual(result.steps.map(s=>s.file.slice(0,4)), DELTA_ORDER);
  assert(!result.steps.some(s=>['0001','0002','0003','0011','0012','0019'].includes(s.file.slice(0,4))));
});

test('fresh and delta include the identical complete closure suffix', () => {
  const suffix = freshOrder(files).filter(key => key >= '0030');
  assert.deepEqual(DELTA_ORDER.filter(key => key >= '0030'), suffix);
  assert.deepEqual(suffix.slice(-18), ['0034','0035','0036','0037','0038','0039','0040','0041','0042','0043','0044','0045','0046','0047','0048','0049','0050','0051']);
});
