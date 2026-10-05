import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
  Bookmark,
  Check,
  ChevronRight,
  CircleHelp,
  Clock3,
  Copy,
  Gamepad2,
  LayoutGrid,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
  WalletCards,
  X,
  Pause,
  Play,
  CheckCircle2,
  Info,
} from "lucide-react";
import TeamMark from "./TeamMark.jsx";
import {
  forecasts,
  results,
  resultSummary,
  hasForecast,
  marketRoute,
} from "./marketData.js";
import { routeFromHash } from "./routing.js";
import { haptic, initTelegram } from "./telegram.js";
import "./market.css";

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
const navItems = [
  ["/", "Прогнозы", LayoutGrid],
  ["/library", "Мои прогнозы", WalletCards],
  ["/results", "Результаты", TrendingUp],
];
const money = (value) => (value ? `${value} ₽` : "Бесплатно");
const when = (e) => `${e.day === "tomorrow" ? "Завтра" : "Сегодня"}, ${e.time}`;
const outcomeText = { win: "Сбылся", loss: "Не сбылся", void: "Возврат" };

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
function Nav({ route, go, bottom = false }) {
  return (
    <nav
      className={bottom ? "bottom-nav" : "m-nav"}
      aria-label={bottom ? "Мобильная навигация" : "Навигация"}
    >
      {navItems.map(([path, label, Icon]) => (
        <button
          key={path}
          aria-current={
            route === path || (path === "/" && route.startsWith("/match/"))
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
function Teams({ event, large = false }) {
  return (
    <div className={`m-teams ${large ? "large" : ""}`}>
      <div>
        <TeamMark code={event.homeCode} />
        <strong>{event.home}</strong>
      </div>
      <div>
        <TeamMark code={event.awayCode} />
        <strong>{event.away}</strong>
      </div>
    </div>
  );
}
function Probability({ value, compact = false, explain }) {
  return (
    <button
      className={`m-probability ${compact ? "compact" : ""}`}
      onClick={explain}
      aria-label={`Вероятность ${value} процентов: что это значит`}
    >
      <strong>
        {value}
        <span>%</span>
      </strong>
      <span>
        Вероятность <CircleHelp size={12} />
      </span>
    </button>
  );
}
function ForecastCard({ forecast: f, owned, saved, save, go, buy, explain }) {
  return (
    <motion.article
      className="forecast-card"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="card-meta">
        <span
          className={`sport-label ${f.event.sport === "CS2" ? "esport" : ""}`}
        >
          {f.event.sport === "CS2" ? (
            <Gamepad2 size={13} />
          ) : (
            <Trophy size={13} />
          )}
          {f.event.sport}
        </span>
        <span>{when(f.event)}</span>
        <button
          className="m-icon save-button"
          aria-label={
            saved ? `Убрать из избранного: ${f.id}` : `Сохранить: ${f.id}`
          }
          aria-pressed={saved}
          onClick={() => save(f.id)}
        >
          <Bookmark size={17} fill={saved ? "currentColor" : "none"} />
        </button>
      </div>
      <button
        className="card-match"
        onClick={() => go("/match/" + f.id)}
        aria-label={`Открыть матч: ${f.event.home} — ${f.event.away}`}
      >
        <Teams event={f.event} />
        <ChevronRight size={17} />
      </button>
      <div className="card-prediction">
        <div>
          <span>
            <Sparkles size={12} /> Прогноз AI
          </span>
          <h2>{f.pick}</h2>
          <small>
            {f.type} <i /> Коэф. {f.odds.toFixed(2)}
          </small>
        </div>
        <Probability value={f.probability} compact explain={() => explain(f)} />
      </div>
      <div className="probability-track" aria-hidden="true">
        <motion.i
          initial={{ width: 0 }}
          animate={{ width: f.probability + "%" }}
          transition={{ duration: 0.8 }}
        />
      </div>
      <div className="card-actions">
        <button className="m-why" onClick={() => explain(f)}>
          <Sparkles size={14} /> Почему?
        </button>
        <button
          className={`m-button ${owned ? "owned" : ""}`}
          onClick={() => (owned ? go("/match/" + f.id) : buy(f))}
        >
          {owned ? (
            <>
              <Check size={15} /> Открыть прогноз
            </>
          ) : f.price ? (
            <>
              Купить · {money(f.price)}
              <ArrowUpRight size={16} />
            </>
          ) : (
            <>
              Открыть бесплатно
              <ArrowUpRight size={16} />
            </>
          )}
        </button>
      </div>
    </motion.article>
  );
}
function Empty({ title, text, action, label = "Смотреть прогнозы" }) {
  return (
    <div className="m-empty">
      <Search size={28} />
      <h2>{title}</h2>
      <p>{text}</p>
      <button className="m-button" onClick={action}>
        {label}
        <ArrowRight size={16} />
      </button>
    </div>
  );
}

function Market({ props }) {
  const [sport, setSport] = useState("Все");
  const [day, setDay] = useState("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("recommended");
  const filtered = forecasts.filter(
    (f) =>
      (sport === "Все" || f.event.sport === sport) &&
      (day === "all" || f.event.day === day) &&
      `${f.event.home} ${f.event.away} ${f.pick}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  if (sort === "probability")
    filtered.sort((a, b) => b.probability - a.probability);
  if (sort === "price") filtered.sort((a, b) => a.price - b.price);
  return (
    <>
      <section className="market-intro">
        <div>
          <span className="m-eyebrow">
            <span className="status-dot" /> RAKURS AI · СПОРТ И КИБЕРСПОРТ
          </span>
          <h1>Выбирайте с AI.</h1>
          <p>
            Прогноз на матч, понятные аргументы
            <br className="desktop-break" /> и полный разбор в один клик.
          </p>
          <button className="intro-help" onClick={props.stories}>
            Как это работает <ArrowUpRight size={15} />
          </button>
        </div>
        <div className="intro-art" aria-hidden="true">
          <span className="orbit orbit-one" />
          <span className="orbit orbit-two" />
          <div className="ai-core">
            <Sparkles size={45} />
          </div>
          <span className="art-chip chip-one">
            <Target size={15} /> Данные → прогноз
          </span>
          <span className="art-chip chip-two">
            <CheckCircle2 size={15} /> Всё в одном месте
          </span>
        </div>
      </section>
      <div className="market-title">
        <div>
          <h2>AI-прогнозы</h2>
          <span>Демоподборка · 5–6 октября</span>
        </div>
        <button className="text-button" onClick={() => props.go("/results")}>
          Результаты AI
          <ArrowUpRight size={15} />
        </button>
      </div>
      <div className="market-toolbar">
        <div className="m-tabs" aria-label="Вид спорта">
          {["Все", "Футбол", "CS2"].map((s) => (
            <button
              key={s}
              aria-pressed={sport === s}
              onClick={() => setSport(s)}
            >
              {s === "Футбол" ? (
                <Trophy size={15} />
              ) : s === "CS2" ? (
                <Gamepad2 size={16} />
              ) : (
                <LayoutGrid size={15} />
              )}{" "}
              {s}
            </button>
          ))}
        </div>
        <label className="m-search">
          <Search size={17} />
          <input
            aria-label="Найти команду или прогноз"
            placeholder="Команда или прогноз"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button onClick={() => setQuery("")} aria-label="Очистить поиск">
              <X size={15} />
            </button>
          )}
        </label>
      </div>
      <div className="market-filters">
        <div>
          {[
            ["all", "Все даты"],
            ["today", "Сегодня"],
            ["tomorrow", "Завтра"],
          ].map(([id, label]) => (
            <button
              key={id}
              onClick={() => setDay(id)}
              aria-pressed={day === id}
            >
              {label}
            </button>
          ))}
        </div>
        <label>
          <span className="sr-only">Сортировка</span>
          <select
            aria-label="Сортировка"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="recommended">Выбор AI</option>
            <option value="probability">По вероятности</option>
            <option value="price">Сначала бесплатные</option>
          </select>
        </label>
      </div>
      {filtered.length ? (
        <div className="forecast-grid">
          {filtered.map((f) => (
            <ForecastCard
              key={f.id}
              forecast={f}
              {...props}
              owned={props.owns(f.id)}
              saved={props.favorites.includes(f.id)}
            />
          ))}
        </div>
      ) : (
        <Empty
          title="Ничего не нашлось"
          text="Попробуйте другую команду или уберите фильтры."
          label="Сбросить фильтры"
          action={() => {
            setSport("Все");
            setDay("all");
            setQuery("");
          }}
        />
      )}
      <div className="market-bottom-note">
        <ShieldCheck size={17} />
        <p>
          Покупаете разбор, а не гарантию победы.
          <span>
            Данные, оценки AI и оплата в этой версии демонстрационные.
          </span>
        </p>
        <button onClick={props.about} aria-label="О демоверсии">
          <CircleHelp size={19} />
        </button>
      </div>
    </>
  );
}

function ForecastDetail({ forecast: f, props }) {
  const owned = props.owns(f.id);
  const [copied, setCopied] = useState(false);
  const reduced = useReducedMotion();
  useEffect(() => {
    if (!owned) return;
    const timer = setTimeout(() => {
      const section = document.getElementById("full-forecast");
      section?.scrollIntoView({ behavior: "instant", block: "start" });
      section?.focus({ preventScroll: true });
    }, 250);
    return () => clearTimeout(timer);
  }, [owned, f.id]);
  async function copy() {
    try {
      await navigator.clipboard.writeText(
        `${f.event.home} — ${f.event.away}\n${f.short}\n${f.condition}\nДемонстрационный прогноз Ракурс AI`,
      );
      setCopied(true);
    } catch {
      props.notify("Не удалось скопировать. Выделите текст прогноза вручную.");
    }
  }
  return (
    <>
      <button className="m-back" onClick={() => props.go("/")}>
        <ArrowLeft size={16} />
        Все прогнозы
      </button>
      <div className="detail-heading">
        <span className="sport-label">
          {f.event.sport} · {f.event.league.split("•")[0]}
        </span>
        <span>
          <Clock3 size={14} />
          {when(f.event)} МСК
        </span>
      </div>
      <div className={`forecast-detail-grid ${owned ? "has-access" : ""}`}>
        <div className="detail-main">
          <section className="detail-match">
            <Teams event={f.event} large />
            <div className="detail-pick">
              <span className="m-eyebrow">
                <Sparkles size={15} />
                ВЫБОР RAKURS AI
              </span>
              <h1>{f.pick}</h1>
              <p>{f.reason}</p>
            </div>
            <div className="detail-numbers">
              <Probability
                value={f.probability}
                explain={() => props.explain(f)}
              />
              <div>
                <strong>{f.odds.toFixed(2)}</strong>
                <span>Коэффициент · пример</span>
              </div>
              <div className="detail-number-note">
                <Info size={16} />
                <span>
                  Вероятность — оценка,
                  <br />а не обещание победы.
                </span>
              </div>
            </div>
            <button className="explain-wide" onClick={() => props.explain(f)}>
              <span>
                <Sparkles size={17} />
                Почему AI выбрал этот прогноз?
              </span>
              <ArrowRight size={18} />
            </button>
          </section>
          <section className="simple-dashboard">
            <div className="section-line">
              <h2>На что смотрит AI</h2>
              <span>Демоданные</span>
            </div>
            <div className="factor-grid">
              {f.factors.map(([title, value, caption, percentage]) => (
                <button key={title} onClick={() => props.explain(f)}>
                  <span>
                    {title}
                    <ArrowUpRight size={14} />
                  </span>
                  <strong>{value}</strong>
                  <p>{caption}</p>
                  <div className="factor-track">
                    <motion.i
                      initial={{ width: 0 }}
                      whileInView={{ width: percentage + "%" }}
                      viewport={{ once: true }}
                      transition={{ duration: reduced ? 0 : 0.8 }}
                    />
                  </div>
                </button>
              ))}
            </div>
            <p className="dashboard-foot">
              Пример статистики за 5 последних матчей. Нажмите на показатель —
              AI объяснит связь с прогнозом.
            </p>
          </section>
          {owned && (
            <section
              className="unlocked-forecast"
              id="full-forecast"
              tabIndex={-1}
            >
              <div className="access-label">
                <CheckCircle2 size={16} />
                Полный прогноз открыт
              </div>
              <h2>{f.short}</h2>
              <p>{f.condition}</p>
              <div className="forecast-instructions">
                <span>01</span>
                <div>
                  <h3>Выбор AI</h3>
                  <p>{f.reason}</p>
                </div>
                <span>02</span>
                <div>
                  <h3>Проверьте перед матчем</h3>
                  <p>
                    {f.risk} Ориентир коэффициента в демо — {f.odds.toFixed(2)}.
                  </p>
                </div>
                <span>03</span>
                <div>
                  <h3>Сохранено для вас</h3>
                  <p>
                    Этот разбор уже в «Моих прогнозах». Здесь покупается
                    информация; ставки приложение не принимает.
                  </p>
                </div>
              </div>
              <button className="m-secondary" onClick={copy}>
                {copied ? <Check size={16} /> : <Copy size={16} />}{" "}
                {copied ? "Прогноз скопирован" : "Скопировать прогноз"}
              </button>
            </section>
          )}
        </div>
        <aside className="purchase-panel">
          <div className="purchase-ai">
            <span>
              <Sparkles size={21} />
            </span>
            <div>
              <strong>Ракурс AI</strong>
              <small>Полный прогноз на матч</small>
            </div>
            <span className="small-demo">ДЕМО</span>
          </div>
          <h2>{owned ? "Ваш прогноз открыт" : "Весь разбор — внутри"}</h2>
          <ul>
            {[
              "Выбор AI и условия выигрыша",
              "Аргументы простыми словами",
              "Что проверить перед матчем",
            ].map((t) => (
              <li key={t}>
                <Check size={16} />
                {t}
              </li>
            ))}
          </ul>
          {owned ? (
            <>
              <div className="purchase-owned">
                <CheckCircle2 size={19} />
                Сохранён в моих прогнозах
              </div>
              <button
                className="m-button"
                onClick={() =>
                  document.getElementById("full-forecast")?.scrollIntoView({
                    behavior: reduced ? "instant" : "smooth",
                    block: "start",
                  })
                }
              >
                Читать полный прогноз
                <ArrowDownIcon />
              </button>
            </>
          ) : (
            <>
              <div className="price-line">
                <strong>{money(f.price)}</strong>
                <span>
                  {f.price ? "за один прогноз" : "попробуйте без оплаты"}
                </span>
              </div>
              <button
                className="m-button buy-detail"
                onClick={() => props.buy(f)}
              >
                {f.price ? "Купить прогноз" : "Открыть бесплатно"}
                <ArrowRight size={17} />
              </button>
              <p className="purchase-fine">
                Демо: списания не будет.
                <br />
                Прогноз сохранится на этом устройстве.
              </p>
            </>
          )}
          <button className="save-detail" onClick={() => props.save(f.id)}>
            <Bookmark
              size={16}
              fill={props.favorites.includes(f.id) ? "currentColor" : "none"}
            />
            {props.favorites.includes(f.id)
              ? "В избранном"
              : "Сохранить на потом"}
          </button>
        </aside>
      </div>
    </>
  );
}
function ArrowDownIcon() {
  return <ArrowRight size={17} style={{ transform: "rotate(90deg)" }} />;
}

function Library({ props }) {
  const [tab, setTab] = useState("bought");
  const items = forecasts.filter((f) =>
    tab === "bought" ? props.owns(f.id) : props.favorites.includes(f.id),
  );
  return (
    <>
      <div className="page-heading">
        <span className="m-eyebrow">ВСЁ ПОД РУКОЙ</span>
        <h1>Мои прогнозы</h1>
        <p>Купленные разборы и то, что вы отложили на потом.</p>
      </div>
      <div className="m-tabs library-tabs">
        {[
          ["bought", "Открытые"],
          ["saved", "Избранное"],
        ].map(([id, label]) => (
          <button key={id} aria-pressed={tab === id} onClick={() => setTab(id)}>
            {label}
            <span>
              {
                forecasts.filter((f) =>
                  id === "bought"
                    ? props.owns(f.id)
                    : props.favorites.includes(f.id),
                ).length
              }
            </span>
          </button>
        ))}
      </div>
      {items.length ? (
        <div className="forecast-grid">
          {items.map((f) => (
            <ForecastCard
              key={f.id}
              forecast={f}
              {...props}
              owned={props.owns(f.id)}
              saved={props.favorites.includes(f.id)}
            />
          ))}
        </div>
      ) : (
        <Empty
          title={
            tab === "bought"
              ? "Здесь будут ваши прогнозы"
              : "Пока ничего не сохранено"
          }
          text={
            tab === "bought"
              ? "Начните с бесплатного прогноза или выберите матч в каталоге."
              : "Нажмите на закладку рядом с матчем — он появится здесь."
          }
          action={() => props.go("/")}
        />
      )}
      <p className="local-note">
        Сохранено в этом браузере. На другом устройстве список будет отдельным.
      </p>
    </>
  );
}
function Results({ props }) {
  const [sport, setSport] = useState("Все");
  const rows = results.filter(
    (r) => sport === "Все" || r.forecast.event.sport === sport,
  );
  const summary = resultSummary(rows);
  return (
    <>
      <div className="page-heading">
        <span className="m-eyebrow">ПРОЗРАЧНАЯ ИСТОРИЯ</span>
        <h1>Как сыграли прогнозы</h1>
        <p>Показываем все результаты — и удачные, и неудачные.</p>
      </div>
      <div className="results-notice">
        <Info size={17} />
        <span>
          Пример истории для демо. Это не реальные результаты работающей
          AI-модели.
        </span>
      </div>
      <div className="m-tabs library-tabs">
        {["Все", "Футбол", "CS2"].map((s) => (
          <button
            key={s}
            aria-pressed={sport === s}
            onClick={() => setSport(s)}
          >
            {s}
          </button>
        ))}
      </div>
      <div className="results-stats">
        <div className="rate-stat">
          <strong>
            {summary.rate}
            <small>%</small>
          </strong>
          <span>сбывшихся прогнозов</span>
        </div>
        <div>
          <strong>{summary.wins}</strong>
          <span>
            <i className="green-dot" />
            Сбылись
          </span>
        </div>
        <div>
          <strong>{summary.losses}</strong>
          <span>
            <i className="red-dot" />
            Не сбылись
          </span>
        </div>
        <div>
          <strong>{summary.voids}</strong>
          <span>Возвраты</span>
        </div>
      </div>
      <p className="result-formula">
        {summary.wins} из {summary.wins + summary.losses} рассчитанных
        прогнозов. Возвраты не учитываются в проценте.
      </p>
      <div className="results-list">
        {rows.map((r) => (
          <button
            className="result-row"
            key={r.id}
            onClick={() => props.result(r)}
          >
            <span className="result-emblem">
              <TeamMark code={r.forecast.event.homeCode} />
            </span>
            <span className="result-info">
              <strong>
                {r.forecast.event.home} — {r.forecast.event.away}
              </strong>
              <span>{r.forecast.pick}</span>
              <small>
                {r.date} · {r.forecast.event.sport}
              </small>
            </span>
            <span className={`result-badge ${r.outcome}`}>
              {outcomeText[r.outcome]}
            </span>
            <ChevronRight size={16} />
          </button>
        ))}
      </div>
    </>
  );
}

function Explanation({ forecast: f, close }) {
  const [topic, setTopic] = useState("why");
  return (
    <Modal title="Почему AI так думает" close={close} kind="explain-modal">
      <div className="explain-event">
        <Teams event={f.event} />
        <span className="small-demo">ПРИМЕР AI</span>
      </div>
      <div className="explain-content">
        <div className="ai-message">
          <span>
            <Sparkles size={15} />
            Ракурс AI
          </span>
          <h2>
            {topic === "why"
              ? f.pick
              : topic === "chance"
                ? `Что значит вероятность ${f.probability}%`
                : "Что может пойти иначе"}
          </h2>
          <p>
            {topic === "why"
              ? f.reason
              : topic === "chance"
                ? `Если бы оценка была точной, такой исход случался бы примерно в ${f.probability} случаях из 100 похожих матчей. В остальных ${100 - f.probability} случаях — нет. Это не гарантия конкретного результата.`
                : f.risk}
          </p>
          {topic === "why" && (
            <div className="ai-reasons">
              {f.factors.map(([name, value, caption]) => (
                <div key={name}>
                  <CheckCircle2 size={16} />
                  <p>
                    <strong>
                      {name}: {value}
                    </strong>
                    <span>{caption}</span>
                  </p>
                </div>
              ))}
            </div>
          )}
          <div className="explain-caveat">
            <Info size={15} />
            <span>
              {topic === "chance"
                ? "В демо проценты заданы для показа интерфейса. Работающая модель пока не подключена."
                : "Выбор AI может оказаться неверным. Данные и ответ здесь демонстрационные."}
            </span>
          </div>
        </div>
      </div>
      <div className="explain-topics">
        {[
          ["why", "Почему этот выбор?"],
          ["chance", "Что значит %?"],
          ["risk", "Какие риски?"],
        ].map(([id, label]) => (
          <button
            key={id}
            aria-pressed={topic === id}
            onClick={() => setTopic(id)}
          >
            {label}
          </button>
        ))}
      </div>
    </Modal>
  );
}
const storySlides = [
  [
    "Выберите матч.",
    "Футбол или CS2. На каждой карточке — прогноз AI, вероятность и цена.",
    "Выбор AI",
    "58%",
    "Вероятность прогноза",
  ],
  [
    "Узнайте почему.",
    "Нажмите «Почему?» — AI объяснит свой выбор простыми словами. Без сложных таблиц.",
    "Понятные аргументы",
    "4 из 5",
    "побед в последних матчах",
  ],
  [
    "Откройте прогноз.",
    "Купите полный разбор: условия прогноза, аргументы и важные детали перед матчем. Есть бесплатный пример.",
    "Один прогноз",
    "390 ₽",
    "Демо · без списания",
  ],
  [
    "Всё уже сохранено.",
    "Разборы ждут в «Моих прогнозах». А в «Результатах» видна история удачных и неудачных прогнозов.",
    "Мои прогнозы",
    "Готово",
    "Можно возвращаться в любой момент",
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
            {step === 3 ? "Смотреть прогнозы" : "Дальше"}
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

export default function MarketApp() {
  const [route, setRoute] = useState(() =>
    marketRoute(routeFromHash(location.hash)),
  );
  const [purchases, setPurchases] = useSaved("aiPurchases", []);
  const [oldPurchases] = useSaved("purchases", []);
  const [favorites, setFavorites] = useSaved("favorites", []);
  const [seen, setSeen] = useSaved("marketOnboardingSeen", false);
  const [modal, setModal] = useState(() => (seen ? null : { type: "stories" }));
  const [toast, setToast] = useState("");
  const reduced = useReducedMotion();
  const focusRoute = useRef(false);
  useEffect(() => initTelegram(), []);
  useEffect(() => {
    const handle = () => {
      setRoute(marketRoute(routeFromHash(location.hash)));
      focusRoute.current = true;
    };
    window.addEventListener("hashchange", handle);
    return () => window.removeEventListener("hashchange", handle);
  }, []);
  useEffect(() => {
    window.scrollTo(0, 0);
    if (focusRoute.current) {
      document.querySelector("main")?.focus();
      focusRoute.current = false;
    }
  }, [route]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 3000);
    return () => clearTimeout(t);
  }, [toast]);
  const go = (path) => {
    if (route !== path) {
      location.hash = path;
      haptic();
    } else
      window.scrollTo({ top: 0, behavior: reduced ? "instant" : "smooth" });
  };
  const close = () => {
    if (modal?.type === "stories") setSeen(true);
    setModal(null);
  };
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (!tg?.initData || !tg.isVersionAtLeast?.("6.1")) return;
    const back = () => (modal ? close() : go("/"));
    if (route !== "/" || modal) tg.BackButton.show();
    else tg.BackButton.hide();
    tg.BackButton.onClick(back);
    return () => tg.BackButton.offClick(back);
  }, [route, modal]);
  const owns = (id) => hasForecast(id, purchases, oldPurchases);
  const save = (id) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
    haptic();
  };
  function buy(f) {
    if (owns(f.id)) {
      go("/match/" + f.id);
      return;
    }
    if (!f.price) {
      unlock(f);
      return;
    }
    setModal({ type: "checkout", forecast: f });
  }
  function unlock(f) {
    setPurchases((prev) => (prev.includes(f.id) ? prev : [...prev, f.id]));
    setModal(null);
    go("/match/" + f.id);
    setToast("Прогноз открыт и сохранён в «Моих прогнозах»");
    haptic();
  }
  const props = {
    go,
    owns,
    favorites,
    save,
    buy,
    explain: (f) =>
      setModal({ type: "explain", forecast: f?.id ? f : forecasts[0] }),
    stories: () => setModal({ type: "stories" }),
    about: () => setModal({ type: "about" }),
    result: (r) => setModal({ type: "result", result: r }),
    notify: setToast,
  };
  const forecast = route.startsWith("/match/")
    ? forecasts.find((f) => f.id === route.slice(7))
    : null;
  return (
    <MotionConfig reducedMotion="user">
      <div className="market-app">
        <a className="skip-link" href="#main-content">
          К содержимому
        </a>
        <header className="market-header">
          <div>
            <Logo go={go} />
            <Nav route={route} go={go} />
            <button className="demo-badge" onClick={props.stories}>
              <span />
              Демо-версия
              <CircleHelp size={13} />
            </button>
          </div>
        </header>
        <main id="main-content" tabIndex={-1}>
          <div data-route={route} key={route}>
            {route === "/" ? (
              <Market props={props} />
            ) : route === "/library" ? (
              <Library props={props} />
            ) : route === "/results" ? (
              <Results props={props} />
            ) : forecast ? (
              <ForecastDetail forecast={forecast} props={props} />
            ) : (
              <Empty
                title="Этот прогноз недоступен"
                text="Вернитесь в каталог и выберите другой матч."
                action={() => go("/")}
              />
            )}
          </div>
        </main>
        <footer className="market-footer">
          <span>
            rakurs<span>AI</span>
          </span>
          <p>
            Демонстрационная версия · 18+
            <br />
            Не принимает ставки. Не гарантирует выигрыш.
          </p>
          <button onClick={props.about}>
            О демоверсии
            <ArrowUpRight size={13} />
          </button>
        </footer>
        <Nav route={route} go={go} bottom />
      </div>
      <AnimatePresence>
        {toast && (
          <motion.div
            className="m-toast"
            role="status"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <CheckCircle2 size={18} />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {modal?.type === "stories" ? (
          <Stories close={close} />
        ) : modal?.type === "explain" ? (
          <Explanation forecast={modal.forecast} close={close} />
        ) : modal?.type === "checkout" ? (
          <Modal title="Открыть полный прогноз" close={close}>
            <div className="checkout-content">
              <Teams event={modal.forecast.event} />
              <div className="checkout-pick">
                <span>Выбор AI</span>
                <h2>{modal.forecast.pick}</h2>
              </div>
              <ul className="checkout-list">
                <li>
                  <Check size={16} />
                  Условия прогноза и аргументы AI
                </li>
                <li>
                  <Check size={16} />
                  Важные детали перед матчем
                </li>
                <li>
                  <Check size={16} />
                  Доступ в «Моих прогнозах»
                </li>
              </ul>
              <div className="checkout-total">
                <span>Один прогноз</span>
                <strong>{money(modal.forecast.price)}</strong>
              </div>
              <div className="checkout-demo">
                <ShieldCheck size={19} />
                <p>
                  <strong>Это демопокупка</strong>
                  <span>Деньги не спишутся. Карта не нужна.</span>
                </p>
              </div>
              <button
                className="m-button confirm-purchase"
                onClick={() => unlock(modal.forecast)}
              >
                Открыть без списания
                <ArrowRight size={17} />
              </button>
              <p className="purchase-fine">
                Покупка разбора не означает размещение ставки.
              </p>
            </div>
          </Modal>
        ) : modal?.type === "about" ? (
          <Modal title="О демоверсии" close={close}>
            <div className="about-content">
              <h2>Попробуйте весь путь.</h2>
              <p>
                Выберите прогноз, посмотрите объяснение AI и откройте полный
                разбор. Покупки и избранное сохраняются на этом устройстве.
              </p>
              <p>
                Команды, вероятности и результаты вымышлены. Ответы AI
                подготовлены заранее, внешняя модель и платежи пока не
                подключены.
              </p>
              <button
                className="m-button"
                onClick={() => setModal({ type: "stories" })}
              >
                Как это работает
                <ArrowRight size={17} />
              </button>
            </div>
          </Modal>
        ) : modal?.type === "result" ? (
          <Modal title="Результат прогноза" close={close}>
            <div className="about-content">
              <span className={`result-badge ${modal.result.outcome}`}>
                {outcomeText[modal.result.outcome]}
              </span>
              <h2>
                {modal.result.forecast.event.home} —{" "}
                {modal.result.forecast.event.away}
              </h2>
              <p>{modal.result.forecast.pick}</p>
              <p>
                {modal.result.outcome === "win"
                  ? "Условие прогноза выполнилось."
                  : modal.result.outcome === "loss"
                    ? "Условие прогноза не выполнилось. AI может ошибаться."
                    : "Матч отменён в демонстрационном сценарии. В расчёт процента не входит."}
              </p>
              <small>
                {modal.result.date} · Вымышленная запись для демонстрации
                истории
              </small>
            </div>
          </Modal>
        ) : null}
      </AnimatePresence>
    </MotionConfig>
  );
}
