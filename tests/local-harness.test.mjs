import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { localDatabaseUrl } from './helpers/database.mjs';
test('local harness rejects remote/override DSNs and missing required fixtures',()=>{
 const name='LOCAL_HARNESS_TEST_URL';const prior=process.env.AIGAS_REQUIRE_DB_TESTS;
 try {
  for(const value of ['postgresql://user@remote.invalid/test','postgresql://user@localhost/test?host=remote.invalid','https://localhost/test']){
   process.env[name]=value;assert.throws(()=>localDatabaseUrl(name));
  }
  delete process.env[name];process.env.AIGAS_REQUIRE_DB_TESTS='true';assert.throws(()=>localDatabaseUrl(name));
 } finally {delete process.env[name];if(prior===undefined)delete process.env.AIGAS_REQUIRE_DB_TESTS;else process.env.AIGAS_REQUIRE_DB_TESTS=prior;}
});
test('no-egress preload rejects outbound sockets before DNS',()=>{
 const child=spawnSync(process.execPath,['--import',new URL('./helpers/no-egress.mjs',import.meta.url).href,'--input-type=module','-e',
  `import assert from 'node:assert/strict';import net from 'node:net';import tls from 'node:tls';
   for(const host of ['example.invalid','192.0.2.1']){
    assert.throws(()=>net.connect({host,port:443}),/External network forbidden/);
    assert.throws(()=>tls.connect({host,port:443}),/External network forbidden/);
   }`],{env:{PATH:process.env.PATH},encoding:'utf8'});
 assert.equal(child.status,0,child.stderr);
});
