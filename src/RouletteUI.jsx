import React, { useEffect, useRef, useState } from "react";
import { animate, motion, useMotionValue, useMotionValueEvent, useReducedMotion, useTransform } from "motion/react";
import { ArrowLeft, ArrowRight, Check, ChevronRight, Gift, Sparkles, X } from "lucide-react";
import { Modal } from "./AssistantUI.jsx";
import { Coin } from "./RewardsUI.jsx";
import { SPIN_COST, WHEEL_PRIZES, prizeCountdown, prizeState } from "./rewards.js";
import "./roulette.css";

const artCells = { phone: [0,0], laptop: [1,0], coins: [2,0], coupon: [0,1], forecast: [1,1], cash: [2,1] };
const modulo = (value, length) => ((value % length) + length) % length;
function usePrizeClock(at) {
  const [now, setNow] = useState(at);
  useEffect(() => setNow(at), [at]);
  useEffect(() => { const timer=setInterval(()=>setNow(Date.now()),1000); return ()=>clearInterval(timer); },[]);
  return now;
}

export function PrizeArt({ prize, small = false }) {
  const type=prize.art || (prize.kind === "coupon" ? "coupon" : prize.kind === "forecast" ? "forecast" : "coins");
  const [x,y] = artCells[type] || artCells.coins;
  return <div className={`prize-art art-${type} ${small ? "small" : ""}`} aria-hidden="true">
    <div className="prize-sprite" style={{backgroundPosition:`${x*50}% ${y*100}%`}} />
    {type === "coupon" && <strong className="prize-ticket-number">−{prize.amount}%</strong>}
    {(type === "coins" || type === "cash") && <strong className="prize-value-tag">+{prize.amount} {type === "cash" ? "₽" : "монет"}</strong>}
    {type === "forecast" && <span className="prize-value-tag">Полный прогноз</span>}
  </div>;
}

function ReelCard({ absolute, position, spacing }) {
  const prize = WHEEL_PRIZES[modulo(absolute,WHEEL_PRIZES.length)];
  const y = useTransform(position, (v) => (absolute-v)*spacing);
  const scale = useTransform(position,(v)=>Math.max(.55,1-Math.abs(absolute-v)*.2));
  const opacity = useTransform(position,(v)=>Math.max(0,1-Math.abs(absolute-v)*.46));
  const rotateX = useTransform(position,(v)=>Math.max(-45,Math.min(45,(absolute-v)*-18)));
  return <motion.div className="reel-card" data-prize-id={prize.id} data-absolute={absolute} style={{y,scale,opacity,rotateX}} aria-hidden="true">
    <PrizeArt prize={prize} /><span className="reel-prize-name">{prize.label}</span>
  </motion.div>;
}

function PrizeResult({ item, app, close, again, secondary = "Крутить ещё" }) {
  const now = usePrizeClock(app.now), reduced=useReducedMotion(), [deviceInfo,setDeviceInfo]=useState(false);
  const current = app.wallet.prizes.find((p)=>p.id===item.id) || item;
  const status=prizeState(current,now), prize=item.prize;
  const usable=status === "available", timed=!!item.expiresAt;
  const use = () => {
    if (!usable) return;
    if (prize.kind === "device") { setDeviceInfo(true); return; }
    if (prize.kind === "coins") { again(); return; }
    if (prize.kind === "coupon") app.open({type:"plans"});
    else { app.dismiss(); app.go("/"); }
  };
  const description = prize.kind === "coupon" ? "Скидка применится к пакету от двух прогнозов. Купон уже в профиле и действует 24 часа."
    : prize.kind === "forecast" ? "Полная аналитика и чат по одному матчу. Выберите событие в течение 7 дней."
    : prize.kind === "cash" ? "Сумма уже зачислена на баланс. Используйте её при покупке прогноза или пакета."
    : prize.kind === "coins" ? "Монеты уже на балансе. Можно продолжить и открыть следующий приз."
    : "Ваш приз сохранён в аккаунте. Вернуться к нему можно в разделе «Мои призы».";
  return <motion.div className="roulette-result" initial={reduced ? false : {opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
    <button className="roulette-close" aria-label="Закрыть выигрыш" onClick={close}><X size={23}/></button>
    <div className="result-art-stage">
      <div className="result-rays" aria-hidden="true" />
      <motion.div className="result-art" initial={reduced ? false : {y:45,scale:.72,opacity:0}} animate={{y:0,scale:1,opacity:1}} transition={{duration:.8,ease:[.16,1,.3,1]}}><PrizeArt prize={prize}/></motion.div>
      {!reduced && <div className="result-sparkles" aria-hidden="true">{Array.from({length:12},(_,i)=><span key={i} style={{"--spark-index":i}}>✦</span>)}</div>}
      <span className="result-star star-one" aria-hidden="true">✦</span><span className="result-star star-two" aria-hidden="true">✦</span>
    </div>
    <div className="result-copy">
      <span className={`prize-validity state-${status}`}>
        {status === "used" ? "Использован" : status === "expired" ? "Срок истёк" : timed ? <time dateTime={new Date(item.expiresAt).toISOString()}>{prizeCountdown(item.expiresAt,now)}</time> : prize.kind === "coins" || prize.kind === "cash" ? <><Check size={15}/> Уже на балансе</> : "Сохранён в профиле"}
      </span>
      <h1>{prize.label}</h1><p>{description}</p>
      {deviceInfo && <p className="device-claim-info" role="status">Приз закреплён за аккаунтом. Оформление получения будет доступно к релизу.</p>}
      <div className="result-actions"><button className="m-button result-use" disabled={!usable} onClick={use}>{!usable ? status === "expired" ? "Срок истёк" : "Уже использован" : prize.kind === "device" ? "Как получить" : prize.kind === "coins" ? "Крутить ещё" : "Воспользоваться"}<ArrowRight size={17}/></button><button className="result-again" onClick={again}>{secondary}</button></div>
    </div>
  </motion.div>;
}

export function FortuneWheel({ app, close }) {
  const reduced=useReducedMotion(), unseen=app.wallet.prizes.find((p)=>p.revealedAt == null);
  const [phase,setPhase]=useState(unseen ? "result" : "idle"), [result,setResult]=useState(unseen || null);
  const position=useMotionValue(unseen?.index || 0), [center,setCenter]=useState(Math.floor(position.get()));
  const [spacing,setSpacing]=useState(245), stage=useRef(null), busy=useRef(false), animation=useRef(null), pending=useRef(null);
  useMotionValueEvent(position,"change",(v)=>{const next=Math.floor(v);setCenter((old)=>old===next?old:next);});
  useEffect(()=>{
    const measure=()=>setSpacing(Math.min(275,Math.max(170,stage.current.clientWidth*.64)));
    measure(); const observer=new ResizeObserver(measure);observer.observe(stage.current);return()=>observer.disconnect();
  },[]);
  useEffect(()=>{
    if (phase!=="idle" || reduced) return;
    let frame,last=performance.now();
    const tick=(now)=>{if(!document.hidden)position.set(position.get()+Math.min(now-last,64)/4700);last=now;frame=requestAnimationFrame(tick);};
    frame=requestAnimationFrame(tick);return()=>cancelAnimationFrame(frame);
  },[phase,reduced]);
  useEffect(()=>{if(phase==="result" && result)app.revealPrize(result.id);},[phase,result?.id]);
  useEffect(()=>()=>animation.current?.stop(),[]);
  const finish=()=>{
    if(!pending.current)return;
    setResult(pending.current);pending.current=null;busy.current=false;setPhase("result");app.finishSpin();
  };
  const spin=()=>{
    if(busy.current)return;
    const record=app.spin();if(!record)return;
    busy.current=true;pending.current=record;setResult(null);setPhase("spinning");
    const count=WHEEL_PRIZES.length, from=position.get(), base=Math.ceil(from)+count*6;
    const target=base+modulo(record.index-modulo(base,count),count);
    if(reduced){position.set(target);finish();}
    else animation.current=animate(position,target,{duration:6.2,ease:[.12,.68,.14,1],onComplete:finish});
  };
  const toIdle=()=>{setResult(null);setPhase("idle");};
  const spinning=phase==="spinning";
  return <Modal title="Рулетка призов" close={close} dismissible={!spinning} kind="roulette-screen dark-modal">
    <div className="roulette-layout" data-phase={phase}>
      <header className="roulette-header"><button className="roulette-back" aria-label="Закрыть" disabled={spinning} onClick={close}><ArrowLeft size={23}/></button><span>РУЛЕТКА ПРИЗОВ</span><button className="roulette-wallet" aria-label={`Монеты: ${app.wallet.balance}`} disabled={spinning} onClick={()=>app.open({type:"rewards"})}>{app.wallet.balance}<Coin/></button></header>
      <div className="roulette-reel" ref={stage} data-phase={phase}>
        <div className="roulette-aura" aria-hidden="true"/>
        <div className="reel-cards">{Array.from({length:7},(_,i)=>center+i-3).map((i)=><ReelCard key={i} absolute={i} position={position} spacing={spacing}/>)}</div>
        <div className="reel-selectors" aria-hidden="true"><span/><span/></div>
        <div className="roulette-side-actions"><button disabled={spinning} onClick={()=>app.open({type:"prizes",catalogue:true,returnTo:"wheel"})}><Gift size={23}/><span>Призы</span></button><button disabled={spinning} onClick={()=>app.open({type:"rewards"})}><Coin/><span>Монетки</span></button></div>
        {spinning && !reduced && <div className="roulette-speed-lines" aria-hidden="true">{Array.from({length:14},(_,i)=><i key={i} style={{"--line":i}}/>)}</div>}
      </div>
      <footer className="roulette-footer"><button className="m-button wheel-spin-button" disabled={spinning || app.wallet.balance < SPIN_COST} onClick={spin}>{spinning ? "Открываем ваш приз…" : <>Вращать <span>{SPIN_COST}<Coin/></span></>}</button>{app.wallet.balance < SPIN_COST && !spinning ? <button className="roulette-earn" onClick={()=>app.open({type:"rewards"})}>Получить монеты за вход <ChevronRight size={14}/></button> : <p>Каждый выигрыш сохраняется в профиле</p>}<div className="roulette-legal"><button onClick={()=>app.openLegal("terms")} disabled={spinning}>Условия использования</button><span>·</span><button onClick={()=>app.openLegal("privacy")} disabled={spinning}>Конфиденциальность</button></div></footer>
      {phase==="result" && result && <PrizeResult key={result.id} item={result} app={app} close={close} again={toIdle} secondary="К рулетке"/>}
    </div>
  </Modal>;
}

export function PrizeCollection({ app, close, catalogue=false }) {
  const [tab,setTab]=useState(catalogue ? "catalogue" : "mine"), [selected,setSelected]=useState(null), now=usePrizeClock(app.now);
  if(selected)return <Modal title="Ваш выигрыш" close={()=>setSelected(null)} kind="roulette-screen dark-modal"><PrizeResult item={selected} app={app} close={()=>setSelected(null)} again={()=>{app.open({type:"wheel"});}}/></Modal>;
  return <Modal title="Мои призы" close={close} kind="prize-collection dark-modal">
    <h1>Ваши открытия</h1><p className="prize-collection-intro">Сохранённые выигрыши всегда под рукой.</p>
    <div className="pdf-chips prize-tabs"><button aria-pressed={tab==="mine"} onClick={()=>setTab("mine")}>Мои призы · {app.wallet.prizes.length}</button><button aria-pressed={tab==="catalogue"} onClick={()=>setTab("catalogue")}>В рулетке</button></div>
    <div className="prize-grid">{tab==="catalogue" ? WHEEL_PRIZES.map((prize)=><div className="prize-grid-card" key={prize.id}><PrizeArt prize={prize} small/><strong>{prize.label}</strong><small>{prize.duration ? prize.kind==="coupon" ? "Действует 24 часа" : "Доступен 7 дней" : prize.kind==="device" ? "Главный приз" : "Начисляется на баланс"}</small></div>) : app.wallet.prizes.map((item)=><button className={`prize-grid-card state-${prizeState(item,now)}`} key={item.id} onClick={()=>setSelected(item)}><PrizeArt prize={item.prize} small/><strong>{item.prize.label}</strong><small>{prizeState(item,now)==="expired" ? "Срок истёк" : prizeState(item,now)==="used" ? "Использован" : item.expiresAt ? prizeCountdown(item.expiresAt,now) : item.prize.kind==="coins" || item.prize.kind==="cash" ? "Зачислено" : "Сохранён"}</small><ChevronRight size={14}/></button>)}</div>
    {tab==="mine" && !app.wallet.prizes.length && <div className="prize-empty"><Sparkles size={32}/><h2>Первое открытие впереди</h2><p>Вращайте рулетку за монеты — выигрыш появится здесь.</p><button className="m-button" onClick={()=>app.open({type:"wheel"})}>К рулетке</button></div>}
  </Modal>;
}
