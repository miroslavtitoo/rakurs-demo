import { chromium, expect } from "@playwright/test";
import fs from "node:fs/promises";
import { rewardDay } from "../src/rewards.js";
const browser = await chromium.launch({ channel: "msedge" });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const base = process.env.DEMO_URL || "http://localhost:5173/", errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await fs.mkdir("tmp/benefits-v10", { recursive: true });
try {
  await page.addInitScript((day) => {
    if (localStorage.getItem("wheel-test-seeded")) return;
    localStorage.setItem("wheel-test-seeded", "true");
    localStorage.setItem("rakurs:pdfOnboardingSeen", "true");
    localStorage.setItem("rakurs:demoUser", JSON.stringify({ name: "Алина", telegramId: 123456, method: "telegram" }));
    localStorage.setItem("rakurs:rewardsWallet", JSON.stringify({ balance: 40, lastShownDay: day }));
  }, rewardDay());
  await page.goto(base + "#/profile");
  await page.locator(".profile-wheel-card").click();
  await page.evaluate(() => { crypto.getRandomValues = (a) => { a[0] = Math.floor(7.5 / 8 * 4294967296); return a; }; });
  const spin = page.locator(".wheel-spin-button");
  await spin.click();
  await expect(spin).toBeDisabled();
  await spin.dispatchEvent("click");
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("rakurs:rewardsWallet")).spinCount)).toBe(1);
  await page.waitForTimeout(500);
  await page.screenshot({ path: "tmp/benefits-v10/wheel-moving.png" });
  await expect(page.locator(".wheel-result")).toContainText("Скидка 30%", { timeout: 7000 });
  await expect(spin).toBeEnabled();
  const angle = await page.locator(".fortune-disk").evaluate((el) => {
    const matrix = new DOMMatrix(getComputedStyle(el).transform);
    return Math.atan2(matrix.b, matrix.a) * 180 / Math.PI;
  });
  expect(Math.abs(angle - 45)).toBeLessThan(0.1);
  await page.screenshot({ path: "tmp/benefits-v10/wheel-finished.png" });
  await page.evaluate(() => { crypto.getRandomValues = (a) => { a[0] = Math.floor(3.5 / 8 * 4294967296); return a; }; });
  await spin.click();
  await page.waitForTimeout(350);
  await page.reload();
  await expect(page.locator(".prize-inventory")).toContainText("Бесплатных прогнозов: 1");
  await page.locator(".profile-wheel-card").click();
  await expect(page.locator(".wheel-result")).toContainText("Бесплатный прогноз");
  await expect(page.locator(".wheel-result")).toContainText("Последний приз");
  const reopenedAngle = await page.locator(".fortune-disk").evaluate((el) => {
    const matrix = new DOMMatrix(getComputedStyle(el).transform);
    return Math.atan2(matrix.b, matrix.a) * 180 / Math.PI;
  });
  expect(Math.abs(reopenedAngle + 135)).toBeLessThan(0.1);
  const wallet = await page.evaluate(() => JSON.parse(localStorage.getItem("rakurs:rewardsWallet")));
  expect(wallet.balance).toBe(20);
  expect(wallet.spinCount).toBe(2);
  expect(wallet.coupons).toHaveLength(1);
  expect(wallet.forecastRewards).toBe(1);
  expect(errors).toEqual([]);
  console.log("PASS: actual wheel motion, matching sector/award, duplicate-click lock and reload during spin preserves cost/prize exactly once.");
} finally { await browser.close(); }
