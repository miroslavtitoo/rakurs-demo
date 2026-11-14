import React, { useState, useEffect, useRef } from "react";
import { motion, useReducedMotion } from "motion/react";
import { flushSync } from "react-dom";
import { useStoryGestures } from "./storyGestures.js";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Bell,
  Check,
  ChevronRight,
  Heart,
  LayoutGrid,
  MessageCircle,
  Search,
  SlidersHorizontal,
  X,
  Settings,
  Plus,
  CreditCard,
  Send,
  Bookmark,
  Trophy,
  CircleHelp,
  Pencil,
  LogOut,
  Play,
  Pause,
} from "lucide-react";
import { Modal, useSaved } from "./AssistantUI.jsx";
import { fixtures, SPORTS } from "./assistantData.js";
import TeamMark from "./TeamMark.jsx";
import StoryArt from "./StoryArt.jsx";
import EventSlider from "./EventSlider.jsx";
import { StoryRail, CoinButton } from "./RewardsUI.jsx";
import { ProfileBenefits } from "./BenefitsUI.jsx";
import { assistantText, operationLabel } from "./presentation.js";
export const SPORT_EMOJI = { "Футбол": "⚽", "Киберспорт": "🎮", "Теннис": "🎾", "Баскетбол": "🏀", "Хоккей": "🏒" };
const img = (n) => `./images/diverge/${n}.webp`;
export function DivergeLogo({ onClick }) {
  const Tag = onClick ? "button" : "span";
  return (
    <Tag
      className="diverge-logo"
      onClick={onClick}
      aria-label={onClick ? "Diverge — главная" : undefined}
    >
      <img src="./images/diverge/logo.svg" alt="DIVERGE" />
    </Tag>
  );
}
const slides = [
  [
    "Найдите\nсобытие",
    "Футбол, киберспорт, теннис, баскетбол и хоккей. Ближайшие матчи, текущий счёт и завершённые встречи — в одной ленте.",
  ],
  [
    "Откройте\nанализ",
    "Получите доступ к анализу матча: вероятности исходов, аргументы и подробное объяснение каждого фактора.",
  ],
  [
    "Оцените\nшансы",
    "Форма, личные встречи, составы и подготовка. Нажмите на фактор — увидите данные и его вклад в итоговую оценку.",
  ],
  [
    "Обсудите\nматч с AI",
    "Задайте вопрос или добавьте свою гипотезу. Разберите аргументы вместе с AI. ",
  ],
];
export function PdfStories({ close }) {
  const [step, S] = useState(0),
    [pause, P] = useState(false),
    [held, H] = useState(false),
    [progress, Q] = useState(0),
    [maxVisited, MV] = useState(0);
  const reduced = useReducedMotion(), elapsed = useRef(0);
  const change = (direction) => {
    if (direction > 0 && step === 3) close();
    else S(Math.max(0, Math.min(3, step + direction)));
  };
  useEffect(() => {
    elapsed.current = 0;
    Q(0);
    MV((n) => Math.max(n, step));
  }, [step]);
  useEffect(() => {
    if (reduced || pause || held || step === 3) return;
    let last = performance.now();
    const timer = setInterval(() => {
      const now = performance.now();
      if (!document.hidden) elapsed.current += Math.min(now - last, 200);
      last = now;
      Q(elapsed.current / 8000);
      if (elapsed.current >= 8000) S((s) => Math.min(3, s + 1));
    }, 80);
    return () => clearInterval(timer);
  }, [step, pause, held, reduced]);
  useEffect(() => {
    const key = (e) => {
      if (e.key === "ArrowRight") change(1);
      if (e.key === "ArrowLeft") change(-1);
    };
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, [step, close]);
  const reveal = (delay, y = 18) => ({
    initial: reduced ? false : { opacity: 0, y },
    animate: { opacity: 1, y: 0 },
    transition: {
      duration: reduced ? 0 : 0.58,
      delay: reduced ? 0 : delay,
      ease: [0.22, 1, 0.36, 1],
    },
  });
  const gestures = useStoryGestures(change, H);
  return (
    <Modal
      title="Знакомство с Diverge"
      close={close}
      kind="pdf-stories dark-modal"
      dismissible={false}
    >
      <div
        className="pdf-story animated-story"
        data-step={step}
        {...gestures}
      >
        <DivergeLogo onClick={() => S(0)} />
        <div className="pdf-progress">
          {slides.map((_, i) => (
            <button
              key={i}
              aria-label={`Сторис ${i + 1} из 4`}
              aria-current={i === step ? "step" : undefined}
              onClick={() => S(i)}
              disabled={i > maxVisited}
            >
              <i
                style={{
                  width: `${i < step ? 100 : i === step ? (reduced || step === 3 ? 100 : progress * 100) : 0}%`,
                }}
              />
            </button>
          ))}
        </div>
        <button
          className="story-pause m-icon"
          aria-label={pause ? "Продолжить сторис" : "Пауза сторис"}
          onClick={() => P(!pause)}
        >
          {pause ? <Play size={15} /> : <Pause size={15} />}
        </button>
        <div className="pdf-story-art">
          <StoryArt step={step} paused={pause || held} key={step} />
        </div>
        <div className="pdf-story-copy" key={"copy-" + step}>
          <motion.h1 {...reveal(0.88, 25)}>{slides[step][0]}</motion.h1>
          <motion.p {...reveal(1.08, 16)}>{slides[step][1]}</motion.p>
        </div>
        <motion.div
          className="pdf-story-actions"
          key={"actions-" + step}
          {...reveal(1.32, 12)}
        >
          <button className="m-button" onClick={() => change(1)}>
            Далее <ArrowRight size={17} />
          </button>
        </motion.div>
      </div>
    </Modal>
  );
}
export function AuthScreen({ app }) {
  return (
    <Modal title="Вход в Diverge" close={() => {}} dismissible={false} kind="auth-modal dark-modal">
      <div className="auth-screen telegram-only-entry">
        <DivergeLogo />
        <div className="auth-intro">
          <img className="huge-symbol" src="./images/diverge/mark.svg" alt="" />
          <h1 className="diverge-word">DIVERGE</h1>
          <p>
            ИИ-помощник для анализа матчей,<br />
            статистики игроков и интеллектуальных<br />
            сравнений — всё в одном месте.
          </p>
        </div>
        <div className="auth-bottom">
          <button className="m-button telegram-login" onClick={app.loginTelegram}>
            <Send size={19} />Войти через Telegram
          </button>
          <div className="auth-legal-links">
            <a href="#/privacy" onClick={(e) => { e.preventDefault(); app.openLegal("privacy"); }}>Политика конфиденциальности</a>
            <a href="#/terms" onClick={(e) => { e.preventDefault(); app.openLegal("terms"); }}>Пользовательское соглашение</a>
          </div>
          {app.authHint && <p className="telegram-entry-hint" role="status">{app.authHint}</p>}
        </div>
        <small className="auth-demo">18+</small>
      </div>
    </Modal>
  );
}
export function PdfNav({ route, go, bottom = false }) {
  return (
    <nav
      className={bottom ? "bottom-nav" : "m-nav"}
      aria-label={bottom ? "Мобильная навигация" : "Навигация"}
    >
      {[
        ["/", "Главная", LayoutGrid],
        ["/subscription", "Подписки", Heart],
        ["/chat", "Чат", MessageCircle],
      ].map(([p, l, I]) => (
        <button
          key={p}
          aria-current={
            route === p || (p === "/" && route.startsWith("/match/"))
              ? "page"
              : undefined
          }
          onClick={() => go(p)}
        >
          <I size={21} />
          <span>{l}</span>
        </button>
      ))}
    </nav>
  );
}
export function PdfEventCard({ event: e, app }) {
  const access = app.access(e.id);
  const reduced = useReducedMotion();
  return (
    <motion.article
      className="pdf-event event-card"
      initial={reduced ? false : { opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: reduced ? 0 : 0.3 }}
      viewport={{ once: true }}
    >
      <div className="pdf-event-top">
        <span>
          <span className="sport-emoji" aria-hidden="true">{SPORT_EMOJI[e.sport]}</span> {e.league}
        </span>
        <button
          aria-label={`Сохранить: ${e.id}`}
          aria-pressed={app.favorites.includes(e.id)}
          onClick={() => app.save(e.id)}
        >
          <Bookmark
            size={15}
            fill={app.favorites.includes(e.id) ? "currentColor" : "none"}
          />
        </button>
        <b>
          {e.status === "live"
            ? "LIVE "
            : e.status === "past"
              ? "ЗАВЕРШЁН"
              : "PRE-MATCH"}
        </b>
      </div>
      <button
        className="pdf-event-teams"
        onClick={() => app.go("/match/" + e.id)}
        aria-label={`Открыть событие: ${e.home} — ${e.away}`}
      >
        <span>
          <TeamMark code={e.homeCode} />
          <span>{e.home}</span>
        </span>
        <span className="pdf-event-time">
          {e.score ? (
            <>
              <strong>{e.score}</strong>
              <small>{e.status === "live" ? e.period : "Завершён"}</small>
            </>
          ) : (
            <>
              {" "}
              {e.date}
              <br />
              {e.time}
            </>
          )}
        </span>
        <span>
          <TeamMark code={e.awayCode} />
          <span>{e.away}</span>
        </span>
      </button>
      <div className="pdf-event-bottom">
        <span className="pdf-locked">
          {access || app.outcomeAccess(e.id) ? <>
            <strong>{e.probabilities[0]}%</strong>
            <small>Шанс победы: {e.home}</small>
            <span className="card-forecast-time">Оценка до матча</span>
          </> : <><strong className="locked-card-title">Прогноз на матч</strong><small>Статистика и факторы</small></>}
        </span>
        <button className="m-button" onClick={() => app.go("/match/" + e.id)}>
          {access ? "Открыть" : "Прогноз"} <ArrowUpRight size={13} />
        </button>
      </div>
    </motion.article>
  );
}
export function PdfCatalog({
  app,
  library = false,
  initialStatus = "all",
  searchPage = false,
}) {
  const [sport, S] = useState("Все"),
    [status, T] = useState(initialStatus),
    [query, Q] = useState(""),
    [filters, F] = useState({ date: "Все", prob: 0, odds: 1.1 }),
    [sheet, H] = useState(null),
    [saved, B] = useState(false),
    [searchOpen, setSearchOpen] = useState(searchPage);
  const searchInput = useRef(null);
  const list = fixtures.filter(
    (e) =>
      (sport === "Все" || e.sport === sport) &&
      (status === "all" || e.status === status) &&
      (!library || (saved ? app.favorites.includes(e.id) : app.access(e.id))) &&
      `${e.home} ${e.away} ${e.league}`
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (filters.date === "Все" || filters.date === "Сегодня"
        ? filters.date === "Все" || e.date.startsWith("8 ")
        : filters.date === "Завтра"
          ? e.date.startsWith("9 ")
          : parseInt(e.date) <= (filters.date === "Ближайшие 3 дня" ? 10 : 14)),
  );
  const changed = filters.prob > 0 || filters.odds > 1.1;
  // Outcome filters cannot reveal paid predictions to a guest.
  const visible = changed
    ? list.filter(
        (e) =>
          (app.access(e.id) || app.outcomeAccess(e.id)) &&
          e.probabilities[0] >= filters.prob &&
          Number((100 / e.probabilities[0]).toFixed(2)) >= filters.odds,
      )
    : list;
  const section = (title, rows, rail = false) => (
    <section className="pdf-match-section">
      <div className="pdf-section-head">
        <h2>{title}</h2>
        {rail && (
          <button
            onClick={() => T(title === "Live" ? "live" : "upcoming")}
          >
            Смотреть все
          </button>
        )}
      </div>
      {rail ? (
        <EventSlider label={title}>
          {rows.map((e) => (
            <PdfEventCard key={e.id} event={e} app={app} />
          ))}
        </EventSlider>
      ) : (
        <div className="pdf-event-grid">
          {rows.map((e) => (
            <PdfEventCard key={e.id} event={e} app={app} />
          ))}
        </div>
      )}
    </section>
  );
  return (
    <>
      {!library && !searchPage && <StoryRail app={app} />}
      {library && (
        <div className="page-heading">
          <h1>Мои прогнозы</h1>
          <p>Купленные и сохранённые события</p>
          <div className="m-tabs">
            <button aria-pressed={!saved} onClick={() => B(false)}>
              Доступные
            </button>
            <button aria-pressed={saved} onClick={() => B(true)}>
              Избранное
            </button>
          </div>
        </div>
      )}
      {searchPage && (
        <div className="page-heading">
          <h1>Найдите свой матч</h1>
        </div>
      )}
      <div className="inline-search-shell" data-open={searchOpen || searchPage || !!query}>
        <label className="m-search catalog-search">
          <Search size={18} />
          <input
            aria-label="Поиск события"
            ref={searchInput}
            tabIndex={searchOpen || searchPage || query ? 0 : -1}
            placeholder="Команда, игрок или турнир"
            type="search"
            enterKeyHint="search"
            autoComplete="off"
            onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
            value={query}
            onChange={(e) => Q(e.target.value)}
          />
          <button aria-label={query ? "Очистить поиск" : "Закрыть поиск"} onClick={() => {
            if (query) Q("");
            else if (searchPage) app.go("/");
            else setSearchOpen(false);
          }}><X size={16} /></button>
        </label>
      </div>
      <div className="pdf-filterbar">
        <div className="sports-rail" aria-label="Вид спорта">
          {SPORTS.map((s) => (
            <button key={s} aria-pressed={s === sport} onClick={() => S(s)}>
              {s}
              {SPORT_EMOJI[s] && <span className="sport-emoji" aria-hidden="true"> {SPORT_EMOJI[s]}</span>}
            </button>
          ))}
        </div>
        <button
          className="m-icon"
          aria-label="Фильтры"
          onClick={() => H("filter")}
        >
          <SlidersHorizontal size={19} />
          {changed && <i />}
        </button>
        <button
          className="m-icon"
          aria-label="Открыть поиск"
          aria-expanded={searchOpen || searchPage || !!query}
          onClick={() => {
            flushSync(() => setSearchOpen(true));
            searchInput.current?.focus({ preventScroll: true });
          }}
        >
          <Search size={20} />
        </button>
      </div>
      <div className="event-status-tabs pdf-status-tabs">
        {[
          ["all", "Все"],
          ["live", "Сейчас идут"],
          ["upcoming", "Ближайшие"],
          ["past", "Завершённые"],
        ].map(([id, l]) => (
          <button
            key={id}
            aria-label={l}
            aria-pressed={status === id}
            onClick={() => T(id)}
          >
            {
              {
                all: "Все",
                live: "Идут",
                upcoming: "Скоро",
                past: "Завершены",
              }[id]
            }
          </button>
        ))}
      </div>
      {!library &&
      !searchPage &&
      status === "all" &&
      sport === "Все" &&
      !query &&
      !changed ? (
        <>
          {section(
            "Live",
            visible.filter((e) => e.status === "live"),
            true,
          )}
          {section(
            "Pre-match",
            visible.filter((e) => e.status === "upcoming"),
            true,
          )}
          {section("Все матчи", visible)}
        </>
      ) : visible.length ? (
        section(library ? "Ваши матчи" : "Все матчи", visible)
      ) : (
        <div className="m-empty">
          <Search />
          <h2>Ничего не найдено</h2>
          <p>
            {changed
              ? "Фильтры вероятности доступны для открытых прогнозов."
              : "Выберите другой вид спорта или поисковый запрос."}
          </p>
          <button
            className="m-button"
            onClick={() => {
              S("Все");
              T("all");
              Q("");
              F({ date: "Все", prob: 0, odds: 1.1 });
            }}
          >
            Сбросить фильтры
          </button>
        </div>
      )}

      {sheet && (
        <FilterSheet
          kind={sheet}
          close={() => H(null)}
          filters={filters}
          apply={(v) => {
            F(v);
            H(null);
          }}
          sport={sport}
          setSport={S}
          search={(v) => {
            Q(v);
            H(null);
          }}
        />
      )}
    </>
  );
}
function FilterSheet({ kind, close, filters, apply, sport, setSport, search }) {
  const [f, F] = useState(filters),
    [s, S] = useState(sport),
    [q, Q] = useState(""),
    [where, W] = useState("Везде");
  const chips = (items, value, fn) => (
    <div className="pdf-chips">
      {items.map((x) => (
        <button key={x} aria-pressed={x === value} onClick={() => fn(x)}>
          {typeof x === "number" ? (x === 0 ? "Все" : `от ${x}%`) : x}
        </button>
      ))}
    </div>
  );
  return (
    <Modal
      title={kind === "search" ? "Поиск" : "Фильтры"}
      close={close}
      kind="white-sheet filter-sheet"
    >
      <div className="sheet-body">
        <h2>{kind === "search" ? "Поиск" : "Фильтры"}</h2>
        {kind === "search" ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              search(q);
            }}
          >
            <p className="field-title">Где искать?</p>
            {chips(["Везде", "Команды", "Матчи"], where, W)}
            <input
              aria-label="Поисковый запрос"
              placeholder={
                where === "Команды" ? "Команда…" : "Команда или матч…"
              }
              value={q}
              onChange={(e) => Q(e.target.value)}
            />
            <button className="m-button">Искать</button>
          </form>
        ) : (
          <>
            <p className="field-title">Дата</p>
            {chips(
              [
                "Все",
                "Сегодня",
                "Завтра",
                "Ближайшие 3 дня",
                "Ближайшие 7 дней",
              ],
              f.date,
              (v) => F({ ...f, date: v }),
            )}
            <label className="field-title" htmlFor="odds">
              Коэффициент от {f.odds} · иллюстрация
            </label>
            <input
              id="odds"
              type="range"
              min="1.1"
              max="7"
              step="0.1"
              value={f.odds}
              onChange={(e) => F({ ...f, odds: Number(e.target.value) })}
            />
            <div className="range-labels">
              <span>1.1</span>
              <span>7.0</span>
            </div>
            <p className="field-title">
              Вероятность исхода · открытые прогнозы
            </p>
            {chips([0, 50, 60, 70, 80], f.prob, (v) => F({ ...f, prob: v }))}
            <p className="field-title">Вид спорта</p>
            {chips(SPORTS, s, S)}
            <button
              className="m-button sheet-apply"
              onClick={() => {
                setSport(s);
                apply(f);
              }}
            >
              Применить
            </button>
            <button
              className="text-button"
              onClick={() => {
                F({ date: "Все", prob: 0, odds: 1.1 });
                S("Все");
              }}
            >
              Очистить
            </button>
          </>
        )}
      </div>
    </Modal>
  );
}
export function Profile({ app }) {
  const [tab, T] = useState("Матчи");
  const owned = fixtures.filter((e) => app.access(e.id));
  return (
    <div className="pdf-profile">
      <section className="profile-hero">
        <div className="profile-ident">
          <button
            className="profile-avatar"
            onClick={() => app.require({ type: "edit" })}
          >
            {app.user?.method === "telegram" ? (
              <span className="profile-initials">
                {app.user.name.slice(0, 1)}
              </span>
            ) : (
              <img
                src={img(app.user?.avatar || "avatar")}
                alt="Аватар профиля"
              />
            )}
          </button>
          <span>
            ID {app.user.telegramId}
            <small>{app.user.name}</small>
          </span>
          <button
            className="m-icon"
            aria-label="Редактировать профиль"
            onClick={() => app.require({ type: "edit" })}
          >
            <Pencil size={17} />
          </button>
        </div>
        <div className="profile-balance">
          <strong>
            {app.balance}
            <small>₽</small>
          </strong>
          <span>
            Баланс
            <br />
            <button onClick={() => app.open({ type: "payments" })}>
              ⚙ Настройки платежей
            </button>
          </span>
          <div>
            <b>
              {owned.length} <small>матчей</small>
            </b>
            <span>Открыто</span>
            <b>
              {app.credits} <small>анализа</small>
            </b>
            <span>+ {app.outcomeCredits} исхода в пакете</span>
          </div>
        </div>
        <div className="profile-cta">
          <button onClick={() => app.require({ type: "plans" })}>
            Купить прогнозы
          </button>
          <button onClick={() => app.require({ type: "topup" })}>
            Пополнить баланс ＋
          </button>
        </div>
      </section>
      <button
        className="profile-coin-card"
        onClick={() => app.open({ type: "rewards" })}
      >
        <span>
          Ваши монеты<strong>{app.wallet.balance}</strong>
        </span>
        <span>
          Ежедневная награда <ChevronRight size={17} />
        </span>
      </button>
      <ProfileBenefits app={app} />
      <section className="telegram-account-card">
        <div className="telegram-account-heading"><Send size={20} /><strong>Аккаунт Telegram</strong><Check size={17} /></div>
        <p>Номер телефона можно передать через Telegram. Это необязательно для входа.</p>
        <button className="telegram-contact-button" disabled={app.contactPending || app.user.contactShared} onClick={app.shareContact}>
          {app.contactPending ? "Ожидаем ответ Telegram…" : app.user.contactShared ? "Номер передан через Telegram" : "Поделиться номером"}
          {app.user.contactShared ? <Check size={17} /> : <ChevronRight size={17} />}
        </button>
        {app.contactHint && <p className="telegram-contact-hint" role="status">{app.contactHint}</p>}
      </section>
      <div className="pdf-chips profile-tabs">
        {["Матчи", "Статистика", "История платежей"].map((t) => (
          <button key={t} aria-pressed={t === tab} onClick={() => T(t)}>
            {t}
          </button>
        ))}
      </div>
      {tab === "Матчи" ? (
        <>
          {owned.length ? (
            owned.map((e) => <PdfEventCard key={e.id} event={e} app={app} />)
          ) : (
            <div className="m-empty">
              <h2>Ваш первый матч впереди</h2>
              <button className="m-button" onClick={() => app.go("/")}>
                Выбрать матч
              </button>
            </div>
          )}
          <button className="profile-row" onClick={() => app.go("/library")}>
            <Bookmark /> Мои прогнозы и избранное <ChevronRight />
          </button>
        </>
      ) : tab === "Статистика" ? (
        <section className="profile-panel">
          <h2>Ваша статистика</h2>
          <strong className="stat-number">{owned.length}</strong>
          <p>Открытых прогнозов</p>
          <p>Здесь собраны ваши открытые прогнозы.</p>
        </section>
      ) : (
        <section className="profile-panel">
          <h2>История платежей</h2>
          {app.transactions.length ? (
            app.transactions.map((t, i) => (
              <div className="history-row" key={i}>
                <span>
                  {operationLabel(t.label)}
                  <small>{new Date(t.date).toLocaleDateString("ru-RU")}</small>
                </span>
                <b>{t.amount} ₽</b>
              </div>
            ))
          ) : (
            <p>Операций пока нет</p>
          )}
        </section>
      )}
      <section className="profile-panel">
        <h2>{app.user?.name || "Ваш профиль"}</h2>
        {[
          ["settings", "Настройки профиля", Settings],
          ["payments", "Способы оплаты", CreditCard],
          ["faq", "FAQ", CircleHelp],
          ["support", "Служба поддержки", MessageCircle],
          ["language", "Выбор языка", LayoutGrid],
        ].map(([type, label, I]) => (
          <button
            className="profile-row"
            key={type}
            onClick={() => app.open({ type })}
          >
            <I size={19} />
            {label}
            <ChevronRight size={17} />
          </button>
        ))}
        <button className="profile-row" onClick={() => app.openLegal("privacy")}>Политика конфиденциальности<ChevronRight size={17} /></button>
        <button className="profile-row" onClick={() => app.openLegal("terms")}>Пользовательское соглашение<ChevronRight size={17} /></button>
        <button className="profile-row" onClick={app.logout}>
          <LogOut size={19} />Выйти из профиля
        </button>
      </section>
    </div>
  );
}
export function GeneralChat({ app }) {
  const [input, I] = useState(""),
    [messages, M] = useSaved("generalChat", []);
  const log = useRef(null);
  useEffect(() => {
    log.current?.scrollTo(0, log.current.scrollHeight);
  }, [messages]);
  function send(e) {
    e.preventDefault();
    if (!input.trim()) return;
    if (!app.user) {
      app.require({ type: "chatIntro" });
      return;
    }
    M((p) => [
      ...p,
      { role: "user", text: input.slice(0, 800) },
      {
        role: "assistant",
        text: "Выберите матч из каталога и откройте прогноз — там я объясню форму, личные встречи и факторы именно этого события. ",
      },
    ]);
    I("");
  }
  return (
    <div className="general-chat">
      <div className="chat-page-title">
        <button
          className="m-icon"
          aria-label="Очистить историю чата"
          onClick={() => M([])}
        >
          <ClockIcon />
        </button>
        <span>Diverge AI</span>
        <button
          className="m-icon"
          aria-label="Закрыть чат"
          onClick={() => app.go("/")}
        >
          <X size={19} />
        </button>
      </div>
      <div className="general-chat-log" ref={log}>
        {messages.length ? (
          messages.map((m, i) => (
            <div key={i} className={"general-message " + m.role}>
              {m.role === "assistant" ? assistantText(m.text) : m.text}
            </div>
          ))
        ) : (
          <h1>
            Привет, чем
            <br />
            могу помочь?
          </h1>
        )}
      </div>
      <form onSubmit={send}>
        <div className="pdf-chips">
          {SPORTS.slice(1).map((s) => (
            <button
              type="button"
              key={s}
              onClick={() => I("Проанализируй матч по " + s.toLowerCase())}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="general-chat-input">
          <input
            aria-label="Сообщение AI"
            placeholder="Проанализируй матч…"
            value={input}
            maxLength={800}
            onChange={(e) => I(e.target.value)}
          />
          <button className="m-icon" aria-label="Отправить сообщение">
            <Send size={21} />
          </button>
        </div>
        <small>Чат по событию</small>
      </form>
    </div>
  );
}
function ClockIcon() {
  return <MessageCircle size={18} />;
}
const packages = [
  { count: 3, price: 29 },
  { count: 5, price: 129 },
  { count: 10, price: 259 },
];
export function ExtraModal({ modal, app, close }) {
  const type = modal.type;
  const [name, N] = useState(app.user?.name || "Участник"),
    [amount, A] = useState(2259),
    [selected, S] = useState(0),
    [tier, T] = useState("outcome"),
    [card, C] = useState(null),
    [useFunds,setUseFunds] = useState(true),
    [checkoutNow,setCheckoutNow] = useState(Date.now());
  useEffect(()=>{if(!["order","plans"].includes(type))return;const t=setInterval(()=>setCheckoutNow(Date.now()),1000);return()=>clearInterval(t);},[type]);
  const white = ["topup", "order", "edit", "paymentCard", "search"].includes(
    type,
  );
  const titles = {
    gift: "Начните знакомство",
    plans: "Откройте прогнозы",
    order: "Оформление заказа",
    topup: "Пополнение баланса",
    payments: "Настройки платежей",
    paymentCard: "Способ оплаты",
    settings: "Настройки профиля",
    edit: "Редактирование профиля",
    notifications: "Уведомления",
    faq: "Вопросы и ответы",
    support: "Служба поддержки",
    language: "Выбор языка",
    news: "Новости Diverge",
    chatIntro: "Diverge AI",
  };
  const pay = () => {
    app.topup(Number(amount));
    close();
  };
  const methods = (
    <div className="demo-methods">
      {app.cards.map((c, i) => (
        <button key={c.id} aria-pressed={selected === i} onClick={() => S(i)}>
          <b>{c.brand}</b>
          <span>
            {c.brand} · {c.last}
          </span>
        </button>
      ))}
    </div>
  );
  return (
    <Modal
      title={titles[type] || "Diverge"}
      close={close}
      kind={`${white ? "white-sheet" : "dark-modal"} extra-modal ${type === "gift" ? "gift-modal" : ""}`}
    >
      <div className="sheet-body">
        {type === "gift" ? (
          <>
            <img
              className="gift-art"
              src={img("trophies")}
              alt="Фиолетовые стеклянные кубки"
            />
            <h1>
              Начните
              <br />
              знакомство
            </h1>
            <p>Копите монеты за ежедневный вход и вращайте колесо фортуны.</p>
            <button
              className="m-button"
              onClick={() => {
                close();
                app.go("/");
              }}
            >
              Выбрать матч
            </button>
          </>
        ) : type === "plans" ? (
          <>
            <h1>
              Откройте
              <br />
              прогнозы
            </h1>
            <div className="pdf-chips plan-toggle">
              <button
                aria-pressed={tier === "outcome"}
                onClick={() => {
                  T("outcome");
                  S(0);
                }}
              >
                Только исход матча
              </button>
              <button
                aria-pressed={tier === "full"}
                onClick={() => {
                  T("full");
                  S(0);
                }}
              >
                Полная аналитика
              </button>
            </div>
            {(tier === "outcome"
              ? packages
              : [
                  { count: 1, price: 199 },
                  { count: 3, price: 549 },
                  { count: 5, price: 899 },
                ]
            ).map((p, i) => (
              <button
                key={p.count}
                className={"package-card " + (i === selected ? "selected" : "")}
                onClick={() => S(i)}
              >
                <h2>
                  {p.count}{" "}
                  {p.count === 1 ? "матч" : p.count < 5 ? "матча" : "матчей"}
                </h2>
                <p>
                  {tier === "outcome"
                    ? "Вероятность победы\nРасстановка сил"
                    : "Вероятности и факторы\nРазвёрнутый анализ команд\nЧат по событию"}
                </p>
                <strong>
                  {app.packageQuote(p).price}
                  <small>₽</small>
                </strong>
              </button>
            ))}
            <button
              className="m-button"
              onClick={() =>
                app.open({
                  type: "order",
                  package: {
                    ...(tier === "outcome"
                      ? packages
                      : [
                          { count: 1, price: 199 },
                          { count: 3, price: 549 },
                          { count: 5, price: 899 },
                        ])[selected],
                    tier,
                  },
                })
              }
            >
              Купить
            </button>
            <button
              className="text-button"
              onClick={() => {
                close();
                app.go("/subscription");
              }}
            >
              Все события · 1 000 ₽ / месяц
            </button>
            <small></small>
          </>
        ) : type === "order" ? (
          <>
            <h1>
              Оформление
              <br />
              заказа
            </h1>
            <p className="field-title">Ваш заказ</p>
            <div className="order-product">
              <img src={img("trophies")} alt="" />
              <div>
                <h2>
                  {modal.package.tier === "outcome"
                    ? "Прогноз победы команды"
                    : "Полная аналитика"}
                </h2>
                <span>{modal.package.count} шт.</span>
              </div>
              <span>{app.packageQuote(modal.package).price} ₽</span>
            </div>
            <p className="field-title">Способ оплаты</p>
            {methods}
            {app.balance > 0 && <label className="use-balance"><input type="checkbox" checked={useFunds} onChange={(e)=>setUseFunds(e.target.checked)}/><span>Использовать баланс<strong>{app.paymentQuote(app.packageQuote(modal.package,checkoutNow).price,true).used} ₽</strong></span></label>}
            <div className="order-total">
              <span>К оплате</span>
              <span>{app.paymentQuote(app.packageQuote(modal.package,checkoutNow).price,useFunds).due} рублей</span>
            </div>
            {app.packageQuote(modal.package).discount > 0 && (
              <p className="coupon-applied">Применена скидка {app.packageQuote(modal.package).discount}% по купону</p>
            )}
            <button
              className="m-button"
              onClick={() => {
                if(app.buyPackage(modal.package,useFunds,app.packageQuote(modal.package,checkoutNow).price)) close();
              }}
            >
              Оплатить
            </button>
          </>
        ) : type === "topup" ? (
          <>
            <h1>
              Пополнение
              <br />
              баланса
            </h1>
            <label className="topup-number">
              <input
                aria-label="Сумма пополнения"
                type="number"
                min="1"
                max="100000"
                value={amount}
                onChange={(e) => A(e.target.value)}
              />
              <span>₽</span>
              <small>Сумма пополнения</small>
            </label>
            <p>
              На ваш баланс будет зачислено <b>{amount || 0} ₽</b>
            </p>
            <p className="field-title">Способ оплаты</p>
            {methods}
            <div className="order-total">
              Итого <b>{amount || 0} рублей</b>
            </div>
            <p className="auth-hint"></p>
            <button
              className="m-button"
              disabled={!(Number(amount) > 0 && Number(amount) <= 100000)}
              onClick={pay}
            >
              Пополнить
            </button>
          </>
        ) : type === "payments" ? (
          <>
            <h2>Способы оплаты</h2>
            <p>Выберите основной способ оплаты</p>
            <button className="profile-row" onClick={() => app.addCard()}>
              <Plus />
              Добавить карту
            </button>
            {app.cards.map((c) => (
              <button
                className="profile-row"
                key={c.id}
                onClick={() => app.open({ type: "paymentCard", card: c })}
              >
                <CreditCard />
                <span>
                  {c.brand} · {c.last}
                  {c.primary ? " (Основной)" : ""}
                </span>
                <ChevronRight />
              </button>
            ))}
          </>
        ) : type === "paymentCard" ? (
          <>
            <div className="fake-bank-card">
              <small></small>
              <b>{modal.card.brand}</b>
              <span>**** {modal.card.last}</span>
            </div>
            <button
              className="m-button"
              onClick={() => {
                app.primaryCard(modal.card.id);
                app.open({ type: "payments" });
              }}
            >
              Сделать основным
            </button>
            <button
              className="text-button"
              onClick={() => {
                app.deleteCard(modal.card.id);
                app.open({ type: "payments" });
              }}
            >
              Удалить карту
            </button>
          </>
        ) : type === "settings" ? (
          <>
            <span className="profile-initials settings-initials">{app.user.name.slice(0, 1)}</span>
            <h1 className="settings-name">{app.user.name}</h1>
            <div className="telegram-settings-identity"><Send size={18} /> Вход через Telegram · ID {app.user.telegramId}</div>
            <button
              className="profile-row"
              onClick={() => app.require({ type: "edit" })}
            >
              <Pencil />
              Редактировать профиль
              <ChevronRight />
            </button>
            {["support", "faq", "language"].map((k) => (
              <button
                className="profile-row"
                key={k}
                onClick={() => app.open({ type: k })}
              >
                {titles[k]}
                <ChevronRight />
              </button>
            ))}
          </>
        ) : type === "edit" ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              app.updateName(name.trim());
              close();
            }}
          >
            <span className="profile-initials settings-initials">{app.user.name.slice(0, 1)}</span>
            <label className="field-title" htmlFor="profile-name">
              Имя
            </label>
            <input
              id="profile-name"
              value={name}
              maxLength={40}
              required
              onChange={(e) => N(e.target.value)}
            />
            <p className="field-title">ID аккаунта</p>
            <h2 className="account-id">{app.user.telegramId}</h2>
            <button className="m-button" type="submit">
              Сохранить
            </button>
          </form>
        ) : type === "notifications" ? (
          <>
            <h1>Уведомления</h1>
            <div className="profile-row">
              <Bell />
              <span>
                Добро пожаловать в Diverge
                <small>Здесь будут новости о ваших матчах.</small>
              </span>
            </div>
            <button
              className="profile-row"
              onClick={() => app.open({ type: "news", index: 0 })}
            >
              Добавили фильтры
              <ChevronRight />
            </button>
          </>
        ) : type === "news" ? (
          <>
            <img
              className="news-art"
              src={img(["news", "finance", "bonus", "life"][modal.index || 0])}
              alt=""
            />
            <h1>
              {
                [
                  "Добавили\nфильтры",
                  "Подходите\nосознанно",
                  "Ваш первый\nанализ",
                  "Ритм\nспорта",
                ][modal.index || 0]
              }
            </h1>
            <p>
              {
                [
                  "Находите интересующие события проще: фильтруйте по спорту, дате и статусу. Вероятности доступны только для открытых прогнозов.",
                  "Анализ помогает понять аргументы, но не гарантирует результат. Приложение не принимает ставки.",
                  "За семь дней подряд вы получите 130 монет.",
                  "Сравнивайте форму, составы и подготовку команд. ",
                ][modal.index || 0]
              }
            </p>
            <button className="m-button" onClick={close}>
              Далее
            </button>
          </>
        ) : type === "language" ? (
          <>
            <h1>Выбор языка</h1>
            <button
              className="profile-row"
              onClick={() => {
                app.toast("Русский язык выбран");
                close();
              }}
            >
              Русский <Check />
            </button>
            <p>Приложение доступно на русском языке.</p>
          </>
        ) : type === "support" ? (
          <>
            <h1>
              Служба
              <br />
              поддержки
            </h1>
            <p>Ответы на частые вопросы собраны в разделе FAQ.</p>
            <button
              className="profile-row"
              onClick={() => app.open({ type: "faq" })}
            >
              Ответы на частые вопросы
              <ChevronRight />
            </button>
            <p>Служба поддержки будет доступна к релизу.</p>
          </>
        ) : type === "chatIntro" ? (
          <>
            <h1>
              Обсудим
              <br />
              ваш матч
            </h1>
            <p>
              Выберите событие и откройте его анализ — чат сохранит контекст
              матча.
            </p>
            <button
              className="m-button"
              onClick={() => {
                close();
                app.go("/");
              }}
            >
              Выбрать матч
            </button>
          </>
        ) : (
          <>
            <h1>Всё просто</h1>
            {[
              [
                "Как работает приложение?",
                "Выберите событие, откройте прогноз и изучите факторы.",
              ],
              [
                "Нужно ли регистрироваться?",
                "Вход выполняется через Telegram. Пароль и SMS не нужны.",
              ],
              [
                "Сколько стоит анализ?",
                "Полный анализ одного матча — 199 ₽. Подписка на все события — 1 000 ₽ в месяц. ",
              ],
              [
                "Что в пакете исходов?",
                "Только вероятности и выбор AI. Полный анализ с факторами и чатом продаётся отдельно.",
              ],
              [
                "Сохранится ли доступ?",
                "Открытые прогнозы сохраняются в вашем профиле.",
              ],
            ].map(([q, a]) => (
              <details className="pdf-faq" key={q}>
                <summary>{q}</summary>
                <p>{a}</p>
              </details>
            ))}
          </>
        )}
      </div>
    </Modal>
  );
}

export function EventOrder({ event: e, app, close, confirm }) {
  const [currency, C] = useState(app.credits > 0 ? "package" : "rub"),
    [cardIndex, CI] = useState(Math.max(0, app.cards.findIndex((c) => c.primary))),
    [useFunds,setUseFunds] = useState(true),
    [checkoutNow,setCheckoutNow] = useState(Date.now());
  const usable=app.forecastCreditsAt(checkoutNow), payment=app.paymentQuote(199,useFunds);
  useEffect(()=>{const t=setInterval(()=>setCheckoutNow(Date.now()),1000);return()=>clearInterval(t);},[]);
  useEffect(()=>{if(currency==="package" && !usable)C("rub");},[usable]);
  return (
    <Modal title="Оформление заказа" close={close} kind="white-sheet event-order">
      <div className="sheet-body">
        <h1>Оформление<br />заказа</h1>
        <p className="field-title">Ваш заказ</p>
        <div className="order-product">
          <img src={img("trophies")} alt="" />
          <div><h2>Полная аналитика</h2><span>{e.home} — {e.away}</span></div>
          <span>{currency === "package" ? "0" : "199"} ₽</span>
        </div>
        <p className="field-title">Способ оплаты</p>
        {app.credits > 0 && <div className="currency-tabs">
          <button aria-pressed={currency === "package"} onClick={() => C("package")}>Из доступа</button>
          <button aria-pressed={currency === "rub"} onClick={() => C("rub")}>Рубли</button>
        </div>}
        {currency === "package" ? <p className="auth-hint">Доступно анализов: {app.credits}. Будет использован один.</p> : <div className="demo-methods">{app.cards.map((card,i) => <button key={card.id} aria-pressed={i === cardIndex} onClick={() => CI(i)}><b>{card.brand}</b><span>{card.brand} · {card.last}</span></button>)}</div>}
        {currency==="rub" && app.balance>0 && <label className="use-balance"><input type="checkbox" checked={useFunds} onChange={(e)=>setUseFunds(e.target.checked)}/><span>Использовать баланс<strong>{app.paymentQuote(199,true).used} ₽</strong></span></label>}
        <div className="order-total"><span>К оплате</span><strong>{currency === "package" ? "0" : payment.due} рублей</strong></div>
        <button className="m-button confirm-purchase" onClick={() => confirm(currency,useFunds)}>{currency === "package" ? "Использовать анализ" : `Оплатить ${payment.due} ₽`}</button>
        <button className="text-button" onClick={() => { close(); app.go("/subscription"); }}>Все события за 1 000 ₽ / месяц</button>
      </div>
    </Modal>
  );
}
