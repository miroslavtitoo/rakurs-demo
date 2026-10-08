import test from "node:test";
import assert from "node:assert/strict";
import {
  fixtures,
  SPORTS,
  canAccess,
  activeSubscription,
  subscriptionMonth,
  replyToEvent,
} from "../src/assistantData.js";
test("All probabilities reconcile with factor vectors and stay exhaustive", () => {
  assert.equal(new Set(fixtures.map((e) => e.id)).size, fixtures.length);
  for (const e of fixtures) {
    assert.equal(
      e.probabilities.reduce((s, n) => s + n, 0),
      100,
    );
    assert.ok(e.probabilities.every((n) => n >= 0 && n <= 100));
    for (const f of e.factors)
      assert.equal(
        f.vector.reduce((s, n) => s + n, 0),
        0,
      );
    assert.deepEqual(
      e.probabilities,
      e.base.map((n, i) => n + e.factors.reduce((s, f) => s + f.vector[i], 0)),
    );
    assert.equal(e.factors.find((f) => f.id === "social").delta, 0);
  }
});
test("Catalog covers sports and lifecycle with coherent settlement", () => {
  for (const s of SPORTS.slice(1))
    assert.ok(fixtures.some((e) => e.sport === s));
  for (const s of ["upcoming", "live", "past"])
    assert.ok(fixtures.some((e) => e.status === s));
  for (const e of fixtures.filter((e) => e.status === "past")) {
    const [a, b] = e.score.split(" : ").map(Number);
    assert.equal(e.result, a > b ? "win" : "loss");
  }
  assert.ok(fixtures.some((e) => e.result === "loss"));
});
test("Purchase and subscription access expire independently and migrate old access", () => {
  const sub = { expiresAt: 200 };
  assert.equal(canAccess("a", [], sub, 100), true);
  assert.equal(canAccess("a", [], sub, 200), false);
  assert.equal(canAccess("a", ["a"], sub, 300), true);
  assert.equal(canAccess("a", [], null, 100, ["read-a"]), true);
  assert.equal(canAccess("b", [], null, 100, ["read-a"]), false);
  assert.equal(activeSubscription({}, 100), false);
});
test("One month subscription handles short months without overflow", () => {
  const start = new Date(2026, 0, 31, 12).getTime();
  const end = new Date(subscriptionMonth(start).expiresAt);
  assert.equal(end.getMonth(), 1);
  assert.equal(end.getDate(), 28);
});
test("Chat treats user claims as hypotheses and never silently recalculates", () => {
  const e = fixtures[0],
    before = JSON.stringify(e);
  assert.match(replyToEvent(e, "Если игрок не тренировался?"), /гипотезу/);
  assert.match(replyToEvent(e, "Что с праздником?"), /не доказывают/);
  assert.match(
    replyToEvent(e, "Почему такая вероятность?"),
    new RegExp(`${e.probabilities[0]}%`),
  );
  assert.equal(JSON.stringify(e), before);
});
