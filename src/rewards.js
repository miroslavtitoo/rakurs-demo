export const DAILY_REWARDS = [10, 15, 15, 20, 20, 25, 25];
export const REWARD_COST = DAILY_REWARDS.reduce((sum, n) => sum + n, 0);
export const BUNDLE_DISCOUNT = 30;
export const emptyWallet = {
  balance: 0,
  streak: 0,
  lastClaimDay: null,
  lastShownDay: null,
  coupon: null,
  history: [],
};
export function rewardDay(now = Date.now()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Moscow",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(now));
  return ["year", "month", "day"]
    .map((k) => parts.find((p) => p.type === k).value)
    .join("-");
}
const ordinal = (day) =>
  /^\d{4}-\d{2}-\d{2}$/.test(day || "")
    ? Date.parse(day + "T00:00:00Z") / 86400000
    : NaN;
export function normalizeWallet(value) {
  const w = value && typeof value === "object" ? value : {};
  return {
    ...emptyWallet,
    ...w,
    balance: Number.isSafeInteger(w.balance) && w.balance >= 0 ? w.balance : 0,
    streak: Number.isSafeInteger(w.streak) && w.streak >= 0 ? w.streak : 0,
    history: Array.isArray(w.history) ? w.history : [],
    coupon: w.coupon?.percent === BUNDLE_DISCOUNT ? w.coupon : null,
  };
}
export function rewardStatus(value, now = Date.now()) {
  const w = normalizeWallet(value),
    day = rewardDay(now),
    gap = ordinal(day) - ordinal(w.lastClaimDay),
    claimed = gap === 0;
  const continuous = gap === 0 || gap === 1;
  const streak = continuous ? w.streak : 0;
  return {
    day,
    claimed,
    streak,
    index: streak % 7,
    canClaim: !claimed && !(gap < 0),
    amount: DAILY_REWARDS[streak % 7],
    shouldShow: w.lastShownDay !== day,
  };
}
export function claimReward(value, now = Date.now()) {
  const w = normalizeWallet(value),
    s = rewardStatus(w, now);
  if (!s.canClaim) return w;
  return {
    ...w,
    balance: w.balance + s.amount,
    streak: s.streak + 1,
    lastClaimDay: s.day,
    history: [
      { type: "daily", amount: s.amount, day: s.day },
      ...w.history,
    ].slice(0, 100),
  };
}
export function spendCoins(value, purpose, now = Date.now()) {
  const w = normalizeWallet(value);
  if (
    !["forecast", "coupon"].includes(purpose) ||
    w.balance < REWARD_COST ||
    (purpose === "coupon" && w.coupon)
  )
    return w;
  return {
    ...w,
    balance: w.balance - REWARD_COST,
    coupon:
      purpose === "coupon"
        ? { percent: BUNDLE_DISCOUNT, createdAt: now }
        : w.coupon,
    history: [
      { type: purpose, amount: -REWARD_COST, day: rewardDay(now) },
      ...w.history,
    ].slice(0, 100),
  };
}
export function packagePrice(pkg, wallet) {
  const discount =
    pkg.count > 1 && normalizeWallet(wallet).coupon ? BUNDLE_DISCOUNT : 0;
  return {
    price: Math.round((pkg.price * (100 - discount)) / 100),
    discount,
    original: pkg.price,
  };
}
