export const DAILY_REWARDS = [10, 15, 15, 20, 20, 25, 25];
export const WEEKLY_REWARD = DAILY_REWARDS.reduce((sum, n) => sum + n, 0);
export const SPIN_COST = 10;
// Initial prize set, to be revised with the user's upcoming references/economy.
export const WHEEL_PRIZES = [
  { id: "coins5a", kind: "coins", amount: 5, label: "5 монет", short: "+5" },
  { id: "discount10", kind: "coupon", amount: 10, label: "Скидка 10% на пакет", short: "−10%" },
  { id: "coins15", kind: "coins", amount: 15, label: "15 монет", short: "+15" },
  { id: "forecast", kind: "forecast", amount: 1, label: "Бесплатный прогноз", short: "Прогноз" },
  { id: "coins5b", kind: "coins", amount: 5, label: "5 монет", short: "+5" },
  { id: "discount20", kind: "coupon", amount: 20, label: "Скидка 20% на пакет", short: "−20%" },
  { id: "coins10", kind: "coins", amount: 10, label: "10 монет", short: "+10" },
  { id: "discount30", kind: "coupon", amount: 30, label: "Скидка 30% на пакет", short: "−30%" },
];
export const PROMO_CODES = { DIVERGE10: { kind: "coins", amount: 10, label: "10 монет" } };
export const emptyWallet = {
  balance: 0,
  streak: 0,
  lastClaimDay: null,
  lastShownDay: null,
  coupon: null,
  coupons: [],
  forecastRewards: 0,
  spinCount: 0,
  spinHistory: [],
  usedPromoCodes: [],
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
    // Migrate the previously earned 30% coupon without discarding it.
    coupon: null,
    coupons: Array.isArray(w.coupons)
      ? w.coupons.filter((c) => c && [10,20,30].includes(c.percent) && typeof c.id === "string")
      : w.coupon?.percent === 30 ? [{ ...w.coupon, id: "legacy-coupon" }] : [],
    forecastRewards: Number.isSafeInteger(w.forecastRewards) && w.forecastRewards >= 0 ? w.forecastRewards : 0,
    spinCount: Number.isSafeInteger(w.spinCount) && w.spinCount >= 0 ? w.spinCount : 0,
    spinHistory: Array.isArray(w.spinHistory) ? w.spinHistory : [],
    usedPromoCodes: Array.isArray(w.usedPromoCodes) ? w.usedPromoCodes : [],
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
export function spinWheel(value, random = Math.random(), now = Date.now()) {
  const w = normalizeWallet(value);
  if (w.balance < SPIN_COST || !Number.isFinite(random) || random < 0 || random >= 1) return null;
  const index = Math.floor(random * WHEEL_PRIZES.length), prize = WHEEL_PRIZES[index];
  const id = `spin-${w.spinCount + 1}`;
  const result = { id, index, prize, date: now, cost: SPIN_COST };
  const next = {
    ...w,
    balance: w.balance - SPIN_COST + (prize.kind === "coins" ? prize.amount : 0),
    forecastRewards: w.forecastRewards + (prize.kind === "forecast" ? 1 : 0),
    coupons: prize.kind === "coupon" ? [...w.coupons, { id, percent: prize.amount, createdAt: now }] : w.coupons,
    spinCount: w.spinCount + 1,
    spinHistory: [result, ...w.spinHistory].slice(0, 50),
    history: [{ type: "spin", amount: -SPIN_COST, day: rewardDay(now), prize: prize.label }, ...w.history].slice(0, 100),
  };
  return { wallet: next, result };
}
export function applyPromo(value, input, now = Date.now()) {
  const w = normalizeWallet(value), code = String(input || "").trim().toUpperCase();
  if (!code) return { ok: false, message: "Введите промокод" };
  if (w.usedPromoCodes.includes(code)) return { ok: false, message: "Этот промокод уже активирован" };
  const gift = PROMO_CODES[code];
  if (!gift) return { ok: false, message: "Промокод не найден. Проверьте написание." };
  return { ok: true, message: `Промокод активирован: +${gift.label}`, wallet: {
    ...w, balance: w.balance + gift.amount, usedPromoCodes: [...w.usedPromoCodes, code],
    history: [{ type: "promo", code, amount: gift.amount, day: rewardDay(now) }, ...w.history].slice(0,100),
  }};
}
export function packagePrice(pkg, wallet) {
  const coupon = normalizeWallet(wallet).coupons.reduce((best,c) => !best || c.percent > best.percent ? c : best, null);
  const discount = pkg.count > 1 && coupon ? coupon.percent : 0;
  return { price: Math.round(pkg.price * (100 - discount) / 100), discount, original: pkg.price, couponId: discount ? coupon.id : null };
}
export function usePackageCoupon(wallet, couponId) {
  const w = normalizeWallet(wallet);
  return { ...w, coupons: w.coupons.filter((c) => c.id !== couponId) };
}
export function referralLink(telegramId) {
  return Number.isSafeInteger(telegramId) && telegramId > 0
    ? `https://t.me/demobett_bot?startapp=ref_${telegramId}` : null;
}
