import test from "node:test";
import assert from "node:assert/strict";
import {
  DAILY_REWARDS,
  REWARD_COST,
  emptyWallet,
  rewardDay,
  rewardStatus,
  claimReward,
  spendCoins,
  packagePrice,
} from "../src/rewards.js";
const start = Date.parse("2026-11-14T09:00:00Z"),
  day = 86400000;
test("Seven consecutive daily claims total 130; each date can be claimed once", () => {
  let w = emptyWallet;
  assert.equal(REWARD_COST, 130);
  for (let i = 0; i < 7; i++) {
    assert.equal(rewardStatus(w, start + i * day).amount, DAILY_REWARDS[i]);
    w = claimReward(w, start + i * day);
    const again = claimReward(w, start + i * day + 3600000);
    assert.deepEqual(again, w);
  }
  assert.equal(w.balance, 130);
  assert.equal(w.streak, 7);
  assert.equal(rewardStatus(w, start + 7 * day).amount, 10);
});
test("Missed day resets the streak but keeps coins; clock rollback never duplicates a claim", () => {
  const a = claimReward(emptyWallet, start),
    b = claimReward(a, start + 2 * day);
  assert.equal(b.balance, 20);
  assert.equal(b.streak, 1);
  assert.equal(rewardStatus(b, start + day).canClaim, false);
  assert.deepEqual(claimReward(b, start + day), b);
});
test("Daily boundaries use Moscow time rather than UTC or browser local time", () => {
  assert.equal(rewardDay(Date.parse("2026-11-14T20:59:59Z")), "2026-11-14");
  assert.equal(rewardDay(Date.parse("2026-11-14T21:00:00Z")), "2026-11-15");
  const w = claimReward(emptyWallet, Date.parse("2026-11-14T20:59:59Z"));
  assert.equal(claimReward(w, Date.parse("2026-11-14T21:00:01Z")).balance, 25);
});
test("Forecast and coupon each cost one week; discount applies to a bundle only", () => {
  const funded = { ...emptyWallet, balance: 130 };
  const forecast = spendCoins(funded, "forecast", start);
  assert.equal(forecast.balance, 0);
  assert.equal(forecast.coupon, null);
  const coupon = spendCoins(funded, "coupon", start);
  assert.equal(coupon.balance, 0);
  assert.equal(coupon.coupon.percent, 30);
  assert.equal(packagePrice({ count: 3, price: 549 }, coupon).price, 384);
  assert.equal(packagePrice({ count: 1, price: 199 }, coupon).price, 199);
  assert.deepEqual(spendCoins({ ...coupon, balance: 130 }, "coupon"), {
    ...coupon,
    balance: 130,
  });
  assert.equal(
    spendCoins({ ...emptyWallet, balance: 129 }, "forecast").balance,
    129,
  );
  assert.equal(spendCoins(funded, "unknown").balance, 130);
});
