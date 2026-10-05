import { chromium } from '@playwright/test';
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await page.goto('https://polymarket.com', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'tmp/polymarket-reference.png' });
  console.log('Reference captured');
} finally { await browser.close(); }
