import React, { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowDownRight, ArrowUpRight, Info, BarChart3, Layers3 } from "lucide-react";
import { getMatchInsights, marketLine } from "./matchInsights.js";
import HorizontalRail from "./HorizontalRail.jsx";

export function ContextCards({ event, context }) {
  const cs = event.sport === "CS2";
  const titles = cs ? ["Форма команды", "Пул карт", "Состав и формат"] : ["Качество моментов", "Тактический рисунок", "Текущая форма"];
  const numbers = cs ? ["4 из 5", "Mirage / Nuke", "Best of 3"] : ["1,8 xG", "Прессинг", "3 из 5"];
  return <HorizontalRail title="Контекст решает" eyebrow="ЧТО ВАЖНО ПЕРЕД МАТЧЕМ" className="context-rail">
    {context.factors.map((factor, i) => <article className={`context-card context-tone-${i}`} key={factor}><div><span>0{i + 1}</span><Layers3 size={18} /></div><strong>{numbers[i]}</strong><h3>{titles[i]}</h3><p>{factor}</p></article>)}
    <article className="context-card context-risk"><div><span>04</span><Info size={18} /></div><strong>{cs ? "До veto" : "До составов"}</strong><h3>Что ещё может измениться</h3><p>{context.risk}</p></article>
  </HorizontalRail>;
}

export default function MatchDashboard({ event, Chart, onSources }) {
  const insights = getMatchInsights(event);
  const [group, setGroup] = useState("Исход");
  const [selected, setSelected] = useState("home");
  const [period, setPeriod] = useState("24 ч");
  const reduced = useReducedMotion();
  const markets = group === "Исход" ? insights.outcomes : insights.groups[group];
  const current = markets.find(m => m.id === selected) || markets[0];
  const line = marketLine(event, current);
  const values = period === "24 ч" ? line : line.slice(3);
  const delta = Number((values.at(-1) - values[0]).toFixed(2));
  return <section className="match-dashboard" aria-label="Дашборд матча">
    <div className="dashboard-heading"><div><div className="eyebrow">ЦИФРЫ В ОДНОМ РАКУРСЕ</div><h2>Сценарии матча</h2></div><span className="dashboard-demo"><BarChart3 size={13} /> Демомодель</span></div>
    <div className="outcome-panel"><div className="dashboard-label">{event.sport === "CS2" ? "Победа в серии" : "Исход основного времени"}<span>Оценка сценария</span></div><div className="outcome-labels">{insights.outcomes.map(m => <div key={m.id}><span><i style={{ background: m.color }} />{m.label}</span><strong style={{ color: m.color }}>{m.value}<small>%</small></strong></div>)}</div><div className="outcome-bars" aria-hidden="true">{insights.outcomes.map((m, i) => <motion.span key={m.id} initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }} transition={{ duration: reduced ? 0 : .8, delay: reduced ? 0 : i * .1 }} style={{ width: m.value + "%", background: m.color }} />)}</div></div>
    <div className="market-tabs" role="tablist" aria-label="Тип сценария">{["Исход", "Тоталы", "Сценарии"].map(name => <button key={name} role="tab" aria-selected={group === name} onClick={() => { setGroup(name); setSelected(name === "Исход" ? "home" : insights.groups[name][0].id); }}>{name}</button>)}</div>
    <div className="market-options">{markets.map(m => <button key={m.id} className={current.id === m.id ? "selected" : ""} aria-pressed={current.id === m.id} onClick={() => setSelected(m.id)} style={{ "--market-color": m.color }}><span>{m.label}</span><strong>{m.odds.toFixed(2)}<small>{m.value}% · оценка</small></strong></button>)}</div>
    <div className="dashboard-chart">
      <div className="dashboard-chart-head"><div><span className="dashboard-label">Движение коэффициента</span><h3>{current.label}</h3></div><div className="mini-segment">{["24 ч", "6 ч"].map(p => <button key={p} className={period === p ? "active" : ""} onClick={() => setPeriod(p)}>{p}</button>)}</div></div>
      <div className="dashboard-line-number"><strong>{current.odds.toFixed(2)}</strong><span className={delta <= 0 ? "falling" : "rising"}>{delta <= 0 ? <ArrowDownRight size={16} /> : <ArrowUpRight size={16} />}{delta > 0 ? "+" : ""}{delta.toFixed(2)}<small>за {period}</small></span></div>
      <AnimatePresence mode="wait"><motion.div key={current.id + period} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: .15 }}><Chart values={values} labels={period === "24 ч" ? ["Вчера, 14:30", "Сегодня, 14:30"] : ["Сегодня, 08:30", "Сегодня, 14:30"]} /></motion.div></AnimatePresence>
      <p className="market-explanation">{current.note}</p>
    </div>
    <div className="dashboard-stats"><div className="dashboard-label">Команды в сравнении<span>Демовыборка · 5 матчей</span></div><div className="stats-team-legend"><span><i />{event.home}</span><span><i />{event.away}</span></div>{insights.metrics.map(([label, a, b, va, vb]) => <div className="dashboard-stat" key={label}><div><strong>{a}</strong><span>{label}</span><strong>{b}</strong></div><div className="dashboard-compare-bars"><motion.i initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }} transition={{ duration: reduced ? 0 : .8 }} style={{ width: va + "%" }} /><motion.i initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }} transition={{ duration: reduced ? 0 : .8 }} style={{ width: vb + "%" }} /></div></div>)}</div>
    <button className="dashboard-source" onClick={onSources}><Info size={14} /><span>Условные оценки и линия. Как читать данные</span><ArrowUpRight size={14} /></button>
  </section>;
}
