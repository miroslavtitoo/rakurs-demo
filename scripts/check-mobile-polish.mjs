import { chromium, expect } from "@playwright/test";
import fs from "node:fs/promises";
const base = process.env.DEMO_URL || "http://localhost:5173/";
const browser = await chromium.launch({
  channel: process.env.PLAYWRIGHT_CHANNEL || "msedge",
});
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await fs.mkdir("tmp/polish-v81", { recursive: true });
const pause = (ms) => page.waitForTimeout(ms);
async function tap(side) {
  const r = await page.locator(".pdf-story-copy").boundingBox();
  await page.mouse.click(r.x + (side === "left" ? 10 : r.width - 10), r.y + 20);
}
async function swipe(el, dir) {
  const r = await el.boundingBox();
  const x = r.x + r.width * (dir === "left" ? 0.8 : 0.2),
    end = r.x + r.width * (dir === "left" ? 0.2 : 0.8);
  await page.mouse.move(x, r.y + r.height * 0.5);
  await page.mouse.down();
  await page.mouse.move(end, r.y + r.height * 0.5, { steps: 10 });
  await page.mouse.up();
}
async function shot(name) {
  await page.screenshot({
    path: `tmp/polish-v81/${name}.png`,
    style: ".m-toast{visibility:hidden!important}",
  });
}
try {
  await page.goto(base);
  await expect(page.locator(".story-sport-card")).toHaveCount(3);
  const heading = page.locator(".pdf-story-copy h1");
  const headingEarly = await heading.evaluate((e) =>
    Number(getComputedStyle(e).opacity),
  );
  expect(headingEarly).toBeLessThan(0.5);
  await pause(1700);
  await expect(heading).toHaveCSS("opacity", "1");
  await expect(page.locator(".pdf-story-actions")).toHaveCSS("opacity", "1");
  await expect(page.locator(".story-card-float").first()).toHaveCSS(
    "animation-name",
    "story-card-levitate",
  );
  const positions = await page
    .locator(".story-sport-card")
    .evaluateAll((els) => els.map((e) => e.getBoundingClientRect().x));
  expect(Math.max(...positions) - Math.min(...positions)).toBeGreaterThan(130);
  await shot("final-story-0");
  await tap("right");
  await expect(page.locator(".story-orbit-node")).toHaveCount(6);
  await pause(1700);
  await expect(page.locator(".story-orbit-spinner")).toHaveCSS(
    "animation-name",
    "story-clockwise",
  );
  await shot("final-story-1");
  await tap("left");
  await expect(page.locator(".story-sport-card")).toHaveCount(3);
  await swipe(page.locator(".pdf-story-art"), "left");
  await expect(page.locator(".story-orbit-node")).toHaveCount(6);
  await tap("right");
  await pause(1800);
  await expect
    .poll(() =>
      page
        .locator(".story-gauge-marker")
        .evaluate((e) => parseFloat(getComputedStyle(e).offsetDistance)),
    )
    .toBe(74);
  await expect(page.locator(".story-gauge-glow")).toHaveCSS(
    "animation-name",
    "story-gauge-breathe",
  );
  await shot("final-story-2");
  await tap("right");
  await expect(page.locator(".story-glass-column")).toHaveCount(4);
  await pause(1700);
  await shot("final-story-3");
  await page.getByRole("button", { name: "Далее", exact: true }).click();
  await pause(500);
  await shot("final-welcome");
  const intro = await page.locator(".auth-intro").boundingBox();
  expect(intro.y + intro.height / 2).toBeGreaterThan(330);
  expect(intro.y + intro.height / 2).toBeLessThan(440);
  await page.getByRole("button", { name: /Смотреть без регистрации/ }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Закрыть", exact: true })
    .click();
  await pause(500);
  const slider = page.locator(".event-slider").first();
  const track = slider.locator(".event-slider-track");
  const active = await slider.locator(".pdf-event").first().boundingBox();
  expect(Math.abs(active.x + active.width / 2 - 195)).toBeLessThan(1);
  const second = await slider.locator(".pdf-event").nth(1).boundingBox();
  expect(second.x).toBeLessThan(385);
  expect(second.x).toBeGreaterThan(365);
  const dots = slider.locator(".slider-dots button");
  await dots.nth(1).click();
  await pause(600);
  await expect(dots.nth(1)).toHaveAttribute("aria-current", "true");
  const currentDot = await dots.nth(1).locator("span").boundingBox(),
    otherDot = await dots.nth(0).locator("span").boundingBox();
  expect(currentDot.width).toBeGreaterThan(otherDot.width);
  const beforeWheel = await track.evaluate(
    (e) => getComputedStyle(e).transform,
  );
  await slider.locator(".event-slider-viewport").hover();
  await page.mouse.wheel(0, 140);
  await pause(150);
  expect(await track.evaluate((e) => getComputedStyle(e).transform)).toBe(
    beforeWheel,
  );
  await slider.scrollIntoViewIfNeeded();
  await swipe(slider.locator(".event-slider-viewport"), "left");
  await expect(dots.nth(2)).toHaveAttribute("aria-current", "true");
  await expect(page.locator("main>[data-route]")).toHaveAttribute(
    "data-route",
    "/",
  );
  await slider.locator(".event-slider-viewport").focus();
  await page.keyboard.press("ArrowLeft");
  await expect(dots.nth(1)).toHaveAttribute("aria-current", "true");
  await page.goto(base + "#/search");
  await pause(400);
  const field = await page.locator(".catalog-search").boundingBox(),
    filters = await page.locator(".pdf-filterbar").boundingBox(),
    statuses = await page.locator(".pdf-status-tabs").boundingBox();
  expect(filters.y - field.y - field.height).toBeGreaterThanOrEqual(16);
  expect(statuses.y - filters.y - filters.height).toBeGreaterThanOrEqual(10);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.evaluate(() => {
    localStorage.setItem(
      "rakurs:demoUser",
      JSON.stringify({ name: "Демо", avatar: "avatar" }),
    );
    localStorage.setItem("rakurs:aiPurchases", '["fox-metro"]');
  });
  for (const [width, height] of [
    [320, 568],
    [360, 640],
    [390, 844],
    [430, 932],
    [768, 1024],
  ]) {
    await page.setViewportSize({ width, height });
    for (const route of [
      "/",
      "/search",
      "/profile",
      "/library",
      "/subscription",
      "/chat",
      "/match/fox-metro",
    ]) {
      await page.goto(base + "#" + route);
      await page.evaluate(() => document.fonts.ready);
      await pause(220);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
        `${width} ${route} overflow`,
      ).toBe(true);
      if (route === "/chat")
        await expect(page.locator(".general-chat-input")).toBeInViewport({
          ratio: 1,
        });
      await shot(`${width}-${route.replaceAll("/", "-")}`);
    }
    await page.goto(base);
    await page
      .getByRole("button", {
        name: "Открыть знакомство с приложением",
        exact: true,
      })
      .click();
    for (let i = 0; i < 4; i++) {
      if (i > 0)
        await page.getByRole("button", { name: "Далее", exact: true }).click();
      await expect(
        page.getByRole("button", { name: "Далее", exact: true }),
      ).toBeInViewport();
      expect(
        await page
          .locator(".pdf-story")
          .evaluate((e) => e.scrollHeight <= e.clientHeight + 1),
      ).toBe(true);
      await shot(`${width}-story-${i}`);
    }
    await expect(page.locator(".story-card-float")).toHaveCount(0);
    await page.getByRole("button", { name: "Сторис 1 из 4" }).click();
    await expect(page.locator(".story-card-float").first()).toHaveCSS(
      "animation-name",
      "none",
    );
    for (let i = 0; i < 4; i++)
      await page.getByRole("button", { name: "Далее", exact: true }).click();
  }
  const touchContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    reducedMotion: "reduce",
  });
  const touchPage = await touchContext.newPage();
  touchPage.on("pageerror", (e) => errors.push(e.message));
  await touchPage.goto(base);
  await touchPage.touchscreen.tap(330, 530);
  await expect(touchPage.locator(".story-orbit-node")).toHaveCount(6);
  await touchPage.touchscreen.tap(65, 530);
  await expect(touchPage.locator(".story-sport-card")).toHaveCount(3);
  for (let i = 0; i < 4; i++)
    await touchPage.getByRole("button", { name: "Далее", exact: true }).tap();
  await touchPage
    .getByRole("button", { name: /Смотреть без регистрации/ })
    .tap();
  await touchPage
    .getByRole("dialog")
    .getByRole("button", { name: "Закрыть", exact: true })
    .tap();
  const touchViewport = touchPage.locator(".event-slider-viewport").first();
  const touchBounds = await touchViewport.boundingBox();
  const cdp = await touchContext.newCDPSession(touchPage);
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [
      { x: touchBounds.x + touchBounds.width * 0.8, y: touchBounds.y + 70 },
    ],
  });
  for (let i = 1; i <= 8; i++)
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [
        {
          x: touchBounds.x + touchBounds.width * (0.8 - (0.6 * i) / 8),
          y: touchBounds.y + 70,
        },
      ],
    });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await expect(
    touchPage
      .locator(".event-slider")
      .first()
      .locator(".slider-dots button")
      .nth(1),
  ).toHaveAttribute("aria-current", "true");
  await touchContext.close();
  expect(errors).toEqual([]);
  console.log(
    "PASS: staged story animation, fan/levitation/orbit/gauge/chat, left/right taps + swipe, centered slider/peek/dots/keyboard, wheel isolation, search spacing, 35 mobile routes + 20 story layouts and reduced motion.",
  );
} finally {
  await browser.close();
}
