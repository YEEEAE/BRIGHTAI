// Explicit operator channel. No dotenv, email, provisioning roles or deletion.
// OPERATOR_DATABASE_URL must be a reviewed privileged connection, never runtime.
import { readFile } from 'node:fs/promises';
import pg from 'pg';
import { bootstrapExploration,closeExploration,exportExploration } from '../src/server/kernel/operator-exploration.mjs';
const [action,file]=process.argv.slice(2);
if(!['bootstrap','close','export','purge-dry-run'].includes(action)||!file||!process.env.OPERATOR_DATABASE_URL)throw new Error('Usage: OPERATOR_DATABASE_URL=... node scripts/operator-exploration.mjs bootstrap|close|export|purge-dry-run input.json');
const input=JSON.parse(await readFile(file,'utf8'));
const pool=new pg.Pool({connectionString:process.env.OPERATOR_DATABASE_URL,max:1});
try {
 const result=action==='bootstrap'?await bootstrapExploration(pool,input.operatorId,input):action==='close'?await closeExploration(pool,input.operatorId,input.tenantId):await exportExploration(pool,input.operatorId,input.tenantId);
 console.log(JSON.stringify(result,null,2));
}catch(error){console.error(error.code||'OPERATOR_OPERATION_FAILED');process.exitCode=1;}finally{await pool.end();}
