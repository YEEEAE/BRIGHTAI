import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PAGE_QUERY_ALLOWLIST, safeAnalyticsUrl} from '../src/server/observability/url-policy.mjs';

const privacy=readFileSync(new URL('../src/pages/privacy.astro',import.meta.url),'utf8');
const measurement=readFileSync(new URL('../public/measurement.mjs',import.meta.url),'utf8');
const status=readFileSync(new URL('../src/pages/api/measurement-status.ts',import.meta.url),'utf8');

test('privacy disclosure names exactly the page-location campaign keys accepted by code',()=>{
 assert.deepEqual(PAGE_QUERY_ALLOWLIST,['utm_source','utm_medium','utm_campaign','utm_content']);
 const location=safeAnalyticsUrl('https://brightai.live/?utm_source=synthetic&utm_medium=synthetic&utm_campaign=synthetic&utm_content=synthetic&utm_term=synthetic&secret=synthetic');
 assert.equal(location,'https://brightai.live/?utm_source=synthetic&utm_medium=synthetic&utm_campaign=synthetic&utm_content=synthetic');
 assert.match(privacy,/utm_source وutm_medium وutm_campaign وutm_content/);
 assert.match(privacy,/utm_term والاستعلامات الأخرى فتُحذف/);
 assert.doesNotMatch(privacy,/utm_term[^.]{0,120}قابلة للإرسال/);
});

test('privacy disclosure matches loader fallback and both runtime GA4 kill switches',()=>{
 assert.match(measurement,/\/api\/measurement-status\//);
 assert.match(measurement,/\/measurement-control\.json/);
 assert.match(status,/AIGAS_MONITORING_KILL_SWITCH/);
 assert.match(status,/AIGAS_GA4_KILL_SWITCH/);
 assert.match(privacy,/AIGAS_GA4_KILL_SWITCH=true/);
 assert.match(privacy,/AIGAS_MONITORING_KILL_SWITCH=true/);
 assert.match(privacy,/measurement-control\.json/);
 assert.match(privacy,/لا توجد في الواجهة الحالية نافذة موافقة مسبقة أو زر إيقاف للمستخدم/);
});

test('privacy copy remains a draft and does not claim legal approval or full compliance',()=>{
 assert.match(privacy,/مسودة معلومات عامة وليست إشعار خصوصية نهائياً/);
 assert.match(privacy,/لا يمثل هذا النص اعتماداً قانونياً أو إثبات امتثال/);
});
