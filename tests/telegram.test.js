import test from "node:test";
import assert from "node:assert/strict";
import { initTelegram } from "../src/telegram.js";

function fixture(version = "8.0", extra = {}) {
  const calls = [],
    events = new Map(),
    css = new Map();
  const supported = (v) => {
    const a = version.split(".").map(Number),
      b = v.split(".").map(Number);
    return a[0] > b[0] || (a[0] === b[0] && a[1] >= b[1]);
  };
  const tg = {
    initData: "synthetic-demo",
    platform: "android",
    isFullscreen: false,
    isVersionAtLeast: supported,
    safeAreaInset: { top: 24, bottom: 20, left: 0, right: 0 },
    contentSafeAreaInset: { top: 32, bottom: 4, left: 2, right: 3 },
    onEvent: (name, fn) => events.set(name, fn),
    offEvent: (name, fn) => {
      if (events.get(name) === fn) events.delete(name);
    },
    ...Object.fromEntries(
      [
        "ready",
        "expand",
        "disableVerticalSwipes",
        "requestFullscreen",
        "setHeaderColor",
        "setBackgroundColor",
        "setBottomBarColor",
      ].map((name) => [name, (...args) => calls.push([name, ...args])]),
    ),
    ...extra,
  };
  globalThis.window = { Telegram: { WebApp: tg } };
  globalThis.document = {
    documentElement: {
      style: { setProperty: (k, v) => css.set(k, v) },
      dataset: {},
    },
  };
  return {
    tg,
    calls,
    events,
    css,
    has: (name) => calls.some(([n]) => n === name),
  };
}
test("Telegram fullscreen + disabled swipe, safe areas, activation and listener cleanup", () => {
  const f = fixture();
  const cleanup = initTelegram();
  for (const name of [
    "ready",
    "expand",
    "disableVerticalSwipes",
    "requestFullscreen",
  ])
    assert.ok(f.has(name));
  assert.equal(f.css.get("--tg-top"), "56px");
  assert.equal(f.css.get("--tg-bottom"), "24px");
  assert.equal(f.css.get("--tg-left"), "2px");
  f.tg.isFullscreen = true;
  f.events.get("fullscreenChanged")();
  assert.equal(document.documentElement.dataset.tgFullscreen, "true");
  f.events.get("activated")();
  assert.equal(f.calls.filter(([n]) => n === "requestFullscreen").length, 1);
  f.tg.contentSafeAreaInset.top = 40;
  f.events.get("contentSafeAreaChanged")();
  assert.equal(f.css.get("--tg-top"), "64px");
  cleanup();
  assert.equal(f.events.size, 0);
});
test("Older Telegram clients use expansion and only supported gesture APIs", () => {
  const middle = fixture("7.7");
  initTelegram()();
  assert.ok(middle.has("expand"));
  assert.ok(middle.has("disableVerticalSwipes"));
  assert.ok(!middle.has("requestFullscreen"));
  const old = fixture("6.1");
  initTelegram()();
  assert.ok(old.has("expand"));
  assert.ok(!old.has("disableVerticalSwipes"));
  assert.deepEqual(
    old.calls.find(([n]) => n === "setHeaderColor"),
    ["setHeaderColor", "bg_color"],
  );
});
test("Unsupported or throwing fullscreen falls back without breaking rendering", () => {
  const f = fixture();
  const cleanup = initTelegram();
  f.events.get("fullscreenFailed")({ error: "UNSUPPORTED" });
  f.events.get("activated")();
  assert.equal(f.calls.filter(([n]) => n === "requestFullscreen").length, 1);
  cleanup();
  const throwing = fixture("8.0", {
    requestFullscreen: () => {
      throw Error("unsupported host");
    },
  });
  assert.doesNotThrow(() => initTelegram()());
  assert.ok(throwing.has("expand"));
  assert.ok(throwing.has("disableVerticalSwipes"));
});
test("A Telegram keyboard launch can have empty initData; normal browser stays untouched", () => {
  const keyboard = fixture("8.0", { initData: "" });
  initTelegram()();
  assert.ok(keyboard.has("requestFullscreen"));
  const browser = fixture("8.0", { initData: "", platform: "unknown" });
  initTelegram()();
  assert.equal(browser.calls.length, 0);
  assert.equal(browser.events.size, 0);
});
