import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { Sparkles, X, Pause, Play, ArrowLeft, ArrowRight } from "lucide-react";
function useSaved(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("rakurs:" + key));
      return Array.isArray(initial)
        ? Array.isArray(saved)
          ? saved
          : initial
        : (saved ?? initial);
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem("rakurs:" + key, JSON.stringify(value));
    } catch {}
  }, [key, value]);
  return [value, setValue];
}

function Modal({ title, close, children, kind = "" }) {
  const panel = useRef(null);
  const closeRef = useRef(close);
  closeRef.current = close;
  useEffect(() => {
    const previous = document.activeElement;
    const shell = document.querySelector(".market-app");
    const overflow = document.body.style.overflow;
    shell.inert = true;
    document.body.style.overflow = "hidden";
    panel.current?.focus();
    const handle = (e) => {
      if (e.key === "Escape") closeRef.current();
      if (e.key !== "Tab") return;
      const nodes = [
        ...panel.current.querySelectorAll(
          'button:not([disabled]),a,input,select,[tabindex="0"]',
        ),
      ].filter((n) => n.getClientRects().length);
      const first = nodes[0],
        last = nodes.at(-1);
      if (!first) {
        e.preventDefault();
        return;
      }
      if (
        e.shiftKey &&
        (document.activeElement === first ||
          document.activeElement === panel.current)
      ) {
        e.preventDefault();
        last.focus();
      } else if (
        !e.shiftKey &&
        (document.activeElement === last ||
          document.activeElement === panel.current)
      ) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handle);
    return () => {
      document.removeEventListener("keydown", handle);
      shell.inert = false;
      document.body.style.overflow = overflow;
      if (previous?.isConnected) previous.focus();
    };
  }, []);
  return createPortal(
    <motion.div
      className="m-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={close}
    >
      <motion.section
        className={`m-modal ${kind}`}
        ref={panel}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="m-modal-head">
          <span>
            <Sparkles size={18} />
            {title}
          </span>
          <button className="m-icon" onClick={close} aria-label="Закрыть">
            <X size={20} />
          </button>
        </header>
        {children}
      </motion.section>
    </motion.div>,
    document.body,
  );
}

function Logo({ go }) {
  return (
    <button
      className="m-brand"
      onClick={() => go("/")}
      aria-label="Ракурс — прогнозы"
    >
      <span className="brand-symbol">r</span>rakurs
      <span className="brand-ai">AI</span>
    </button>
  );
}

const storySlides = [
  [
    "Найдите событие.",
    "Футбол, киберспорт, теннис, баскетбол и хоккей. Ближайшие матчи, текущий счёт и завершённые встречи — в одной ленте.",
    "События",
    "5",
    "направлений спорта",
  ],
  [
    "Откройте анализ.",
    "Купите прогноз на один матч за 199 ₽ или подключите доступ ко всем событиям на месяц. В демо деньги не списываются.",
    "Один матч",
    "199 ₽",
    "или подписка на все события",
  ],
  [
    "Поймите вероятность.",
    "Форма, личные встречи, составы и подготовка. Нажмите на фактор — увидите данные и его вклад в итоговую оценку.",
    "Прозрачная оценка",
    "65%",
    "50 + 8 + 5 − 2 + 4",
  ],
  [
    "Обсудите с AI.",
    "У каждого события свой чат. Задайте вопрос или добавьте свою гипотезу. В демо ответы подготовлены заранее; реальная модель пока не подключена.",
    "Чат по событию",
    "Почему?",
    "Разбираем аргументы вместе",
  ],
];
function Stories({ close }) {
  const [step, setStep] = useState(0),
    [paused, setPaused] = useState(false),
    [held, setHeld] = useState(false),
    [progress, setProgress] = useState(0);
  const reduced = useReducedMotion(),
    elapsed = useRef(0),
    touch = useRef(null);
  function change(n) {
    elapsed.current = 0;
    setProgress(0);
    setStep(Math.max(0, Math.min(3, n)));
  }
  useEffect(() => {
    if (paused || held || reduced || step === 3) return;
    let last = performance.now();
    const reset = () => {
      last = performance.now();
    };
    document.addEventListener("visibilitychange", reset);
    const timer = setInterval(() => {
      const now = performance.now();
      if (!document.hidden) elapsed.current += now - last;
      last = now;
      setProgress(elapsed.current / 8000);
      if (elapsed.current >= 8000) change(step + 1);
    }, 80);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", reset);
    };
  }, [step, paused, held, reduced]);
  const slide = storySlides[step];
  return (
    <Modal title="Знакомство с Ракурсом" close={close} kind="market-stories">
      <div className="story-progress">
        {storySlides.map((_, i) => (
          <button
            key={i}
            aria-label={`Сторис ${i + 1} из 4`}
            aria-current={i === step ? "step" : undefined}
            onClick={() => change(i)}
          >
            <i
              style={{
                width: `${i < step ? 100 : i === step ? (step === 3 || reduced ? 100 : progress * 100) : 0}%`,
              }}
            />
          </button>
        ))}
      </div>
      <div className="story-tools">
        <span>ЗНАКОМСТВО · {step + 1} / 4</span>
        <button
          className="m-icon"
          onClick={() => setPaused(!paused)}
          aria-label={paused ? "Продолжить сторис" : "Пауза сторис"}
        >
          {paused ? <Play size={17} /> : <Pause size={17} />}
        </button>
      </div>
      <div
        className="market-story-stage"
        onPointerDown={(e) => {
          touch.current = { x: e.clientX, y: e.clientY, time: Date.now() };
          setHeld(true);
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerUp={(e) => {
          setHeld(false);
          const start = touch.current;
          touch.current = null;
          if (!start) return;
          const dx = e.clientX - start.x,
            dy = e.clientY - start.y;
          if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy))
            change(step + (dx < 0 ? 1 : -1));
          else if (
            Math.abs(dx) < 15 &&
            Math.abs(dy) < 15 &&
            Date.now() - start.time < 300
          ) {
            const r = e.currentTarget.getBoundingClientRect();
            change(step + (e.clientX - r.left < r.width * 0.3 ? -1 : 1));
          }
        }}
        onPointerCancel={() => {
          setHeld(false);
          touch.current = null;
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className={`story-illustration illustration-${step}`}>
              <span className="story-halo" />
              <div className="story-widget">
                <Sparkles size={26} />
                <span>{slide[2]}</span>
                <strong>{slide[3]}</strong>
                <small>{slide[4]}</small>
                <div className="widget-bars">
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                </div>
              </div>
            </div>
            <h2>{slide[0]}</h2>
            <p>{slide[1]}</p>
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="story-footer">
        <div>
          <button
            className="m-secondary"
            onClick={() => change(step - 1)}
            disabled={step === 0}
            aria-label="Предыдущая сторис"
          >
            <ArrowLeft size={19} />
          </button>
          <button
            className="m-button"
            onClick={() => (step === 3 ? close() : change(step + 1))}
          >
            {step === 3 ? "Смотреть события" : "Дальше"}
            <ArrowRight size={18} />
          </button>
        </div>
        <button className="text-button" onClick={close}>
          Пропустить
        </button>
        <small>Демо · AI, прогнозы и оплата — примеры</small>
      </div>
    </Modal>
  );
}

export { useSaved, Modal, Logo, Stories };
