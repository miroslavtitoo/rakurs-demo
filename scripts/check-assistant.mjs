import { chromium, expect } from "@playwright/test";
import fs from "node:fs/promises";
const base = process.env.DEMO_URL || "http://localhost:5173/";
const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({
  viewport: { width: 390, height: 844 },
  reducedMotion: "reduce",
});
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await fs.mkdir("tmp/design-v6", { recursive: true });
async function route(path) {
  await page.goto(base + "#" + path);
  await expect(page.locator("main > [data-route]")).toHaveAttribute(
    "data-route",
    path,
  );
  await page.evaluate(() => document.fonts.ready);
}
async function shot(name, full = true) {
  if (full) {
    for (
      let y = 0;
      y < (await page.evaluate(() => document.body.scrollHeight));
      y += 700
    ) {
      await page.evaluate((y) => scrollTo(0, y), y);
      await page.waitForTimeout(60);
    }
    await page.evaluate(() => scrollTo(0, 0));
  }
  await page.waitForTimeout(350);
  await page.screenshot({ path: `tmp/design-v6/${name}.png`, fullPage: full });
}
try {
  await page.goto(base + "#tgWebAppVersion=8.0&tgWebAppPlatform=android");
  await expect(page.getByRole("dialog")).toBeVisible();
  await shot("stories", false);
  for (let i = 0; i < 3; i++)
    await page.getByRole("button", { name: "Дальше", exact: true }).click();
  await page
    .getByRole("button", { name: "Смотреть события", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator(".event-card")).toHaveCount(19);
  await page.getByRole("button", { name: "Теннис", exact: true }).click();
  await expect(page.locator(".event-card")).toHaveCount(3);
  await page.getByRole("button", { name: "Сейчас идут", exact: true }).click();
  await expect(page.locator(".event-card")).toHaveCount(1);
  await expect(page.locator(".event-card")).toContainText("По сетам");
  await page.getByRole("button", { name: "Все", exact: true }).click();
  await page.getByRole("button", { name: "Завершённые", exact: true }).click();
  await expect(page.locator(".event-card")).toHaveCount(5);
  await expect(
    page.locator(".event-card").filter({ hasText: "Не сбылся" }),
  ).toHaveCount(2);
  await page.getByLabel("Поиск события").fill("нет такой команды");
  await expect(
    page.getByRole("heading", { name: "Ничего не найдено" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Сбросить фильтры" }).click();
  await page
    .getByRole("button", { name: "Сохранить: fox-metro", exact: true })
    .click();
  await route("/match/fox-metro");
  await expect(page.locator(".analysis-dashboard")).toHaveCount(0);
  await expect(page.locator("main")).not.toContainText("65%");
  await shot("locked-mobile");
  await page
    .getByRole("button", { name: "Купить прогноз · 199 ₽", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText("199 ₽");
  await shot("checkout", false);
  await page
    .getByRole("button", { name: "Открыть без списания", exact: true })
    .click();
  await expect(page.locator(".analysis-dashboard")).toBeVisible();
  await page.reload();
  await expect(page.locator(".analysis-dashboard")).toBeVisible();
  await page.getByRole("button", { name: "Почему 65%?", exact: true }).click();
  await expect(page.locator(".math-table tfoot")).toContainText("65%");
  await shot("calculation", false);
  await page.keyboard.press("Escape");
  await page
    .locator(".evidence-card")
    .filter({ hasText: "Публичный контекст" })
    .click();
  await expect(page.getByRole("dialog")).toContainText("0 п.п.");
  await expect(page.getByRole("dialog")).toContainText("не доказывают");
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", { name: "Чат по событию", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Почему такая вероятность?", exact: true })
    .click();
  await expect(page.locator(".assistant-chat-bubble").last()).toContainText(
    "65%",
  );
  await page
    .getByRole("textbox", { name: "Сообщение AI" })
    .fill("Если по моим данным игрок пропустил тренировку?");
  await page.getByRole("button", { name: "Отправить сообщение" }).click();
  await expect(page.locator(".assistant-chat-bubble").last()).toContainText(
    "гипотезу",
  );
  await shot("chat-mobile", false);
  await page.setViewportSize({ width: 390, height: 500 });
  await expect(
    page.getByRole("textbox", { name: "Сообщение AI" }),
  ).toBeInViewport();
  await page.keyboard.press("Escape");
  await page.setViewportSize({ width: 390, height: 844 });
  await route("/match/fox-metro");
  await page
    .getByRole("button", { name: "Чат по событию", exact: true })
    .click();
  await expect(page.locator(".user-chat-bubble").last()).toContainText(
    "пропустил тренировку",
  );
  await page.keyboard.press("Escape");
  await route("/subscription");
  await page
    .getByRole("button", { name: "Попробовать подписку", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Активировать без списания", exact: true })
    .click();
  await expect(page.locator(".subscription-active")).toBeVisible();
  await route("/match/atlas-river");
  await expect(page.locator(".analysis-dashboard")).toBeVisible();
  await page
    .getByRole("button", { name: "Чат по событию", exact: true })
    .click();
  await expect(page.locator(".user-chat-bubble")).toHaveCount(0);
  await page
    .getByRole("textbox", { name: "Сообщение AI" })
    .fill("Какой счёт сейчас?");
  await page.getByRole("button", { name: "Отправить сообщение" }).click();
  await expect(page.locator(".assistant-chat-bubble").last()).toContainText(
    "1 : 0",
  );
  await page.keyboard.press("Escape");
  await route("/subscription");
  await page
    .getByRole("button", { name: "Завершить демоподписку", exact: true })
    .click();
  await route("/match/atlas-river");
  await expect(page.locator(".analysis-dashboard")).toHaveCount(0);
  await route("/match/fox-metro");
  await expect(page.locator(".analysis-dashboard")).toBeVisible();
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const [name, path] of [
      ["catalog", "/"],
      ["dashboard", "/match/fox-metro"],
      ["live", "/match/atlas-river"],
      ["past", "/match/cs-final"],
      ["library", "/library"],
      ["subscription", "/subscription"],
    ]) {
      await route(path);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `${name} ${width}`,
      ).toBe(true);
      if (width === 390 || width === 1440) await shot(`${name}-${width}`);
    }
  }
  await page.setViewportSize({ width: 320, height: 568 });
  await page.locator(".demo-badge").click();
  await expect(
    page.getByRole("button", { name: "Дальше", exact: true }),
  ).toBeInViewport();
  await page.keyboard.press("Escape");
  await expect(page.locator(".demo-badge")).toBeFocused();
  const expired = await browser.newPage();
  await expired.addInitScript(() => {
    localStorage.setItem("rakurs:assistantOnboardingSeen", "true");
    localStorage.setItem(
      "rakurs:aiSubscription",
      JSON.stringify({ expiresAt: Date.now() - 1 }),
    );
  });
  await expired.goto(base + "#/match/atlas-river");
  await expect(expired.locator(".analysis-dashboard")).toHaveCount(0);
  await expired.close();
  const old = await browser.newPage();
  await old.addInitScript(() => {
    localStorage.setItem("rakurs:assistantOnboardingSeen", "true");
    localStorage.setItem("rakurs:purchases", '["read-fox-metro"]');
  });
  await old.goto(base + "#/read/read-fox-metro");
  await expect(old.locator(".analysis-dashboard")).toBeVisible();
  await old.close();
  const native = await browser.newPage({
    viewport: { width: 390, height: 844 },
    reducedMotion: "reduce",
  });
  native.on("pageerror", (e) => errors.push(e.message));
  await native.route("https://telegram.org/js/telegram-web-app.js", (r) =>
    r.fulfill({ contentType: "text/javascript", body: "" }),
  );
  await native.addInitScript(() => {
    localStorage.setItem("rakurs:assistantOnboardingSeen", "true");
    window.__tgCalls = [];
    window.__tgBack = null;
    window.Telegram = {
      WebApp: {
        initData: "demo",
        isVersionAtLeast: () => true,
        ready: () => window.__tgCalls.push("ready"),
        expand: () => window.__tgCalls.push("expand"),
        setHeaderColor: () => {},
        setBackgroundColor: () => {},
        setBottomBarColor: () => {},
        safeAreaInset: { top: 20, bottom: 15 },
        contentSafeAreaInset: { top: 10 },
        onEvent: () => {},
        offEvent: () => {},
        HapticFeedback: { selectionChanged: () => {} },
        BackButton: {
          show: () => {},
          hide: () => {},
          onClick: (f) => (window.__tgBack = f),
          offClick: () => (window.__tgBack = null),
        },
      },
    };
  });
  await native.goto(base + "#/match/fox-metro");
  await expect
    .poll(() =>
      native.evaluate(() =>
        getComputedStyle(document.documentElement).getPropertyValue("--tg-top"),
      ),
    )
    .toBe("30px");
  expect(await native.evaluate(() => window.__tgCalls)).toContain("ready");
  await native
    .getByRole("button", { name: "Купить прогноз · 199 ₽", exact: true })
    .click();
  await native.evaluate(() => window.__tgBack());
  await expect(native.getByRole("dialog")).toHaveCount(0);
  await native.evaluate(() => window.__tgBack());
  await expect(native.locator("main > [data-route]")).toHaveAttribute(
    "data-route",
    "/",
  );
  await native.close();
  expect(errors).toEqual([]);
  console.log(
    "PASS: 19 events, sports/status/search, paywall, purchase persistence, auditable calculation, zero unsupported factors, per-event chat, subscription activation/revocation/expiry, old purchases, 30 responsive checks.",
  );
} finally {
  await browser.close();
}
