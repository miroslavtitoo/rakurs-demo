import { chromium, expect } from "@playwright/test";
import fs from "node:fs/promises";
import { rewardDay, DAILY_REWARDS } from "../src/rewards.js";
const browser = await chromium.launch({ channel: "msedge" }),
  base = process.env.DEMO_URL || "http://localhost:5173/";
const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    reducedMotion: "reduce",
  }),
  errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await fs.mkdir("tmp/rewards-v9", { recursive: true });
const initial = Date.parse("2026-11-14T09:00:00Z");
const shot = async (name) => {
  await page.waitForTimeout(300);
  await page.screenshot({
    path: `tmp/rewards-v9/${name}.png`,
    style: ".m-toast{visibility:hidden!important}",
  });
};
async function finish(p = page) {
  for (let i = 0; i < 4; i++)
    await p.getByRole("button", { name: "Далее", exact: true }).click();
}
async function close(p = page) {
  await p
    .getByRole("dialog")
    .getByRole("button", { name: "Закрыть", exact: true })
    .click();
  await expect(p.getByRole("dialog")).toHaveCount(0);
}
async function clean(p = page) {
  await expect(p.locator("body")).not.toContainText(
    /демо|вымышлен|подготовленные ответы|без списания/i,
  );
}
async function route(path) {
  await page.goto(base + "#" + path);
  await expect(page.locator("main>[data-route]")).toHaveAttribute(
    "data-route",
    path,
  );
}
try {
  await page.clock.install({ time: new Date(initial) });
  await page.goto(base);
  await expect(page.locator(".pdf-stories")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Пропустить", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Закрыть", exact: true }),
  ).toHaveCount(0);
  await page.keyboard.press("Escape");
  await expect(page.locator(".pdf-stories")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Сторис 4 из 4" }),
  ).toBeDisabled();
  await shot("onboarding");
  await finish();
  await expect(
    page.getByRole("button", { name: "Продолжить с Telegram", exact: true }),
  ).toBeVisible();
  await shot("telegram-entry");
  await clean();
  await page.getByRole("button", { name: /Смотреть без регистрации/ }).click();
  await expect(page.locator(".reward-sheet")).toBeVisible();
  await shot("daily-first");
  await expect(page.locator(".reward-day")).toHaveCount(7);
  await expect(page.locator(".reward-day.active")).toContainText("10");
  await page
    .getByRole("button", { name: "Забрать награду", exact: true })
    .click();
  await expect(page.locator(".coin-balance-button")).toContainText("10");
  await expect(page.locator(".reward-day.active")).toContainText("15");
  await expect(
    page.getByRole("button", { name: "Награда получена", exact: true }),
  ).toBeDisabled();
  await shot("daily-claimed");
  await clean();
  await close();
  await expect(
    page.getByRole("button", { name: "Уведомления", exact: true }),
  ).toHaveCount(0);
  await expect(page.locator(".demo-badge")).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.locator(".coin-balance-button").click();
  await expect(
    page.getByRole("button", { name: "Награда получена", exact: true }),
  ).toBeDisabled();
  await close();
  await expect(page.locator(".story-news-tile.unread")).toHaveCount(4);
  await expect(page.locator(".story-news-tile").last()).toHaveClass(
    /onboarding-tile.*read/,
  );
  await page.locator(".story-news-tile").first().click();
  await expect(page.locator(".news-stories")).toBeVisible();
  await shot("news-story");
  await close();
  await expect(page.locator(".story-news-tile.unread")).toHaveCount(3);
  await page.reload();
  await expect(page.locator(".story-news-tile.unread")).toHaveCount(3);
  await clean();
  await page
    .getByRole("button", { name: "Открыть знакомство с приложением" })
    .click();
  await finish();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await shot("catalog");
  let total = 10;
  for (let day = 1; day < 7; day++) {
    await page.clock.setSystemTime(new Date(initial + day * 86400000));
    await page.evaluate(() =>
      document.dispatchEvent(new Event("visibilitychange")),
    );
    await expect(page.locator(".reward-sheet")).toBeVisible();
    await page
      .getByRole("button", { name: "Забрать награду", exact: true })
      .click();
    total += DAILY_REWARDS[day];
    await expect(page.locator(".coin-balance-button")).toContainText(
      String(total),
    );
    await close();
  }
  expect(total).toBe(130);
  await route("/profile");
  await expect(page.locator(".profile-coin-card")).toContainText("130");
  await shot("profile-coins");
  await route("/match/fox-metro");
  await page.getByRole("button", { name: /Купить прогноз/ }).click();
  await expect(
    page.getByRole("button", { name: "Продолжить с Telegram", exact: true }),
  ).toBeVisible();
  await page.evaluate(() => {
    window.Telegram.WebApp.initDataUnsafe.user = {
      id: 123456,
      first_name: "Алина",
      last_name: "Ветрова",
    };
  });
  await page
    .getByRole("button", { name: "Продолжить с Telegram", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveAttribute(
    "aria-label",
    "Оформление заказа",
  );
  await expect(page.locator(".pdf-stories")).toHaveCount(0);
  await page.getByRole("button", { name: "Монеты", exact: true }).click();
  await shot("coin-checkout");
  await page
    .getByRole("button", { name: "Открыть за монеты", exact: true })
    .click();
  await expect(page.locator(".analysis-dashboard")).toBeVisible();
  await expect(page.locator(".coin-balance-button")).toContainText("0");
  await page.reload();
  await expect(page.locator(".analysis-dashboard")).toBeVisible();
  await clean();
  await page.getByRole("button", { name: /Вся логика прогноза/ }).click();
  await clean();
  await close();
  for (let i = 0; i < 5; i++) {
    await page.locator(".evidence-card").nth(i).click();
    await clean();
    await close();
  }
  await page
    .getByRole("button", { name: "Чат по событию", exact: true })
    .click();
  await page
    .locator(".event-chat-composer input")
    .fill("Почему такая вероятность?");
  await page.locator(".event-chat-composer form button").click();
  await expect(page.locator(".assistant-chat-bubble").last()).toContainText(
    "65%",
  );
  await clean();
  await close();
  // Seed a second earned week to exercise the independent coupon redemption path.
  await page.evaluate(() => {
    const key = "rakurs:rewardsWallet",
      w = JSON.parse(localStorage.getItem(key));
    localStorage.setItem(key, JSON.stringify({ ...w, balance: 130 }));
  });
  await page.reload();
  await page.locator(".coin-balance-button").click();
  await page.getByRole("button", { name: /На что потратить/ }).click();
  await shot("coin-shop");
  await page
    .getByRole("button", { name: "130 монет · получить скидку", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await route("/profile");
  await expect(page.locator(".profile-ident")).toContainText("Алина Ветрова");
  await page
    .getByRole("button", { name: "Купить прогнозы", exact: true })
    .click();
  await page.getByRole("button", { name: "Купить", exact: true }).click();
  await expect(page.locator(".coupon-applied")).toContainText("30%");
  await expect(page.locator(".order-total")).toContainText("20 рублей");
  await shot("coupon-order");
  await page.getByRole("button", { name: "Оплатить", exact: true }).click();
  const state = await page.evaluate(() => ({
    wallet: JSON.parse(localStorage.getItem("rakurs:rewardsWallet")),
    transactions: JSON.parse(localStorage.getItem("rakurs:demoTransactions")),
    outcome: JSON.parse(localStorage.getItem("rakurs:outcomeCredits")),
  }));
  expect(state.wallet.coupon).toBeNull();
  expect(state.transactions[0].amount).toBe(-20);
  expect(state.outcome).toBe(3);
  await clean();
  await route("/match/porto-royal");
  await page
    .getByRole("button", { name: "Открыть только исход · из пакета" })
    .click();
  await expect(page.locator(".probability-panel")).toBeVisible();
  await expect(page.locator(".evidence-panel")).toHaveCount(0);
  await page.evaluate(() => {
    const k = "rakurs:rewardsWallet",
      w = JSON.parse(localStorage.getItem(k));
    localStorage.setItem(k, JSON.stringify({ ...w, balance: 130 }));
  });
  await page.reload();
  await page.locator(".coin-balance-button").click();
  await page.getByRole("button", { name: /На что потратить/ }).click();
  await page
    .getByRole("button", { name: "130 монет · забрать прогноз", exact: true })
    .click();
  await expect
    .poll(() =>
      page.evaluate(() =>
        JSON.parse(localStorage.getItem("rakurs:analysisCredits")),
      ),
    )
    .toBe(1);
  await route("/match/ember-frost");
  await page.getByRole("button", { name: /Купить прогноз/ }).click();
  await page
    .getByRole("button", { name: "Использовать анализ", exact: true })
    .click();
  await expect(page.locator(".analysis-dashboard")).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(() =>
        JSON.parse(localStorage.getItem("rakurs:analysisCredits")),
      ),
    )
    .toBe(0);
  await route("/subscription");
  await page
    .getByRole("button", { name: "Попробовать подписку", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Подключить подписку", exact: true })
    .click();
  await expect(page.locator(".subscription-active")).toBeVisible();
  await clean();
  for (const [width, height] of [
    [320, 568],
    [390, 844],
    [430, 932],
    [768, 1024],
    [1440, 1000],
  ]) {
    await page.setViewportSize({ width, height });
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
      await clean();
      if (path === "/") {
        await expect(page.locator(".pdf-event").first()).toHaveCSS("opacity", "1");
      }
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
      ).toBe(true);
      await shot(`${width}-${path.replaceAll("/", "-")}`);
    }
    if (width < 800) {
      await page.locator(".coin-balance-button").click();
      await expect(page.locator(".reward-day")).toHaveCount(7);
      await expect(page.locator(".reward-claim")).toBeInViewport();
      await shot(`${width}-reward`);
      await close();
    }
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await route("/profile");
  for (const label of [
    "Способы оплаты",
    "Настройки профиля",
    "FAQ",
    "Выбор языка",
    "Служба поддержки",
  ]) {
    await page.getByRole("button", { name: label, exact: true }).click();
    await clean();
    await close();
  }
  await page
    .getByRole("button", { name: "Выйти из профиля", exact: true })
    .click();
  await route("/match/fox-metro");
  await expect(page.locator(".analysis-dashboard")).toHaveCount(0);
  expect(errors).toEqual([]);
  console.log(
    "PASS: mandatory onboarding, primary Telegram login, daily popup/claims/week=130, coin purchase, 30% bundle coupon, news read states/replay, no retired labels, subscription/chat/factors, persistence and 35 responsive routes.",
  );
} finally {
  await browser.close();
}
