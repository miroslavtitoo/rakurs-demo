import http from "node:http";
import path from "node:path";
import fs from "node:fs/promises";
import { chromium, expect } from "@playwright/test";
const root = path.resolve("dist");
const server = http.createServer(async (req, res) => {
  try {
    const pathname = new URL(req.url, "http://localhost").pathname;
    if (!pathname.startsWith("/rakurs-demo/")) {
      res.writeHead(404);
      res.end();
      return;
    }
    const file = path.resolve(
      root,
      decodeURIComponent(
        pathname.slice("/rakurs-demo/".length) || "index.html",
      ),
    );
    if (!file.startsWith(root + path.sep)) {
      res.writeHead(403);
      res.end();
      return;
    }
    const types = {
      ".html": "text/html",
      ".js": "text/javascript",
      ".css": "text/css",
      ".svg": "image/svg+xml",
      ".webp": "image/webp",
      ".woff2": "font/woff2",
      ".woff": "font/woff",
    };
    res.setHeader(
      "Content-Type",
      types[path.extname(file)] || "application/octet-stream",
    );
    res.end(await fs.readFile(file));
  } catch {
    res.writeHead(404);
    res.end();
  }
});
await new Promise((resolve) => server.listen(5174, "127.0.0.1", resolve));
const browser = await chromium.launch({
  channel: process.env.PLAYWRIGHT_CHANNEL || "msedge",
  headless: true,
});
try {
  await fs.mkdir("output", { recursive: true });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
  });
  await page.addInitScript(() => localStorage.setItem("rakurs:onboardingSeen", "true"));
const errors = [];
  const bad = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("response", (r) => {
    if (r.url().startsWith("http://127.0.0.1:5174") && r.status() >= 400)
      bad.push(r.url());
  });
  await page.goto("http://127.0.0.1:5174/rakurs-demo/");
  await expect(page.locator("h1")).toContainText("Другой взгляд");
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(700);
  await expect
    .poll(() =>
      page
        .locator(".hero-art img")
        .evaluate((img) => img.complete && img.naturalWidth > 0),
    )
    .toBe(true);
  await page.screenshot({ path: "output/preview-desktop.png" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "output/preview-mobile.png" });
  await page.locator(".spotlight .text-arrow").click();
  await expect(page.locator("h1")).toContainText("Игра");
  await page.getByRole("button", { name: "Объяснить матч" }).click();
  await expect(page.locator(".ai-answer")).toContainText("Veto");
  await page.keyboard.press("Escape");
  await page.goto("http://127.0.0.1:5174/rakurs-demo/#/read/read-fox-metro");
  await expect(
    page.getByRole("button", { name: "Открыть за 390 ₽" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Открыть за 390 ₽" }).click();
  await page.getByRole("button", { name: "Открыть бесплатно в демо" }).click();
  await page.getByRole("button", { name: "Читать полный разбор" }).click();
  await expect(
    page.getByText("Основной сценарий", { exact: true }),
  ).toBeVisible();
  if (errors.length || bad.length)
    throw new Error(JSON.stringify({ errors, bad }));
  console.log(
    "PASS: production bundle under /rakurs-demo/, local fonts and artwork, mobile event → AI → purchase → full article; no page errors or failed local assets.",
  );
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
