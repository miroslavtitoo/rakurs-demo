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
  await page.addInitScript(() =>
    localStorage.setItem("rakurs:marketOnboardingSeen", "true"),
  );
  const errors = [],
    bad = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("response", (r) => {
    if (r.url().startsWith("http://127.0.0.1:5174") && r.status() >= 400)
      bad.push(r.url());
  });
  await page.goto("http://127.0.0.1:5174/rakurs-demo/");
  await expect(
    page.getByRole("heading", { name: "AI-прогнозы", exact: true }),
  ).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(500);
  await page.screenshot({ path: "output/preview-desktop.png" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "output/preview-mobile.png" });
  await page
    .locator(".forecast-card")
    .first()
    .getByRole("button", { name: "Почему?", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText("Победа Northern Foxes");
  await page.keyboard.press("Escape");
  await page
    .locator(".forecast-card")
    .first()
    .getByRole("button", { name: "Купить · 390 ₽", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Открыть без списания", exact: true })
    .click();
  await expect(page.locator(".unlocked-forecast")).toBeVisible();
  await page.reload();
  await expect(page.locator(".unlocked-forecast")).toBeVisible();
  if (errors.length || bad.length)
    throw new Error(JSON.stringify({ errors, bad }));
  console.log(
    "PASS: production bundle under /rakurs-demo/, local fonts, mobile forecast → AI → purchase → full analysis and persistence; no page errors or failed local assets.",
  );
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
