import { chromium, expect } from '@playwright/test';
import fs from 'node:fs/promises';
const browser = await chromium.launch({ channel: 'msedge', headless: true });
await fs.mkdir('tmp/design-v3', { recursive: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = [];
page.on('pageerror', e => errors.push(e.message));
try {
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 950 });
    for (const [name, route] of [['overview','/'], ['match','/match/fox-metro'], ['analysts','/analysts'], ['profile','/author/mark'], ['studio','/studio']]) {
      await page.goto('http://localhost:5173/#' + route);
      await page.waitForFunction(route => document.querySelector('main>[data-route]')?.dataset.route === route, route);
      await page.evaluate(() => document.fonts.ready);
      // Trigger in-view animation and lazy images before capturing the whole page.
      for (let y = 0; y < await page.evaluate(() => document.body.scrollHeight); y += 600) {
        await page.evaluate(y => scrollTo(0, y), y);
        await page.waitForTimeout(100);
      }
      await page.waitForTimeout(700);
      await page.evaluate(() => scrollTo(0,0));
      await page.waitForTimeout(400);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      expect(await page.locator('.team-mark').evaluateAll(marks => marks.every(el => el.querySelector('svg') && !el.textContent.trim()))).toBe(true);
      expect(await page.locator('.avatar img').evaluateAll(images => images.every(img => img.complete && img.naturalWidth > 0))).toBe(true);
      if (width === 390 || width === 1440) await page.screenshot({ path: `tmp/design-v3/${name}-${width}.png`, fullPage: true });
    }
  }
  await page.goto('http://localhost:5173/');
  await page.waitForTimeout(900);
  await page.evaluate(() => scrollTo(0,600));
  await page.waitForTimeout(500);
  expect(await page.locator('.reading-progress').evaluate(el => getComputedStyle(el).transform !== 'none')).toBe(true);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('.reading-progress')).toBeHidden();
  expect(await page.locator('.ambient-light i').first().evaluate(el => getComputedStyle(el).animationName)).toBe('none');
  expect(errors).toEqual([]);
  console.log('PASS: 25 responsive route checks; SVG identities, loaded portraits, scroll effects and reduced motion; no overflow or page errors.');
} finally { await browser.close(); }
