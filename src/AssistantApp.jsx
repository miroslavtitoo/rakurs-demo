import React, { useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  MotionConfig,
  useReducedMotion,
} from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  ArrowUp,
  Bookmark,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  CircleHelp,
  Copy,
  Gamepad2,
  Layers3,
  LayoutGrid,
  LockKeyhole,
  MessageCircle,
  Search,
  ShieldCheck,
  Sparkles,
  Ticket,
  Trophy,
  WalletCards,
  X,
  Activity,
  FileText,
  CalendarDays,
  Info,
} from "lucide-react";
import { Modal, useSaved, Logo, Stories } from "./AssistantUI.jsx";
import TeamMark from "./TeamMark.jsx";
import AIOrb from "./AIOrb.jsx";
import {
  fixtures,
  SPORTS,
  SNAPSHOT_V6,
  PRICE,
  MONTH_PRICE,
  activeSubscription,
  canAccess,
  subscriptionMonth,
  replyToEvent,
} from "./assistantData.js";
import { routeFromHash } from "./routing.js";
import { marketRoute } from "./marketData.js";
import { initTelegram, haptic } from "./telegram.js";
import "./market.css";
import "./assistant.css";
import "./assistantDesign.css";

const statuses = [
  ["all", "Все события"],
  ["upcoming", "Ближайшие"],
  ["live", "Сейчас идут"],
  ["past", "Завершённые"],
];
const currency = (n) => `${n.toLocaleString("ru-RU")} ₽`;
const signed = (n) => `${n > 0 ? "+" : n < 0 ? "−" : ""}${Math.abs(n)}`;
const colors = ["#386be6", "#c4a76a", "#8993bf"];
function Status({ event: e }) {
  return (
    <span className={`event-status ${e.status}`}>
      {e.status === "live" ? (
        <>
          <i />
          Идёт · демо
        </>
      ) : e.status === "past" ? (
        "Завершён"
      ) : (
        <>
          <Clock3 size={12} />
          {e.date}, {e.time}
        </>
      )}
    </span>
  );
}
function Identity({ event: e, score = false }) {
  return (
    <div className="event-identity">
      {[
        [e.home, e.homeCode],
        [e.away, e.awayCode],
      ].map(([name, code], i) => (
        <div key={name}>
          {e.sport === "Теннис" ? (
            <span className="player-mark">
              <Activity size={20} />
            </span>
          ) : (
            <TeamMark code={code} />
          )}
          <strong>{name}</strong>
          {score && e.score && <b>{e.score.split(" : ")[i]}</b>}
        </div>
      ))}
    </div>
  );
}
function Nav({ route, go, bottom = false }) {
  return (
    <nav
      className={bottom ? "bottom-nav" : "m-nav"}
      aria-label={bottom ? "Мобильная навигация" : "Навигация"}
    >
      {[
        ["/", "События", LayoutGrid],
        ["/library", "Мои прогнозы", WalletCards],
        ["/subscription", "Подписка", Ticket],
      ].map(([path, label, Icon]) => (
        <button
          key={path}
          aria-current={
            route === path ||
            (path === "/" &&
              (route.startsWith("/match/") || route === "/results"))
              ? "page"
              : undefined
          }
          onClick={() => go(path)}
        >
          <Icon size={19} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}
function EventCard({ event: e, app }) {
  const access = app.access(e.id);
  return (
    <motion.article
      className="event-card"
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.08 }}
      transition={{ duration: 0.45 }}
    >
      <div className="event-card-top">
        <span
          className={`sport-label ${e.sport === "Киберспорт" ? "esport" : ""}`}
        >
          {e.sport === "Киберспорт" ? (
            <Gamepad2 size={13} />
          ) : (
            <Trophy size={13} />
          )}{" "}
          {e.sport}
        </span>
        <button
          className="m-icon"
          aria-label={`Сохранить: ${e.id}`}
          aria-pressed={app.favorites.includes(e.id)}
          onClick={() => app.save(e.id)}
        >
          <Bookmark
            size={17}
            fill={app.favorites.includes(e.id) ? "currentColor" : "none"}
          />
        </button>
      </div>
      <button
        className="event-card-link"
        onClick={() => app.go("/match/" + e.id)}
        aria-label={`Открыть событие: ${e.home} — ${e.away}`}
      >
        <Identity event={e} score />
        <div className="event-league">
          {e.league}
          <ChevronRight size={14} />
        </div>
      </button>
      <div className="event-card-status">
        <Status event={e} />
        {e.status === "live" && <span>{e.period}</span>}
        {e.status === "past" && (
          <span className={`result-badge ${e.result}`}>
            {e.result === "win" ? "Прогноз сбылся" : "Не сбылся"}
          </span>
        )}
      </div>
      <div className="event-card-bottom">
        <button
          className={`m-button ${access ? "owned" : ""}`}
          onClick={() => app.go("/match/" + e.id)}
        >
          {access ? "Открыть анализ" : `Прогноз · ${currency(PRICE)}`}
          <ArrowUpRight size={15} />
        </button>
      </div>
    </motion.article>
  );
}
function Catalog({ app, initialStatus = "all", library = false }) {
  const [sport, setSport] = useState("Все"),
    [status, setStatus] = useState(initialStatus),
    [query, setQuery] = useState(""),
    [saved, setSaved] = useState(false);
  const list = fixtures
    .filter(
      (e) =>
        (sport === "Все" || e.sport === sport) &&
        (status === "all" || e.status === status) &&
        (!library ||
          (saved ? app.favorites.includes(e.id) : app.access(e.id))) &&
        `${e.home} ${e.away} ${e.league}`
          .toLowerCase()
          .includes(query.toLowerCase()),
    )
    .sort((a, b) => {
      const order = { live: 0, upcoming: 1, past: 2 };
      return (
        order[a.status] - order[b.status] ||
        (a.status === "upcoming"
          ? parseInt(a.date) - parseInt(b.date) || a.time.localeCompare(b.time)
          : 0)
      );
    });
  return (
    <>
      {!library ? (
        <section className="assistant-banner">
          <div>
            <span className="m-eyebrow">
              <Sparkles size={13} />
              ВАШ AI-АССИСТЕНТ
            </span>
            <h1>
              Большой спорт.
              <br />
              <em>Понятный AI.</em>
            </h1>
            <p>
              Прогнозы с объяснением.
              <br />
              По каждому событию.
            </p>
            <button className="intro-help" onClick={app.stories}>
              Как это работает
              <ArrowUpRight size={14} />
            </button>
          </div>
          <div className="assistant-art" aria-hidden="true">
            <AIOrb />
          </div>
          <button
            className="banner-subscription"
            onClick={() => app.go("/subscription")}
          >
            <Ticket size={17} />
            <span>
              Все прогнозы<strong>1 000 ₽ / месяц</strong>
            </span>
            <ArrowUpRight size={16} />
          </button>
        </section>
      ) : (
        <div className="page-heading">
          <span className="m-eyebrow">СОХРАНЕНО ДЛЯ ВАС</span>
          <h1>Мои прогнозы</h1>
          <p>Открытые разборы и события, которые вы сохранили.</p>
        </div>
      )}
      <div className="event-section-title">
        <h2>{library ? "Ваши события" : "Лента событий"}</h2>
        <span>
          <i />
          Снимок · 8 октября, 14:30 МСК
        </span>
      </div>
      {library && (
        <div className="m-tabs library-tabs">
          <button aria-pressed={!saved} onClick={() => setSaved(false)}>
            Доступные прогнозы
          </button>
          <button aria-pressed={saved} onClick={() => setSaved(true)}>
            Избранное
          </button>
        </div>
      )}
      <div className="sports-rail" aria-label="Вид спорта">
        {SPORTS.map((s) => (
          <button
            key={s}
            aria-pressed={sport === s}
            onClick={() => setSport(s)}
          >
            {s === "Все" ? (
              <LayoutGrid size={15} />
            ) : s === "Киберспорт" ? (
              <Gamepad2 size={16} />
            ) : (
              <Trophy size={14} />
            )}{" "}
            {s}
          </button>
        ))}
      </div>
      <div className="event-toolbar">
        <div className="event-status-tabs">
          {statuses.map(([id, label]) => (
            <button
              key={id}
              aria-pressed={status === id}
              onClick={() => setStatus(id)}
            >
              {id === "live" && <i />}
              {label}
            </button>
          ))}
        </div>
        <label className="m-search">
          <Search size={16} />
          <input
            aria-label="Поиск события"
            placeholder="Команда, игрок или турнир"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button aria-label="Очистить поиск" onClick={() => setQuery("")}>
              <X size={15} />
            </button>
          )}
        </label>
      </div>
      {list.length ? (
        <div className="forecast-grid event-grid">
          {list.map((e) => (
            <EventCard key={e.id} event={e} app={app} />
          ))}
        </div>
      ) : (
        <div className="m-empty">
          <Search size={30} />
          <h2>{library ? "Пока нет событий" : "Ничего не найдено"}</h2>
          <p>
            {library
              ? "Откройте прогноз или сохраните интересный матч."
              : "Попробуйте другой запрос или сбросьте фильтры."}
          </p>
          <button
            className="m-button"
            onClick={() =>
              library
                ? app.go("/")
                : (setSport("Все"), setStatus("all"), setQuery(""))
            }
          >
            {library ? "Выбрать событие" : "Сбросить фильтры"}
            <ArrowRight size={16} />
          </button>
        </div>
      )}
      <div className="market-bottom-note">
        <Info size={17} />
        <p>
          Демонстрационные события и AI-анализ.
          <span>
            Счёт зафиксирован. Реальные источники, модель и оплата пока не
            подключены.
          </span>
        </p>
      </div>
    </>
  );
}

function Paywall({ event: e, app }) {
  return (
    <section className="analysis-paywall">
      <AIOrb compact />
      <span className="m-eyebrow">
        <Sparkles size={14} /> RAKURS AI
      </span>
      <h2>
        У матча есть цифры.
        <br />
        <em>У вас — понимание.</em>
      </h2>
      <p>Откройте прогноз, аргументы и личный чат об этом событии.</p>
      <div className="paywall-features">
        <span>
          <Activity size={17} />
          Шансы
        </span>
        <span>
          <Layers3 size={17} />
          Аргументы
        </span>
        <span>
          <MessageCircle size={17} />
          AI-чат
        </span>
      </div>
      <button className="m-button buy-analysis" onClick={() => app.checkout(e)}>
        Купить прогноз · {currency(PRICE)}
        <ArrowRight size={19} />
      </button>
      <button className="text-button" onClick={() => app.go("/subscription")}>
        Все события за 1 000 ₽ / месяц
        <ArrowUpRight size={15} />
      </button>
      <small>Демопокупка · без списания денег</small>
    </section>
  );
}
function Distribution({ event: e, app }) {
  const reduced = useReducedMotion();
  return (
    <section className="probability-panel">
      <div className="section-line">
        <div>
          <span className="m-eyebrow">ПРОГНОЗ ДО МАТЧА</span>
          <h2>Главное за секунду</h2>
        </div>
        <span className="small-demo">ДЕМОМОДЕЛЬ</span>
      </div>
      <div className="probability-hero">
        <div
          className="probability-orbit"
          style={{ "--probability": e.probabilities[0] + "%" }}
        >
          <svg viewBox="0 0 150 150">
            <circle cx="75" cy="75" r="63" />
            <motion.circle
              cx="75"
              cy="75"
              r="63"
              pathLength="100"
              initial={{ strokeDasharray: "0 100" }}
              animate={{ strokeDasharray: `${e.probabilities[0]} 100` }}
              transition={{ duration: reduced ? 0 : 1 }}
            />
          </svg>
          <span>
            <strong>
              {e.probabilities[0]}
              <small>%</small>
            </strong>
            <span>шанс победы</span>
          </span>
        </div>
        <div className="probability-verdict">
          <span>
            <Sparkles size={13} />
            Выбор AI
          </span>
          <h2>{e.pick}</h2>
          <p>{e.market}</p>
          <button className="text-button" onClick={() => app.math(e)}>
            Почему {e.probabilities[0]}%?
            <ArrowUpRight size={14} />
          </button>
        </div>
      </div>
      <div className="distribution-options">
        {e.labels.map((label, i) => (
          <button
            key={label}
            onClick={() => app.math(e)}
            style={{ "--outcome": colors[i] }}
          >
            <span>
              {label}
              <CircleHelp size={12} />
            </span>
            <strong>
              {e.probabilities[i]}
              <small>%</small>
            </strong>
            <div>
              <motion.i
                initial={{ width: 0 }}
                whileInView={{ width: e.probabilities[i] + "%" }}
                viewport={{ once: true }}
                transition={{ duration: reduced ? 0 : 0.8 }}
              />
            </div>
          </button>
        ))}
      </div>
      <p className="dashboard-foot">Демо-оценка · не гарантия результата</p>
    </section>
  );
}
function Dashboard({ event: e, app }) {
  const icons = [Activity, Trophy, ShieldCheck, CalendarDays, Info];
  return (
    <div className="analysis-dashboard" id="analysis-dashboard" tabIndex={-1}>
      <Distribution event={e} app={app} />
      <section className="evidence-panel">
        <div className="section-line">
          <div>
            <h2>Почему AI так думает</h2>
            <p>Коротко — здесь. Подробно — по нажатию.</p>
          </div>
        </div>
        <div className="evidence-grid">
          {e.factors.map((f, i) => {
            const Icon = icons[i];
            return (
              <motion.button
                className={`evidence-card ${f.delta === 0 ? "unconfirmed" : ""}`}
                key={f.id}
                onClick={() => app.factor(e, f)}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.4, delay: (i % 2) * 0.06 }}
              >
                <span className="factor-top">
                  <Icon size={21} />
                  <ArrowUpRight size={18} />
                </span>
                <strong>{f.metric}</strong>
                <h3>{f.name}</h3>
                <span
                  className={`factor-pill ${f.delta > 0 ? "positive" : f.delta < 0 ? "negative" : "neutral"}`}
                >
                  {f.delta > 0
                    ? "В пользу победы"
                    : f.delta < 0
                      ? "Снижает шансы"
                      : "Не влияет на прогноз"}
                </span>
              </motion.button>
            );
          })}
        </div>
      </section>
      <button className="analysis-takeaway" onClick={() => app.math(e)}>
        <span className="takeaway-icon">
          <Layers3 size={24} />
        </span>
        <span>
          <strong>Вся логика прогноза</strong>
          <span>
            От исходных данных до {e.probabilities[0]}% — шаг за шагом
          </span>
        </span>
        <ArrowUpRight size={22} />
      </button>
    </div>
  );
}
function Detail({ event: e, app }) {
  const access = app.access(e.id);
  useEffect(() => {
    if (app.justUnlocked !== e.id || !access) return;
    const t = setTimeout(() => {
      const node = document.getElementById("analysis-dashboard");
      node?.scrollIntoView({ block: "start", behavior: "instant" });
      node?.focus({ preventScroll: true });
      app.clearUnlocked();
    }, 250);
    return () => clearTimeout(t);
  }, [e.id, access, app.justUnlocked]);
  return (
    <>
      <button className="m-back" onClick={() => app.go("/")}>
        <ArrowLeft size={16} />
        Все события
      </button>
      <div className="event-detail-layout">
        <div className="event-detail-main">
          <section className="event-detail-header">
            <div className="event-detail-meta">
              <span className="sport-label">
                {e.sport} · {e.league}
              </span>
              <button
                className="m-icon"
                aria-label="Сохранить событие"
                aria-pressed={app.favorites.includes(e.id)}
                onClick={() => app.save(e.id)}
              >
                <Bookmark
                  size={18}
                  fill={app.favorites.includes(e.id) ? "currentColor" : "none"}
                />
              </button>
            </div>
            <Identity event={e} score />
            <div className="event-detail-state">
              <Status event={e} />
              {e.status === "live" && <span>{e.period} · счёт в снимке</span>}
              {e.status === "past" && (
                <span className={`result-badge ${e.result}`}>
                  {e.result === "win"
                    ? "Предматчевый прогноз сбылся"
                    : "Предматчевый прогноз не сбылся"}
                </span>
              )}
            </div>
            <button className="event-info-link" onClick={() => app.info(e)}>
              О событии и данных
              <ArrowUpRight size={16} />
            </button>
          </section>
          {access ? (
            <Dashboard event={e} app={app} />
          ) : (
            <Paywall event={e} app={app} />
          )}
        </div>
        <aside className="event-assistant-sidebar">
          <AIOrb compact />
          <span className="m-eyebrow">ВАШ AI-АССИСТЕНТ</span>
          <h2>
            Есть вопрос?
            <br />
            Разберём вместе.
          </h2>
          <p>Обсудите прогноз или предложите свои данные.</p>
          <button
            className="m-button"
            onClick={() => (access ? app.chat(e) : app.checkout(e))}
          >
            <MessageCircle size={18} />
            {access ? "Чат по событию" : "Открыть анализ и чат"}
            <ArrowUpRight size={16} />
          </button>
          <span className="sidebar-fine">
            {access
              ? "Демо · подготовленные ответы"
              : "Чат включён в прогноз за 199 ₽"}
          </span>
        </aside>
      </div>
    </>
  );
}

function EventInfo({ event: e, close }) {
  return (
    <Modal title="О событии и данных" close={close} kind="event-info-modal">
      <div className="factor-explanation">
        <span className="small-demo">ДЕМОНСТРАЦИОННОЕ СОБЫТИЕ</span>
        <h2>
          {e.home} — {e.away}
        </h2>
        <p>{e.summary}</p>
        <dl>
          <div>
            <dt>Турнир</dt>
            <dd>
              {e.sport} · {e.league}
            </dd>
          </div>
          <div>
            <dt>Прогноз зафиксирован</dt>
            <dd>{e.analysisAt}</dd>
          </div>
          <div>
            <dt>Снимок событий</dt>
            <dd>{SNAPSHOT_V6}</dd>
          </div>
          <div>
            <dt>Что анализируем</dt>
            <dd>Форма, личные встречи, состав и условия подготовки.</dd>
          </div>
        </dl>
        <p>
          Предматчевый прогноз не меняется вслед за счётом. Все события,
          сведения и ответы вымышлены; внешние источники и реальная AI-модель не
          подключены.
        </p>
        <small>
          Слухи, праздники и неподтверждённые публикации не меняют оценку.
        </small>
      </div>
    </Modal>
  );
}
function MathExplanation({ event: e, close }) {
  return (
    <Modal title="Как получилась вероятность" close={close} kind="math-modal">
      <div className="math-content">
        <span className="m-eyebrow">ПРОЗРАЧНЫЙ РАСЧЁТ · ДЕМО</span>
        <h2>
          {e.home}: {e.probabilities[0]}%
        </h2>
        <p>
          Начинаем с базового распределения и добавляем поправки в процентных
          пунктах. Плюс одному исходу компенсируется минусом другому.
        </p>
        <div className="math-table-wrap">
          <table className="math-table">
            <thead>
              <tr>
                <th>Компонент</th>
                {e.labels.map((l) => (
                  <th key={l}>{l}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Базовая оценка</td>
                {e.base.map((n, i) => (
                  <td key={i}>{n}%</td>
                ))}
              </tr>
              {e.factors.map((f) => (
                <tr key={f.id}>
                  <td>{f.name}</td>
                  {f.vector.map((n, i) => (
                    <td
                      key={i}
                      className={n > 0 ? "positive" : n < 0 ? "negative" : ""}
                    >
                      {signed(n)} п.п.
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th>Итог</th>
                {e.probabilities.map((n, i) => (
                  <th key={i}>{n}%</th>
                ))}
              </tr>
            </tfoot>
          </table>
        </div>
        <div className="data-explainer">
          <Info size={17} />
          <span>
            Поправки и базовые вероятности заданы для демонстрации. Это не
            обученная модель и не научное доказательство прогноза. В реальной
            версии нужны проверка качества и калибровка на прошлых матчах.
          </span>
        </div>
      </div>
    </Modal>
  );
}
function FactorExplanation({ event: e, factor: f, close }) {
  return (
    <Modal title={f.name} close={close}>
      <div className="factor-explanation">
        <span className="small-demo">ПРИМЕР ОТКРЫТОГО ИСТОЧНИКА</span>
        <h2>{f.metric}</h2>
        <p className="factor-summary">{f.caption}</p>
        <p>{f.observed}</p>
        <dl>
          <div>
            <dt>Источник · {f.kind}</dt>
            <dd>{f.source}</dd>
          </div>
          <div>
            <dt>Выборка</dt>
            <dd>{f.sample}</dd>
          </div>
          <div>
            <dt>Данные до матча</dt>
            <dd>{f.updated}</dd>
          </div>
          <div>
            <dt>Подтверждение в демо</dt>
            <dd>{f.confidence}</dd>
          </div>
        </dl>
        <div className="factor-formula">
          <span>Влияние на победу {e.home}</span>
          <strong
            className={f.delta > 0 ? "positive" : f.delta < 0 ? "negative" : ""}
          >
            {signed(f.delta)} п.п.
          </strong>
        </div>
        <small>
          Источник и сведения вымышлены. Внешний сбор данных не выполняется.
        </small>
      </div>
    </Modal>
  );
}
function EventChat({ event: e, close }) {
  const [messages, setMessages] = useSaved("eventChat:" + e.id, []);
  const [input, setInput] = useState("");
  const log = useRef(null);
  useEffect(() => {
    if (log.current) log.current.scrollTop = log.current.scrollHeight;
  }, [messages]);
  function send(text) {
    const value = text.trim();
    if (!value) return;
    setMessages((prev) =>
      [
        ...prev,
        { role: "user", text: value },
        { role: "assistant", text: replyToEvent(e, value) },
      ].slice(-50),
    );
    setInput("");
  }
  return (
    <Modal title="Чат по событию" close={close} kind="event-chat-modal">
      <div className="event-chat-context">
        <Sparkles size={19} />
        <div>
          <strong>
            {e.home} — {e.away}
          </strong>
          <span>Контекст этого матча · демоответы</span>
        </div>
      </div>
      <div className="event-chat-log" ref={log} role="log" aria-live="polite">
        <div className="assistant-chat-bubble">
          <span>
            <Sparkles size={12} />
            Ракурс AI
          </span>
          <p>
            Разберём {e.home} — {e.away}. Моя предматчевая оценка —{" "}
            {e.probabilities[0]}% на победу {e.home}. Спросите о данных, составе
            или предложите свою гипотезу.
          </p>
          <small>
            В демо отвечаю по готовым сценариям. Ссылки не открываю, прогноз
            автоматически не пересчитываю.
          </small>
        </div>
        {messages.map((m, i) => (
          <motion.div
            key={i}
            className={
              m.role === "user" ? "user-chat-bubble" : "assistant-chat-bubble"
            }
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {m.role === "assistant" && (
              <span>
                <Sparkles size={12} />
                Ракурс AI
              </span>
            )}
            <p>{m.text}</p>
          </motion.div>
        ))}
      </div>
      <div className="event-chat-composer">
        <div className="chat-prompts">
          {[
            "Почему такая вероятность?",
            "Что с составом?",
            "Если мои данные другие?",
          ].map((q) => (
            <button key={q} onClick={() => send(q)}>
              {q}
              <ArrowUpRight size={12} />
            </button>
          ))}
        </div>
        <form
          onSubmit={(ev) => {
            ev.preventDefault();
            send(input);
          }}
        >
          <input
            aria-label="Сообщение AI"
            placeholder="Ваш вопрос или гипотеза…"
            value={input}
            onChange={(ev) => setInput(ev.target.value)}
            maxLength={700}
          />
          <button aria-label="Отправить сообщение" disabled={!input.trim()}>
            <ArrowUp size={19} />
          </button>
        </form>
        <small>
          Ответы и данные демонстрационные · история на этом устройстве
        </small>
      </div>
    </Modal>
  );
}

function Subscription({ app }) {
  const active = activeSubscription(app.subscription, app.now);
  return (
    <div className="subscription-page">
      <div className="page-heading">
        <span className="m-eyebrow">БОЛЬШЕ СОБЫТИЙ. ОДИН ДОСТУП.</span>
        <h1>Ваш сезон с AI.</h1>
        <p>Один прогноз за 199 ₽ или все события по подписке.</p>
      </div>
      <div className="subscription-layout">
        <section className="subscription-card">
          <div className="subscription-symbol">
            <Sparkles size={34} />
          </div>
          <span className="small-demo">RAKURS PLUS · ДЕМО</span>
          <h2>{active ? "Все прогнозы открыты" : "Каждый матч — в деталях"}</h2>
          <p>Футбол, киберспорт, теннис, баскетбол и хоккей.</p>
          <div className="subscription-price">
            1 000 ₽<span>/ месяц</span>
          </div>
          <ul>
            {[
              "Все события без отдельных покупок",
              "Полные дашборды и объяснения",
              "Чат по каждому событию",
              "История предматчевых прогнозов",
            ].map((t) => (
              <li key={t}>
                <CheckCircle2 size={17} />
                {t}
              </li>
            ))}
          </ul>
          {active ? (
            <>
              <div className="subscription-active">
                <CheckCircle2 size={17} />
                Доступ до{" "}
                {new Date(app.subscription.expiresAt).toLocaleDateString(
                  "ru-RU",
                )}
              </div>
              <button className="m-button" onClick={() => app.go("/")}>
                Выбрать событие
                <ArrowRight size={17} />
              </button>
              <button
                className="text-button end-subscription"
                onClick={app.endSubscription}
              >
                Завершить демоподписку
              </button>
            </>
          ) : (
            <button
              className="m-button subscribe-button"
              onClick={app.subscribe}
            >
              Попробовать подписку
              <ArrowRight size={17} />
            </button>
          )}
          <small>
            Без списания и автопродления. Купленные отдельно прогнозы остаются
            после завершения подписки.
          </small>
        </section>
        <div className="subscription-faq">
          <h2>Всё просто</h2>
          {[
            [
              "Что открывает подписка?",
              "Все события каталога: будущие, текущие и завершённые. Их анализ и чаты доступны в течение месяца.",
            ],
            [
              "Нужно привязывать карту?",
              "Нет. Это демоверсия, все оплаты имитируются.",
            ],
            [
              "Что будет через месяц?",
              "Демоподписка завершится без списания. Отдельно купленные прогнозы останутся в ваших материалах.",
            ],
            [
              "AI уже собирает реальные данные?",
              "Пока нет. Здесь показан будущий интерфейс: источники, выводы и ответы вымышлены.",
            ],
          ].map(([q, a]) => (
            <details key={q}>
              <summary>
                {q}
                <ChevronRight size={15} />
              </summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AssistantApp() {
  const [route, setRoute] = useState(() =>
    marketRoute(routeFromHash(location.hash)),
  );
  const [purchases, setPurchases] = useSaved("aiPurchases", []);
  const [legacy] = useSaved("purchases", []);
  const [favorites, setFavorites] = useSaved("favorites", []);
  const [subscription, setSubscription] = useSaved("aiSubscription", null);
  const [seen, setSeen] = useSaved("assistantOnboardingSeen", false);
  const [modal, setModal] = useState(() => (seen ? null : { type: "stories" }));
  const [toast, setToast] = useState("");
  const [justUnlocked, setJustUnlocked] = useState(null);
  const [now, setNow] = useState(Date.now());
  useEffect(() => initTelegram(), []);
  useEffect(() => {
    const changed = () => setRoute(marketRoute(routeFromHash(location.hash)));
    window.addEventListener("hashchange", changed);
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => {
      window.removeEventListener("hashchange", changed);
      clearInterval(timer);
    };
  }, []);
  useEffect(() => {
    scrollTo(0, 0);
    document.querySelector("main")?.focus({ preventScroll: true });
  }, [route]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 3500);
    return () => clearTimeout(t);
  }, [toast]);
  const go = (p) => {
    if (route !== p) location.hash = p;
    else scrollTo(0, 0);
    haptic();
  };
  function close() {
    if (modal?.type === "stories") setSeen(true);
    setModal(null);
  }
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (!tg?.initData || !tg.isVersionAtLeast?.("6.1")) return;
    const back = () => (modal ? close() : go("/"));
    if (route !== "/" || modal) tg.BackButton.show();
    else tg.BackButton.hide();
    tg.BackButton.onClick(back);
    return () => tg.BackButton.offClick(back);
  }, [route, modal]);
  const access = (id) => canAccess(id, purchases, subscription, now, legacy);
  const app = {
    go,
    access,
    favorites,
    now,
    subscription,
    justUnlocked,
    clearUnlocked: () => setJustUnlocked(null),
    save: (id) => {
      setFavorites((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
      );
      haptic();
    },
    checkout: (e) => setModal({ type: "checkout", event: e }),
    stories: () => setModal({ type: "stories" }),
    info: (e) => setModal({ type: "info", event: e }),
    math: (e) => {
      if (access(e.id)) setModal({ type: "math", event: e });
    },
    factor: (e, f) => {
      if (access(e.id)) setModal({ type: "factor", event: e, factor: f });
    },
    chat: (e) => {
      if (access(e.id)) setModal({ type: "chat", event: e });
    },
    subscribe: () => setModal({ type: "subscribe" }),
    endSubscription: () => {
      setSubscription(null);
      setToast("Демоподписка завершена. Отдельные покупки сохранены.");
    },
  };
  const current = route.startsWith("/match/")
    ? fixtures.find((e) => e.id === route.slice(7))
    : null;
  function unlock() {
    const e = modal.event;
    setPurchases((prev) => (prev.includes(e.id) ? prev : [...prev, e.id]));
    setJustUnlocked(e.id);
    setModal(null);
    go("/match/" + e.id);
    setToast("Прогноз открыт. Анализ и чат доступны.");
  }
  const modalHasAccess = !modal?.event || access(modal.event.id);
  return (
    <MotionConfig reducedMotion="user">
      <div className="market-app assistant-app">
        <a className="skip-link" href="#main-content">
          К содержимому
        </a>
        <header className="market-header">
          <div>
            <Logo go={go} />
            <Nav route={route} go={go} />
            <button className="demo-badge" onClick={app.stories}>
              <span />
              Демо-версия
              <CircleHelp size={13} />
            </button>
          </div>
        </header>
        <main id="main-content" tabIndex={-1}>
          <div data-route={route} key={route}>
            {route === "/" || route === "/results" ? (
              <Catalog
                app={app}
                initialStatus={route === "/results" ? "past" : "all"}
              />
            ) : route === "/library" ? (
              <Catalog app={app} library />
            ) : route === "/subscription" ? (
              <Subscription app={app} />
            ) : current ? (
              <Detail event={current} app={app} />
            ) : (
              <div className="m-empty">
                <h1>Событие не найдено</h1>
                <button className="m-button" onClick={() => go("/")}>
                  Все события
                </button>
              </div>
            )}
          </div>
        </main>
        <footer className="market-footer">
          <span>
            rakurs<span>AI</span>
          </span>
          <p>
            Демо · 18+ · {SNAPSHOT_V6}
            <br />
            Не принимает ставки. Прогноз не гарантирует результат.
          </p>
          <button onClick={app.stories}>
            Как это работает
            <ArrowUpRight size={14} />
          </button>
        </footer>
        <Nav route={route} go={go} bottom />
      </div>
      <AnimatePresence>
        {toast && (
          <motion.div
            className="m-toast"
            role="status"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <CheckCircle2 size={17} />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {modal?.type === "stories" ? (
          <Stories close={close} />
        ) : modal?.type === "info" ? (
          <EventInfo event={modal.event} close={close} />
        ) : modal?.type === "math" && modalHasAccess ? (
          <MathExplanation event={modal.event} close={close} />
        ) : modal?.type === "factor" && modalHasAccess ? (
          <FactorExplanation
            event={modal.event}
            factor={modal.factor}
            close={close}
          />
        ) : modal?.type === "chat" && modalHasAccess ? (
          <EventChat key={modal.event.id} event={modal.event} close={close} />
        ) : modal?.type === "checkout" ? (
          <Modal title="Открыть прогноз" close={close}>
            <div className="checkout-content">
              <Identity event={modal.event} />
              <div className="checkout-pick">
                <span>Полный анализ события</span>
                <h2>Увидеть то, что за цифрами.</h2>
              </div>
              <ul className="checkout-list">
                <li>
                  <Check size={16} />
                  Вероятности и подробный дашборд
                </li>
                <li>
                  <Check size={16} />
                  Данные и расчёт каждого фактора
                </li>
                <li>
                  <Check size={16} />
                  Чат по этому событию
                </li>
              </ul>
              <div className="checkout-total">
                <span>Один прогноз</span>
                <strong>{currency(PRICE)}</strong>
              </div>
              <div className="checkout-demo">
                <ShieldCheck size={18} />
                <p>
                  <strong>Демопокупка</strong>
                  <span>Деньги не спишутся. Карта не нужна.</span>
                </p>
              </div>
              <button className="m-button confirm-purchase" onClick={unlock}>
                Открыть без списания
                <ArrowRight size={17} />
              </button>
              <button
                className="text-button"
                onClick={() => {
                  setModal(null);
                  go("/subscription");
                }}
              >
                Или все события за 1 000 ₽ / месяц
              </button>
            </div>
          </Modal>
        ) : modal?.type === "subscribe" ? (
          <Modal title="Подписка Ракурс Plus" close={close}>
            <div className="checkout-content">
              <div className="checkout-pick">
                <span>Один месяц · все события</span>
                <h2>Анализ и чат без отдельных покупок.</h2>
              </div>
              <div className="checkout-total">
                <span>Один месяц доступа</span>
                <strong>{currency(MONTH_PRICE)}</strong>
              </div>
              <div className="checkout-demo">
                <ShieldCheck size={18} />
                <p>
                  <strong>Демоподписка</strong>
                  <span>Без списания и автоматического продления.</span>
                </p>
              </div>
              <button
                className="m-button confirm-subscription"
                onClick={() => {
                  setSubscription(subscriptionMonth());
                  setNow(Date.now());
                  setModal(null);
                  setToast("Подписка активна. Все прогнозы и чаты открыты.");
                }}
              >
                Активировать без списания
                <ArrowRight size={17} />
              </button>
            </div>
          </Modal>
        ) : modal && !modalHasAccess ? (
          <Modal title="Доступ завершён" close={close}>
            <div className="about-content">
              <p>
                Подписка завершилась. Купите этот прогноз отдельно или откройте
                подписку снова.
              </p>
              <button
                className="m-button"
                onClick={() =>
                  setModal({ type: "checkout", event: modal.event })
                }
              >
                Купить прогноз · 199 ₽
              </button>
            </div>
          </Modal>
        ) : null}
      </AnimatePresence>
    </MotionConfig>
  );
}
