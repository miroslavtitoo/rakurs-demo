import React from "react";
import { ArrowUpRight, Clock3, Gamepad2, CircleDot, Bookmark } from "lucide-react";
import { events } from "./data.js";
import TeamMark from "./TeamMark.jsx";
import HorizontalRail from "./HorizontalRail.jsx";

export default function HotEvents({ navigate, favorites, favorite }) {
  return <HorizontalRail title="Горячие события" eyebrow="В ФОКУСЕ СЕГОДНЯ · ДЕМОСНИМОК" className="hot-events">
    {events.filter(e => e.day === "today").map(e => <article className="hot-card" key={e.id}>
      <div className="hot-meta"><span>{e.sport === "CS2" ? <Gamepad2 size={14} /> : <CircleDot size={14} />}{e.sport}</span><span><Clock3 size={12} />{e.time} МСК</span><button className="icon-button" aria-label={`Сохранить горячее событие: ${e.home}`} aria-pressed={favorites.includes(e.id)} onClick={() => favorite(e.id)}><Bookmark size={16} fill={favorites.includes(e.id) ? "currentColor" : "none"} /></button></div>
      <button className="hot-match" onClick={() => navigate("/match/" + e.id)}><span><TeamMark code={e.homeCode} /><strong>{e.home}</strong></span><span><TeamMark code={e.awayCode} /><strong>{e.away}</strong></span></button>
      <p>{e.sport === "CS2" ? "Форма, пул карт и сценарии серии" : "Форма, составы и качество моментов"}</p>
      <button className="hot-open" onClick={() => navigate("/match/" + e.id)}><span>Открыть матч<small>{e.league}</small></span><span className="arrow-disc"><ArrowUpRight size={18} /></span></button>
    </article>)}
  </HorizontalRail>;
}
