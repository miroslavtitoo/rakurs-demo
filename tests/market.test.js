import test from "node:test";
import assert from "node:assert/strict";
import {
  forecasts,
  results,
  resultSummary,
  marketRoute,
  hasForecast,
} from "../src/marketData.js";
test("AI catalog has unique valid forecasts, paid and free paths", () => {
  assert.equal(new Set(forecasts.map((f) => f.id)).size, forecasts.length);
  assert.ok(forecasts.some((f) => f.price === 0));
  assert.ok(forecasts.some((f) => f.price > 0));
  for (const f of forecasts) {
    assert.ok(f.probability > 0 && f.probability < 100);
    assert.ok(f.odds > 1);
    assert.ok(f.condition && f.risk && f.reason);
    assert.notEqual(f.event.day, "finished");
  }
});
test("Results reconcile with displayed rate and exclude voids", () => {
  const s = resultSummary(results);
  assert.equal(s.wins + s.losses + s.voids, results.length);
  assert.equal(s.rate, Math.round((s.wins / (s.wins + s.losses)) * 100));
  assert.equal(resultSummary([]).rate, 0);
});
test("Existing purchases and links keep useful destinations", () => {
  assert.equal(hasForecast("fox-metro", [], ["read-fox-metro"]), true);
  assert.equal(hasForecast("atlas-river", [], ["read-fox-metro"]), false);
  assert.equal(marketRoute("/read/read-fox-metro"), "/match/fox-metro");
  assert.equal(
    marketRoute("/read/read-atlas-river-alternative"),
    "/match/atlas-river",
  );
  assert.equal(marketRoute("/analysts"), "/");
  assert.equal(marketRoute("/studio"), "/");
});
