import { events } from "./data.js";

// Fictional product fixtures. Nothing here is a live AI model or a betting feed.
export const forecasts = events
  .filter((e) => e.day !== "finished")
  .map((event, i) => {
    const cs = event.sport === "CS2";
    const total = i % 3 === 1;
    return {
      id: event.id,
      event,
      type: total ? "Тотал" : "Победитель",
      pick: total
        ? cs
          ? "Будет 3 карты"
          : "Будет минимум 3 гола"
        : `Победа ${event.home}`,
      short: total
        ? cs
          ? "Тотал карт больше 2,5"
          : "Тотал голов больше 2,5"
        : `${event.home} — победа`,
      probability: total ? 61 - (i % 4) : event.probability,
      odds: total ? 1.86 : event.odds,
      price: i === 3 ? 0 : 390,
      reason: total
        ? cs
          ? "Обе команды сильны на своей карте. AI ожидает решающую третью."
          : "Команды создают много моментов. AI ожидает результативный матч."
        : cs
          ? `${event.home} выиграли 4 из 5 последних серий и лучше играют на ключевых картах.`
          : `${event.home} создают больше голевых моментов и чаще контролируют игру.`,
      condition: total
        ? cs
          ? "Прогноз сбудется, если серия дойдёт до третьей карты. Счёт 2:0 или 0:2 означает проигрыш прогноза."
          : "Прогноз сбудется, если команды забьют вместе 3 гола или больше за основное время. Дополнительное время не учитывается."
        : cs
          ? `Прогноз сбудется, если ${event.home} выиграют серию: 2:0 или 2:1.`
          : `Прогноз сбудется, если ${event.home} победят за основное время. Ничья и поражение означают проигрыш прогноза.`,
      risk: cs
        ? "Неудобный выбор карт или замена в составе могут изменить преимущество."
        : "Изменения стартового состава или раннее удаление могут изменить ход матча.",
      factors: cs
        ? [
            ["Форма", "4 из 5", "побед у первой команды", 80],
            ["Карты", "75%", "побед на комфортной карте", 75],
            ["Соперник", "3 из 5", "побед у второй команды", 60],
          ]
        : [
            ["Атака", "1,8", "ожидаемых гола у первой команды", 72],
            ["Контроль", "56%", "среднее владение мячом", 56],
            ["Соперник", "1,3", "ожидаемых гола у второй команды", 52],
          ],
    };
  });

export const results = Array.from({ length: 12 }, (_, i) => {
  const forecast = forecasts[i % forecasts.length];
  return {
    id: `ai-result-${i}`,
    forecast,
    date: `${4 - Math.floor(i / 4)} октября`,
    outcome: [
      "win",
      "loss",
      "win",
      "win",
      "loss",
      "void",
      "win",
      "loss",
      "win",
      "win",
      "loss",
      "win",
    ][i],
  };
});
export function resultSummary(rows) {
  const wins = rows.filter((r) => r.outcome === "win").length;
  const losses = rows.filter((r) => r.outcome === "loss").length;
  const voids = rows.length - wins - losses;
  return {
    wins,
    losses,
    voids,
    rate: wins + losses ? Math.round((wins / (wins + losses)) * 100) : 0,
  };
}
export function hasForecast(id, purchases, oldPurchases = []) {
  return purchases.includes(id) || oldPurchases.includes(`read-${id}`);
}
export function marketRoute(raw) {
  if (raw === "/analysts" || raw === "/studio" || raw.startsWith("/author/"))
    return "/";
  if (raw.startsWith("/read/read-"))
    return "/match/" + raw.slice(11).replace(/-alternative$/, "");
  return raw;
}
