import { forecasts } from "./marketData.js";

export const SNAPSHOT_V6 = "8 октября 2026 · 14:30 МСК";
export const SPORTS = [
  "Все",
  "Футбол",
  "Киберспорт",
  "Теннис",
  "Баскетбол",
  "Хоккей",
];
export const PRICE = 199;
export const MONTH_PRICE = 1000;
const extra = [
  [
    "tennis-milan",
    "Теннис",
    "Леон Морено",
    "Алекс Вебер",
    "LM",
    "AW",
    "upcoming",
    "16:00",
    "Турнир в Милане",
  ],
  [
    "basket-neva",
    "Баскетбол",
    "Нева",
    "Волга",
    "NV",
    "RU",
    "live",
    "62 : 58",
    "Кубок городов",
  ],
  [
    "hockey-frost",
    "Хоккей",
    "Север",
    "Полярис",
    "FR",
    "OR",
    "upcoming",
    "19:00",
    "Северная лига",
  ],
  [
    "tennis-lyon",
    "Теннис",
    "Эмма Лоран",
    "София Клайн",
    "EL",
    "SK",
    "live",
    "1 : 0",
    "Турнир в Лионе",
  ],
  [
    "football-final",
    "Футбол",
    "Атлас",
    "Аврора",
    "AT",
    "AU",
    "past",
    "2 : 1",
    "Премьер-дивизион",
  ],
  [
    "cs-final",
    "Киберспорт",
    "Ember",
    "Frost Union",
    "EM",
    "FR",
    "past",
    "1 : 2",
    "Continental Cup",
  ],
  [
    "tennis-final",
    "Теннис",
    "Леон Морено",
    "Алекс Вебер",
    "LM",
    "AW",
    "past",
    "2 : 0",
    "Турнир в Милане",
  ],
  [
    "basket-final",
    "Баскетбол",
    "Нева",
    "Волга",
    "NV",
    "RU",
    "past",
    "78 : 84",
    "Кубок городов",
  ],
  [
    "hockey-final",
    "Хоккей",
    "Север",
    "Полярис",
    "FR",
    "OR",
    "past",
    "3 : 2",
    "Северная лига",
  ],
];
const seed = forecasts.map((f, i) => ({
  id: f.id,
  sport: f.event.sport === "CS2" ? "Киберспорт" : f.event.sport,
  home: f.event.home,
  away: f.event.away,
  homeCode: f.event.homeCode,
  awayCode: f.event.awayCode,
  status: i === 1 || i === 2 ? "live" : "upcoming",
  time: i === 1 ? "1 : 0" : i === 2 ? "0 : 1" : f.event.time,
  league: f.event.league.split("•")[0].trim(),
  tomorrow: i >= 6,
}));
seed.push(
  ...extra.map(
    ([id, sport, home, away, homeCode, awayCode, status, time, league]) => ({
      id,
      sport,
      home,
      away,
      homeCode,
      awayCode,
      status,
      time,
      league,
    }),
  ),
);
export const fixtures = seed.map((e, i) => {
  const football = e.sport === "Футбол";
  const base = football ? [40, 28, 32] : [50, 50];
  const shift = i % 3;
  const factors = [
    {
      id: "form",
      name: "Текущая форма",
      metric: "4 из 5",
      caption: "побед у первого участника",
      delta: 8 - shift,
      source: "Протоколы последних пяти встреч",
      observed:
        "В демовыборке первый участник выиграл 4 встречи из 5, второй — 3. Сила соперников учитывается в отдельной поправке.",
      kind: "Статистика",
      sample: "5 матчей",
      confidence: "Средняя",
    },
    {
      id: "h2h",
      name: "Личные встречи",
      metric: "3 : 2",
      caption: "по победам в очных встречах",
      delta: 5,
      source: "Архив личных встреч",
      observed:
        "Последние 5 очных встреч: 3 победы первого участника, 2 — второго. Более старые встречи имеют меньший вес.",
      kind: "История",
      sample: "5 встреч",
      confidence: "Средняя",
    },
    {
      id: "roster",
      name: e.sport === "Теннис" ? "Физическое состояние" : "Состав и травмы",
      metric: e.sport === "Теннис" ? "Нагрузка" : "1 замена",
      caption: "учтённый фактор риска",
      delta: -2,
      source:
        e.sport === "Теннис"
          ? "Официальный турнирный бюллетень"
          : "Официальная заявка на матч",
      observed:
        e.sport === "Теннис"
          ? "В демосценарии первый участник провёл более длинный предыдущий матч. Проверенных данных о травме нет."
          : "В демосценарии у первого участника заявлена одна замена. Это немного снижает оценку; слухи о других травмах не учитываются.",
      kind: "Официальная сводка",
      sample: "1 сводка",
      confidence: "Высокая",
    },
    {
      id: "schedule",
      name: "Условия и подготовка",
      metric: e.sport === "Теннис" ? "Хард" : "3 дня",
      caption: e.sport === "Теннис" ? "знакомое покрытие" : "на восстановление",
      delta: 4,
      source: "Расписание и регламент турнира",
      observed:
        e.sport === "Теннис"
          ? "В демосценарии покрытие совпадает с тем, на котором первый участник показывает лучшие результаты."
          : "У первого участника было 3 дня между встречами. У второго — 2 дня и переезд. Условия сопоставлены по расписанию.",
      kind: "Расписание",
      sample: "7 дней",
      confidence: "Высокая",
    },
    {
      id: "social",
      name: "Публичный контекст",
      metric: "Не учтён",
      caption: "нет подтверждённой связи",
      delta: 0,
      source: "Публичные публикации и календарь",
      observed:
        "Праздник или фотография с отдыха не доказывают пропуск тренировки, употребление алкоголя или ухудшение формы. Проверяемых сведений в этом демо нет, поэтому вклад равен нулю.",
      kind: "Не подтверждено",
      sample: "Нет данных",
      confidence: "Недостаточно",
    },
  ].map((f) => ({
    ...f,
    vector: football ? [f.delta, 0, -f.delta] : [f.delta, -f.delta],
    updated:
      e.status === "past" ? "7 октября, 12:00 МСК" : "8 октября, 12:00 МСК",
  }));
  const probabilities = base.map(
    (b, j) => b + factors.reduce((s, f) => s + f.vector[j], 0),
  );
  const labels = football ? [e.home, "Ничья", e.away] : [e.home, e.away];
  const scores =
    e.status !== "upcoming" ? e.time.split(" : ").map(Number) : null;
  const result =
    e.status === "past" ? (scores[0] > scores[1] ? "win" : "loss") : null;
  const period =
    e.sport === "Футбол"
      ? "63′ · второй тайм"
      : e.sport === "Баскетбол"
        ? "3-я четверть"
        : e.sport === "Теннис"
          ? "По сетам · второй сет"
          : e.sport === "Хоккей"
            ? "2-й период"
            : "По картам · карта 2";
  return {
    ...e,
    date:
      e.status === "past"
        ? "7 октября"
        : e.tomorrow
          ? "9 октября"
          : "8 октября",
    factors,
    base,
    probabilities,
    labels,
    result,
    period,
    score: e.status !== "upcoming" ? e.time : null,
    pick: `Победа ${e.home}`,
    market: football
      ? "Победа в основное время"
      : e.sport === "Киберспорт"
        ? "Победа в серии"
        : e.sport === "Теннис"
          ? "Победа в матче"
          : "Победа с учётом дополнительного времени",
    analysisAt:
      e.status === "past" ? "7 октября, 12:00 МСК" : "8 октября, 12:00 МСК",
    summary: `AI сопоставляет форму участников, историю встреч, состав и условия подготовки.`,
    price: PRICE,
  };
});
export function activeSubscription(subscription, now = Date.now()) {
  return Boolean(
    subscription &&
      typeof subscription.expiresAt === "number" &&
      subscription.expiresAt > now,
  );
}
export function canAccess(
  id,
  purchases,
  subscription,
  now = Date.now(),
  legacy = [],
) {
  return (
    purchases.includes(id) ||
    legacy.includes(`read-${id}`) ||
    activeSubscription(subscription, now)
  );
}
export function subscriptionMonth(now = Date.now()) {
  const end = new Date(now);
  const day = end.getDate();
  end.setDate(1);
  end.setMonth(end.getMonth() + 1);
  const last = new Date(end.getFullYear(), end.getMonth() + 1, 0).getDate();
  end.setDate(Math.min(day, last));
  return { startedAt: now, expiresAt: end.getTime(), renew: false };
}
export function replyToEvent(e, text) {
  const q = text.toLowerCase();
  if (/если|слышал|думаю|считаю|по моим|мне кажется/.test(q))
    return `Это можно рассмотреть как гипотезу, но пока не как подтверждённый факт. Для ${e.home} — ${e.away} важны источник, дата и связь с составом или подготовкой. Пришлите эти детали в вашем сообщении. В демо я не открываю ссылки и не пересчитываю официальный прогноз; исходная оценка остаётся ${e.probabilities[0]}%.`;
  if (/празд|инстаграм|instagram|отдых|вечерин|алког/.test(q))
    return e.factors.find((f) => f.id === "social").observed;
  if (/трав|состав|замен/.test(q))
    return (
      e.factors.find((f) => f.id === "roster").observed +
      " Поправка для первого участника: −2 процентных пункта."
    );
  if (/сч[её]т|сейчас|ид[её]т/.test(q))
    return e.score
      ? `Счёт в демонстрационном снимке: ${e.score}. ${e.status === "past" ? "Матч завершён." : "Это фиксированный счёт, он не обновляется в реальном времени."} Прогноз сохранён до начала матча: ${e.pick}, ${e.probabilities[0]}%. Текущий счёт не использовался для пересчёта прошлой оценки.`
      : "Матч ещё не начался в демосценарии. Доступен предматчевый прогноз; онлайн-счёт не подключён.";
  if (/процент|вероят|почему|оценк|шанс|расч[её]т/.test(q))
    return `Оценка ${e.home}: базовые ${e.base[0]}% ${e.factors
      .filter((f) => f.delta)
      .map(
        (f) =>
          `${f.delta > 0 ? "+" : "−"} ${Math.abs(f.delta)} п.п. (${f.name.toLowerCase()})`,
      )
      .join(
        " ",
      )} = ${e.probabilities[0]}%. Это иллюстративная схема, а не обученная и проверенная модель. Остальные исходы: ${e.labels
      .slice(1)
      .map((l, i) => `${l} ${e.probabilities[i + 1]}%`)
      .join(", ")}.`;
  if (/встреч|истори|форм|источник|данн/.test(q))
    return `Для этого матча в демо собраны: ${e.factors
      .slice(0, 4)
      .map((f) => f.source.toLowerCase())
      .join(
        ", ",
      )}. В каждом факторе дашборда есть размер выборки и дата. Реальная загрузка открытых источников пока не подключена.`;
  return `В демо я могу объяснить расчёт для ${e.home} — ${e.away}, форму, состав и риски. Ваш вопрос сохранён в этом чате, но свободная AI-модель пока не подключена. Попробуйте «Почему такая вероятность?» или опишите свою гипотезу начиная с «Если…».`;
}
