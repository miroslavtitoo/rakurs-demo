import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion, MotionConfig } from "motion/react";
import {
  ArrowUpRight,
  ArrowRight,
  ArrowLeft,
  Check,
  ChevronRight,
  ChevronDown,
  Plus,
  X,
  Search,
  SlidersHorizontal,
  LayoutGrid,
  Users,
  Bookmark,
  PenLine,
  Bell,
  Info,
  Sparkles,
  ShieldCheck,
  LockKeyhole,
  Clock3,
  Activity,
  Gamepad2,
  CircleDot,
  CheckCircle2,
  ExternalLink,
  BookOpen,
  TrendingUp,
  BarChart3,
  CheckCheck,
  Trash2,
  Menu,
  Send,
  CircleHelp,
} from "lucide-react";
import {
  events,
  authors,
  materials,
  getStats,
  money,
  signed,
  canRead,
  getMatchContext,
  SNAPSHOT,
} from "./data.js";
import OverviewDesign from "./Overview.jsx";
import TeamMark from "./TeamMark.jsx";
import Atmosphere from "./Atmosphere.jsx";
import { initTelegram, haptic } from "./telegram.js";
import { routeFromHash } from "./routing.js";

const Ctx = createContext(null);
const useApp = () => useContext(Ctx);
const iconProps = { size: 18, strokeWidth: 1.65 };
const navItems = [
  ["/", "Обзор", LayoutGrid],
  ["/analysts", "Аналитики", Users],
  ["/library", "Мои материалы", Bookmark],
  ["/studio", "Кабинет автора", PenLine],
];
const anim = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -7 },
  transition: { duration: 0.28 },
};
function useStored(key, initial) {
  const [state, setState] = useState(() => {
    try {
      const value = JSON.parse(localStorage.getItem("rakurs:" + key));
      return value !== null &&
        typeof value === typeof initial &&
        Array.isArray(value) === Array.isArray(initial)
        ? value
        : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem("rakurs:" + key, JSON.stringify(state));
    } catch {}
  }, [key, state]);
  return [state, setState];
}
function Logo({ small = false }) {
  return (
    <span className={"brand " + (small ? "brand-small" : "")}>
      <svg className="brand-symbol" viewBox="0 0 40 40" aria-hidden="true">
        <path
          d="M5 29 16 6h8L13 29Z M17 34 28 11h8L25 34Z"
          fill="currentColor"
        />
      </svg>
      {!small && (
        <>
          rakurs<span className="brand-dot">.</span>
        </>
      )}
    </span>
  );
}
function Avatar({ author, size = "" }) {
  return (
    <span className={"avatar " + size} style={{ "--avatar": author.color }}>
      <img src={`./images/analysts/${author.id}.webp`} alt="" width="160" height="160" loading="lazy" />
    </span>
  );
}
function SportIcon({ sport, ...props }) {
  return sport === "CS2" ? (
    <Gamepad2 {...iconProps} {...props} />
  ) : (
    <CircleDot {...iconProps} {...props} />
  );
}
function Tag({ children, tone = "" }) {
  return <span className={"tag " + tone}>{children}</span>;
}
function Empty({ title, text, action }) {
  return (
    <div className="empty">
      <Bookmark size={30} strokeWidth={1} />
      <h3>{title}</h3>
      <p>{text}</p>
      {action}
    </div>
  );
}
function SectionHead({ eyebrow, title, action }) {
  return (
    <div className="section-head">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h2>{title}</h2>
      </div>
      {action}
    </div>
  );
}
function Chart({ values, labels = ["", ""], large = false }) {
  const min = Math.min(...values),
    max = Math.max(...values),
    range = max - min || 1;
  const pts = values.map((v, i) => [
    (i / (values.length - 1)) * 600,
    110 - ((v - min) / range) * 88,
  ]);
  const path = pts.map(([x, y], i) => `${i ? "L" : "M"}${x},${y}`).join(" ");
  return (
    <div className={"chart " + (large ? "large" : "")}>
      <svg
        viewBox="0 0 600 132"
        role="img"
        aria-label={`График: ${values.map((x) => x.toFixed(2)).join(", ")}`}
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#d7fa77" stopOpacity=".19" />
            <stop offset="100%" stopColor="#d7fa77" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[28, 68, 108].map((y) => (
          <path
            key={y}
            d={`M0,${y} H600`}
            stroke="currentColor"
            strokeDasharray="3 5"
            opacity=".12"
          />
        ))}
        <path d={`${path} L600,132 L0,132 Z`} fill="url(#chart-fill)" />
        <motion.path
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.9 }}
          d={path}
          fill="none"
          stroke="#d7fa77"
          strokeWidth="2.5"
          vectorEffect="non-scaling-stroke"
        />
        <circle cx="600" cy={pts.at(-1)[1]} r="4" fill="#d7fa77" />
      </svg>
      <div className="chart-labels">
        <span>{labels[0]}</span>
        <span>{labels[1]}</span>
      </div>
    </div>
  );
}
function Modal({ title, children, onClose, wide = false }) {
  const box = useRef(null);
  useEffect(() => {
    const before = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    box.current?.focus();
    const key = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        const nodes = box.current?.querySelectorAll(
          'button, a[href], input, textarea, select, [tabindex="0"]',
        );
        if (!nodes?.length) return;
        const first = nodes[0],
          last = nodes[nodes.length - 1];
        if (
          e.shiftKey &&
          (document.activeElement === first ||
            document.activeElement === box.current)
        ) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", key);
      before?.focus?.();
    };
  }, [onClose]);
  return (
    <motion.div
      className="modal-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.section
        ref={box}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={"modal " + (wide ? "wide" : "")}
        initial={{ y: 32, opacity: 0, scale: 0.98 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 30, opacity: 0 }}
        transition={{ type: "spring", damping: 30, stiffness: 330 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-heading">
          <h2>{title}</h2>
          <button
            className="icon-button"
            onClick={onClose}
            aria-label="Закрыть"
          >
            <X {...iconProps} />
          </button>
        </div>
        {children}
      </motion.section>
    </motion.div>
  );
}
export default function App() {
  const [route, setRoute] = useState(() => routeFromHash(location.hash));
  const [favorites, setFavorites] = useStored("favorites", []);
  const [purchases, setPurchases] = useStored("purchases", []);
  const [subscriptions, setSubscriptions] = useStored("subscriptions", []);
  const [publications, setPublications] = useStored("publications", []);
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState("");
  const [notificationRead, setNotificationRead] = useStored(
    "notificationRead",
    false,
  );
  useEffect(() => {
    const handler = () => {
      setRoute(routeFromHash(location.hash));
      window.scrollTo({ top: 0, behavior: "instant" });
    };
    window.addEventListener("hashchange", handler);
    const clean = initTelegram();
    return () => {
      window.removeEventListener("hashchange", handler);
      clean();
    };
  }, []);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 3200);
    return () => clearTimeout(t);
  }, [toast]);
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (!tg?.initData || !tg.isVersionAtLeast?.("6.1")) return;
    const cb = () => {
      if (modal) setModal(null);
      else if (route.startsWith("/author/")) navigate("/analysts");
      else if (route.startsWith("/read/")) {
        const m = [...publications, ...materials].find(
          (m) => m.id === route.split("/")[2],
        );
        navigate(m ? "/match/" + m.eventId : "/library");
      } else navigate("/");
    };
    if (route !== "/" || modal) tg.BackButton.show();
    else tg.BackButton.hide();
    tg.BackButton.onClick(cb);
    return () => tg.BackButton.offClick(cb);
  }, [route, modal]);
  function navigate(path) {
    haptic();
    if (routeFromHash(location.hash) === path) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    location.hash = path;
  }
  function favorite(id) {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id],
    );
    haptic();
  }
  const allMaterials = [...publications, ...materials];
  const ctx = {
    route,
    navigate,
    favorites,
    favorite,
    purchases,
    setPurchases,
    subscriptions,
    setSubscriptions,
    publications,
    setPublications,
    allMaterials,
    setModal,
    notify: setToast,
  };
  let page;
  const [area, id] = route.slice(1).split("/");
  if (!area) page = <Overview />;
  else if (area === "match") page = <MatchPage key={id} id={id} />;
  else if (area === "analysts") page = <Analysts />;
  else if (area === "author") page = <AuthorPage key={id} id={id} />;
  else if (area === "read") page = <MaterialPage key={id} id={id} />;
  else if (area === "library") page = <Library />;
  else if (area === "studio") page = <Studio />;
  else
    page = (
      <Empty
        title="Такого экрана нет"
        text="Вернитесь в обзор событий."
        action={
          <button className="primary" onClick={() => navigate("/")}>
            В обзор
          </button>
        }
      />
    );
  const active =
    area === "author"
      ? "analysts"
      : area === "read"
        ? "library"
        : area === "match"
          ? ""
          : area;
  return (
    <MotionConfig reducedMotion="user">
      <Ctx.Provider value={ctx}>
        <div className="app-shell">
          <Atmosphere />
          <aside className="sidebar">
            <button
              className="logo-button"
              onClick={() => navigate("/")}
              aria-label="Ракурс — на главную"
            >
              <Logo />
            </button>
            <div className="sidebar-caption">SPORTS INTELLIGENCE</div>
            <div className="workspace-label">ПРОСТРАНСТВО</div>
            <nav aria-label="Основная навигация">
              {navItems.map(([path, label, Icon]) => (
                <button
                  key={path}
                  onClick={() => navigate(path)}
                  className={active === path.slice(1) ? "active" : ""}
                >
                  <Icon {...iconProps} />
                  <span>{label}</span>
                  {path === "/library" && purchases.length > 0 && (
                    <span className="nav-count">{purchases.length}</span>
                  )}
                </button>
              ))}
            </nav>
            <div className="sidebar-bottom">
              <div className="sidebar-note">
                <span className="orbit-mini">✳</span>
                <p>
                  За каждой цифрой
                  <br />
                  <em>есть целая игра.</em>
                </p>
                <button onClick={() => setModal({ type: "about" })}>
                  Знакомство с Ракурсом <ArrowUpRight size={15} />
                </button>
              </div>
              <button
                className="user-card"
                onClick={() => navigate("/library")}
              >
                <span className="user-avatar"><Users size={18} strokeWidth={1.5} /></span>
                <span>
                  <strong>Гость Ракурса</strong>
                  <small>Демонстрационный доступ</small>
                </span>
                <ChevronRight size={15} />
              </button>
            </div>
          </aside>
          <div className="main-wrap">
            <header className="topbar">
              <div className="mobile-brand">
                <Logo />
              </div>
              <div className="breadcrumb">
                Пространство аналитики <span>/</span>{" "}
                <strong>
                  {navItems.find(([path]) => path.slice(1) === active)?.[1] ||
                    "Обзор"}
                </strong>
              </div>
              <div className="topbar-actions">
                <button
                  className="demo-badge"
                  onClick={() => setModal({ type: "about" })}
                >
                  <span /> ДЕМО-ВЕРСИЯ <Info size={12} />
                </button>
                <button
                  className="icon-button bell"
                  aria-label="Уведомления"
                  onClick={() => {
                    setNotificationRead(true);
                    setModal({ type: "notifications" });
                  }}
                >
                  <Bell {...iconProps} />
                  {!notificationRead && <i />}
                </button>
                <span className="desktop-date">05 / 10 / 2026</span>
              </div>
            </header>
            <main id="main-content">
              <AnimatePresence mode="wait">
                <motion.div key={route} data-route={route} {...anim}>
                  {page}
                </motion.div>
              </AnimatePresence>
            </main>
            <footer className="page-footer">
              <span>
                rakurs. <span>Другой взгляд на игру.</span>
              </span>
              <span>Демонстрационные данные · Не является прогнозом</span>
            </footer>
          </div>
          <nav className="bottom-nav" aria-label="Мобильная навигация">
            {navItems.map(([path, label, Icon], i) => (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={active === path.slice(1) ? "active" : ""}
              >
                <Icon size={20} strokeWidth={1.7} />
                <span>{["Обзор", "Аналитики", "Материалы", "Автор"][i]}</span>
              </button>
            ))}
          </nav>
        </div>
        <AnimatePresence>
          {toast && (
            <motion.div
              role="status"
              className="toast"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
            >
              <CheckCircle2 size={18} />
              {toast}
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {modal && <GlobalModal modal={modal} close={() => setModal(null)} />}
        </AnimatePresence>
      </Ctx.Provider>
    </MotionConfig>
  );
}

function Overview() {
  return (
    <OverviewDesign
      useApp={useApp}
      EventList={EventList}
      Avatar={Avatar}
      Tag={Tag}
      TeamMark={TeamMark}
      SectionHead={SectionHead}
      authors={authors}
    />
  );
}
function EventList({ onlyFavorites = false }) {
  const { navigate, favorites, favorite, setModal, allMaterials } = useApp();
  const [sport, setSport] = useState("Все");
  const [day, setDay] = useState("today");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("time");
  const [filters, setFilters] = useState(false);
  const rows = events
    .filter(
      (e) =>
        (!onlyFavorites || favorites.includes(e.id)) &&
        (sport === "Все" || e.sport === sport) &&
        (onlyFavorites || day === "all" || e.day === day) &&
        `${e.home} ${e.away} ${e.league}`
          .toLowerCase()
          .includes(query.toLowerCase()),
    )
    .sort((a, b) =>
      sort === "analyses"
        ? allMaterials.filter((m) => m.eventId === b.id).length -
          allMaterials.filter((m) => m.eventId === a.id).length
        : a.time.localeCompare(b.time),
    );
  return (
    <section className="events-section">
      <SectionHead
        eyebrow={onlyFavorites ? "ПОД РУКОЙ" : "ВЫБЕРИТЕ СВОЮ ИГРУ"}
        title={onlyFavorites ? "Избранные события" : "На радаре"}
        action={
          !onlyFavorites && (
            <div className="date-switch">
              {[
                ["today", "Сегодня, 5 окт"],
                ["tomorrow", "Завтра"],
                ["finished", "Архив"],
              ].map(([v, label]) => (
                <button
                  className={day === v ? "active" : ""}
                  key={v}
                  onClick={() => setDay(v)}
                >
                  {label}
                </button>
              ))}
            </div>
          )
        }
      />
      <div className="event-toolbar">
        <div className="segmented">
          {["Все", "Футбол", "CS2"].map((s) => (
            <button
              className={sport === s ? "active" : ""}
              onClick={() => setSport(s)}
              key={s}
            >
              {s === "Все" ? (
                <LayoutGrid size={15} />
              ) : (
                <SportIcon sport={s} size={16} />
              )}{" "}
              {s === "Все" ? "Все события" : s}
            </button>
          ))}
        </div>
        <div className="search-group">
          <label className="search-box">
            <Search size={17} />
            <input
              aria-label="Поиск событий"
              placeholder="Команда или турнир"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button aria-label="Очистить поиск" onClick={() => setQuery("")}>
                <X size={14} />
              </button>
            )}
          </label>
          <button
            className={
              "icon-button filter-button " + (filters ? "selected" : "")
            }
            aria-expanded={filters}
            aria-label="Сортировка событий"
            onClick={() => setFilters(!filters)}
          >
            <SlidersHorizontal size={18} />
          </button>
        </div>
      </div>
      <AnimatePresence>
        {filters && (
          <motion.div {...anim} className="filter-panel">
            <span>Порядок событий</span>
            <select
              aria-label="Порядок событий"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="time">По времени начала</option>
              <option value="analyses">По числу разборов</option>
            </select>
            <button
              className="subtle"
              onClick={() => {
                setSport("Все");
                setQuery("");
                setDay("today");
                setSort("time");
              }}
            >
              Сбросить фильтры
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="event-table">
        <div className="table-header">
          <span>СОБЫТИЕ / ТУРНИР</span>
          <span>НАЧАЛО · МСК</span>
          <span>ФОРМА</span>
          <span>РАЗБОРЫ</span>
          <span />
        </div>
        {rows.length ? (
          rows.map((e, i) => (
            <motion.article
              layout
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.025 }}
              className="event-row"
              key={e.id}
            >
              <button
                className="event-primary"
                onClick={() => navigate("/match/" + e.id)}
              >
                <span className="event-names">
                  <span className="event-team-line"><TeamMark code={e.homeCode} /><strong>{e.home}</strong></span>
                  <span className="event-team-line"><TeamMark code={e.awayCode} away /><strong>{e.away}</strong></span>
                  <small>
                    <SportIcon sport={e.sport} size={12} />
                    {e.sport} <span>·</span> {e.league}
                  </small>
                </span>
              </button>
              <span className="event-time">
                {e.time}
                <small>{e.day === "finished" ? "Завершён" : e.date}</small>
              </span>
              <span className="form-pills">
                {e.form.map((v, j) => (
                  <i
                    key={j}
                    className={v.toLowerCase()}
                    title={
                      v === "W" ? "Победа" : v === "L" ? "Поражение" : "Ничья"
                    }
                  >
                    {v === "W" ? "В" : v === "L" ? "П" : "Н"}
                  </i>
                ))}
              </span>
              <button
                className="analysis-count"
                onClick={() => navigate("/match/" + e.id)}
              >
                {allMaterials.filter((m) => m.eventId === e.id).length} разбора{" "}
                <ArrowUpRight size={13} />
              </button>
              <button
                className={
                  "icon-button save " +
                  (favorites.includes(e.id) ? "saved" : "")
                }
                aria-label={
                  (favorites.includes(e.id)
                    ? "Убрать из избранного: "
                    : "В избранное: ") + e.home
                }
                aria-pressed={favorites.includes(e.id)}
                onClick={() => favorite(e.id)}
              >
                <Bookmark
                  size={17}
                  fill={favorites.includes(e.id) ? "currentColor" : "none"}
                />
              </button>
            </motion.article>
          ))
        ) : (
          <Empty
            title="Пока ничего не нашлось"
            text="Попробуйте другую команду или измените фильтры."
            action={
              <button
                className="subtle"
                onClick={() => {
                  setQuery("");
                  setSport("Все");
                  setDay("all");
                }}
              >
                Показать все события
              </button>
            }
          />
        )}
      </div>
      <div className="table-foot">
        <span>
          {rows.length} из {events.length} событий <span className="tiny-dot" />{" "}
          Условное расписание
        </span>
        <button onClick={() => setModal({ type: "sources" })}>
          Источник данных <Info size={13} />
        </button>
      </div>
    </section>
  );
}
function Back({ label = "К обзору", path = "/" }) {
  const { navigate } = useApp();
  return (
    <button className="back" onClick={() => navigate(path)}>
      <ArrowLeft size={16} />
      {label}
    </button>
  );
}
function MatchPage({ id }) {
  const { navigate, favorites, favorite, setModal, allMaterials } = useApp();
  const e = events.find((x) => x.id === id);
  const [tab, setTab] = useState("Обзор");
  const [period, setPeriod] = useState("24 ч");
  if (!e) return <NotFound />;
  const cs = e.sport === "CS2";
  const context = getMatchContext(e);
  const reads = allMaterials.filter((m) => m.eventId === id);
  return (
    <>
      <Back />
      <div className="detail-heading">
        <div>
          <div className="eyebrow">
            {e.sport} / {e.league}
          </div>
          <h1 className="detail-title">
            Игра <em>в деталях.</em>
          </h1>
        </div>
        <button
          className={"secondary " + (favorites.includes(id) ? "selected" : "")}
          onClick={() => favorite(id)}
        >
          <Bookmark size={17} />
          {favorites.includes(id) ? "В избранном" : "Следить за матчем"}
        </button>
      </div>
      <section className="match-score">
        <div className="score-team">
          <TeamMark code={e.homeCode} />
          <h2>{e.home}</h2>
          <span>{cs ? "Стабильный состав" : "Хозяева поля"}</span>
        </div>
        <div className="score-center">
          <Tag>{e.day === "finished" ? "ЗАВЕРШЁН" : e.date + " · МСК"}</Tag>
          <strong>{e.time}</strong>
          <small>{cs ? "BEST OF 3 · LAN" : "ОСНОВНОЕ ВРЕМЯ"}</small>
        </div>
        <div className="score-team">
          <TeamMark code={e.awayCode} away />
          <h2>{e.away}</h2>
          <span>{cs ? "Стабильный состав" : "Гостевая команда"}</span>
        </div>
      </section>
      <div className="tabs">
        {["Обзор", "Статистика", "Разборы"].map((t) => (
          <button
            key={t}
            className={tab === t ? "active" : ""}
            onClick={() => setTab(t)}
          >
            {t}
            {t === "Разборы" && <span>{reads.length}</span>}
          </button>
        ))}
        <span className="tabs-note">Снимок: {SNAPSHOT}</span>
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={tab} {...anim}>
          {tab === "Обзор" ? (
            <div className="detail-grid">
              <div>
                <section className="panel">
                  <SectionHead
                    eyebrow="ЧТО ВАЖНО ПЕРЕД МАТЧЕМ"
                    title="Контекст решает"
                  />
                  <div className="factor-list">
                    {context.factors.map((f, i) => (
                      <div key={f}>
                        <span>0{i + 1}</span>
                        <p>{f}</p>
                      </div>
                    ))}
                  </div>
                  <div className="risk-note">
                    <Info size={18} />
                    <span>
                      <strong>
                        {cs
                          ? "Карты ещё не определены"
                          : "Ожидаем стартовые составы"}
                      </strong>
                      {context.risk}
                    </span>
                  </div>
                </section>
                <section className="panel line-panel">
                  <SectionHead
                    title="Движение коэффициента"
                    action={
                      <div className="mini-segment">
                        {["24 ч", "6 ч"].map((p) => (
                          <button
                            key={p}
                            className={p === period ? "active" : ""}
                            onClick={() => setPeriod(p)}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    }
                  />
                  <div className="line-value">
                    <strong>{e.odds.toFixed(2)}</strong>
                    <span>
                      Победа {e.home}
                      <small>Демонстрационная линия · {period}</small>
                    </span>
                    <span className="line-change">
                      −{(e.line[0] - e.odds).toFixed(2)}
                    </span>
                  </div>
                  <Chart
                    values={period === "24 ч" ? e.line : e.line.slice(3)}
                    labels={
                      period === "24 ч"
                        ? ["Вчера, 14:30", "Сегодня, 14:30"]
                        : ["Сегодня, 08:30", "Сегодня, 14:30"]
                    }
                  />
                  <button
                    className="subtle"
                    onClick={() => setModal({ type: "sources", event: e })}
                  >
                    Как читать этот график <Info size={13} />
                  </button>
                </section>
              </div>
              <aside>
                <section className="ai-card">
                  <div className="ai-heading">
                    <span className="ai-symbol">✳</span>
                    <Tag>RAKURS AI · ПРИМЕР</Tag>
                  </div>
                  <h2>
                    Соберём картину
                    <br />
                    <em>целиком.</em>
                  </h2>
                  <p>
                    Три фактора, разные мнения и один важный нюанс. Понятно, без
                    лишнего шума.
                  </p>
                  <button
                    className="primary"
                    onClick={() => setModal({ type: "ai", event: e })}
                  >
                    <Sparkles size={17} /> Объяснить матч{" "}
                    <ArrowUpRight size={16} />
                  </button>
                  <small>Подготовленный ответ по демоданным</small>
                </section>
                <div className="compact-material">
                  <div className="eyebrow">НЕЗАВИСИМЫЙ ВЗГЛЯД</div>
                  {reads.slice(0, 1).map((m) => (
                    <MaterialCard key={m.id} material={m} />
                  ))}
                </div>
              </aside>
            </div>
          ) : tab === "Статистика" ? (
            <StatsPanel event={e} />
          ) : (
            <>
              <div className="section-description">
                <h2>Разные мнения. Больше контекста.</h2>
                <p>
                  Каждый автор объясняет свой сценарий и условия, при которых он
                  изменит оценку.
                </p>
                <button
                  className="subtle"
                  onClick={() => navigate("/analysts")}
                >
                  Сравнить аналитиков <ArrowRight size={14} />
                </button>
              </div>
              <div className="material-grid">
                {reads.map((m) => (
                  <MaterialCard key={m.id} material={m} />
                ))}
              </div>
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </>
  );
}
function StatsPanel({ event: e }) {
  const { setModal } = useApp();
  const cs = e.sport === "CS2";
  return (
    <div className="detail-grid">
      <section className="panel">
        <SectionHead
          eyebrow="ДЕМОНСТРАЦИОННАЯ ВЫБОРКА · ПОСЛЕДНИЕ 5 МАТЧЕЙ"
          title={cs ? "Сильные стороны" : "Форма и качество игры"}
        />
        <div className="compare-teams">
          <strong>{e.home}</strong>
          <span>vs</span>
          <strong>{e.away}</strong>
        </div>
        {(cs
          ? [
              ["Выиграно серий", "4 / 5", "3 / 5", 80, 60],
              ["Победы на Mirage", "75%", "50%", 75, 50],
              ["Победы на Nuke", "40%", "67%", 40, 67],
              ["Открывающие дуэли", "54%", "49%", 54, 49],
            ]
          : [
              ["Победы", "3 / 5", "2 / 5", 60, 40],
              ["Ожидаемые голы (xG)", "1,8", "1,3", 72, 52],
              ["Владение мячом", "56%", "44%", 56, 44],
              ["Удары в створ", "5,2", "3,8", 65, 48],
            ]
        ).map(([label, a, b, va, vb]) => (
          <div className="stat-compare" key={label}>
            <div>
              <strong>{a}</strong>
              <span>{label}</span>
              <strong>{b}</strong>
            </div>
            <div className="compare-bars">
              <i style={{ width: va + "%" }} />
              <i style={{ width: vb + "%" }} />
            </div>
          </div>
        ))}
        <p className="fine-print">
          Все показатели условные. Это визуальный пример сравнения, а не
          статистика реальных команд.
        </p>
      </section>
      <section className="panel">
        <SectionHead title={cs ? "Пул карт" : "Состав и тактика"} />
        {(cs
          ? [
              ["Mirage", "Сильная карта хозяев"],
              ["Nuke", "Преимущество гостей"],
              ["Ancient", "Нейтральная карта"],
              ["Veto", "Ожидается перед матчем"],
            ]
          : [
              [e.home, "4–3–3 · высокий прессинг"],
              [e.away, "4–2–3–1 · переходы"],
              ["Составы", "Не подтверждены"],
              ["Главный вопрос", "Скорость выхода из-под прессинга"],
            ]
        ).map(([a, b]) => (
          <div className="simple-row" key={a}>
            <strong>{a}</strong>
            <span>{b}</span>
          </div>
        ))}
        <button
          className="secondary full"
          onClick={() => setModal({ type: "sources", event: e })}
        >
          Посмотреть источники <ExternalLink size={15} />
        </button>
      </section>
    </div>
  );
}
function MaterialCard({ material: m }) {
  const { navigate, purchases, subscriptions } = useApp();
  const a = authors.find((a) => a.id === m.authorId) || authors[0];
  const open = canRead(m, purchases, subscriptions);
  return (
    <article className="material-card">
      <button className="byline" onClick={() => navigate("/author/" + a.id)}>
        <Avatar author={a} size="small" />
        <span>
          <strong>{a.name}</strong>
          <small>{a.sport} · авторский разбор</small>
        </span>
        <ArrowUpRight size={14} />
      </button>
      <button
        className="material-title"
        onClick={() => navigate("/read/" + m.id)}
      >
        <h3>{m.title}</h3>
      </button>
      <p>{m.summary}</p>
      <button
        className="material-link"
        onClick={() => navigate("/read/" + m.id)}
      >
        <span>
          {open ? (
            <>
              <BookOpen size={15} /> Читать разбор
            </>
          ) : (
            <>
              <LockKeyhole size={14} /> {money(m.price)}
            </>
          )}
        </span>
        <ArrowUpRight size={18} />
      </button>
    </article>
  );
}
function Analysts() {
  const { navigate, setModal } = useApp();
  const [sport, setSport] = useState("Все");
  const [sort, setSort] = useState("roi");
  const [compare, setCompare] = useState([]);
  const filtered = authors
    .filter((a) => sport === "Все" || a.sport === sport)
    .sort((a, b) =>
      sort === "price"
        ? a.price - b.price
        : getStats(b.id).roi - getStats(a.id).roi,
    );
  return (
    <>
      <div className="page-intro">
        <div>
          <div className="eyebrow">ЛЮДИ, КОТОРЫЕ ВИДЯТ ГЛУБЖЕ</div>
          <h1>
            У игры есть <em>авторы.</em>
          </h1>
        </div>
        <Tag>
          <ShieldCheck size={13} /> Открытая история
        </Tag>
      </div>
      <p className="page-description">
        Выберите свой подход к аналитике. Сравните аргументы, специализацию
        <br className="desktop-only" /> и полную историю — до того, как открыть
        платный разбор.
      </p>
      <div className="event-toolbar">
        <div className="segmented">
          {["Все", "Футбол", "CS2"].map((s) => (
            <button
              className={s === sport ? "active" : ""}
              key={s}
              onClick={() => setSport(s)}
            >
              {s === "Все" ? "Все авторы" : s}
            </button>
          ))}
        </div>
        <select
          aria-label="Сортировка аналитиков"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="roi">По результату за 90 дней</option>
          <option value="price">По цене подписки</option>
        </select>
      </div>
      <div className="analyst-grid">
        {filtered.map((a) => {
          const s = getStats(a.id);
          return (
            <article className="analyst-card" key={a.id}>
              <div className="analyst-top">
                <Avatar author={a} size="large" />
                <Tag>{a.sport}</Tag>
                <button
                  className={
                    "compare-toggle " +
                    (compare.includes(a.id) ? "selected" : "")
                  }
                  aria-label={"Сравнить: " + a.name}
                  aria-pressed={compare.includes(a.id)}
                  onClick={() =>
                    setCompare((prev) =>
                      prev.includes(a.id)
                        ? prev.filter((x) => x !== a.id)
                        : prev.length < 2
                          ? [...prev, a.id]
                          : [prev[1], a.id],
                    )
                  }
                >
                  {compare.includes(a.id) ? (
                    <Check size={15} />
                  ) : (
                    <Plus size={15} />
                  )}
                </button>
              </div>
              <button
                className="author-name"
                onClick={() => navigate("/author/" + a.id)}
              >
                <h2>{a.name}</h2>
                <ArrowUpRight size={20} />
              </button>
              <p>{a.role}</p>
              <Chart values={s.curve} labels={["90 дней", "Сегодня"]} />
              <div className="analyst-metrics">
                <div>
                  <strong className={s.roi >= 0 ? "positive" : "negative"}>
                    {signed(s.roi)}%
                  </strong>
                  <small>ROI · демо</small>
                </div>
                <div>
                  <strong>{s.count}</strong>
                  <small>прогнозов</small>
                </div>
                <div>
                  <strong>{s.average.toFixed(2)}</strong>
                  <small>ср. коэф.</small>
                </div>
              </div>
              <div className="analyst-bottom">
                <span>
                  от <strong>{money(a.price)}</strong> / мес.
                </span>
                <button
                  className="circle-button"
                  aria-label={"Профиль: " + a.name}
                  onClick={() => navigate("/author/" + a.id)}
                >
                  <ArrowUpRight size={19} />
                </button>
              </div>
            </article>
          );
        })}
      </div>
      <div className="method-note">
        <ShieldCheck size={20} />
        <p>
          <strong>История целиком, включая неудачи.</strong> Результаты
          рассчитаны по условной ставке 1 ед. на прогноз. Авторы и история
          вымышлены.
        </p>
        <button className="subtle" onClick={() => setModal({ type: "method" })}>
          Методика <ArrowUpRight size={15} />
        </button>
      </div>
      <AnimatePresence>
        {compare.length > 0 && (
          <motion.div
            className="compare-dock"
            initial={{ y: 80 }}
            animate={{ y: 0 }}
            exit={{ y: 80 }}
          >
            <span>Выбрано {compare.length} из 2 авторов</span>
            <button
              className="primary"
              disabled={compare.length !== 2}
              onClick={() => setModal({ type: "compare", ids: compare })}
            >
              Сравнить <ArrowRight size={16} />
            </button>
            <button
              className="icon-button"
              aria-label="Сбросить сравнение"
              onClick={() => setCompare([])}
            >
              <X size={17} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
function AuthorPage({ id }) {
  const { setModal, subscriptions, navigate, allMaterials } = useApp();
  const [period, setPeriod] = useState(90);
  const [tab, setTab] = useState("Материалы");
  const a = authors.find((a) => a.id === id);
  if (!a) return <NotFound />;
  const s = getStats(id, period);
  return (
    <>
      <Back label="К аналитикам" path="/analysts" />
      <section className="author-profile">
        <Avatar author={a} size="hero-avatar" />
        <div>
          <div className="eyebrow">
            НЕЗАВИСИМЫЙ АВТОР / {a.sport} / ДЕМОПРОФИЛЬ
          </div>
          <h1>{a.name}</h1>
          <p>{a.bio}</p>
          <span className="handle">
            {a.handle} <span>·</span> История с июня 2026
          </span>
        </div>
        <button
          className="primary"
          onClick={() =>
            subscriptions.includes(id)
              ? navigate("/library")
              : setModal({ type: "checkout", author: a })
          }
        >
          {subscriptions.includes(id)
            ? "Ваша подписка"
            : `Подписаться · ${money(a.price)}`}
          <ArrowUpRight size={16} />
        </button>
      </section>
      <div className="detail-grid author-stats">
        <section className="panel">
          <SectionHead
            title="За словами — история"
            action={
              <div className="mini-segment">
                {[30, 90, 365].map((p) => (
                  <button
                    className={period === p ? "active" : ""}
                    key={p}
                    onClick={() => setPeriod(p)}
                  >
                    {p} дн.
                  </button>
                ))}
              </div>
            }
          />
          <div className="big-metric">
            <strong className={s.roi >= 0 ? "positive" : "negative"}>
              {signed(s.roi)}
              <span>%</span>
            </strong>
            <span>
              ROI за {period} дней<small>На условной ставке 1 ед.</small>
            </span>
          </div>
          <Chart
            large
            values={s.curve}
            labels={["Начало периода", "5 октября 2026"]}
          />
          <button
            className="subtle"
            onClick={() => setModal({ type: "method" })}
          >
            Как рассчитан результат <CircleHelp size={13} />
          </button>
        </section>
        <section className="panel">
          <div className="eyebrow">ВЫБОРКА БЕЗ ИСКЛЮЧЕНИЙ</div>
          <div className="results-total">
            <strong>{s.count}</strong>
            <span>
              прогнозов
              <br />
              за период
            </span>
          </div>
          <div className="result-bar">
            <span style={{ flex: s.wins }} />
            <span style={{ flex: s.losses }} />
            <span style={{ flex: s.voids }} />
          </div>
          <div className="result-legend">
            <span>
              <i className="win-dot" />
              {s.wins} побед
            </span>
            <span>
              <i className="loss-dot" />
              {s.losses} поражений
            </span>
            <span>
              <i />
              {s.voids} возврата
            </span>
          </div>
          <div className="simple-row">
            <span>Средний коэффициент</span>
            <strong>{s.average.toFixed(2)}</strong>
          </div>
          <div className="simple-row">
            <span>Макс. просадка</span>
            <strong>{s.drawdown.toFixed(2)} ед.</strong>
          </div>
          <div className="simple-row">
            <span>Чистый результат</span>
            <strong>{signed(s.profit, 2)} ед.</strong>
          </div>
        </section>
      </div>
      <div className="tabs">
        {["Материалы", "Архив результатов"].map((t) => (
          <button
            key={t}
            className={tab === t ? "active" : ""}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === "Материалы" ? (
        <div className="material-grid">
          {allMaterials
            .filter((m) => m.authorId === id)
            .map((m) => (
              <MaterialCard material={m} key={m.id} />
            ))}
        </div>
      ) : (
        <div className="archive-table">
          <div className="archive-header">
            <span>Событие / дата</span>
            <span>Коэффициент</span>
            <span>Результат</span>
          </div>
          {s.picks.map((p) => (
            <button
              className="archive-row"
              key={p.id}
              onClick={() => setModal({ type: "result", pick: p })}
            >
              <span>
                <strong>{p.title}</strong>
                <small>
                  {p.date} · {p.market}
                </small>
              </span>
              <span>{p.odds.toFixed(2)}</span>
              <Tag
                tone={
                  p.outcome === "win"
                    ? "green"
                    : p.outcome === "loss"
                      ? "red"
                      : ""
                }
              >
                {p.outcome === "win"
                  ? "Победа"
                  : p.outcome === "loss"
                    ? "Поражение"
                    : "Возврат"}{" "}
                · {signed(p.profit, 2)}
              </Tag>
            </button>
          ))}
        </div>
      )}
    </>
  );
}
function MaterialPage({ id }) {
  const { allMaterials, navigate, purchases, subscriptions, setModal } =
    useApp();
  const m = allMaterials.find((x) => x.id === id);
  if (!m) return <NotFound />;
  const e = events.find((e) => e.id === m.eventId);
  const a = authors.find((a) => a.id === m.authorId);
  const open = canRead(m, purchases, subscriptions);
  const ctx = getMatchContext(e);
  return (
    <>
      <Back label="К событию" path={"/match/" + e.id} />
      <div className="reading-layout">
        <article className="reading-content">
          <div className="eyebrow">
            АВТОРСКИЙ РАЗБОР / {e.sport} <span>·</span>{" "}
            {open ? "ДОСТУП ОТКРЫТ" : "ПРЕВЬЮ"}
          </div>
          <h1>{m.title}</h1>
          <button
            className="byline"
            onClick={() => navigate("/author/" + a.id)}
          >
            <Avatar author={a} />
            <span>
              <strong>{a.name}</strong>
              <small>{m.published} · 6 минут чтения</small>
            </span>
            <ArrowUpRight size={17} />
          </button>
          <div className="article-lead">{m.summary}</div>
          <div className="article-match">
            <SportIcon sport={e.sport} />
            <span>
              {e.home} — {e.away}
            </span>
            <Tag>
              {e.day === "finished" ? "Завершён" : e.date + " · " + e.time}
            </Tag>
          </div>
          <h2>Что видно за результатами</h2>
          <p>
            {ctx.factors[0]} Короткая серия сама по себе не объясняет
            преимущество. Чтобы оценка была содержательной, важно посмотреть,
            против кого получены результаты и насколько условия похожи на
            сегодняшний матч.
          </p>
          {open ? (
            <motion.div {...anim}>
              <div className="access-note">
                <CheckCircle2 size={17} />{" "}
                {m.price === 0
                  ? "Бесплатный материал"
                  : subscriptions.includes(a.id)
                    ? "Входит в вашу демоподписку"
                    : "Полный разбор открыт в деморежиме"}
              </div>
              <h2>Основной сценарий</h2>
              <p>
                {m.body || ctx.factors[1]} {ctx.factors[2]} В базовом сценарии{" "}
                {e.home} получает пространство для своей игры. Однако
                преимущество не означает, что альтернативный сценарий исключён.
              </p>
              <blockquote>
                Хороший разбор объясняет не только вывод, но и то, что способно
                его изменить.
              </blockquote>
              <h2>Когда оценку стоит пересмотреть</h2>
              <p>
                {ctx.risk} Поэтому до подтверждения вводных разумно считать этот
                сценарий предварительным. Данные одной встречи не позволяют
                судить о долгосрочном качестве прогноза.
              </p>
              <div className="article-conclusion">
                <div className="eyebrow">ВЫВОД АВТОРА · ДЕМО</div>
                <h3>
                  {m.selection} · {m.market}
                </h3>
                <p>
                  Условный коэффициент на момент публикации: {e.odds.toFixed(2)}
                  . Мнение зафиксировано до события; текстовые дополнения
                  сохраняются отдельно.
                </p>
              </div>
              <h2>Источники и обновления</h2>
              <p>
                {m.sources ||
                  "Связанный демонстрационный набор Ракурса: форма команд, игровые показатели и условная история линии."}{" "}
                Последнее обновление: {SNAPSHOT}. Версия материала 1.0.
              </p>
              <button
                className="secondary"
                onClick={() => setModal({ type: "sources", event: e })}
              >
                Открыть данные разбора <ExternalLink size={15} />
              </button>
            </motion.div>
          ) : (
            <div className="paywall-preview">
              <div className="preview-lines" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
              <LockKeyhole size={23} />
              <h2>Вся картина — в полном разборе.</h2>
              <p>
                Сценарии, аргументы и факторы риска.
                <br />
                Понятно, за что вы платите.
              </p>
              {e.day === "finished" ? (
                <Tag>Продажа предматчевого разбора закрыта</Tag>
              ) : (
                <button
                  className="primary"
                  onClick={() => setModal({ type: "checkout", material: m })}
                >
                  Открыть за {money(m.price)} <ArrowUpRight size={17} />
                </button>
              )}
              <small>Демонстрация покупки · Без списания денег</small>
            </div>
          )}
        </article>
        <aside className="reading-aside">
          <section className="panel">
            <Tag tone="coral">{open ? "В ВАШЕЙ БИБЛИОТЕКЕ" : "ЧТО ВНУТРИ"}</Tag>
            <h3>Больше, чем один вывод.</h3>
            {[
              "Подробная аргументация",
              "Основной и альтернативный сценарий",
              "Условия пересмотра оценки",
              "Обновления до начала матча",
            ].map((t) => (
              <div className="check-row" key={t}>
                <Check size={16} />
                {t}
              </div>
            ))}
            <hr />
            <button
              className="text-arrow"
              onClick={() => navigate("/author/" + a.id)}
            >
              Проверить историю автора <ArrowUpRight size={15} />
            </button>
          </section>
          <p className="fine-print">
            Материал и результат вымышлены. Покупка демонстрирует открытие
            доступа и не является оплатой реальной услуги.
          </p>
        </aside>
      </div>
    </>
  );
}
function Library() {
  const {
    allMaterials,
    purchases,
    subscriptions,
    navigate,
    setSubscriptions,
    notify,
  } = useApp();
  const [tab, setTab] = useState("Разборы");
  const reads = allMaterials.filter(
    (m) => purchases.includes(m.id) || subscriptions.includes(m.authorId),
  );
  return (
    <>
      <div className="page-intro">
        <div>
          <div className="eyebrow">ВАШЕ ЛИЧНОЕ ПРОСТРАНСТВО</div>
          <h1>
            Всё важное <em>рядом.</em>
          </h1>
        </div>
        <Bookmark size={34} strokeWidth={1} />
      </div>
      <div className="library-summary">
        <div>
          <strong>{reads.length.toString().padStart(2, "0")}</strong>
          <span>открытых материалов</span>
        </div>
        <div>
          <strong>{subscriptions.length.toString().padStart(2, "0")}</strong>
          <span>подписок на авторов</span>
        </div>
        <p>
          Ваши материалы и избранное
          <br />
          сохраняются в этом браузере.
        </p>
      </div>
      <div className="tabs">
        {["Разборы", "Подписки", "Избранное"].map((t) => (
          <button
            key={t}
            className={tab === t ? "active" : ""}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === "Разборы" ? (
        reads.length ? (
          <div className="material-grid">
            {reads.map((m) => (
              <MaterialCard key={m.id} material={m} />
            ))}
          </div>
        ) : (
          <Empty
            title="Ваша коллекция начинается здесь"
            text="Откройте первый разбор в деморежиме — и он появится в этой библиотеке."
            action={
              <button className="primary" onClick={() => navigate("/")}>
                Найти интересный матч <ArrowRight size={16} />
              </button>
            }
          />
        )
      ) : tab === "Избранное" ? (
        <EventList onlyFavorites />
      ) : subscriptions.length ? (
        <div className="subscription-list">
          {subscriptions.map((id) => {
            const a = authors.find((a) => a.id === id);
            return (
              <div className="subscription-card" key={id}>
                <Avatar author={a} />
                <span>
                  <strong>{a.name}</strong>
                  <small>Демоподписка · {money(a.price)} / месяц</small>
                </span>
                <button
                  className="subtle"
                  onClick={() => navigate("/author/" + id)}
                >
                  Материалы <ArrowUpRight size={15} />
                </button>
                <button
                  className="icon-button"
                  aria-label={"Отключить демоподписку: " + a.name}
                  onClick={() => {
                    setSubscriptions((prev) => prev.filter((x) => x !== id));
                    notify(
                      "Демоподписка отключена. Отдельные покупки сохранены.",
                    );
                  }}
                >
                  <Trash2 size={17} />
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <Empty
          title="Найдите свой взгляд на игру"
          text="Подписка открывает материалы одного автора. Все действия в демо бесплатны."
          action={
            <button className="primary" onClick={() => navigate("/analysts")}>
              Выбрать аналитика <ArrowRight size={16} />
            </button>
          }
        />
      )}
    </>
  );
}
function Studio() {
  const { setPublications, publications, notify, setModal, navigate } =
    useApp();
  const empty = {
    eventId: "fox-metro",
    title: "",
    market: "Победа в серии",
    selection: "",
    summary: "",
    body: "",
    sources: "",
    access: "paid",
    price: 490,
  };
  const [draft, setDraft] = useStored("draft", empty);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(false);
  const e = events.find((e) => e.id === draft.eventId) || events[0];
  const change = (key, value) => {
    setDraft((p) => ({ ...p, [key]: value }));
    setPreview(false);
  };
  function validate() {
    if (
      !draft.title.trim() ||
      !draft.summary.trim() ||
      !draft.body.trim() ||
      !draft.sources.trim() ||
      !draft.selection.trim()
    ) {
      setError("Заполните название, вывод, превью, аргументы и источники.");
      return false;
    }
    if (
      draft.access === "paid" &&
      (!Number.isFinite(Number(draft.price)) || Number(draft.price) < 1)
    ) {
      setError("Укажите положительную цену.");
      return false;
    }
    setError("");
    return true;
  }
  function publish() {
    if (!validate()) return;
    const id = "local-" + Date.now();
    setPublications((p) => [
      {
        ...draft,
        id,
        authorId: e.sport === "CS2" ? "mark" : "anna",
        price: draft.access === "free" ? 0 : Number(draft.price),
        published: "5 октября · только что",
      },
      ...p,
    ]);
    setDraft(empty);
    notify("Разбор опубликован в локальном демокаталоге");
    navigate("/read/" + id);
  }
  return (
    <>
      <div className="page-intro">
        <div>
          <div className="eyebrow">СТУДИЯ АВТОРА / ДЕМОРЕЖИМ</div>
          <h1>
            Ваш взгляд. <em>Ваш голос.</em>
          </h1>
        </div>
        <Tag>
          <PenLine size={13} /> Новый разбор
        </Tag>
      </div>
      <p className="page-description">
        От аргумента — к материалу. Черновик автоматически сохраняется в этом
        браузере.
      </p>
      <div className="studio-layout">
        <form
          className="panel studio-form"
          onSubmit={(ev) => {
            ev.preventDefault();
            if (validate()) setPreview(true);
          }}
        >
          <div className="form-grid">
            <label>
              Событие
              <select
                aria-label="Событие"
                value={draft.eventId}
                onChange={(ev) => {
                  const event = events.find((x) => x.id === ev.target.value);
                  setDraft((p) => ({
                    ...p,
                    eventId: event.id,
                    market:
                      event.sport === "CS2"
                        ? "Победа в серии"
                        : "Победа в матче",
                  }));
                  setPreview(false);
                }}
              >
                {events
                  .filter((e) => e.day !== "finished")
                  .map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.home} — {e.away}
                    </option>
                  ))}
              </select>
            </label>
            <label>
              Рынок
              <select
                aria-label="Рынок"
                value={draft.market}
                onChange={(ev) => change("market", ev.target.value)}
              >
                <option>
                  {e.sport === "CS2" ? "Победа в серии" : "Победа в матче"}
                </option>
                {(e.sport === "CS2"
                  ? ["Тотал карт больше 2,5", "Победа на первой карте"]
                  : ["Тотал больше 2,5", "Обе команды забьют"]
                ).map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </label>
          </div>
          <label>
            Название материала
            <input
              maxLength={100}
              value={draft.title}
              onChange={(ev) => change("title", ev.target.value)}
              placeholder="Что в этом матче не так очевидно?"
            />
          </label>
          <label>
            Вывод / выбранный исход
            <input
              maxLength={100}
              value={draft.selection}
              onChange={(ev) => change("selection", ev.target.value)}
              placeholder="Например: Northern Foxes"
            />
          </label>
          <label>
            Открытое превью
            <textarea
              rows={3}
              maxLength={500}
              value={draft.summary}
              onChange={(ev) => change("summary", ev.target.value)}
              placeholder="Объясните, что читатель получит из разбора"
            />
          </label>
          <label>
            Аргументы и альтернативный сценарий
            <textarea
              rows={6}
              maxLength={6000}
              value={draft.body}
              onChange={(ev) => change("body", ev.target.value)}
              placeholder="Какие данные поддерживают вывод? Что способно изменить оценку?"
            />
          </label>
          <label>
            Источники
            <textarea
              rows={2}
              value={draft.sources}
              maxLength={1000}
              onChange={(ev) => change("sources", ev.target.value)}
              placeholder="Название источника, время снимка, ограничения"
            />
          </label>
          <div className="form-grid">
            <label>
              Доступ
              <select
                aria-label="Доступ"
                value={draft.access}
                onChange={(ev) => change("access", ev.target.value)}
              >
                <option value="paid">Платный разбор</option>
                <option value="free">Бесплатный разбор</option>
              </select>
            </label>
            {draft.access === "paid" && (
              <label>
                Демонстрационная цена, ₽
                <input
                  type="number"
                  min="1"
                  max="99999"
                  value={draft.price}
                  onChange={(ev) => change("price", ev.target.value)}
                />
              </label>
            )}
          </div>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <button className="primary" type="submit">
            Предпросмотр <ArrowRight size={16} />
          </button>
        </form>
        <aside>
          <section className="panel studio-guide">
            <span className="orbit-mini">✳</span>
            <h2>
              Доверие начинается
              <br />
              <em>с деталей.</em>
            </h2>
            {[
              "Объясните, почему вы так считаете.",
              "Укажите, что может изменить оценку.",
              "Добавьте источник и время данных.",
              "Сохраните исходный вывод после публикации.",
            ].map((t, i) => (
              <div className="guide-row" key={t}>
                <span>0{i + 1}</span>
                <p>{t}</p>
              </div>
            ))}
            <p className="fine-print">
              Публикация появится только в этом демо на вашем устройстве.
              Сообщения в Telegram не отправляются.
            </p>
          </section>
          {publications.length > 0 && (
            <section className="panel">
              <h3>Ваши публикации · {publications.length}</h3>
              {publications.map((p) => (
                <button
                  key={p.id}
                  className="published-link"
                  onClick={() => navigate("/read/" + p.id)}
                >
                  {p.title}
                  <ArrowUpRight size={15} />
                </button>
              ))}
            </section>
          )}
        </aside>
      </div>
      {preview && (
        <Modal
          title="Предпросмотр публикации"
          onClose={() => setPreview(false)}
        >
          <Tag>
            {draft.access === "paid" ? money(Number(draft.price)) : "Бесплатно"}
          </Tag>
          <h2 className="preview-title">{draft.title}</h2>
          <p className="modal-copy">{draft.summary}</p>
          <div className="preview-body">{draft.body}</div>
          <p className="fine-print">Источник: {draft.sources}</p>
          <button className="primary full" onClick={publish}>
            Опубликовать в демо <Check size={17} />
          </button>
        </Modal>
      )}
    </>
  );
}
function NotFound() {
  const { navigate } = useApp();
  return (
    <Empty
      title="Материал не найден"
      text="Откройте событие из демонстрационного каталога."
      action={
        <button className="primary" onClick={() => navigate("/")}>
          К событиям
        </button>
      }
    />
  );
}

function GlobalModal({ modal, close }) {
  const {
    navigate,
    setModal,
    purchases,
    setPurchases,
    subscriptions,
    setSubscriptions,
    notify,
  } = useApp();
  if (modal.type === "ai") return <AIModal event={modal.event} close={close} />;
  if (modal.type === "checkout")
    return <Checkout modal={modal} close={close} />;
  if (modal.type === "compare")
    return (
      <Modal title="Два взгляда на игру" onClose={close} wide>
        <p className="modal-copy">
          Одинаковый период, одинаковая условная ставка. Демонстрационные
          результаты за 90 дней.
        </p>
        <div className="compare-profiles">
          {modal.ids.map((id) => {
            const a = authors.find((a) => a.id === id);
            const s = getStats(id);
            return (
              <div key={id}>
                <Avatar author={a} size="large" />
                <h3>{a.name}</h3>
                <Tag>{a.sport}</Tag>
                <p>{a.role}</p>
                <div className="simple-row">
                  <span>ROI</span>
                  <strong>{signed(s.roi)}%</strong>
                </div>
                <div className="simple-row">
                  <span>Прогнозов</span>
                  <strong>{s.count}</strong>
                </div>
                <div className="simple-row">
                  <span>Поражений</span>
                  <strong>{s.losses}</strong>
                </div>
                <div className="simple-row">
                  <span>Просадка</span>
                  <strong>{s.drawdown.toFixed(2)} ед.</strong>
                </div>
                <div className="simple-row">
                  <span>Подписка</span>
                  <strong>{money(a.price)}</strong>
                </div>
                <button
                  className="secondary full"
                  onClick={() => {
                    close();
                    navigate("/author/" + id);
                  }}
                >
                  Профиль <ArrowUpRight size={15} />
                </button>
              </div>
            );
          })}
        </div>
        <p className="fine-print">
          Разные дисциплины не следует сравнивать только по ROI. Обратите
          внимание на подход и размер выборки.
        </p>
      </Modal>
    );
  if (modal.type === "method")
    return (
      <Modal title="Прозрачная история" onClose={close}>
        <Tag>МЕТОДИКА ДЕМО</Tag>
        <p className="modal-copy">
          Все авторы, события и результаты вымышлены. Графики и показатели
          рассчитываются из одной истории, включая поражения и возвраты.
        </p>
        <div className="formula">
          ROI = чистый результат / сумма условных ставок × 100%
        </div>
        <div className="check-row">
          <Check size={16} /> 1 условная единица на каждый прогноз
        </div>
        <div className="check-row">
          <Check size={16} /> Победа: коэффициент − 1; поражение: −1
        </div>
        <div className="check-row">
          <Check size={16} /> Возврат: 0; ставка учитывается в знаменателе
        </div>
        <div className="check-row">
          <Check size={16} /> Стоимость подписки в расчёт не включена
        </div>
        <p className="fine-print">
          Просадка — максимальное падение накопленного результата от предыдущего
          пика. Короткая выборка и процент побед не доказывают качество
          аналитика.
        </p>
      </Modal>
    );
  if (modal.type === "sources")
    return (
      <Modal title="Откуда эти данные" onClose={close}>
        <Tag>ДЕМОНСТРАЦИОННЫЙ СНИМОК</Tag>
        <p className="modal-copy">
          {modal.event ? `${modal.event.home} — ${modal.event.away}. ` : ""}Это
          связанный локальный набор для демонстрации интерфейса. Внешние
          спортивные API не подключены.
        </p>
        <div className="simple-row">
          <span>Снимок</span>
          <strong>{SNAPSHOT}</strong>
        </div>
        <div className="simple-row">
          <span>Источник</span>
          <strong>Сценарий Ракурса v1</strong>
        </div>
        <div className="simple-row">
          <span>Линия</span>
          <strong>Условные коэффициенты</strong>
        </div>
        <p className="modal-copy">
          График показывает пример изменения коэффициента выбранной команды.
          Числа не описывают реальный рынок. ИИ объясняет этот же набор готовыми
          текстами.
        </p>
      </Modal>
    );
  if (modal.type === "result") {
    const p = modal.pick;
    return (
      <Modal title="Запись в истории" onClose={close}>
        <Tag
          tone={
            p.outcome === "win" ? "green" : p.outcome === "loss" ? "red" : ""
          }
        >
          {p.outcome === "win"
            ? "Победа"
            : p.outcome === "loss"
              ? "Поражение"
              : "Возврат"}{" "}
          · демо
        </Tag>
        <h3 className="preview-title">{p.title}</h3>
        <div className="simple-row">
          <span>Рынок</span>
          <strong>{p.market}</strong>
        </div>
        <div className="simple-row">
          <span>Коэффициент</span>
          <strong>{p.odds.toFixed(2)}</strong>
        </div>
        <div className="simple-row">
          <span>Условная ставка</span>
          <strong>1 ед.</strong>
        </div>
        <div className="simple-row">
          <span>Результат</span>
          <strong>{signed(p.profit, 2)} ед.</strong>
        </div>
        <p className="fine-print">
          Вымышленная архивная запись от {p.date}.{" "}
          {p.outcome === "void"
            ? "Пример возврата при отменённом событии."
            : "Результат рассчитан по правилам демонабора."}{" "}
          Исходная запись сохранена.
        </p>
      </Modal>
    );
  }
  if (modal.type === "notifications")
    return (
      <Modal title="Важное, без шума" onClose={close}>
        <div className="notification-item">
          <Sparkles size={19} />
          <div>
            <strong>Добро пожаловать в Ракурс</strong>
            <p>
              Начните с матча Northern Foxes — Metro Five: у него есть
              статистика, сводка и авторский разбор.
            </p>
            <button
              className="subtle"
              onClick={() => {
                close();
                navigate("/match/fox-metro");
              }}
            >
              Открыть событие <ArrowRight size={15} />
            </button>
          </div>
        </div>
        <div className="notification-item">
          <BookOpen size={19} />
          <div>
            <strong>В вашей библиотеке: {purchases.length} покупок</strong>
            <p>
              Открытые в деморежиме материалы сохраняются после перезагрузки.
            </p>
            <button
              className="subtle"
              onClick={() => {
                close();
                navigate("/library");
              }}
            >
              К материалам <ArrowRight size={15} />
            </button>
          </div>
        </div>
        <p className="fine-print">
          Это локальный центр уведомлений. Push и рассылки не подключены.
        </p>
      </Modal>
    );
  return (
    <Modal title="Видеть больше. Понимать глубже." onClose={close}>
      <Logo />
      <p className="modal-copy">
        Ракурс объединяет контекст матча, открытые истории аналитиков и
        авторские разборы — в одном пространстве.
      </p>
      <div className="about-steps">
        {[
          "Найдите интересное событие",
          "Изучите данные и разные мнения",
          "Проверьте историю автора",
          "Откройте разбор без списания денег",
        ].map((t, i) => (
          <div key={t}>
            <span>0{i + 1}</span>
            {t}
          </div>
        ))}
      </div>
      <div className="risk-note">
        <Info size={18} />
        <span>
          <strong>Вы смотрите демоверсию</strong>Команды, авторы, платежи и
          ответы ИИ демонстрационные. Действия сохраняются только в вашем
          браузере.
        </span>
      </div>
      <button
        className="primary full"
        onClick={() => {
          close();
          navigate("/match/fox-metro");
        }}
      >
        Начать знакомство <ArrowRight size={17} />
      </button>
    </Modal>
  );
}
function Checkout({ modal, close }) {
  const {
    setPurchases,
    setSubscriptions,
    navigate,
    notify,
    purchases,
    subscriptions,
  } = useApp();
  const [done, setDone] = useState(false);
  const a =
    modal.author || authors.find((a) => a.id === modal.material.authorId);
  const m = modal.material;
  const e = m ? events.find((e) => e.id === m.eventId) : null;
  const already = m
    ? canRead(m, purchases, subscriptions)
    : subscriptions.includes(a.id);
  const price = m ? m.price : a.price;
  function unlock() {
    if (e?.day === "finished") return;
    if (m) setPurchases((p) => (p.includes(m.id) ? p : [...p, m.id]));
    else setSubscriptions((p) => (p.includes(a.id) ? p : [...p, a.id]));
    setDone(true);
    haptic();
  }
  return (
    <Modal
      title={done ? "Новый взгляд открыт." : "Открыть больше контекста"}
      onClose={close}
    >
      {done ? (
        <div className="checkout-success">
          <span>
            <CheckCheck size={34} />
          </span>
          <h2>{m ? "Разбор теперь ваш." : "Вы подписаны на автора."}</h2>
          <p>Деньги не списывались. Доступ сохранён в вашей демобиблиотеке.</p>
          <button
            className="primary full"
            onClick={() => {
              close();
              navigate(m ? "/read/" + m.id : "/author/" + a.id);
            }}
          >
            {m ? "Читать полный разбор" : "К материалам автора"}{" "}
            <ArrowRight size={17} />
          </button>
        </div>
      ) : (
        <>
          <Tag tone="coral">ДЕМОНСТРАЦИЯ ПОКУПКИ</Tag>
          <div className="checkout-author">
            <Avatar author={a} />
            <span>
              <strong>{a.name}</strong>
              <small>
                {m ? "Один авторский разбор" : "Подписка на одного автора"}
              </small>
            </span>
          </div>
          <h3>{m ? m.title : "Все материалы автора"}</h3>
          <p className="modal-copy">
            {m
              ? "Полный текст и обновления этого разбора до начала матча."
              : "Доступ ко всем демоматериалам автора. Подписку можно отключить в библиотеке."}
          </p>
          <div className="checkout-price">
            <span>{m ? "Разовый доступ" : "Подписка / месяц"}</span>
            <strong>{money(price)}</strong>
          </div>
          <div className="checkout-price actual">
            <span>К списанию в демо</span>
            <strong>0 ₽</strong>
          </div>
          <div className="safe-payment">
            <ShieldCheck size={17} /> Без карты, платёжных данных и автосписаний
          </div>
          <button
            className="primary full"
            onClick={unlock}
            disabled={already || e?.day === "finished"}
          >
            {already
              ? "Доступ уже открыт"
              : e?.day === "finished"
                ? "Продажа закрыта"
                : "Открыть бесплатно в демо"}{" "}
            <ArrowRight size={17} />
          </button>
          <p className="fine-print center">
            Цена иллюстрирует будущую модель продажи.
            <br />
            Покупка реальной услуги не совершается.
          </p>
        </>
      )}
    </Modal>
  );
}
function AIModal({ event: e, close }) {
  const { setModal } = useApp();
  const [question, setQuestion] = useState("Что важно знать перед матчем?");
  const [custom, setCustom] = useState("");
  const ctx = getMatchContext(e);
  const questions = [
    "Что важно знать перед матчем?",
    "Что может изменить оценку?",
    "В чём расходятся аналитики?",
  ];
  return (
    <Modal title="Ракурс AI" onClose={close}>
      <div className="ai-context">
        <SportIcon sport={e.sport} />
        {e.home} — {e.away}
      </div>
      <Tag>ПОДГОТОВЛЕННЫЙ ПРИМЕР · НЕ LIVE-МОДЕЛЬ</Tag>
      <div className="ai-questions">
        {questions.map((q) => (
          <button
            className={question === q ? "active" : ""}
            key={q}
            onClick={() => setQuestion(q)}
          >
            {q}
            <ArrowUpRight size={13} />
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div className="ai-answer" key={question} {...anim}>
          <div className="ai-answer-icon">✳</div>
          <h3>{question}</h3>
          {question === questions[0] ? (
            <>
              {ctx.factors.map((f, i) => (
                <p key={f}>
                  <strong>0{i + 1}.</strong> {f}
                </p>
              ))}
              <div className="risk-note">
                <Info size={16} />
                <span>{ctx.risk}</span>
              </div>
            </>
          ) : question === questions[1] ? (
            <p>
              {ctx.risk} Демо не получает обновления в реальном времени. Оценку
              нужно пересмотреть после появления новых данных.
            </p>
          ) : question === questions[2] ? (
            <p>{ctx.disagreement}</p>
          ) : (
            <p>
              Свободный диалог в этой версии не подключён. Для «{question}» нет
              отдельного подготовленного ответа. Используйте вопросы выше: они
              опираются на демонстрационные данные этого матча.
            </p>
          )}
          <button
            className="source-chip"
            onClick={() => setModal({ type: "sources", event: e })}
          >
            <BookOpen size={13} /> Демонабор · 05.10, 14:30{" "}
            <ArrowUpRight size={12} />
          </button>
        </motion.div>
      </AnimatePresence>
      <form
        className="ai-input"
        onSubmit={(ev) => {
          ev.preventDefault();
          if (custom.trim()) {
            setQuestion(custom.trim());
            setCustom("");
          }
        }}
      >
        <input
          aria-label="Ваш вопрос о матче"
          value={custom}
          onChange={(ev) => setCustom(ev.target.value)}
          placeholder="Задать свой вопрос"
          maxLength={200}
        />
        <button aria-label="Задать вопрос" disabled={!custom.trim()}>
          <ArrowUpRight size={18} />
        </button>
      </form>
    </Modal>
  );
}
