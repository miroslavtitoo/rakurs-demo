import test from "node:test";
import assert from "node:assert/strict";
import {
  DAILY_REWARDS,
  WEEKLY_REWARD,
  SPIN_COST,
  WHEEL_PRIZES,
  normalizeWallet,
  spinWheel,
  applyPromo,
  usePackageCoupon,
  referralLink,
  rewardCountdown,
  emptyWallet,
  rewardDay,
  rewardStatus,
  claimReward,
  packagePrice,
} from "../src/rewards.js";
const start = Date.parse("2026-11-14T09:00:00Z"),
  day = 86400000;
test("Seven consecutive daily claims total 130; each date can be claimed once", () => {
  let w = emptyWallet;
  assert.equal(WEEKLY_REWARD, 130);
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
test("Popup dates use Moscow, while claim countdown lasts 24h across midnight and reload", () => {
  assert.equal(rewardDay(Date.parse("2026-11-14T20:59:59Z")), "2026-11-14");
  assert.equal(rewardDay(Date.parse("2026-11-14T21:00:00Z")), "2026-11-15");
  const w = claimReward(emptyWallet, Date.parse("2026-11-14T20:59:59Z"));
  assert.equal(claimReward(w, Date.parse("2026-11-14T21:00:01Z")).balance, 10);
  assert.equal(rewardCountdown(rewardStatus(w, Date.parse("2026-11-14T20:59:59Z")).remaining), "24:00");
  assert.equal(rewardCountdown(rewardStatus(w, Date.parse("2026-11-14T21:00:59Z")).remaining), "23:59");
  assert.equal(claimReward(JSON.parse(JSON.stringify(w)), Date.parse("2026-11-15T20:59:59Z")).balance, 25);
  assert.equal(rewardCountdown(0), "00:00");
});
test("Wheel costs 10 once, selects every sector correctly and awards an inventory item", () => {
  assert.equal(SPIN_COST, 10);
  assert.equal(spinWheel({...emptyWallet,balance:9},0,start),null);
  for(let i=0;i<WHEEL_PRIZES.length;i++) {
    const {wallet:w,result} = spinWheel({...emptyWallet,balance:10},(i+.5)/8,start);
    const p=WHEEL_PRIZES[i];
    assert.equal(result.index,i);
    assert.equal(w.balance,p.kind === "coins" ? p.amount : 0);
    assert.equal(w.forecastRewards,p.kind === "forecast" ? 1 : 0);
    assert.equal(w.coupons.length,p.kind === "coupon" ? 1 : 0);
    assert.equal(w.spinCount,1);
    assert.equal(w.spinHistory[0].id,result.id);
  }
  for(const random of [-1,1,NaN,Infinity]) assert.equal(spinWheel({...emptyWallet,balance:10},random,start),null);
});
test("Coupons are retained individually, best bundle discount is consumed once; legacy coupon survives", () => {
  let w = normalizeWallet({balance:30,coupon:{percent:30}});
  w=spinWheel(w,1.5/8,start).wallet;
  assert.equal(w.coupons.length,2);
  assert.equal(packagePrice({count:1,price:199},w).price,199);
  const quote=packagePrice({count:3,price:549},w);
  assert.equal(quote.price,384);
  assert.equal(quote.discount,30);
  w=usePackageCoupon(w,quote.couponId);
  assert.equal(w.coupons.length,1);
  assert.equal(packagePrice({count:3,price:549},w).discount,10);
});
test("Promo codes normalize, apply once and reject unknown/empty codes without altering balance", () => {
  assert.equal(applyPromo(emptyWallet," ").ok,false);
  assert.equal(applyPromo(emptyWallet,"unknown").ok,false);
  const result=applyPromo(emptyWallet," diverge10 ",start);
  assert.equal(result.ok,true);
  assert.equal(result.wallet.balance,10);
  assert.equal(applyPromo(result.wallet,"DIVERGE10",start).ok,false);
  assert.equal(referralLink(123456),"https://t.me/demobett_bot?startapp=ref_123456");
  assert.equal(referralLink(null),null);
});
