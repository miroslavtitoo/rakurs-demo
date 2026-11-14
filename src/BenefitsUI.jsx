import React, { useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Gift, Ticket, Users, ChevronRight, Copy, Check, Sparkles } from "lucide-react";
import { Modal } from "./AssistantUI.jsx";
import { Coin } from "./RewardsUI.jsx";
import { SPIN_COST, WHEEL_PRIZES, referralLink } from "./rewards.js";

export function ProfileBenefits({ app }) {
  return (
    <section className="profile-benefits" aria-label="Бонусы и приглашения">
      <button className="profile-wheel-card" onClick={() => app.open({ type: "wheel" })}>
        <span className="benefit-icon"><Sparkles size={25} /></span>
        <span><strong>Колесо фортуны</strong><small>Одно вращение — {SPIN_COST} монет</small></span>
        <ChevronRight size={20} />
      </button>
      <div className="profile-benefit-links">
        <button onClick={() => app.open({ type: "promo" })}><Ticket size={20} /><strong>Промокод</strong><small>Активировать бонус</small><ChevronRight size={17} /></button>
        <button onClick={() => app.open({ type: "referral" })}><Users size={20} /><strong>Пригласить друзей</strong><small>Ваша ссылка</small><ChevronRight size={17} /></button>
      </div>
      {(app.wallet.forecastRewards > 0 || app.wallet.coupons.length > 0) && (
        <div className="prize-inventory">
          <span><Gift size={17} /> Ваши призы</span>
          {app.wallet.forecastRewards > 0 && <strong>Бесплатных прогнозов: {app.wallet.forecastRewards}</strong>}
          {app.wallet.coupons.length > 0 && <strong>Купонов на пакеты: {app.wallet.coupons.length}</strong>}
        </div>
      )}
    </section>
  );
}

export function FortuneWheel({ app, close }) {
  const reduced = useReducedMotion();
  const [rotation, setRotation] = useState(() => (360 - (app.wallet.spinHistory[0]?.index || 0) * 45) % 360), [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(app.wallet.spinHistory[0] || null);
  const [fresh, setFresh] = useState(false);
  const pending = useRef(null), busy = useRef(false);
  const finish = () => {
    if (!pending.current) return;
    setResult(pending.current);
    setFresh(true);
    pending.current = null;
    busy.current = false;
    setSpinning(false);
    app.finishSpin();
  };
  const spin = () => {
    if (busy.current) return;
    const record = app.spin();
    if (!record) return;
    busy.current = true;
    pending.current = record;
    setResult(null);
    const target = (360 - record.index * 45) % 360;
    setRotation((prev) => prev + 5 * 360 + ((target - (prev % 360) + 360) % 360));
    if (reduced) finish();
    else setSpinning(true);
  };
  return (
    <Modal title="Колесо фортуны" close={close} dismissible={!spinning} kind="benefits-modal wheel-modal dark-modal">
      <div className="wheel-heading"><h1>Поймайте свой бонус</h1><p>Вращайте колесо за монеты и открывайте новые призы.</p></div>
      <div className="wheel-balance"><Coin /> {app.wallet.balance} <span>монет у вас</span></div>
      <div className="wheel-stage">
        <span className="wheel-pointer" aria-hidden="true" />
        <motion.div className="fortune-disk" initial={false} animate={{ rotate: rotation }} transition={{ duration: reduced ? 0 : 4.8, ease: [0.12, 0.7, 0.15, 1] }} onAnimationComplete={finish} aria-hidden="true">
          {WHEEL_PRIZES.map((prize, i) => (
            <span className="wheel-segment-label" key={prize.id} style={{ "--segment-angle": `${i * 45}deg` }}>
              <span>{prize.kind === "coins" ? <Coin /> : prize.kind === "forecast" ? <Gift size={19} /> : <Ticket size={19} />}<strong>{prize.short}</strong></span>
            </span>
          ))}
        </motion.div>
        <span className="wheel-hub" aria-hidden="true"><img src="./images/diverge/mark.svg" alt="" /></span>
      </div>
      <div className="wheel-result" role="status" aria-live="polite">
        {spinning ? <span>Колесо вращается…</span> : result ? <><small>{fresh ? "Ваш приз" : "Последний приз"}</small><strong>{result.prize.label}</strong><span>{!fresh ? "Результат сохранён в истории вращений" : result.prize.kind === "coins" ? "Монеты уже на балансе" : result.prize.kind === "forecast" ? "Выберите любой матч — доступ уже в профиле" : "Купон сохранён. Лучшая скидка применится к пакету."}</span></> : <span>Скидки, бесплатные прогнозы и монеты</span>}
      </div>
      <button className="m-button wheel-spin-button" disabled={spinning || app.wallet.balance < SPIN_COST} onClick={spin}>
        {spinning ? "Вращаем…" : app.wallet.balance < SPIN_COST ? `Нужно ещё ${SPIN_COST - app.wallet.balance} монет` : `Крутить за ${SPIN_COST} монет`}
      </button>
      {!spinning && app.wallet.balance < SPIN_COST && <button className="text-button wheel-earn" onClick={() => app.open({ type: "rewards" })}>Получить монеты за вход</button>}
      <details className="wheel-rules"><summary>Призы и правила</summary><p>Каждый из 8 секторов имеет одинаковый шанс — 12,5%. Сектора «5 монет» два, общий шанс этого приза — 25%. Купоны действуют на один пакет от двух прогнозов, не складываются; сначала используется самая большая скидка. Бесплатный прогноз открывает анализ одного выбранного матча.</p></details>
      {app.wallet.spinHistory.length > 0 && <details className="wheel-rules"><summary>Последние призы</summary><ul>{app.wallet.spinHistory.slice(0, 5).map((item) => <li key={item.id}><span>{item.prize.label}</span><small>{new Date(item.date).toLocaleDateString("ru-RU")}</small></li>)}</ul></details>}
    </Modal>
  );
}

export function PromoSheet({ app, close }) {
  const [code, setCode] = useState(""), [result, setResult] = useState(null);
  return (
    <Modal title="Промокод" close={close} kind="benefits-modal dark-modal">
      <div className="benefit-large-icon"><Ticket size={32} /></div>
      <h1>Бонус по промокоду</h1><p className="benefit-description">Введите код из наших акций, чтобы получить бонус.</p>
      <form className="promo-form" onSubmit={(e) => { e.preventDefault(); setResult(app.applyPromo(code)); }}>
        <label htmlFor="promo-code">Промокод</label>
        <input id="promo-code" autoComplete="off" autoCapitalize="characters" spellCheck={false} maxLength={32} value={code} placeholder="Введите промокод" onChange={(e) => { setCode(e.target.value); setResult(null); }} />
        {result && <p className={result.ok ? "promo-success" : "promo-error"} role="status">{result.ok && <Check size={17} />}{result.message}</p>}
        <button className="m-button" disabled={!code.trim() || result?.ok} type="submit">{result?.ok ? "Бонус получен" : "Активировать"}</button>
      </form>
    </Modal>
  );
}

export function ReferralSheet({ app, close }) {
  const link = referralLink(app.user.telegramId), [copied, setCopied] = useState(false), [error, setError] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(link); setCopied(true); setError(false); }
    catch { setError(true); }
  };
  return (
    <Modal title="Пригласить друзей" close={close} kind="benefits-modal dark-modal">
      <div className="benefit-large-icon"><Users size={32} /></div>
      <h1>Вместе интереснее</h1><p className="benefit-description">Отправьте другу свою ссылку на Diverge.</p>
      <label className="referral-label" htmlFor="referral-link">Ваша ссылка</label>
      <input className="referral-link" id="referral-link" readOnly value={link || ""} onFocus={(e) => e.target.select()} />
      <button className="m-button referral-copy" onClick={copy} disabled={!link}>{copied ? <Check size={18} /> : <Copy size={18} />}{copied ? "Ссылка скопирована" : "Скопировать ссылку"}</button>
      {error && <p className="promo-error" role="status">Выделите ссылку выше и скопируйте её вручную.</p>}
      <p className="referral-coming">Учёт приглашений и реферальные бонусы появятся к релизу.</p>
    </Modal>
  );
}
