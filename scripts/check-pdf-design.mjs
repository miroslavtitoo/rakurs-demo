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
const dir = "tmp/design-pdf";
await fs.mkdir(dir, { recursive: true });
async function shot(name) {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(500);
  await page.screenshot({
    path: `${dir}/${name}.png`,
    style: ".m-toast{visibility:hidden!important}",
  });
}
async function close() {
  await expect(page.getByRole("dialog")).toHaveCount(1);
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Закрыть", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
}
async function route(path) {
  await page.goto(base + "#" + path);
  await expect(page.locator("main>[data-route]")).toHaveAttribute(
    "data-route",
    path,
  );
}
async function noOverflow() {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true);
  if (await page.getByRole("dialog").count())
    expect(
      await page
        .getByRole("dialog")
        .evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
    ).toBe(true);
}
try {
  await page.goto(base);
  await expect(page.getByRole("dialog")).toBeVisible();
  for (let i = 0; i < 4; i++) {
    await shot("story-" + i);
    await noOverflow();
    await page.getByRole("button", { name: "Далее", exact: true }).click();
  }
  await shot("welcome");
  await page
    .getByRole("button", { name: "Создать аккаунт", exact: true })
    .click();
  await shot("signup");
  await page.getByRole("button", { name: /Смотреть без регистрации/ }).click();
  await shot("home");
  await page.getByRole("button", { name: "Фильтры", exact: true }).click();
  await shot("filters");
  await page
    .getByRole("button", { name: "Футбол", exact: true })
    .last()
    .click();
  await page.getByRole("button", { name: "Применить", exact: true }).click();
  await expect(page.locator(".pdf-event-grid .pdf-event")).toHaveCount(6);
  await page
    .getByRole("button", { name: "Открыть поиск", exact: true })
    .click();
  await shot("search-sheet");
  await page.getByLabel("Поисковый запрос").fill("Порто");
  await page.getByRole("button", { name: "Искать", exact: true }).click();
  await expect(page.locator(".pdf-event-grid .pdf-event")).toHaveCount(1);
  await route("/match/fox-metro");
  await expect(page.locator(".analysis-dashboard")).toHaveCount(0);
  await expect(page.locator("main")).not.toContainText("65%");
  await shot("locked");
  await page.getByRole("button", { name: /Купить прогноз/ }).click();
  await shot("login");
  await page.getByLabel("Номер телефона").fill("123");
  await page.getByRole("button", { name: "Войти", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveAttribute(
    "aria-label",
    "Знакомство с Diverge",
  );
  await page.getByRole("button", { name: "Пропустить", exact: true }).click();
  await shot("checkout");
  await page
    .getByRole("button", { name: "Использовать анализ из пакета" })
    .click();
  await expect(page.locator(".analysis-dashboard")).toBeVisible();
  await shot("analysis");
  await page
    .getByRole("button", { name: "Вся логика прогноза", exact: false })
    .click();
  await shot("math");
  await noOverflow();
  await close();
  const factors = await page.locator(".evidence-card").count();
  for (let i = 0; i < factors; i++) {
    await page.locator(".evidence-card").nth(i).click();
    await shot("factor-" + i);
    await noOverflow();
    await close();
  }
  await page
    .getByRole("button", { name: "Чат по событию", exact: true })
    .click();
  await shot("event-chat");
  await page
    .locator(".event-chat-composer input")
    .fill("Почему такая вероятность?");
  await page.locator(".event-chat-composer form button").click();
  await expect(page.locator(".event-chat-log")).toContainText("65%");
  await close();
  await route("/profile");
  await shot("profile");
  await page
    .getByRole("button", { name: "Настройки профиля", exact: true })
    .click();
  await shot("settings");
  await page.getByRole("button", { name: "Начать", exact: true }).click();
  await shot("verification");
  await page
    .getByRole("button", { name: "Пройти демопроверку", exact: true })
    .click();
  await close();
  await page
    .getByRole("button", { name: "Редактировать профиль", exact: true })
    .click();
  await shot("edit");
  await page.getByLabel("Имя", { exact: true }).fill("Тестовый профиль");
  await page.getByRole("button", { name: "Сохранить", exact: true }).click();
  await expect(page.locator(".profile-ident")).toContainText(
    "Тестовый профиль",
  );
  await page
    .getByRole("button", { name: "Купить прогнозы", exact: true })
    .click();
  await shot("plans-outcome");
  await page
    .getByRole("button", { name: "Полная аналитика", exact: true })
    .click();
  await shot("plans-full");
  await page
    .getByRole("button", { name: "Только исход матча", exact: true })
    .click();
  await page.getByRole("button", { name: "Купить", exact: true }).click();
  await shot("package-order");
  await page
    .getByRole("button", { name: "Получить без списания", exact: true })
    .click();
  await expect
    .poll(() =>
      page.evaluate(() =>
        JSON.parse(localStorage.getItem("rakurs:outcomeCredits")),
      ),
    )
    .toBe(3);
  await page.getByRole("button", { name: /Пополнить баланс/ }).click();
  await shot("topup");
  await page.getByLabel("Сумма пополнения").fill("500");
  await page.getByRole("button", { name: "Пополнить без списания" }).click();
  await expect(page.locator(".profile-balance")).toContainText("500");
  await page
    .getByRole("button", { name: "Способы оплаты", exact: true })
    .click();
  await shot("payments");
  await page
    .getByRole("button", { name: "Добавить демокарту", exact: true })
    .click();
  await expect(page.getByRole("dialog").locator(".profile-row")).toHaveCount(4);
  await page.getByRole("button", { name: /МИР · 6263/ }).click();
  await shot("payment-card");
  await page.getByRole("button", { name: "Сделать основным" }).click();
  await close();
  for (const [name, label] of [
    ["faq", "FAQ"],
    ["support", "Служба поддержки"],
    ["language", "Выбор языка"],
  ]) {
    await page.getByRole("button", { name: label, exact: true }).click();
    await shot(name);
    await noOverflow();
    await close();
  }
  await page
    .getByRole("button", { name: "Уведомления", exact: true })
    .last()
    .click();
  await shot("notifications");
  await page
    .getByRole("button", { name: "Добавили фильтры", exact: true })
    .click();
  await shot("news");
  await close();
  await route("/match/porto-royal");
  await page
    .getByRole("button", { name: "Открыть только исход · из пакета" })
    .click();
  await expect(page.locator(".probability-panel")).toBeVisible();
  await expect(page.locator(".evidence-panel")).toHaveCount(0);
  await shot("outcome-only");
  await route("/subscription");
  await shot("subscription");
  await page
    .getByRole("button", { name: "Попробовать подписку", exact: true })
    .click();
  await shot("subscribe-checkout");
  await page
    .getByRole("button", { name: "Активировать без списания", exact: true })
    .click();
  await expect(page.locator(".subscription-active")).toBeVisible();
  await route("/chat");
  await shot("general-chat");
  await page.getByLabel("Сообщение AI").fill("Привет");
  await page.getByRole("button", { name: "Отправить сообщение" }).click();
  await expect(page.locator(".general-message")).toHaveCount(2);
  await page.reload();
  await expect(page.locator(".general-message")).toHaveCount(2);
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    for (const path of [
      "/",
      "/search",
      "/profile",
      "/library",
      "/subscription",
      "/chat",
      "/match/fox-metro",
    ]) {
      await route(path);
      await noOverflow();
      await shot(`${width}-${path.replaceAll("/", "-") || "home"}`);
    }
  }
  await page.setViewportSize({ width: 320, height: 568 });
  await route("/");
  await page.getByRole("button", { name: "Демо · 18+", exact: true }).click();
  await noOverflow();
  await shot("small-story");
  await close();
  await route("/profile");
  await page
    .getByRole("button", { name: "Выйти из демопрофиля", exact: true })
    .click();
  await route("/match/fox-metro");
  await expect(page.locator(".analysis-dashboard")).toHaveCount(0);
  await expect(page.locator("main")).not.toContainText("65%");
  expect(errors).toEqual([]);
  console.log(
    "PASS: PDF flows, guest gating, phone mock, packages, subscription, factors/chat, profile/payments, persistence, 28 responsive routes; no page errors.",
  );
} finally {
  await browser.close();
}
