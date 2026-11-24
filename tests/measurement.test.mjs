import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {createPublicMeasurement,publicEvent} from '../public/measurement-core.mjs';
const runtime=readFileSync(new URL('../public/measurement.mjs',import.meta.url),'utf8').replace(/^import .*;\n/,'');
const valid={product:'firewall'};
test('public contract rejects free text, unknown values, and every server success claim',()=>{
 for(const key of ['search','query','prompt','chat','form','tenant_id','tenantId','email','page_location']) assert.equal(publicEvent('lab_started',{...valid,[key]:'PRIVATE'}),null);
 assert.equal(publicEvent('lab_started',{product:'PRIVATE'}),null);
 assert.equal(publicEvent('inquiry_verified',{channel:'email',evidence_level:'server_committed'}),null);
 assert.equal(publicEvent('scenario_completed',{...valid,scenario_code:'guided-demo-v1',evidence_level:'server_committed'}),null);
 assert.equal(publicEvent('scenario_completed',{...valid,scenario_code:'PRIVATE',evidence_level:'demo_client'}),null);
 for(const name of ['ai-use-policy','ai-risk-register','responsibility-evidence-matrix']) assert.ok(publicEvent('template_download_requested',{asset_code:name,format:'csv'}));
});
test('a repeated logical event is sent once, separate actions remain countable, kill drops without replay',()=>{
 const calls=[];let enabled=true;
 const send=createPublicMeasurement({send:(...v)=>calls.push(v),enabled:()=>enabled});
 const id=randomUUID();assert.equal(send('lab_started',valid,id),true);assert.equal(send('lab_started',valid,id),false);
 assert.equal(send('lab_started',valid,randomUUID()),true);
 enabled=false;const killed=randomUUID();assert.equal(send('lab_started',valid,killed),false);assert.equal(calls.length,2);
 enabled=true;assert.equal(calls.length,2);
});
function harness(initial={enabled:true},status=200,pathname='/') {
 const listeners=new Map(),docListeners=new Map(),scripts=[],calls=[],timers=[];
 let state=initial,code=status;
 const window={location:new URL(pathname,'https://brightai.live'),dataLayer:[['config','G-9LMB4PGTWJ']],addEventListener:(k,fn)=>listeners.set(k,fn),gtag:(...v)=>calls.push(v)};
 const document={baseURI:window.location.href,hidden:false,addEventListener:(k,fn,options)=>docListeners.set(options?.capture ? `${k}:capture` : k,fn),createElement:()=>({}),head:{append:s=>scripts.push(s)}};
 const urls=[];
 const context=vm.createContext({window,document,URL,crypto:{randomUUID},createPublicMeasurement,AbortSignal,fetch:async url=>{urls.push(url);return {ok:code===200,status:code,json:async()=>state};},setInterval:fn=>timers.push(fn)});
 vm.runInContext('(function(){'+runtime+'})()',context);
 const settle=async()=>{await new Promise(resolve=>setImmediate(resolve));};
 return {window,listeners,docListeners,scripts,calls,timers,urls,settle,run:()=>vm.runInContext('(function(){'+runtime+'})()',context),state:(v,c=200)=>{state=v;code=c;}};
}
test('interaction controls cannot disable or reload the GA4 page-view transport',async()=>{
 const h=harness();await h.settle();h.run();await h.settle();
 assert.equal(h.timers.length,1);
 assert.equal(h.scripts.length,0);
 const send=()=> {
   const event={detail:{name:'lab_started',properties:valid,eventId:randomUUID()}};
   h.listeners.get('brightai:measurement')(event);
   return event.detail.accepted;
 };
 assert.equal(send(),true);
 for(const malformed of [null, {}, {enabled:'false'}]) {
   h.state(malformed);h.timers[0]();await h.settle();
   assert.equal(send(),false);
 }
 h.state({},404);h.timers[0]();await h.settle();
 assert.ok(h.urls.includes('/measurement-control.json'));
 assert.equal(send(),false);
 h.state({enabled:true});h.timers[0]();await h.settle();
 assert.equal(send(),true);
 h.state({enabled:false});h.timers[0]();await h.settle();
 assert.equal(send(),false);
 h.state({enabled:true});h.timers[0]();await h.settle();
 assert.equal(send(),false);
 assert.equal(h.window['ga-disable-G-9LMB4PGTWJ'],undefined);
 assert.equal(h.window.dataLayer.length,1);
 assert.equal(h.calls.length,2);
});
test('link measurement ignores the second double-click and only reads fixed attributes',async()=>{
 const h=harness();await h.settle();const click=h.docListeners.get('click');
 const target={closest:()=>({dataset:{measureChannel:'email'},href:'PRIVATE'})};
 click({target,detail:1});click({target,detail:2});assert.equal(h.calls.length,1);assert.equal(h.calls[0][2].channel,'email');assert.ok(!JSON.stringify(h.calls).includes('PRIVATE'));
 click({target:{closest:()=>({dataset:{measureChannel:'PRIVATE'}})},detail:1});assert.equal(h.calls.length,1);
});

test('public clicks count nested, keyboard and middle-button activation without sending link content', async () => {
 const h=harness();await h.settle();
 const click=h.docListeners.get('click:capture');
 const auxclick=h.docListeners.get('auxclick:capture');
 const region={localName:'nav',matches:selector=>selector.startsWith('header,nav')};
 const control={
   matches:selector=>selector.startsWith('a[href]'),
   getAttribute:()=>'/app/PRIVATE?secret=PRIVATE#PRIVATE',
   hasAttribute:()=>false,
   textContent:'PRIVATE',
 };
 const event={isTrusted:true,type:'click',detail:0,composedPath:()=>[{},control,region]};
 click(event);
 auxclick({...event,type:'auxclick',button:1});
 auxclick({...event,type:'auxclick',button:2});
 click({...event,isTrusted:false});
 assert.equal(h.calls.length,2);
 for(const call of h.calls) {
   assert.equal(call[1],'site_click');
   assert.deepEqual({...call[2]},{send_to:'G-9LMB4PGTWJ',element_type:'link',page_section:'nav',link_type:'internal'});
 }
 assert.ok(!JSON.stringify(h.calls).includes('PRIVATE'));
 h.listeners.get('brightai:measurement-stop')();
 click(event);
 assert.equal(h.calls.length,2);
 for(const path of ['/app/records/','/auth/callback/','/api/']) {
   const privatePage=harness({enabled:true},200,path);
   assert.equal(privatePage.docListeners.has('click:capture'),false);
 }
});

test('lab attempts complete once, reset creates a new attempt, and an unmeasured start cannot become an orphan completion',async()=>{
 const {stripTypeScriptTypes}=await import('node:module');
 const source=stripTypeScriptTypes(readFileSync(new URL('../src/scripts/measurement.ts',import.meta.url),'utf8')).replaceAll('export function','function');
 const emitted=[];let accepted=true;
 class CustomEvent {constructor(type,options){this.type=type;this.detail=options.detail;}}
 const context=vm.createContext({crypto:{randomUUID},CustomEvent,window:{dispatchEvent:e=>{emitted.push(e.detail.name);e.detail.accepted=accepted;}}});
 vm.runInContext(source,context);
 const root={};context.root=root;
 vm.runInContext("completeLab(root,'firewall');startLab(root,'firewall');startLab(root,'firewall');completeLab(root,'firewall');completeLab(root,'firewall');",context);
 assert.deepEqual(emitted,['lab_started','scenario_completed']);
 vm.runInContext("resetLab(root);startLab(root,'firewall');completeLab(root,'firewall');",context);assert.equal(emitted.length,4);
 accepted=false;
 vm.runInContext("resetLab(root);startLab(root,'firewall');",context);
 accepted=true;
 vm.runInContext("completeLab(root,'firewall');",context);assert.equal(emitted.at(-1),'lab_started');
});
