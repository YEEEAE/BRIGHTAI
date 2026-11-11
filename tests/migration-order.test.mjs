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
test('25 matching receipts resume with only 0030, 0031 and the trigger ACL repair; complete ledger is a no-op', () => {
  assert.equal(prefix.length,25);
  const pending=resumeOrder(files,prefix);
  assert.deepEqual(pending.map(f=>f.key),['0030','0031','0032']);
  assert.deepEqual(resumeOrder(files,[...prefix,...pending.map(f=>({filename:f.name,sha256:f.sha256,status:'APPLIED'}))]),[]);
});
test('resume refuses changed hashes, failed rows, holes, unknown and empty ledgers', () => {
  for (const rows of [[],prefix.slice(1),[...prefix,{filename:'unknown',sha256:'x',status:'APPLIED'}],prefix.map((r,i)=>i? r:{...r,sha256:'changed'}),prefix.map((r,i)=>i?r:{...r,status:'FAILED'})]) assert.throws(()=>resumeOrder(files,rows));
});
test('all planned SQL files support an atomic schema and receipt transaction', () => {
  for (const key of new Set([...freshOrder(files),...DELTA_ORDER])) assert(migrationBody(files.find(f=>f.key===key).body).length>0,key);
  assert.throws(()=>migrationBody('CREATE TABLE x(id int);'));
  assert.throws(()=>migrationBody('BEGIN;\nCOMMIT;\nCOMMIT;'));
});

test('target delta runner never replays baseline CREATE migrations', () => {
  const result = JSON.parse(execFileSync(process.execPath, ['scripts/apply-migrations.mjs','--mode','delta','--dry-run'], {encoding:'utf8'}));
  assert.deepEqual(result.steps.map(s=>s.file.slice(0,4)), DELTA_ORDER);
  assert(!result.steps.some(s=>['0001','0002','0003','0011','0012','0019'].includes(s.file.slice(0,4))));
});
