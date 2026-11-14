export const DAILY_REWARDS = [10, 15, 15, 20, 20, 25, 25];
export const WEEKLY_REWARD = DAILY_REWARDS.reduce((sum, n) => sum + n, 0);
export const SPIN_COST = 10;
// Provisional internal economy. These are not live promotion/fulfilment terms.
export const PRIZE_DAY = 86400000;
export const WHEEL_PRIZES = [
  { id: "coins5a", kind: "coins", amount: 5, weight: 20, label: "5 монет", short: "+5", art: "coins" },
  { id: "discount10", kind: "coupon", amount: 10, weight: 25, label: "Скидка 10% на пакет", short: "−10%", art: "coupon", duration: PRIZE_DAY },
  { id: "coins15", kind: "coins", amount: 15, weight: 16, label: "15 монет", short: "+15", art: "coins" },
  { id: "forecast", kind: "forecast", amount: 1, weight: 8, label: "Бесплатный прогноз", short: "Прогноз", art: "forecast", duration: 7 * PRIZE_DAY },
  { id: "balance25", kind: "cash", amount: 25, weight: 18, label: "25 ₽ на баланс", short: "+25 ₽", art: "cash" },
  { id: "discount20", kind: "coupon", amount: 20, weight: 8, label: "Скидка 20% на пакет", short: "−20%", art: "coupon", duration: PRIZE_DAY },
  { id: "iphone", kind: "device", amount: 1, weight: .08, label: "iPhone", short: "iPhone", art: "phone" },
  { id: "discount30", kind: "coupon", amount: 30, weight: 4.84, label: "Скидка 30% на пакет", short: "−30%", art: "coupon", duration: PRIZE_DAY },
  { id: "macbook", kind: "device", amount: 1, weight: .08, label: "MacBook", short: "MacBook", art: "laptop" },
];
export function prizeIndexForRoll(random) {
  if (!Number.isFinite(random) || random < 0 || random >= 1) return -1;
  const total = WHEEL_PRIZES.reduce((n,p) => n + p.weight, 0);
  let sum = 0;
  for (let i=0; i<WHEEL_PRIZES.length; i++) { sum += WHEEL_PRIZES[i].weight; if (random * total < sum) return i; }
  return WHEEL_PRIZES.length - 1;
}
export function prizeRoll(index) {
  const total = WHEEL_PRIZES.reduce((n,p) => n + p.weight, 0);
  return (WHEEL_PRIZES.slice(0,index).reduce((n,p) => n+p.weight,0) + WHEEL_PRIZES[index].weight / 2) / total;
}
export const PROMO_CODES = { DIVERGE10: { kind: "coins", amount: 10, label: "10 монет" } };
export const emptyWallet = {
  balance: 0,
  streak: 0,
  lastClaimDay: null,
  lastClaimAt: null,
  lastShownDay: null,
  coupon: null,
  coupons: [],
  forecastRewards: 0,
  bonusBalance: 0,
  prizes: [],
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
export function normalizeWallet(value) {
  const w = value && typeof value === "object" ? value : {};
  const coupons=Array.isArray(w.coupons) ? w.coupons.filter((c)=>c && [10,20,30].includes(c.percent) && typeof c.id==="string") : w.coupon?.percent===30 ? [{...w.coupon,id:"legacy-coupon"}] : [];
  let remaining=Number.isSafeInteger(w.forecastRewards) ? Math.max(0,w.forecastRewards) : 0;
  const oldPrizes=(Array.isArray(w.spinHistory) ? w.spinHistory : []).filter((p)=>p?.prize).map((p)=>{
    let used=false;
    if(p.prize.kind==="forecast") {used=remaining<=0;if(!used)remaining--;}
    if(p.prize.kind==="coupon") used=!coupons.some((c)=>c.id===p.id);
    return {...p,legacy:true,revealedAt:p.date||0,usedAt:used ? p.date||0 : null,expiresAt:null};
  });
  for(const c of coupons) if(!oldPrizes.some((p)=>p.id===c.id)) oldPrizes.push({id:c.id,index:1,prize:{id:"legacy-coupon",kind:"coupon",amount:c.percent,label:`Скидка ${c.percent}% на пакет`,art:"coupon"},date:c.createdAt||0,legacy:true,revealedAt:c.createdAt||0,usedAt:null,expiresAt:c.expiresAt||null});
  return {
    ...emptyWallet,
    ...w,
    balance: Number.isSafeInteger(w.balance) && w.balance >= 0 ? w.balance : 0,
    streak: Number.isSafeInteger(w.streak) && w.streak >= 0 ? w.streak : 0,
    history: Array.isArray(w.history) ? w.history : [],
    // Migrate the previously earned 30% coupon without discarding it.
    coupon: null,
    coupons,
    bonusBalance: Number.isSafeInteger(w.bonusBalance) && w.bonusBalance >= 0 ? w.bonusBalance : 0,
    prizes: Array.isArray(w.prizes) ? w.prizes : oldPrizes,
    forecastRewards: Number.isSafeInteger(w.forecastRewards) && w.forecastRewards >= 0 ? w.forecastRewards : 0,
    spinCount: Number.isSafeInteger(w.spinCount) && w.spinCount >= 0 ? w.spinCount : 0,
    spinHistory: Array.isArray(w.spinHistory) ? w.spinHistory : [],
    usedPromoCodes: Array.isArray(w.usedPromoCodes) ? w.usedPromoCodes : [],
  };
}
export const REWARD_INTERVAL = 24 * 60 * 60 * 1000;
export function rewardStatus(value, now = Date.now()) {
  const w = normalizeWallet(value), day = rewardDay(now);
  // Legacy dates migrate to Moscow midnight; new claims retain their exact time.
  const legacyAt = /^\d{4}-\d{2}-\d{2}$/.test(w.lastClaimDay || "") ? Date.parse(w.lastClaimDay + "T00:00:00+03:00") : NaN;
  const lastAt = Number.isFinite(w.lastClaimAt) && w.lastClaimAt > 0 ? w.lastClaimAt : legacyAt;
  const hasClaim = Number.isFinite(lastAt), elapsed = now - lastAt;
  const nextAt = hasClaim ? lastAt + REWARD_INTERVAL : now;
  const canClaim = !hasClaim || now >= nextAt;
  const streak = hasClaim && elapsed < 2 * REWARD_INTERVAL ? w.streak : 0;
  return { day, claimed: !canClaim, canClaim, streak, index: streak % 7, amount: DAILY_REWARDS[streak % 7], nextAt, remaining: Math.max(0, nextAt - now), shouldShow: w.lastShownDay !== day };
}
export function rewardCountdown(remaining) {
  const minutes = Math.max(0, Math.ceil(remaining / 60000));
  return `${String(Math.floor(minutes / 60)).padStart(2,"0")}:${String(minutes % 60).padStart(2,"0")}`;
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
    lastClaimAt: now,
    history: [
      { type: "daily", amount: s.amount, day: s.day },
      ...w.history,
    ].slice(0, 100),
  };
}
export function spinWheel(value, random = Math.random(), now = Date.now()) {
  const w = normalizeWallet(value), index = prizeIndexForRoll(random);
  if (w.balance < SPIN_COST || index < 0) return null;
  const prize = WHEEL_PRIZES[index], id = `spin-${w.spinCount + 1}`;
  const result = { id, index, prize: { ...prize }, date: now, cost: SPIN_COST, expiresAt: prize.duration ? now + prize.duration : null, usedAt: null };
  const next = {
    ...w,
    balance: w.balance - SPIN_COST + (prize.kind === "coins" ? prize.amount : 0),
    bonusBalance: w.bonusBalance + (prize.kind === "cash" ? prize.amount : 0),
    prizes: [result, ...w.prizes],
    coupons: prize.kind === "coupon" ? [...w.coupons, { id, percent: prize.amount, createdAt: now, expiresAt: result.expiresAt }] : w.coupons,
    spinCount: w.spinCount + 1,
    spinHistory: [result, ...w.spinHistory].slice(0, 50),
    history: [{ type: "spin", amount: -SPIN_COST, day: rewardDay(now), prize: prize.label }, ...w.history].slice(0, 100),
  };
  return { wallet: next, result };
}
export function prizeState(item, now = Date.now()) {
  if (item.usedAt != null) return "used";
  if (item.expiresAt && item.expiresAt <= now) return "expired";
  return "available";
}
export function availableForecastRewards(wallet, now = Date.now()) {
  const w = normalizeWallet(wallet);
  return w.forecastRewards + w.prizes.filter((p) => !p.legacy && p.prize.kind === "forecast" && prizeState(p,now) === "available").length;
}
export function consumeForecastReward(wallet, now = Date.now()) {
  const w = normalizeWallet(wallet);
  const item = w.prizes.filter((p) => p.prize.kind === "forecast" && prizeState(p,now) === "available").sort((a,b)=>(a.expiresAt||Infinity)-(b.expiresAt||Infinity))[0];
  if (item) return { ...w, forecastRewards:item.legacy ? Math.max(0,w.forecastRewards-1) : w.forecastRewards, prizes: w.prizes.map((p) => p.id === item.id ? { ...p, usedAt: now } : p) };
  return w.forecastRewards > 0 ? { ...w, forecastRewards: w.forecastRewards - 1 } : w;
}
export function prizeCountdown(expiresAt, now = Date.now()) {
  const seconds = Math.max(0, Math.ceil((expiresAt - now) / 1000));
  const days = Math.floor(seconds / 86400);
  const clock = [Math.floor(seconds % 86400 / 3600),Math.floor(seconds % 3600 / 60),seconds % 60].map((n)=>String(n).padStart(2,"0")).join(":");
  return days ? `${days} д · ${clock}` : clock;
}
export function balancePayment(price, wallet, regularBalance = 0, enabled = true) {
  const w = normalizeWallet(wallet), regular = Math.max(0,Number(regularBalance) || 0);
  const used = enabled ? Math.min(price,w.bonusBalance+regular) : 0;
  return { used, bonusUsed: Math.min(used,w.bonusBalance), regularUsed: Math.max(0,used-w.bonusBalance), due: price-used };
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
export function packagePrice(pkg, wallet, now = Date.now()) {
  const coupon = normalizeWallet(wallet).coupons.filter((c) => !c.expiresAt || c.expiresAt > now).reduce((best,c) => !best || c.percent > best.percent ? c : best, null);
  const discount = pkg.count > 1 && coupon ? coupon.percent : 0;
  return { price: Math.round(pkg.price * (100 - discount) / 100), discount, original: pkg.price, couponId: discount ? coupon.id : null };
}
export function usePackageCoupon(wallet, couponId, now = Date.now()) {
  const w = normalizeWallet(wallet);
  return { ...w, coupons: w.coupons.filter((c) => c.id !== couponId), prizes: w.prizes.map((p) => p.id === couponId ? { ...p, usedAt: now } : p) };
}
export function referralLink(telegramId) {
  return Number.isSafeInteger(telegramId) && telegramId > 0
    ? `https://t.me/demobett_bot?startapp=ref_${telegramId}` : null;
}
