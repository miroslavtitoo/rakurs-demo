import { chromium, expect } from '@playwright/test';
import fs from 'node:fs/promises';
const base = process.env.DEMO_URL || 'http://localhost:5173/';
const browser = await chromium.launch({ channel: 'msedge', headless: true });
await fs.mkdir('tmp/design-v4', { recursive: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
const errors = [];
page.on('pageerror', e => errors.push(e.message));
async function route(path) {
  await page.goto(base + '#' + path);
  await expect(page.locator('main>[data-route]')).toHaveAttribute('data-route', path);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(350);
}
try {
  await page.goto(base + '#tgWebAppVersion=8.0&tgWebAppPlatform=android');
  await expect(page.getByRole('dialog', { name: 'Знакомство с Ракурсом' })).toBeVisible();
  await page.waitForTimeout(600);
  await page.screenshot({ path: 'tmp/design-v4/story-1.png' });
  await page.getByRole('button', { name: 'Дальше', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Сторис 2 из 5' })).toHaveAttribute('aria-current','step');
  await page.getByRole('button', { name: 'Предыдущая сторис' }).click();
  await expect(page.getByRole('button', { name: 'Сторис 1 из 5' })).toHaveAttribute('aria-current','step');
  const stage = await page.locator('.story-stage').boundingBox();
  await page.mouse.move(stage.x + stage.width * .8, stage.y + 120);
  await page.mouse.down();
  await page.mouse.move(stage.x + stage.width * .2, stage.y + 120, { steps: 8 });
  await page.mouse.up();
  await expect(page.getByRole('button', { name: 'Сторис 2 из 5' })).toHaveAttribute('aria-current','step');
  await page.setViewportSize({ width: 320, height: 568 });
  await expect(page.getByRole('button', { name: 'Дальше', exact: true })).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.setViewportSize({ width: 390, height: 844 });
  for (let i = 2; i <= 5; i++) {
    await page.getByRole('button', { name: `Сторис ${i} из 5` }).click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: `tmp/design-v4/story-${i}.png` });
  }
  await page.getByRole('button', { name: 'Открыть Ракурс', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem('rakurs:onboardingSeen'))).toBe('true');
  await page.reload();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.locator('.demo-badge').click();
  await expect(page.getByRole('dialog', { name: 'Знакомство с Ракурсом' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('.demo-badge')).toBeFocused();
  const hotRail = page.locator('.hot-events .horizontal-rail');
  await page.getByRole('button', { name: 'Горячие события: вперёд' }).click();
  await expect.poll(() => hotRail.evaluate(el => el.scrollLeft)).toBeGreaterThan(30);
  await page.getByRole('button', { name: 'Горячие события: назад' }).click();
  await page.locator('.hot-open').first().click();
  await expect(page.locator('main>[data-route]')).toHaveAttribute('data-route','/match/fox-metro');
  await page.getByRole('button', { name: 'Контекст решает: вперёд' }).click();
  await expect.poll(() => page.locator('.context-rail .horizontal-rail').evaluate(el => el.scrollLeft)).toBeGreaterThan(30);
  await page.getByRole('tab', { name: 'Тоталы', exact: true }).click();
  await expect(page.locator('.market-options')).toContainText('Больше 2,5 карт');
  await page.locator('.market-options button').last().click();
  await expect(page.locator('.dashboard-chart-head h3')).toHaveText('Меньше 2,5 карт');
  await page.getByRole('button', { name: '6 ч', exact: true }).click();
  await expect(page.locator('.chart-labels')).toContainText('08:30');
  await page.getByRole('button', { name: 'Объяснить матч', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Ракурс AI' })).toBeVisible();
  await page.waitForTimeout(600);
  await page.screenshot({ path: 'tmp/design-v4/chat-mobile.png' });
  await page.getByRole('button', { name: 'Что может изменить оценку?' }).click();
  await expect(page.locator('.ai-answer').last()).toContainText('Veto');
  await page.getByRole('textbox', { name: 'Ваш вопрос о матче' }).fill('Есть новости?');
  await page.getByRole('button', { name: 'Задать вопрос', exact: true }).click();
  await expect(page.locator('.chat-message.user').last()).toContainText('Есть новости?');
  await expect(page.locator('.ai-answer').last()).toContainText('Свободный диалог');
  await page.setViewportSize({ width: 390, height: 500 });
  await expect(page.getByRole('textbox', { name: 'Ваш вопрос о матче' })).toBeInViewport();
  await expect(page.getByRole('button', { name: 'Задать вопрос', exact: true })).toBeInViewport();
  await page.keyboard.press('Escape');
  for (const width of [320,390,768,1024,1440]) {
    await page.setViewportSize({ width, height: 844 });
    for (const [name, path] of [['overview','/'],['match','/match/fox-metro'],['football','/match/atlas-river'],['analysts','/analysts'],['author','/author/mark'],['read','/read/read-fox-metro'],['library','/library'],['studio','/studio']]) {
      await route(path);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${name} overflow at ${width}`).toBe(true);
      if ((width === 390 || width === 1440) && ['overview','match','football','studio'].includes(name)) {
        for (let y=0; y < await page.evaluate(() => document.body.scrollHeight); y+=650) { await page.evaluate(y => scrollTo(0,y),y); await page.waitForTimeout(120); }
        await page.waitForTimeout(500);
        await page.evaluate(() => scrollTo(0,0));
        await page.screenshot({ path: `tmp/design-v4/${name}-${width}.png`, fullPage: true });
      }
    }
  }
  expect(errors).toEqual([]);
  const animated = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await animated.clock.install();
  await animated.goto(base);
  await expect(animated.getByRole('dialog')).toBeVisible();
  await animated.getByRole('button', { name: 'Пауза сторис' }).click();
  await animated.clock.runFor(10000);
  await expect(animated.getByRole('button', { name: 'Сторис 1 из 5' })).toHaveAttribute('aria-current', 'step');
  await animated.getByRole('button', { name: 'Продолжить сторис' }).click();
  await animated.clock.runFor(9200);
  await expect(animated.getByRole('button', { name: 'Сторис 2 из 5' })).toHaveAttribute('aria-current', 'step');
  await animated.close();
  console.log('PASS: first visit, five stories, completion, persistence, replay, focus, event/context rails, markets, chart periods, chat conversation, 40 route/width checks.');
} finally { await browser.close(); }
