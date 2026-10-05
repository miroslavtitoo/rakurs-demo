import { chromium } from "@playwright/test";
import fs from "node:fs/promises";
await fs.mkdir("tmp/screenshots", { recursive: true });
const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({
  viewport: { width: 1440, height: 1100 },
  deviceScaleFactor: 1,
});
await page.addInitScript(() => localStorage.setItem("rakurs:onboardingSeen", "true"));
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto("http://localhost:5173/");
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(900);
await page.screenshot({ path: "tmp/screenshots/desktop.png", fullPage: true });
await page.setViewportSize({ width: 390, height: 844 });
await page.screenshot({ path: "tmp/screenshots/mobile.png", fullPage: true });
console.log(
  JSON.stringify({
    errors,
    overflow: await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  }),
);
await browser.close();
