import test from "node:test";
import assert from "node:assert/strict";
import {
  events,
  authors,
  materials,
  archive,
  getStats,
  canRead,
} from "../src/data.js";

test("all event, author and material references are consistent", () => {
  assert.equal(events.length, 12);
  assert.equal(authors.length, 4);
  for (const e of events)
    assert.equal(
      materials.filter((m) => m.eventId === e.id).length,
      e.analyses,
    );
  assert.equal(new Set(materials.map((m) => m.id)).size, materials.length);
  for (const m of materials) {
    assert.ok(events.some((e) => e.id === m.eventId));
    assert.ok(authors.some((a) => a.id === m.authorId));
    assert.ok(m.price >= 0);
  }
});
test("statistics, chart and archive reconcile for every author and period", () => {
  for (const a of authors)
    for (const period of [30, 90, 365]) {
      const s = getStats(a.id, period);
      const profit = s.picks.reduce((n, p) => n + p.profit, 0);
      assert.equal(s.count, s.wins + s.losses + s.voids);
      assert.ok(s.picks.every((p) => p.daysAgo <= period));
      assert.ok(Math.abs(s.profit - profit) < 1e-9);
      assert.ok(Math.abs(s.roi - (profit / s.count) * 100) < 1e-9);
      assert.ok(Math.abs(s.curve.at(-1) - profit) < 0.0001);
      assert.equal(s.curve.length, s.count + 1);
      assert.ok(s.losses > 0);
      if (period >= 90) assert.ok(s.voids > 0);
      assert.ok(s.drawdown >= 0);
    }
});
test("settlement rules include wins, losses and voids", () => {
  for (const p of archive) {
    const expected =
      p.outcome === "win" ? p.odds - 1 : p.outcome === "loss" ? -1 : 0;
    assert.ok(Math.abs(p.profit - expected) < 1e-9);
  }
});
test("purchase grants only that material; subscription grants only that author", () => {
  const m = materials[0],
    other = materials.find((x) => x.authorId !== m.authorId && x.price > 0);
  assert.equal(canRead(m, [], []), false);
  assert.equal(canRead(m, [m.id], []), true);
  assert.equal(canRead(m, [], [m.authorId]), true);
  assert.equal(canRead(other, [m.id], [m.authorId]), false);
  assert.equal(canRead(m, [m.id], []), true); // Cancelling the subscription preserves a separate purchase.
});
test("free content is available without purchase", () => {
  const m = materials.find((m) => m.price === 0);
  assert.ok(m);
  assert.equal(canRead(m, [], []), true);
});
test("line endpoint agrees with displayed current odds", () => {
  for (const e of events) assert.equal(e.line.at(-1), e.odds);
});
