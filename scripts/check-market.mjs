import { chromium, expect } from "@playwright/test";
import fs from "node:fs/promises";
const base = process.env.DEMO_URL || "http://localhost:5173/";
const browser = await chromium.launch({
  channel: process.env.PLAYWRIGHT_CHANNEL || "msedge",
  headless: true,
});
await fs.mkdir("tmp/design-v5", { recursive: true });
const page = await browser.newPage({
  viewport: { width: 390, height: 844 },
  reducedMotion: "reduce",
});
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
async function route(path) {
  await page.goto(base + "#" + path);
  await expect(page.locator("main > [data-route]")).toHaveAttribute(
    "data-route",
    path,
  );
  await page.evaluate(() => document.fonts.ready);
}
async function shot(name, fullPage = true) {
  await page.waitForTimeout(300);
  if (fullPage) {
    for (
      let y = 0;
      y < (await page.evaluate(() => document.body.scrollHeight));
      y += 650
    ) {
      await page.evaluate((y) => scrollTo(0, y), y);
      await page.waitForTimeout(50);
    }
    await page.evaluate(() => scrollTo(0, 0));
  }
  await page.waitForTimeout(450);
  await page.screenshot({ path: `tmp/design-v5/${name}.png`, fullPage });
}
try {
  await page.goto(base + "#tgWebAppVersion=8.0&tgWebAppPlatform=android");
  await expect(
    page.getByRole("dialog", { name: "Знакомство с Ракурсом" }),
  ).toBeVisible();
  await shot("stories-mobile", false);
  for (let i = 0; i < 3; i++)
    await page.getByRole("button", { name: "Дальше", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Смотреть прогнозы", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "AI-прогнозы", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".forecast-card")).toHaveCount(10);
  const firstBuy = await page
    .locator(".forecast-card")
    .first()
    .locator(".m-button")
    .boundingBox();
  const mobileNav = await page.locator(".bottom-nav").boundingBox();
  expect(
    firstBuy.y + firstBuy.height,
    "first purchase action is above mobile navigation",
  ).toBeLessThan(mobileNav.y);
  await page.locator(".demo-badge").click();
  await page.keyboard.press("Escape");
  await expect(page.locator(".demo-badge")).toBeFocused();
  await page
    .getByRole("textbox", { name: "Найти команду или прогноз" })
    .fill("несуществующая");
  await expect(
    page.getByRole("heading", { name: "Ничего не нашлось" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Сбросить фильтры" }).click();
  await page
    .locator(".market-toolbar")
    .getByRole("button", { name: "Футбол", exact: true })
    .click();
  expect(
    await page.locator(".forecast-card .sport-label").allTextContents(),
  ).toEqual(Array(5).fill("Футбол"));
  await page
    .locator(".market-toolbar")
    .getByRole("button", { name: "Все", exact: true })
    .click();
  await page.getByLabel("Сортировка").selectOption("price");
  await expect(page.locator(".forecast-card").first()).toContainText(
    "Открыть бесплатно",
  );
  await page.getByLabel("Сортировка").selectOption("recommended");
  await page
    .getByRole("button", { name: "Сохранить: fox-metro", exact: true })
    .click();
  await page
    .locator(".forecast-card")
    .first()
    .getByRole("button", { name: "Почему?", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText("Победа Northern Foxes");
  await page
    .getByRole("button", { name: "Что значит %?", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText("58 случаях из 100");
  await shot("explanation-mobile", false);
  await page.keyboard.press("Escape");
  await page
    .locator(".forecast-card")
    .first()
    .getByRole("button", { name: "Купить · 390 ₽", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText("Деньги не спишутся");
  await shot("checkout-mobile", false);
  await page
    .getByRole("button", { name: "Открыть без списания", exact: true })
    .click();
  await expect(page.locator(".unlocked-forecast")).toBeVisible();
  await page.reload();
  await expect(page.locator(".unlocked-forecast")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Купить прогноз", exact: true }),
  ).toHaveCount(0);
  await page
    .locator(".bottom-nav")
    .getByRole("button", { name: "Мои прогнозы", exact: true })
    .click();
  await expect(page.locator(".forecast-card")).toHaveCount(1);
  await page.getByRole("button", { name: "Избранное", exact: false }).click();
  await expect(page.locator(".forecast-card")).toHaveCount(1);
  await route("/match/porto-royal");
  await page
    .getByRole("button", { name: "Открыть бесплатно", exact: true })
    .click();
  await expect(page.locator(".unlocked-forecast")).toBeVisible();
  await route("/results");
  await expect(page.locator(".results-list .result-row")).toHaveCount(12);
  await page.locator(".result-row").nth(1).click();
  await expect(page.getByRole("dialog")).toContainText("Не сбылся");
  await page.keyboard.press("Escape");
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const [name, path] of [
      ["market", "/"],
      ["detail", "/match/fox-metro"],
      ["football", "/match/atlas-river"],
      ["library", "/library"],
      ["results", "/results"],
    ]) {
      await route(path);
      await page.waitForTimeout(200);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `${path} at ${width}`,
      ).toBe(true);
      expect(await page.locator("main").innerText()).not.toMatch(
        /Марк Волков|Кабинет автора|Аналитики|Независимый взгляд/,
      );
      if (width === 390 || width === 1440) await shot(`${name}-${width}`);
    }
  }
  await page.setViewportSize({ width: 320, height: 568 });
  await page.locator(".demo-badge").click();
  await expect(
    page.getByRole("button", { name: "Дальше", exact: true }),
  ).toBeInViewport();
  await page.keyboard.press("Escape");
  await route("/match/atlas-river");
  await page
    .getByRole("button", {
      name: "Почему AI выбрал этот прогноз?",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("button", { name: "Какие риски?", exact: true }),
  ).toBeInViewport();
  await page.keyboard.press("Escape");
  for (const legacy of ["/analysts", "/studio", "/author/mark"]) {
    await page.goto(base + "#" + legacy);
    await expect(page.locator("main > [data-route]")).toHaveAttribute(
      "data-route",
      "/",
    );
  }
  await page.goto(base + "#/read/read-fox-metro");
  await expect(page.locator("main > [data-route]")).toHaveAttribute(
    "data-route",
    "/match/fox-metro",
  );
  const migrated = await browser.newPage();
  await migrated.addInitScript(() => {
    localStorage.setItem("rakurs:marketOnboardingSeen", "true");
    localStorage.setItem("rakurs:purchases", '["read-fox-metro"]');
  });
  await migrated.goto(base + "#/match/fox-metro");
  await expect(migrated.locator(".unlocked-forecast")).toBeVisible();
  await migrated.close();
  // Exercise stories with motion enabled, then the Telegram native controls.
  const animated = await browser.newPage({
    viewport: { width: 390, height: 844 },
  });
  animated.on("pageerror", (e) => errors.push(e.message));
  await animated.clock.install();
  await animated.goto(base);
  await animated
    .getByRole("button", { name: "Пауза сторис", exact: true })
    .click();
  await animated.clock.runFor(9000);
  await expect(
    animated.getByRole("button", { name: "Сторис 1 из 4", exact: true }),
  ).toHaveAttribute("aria-current", "step");
  await animated
    .getByRole("button", { name: "Продолжить сторис", exact: true })
    .click();
  await animated.clock.runFor(8200);
  await expect(
    animated.getByRole("button", { name: "Сторис 2 из 4", exact: true }),
  ).toHaveAttribute("aria-current", "step");
  const box = await animated.locator(".market-story-stage").boundingBox();
  await animated.mouse.move(box.x + 40, box.y + 100);
  await animated.mouse.down();
  await animated.mouse.move(box.x + 220, box.y + 100, { steps: 8 });
  await animated.mouse.up();
  await expect(
    animated.getByRole("button", { name: "Сторис 1 из 4", exact: true }),
  ).toHaveAttribute("aria-current", "step");
  await animated.close();
  const tg = await browser.newPage({
    viewport: { width: 390, height: 844 },
    reducedMotion: "reduce",
  });
  tg.on("pageerror", (e) => errors.push(e.message));
  await tg.route("https://telegram.org/js/telegram-web-app.js", (r) =>
    r.fulfill({ contentType: "text/javascript", body: "" }),
  );
  await tg.addInitScript(() => {
    localStorage.setItem("rakurs:marketOnboardingSeen", "true");
    window.__tgCalls = [];
    window.__tgBack = null;
    window.Telegram = {
      WebApp: {
        initData: "synthetic-demo",
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
          onClick: (fn) => (window.__tgBack = fn),
          offClick: () => (window.__tgBack = null),
        },
      },
    };
  });
  await tg.goto(base + "#/match/fox-metro");
  await expect
    .poll(() =>
      tg.evaluate(() =>
        getComputedStyle(document.documentElement).getPropertyValue("--tg-top"),
      ),
    )
    .toBe("30px");
  expect(await tg.evaluate(() => window.__tgCalls)).toContain("ready");
  await tg
    .getByRole("button", {
      name: "Почему AI выбрал этот прогноз?",
      exact: true,
    })
    .click();
  await tg.evaluate(() => window.__tgBack());
  await expect(tg.getByRole("dialog")).toHaveCount(0);
  await tg.evaluate(() => window.__tgBack());
  await expect(tg.locator("main > [data-route]")).toHaveAttribute(
    "data-route",
    "/",
  );
  await tg.close();
  expect(errors).toEqual([]);
  console.log(
    "PASS: onboarding, replay/focus, search, filters, sorting, favorites, AI explanation, paid/free demo access, persistence, results, legacy links/purchases, 25 responsive checks; no page errors.",
  );
} finally {
  await browser.close();
}
