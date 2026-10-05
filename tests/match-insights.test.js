import test from "node:test";
import assert from "node:assert/strict";
import { events } from "../src/data.js";
import { getMatchInsights, marketLine } from "../src/matchInsights.js";

test("dashboard outcomes are exhaustive and totals complement each other", () => {
  for (const event of events) {
    const data = getMatchInsights(event);
    assert.equal(data.outcomes.reduce((n, m) => n + m.value, 0), 100);
    assert.equal(data.outcomes.length, event.sport === "CS2" ? 2 : 3);
    assert.equal(data.groups["Тоталы"].reduce((n, m) => n + m.value, 0), 100);
    for (const market of [...data.outcomes, ...Object.values(data.groups).flat()]) {
      assert.ok(market.value > 0 && market.value < 100);
      assert.ok(market.odds > 1);
      const line = marketLine(event, market);
      assert.equal(line.at(-1), market.odds);
      assert.ok(line.every(value => Number.isFinite(value) && value > 1));
    }
  }
});
