import { chromium, expect } from "@playwright/test";
import fs from "node:fs/promises";
const base = process.env.DEMO_URL || "http://localhost:5173/";
await fs.mkdir("tmp/screenshots", { recursive: true });
const browser = await chromium.launch({
  channel: process.env.PLAYWRIGHT_CHANNEL || "msedge",
  headless: true,
});
const page = await browser.newPage({
  viewport: { width: 1440, height: 1000 },
  reducedMotion: "reduce",
});
await page.addInitScript(() => localStorage.setItem("rakurs:onboardingSeen", "true"));
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const goto = async (path) => {
  await page.goto(base + "#" + path);
  await page.waitForFunction((path) => {
    const root = document.querySelector("main>[data-route]");
    return (
      root?.dataset.route === path && getComputedStyle(root).opacity === "1"
    );
  }, path);
  await page.evaluate(() => document.fonts.ready);
};
const screenshot = async (name) => {
  await page.waitForTimeout(1100);
  await page.screenshot({
    path: "tmp/screenshots/" + name + ".png",
    fullPage: true,
  });
};
try {
  await goto("/");
  await expect(page.locator(".event-row")).toHaveCount(6);
  await page.getByRole("button", { name: "CS2", exact: true }).click();
  await expect(page.locator(".event-row")).toHaveCount(3);
  await page
    .getByRole("textbox", { name: "Поиск событий" })
    .fill("Northern Foxes");
  await expect(page.locator(".event-row")).toHaveCount(1);
  await page
    .getByRole("button", { name: "В избранное: Northern Foxes", exact: true })
    .click();
  await page.getByRole("textbox", { name: "Поиск событий" }).fill("xyz-never");
  await expect(page.getByText("Пока ничего не нашлось")).toBeVisible();
  await goto("/match/fox-metro");
  await page.getByRole("button", { name: "Объяснить матч" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page
    .getByRole("button", { name: "Что может изменить оценку?", exact: true })
    .click();
  await expect(page.locator(".ai-answer").last()).toContainText("Veto");
  await page
    .getByRole("textbox", { name: "Ваш вопрос о матче" })
    .fill("Каков состав?");
  await page
    .getByRole("button", { name: "Задать вопрос", exact: true })
    .click();
  await expect(page.locator(".ai-answer").last()).toContainText("Свободный диалог");
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Статистика", exact: true }).click();
  await expect(page.getByText("Победы на Mirage")).toBeVisible();
  await goto("/read/read-fox-metro");
  await page.getByRole("button", { name: "Открыть за 390 ₽" }).click();
  await expect(page.getByRole("dialog")).toContainText("0 ₽");
  await page.getByRole("button", { name: "Открыть бесплатно в демо" }).click();
  await expect(page.getByRole("dialog")).toContainText("Разбор теперь ваш.");
  await page.getByRole("button", { name: "Читать полный разбор" }).click();
  await expect(
    page.getByText("Основной сценарий", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByText("Основной сценарий", { exact: true }),
  ).toBeVisible();
  await goto("/library");
  await expect(page.locator(".material-card")).toHaveCount(1);
  await page.getByRole("button", { name: "Избранное", exact: true }).click();
  await expect(page.locator(".event-row")).toHaveCount(1);
  await goto("/analysts");
  await page
    .getByRole("button", { name: "Сравнить: Марк Волков", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Сравнить: Лев Орлов", exact: true })
    .click();
  await page.getByRole("button", { name: "Сравнить", exact: true }).click();
  await expect(page.locator(".compare-profiles")).toContainText("Марк Волков");
  await page.keyboard.press("Escape");
  await goto("/author/mark");
  await page.getByRole("button", { name: "30 дн.", exact: true }).click();
  await expect(page.locator(".results-total")).toContainText("6");
  await page
    .getByRole("button", { name: "Архив результатов", exact: true })
    .click();
  await expect(page.locator(".archive-row")).toHaveCount(6);
  await page.getByRole("button", { name: /Подписаться/ }).click();
  await page.getByRole("button", { name: "Открыть бесплатно в демо" }).click();
  await page.getByRole("button", { name: "К материалам автора" }).click();
  await goto("/library");
  await expect(page.locator(".material-card")).toHaveCount(6);
  await page.getByRole("button", { name: "Подписки", exact: true }).click();
  await page
    .getByRole("button", {
      name: "Отключить демоподписку: Марк Волков",
      exact: true,
    })
    .click();
  await page.getByRole("button", { name: "Разборы", exact: true }).click();
  await expect(page.locator(".material-card")).toHaveCount(1);
  await goto("/studio");
  await page.getByRole("button", { name: "Предпросмотр", exact: true }).click();
  await expect(page.getByRole("alert")).toBeVisible();
  await page
    .getByLabel("Название материала", { exact: true })
    .fill("Тест: два сценария veto");
  await page
    .getByLabel("Вывод / выбранный исход", { exact: true })
    .fill("Northern Foxes");
  await page
    .getByLabel("Открытое превью", { exact: true })
    .fill("Что изменится после выбора карты.");
  await page
    .getByLabel("Аргументы и альтернативный сценарий", { exact: true })
    .fill("Преимущество на Mirage. Альтернатива: соперник выбирает Nuke.");
  await page
    .getByLabel("Источники", { exact: true })
    .fill("Демонабор, 5 октября 2026");
  await page.getByLabel("Доступ", { exact: true }).selectOption("free");
  await page.reload();
  await expect(
    page.getByLabel("Название материала", { exact: true }),
  ).toHaveValue("Тест: два сценария veto");
  await page.getByRole("button", { name: "Предпросмотр", exact: true }).click();
  await page
    .getByRole("button", { name: "Опубликовать в демо", exact: true })
    .click();
  await expect(page.locator("h1")).toHaveText("Тест: два сценария veto");
  await expect(
    page.getByText("Основной сценарий", { exact: true }),
  ).toBeVisible();
  await goto("/read/read-fox-echo");
  await expect(
    page.getByText("Продажа предматчевого разбора закрыта"),
  ).toBeVisible();
  await goto("/");
  await expect(page.locator(".toast")).toHaveCount(0);
  await screenshot("desktop-final");
  const routes = [
    "/",
    "/match/fox-metro",
    "/match/atlas-river",
    "/analysts",
    "/author/mark",
    "/read/read-fox-metro",
    "/library",
    "/studio",
  ];
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    for (const route of routes) {
      await goto(route);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      );
      if (overflow)
        throw new Error(`Horizontal overflow at ${width}: ${route}`);
      if (width === 390 || width === 1440) {
        await screenshot(`${width}-${route.replaceAll("/", "-") || "home"}`);
      }
    }
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await goto("/read/read-atlas-river");
  await page.getByRole("button", { name: /Открыть за/ }).click();
  await page.waitForTimeout(700);
  await page.screenshot({ path: "tmp/screenshots/mobile-checkout.png" });
  await page.keyboard.press("Escape");
  // Telegram bridge: safe areas, native back button and haptic behavior in a simulated WebApp host.
  const tgPage = await browser.newPage({
    viewport: { width: 390, height: 844 },
  });
  await tgPage.route("https://telegram.org/js/telegram-web-app.js", (r) =>
    r.fulfill({ body: "", contentType: "application/javascript" }),
  );
  await tgPage.addInitScript(() => {
    localStorage.setItem("rakurs:onboardingSeen", "true");
    window.tgCalls = [];
    window.Telegram = {
      WebApp: {
        initData: "test-only",
        isVersionAtLeast: () => true,
        ready: () => tgCalls.push("ready"),
        expand: () => tgCalls.push("expand"),
        setHeaderColor: () => {},
        setBackgroundColor: () => {},
        setBottomBarColor: () => {},
        safeAreaInset: { top: 20, bottom: 15 },
        contentSafeAreaInset: { top: 8 },
        onEvent: () => {},
        offEvent: () => {},
        BackButton: {
          show: () => tgCalls.push("back-show"),
          hide: () => {},
          onClick: (fn) => (window.tgBack = fn),
          offClick: () => {},
        },
        HapticFeedback: { selectionChanged: () => tgCalls.push("haptic") },
      },
    };
  });
  await tgPage.goto(base + "#/match/fox-metro");
  await expect(tgPage.locator("h1")).toContainText("Игра");
  await expect
    .poll(() =>
      tgPage.evaluate(
        () =>
          tgCalls.includes("ready") &&
          tgCalls.includes("expand") &&
          tgCalls.includes("back-show"),
      ),
    )
    .toBe(true);
  await expect
    .poll(() =>
      tgPage.evaluate(() =>
        document.documentElement.style.getPropertyValue("--tg-top"),
      ),
    )
    .toBe("28px");
  await tgPage.evaluate(() => window.tgBack());
  await expect(tgPage.locator("h1")).toContainText("Другой взгляд");
  await tgPage.close();
  if (errors.length) throw new Error(errors.join("\n"));
  console.log(
    "PASS: search, filters, favorites, AI, statistics, checkout, persistence, subscription, comparison, archive, studio, closed sales, 40 responsive route checks, Telegram bridge. No page errors.",
  );
} finally {
  await browser.close();
}
