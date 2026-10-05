import HotEvents from "./HotEvents.jsx";
import React, { useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "motion/react";
import {
  ArrowUpRight,
  ArrowRight,
  Activity,
  Users,
  ShieldCheck,
  Sparkles,
  Gamepad2,
  Clock3,
  Layers3,
  ScanLine,
} from "lucide-react";

const reveal = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.1 },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
};

export default function Overview({
  useApp,
  EventList,
  Avatar,
  Tag,
  TeamMark,
  SectionHead,
  authors,
}) {
  const { navigate, setModal, favorites, favorite } = useApp();
  const hero = useRef(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: hero, offset: ["start start", "end start"] });
  const artworkY = useTransform(scrollYProgress, [0, 1], [0, 44]);
  return (
    <>
      <div className="page-intro overview-intro">
        <div>
          <div className="eyebrow">
            <span className="tiny-dot" /> ВАШЕ ПРЕИМУЩЕСТВО — КОНТЕКСТ
          </div>
          <h1>
            Другой взгляд <em>на игру.</em>
          </h1>
        </div>
        <div className="intro-note">
          <span className="intro-orbit">
            <ScanLine size={19} />
          </span>
          <span>
            Спорт и киберспорт.
            <br />В фокусе — главное.
          </span>
        </div>
      </div>
      <motion.div className="hero-grid" {...reveal}>
        <section
          ref={hero}
          className="hero-art"
          onPointerMove={(e) => {
            if (e.pointerType !== "mouse") return;
            const r = e.currentTarget.getBoundingClientRect();
            e.currentTarget.style.setProperty(
              "--light-x",
              `${e.clientX - r.left}px`,
            );
            e.currentTarget.style.setProperty(
              "--light-y",
              `${e.clientY - r.top}px`,
            );
          }}
        >
          <motion.div className="hero-artwork" style={{ y: reduced ? 0 : artworkY }}>
          <img
            src="./images/signal.webp"
            alt="Скульптура из полированного титана: орбиты вокруг графитовой сферы"
            fetchPriority="high"
          />
          </motion.div>
          <div className="hero-shade" />
          <div className="hero-content">
            <span className="hero-label">
              <span className="label-mark" /> RAKURS INTELLIGENCE
            </span>
            <h2>
              Вся игра.
              <br />
              <em>В одном ракурсе.</em>
            </h2>
            <p>
              Смотрите глубже счёта.
              <br />
              Данные, экспертиза и независимые мнения.
            </p>
            <button
              className="cream-button"
              onClick={() => navigate("/match/atlas-river")}
            >
              Исследовать событие{" "}
              <span>
                <ArrowUpRight size={19} />
              </span>
            </button>
          </div>
          <div className="hero-bottom">
            <span>
              <i /> БОЛЬШЕ ДАННЫХ. МЕНЬШЕ ШУМА.
            </span>
            <span>01 / INSIGHT</span>
          </div>
          <div className="hero-orbit-label">
            <span /> EVERYTHING IS CONNECTED
          </div>
        </section>
        <section className="spotlight">
          <div className="spotlight-top">
            <Tag tone="dark">
              <span className="tiny-dot" /> В ФОКУСЕ
            </Tag>
            <span className="sport-word">
              <Gamepad2 size={16} /> CS2
            </span>
          </div>
          <p className="muted">
            Northern League <span> / </span> BO3
          </p>
          <div className="spotlight-match">
            <div>
              <TeamMark code="NF" />
              <h3>
                Northern
                <br />
                Foxes
              </h3>
            </div>
            <span className="versus">VS</span>
            <div>
              <TeamMark code="M5" away />
              <h3>
                Metro
                <br />
                Five
              </h3>
            </div>
          </div>
          <div className="spotlight-time">
            <Clock3 size={13} /> Сегодня, 18:00 МСК
          </div>
          <div className="spotlight-insight">
            <Sparkles size={17} />
            <p>
              Форма — за Foxes.
              <br />
              <strong>Но всё может решить veto.</strong>
            </p>
          </div>
          <button
            className="text-arrow light"
            onClick={() => navigate("/match/fox-metro")}
          >
            Открыть матч{" "}
            <span>
              <ArrowUpRight size={18} />
            </span>
          </button>
        </section>
      </motion.div>
      <motion.div className="overview-shortcuts" {...reveal}>
        <button onClick={() => document.getElementById("radar").scrollIntoView({ behavior: reduced ? "instant" : "smooth", block: "start" })}>
          <Activity size={19} /><span><strong>Все события</strong><small>Расписание и фильтры</small></span><ArrowUpRight size={16} />
        </button>
        <button onClick={() => navigate("/analysts")}>
          <Users size={19} /><span><strong>Найти аналитика</strong><small>Подходы и история результатов</small></span><ArrowUpRight size={16} />
        </button>
        <button onClick={() => setModal({ type: "stories" })}>
          <Sparkles size={19} /><span><strong>Как это работает</strong><small>Ракурс в пяти сторис</small></span><ArrowUpRight size={16} />
        </button>
      </motion.div>
      <motion.div {...reveal}><HotEvents navigate={navigate} favorites={favorites} favorite={favorite} /></motion.div>
      <motion.div id="radar" {...reveal}>
        <EventList />
      </motion.div>
      <motion.div className="editorial-bottom" {...reveal}>
        <section>
          <SectionHead
            eyebrow="ЛЮДИ ЗА ЦИФРАМИ"
            title="Независимый взгляд"
            action={
              <button
                className="text-arrow"
                onClick={() => navigate("/analysts")}
              >
                Все аналитики <ArrowUpRight size={17} />
              </button>
            }
          />
          <div className="author-preview-grid">
            {authors.slice(0, 2).map((a) => (
              <button
                className="author-preview"
                key={a.id}
                onClick={() => navigate("/author/" + a.id)}
              >
                <Avatar author={a} />
                <span>
                  <strong>{a.name}</strong>
                  <small>{a.role}</small>
                  <Tag>{a.sport}</Tag>
                </span>
                <ArrowUpRight size={18} />
              </button>
            ))}
          </div>
        </section>
        <button
          className="manifesto"
          onClick={() => setModal({ type: "about" })}
        >
          <span>
            <Layers3 size={15} /> RAKURS PHILOSOPHY
          </span>
          <p>
            Детали меняют
            <br />
            <em>всё.</em>
          </p>
          <span className="manifesto-circle">
            <ArrowUpRight size={23} />
          </span>
        </button>
      </motion.div>
    </>
  );
}
