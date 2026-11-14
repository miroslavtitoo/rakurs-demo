import { chromium, expect } from "@playwright/test";
import fs from "node:fs/promises";
const base = process.env.DEMO_URL || "http://localhost:5173/";
const browser = await chromium.launch({ channel: "msedge" });
const errors = [];
await fs.mkdir("tmp/telegram-window", { recursive: true });
const params = new URLSearchParams({
  tgWebAppData: "query_id=demo&auth_date=0&hash=not-a-signature",
  tgWebAppPlatform: "android",
  tgWebAppVersion: "8.0",
});
async function create(
  width = 390,
  height = 844,
  seen = null,
  unsupported = false,
) {
  const context = await browser.newContext({
    viewport: { width, height },
    reducedMotion: "reduce",
    hasTouch: true,
    isMobile: true,
  });
  await context.addInitScript(
    ({ seen, unsupported }) => {
      window.bridgeEvents = [];
      if (seen !== null)
        localStorage.setItem("rakurs:pdfOnboardingSeen", JSON.stringify(seen));
      window.TelegramWebviewProxy = {
        postEvent: (type, data) => {
          window.bridgeEvents.push({ type, data: JSON.parse(data || "{}") });
          if (type === "web_app_request_fullscreen")
            setTimeout(() => {
              const emit = window.Telegram.WebView.receiveEvent;
              if (unsupported)
                emit("fullscreen_failed", { error: "UNSUPPORTED" });
              else {
                emit("fullscreen_changed", { is_fullscreen: true });
                emit("safe_area_changed", {
                  top: 24,
                  bottom: 20,
                  left: 0,
                  right: 0,
                });
                emit("content_safe_area_changed", {
                  top: 32,
                  bottom: 0,
                  left: 0,
                  right: 0,
                });
              }
            }, 0);
        },
      };
    },
    { seen, unsupported },
  );
  const page = await context.newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(base + "#" + params);
  return { context, page };
}
try {
  for (const [width, height] of [
    [390, 844],
    [320, 568],
  ]) {
    const { context, page } = await create(width, height);
    await expect(
      page.getByRole("dialog", { name: "Знакомство с Diverge" }),
    ).toBeVisible();
    await expect
      .poll(() =>
        page.evaluate(() =>
          window.bridgeEvents.some(
            (e) =>
              e.type === "web_app_setup_swipe_behavior" &&
              e.data.allow_vertical_swipe === false,
          ),
        ),
      )
      .toBe(true);
    await expect(page.locator("html")).toHaveAttribute(
      "data-tg-fullscreen",
      "true",
    );
    await expect
      .poll(() =>
        page.evaluate(() =>
          getComputedStyle(document.documentElement)
            .getPropertyValue("--tg-top")
            .trim(),
        ),
      )
      .toBe("56px");
    const panel = await page.locator(".pdf-stories").boundingBox();
    expect(panel.y).toBe(0);
    expect(panel.height).toBe(height);
    expect(
      await page
        .locator(".m-backdrop")
        .evaluate((e) => Number(getComputedStyle(e).zIndex)),
    ).toBeGreaterThan(160);
    await expect(page.locator(".pdf-story .diverge-logo")).toBeInViewport();
    expect(
      (await page.locator(".pdf-story .diverge-logo").boundingBox()).y,
    ).toBeGreaterThanOrEqual(56);
    await expect(page.locator(".story-demo-note")).toBeInViewport();
    await expect(
      page.getByRole("button", { name: "Далее", exact: true }),
    ).toBeInViewport();
    expect(
      await page
        .locator(".pdf-story")
        .evaluate((e) => e.scrollHeight <= e.clientHeight + 1),
    ).toBe(true);
    await page.screenshot({ path: `tmp/telegram-window/first-${width}.png` });
    for (let i = 0; i < 4; i++) {
      await page.getByRole("button", { name: `Сторис ${i + 1} из 4` }).click();
      const art = await page.locator(".live-story-art>div").boundingBox(),
        copy = await page.locator(".pdf-story-copy").boundingBox();
      expect(
        art.y + art.height,
        `story ${i} must not overlap text`,
      ).toBeLessThanOrEqual(copy.y + 2);
    }
    // An unfinished first visit must still show onboarding after a reload.
    await page.reload();
    await expect(page.locator(".pdf-stories")).toBeVisible();
    await page.getByRole("button", { name: "Пропустить", exact: true }).click();
    expect(
      await page.evaluate(() =>
        localStorage.getItem("rakurs:pdfOnboardingSeen"),
      ),
    ).toBe("true");
    await page
      .getByRole("button", { name: /Смотреть без регистрации/ })
      .click();
    await page.reload();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.locator("main>[data-route]")).toHaveAttribute(
      "data-route",
      "/",
    );
    // Login and logout must not replay the already dismissed first-visit stories.
    await page.goto(base + "#/match/fox-metro");
    await page.getByRole("button", { name: /Купить прогноз/ }).click();
    await page.getByLabel("Номер телефона").fill("123");
    await page.getByRole("button", { name: "Войти", exact: true }).click();
    await expect(page.getByRole("dialog")).toHaveAttribute(
      "aria-label",
      "Оформление заказа",
    );
    await expect(page.locator(".pdf-stories")).toHaveCount(0);
    await page.getByRole("button", { name: "Закрыть", exact: true }).click();
    await page.goto(base + "#/profile");
    await page
      .getByRole("button", { name: "Выйти из демопрофиля", exact: true })
      .click();
    await page.goto(base + "#" + params);
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await page.getByRole("button", { name: "Демо · 18+", exact: true }).click();
    await expect(page.locator(".pdf-stories")).toBeVisible();
    await context.close();
  }
  const fallback = await create(390, 844, true, true);
  await expect(fallback.page.getByRole("dialog")).toHaveCount(0);
  await expect(fallback.page.locator(".pdf-event").first()).toBeVisible();
  await fallback.context.close();
  const corrupt = await create(390, 844, "false");
  await expect(corrupt.page.locator(".pdf-stories")).toBeVisible();
  await corrupt.context.close();
  expect(errors).toEqual([]);
  console.log(
    "PASS: actual Telegram SDK bridge fullscreen/swipe events, inset-aware fullscreen overlay at 390/320, first visit/reload/guest/login/logout, explicit replay, invalid marker and unsupported fallback.",
  );
} finally {
  await browser.close();
}
