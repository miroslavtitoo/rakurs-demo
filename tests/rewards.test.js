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
  prizeRoll,
  PRIZE_DAY,
  availableForecastRewards,
  consumeForecastReward,
  prizeState,
  balancePayment,
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
    const {wallet:w,result} = spinWheel({...emptyWallet,balance:10},prizeRoll(i),start);
    const p=WHEEL_PRIZES[i];
    assert.equal(result.index,i);
    assert.equal(w.balance,p.kind === "coins" ? p.amount : 0);
    assert.equal(availableForecastRewards(w,start),p.kind === "forecast" ? 1 : 0);
    assert.equal(w.bonusBalance,p.kind === "cash" ? p.amount : 0);
    assert.equal(w.prizes.length,1);
    assert.equal(w.coupons.length,p.kind === "coupon" ? 1 : 0);
    assert.equal(w.spinCount,1);
    assert.equal(w.spinHistory[0].id,result.id);
  }
  for(const random of [-1,1,NaN,Infinity]) assert.equal(spinWheel({...emptyWallet,balance:10},random,start),null);
});
test("Coupons are retained individually, best bundle discount is consumed once; legacy coupon survives", () => {
  let w = normalizeWallet({balance:30,coupon:{percent:30}});
  w=spinWheel(w,prizeRoll(1),start).wallet;
  assert.equal(w.coupons.length,2);
  assert.equal(packagePrice({count:1,price:199},w,start).price,199);
  const quote=packagePrice({count:3,price:549},w,start);
  assert.equal(quote.price,384);
  assert.equal(quote.discount,30);
  w=usePackageCoupon(w,quote.couponId,start);
  assert.equal(w.coupons.length,1);
  assert.equal(packagePrice({count:3,price:549},w,start).discount,10);
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

test("Timed forecast/coupon prizes expire without consuming permanent legacy access", () => {
  const f=spinWheel({...emptyWallet,balance:20,forecastRewards:2},prizeRoll(3),start);
  assert.equal(f.result.expiresAt,start+7*PRIZE_DAY);
  assert.equal(availableForecastRewards(f.wallet,start),3);
  assert.equal(availableForecastRewards(f.wallet,start+7*PRIZE_DAY),2);
  const used=consumeForecastReward(f.wallet,start+1000);
  assert.equal(used.forecastRewards,2);
  assert.equal(prizeState(used.prizes[0],start+1000),"used");
  const c=spinWheel({...emptyWallet,balance:20},prizeRoll(7),start);
  assert.equal(packagePrice({count:3,price:549},c.wallet,start).price,384);
  assert.equal(packagePrice({count:3,price:549},c.wallet,start+PRIZE_DAY).price,549);
  assert.equal(prizeState(c.result,start+PRIZE_DAY),"expired");
});
test("Cash is credited once with the saved outcome and offsets only the purchase amount", () => {
  const {wallet:w}=spinWheel({...emptyWallet,balance:10},prizeRoll(4),start);
  assert.equal(w.bonusBalance,25);
  assert.equal(normalizeWallet(JSON.parse(JSON.stringify(w))).bonusBalance,25);
  assert.deepEqual(balancePayment(199,w,40,true),{used:65,bonusUsed:25,regularUsed:40,due:134});
  assert.equal(balancePayment(199,w,40,false).due,199);
  assert.deepEqual(balancePayment(20,w,40,true),{used:20,bonusUsed:20,regularUsed:0,due:0});
  for(const index of [6,8]) assert.equal(spinWheel({...emptyWallet,balance:10},prizeRoll(index),start).result.prize.kind,"device");
});

test("Existing wheel history migrates without duplicating or losing available credits/coupons", () => {
  const previous={balance:15,forecastRewards:1,coupons:[{id:"spin-2",percent:20}],spinHistory:[{id:"spin-2",date:start,index:5,prize:{kind:"coupon",amount:20,label:"Скидка 20%"}},{id:"spin-1",date:start-1000,index:3,prize:{kind:"forecast",amount:1,label:"Бесплатный прогноз"}}]};
  const w=normalizeWallet(previous);
  assert.equal(w.prizes.length,2);
  assert.equal(availableForecastRewards(w,start),1);
  const used=consumeForecastReward(w,start);
  assert.equal(availableForecastRewards(used,start),0);
  assert.equal(normalizeWallet(JSON.parse(JSON.stringify(used))).prizes.length,2);
  assert.equal(packagePrice({count:3,price:549},used,start).discount,20);
});
