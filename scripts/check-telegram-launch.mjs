import { chromium, expect } from "@playwright/test";

const base = process.env.DEMO_URL || "http://localhost:5173/";
const browser = await chromium.launch({
  channel: process.env.PLAYWRIGHT_CHANNEL || "msedge",
  headless: true,
});
// Synthetic launch data only; never use a real Telegram user's signed initData.
const initData = "query_id=demo-launch&auth_date=0&hash=demo-not-a-signature";
const params = new URLSearchParams({
  tgWebAppData: initData,
  tgWebAppVersion: "8.0",
  tgWebAppPlatform: "android",
  tgWebAppThemeParams: JSON.stringify({
    bg_color: "#0c0d0f",
    text_color: "#eceef0",
  }),
}).toString();
const cases = [
  ["#" + params, "/"],
  ["#?" + params, "/"],
  ["#/?" + params, "/"],
  ["#/match/fox-metro?" + params, "/match/fox-metro"],
  ["#/match/fox-metro&" + params, "/match/fox-metro"],
];
const errors = [];
try {
  for (const [hash, route] of cases) {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      reducedMotion: "reduce",
    });
    await context.addInitScript(() =>
      localStorage.setItem("rakurs:marketOnboardingSeen", "true"),
    );
    const page = await context.newPage();
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(base + hash);
    await expect(page.locator("main > [data-route]")).toHaveAttribute(
      "data-route",
      route,
    );
    await expect(
      page.getByText("Такого экрана нет", { exact: true }),
    ).toHaveCount(0);
    if (!hash.includes("&" + params)) {
      // The real Telegram SDK must retain its launch data after route parsing.
      await expect
        .poll(() => page.evaluate(() => window.Telegram?.WebApp?.initData))
        .toBe(initData);
    }
    await page.reload();
    await expect(page.locator("main > [data-route]")).toHaveAttribute(
      "data-route",
      route,
    );
    await page
      .locator(".bottom-nav")
      .getByRole("button", { name: "Мои прогнозы" })
      .click();
    await expect(page.locator("main > [data-route]")).toHaveAttribute(
      "data-route",
      "/library",
    );
    await page.goBack();
    await expect(page.locator("main > [data-route]")).toHaveAttribute(
      "data-route",
      route,
    );
    await context.close();
  }
  expect(errors).toEqual([]);
  console.log(
    "PASS: 5 Telegram launch hashes, real SDK initData, reload, navigation and browser Back. No page errors.",
  );
} finally {
  await browser.close();
}
