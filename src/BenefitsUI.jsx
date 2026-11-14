import React, { useState } from "react";
import { Gift, Ticket, Users, ChevronRight, Copy, Check, Sparkles } from "lucide-react";
import { Modal } from "./AssistantUI.jsx";
import { SPIN_COST, referralLink } from "./rewards.js";

export function ProfileBenefits({ app }) {
  return (
    <section className="profile-benefits" aria-label="Бонусы и приглашения">
      <button className="profile-wheel-card" onClick={() => app.open({ type: "wheel" })}>
        <span className="benefit-icon"><Sparkles size={25} /></span>
        <span><strong>Рулетка призов</strong><small>Одно вращение — {SPIN_COST} монет</small></span>
        <ChevronRight size={20} />
      </button>
      <div className="profile-benefit-links">
        <button onClick={() => app.open({ type: "promo" })}><Ticket size={20} /><strong>Промокод</strong><small>Активировать бонус</small><ChevronRight size={17} /></button>
        <button onClick={() => app.open({ type: "referral" })}><Users size={20} /><strong>Пригласить друзей</strong><small>Ваша ссылка</small><ChevronRight size={17} /></button>
      </div>
      <button className="profile-prizes-link" onClick={()=>app.open({type:"prizes"})}><Gift size={20}/><span><strong>Мои призы</strong><small>{app.wallet.prizes.length ? `Сохранено выигрышей: ${app.wallet.prizes.length}` : "Здесь будут ваши выигрыши"}</small></span><ChevronRight size={18}/></button>

    </section>
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
