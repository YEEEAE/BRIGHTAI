import assert from 'node:assert/strict';
import test from 'node:test';

// Import without a DOM so the runtime's automatic page-view boot stays inactive.
const layers = [await import('../public/js/analytics.js'), await import('../src/lib/analytics.ts')];
for (const [index, layer] of layers.entries()) {
  test(`AI host classification, layer ${index}`, () => {
    assert.equal(layer.classifyAiReferrer('https://chatgpt.com/c/private?email=secret'), 'chatgpt');
    assert.equal(layer.classifyAiReferrer('https://chat.openai.com/'), 'chatgpt');
    assert.equal(layer.classifyAiReferrer('https://www.perplexity.ai/search/x'), 'perplexity');
    assert.equal(layer.classifyAiReferrer('https://gemini.google.com/app'), 'gemini');
    assert.equal(layer.classifyAiReferrer('https://copilot.microsoft.com/'), 'copilot');
    assert.equal(layer.classifyAiReferrer('https://claude.ai/chat/x'), 'claude');
    for (const ref of ['', 'broken', 'https://google.com/', 'https://bing.com/', 'https://chatgpt.com.attacker.test/', 'https://notchatgpt.com/']) {
      assert.equal(layer.classifyAiReferrer(ref), undefined);
    }
  });
}

for (const [index, layer] of layers.entries()) {
  test(`session attribution and UTM priority, layer ${index}`, () => {
    const values = new Map();
    globalThis.sessionStorage = {getItem: k => values.get(k) ?? null, setItem: (k,v) => values.set(k,v)};
    globalThis.document = {referrer: 'https://chatgpt.com/c/secret?email=private', title: 'Test', documentElement: {lang:'ar'}, body: {getAttribute: () => 'docs'}};
    globalThis.window = {location: new URL('https://brightai.live/docs/'), document, innerWidth: 1200, innerHeight:800};
    const emitted = [];
    layer.registerProvider({name:'test',fn: (name,payload) => emitted.push(payload)});
    layer.setConsent('granted');
    layer.track('resource_download', {event_id:`ai-${index}`});
    assert.equal(emitted.at(-1).source,'chatgpt');
    assert.equal(emitted.at(-1).medium,'ai_referral');
    assert.equal(emitted.at(-1).referrer,'chatgpt.com');
    assert.ok(!JSON.stringify(emitted).includes('secret'));
    document.referrer = 'https://brightai.live/docs/';
    layer.track('resource_download',{event_id:`next-${index}`});
    assert.equal(emitted.at(-1).source,'chatgpt');
    window.location = new URL('https://brightai.live/?utm_source=newsletter&utm_medium=email');
    layer.track('resource_download',{event_id:`utm-${index}`});
    assert.equal(emitted.at(-1).source,'newsletter');
    assert.equal(emitted.at(-1).medium,'email');
    layer.setConsent('denied');
    const count = emitted.length;
    layer.track('resource_download',{event_id:`denied-${index}`});
    assert.equal(emitted.length,count);
    delete globalThis.window; delete globalThis.document; delete globalThis.sessionStorage;
  });
}
