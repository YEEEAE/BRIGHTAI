import { chromium } from 'playwright';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  await page.goto('https://brightai.site/kernel/chat/', { waitUntil: 'load' });
  
  // Fill the query input
  await page.fill('#query-input', 'هل يمكنك مساعدتي؟');
  
  // Check if character counter updated
  const counterText = await page.textContent('#char-counter');
  console.log(`Character Counter Text: ${counterText}`);
  
  // Click send button
  await page.click('#send-btn');
  
  // Wait 3 seconds to see if messages area changes
  await page.waitForTimeout(3000);
  
  const messagesHtml = await page.innerHTML('#messages');
  console.log(`Messages Area HTML:`);
  console.log(messagesHtml);
  
  await browser.close();
}

run().catch(console.error);
