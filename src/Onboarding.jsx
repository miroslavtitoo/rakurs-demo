import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowLeft, ArrowRight, Bookmark, Check, Pause, Play, Sparkles, X } from "lucide-react";
import TeamMark from "./TeamMark.jsx";

const slides = [
  { label: "ДРУГОЙ ВЗГЛЯД НА ИГРУ", title: <>Не просто счёт.<br /><em>Весь контекст.</em></>, text: "Спорт и киберспорт в одном пространстве. Разбирайтесь в событиях, сравнивайте мнения и находите свой ракурс.", kind: "intro" },
  { label: "01 / СОБЫТИЯ", title: <>Важные матчи.<br /><em>На вашем радаре.</em></>, text: "Листайте события, выбирайте футбол или CS2 и сохраняйте интересное. Форма команд, карты и составы — уже рядом.", kind: "events" },
  { label: "02 / ДАННЫЕ", title: <>Цифры становятся<br /><em>понятнее.</em></>, text: "Изучайте исходы, тоталы и сценарии в дашборде. Смотрите, как менялась линия и что может повлиять на оценку.", kind: "data" },
  { label: "03 / АНАЛИТИКИ", title: <>У каждого мнения<br /><em>есть история.</em></>, text: "Сравнивайте подходы и результаты авторов. Открывайте отдельные разборы или подписывайтесь — всё сохранится в библиотеке.", kind: "authors" },
  { label: "04 / ВАШЕ ПРОСТРАНСТВО", title: <>Меньше шума.<br /><em>Больше понимания.</em></>, text: "Ракурс AI объяснит ключевые факторы. А в кабинете автора можно подготовить и опубликовать свой первый разбор.", kind: "ai" },
];

function StoryVisual({ kind }) {
  if (kind === "intro") return <div className="story-orb"><img src="./images/signal.webp" alt="" /><span className="story-orbit-tag"><Sparkles size={14} /> SPORTS INTELLIGENCE</span></div>;
  if (kind === "events") return <div className="story-demo-events">
    <div className="story-floating-label"><span className="tiny-dot" /> Сегодня в фокусе</div>
    <div className="story-match"><div><TeamMark code="NF" /><strong>Northern Foxes</strong></div><span>18:00</span><div><TeamMark code="M5" /><strong>Metro Five</strong></div><small>CS2 · Northern League</small></div>
    <div className="story-save"><Bookmark size={17} fill="currentColor" /> Событие в избранном <Check size={15} /></div>
  </div>;
  if (kind === "data") return <div className="story-demo-data"><span className="story-floating-label">Победа в серии · пример</span><div className="story-donut"><svg viewBox="0 0 140 140"><circle cx="70" cy="70" r="58" /><circle cx="70" cy="70" r="58" pathLength="100" strokeDasharray="58 100" /></svg><strong>58<span>%</span><small>оценка сценария</small></strong></div><div className="story-mini-metrics"><span>Тотал карт<strong>Больше 2,5</strong></span><span>Коэффициент<strong>1.82 <i>↘</i></strong></span></div></div>;
  if (kind === "authors") return <div className="story-demo-authors"><div className="story-portraits">{["lev", "mark", "anna"].map(id => <img key={id} src={`./images/analysts/${id}.webp`} alt="" />)}</div><div className="story-author-card"><span>Марк Волков <Check size={14} /></span><strong>Аргументы.<br />Альтернативы. История.</strong><div className="story-record"><i /><i /><i /><i /><i /><i /><i /></div><small>Включая неудачные прогнозы</small></div></div>;
  return <div className="story-demo-chat"><div className="story-user-bubble">Что может изменить оценку?</div><div className="story-ai-bubble"><Sparkles size={21} /><strong>Посмотрим глубже.</strong><p>Выбор карт, состав и форма соперников. Важно увидеть картину целиком.</p><small>Пример ответа Ракурс AI</small></div><span className="story-library"><Bookmark size={15} /> Ваши разборы — всегда под рукой</span></div>;
}

export default function Onboarding({ Modal, close }) {
  const [step, setStep] = useState(0);
  const [paused, setPaused] = useState(false);
  const [held, setHeld] = useState(false);
  const [progress, setProgress] = useState(0);
  const reduced = useReducedMotion();
  const gesture = useRef(null);
  const elapsed = useRef(0);
  const slide = slides[step];
  const last = step === slides.length - 1;
  function change(next) { elapsed.current = 0; setProgress(0); setStep(Math.max(0, Math.min(next, slides.length - 1))); }
  useEffect(() => {
    if (paused || held || reduced || last) return;
    let lastTime = performance.now();
    const resetClock = () => { lastTime = performance.now(); };
    document.addEventListener("visibilitychange", resetClock);
    const timer = setInterval(() => {
      const now = performance.now();
      if (!document.hidden) elapsed.current += now - lastTime;
      lastTime = now;
      setProgress(Math.min(elapsed.current / 9000, 1));
      if (elapsed.current >= 9000) change(step + 1);
    }, 80);
    return () => { clearInterval(timer); document.removeEventListener("visibilitychange", resetClock); };
  }, [step, paused, held, reduced, last]);
  return <Modal title="Знакомство с Ракурсом" onClose={close} className="stories-modal" hideHeading>
    <div className="stories-shell" onKeyDown={e => {
      if (e.key === "ArrowRight") { e.preventDefault(); change(step + 1); }
      if (e.key === "ArrowLeft") { e.preventDefault(); change(step - 1); }
    }}>
      <div className="stories-progress">{slides.map((s, i) => <button key={s.kind} aria-label={`Сторис ${i + 1} из 5`} aria-current={i === step ? "step" : undefined} onClick={() => change(i)}><span style={{ transform: `scaleX(${i < step ? 1 : i === step ? (last || reduced ? 1 : progress) : 0})` }} /></button>)}</div>
      <header className="stories-header"><span className="stories-brand">rakurs<span>.</span></span><span className="stories-counter">{String(step + 1).padStart(2, "0")} / 05</span><button className="icon-button" aria-label={paused ? "Продолжить сторис" : "Пауза сторис"} onClick={() => setPaused(!paused)}>{paused ? <Play size={17} /> : <Pause size={17} />}</button><button className="icon-button" aria-label="Закрыть знакомство" onClick={close}><X size={20} /></button></header>
      <div className="story-stage" onPointerDown={e => { gesture.current = { x: e.clientX, y: e.clientY, time: Date.now() }; setHeld(true); e.currentTarget.setPointerCapture(e.pointerId); }} onPointerUp={e => {
        setHeld(false); const start = gesture.current; gesture.current = null; if (!start) return;
        const dx = e.clientX - start.x, dy = e.clientY - start.y;
        if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) change(step + (dx < 0 ? 1 : -1));
        else if (Date.now() - start.time < 300 && Math.abs(dy) < 15) { const r = e.currentTarget.getBoundingClientRect(); change(step + (e.clientX - r.left < r.width * .32 ? -1 : 1)); }
      }} onPointerCancel={() => { setHeld(false); gesture.current = null; }}>
        <AnimatePresence mode="wait"><motion.div key={step} className={`story-page story-${slide.kind}`} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -15 }} transition={{ duration: reduced ? 0 : .24 }}>
          <div className="story-visual" aria-hidden="true"><StoryVisual kind={slide.kind} /></div>
          <div className="story-copy" aria-live="polite"><div className="eyebrow">{slide.label}</div><h2>{slide.title}</h2><p>{slide.text}</p></div>
        </motion.div></AnimatePresence>
      </div>
      <footer className="stories-footer"><div className="story-actions"><button className="secondary" disabled={step === 0} onClick={() => change(step - 1)} aria-label="Предыдущая сторис"><ArrowLeft size={19} /></button><button className="primary" onClick={() => last ? close() : change(step + 1)}>{last ? "Открыть Ракурс" : "Дальше"}<ArrowRight size={18} /></button></div><div className="stories-bottom"><span>Демо · данные и AI — примеры</span><button onClick={close}>Пропустить</button></div></footer>
    </div>
  </Modal>;
}
