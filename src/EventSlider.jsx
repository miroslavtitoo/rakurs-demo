import React, { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function EventSlider({ label, children }) {
  const viewport = useRef(null),
    start = useRef(null),
    swiped = useRef(false);
  const [index, setIndex] = useState(0),
    [size, setSize] = useState({ card: 320, columns: 1 });
  const reduced = useReducedMotion(),
    count = React.Children.count(children),
    gap = 12;
  const max = Math.max(0, count - size.columns);
  useEffect(() => {
    const el = viewport.current;
    const resize = () => {
      const mobile = window.innerWidth <= 760,
        columns = mobile ? 1 : window.innerWidth <= 1000 ? 2 : 3;
      const styles = getComputedStyle(el);
      const peek = mobile
        ? parseFloat(styles.getPropertyValue("--slider-peek")) || 16
        : 0;
      const inset = mobile ? parseFloat(styles.paddingLeft) || 0 : 0;
      setSize({
        card:
          (el.clientWidth - peek - 2 * inset - gap * (columns - 1)) / columns,
        columns,
      });
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  useEffect(() => setIndex((i) => Math.min(i, max)), [max]);
  const move = (n) => setIndex(Math.max(0, Math.min(max, n)));
  return (
    <div
      className="event-slider"
      role="region"
      aria-roledescription="карусель"
      aria-label={label}
    >
      <div
        className="event-slider-viewport"
        ref={viewport}
        tabIndex={0}
        aria-label={`${label}: листайте влево или вправо`}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
            e.preventDefault();
            move(index + (e.key === "ArrowRight" ? 1 : -1));
          }
        }}
        onPointerDown={(e) => {
          if (e.button !== 0) return;
          start.current = { x: e.clientX, y: e.clientY };
          swiped.current = false;
        }}
        onPointerMove={(e) => {
          if (!start.current) return;
          const dx = e.clientX - start.current.x;
          if (
            Math.abs(dx) > 15 &&
            Math.abs(dx) > Math.abs(e.clientY - start.current.y)
          ) {
            swiped.current = true;
            viewport.current.setPointerCapture(e.pointerId);
          }
        }}
        onPointerUp={(e) => {
          if (!start.current) return;
          const dx = e.clientX - start.current.x,
            dy = e.clientY - start.current.y;
          if (Math.abs(dx) > 30 && Math.abs(dx) > Math.abs(dy)) {
            swiped.current = true;
            move(index + (dx < 0 ? 1 : -1));
          }
          start.current = null;
        }}
        onPointerCancel={() => {
          start.current = null;
        }}
        onClickCapture={(e) => {
          if (swiped.current) {
            e.preventDefault();
            e.stopPropagation();
            swiped.current = false;
          }
        }}
      >
        <motion.div
          className="event-slider-track"
          style={{ "--slide-width": `${size.card}px` }}
          animate={{ x: -index * (size.card + gap) }}
          transition={
            reduced
              ? { duration: 0 }
              : { type: "spring", stiffness: 300, damping: 34 }
          }
        >
          {children}
        </motion.div>
      </div>
      <div className="event-slider-pagination">
        <button
          className="slider-arrow"
          aria-label={`${label}: предыдущий слайд`}
          disabled={index === 0}
          onClick={() => move(index - 1)}
        >
          <ChevronLeft size={17} />
        </button>
        <div className="slider-dots" aria-label="Слайды">
          {Array.from({ length: max + 1 }, (_, i) => (
            <button
              key={i}
              aria-label={`${label}: слайд ${i + 1} из ${max + 1}`}
              aria-current={index === i ? "true" : undefined}
              onClick={() => move(i)}
            >
              <span />
            </button>
          ))}
        </div>
        <button
          className="slider-arrow"
          aria-label={`${label}: следующий слайд`}
          disabled={index === max}
          onClick={() => move(index + 1)}
        >
          <ChevronRight size={17} />
        </button>
      </div>
      <span className="sr-only" aria-live="polite">
        Слайд {index + 1} из {max + 1}
      </span>
    </div>
  );
}
