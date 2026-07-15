#!/usr/bin/env node
/**
 * _debug-chat-mobile.mjs — quick diagnosis of mobile chat layout
 */
import { chromium, devices } from 'playwright';

const browser = await chromium.launch();
const context = await browser.newContext({ ...devices['iPhone SE'] });
const page = await context.newPage();
await page.goto('http://localhost:18765/kernel/chat/', { waitUntil: 'networkidle' });

const debug = await page.evaluate(() => {
  function info(sel) {
    const el = document.querySelector(sel);
    if (!el) return { found: false };
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return {
      found: true,
      tag: el.tagName,
      top: r.top, bottom: r.bottom, height: r.height,
      display: cs.display, position: cs.position,
      minBlockSize: cs.minBlockSize, maxBlockSize: cs.maxBlockSize,
      flex: cs.flex, overflow: cs.overflow,
    };
  }
  return {
    viewport: { w: window.innerWidth, h: window.innerHeight },
    scrollHeight: document.documentElement.scrollHeight,
    layout: info('.kernel-chat-layout'),
    paneCenter: info('.kernel-chat-layout__pane--center'),
    paneLeft: info('.kernel-chat-layout__pane--left'),
    paneRight: info('.kernel-chat-layout__pane--right'),
    toolbar: info('.kernel-chat-toolbar'),
    thread: info('.kernel-chat-thread'),
    messages: info('.kernel-chat-thread__messages'),
    composer: info('.kernel-chat-composer'),
    pageHeader: info('.kernel-page-header'),
    kernelMain: info('.kernel-main'),
  };
});

console.log(JSON.stringify(debug, null, 2));
await browser.close();
