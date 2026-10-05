import React, { useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

export default function HorizontalRail({ title, eyebrow, children, className = "" }) {
  const rail = useRef(null);
  const [edges, setEdges] = useState({ start: true, end: false });
  function update() {
    const el = rail.current;
    setEdges({ start: el.scrollLeft < 3, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 3 });
  }
  function move(direction) {
    const el = rail.current;
    const step = el.children[1] ? el.children[1].offsetLeft - el.children[0].offsetLeft : el.clientWidth;
    el.scrollBy({ left: direction * step, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  }
  return <section className={`rail-section ${className}`}>
    <div className="rail-heading">
      <div>{eyebrow && <div className="eyebrow">{eyebrow}</div>}<h2>{title}</h2></div>
      <div className="rail-controls">
        <button className="icon-button" aria-label={`${title}: назад`} disabled={edges.start} onClick={() => move(-1)}><ArrowLeft size={17} /></button>
        <button className="icon-button" aria-label={`${title}: вперёд`} disabled={edges.end} onClick={() => move(1)}><ArrowRight size={17} /></button>
      </div>
    </div>
    <div className="horizontal-rail" ref={rail} onScroll={update} tabIndex={0} aria-label={title}>{children}</div>
  </section>;
}
