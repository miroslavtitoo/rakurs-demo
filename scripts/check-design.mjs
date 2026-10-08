import { chromium, expect } from "@playwright/test";
import fs from "node:fs/promises";

const base = process.env.DEMO_URL || "http://localhost:5173/";
const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
await page.addInitScript(() => {
  localStorage.setItem("rakurs:assistantOnboardingSeen", "true");
  localStorage.setItem("rakurs:aiPurchases", '["fox-metro","atlas-river"]');
});
await fs.mkdir("tmp/design-v7", { recursive: true });
try {
  await page.goto(base);
  await page.evaluate(() => document.fonts.ready);
  const orb = page.locator(".ai-orb-sphere").first();
  const before = await orb.evaluate((el) => getComputedStyle(el).transform);
  await page.waitForTimeout(550);
  expect(await orb.evaluate((el) => getComputedStyle(el).transform)).not.toBe(
    before,
  );
  await page.screenshot({ path: "tmp/design-v7/catalog-viewport.png" });
  await page.goto(base + "#/match/fox-metro");
  await page.locator(".probability-panel").scrollIntoViewIfNeeded();
  await page.waitForTimeout(1200);
  expect(
    await page
      .locator(".probability-orbit circle")
      .last()
      .evaluate((el) => parseFloat(getComputedStyle(el).strokeDasharray)),
  ).toBe(65);
  await page.screenshot({ path: "tmp/design-v7/dashboard-viewport.png" });
  await page.locator(".evidence-card").first().click();
  await expect(page.getByRole("dialog")).toContainText(
    "Протоколы последних пяти встреч",
  );
  await expect(page.getByRole("dialog")).toHaveCSS("opacity", "1");
  await page.waitForTimeout(250);
  await page.screenshot({ path: "tmp/design-v7/factor-modal.png" });
  await page.keyboard.press("Tab");
  expect(
    await page.evaluate(
      () => !!document.activeElement.closest('[role="dialog"]'),
    ),
  ).toBe(true);
  await page.keyboard.press("Escape");
  await expect(page.locator(".evidence-card").first()).toBeFocused();
  await page.emulateMedia({ reducedMotion: "reduce" });
  expect(
    await page
      .locator(".ai-orb-sphere")
      .evaluate((el) => getComputedStyle(el).animationName),
  ).toBe("none");
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    for (const id of ["fox-metro", "atlas-river"]) {
      await page.goto(base + "#/match/" + id);
      await page.locator(".probability-verdict button").click();
      await expect(page.getByRole("dialog")).toHaveCSS("opacity", "1");
      await page.waitForTimeout(250);
      expect(
        await page
          .locator(".math-table-wrap")
          .evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
        `All probability columns readable at ${width} / ${id}`,
      ).toBe(true);
      await page.screenshot({ path: `tmp/design-v7/math-${id}-${width}.png` });
      await page.keyboard.press("Escape");
    }
  }
  expect(errors).toEqual([]);
  console.log(
    "PASS: visible orb motion, completed probability animation, factor modal + focus, reduced motion, all 2/3-outcome calculation columns at 320 and 390.",
  );
} finally {
  await browser.close();
}
