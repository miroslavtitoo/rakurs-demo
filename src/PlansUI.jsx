import React, { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, Check, Sparkles, ShieldCheck, Ticket } from "lucide-react";
import { prizeCountdown } from "./rewards.js";
import { useSaved } from "./AssistantUI.jsx";

export const OUTCOME_PACKAGES = [{ count: 3, price: 29 }, { count: 5, price: 129 }, { count: 10, price: 259 }];
export const FULL_PACKAGES = [{ count: 1, price: 199 }, { count: 3, price: 549 }, { count: 5, price: 899 }];
const money = (n) => n.toLocaleString("ru-RU", { maximumFractionDigits: 2 });
const matches = (n) => n === 1 ? "матч" : n < 5 ? "матча" : "матчей";

export function CouponNotice({ app }) {
  const [seen, setSeen] = useSaved("offerNotices", []), [visible,setVisible] = useState(false), [now,setNow] = useState(Date.now());
  const coupon = app.wallet.coupons.filter(c => c.expiresAt > now && !seen.includes(c.id)).sort((a,b) => b.percent-a.percent)[0];
  const [shown,setShown] = useState(null);
  useEffect(() => {
    if (!coupon || shown) return;
    const timer=setTimeout(()=>{setNow(Date.now());setShown(coupon);setVisible(true);setSeen(p=>[...p,coupon.id]);},5000);
    return()=>clearTimeout(timer);
  },[coupon?.id,shown]);
  useEffect(()=>{if(!visible)return;const t=setTimeout(()=>setVisible(false),14000);const clock=setInterval(()=>setNow(Date.now()),1000);return()=>{clearTimeout(t);clearInterval(clock);};},[visible]);
  if(!visible || !shown || shown.expiresAt <= now)return null;
  return <motion.aside className="coupon-notice" style={{x:"-50%"}} initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{duration:.5}} aria-label="Ваш действующий купон"><button className="coupon-notice-open" onClick={()=>{setVisible(false);app.go("/subscription");}}><Ticket size={22}/><span><strong>Ваша скидка {shown.percent}% на пакет</strong><small>До конца <time>{prizeCountdown(shown.expiresAt,now)}</time></small></span><ArrowRight size={17}/></button><button className="coupon-notice-close" aria-label="Скрыть предложение" onClick={()=>setVisible(false)}>×</button></motion.aside>;
}

export function PlansContent({ app }) {
  const [tier, setTier] = useState("outcome"), [selected, setSelected] = useState(0), [now, setNow] = useState(Date.now());
  const reduced = useReducedMotion();
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, []);
  const packs = tier === "outcome" ? OUTCOME_PACKAGES : FULL_PACKAGES;
  const coupon = app.wallet.coupons.filter(c => !c.expiresAt || c.expiresAt > now).sort((a,b) => b.percent-a.percent)[0];
  const credits = tier === "outcome" ? app.outcomeCredits : app.credits;
  return <div className="plans-experience">
    <header className="plans-hero">
      <span className="plans-kicker"><Sparkles size={14}/> RAKURS · ПАКЕТЫ</span>
      <h1>Больше матчей.<br/><em>Ваш темп.</em></h1>
      <p>Выберите формат и количество прогнозов.<br/>Открывайте матчи, когда захотите.</p>
      {credits > 0 && <button className="plans-owned" onClick={() => app.go("/")}>Осталось доступов: {credits}<ArrowRight size={14}/></button>}
    </header>
    {coupon && <section className="plans-offer" aria-label="Действующая скидка">
      <span className="offer-symbol"><Ticket size={25}/></span>
      <div><strong>Ваш купон −{coupon.percent}%</strong><span>На один пакет от двух матчей</span></div>
      {coupon.expiresAt ? <time dateTime={new Date(coupon.expiresAt).toISOString()}>{prizeCountdown(coupon.expiresAt,now)}</time> : <span>Без срока</span>}
    </section>}
    <div className="pdf-chips plan-toggle" aria-label="Состав пакета">
      <button aria-pressed={tier === "outcome"} onClick={() => { setTier("outcome"); setSelected(0); }}>Исходы матчей</button>
      <button aria-pressed={tier === "full"} onClick={() => { setTier("full"); setSelected(0); }}>Полная аналитика</button>
    </div>
    <p className="plans-tier-caption">{tier === "outcome" ? "Вероятности и расстановка сил — коротко по делу" : "Вероятности, факторы и отдельный чат по матчу"}</p>
    <div className="plans-grid">
      {packs.map((pack,i) => {
        const quote = app.packageQuote(pack, now);
        return <motion.button key={`${tier}-${pack.count}`} className={`package-card polished-package ${selected === i ? "selected" : ""}`} aria-pressed={selected === i} onClick={() => setSelected(i)} initial={reduced ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{duration:.5,delay:i*.07,ease:[.22,1,.36,1]}}>
          <div className="pack-topline"><span>{["Для знакомства","В ритме спорта","На серию матчей"][i]}</span><span className="pack-check">{selected === i && <Check size={13}/>}</span></div>
          <h2>{pack.count} <span>{matches(pack.count)}</span></h2>
          <div className="pack-price"><strong>{money(quote.price)} <small>₽</small></strong>{quote.discount > 0 && <><del>{money(pack.price)} ₽</del><b>−{quote.discount}%</b></>}</div>
          <span className="pack-unit">{money(quote.price / pack.count)} ₽ за прогноз</span>
          <span className="pack-features"><Check size={13}/>{tier === "outcome" ? "Вероятности исходов" : "Факторы и чат с AI"}<span/><Check size={13}/>Матчи на ваш выбор</span>
        </motion.button>;
      })}
    </div>
    <div className="plans-checkout"><button className="m-button" onClick={() => app.open({type:"order",package:{...packs[selected],tier}})}>Купить пакет · {money(app.packageQuote(packs[selected],now).price)} ₽<ArrowRight size={18}/></button><p><ShieldCheck size={13}/>Разовая покупка · без автопродления</p></div>
    <section className="plans-explained"><h2>Всё понятно до покупки</h2>{[
      ["Как использовать пакет?","После покупки доступы появятся в профиле. Выберите матч и откройте исход или полную аналитику из своего пакета."],
      ["Чем отличаются форматы?","Исходы — вероятности и расстановка сил. Полная аналитика добавляет аргументы, разбор факторов и чат по событию."],
      ["Как работает купон?","Лучший действующий купон применяется автоматически к одному пакету от двух матчей. Скидки не складываются; итоговая цена видна в заказе."],
      ["Гарантирован ли результат?","Прогноз — вероятностная оценка. Он не гарантирует исход матча; приложение не принимает ставки."],
    ].map(([q,a]) => <details key={q}><summary>{q}<span>+</span></summary><p>{a}</p></details>)}</section>
  </div>;
}
