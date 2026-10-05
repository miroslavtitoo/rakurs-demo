import React, { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { ArrowUp, ArrowUpRight, BookOpen, Sparkles, X } from "lucide-react";
import { getMatchContext } from "./data.js";
import TeamMark from "./TeamMark.jsx";

const questions = [
  ["Что важно знать перед матчем?", "Главные факторы"],
  ["Что может изменить оценку?", "Риски и изменения"],
  ["В чём расходятся аналитики?", "Мнения аналитиков"],
];

export default function AIChat({ event, Modal, close, onSources }) {
  const ctx = getMatchContext(event);
  const [messages, setMessages] = useState([{ role: "assistant", question: questions[0][0] }]);
  const [custom, setCustom] = useState("");
  const log = useRef(null);
  useEffect(() => { if (log.current) log.current.scrollTop = log.current.scrollHeight; }, [messages]);
  function ask(question) {
    if (!question.trim()) return;
    setMessages(previous => [...previous, { role: "user", text: question.trim() }, { role: "assistant", question: question.trim() }]);
    setCustom("");
  }
  function response(question) {
    if (question === questions[0][0]) return <><h3>Главное за минуту</h3><div className="chat-factors">{ctx.factors.map((factor, i) => <p key={factor}><span>0{i + 1}</span>{factor}</p>)}</div><div className="chat-takeaway"><strong>На что обратить внимание</strong><p>{ctx.risk}</p></div></>;
    if (question === questions[1][0]) return <><h3>Что держать в фокусе</h3><p>{ctx.risk}</p><p>После подтверждения вводных оценку стоит пересмотреть. В этом демо данные не обновляются в реальном времени.</p></>;
    if (question === questions[2][0]) return <><h3>Два взгляда на один матч</h3><p>{ctx.disagreement}</p><div className="chat-takeaway"><strong>Сравнивайте аргументы</strong><p>Разные оценки помогают увидеть альтернативный сценарий.</p></div></>;
    return <><h3>Этот вопрос пока за рамками демо</h3><p>Свободный диалог в этой версии не подключён. Выберите тему ниже — для неё уже подготовлено объяснение по этому матчу.</p></>;
  }
  return <Modal title="Ракурс AI" onClose={close} className="chat-modal" hideHeading>
    <header className="chat-header"><span className="chat-logo"><Sparkles size={24} /></span><div><h2>Ракурс AI</h2><span>Ваш проводник в контексте</span></div><button className="icon-button" aria-label="Закрыть" onClick={close}><X size={20} /></button></header>
    <div className="chat-event"><div><TeamMark code={event.homeCode} /><TeamMark code={event.awayCode} /></div><span><strong>{event.home} — {event.away}</strong><small>{event.sport} · {event.league}</small></span><span className="chat-demo">ДЕМО</span></div>
    <div className="chat-log" ref={log} role="log" aria-live="polite" aria-label="Диалог о матче">
      <div className="chat-date">Контекст матча · 5 октября</div>
      {messages.map((message, i) => <motion.div className={`chat-message ${message.role}`} key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .25 }}>
        {message.role === "user" ? <p>{message.text}</p> : <><span className="chat-author"><Sparkles size={12} /> RAKURS AI</span><div className="ai-answer">{response(message.question)}</div></>}
      </motion.div>)}
    </div>
    <div className="chat-composer"><div className="chat-suggestions" aria-label="Подготовленные вопросы">{questions.map(([question, label]) => <button key={question} aria-label={question} onClick={() => ask(question)}>{label}<ArrowUpRight size={13} /></button>)}</div>
      <form className="chat-input" onSubmit={e => { e.preventDefault(); ask(custom); }}><input aria-label="Ваш вопрос о матче" value={custom} onChange={e => setCustom(e.target.value)} placeholder="Спросить о матче…" maxLength={200} /><button aria-label="Задать вопрос" disabled={!custom.trim()}><ArrowUp size={20} /></button></form>
      <button className="chat-source" onClick={onSources}><BookOpen size={12} /> Подготовленные ответы · источники демо</button>
    </div>
  </Modal>;
}
