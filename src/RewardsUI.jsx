import React, { useEffect, useState, useRef } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Send,
} from "lucide-react";
import { Modal } from "./AssistantUI.jsx";
import {
  DAILY_REWARDS,
  REWARD_COST,
  BUNDLE_DISCOUNT,
  rewardStatus,
} from "./rewards.js";
export function Coin({ className = "" }) {
  return (
    <span className={"coin " + className} aria-hidden="true">
      <span>
        <i />
      </span>
    </span>
  );
}
export function CoinButton({ app }) {
  const reduced = useReducedMotion();
  return (
    <button
      className="coin-balance-button"
      aria-label={`Монетки за вход: ${app.wallet.balance}`}
      onClick={() => app.open({ type: "rewards" })}
    >
      <Coin />
      <motion.span
        key={app.wallet.balance}
        initial={reduced ? false : {y:5,opacity:0}}
        animate={{ y: 0, opacity: 1 }}
      >
        {app.wallet.balance}
      </motion.span>
    </button>
  );
}
export function RewardSheet({ app, close, shop = false }) {
  const dragStart = useRef(0);
  const status = rewardStatus(app.wallet, app.now),
    [burst, B] = useState(false),
    [hint, H] = useState(false),
    reduced = useReducedMotion();
  const collect = () => {
    if (!status.canClaim) return;
    app.claimCoins();
    B(true);
  };
  return (
    <Modal
      title={shop ? "Потратить монеты" : "Монетки за вход"}
      close={close}
      kind="reward-sheet dark-modal"
    >
      <div className="reward-content">
        <button
          className="reward-drag-handle"
          aria-label="Закрыть"
          onClick={close}
          onPointerDown={(e) => {
            dragStart.current = e.clientY;
            e.currentTarget.setPointerCapture(e.pointerId);
          }}
          onPointerUp={(e) => {
            if (e.clientY - dragStart.current > 35) close();
          }}
        >
          <span />
        </button>
        <div className="reward-title-line">
          <h1>{shop ? "Ваши монеты" : "Монетки за вход"}</h1>
          {shop && (
            <span className="reward-wallet">
              <Coin />
              {app.wallet.balance}
            </span>
          )}
        </div>
        <p className="reward-intro">
          {shop
            ? "130 монет — один прогноз или скидка на пакет. Выбирайте, что пригодится сейчас."
            : "Заходите каждый день, чтобы собрать как можно больше монеток за неделю"}
        </p>
        {!shop ? (
          <>
            <div className="reward-days">
              {DAILY_REWARDS.map((n, i) => {
                const active = i === status.index,
                  done = i < status.index;
                return (
                  <div
                    className={
                      "reward-day " +
                      (active ? "active " : "") +
                      (done ? "collected" : "")
                    }
                    key={i}
                  >
                    <span>
                      {active
                        ? status.claimed
                          ? "Завтра"
                          : "Сегодня"
                        : `${i + 1} день`}
                    </span>
                    <motion.div
                      className="reward-tile"
                      animate={{
                        opacity: done ? 0.45 : 1,
                        scale: active ? 1.035 : 1,
                      }}
                      transition={{ duration: reduced ? 0 : 0.5 }}
                    >
                      <strong>{n}</strong>
                      {done && <Check className="reward-check" size={15} />}
                      <Coin />
                      {active && <span className="reward-sparkle">✦</span>}
                    </motion.div>
                  </div>
                );
              })}
            </div>
            <div className="reward-reminder">
              <div>
                <strong>Напоминания о монетках</strong>
                <span>Чтобы не забыть ежедневную награду</span>
              </div>
              <button onClick={() => H(!hint)}>Скоро</button>
            </div>
            {hint && (
              <p className="reward-hint" role="status">
                Напоминания в Telegram появятся к релизу.
              </p>
            )}
            <button
              className={"reward-claim " + (status.claimed ? "claimed" : "")}
              disabled={!status.canClaim}
              onClick={collect}
            >
              {status.claimed ? (
                <>
                  <Check size={21} />
                  Награда получена
                </>
              ) : (
                "Забрать награду"
              )}
            </button>
            <button
              className="reward-shop-link"
              onClick={() => app.open({ type: "coinShop" })}
            >
              На что потратить {app.wallet.balance} монет{" "}
              <ArrowRight size={15} />
            </button>
            {burst && !reduced && (
              <div className="reward-burst" aria-hidden="true">
                {Array.from({ length: 12 }, (_, i) => (
                  <motion.i
                    key={i}
                    initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                    animate={{
                      opacity: 0,
                      x: Math.cos((i * Math.PI) / 6) * 125,
                      y: -100 - Math.sin((i * Math.PI) / 6) * 70,
                      scale: 0,
                    }}
                    transition={{ duration: 1, delay: i * 0.018 }}
                  >
                    ✦
                  </motion.i>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <div className="coin-redeem-card">
              <div className="coin-redeem-icon">
                <Sparkles />
              </div>
              <h2>Любой прогноз</h2>
              <p>
                Полная аналитика одного матча и чат с AI. Выберите событие после
                обмена.
              </p>
              <button
                className="m-button"
                disabled={app.wallet.balance < REWARD_COST}
                onClick={() => app.redeemCoins("forecast")}
              >
                <Coin /> {REWARD_COST} монет · забрать прогноз
              </button>
            </div>
            <div className="coin-redeem-card">
              <div className="coin-redeem-icon">−{BUNDLE_DISCOUNT}%</div>
              <h2>Скидка на пакет</h2>
              <p>
                На один пакет от двух прогнозов. Скидка применится при
                оформлении заказа.
              </p>
              <button
                className="m-button"
                disabled={
                  app.wallet.balance < REWARD_COST || !!app.wallet.coupon
                }
                onClick={() => app.redeemCoins("coupon")}
              >
                {app.wallet.coupon
                  ? "Скидка уже активна"
                  : `${REWARD_COST} монет · получить скидку`}
              </button>
            </div>
            <p className="reward-hint">
              За 7 дней подряд вы получите {REWARD_COST} монет. После пропуска
              серия начинается заново, а накопленные монеты сохраняются.
            </p>
          </>
        )}
      </div>
    </Modal>
  );
}
export const NEWS_ITEMS = [
  {
    id: "filters-v1",
    label: "Новости",
    image: "news",
    title: "Находите свой матч",
    copy: "Выбирайте вид спорта, дату и статус. Сохраняйте интересные матчи, чтобы вернуться к ним позже.",
  },
  {
    id: "approach-v1",
    label: "Личные финансы",
    image: "finance",
    title: "Смотрите глубже",
    copy: "Сравнивайте форму, очные встречи и составы. Нажмите на фактор, чтобы увидеть его вклад в прогноз.",
  },
  {
    id: "coins-v1",
    label: "Акции и бонусы",
    image: "bonus",
    title: "Заходите за наградой",
    copy: "Соберите 130 монет за семь дней подряд. Обменяйте их на любой прогноз или скидку 30% на пакет.",
  },
  {
    id: "sport-v1",
    label: "Ритм спорта",
    image: "life",
    title: "В ритме спорта",
    copy: "Футбол, хоккей, баскетбол, теннис и киберспорт — все события в одном месте.",
  },
];
export function StoryRail({ app }) {
  return (
    <div className="story-news-rail" aria-label="Истории">
      {NEWS_ITEMS.map((item, i) => (
        <button
          key={item.id}
          className={
            "story-news-tile " +
            (app.readNews.includes(item.id) ? "read" : "unread")
          }
          aria-label={`${item.title}${app.readNews.includes(item.id) ? ", просмотрено" : ", новая история"}`}
          onClick={() => app.openNews(i)}
        >
          <span className="story-news-picture">
            <img src={`./images/diverge/${item.image}.webp`} alt="" />
            <span>{item.label}</span>
          </span>
        </button>
      ))}
      <button
        className="story-news-tile onboarding-tile read"
        aria-label="Открыть знакомство с приложением"
        onClick={app.stories}
      >
        <span className="story-news-picture">
          <img src="./images/diverge/trophies.webp" alt="" />
          <span>О приложении</span>
        </span>
      </button>
    </div>
  );
}
export function NewsStories({ app, index = 0, close }) {
  const [step, S] = useState(index),
    [elapsed, E] = useState(0),
    reduced = useReducedMotion();
  const item = NEWS_ITEMS[step];
  useEffect(() => {
    app.markNews(item.id);
    E(0);
    if (reduced) return;
    const t = setInterval(() => E((p) => p + 100), 100);
    return () => clearInterval(t);
  }, [step, reduced]);
  useEffect(() => {
    if (elapsed >= 8000) {
      if (step < NEWS_ITEMS.length - 1) S(step + 1);
      else close();
    }
  }, [elapsed]);
  const go = (dir) => {
    if (step + dir < 0) return;
    if (step + dir >= NEWS_ITEMS.length) close();
    else S(step + dir);
  };
  return (
    <Modal title="Истории Diverge" close={close} kind="news-stories dark-modal">
      <div className="news-story-content">
        <div className="news-story-progress">
          {NEWS_ITEMS.map((n, i) => (
            <span key={n.id}>
              <i
                style={{
                  width: `${i < step ? 100 : i === step ? (reduced ? 100 : Math.min(100, elapsed / 80)) : 0}%`,
                }}
              />
            </span>
          ))}
        </div>
        <motion.img
          key={item.image}
          src={`./images/diverge/${item.image}.webp`}
          alt=""
          initial={reduced ? false : { opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
        />
        <motion.div
          key={item.id}
          initial={reduced ? false : { opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1>{item.title}</h1>
          <p>{item.copy}</p>
        </motion.div>
        <div className="news-story-controls">
          <button
            aria-label="Предыдущая история"
            disabled={step === 0}
            onClick={() => go(-1)}
          >
            <ChevronLeft />
          </button>
          <button className="m-button" onClick={() => go(1)}>
            {step === NEWS_ITEMS.length - 1 ? "Готово" : "Далее"}
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </Modal>
  );
}
