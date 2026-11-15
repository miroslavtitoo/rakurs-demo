import test from "node:test";
import assert from "node:assert/strict";
import { OUTCOME_PACKAGES, FULL_PACKAGES } from "../src/plans.js";
import { emptyWallet, packagePrice } from "../src/rewards.js";

test("Larger packages cost less per forecast before and after every supported coupon", () => {
  for (const packs of [OUTCOME_PACKAGES, FULL_PACKAGES]) {
    for (const percent of [0, 10, 20, 30]) {
      const wallet = { ...emptyWallet, coupons: percent ? [{ id: "coupon", percent }] : [] };
      let previousUnit = Infinity, previousCount = 0, previousPrice = 0;
      for (const pack of packs) {
        const price = packagePrice(pack, wallet).price;
        assert.ok(pack.count > previousCount);
        assert.ok(Number.isSafeInteger(price) && price > previousPrice);
        assert.ok(price / pack.count < previousUnit, `count=${pack.count}, coupon=${percent}`);
        previousUnit = price / pack.count;
        previousCount = pack.count;
        previousPrice = price;
      }
    }
  }
});
