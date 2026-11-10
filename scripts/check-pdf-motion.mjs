import { chromium, expect } from "@playwright/test";
const browser = await chromium.launch({ channel: "msedge" });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const base = process.env.DEMO_URL || "http://localhost:5173/";
try {
  await page.goto(base);
  const progress = page.locator(".pdf-progress i").first();
  const width = () => progress.evaluate((e) => parseFloat(e.style.width));
  await expect.poll(width).toBeGreaterThan(1);
  await page.getByRole("button", { name: "Пауза сторис" }).click();
  const held = await width();
  await page.waitForTimeout(300);
  expect(await width()).toBe(held);
  await page.getByRole("button", { name: "Продолжить сторис" }).click();
  await expect.poll(width).toBeGreaterThan(held);
  await page.keyboard.press("ArrowRight");
  await expect(page.locator(".pdf-story-copy")).toContainText("Откройте");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveAttribute(
    "aria-label",
    "Вход в Diverge",
  );
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.goto(base + "#/match/fox-metro");
  const orb = page.locator(".ai-orb-sphere").first();
  const a = await orb.evaluate((e) => getComputedStyle(e).transform);
  await page.waitForTimeout(500);
  expect(await orb.evaluate((e) => getComputedStyle(e).transform)).not.toBe(a);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect
    .poll(() => orb.evaluate((e) => getComputedStyle(e).animationName))
    .toBe("none");
  await page.getByRole("button", { name: "Демо · 18+", exact: true }).click();
  await expect(progress).toHaveAttribute("style", "width: 100%;");
  await page.keyboard.press("Tab");
  expect(
    await page
      .getByRole("dialog")
      .evaluate((e) => e.contains(document.activeElement)),
  ).toBe(true);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect
    .poll(() => page.locator(".market-app").evaluate((e) => e.inert))
    .toBe(false);
  console.log(
    "PASS: stories advance, pause/resume, keyboard, modal transitions, focus trap, orb animation and reduced motion.",
  );
} finally {
  await browser.close();
}
