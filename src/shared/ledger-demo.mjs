// Browser-only synthetic illustration; no production Ledger imports or persistence.
const samples = [
 ['request.created','actor-demo-01','طلب افتراضي لفحص سياسة','DEMO-REQ-001'],
 ['firewall.escalated','actor-demo-02','تتطلب السياسة مراجعة بشرية','DEMO-FW-001'],
 ['human_gate.approved','reviewer-demo-03','موافقة افتراضية ضمن نطاق المثال','DEMO-HG-001'],
];
export async function digest(event){
 const payload=JSON.stringify([event.sequence,event.event,event.actor,event.time,event.reason,event.reference,event.previousHash]);
 return Array.from(new Uint8Array(await globalThis.crypto.subtle.digest('SHA-256',new TextEncoder().encode(payload))),b=>b.toString(16).padStart(2,'0')).join('');
}
export async function createEvent(index,previousHash){const [event,actor,reason,reference]=samples[index];const record={sequence:index+1,event,actor,time:`2026-11-16T09:0${index}:00.000Z`,reason,reference,previousHash};return {...record,hash:await digest(record)};}
export async function verifyChain(events){if(!events.length)return {state:'empty'};for(let i=0;i<events.length;i++){const computed=await digest(events[i]);if(events[i].sequence!==i+1||events[i].previousHash!==(i?events[i-1].hash:'GENESIS')||computed!==events[i].hash)return {state:'altered',index:i,computed,reason:'عدم تطابق البصمة أو رابط الحدث السابق'};}return {state:'valid'};}
export function exportDemo(events){return JSON.stringify({label:'DEMO / SYNTHETIC',algorithm:'SHA-256',scope:'Local browser illustration; no user evidence',events},null,2);}
