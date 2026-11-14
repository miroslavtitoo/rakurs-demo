import React, { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  Activity,
  Trophy,
  HeartPulse,
  Dumbbell,
  CircleDot,
  Goal,
  MessageSquareQuote,
  ChartPie,
} from "lucide-react";

const ease = [0.22, 1, 0.36, 1];
const cards = [
  {
    image: "hockey",
    names: ["Ак Барс", "ЦСКА"],
    x: -91,
    y: 19,
    rotate: -13,
    delay: 0.12,
  },
  {
    image: "basketball",
    names: ["Лейкерс", "Чикаго"],
    x: 89,
    y: -15,
    rotate: 12,
    delay: 0.22,
  },
  {
    image: "football",
    names: ["Барселона", "Атлетико Мадрид"],
    x: 0,
    y: 0,
    rotate: 4,
    delay: 0,
  },
];
function SportsCards({ reduced, paused }) {
  return (
    <div className="story-cards-composition">
      {cards.map((c, i) => (
        <motion.div
          className={`story-sport-card card-${i}`}
          key={c.image}
          initial={
            reduced
              ? false
              : { opacity: 0, x: 0, y: 160, rotate: 0, scale: 0.86 }
          }
          animate={{
            opacity: 1,
            x: c.x,
            y: c.y,
            rotate: c.rotate,
            scale: 1,
          }}
          transition={
            reduced
              ? { duration: 0 }
              : { duration: 1.3, delay: c.delay, ease: [0.16, 1, 0.3, 1] }
          }
        >
          <div
            className="story-card-float"
            style={{
              animationDelay: `${1.5 + i * 0.15}s`,
              animationPlayState: paused ? "paused" : "running",
            }}
          >
            <img
              src={`./images/diverge/story-${c.image}.webp`}
              alt=""
              draggable="false"
            />
            <span className="story-card-live">
              <i /> {i === 2 ? "LIVE" : "PRE-MATCH"}
            </span>
            <div className="story-card-names">
              <span>{c.names[0]}</span>
              <span>{c.names[1]}</span>
              <small>{i === 2 ? "1:0" : "22:30"}</small>
            </div>
          </div>
        </motion.div>
      ))}
      <span className="story-art-caption"></span>
    </div>
  );
}
function AnalysisOrbit({ reduced, paused }) {
  const icons = [Dumbbell, Trophy, Goal, HeartPulse, CircleDot, Activity];
  return (
    <div className="story-orbit-composition">
      <motion.div
        className="story-orbit-center"
        initial={reduced ? false : { scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: reduced ? 0 : 1.0, ease }}
      >
        <ChartPie size={72} strokeWidth={0} fill="currentColor" />
        <span className="orbit-center-shine" />
      </motion.div>
      <div
        className="story-orbit-spinner"
        style={{ animationPlayState: paused ? "paused" : "running" }}
      >
        <svg className="story-dashed-orbit" viewBox="0 0 300 300">
          <defs>
            <mask id="orbit-reveal-mask">
              <motion.circle
                cx="150"
                cy="150"
                r="112"
                fill="none"
                stroke="white"
                strokeWidth="4"
                pathLength="1"
                initial={reduced ? false : { strokeDasharray: "0 1" }}
                animate={{ strokeDasharray: "1 1" }}
                transition={{
                  duration: reduced ? 0 : 1.3,
                  delay: 0.5,
                  ease: "linear",
                }}
              />
            </mask>
          </defs>
          <circle
            cx="150"
            cy="150"
            r="112"
            fill="none"
            stroke="#e3c0ff66"
            strokeWidth="1"
            strokeDasharray="2 5"
            mask="url(#orbit-reveal-mask)"
          />
        </svg>
        {icons.map((Icon, i) => {
          const a = ((-90 + i * 60) * Math.PI) / 180;
          return (
            <motion.div
              key={i}
              className="story-orbit-position"
              initial={reduced ? false : { x: 0, y: 0, opacity: 0, scale: 0.75 }}
              animate={{
                x: Math.cos(a) * 112,
                y: Math.sin(a) * 112,
                opacity: 1,
                scale: 1,
              }}
              transition={{
                duration: reduced ? 0 : 1.1,
                delay: 0.35 + i * 0.095,
                ease,
              }}
            >
              <div
                className="story-orbit-counter"
                style={{ animationPlayState: paused ? "paused" : "running" }}
              >
                <div
                  className="story-orbit-node"
                  style={{
                    animationDelay: `${1.8 + i * 0.15}s`,
                    animationPlayState: paused ? "paused" : "running",
                  }}
                >
                  <Icon size={23} strokeWidth={2.7} />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
function ProbabilityGauge({ reduced, paused }) {
  const [value, setValue] = useState(reduced ? 74 : 0);
  const elapsed = useRef(0);
  useEffect(() => {
    if (reduced) { setValue(74); return; }
    if (paused) return;
    let last = performance.now(), frame;
    const tick = (at) => {
      elapsed.current += Math.min(at - last, 64); last = at;
      const progress = Math.min(1, Math.max(0, (elapsed.current - 500) / 1550));
      setValue(Math.round(74 * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [reduced, paused]);
  // A decorative story example, independent from fixture predictions.
  const path = "M 50 210 A 113 113 0 1 1 210 210";
  return (
    <div className="story-gauge-composition">
      <span className="story-gauge-glow" />
      <svg viewBox="0 0 260 260" className="story-gauge-svg">
        <defs>
          <linearGradient
            id="story-gauge-gradient"
            x1="0"
            y1="0"
            x2="1"
            y2=".4"
          >
            <stop stopColor="white" />
            <stop offset=".55" stopColor="#d9b2ff" />
            <stop offset="1" stopColor="#a32af0" />
          </linearGradient>
        </defs>
        <path
          d={path}
          pathLength="1"
          fill="none"
          stroke="#ffffff0e"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <motion.path
          d={path}
          pathLength="1"
          fill="none"
          stroke="url(#story-gauge-gradient)"
          strokeWidth="8"
          strokeLinecap="round"
          initial={reduced ? false : { strokeDasharray: "0 1" }}
          animate={{ strokeDasharray: ".74 1" }}
          transition={{ duration: reduced ? 0 : 1.55, delay: 0.5, ease }}
        />
        <motion.circle
          className="story-gauge-marker"
          r="9"
          fill="white"
          style={{ offsetPath: `path('${path}')`, offsetRotate: "0deg" }}
          initial={reduced ? false : { offsetDistance: "0%" }}
          animate={{ offsetDistance: "74%" }}
          transition={{ duration: reduced ? 0 : 1.55, delay: 0.5, ease }}
        />
      </svg>
      <motion.div
        className="story-gauge-value"
        initial={reduced ? false : { opacity: 0, y: 12, scale: 0.92 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: reduced ? 0 : 0.5, delay: 0, ease }}
      >
        <strong>
          <span className="gauge-count">{value}</span><span>%</span>
        </strong>
        <span>Победа</span>
        <small></small>
      </motion.div>
    </div>
  );
}
function ChatSculpture({ reduced, paused }) {
  return (
    <div className="story-chat-composition">
      {[
        { x: -108, h: 125, y: 30 },
        { x: -58, h: 180, y: 30 },
        { x: 55, h: 210, y: -4 },
        { x: 111, h: 155, y: 58 },
      ].map((c, i) => (
        <motion.div
          key={i}
          className="story-glass-column"
          style={{ left: `calc(50% + ${c.x}px)`, height: c.h, top: 50 + c.y }}
          initial={reduced ? false : { opacity: 0, y: 80, scaleY: 0.88 }}
          animate={{ opacity: 1, y: 0, scaleY: 1 }}
          transition={{ duration: reduced ? 0 : 1.2, delay: i * 0.12, ease }}
        >
          <div
            style={{
              animationDelay: `${1.7 + i * 0.15}s`,
              animationPlayState: paused ? "paused" : "running",
            }}
          />
        </motion.div>
      ))}
      <motion.div
        className="story-chat-symbol"
        initial={
          reduced ? false : { opacity: 0, y: 65, rotateY: -18, scale: 0.8 }
        }
        animate={{ opacity: 1, y: 0, rotateY: 0, scale: 1 }}
        transition={{ duration: reduced ? 0 : 1, delay: 0.35, ease }}
      >
        <div style={{ animationPlayState: paused ? "paused" : "running" }}>
          <MessageSquareQuote size={52} strokeWidth={1.8} />
        </div>
      </motion.div>
      <motion.div
        className="story-chat-mini"
        initial={reduced ? false : { opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduced ? 0 : 0.6, delay: 1 }}
      >
        <span />
        <span />
        <span />
      </motion.div>
    </div>
  );
}
export default function StoryArt({ step, paused }) {
  const reduced = useReducedMotion();
  return (
    <div
      className={`live-story-art story-art-${step}`}
      aria-hidden="true"
      data-paused={paused}
    >
      <span className="live-art-aura" />
      {step === 0 ? (
        <SportsCards reduced={reduced} paused={paused} />
      ) : step === 1 ? (
        <AnalysisOrbit reduced={reduced} paused={paused} />
      ) : step === 2 ? (
        <ProbabilityGauge reduced={reduced} paused={paused} />
      ) : (
        <ChatSculpture reduced={reduced} paused={paused} />
      )}
    </div>
  );
}
