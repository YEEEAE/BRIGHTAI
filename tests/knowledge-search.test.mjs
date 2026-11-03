import test from 'node:test';
import assert from 'node:assert/strict';
import { normalize, matches } from '../src/scripts/knowledge-search.mjs';
import { summarizeDocument } from '../src/server/knowledge/document.mjs';
const entry = {title:'إطار حَوْكَمة الذكاء الاصطناعي',text:'حماية البيانات',tag:'إطار عمل',topics:['governance'],products:['firewall']};
const state = {q:'',topic:'',type:'',products:[]};
test('Arabic diacritics, hamza, tatweel and word order',()=>{
 assert.equal(normalize('إِطَــار'),normalize('اطار'));
 assert.ok(matches(entry,{...state,q:'حوكمة إطار'},[]));
});
test('OR within products and AND across groups',()=>{
 assert.ok(matches(entry,{...state,products:['ledger','firewall'],topic:'governance',type:'إطار عمل'},[]));
 assert.equal(matches(entry,{...state,products:['ledger']},[]),false);
 assert.equal(matches(entry,{...state,products:['firewall'],topic:'privacy'},[]),false);
 assert.equal(matches(entry,{...state,products:['firewall'],type:'شرح'},[]),false);
});
test('Extract actual headings and reading words, excluding scripts',()=>{
 const doc = summarizeDocument('<div data-knowledge-content><h2 id="first">عنوان <b>فعلي</b></h2><p>نص الدليل</p><script>fake words</script><!--knowledge-content-end--></div><h2>غير مرتبط</h2>');
 assert.deepEqual(doc.headings,[{id:'first',title:'عنوان فعلي'}]); assert.equal(doc.minutes,1); assert.ok(!doc.text.includes('fake'));
});
