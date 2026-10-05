import test from "node:test";
import assert from "node:assert/strict";
import { routeFromHash } from "../src/routing.js";

test("Telegram launch parameters open Overview instead of Not Found", () => {
  const params = "tgWebAppData=query_id%3Ddemo%26hash%3Dfake&tgWebAppVersion=8.0&tgWebAppPlatform=ios";
  for (const hash of ["", "#", "#" + params, "#?" + params, "#/?" + params, "#tgWebAppVersion=8.0"]) {
    assert.equal(routeFromHash(hash), "/", hash);
  }
});

test("app deep links remain usable with Telegram or normal query parameters", () => {
  for (const path of ["/", "/analysts", "/library", "/studio", "/match/fox-metro", "/author/mark", "/read/read-fox-metro"]) {
    for (const suffix of ["", "?tgWebAppData=fake&tgWebAppVersion=8.0", "&tgWebAppVersion=8.0", "?source=demo"]) {
      assert.equal(routeFromHash("#" + path + suffix), path);
    }
  }
});

test("unrecognised links and parameter text nested in a value do not impersonate a launch", () => {
  for (const path of ["/missing", "unknown", "note=tgWebAppData%3Dfake", "tgWebAppMissingRoute"]) {
    assert.equal(routeFromHash("#" + path), path);
  }
});
