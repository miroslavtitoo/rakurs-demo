// Demo fixtures for a visual dashboard. Probabilities are illustrative scenario
// weights, not calculated from the quoted odds or a live forecasting model.
export function getMatchInsights(event) {
  const cs = event.sport === "CS2";
  const home = event.probability;
  const draw = cs ? 0 : 25;
  const market = (id, label, value, odds, color, note) => ({ id, label, value, odds, color, note });
  return {
    outcomes: [
      market("home", event.home, home, event.odds, "#d7fa77", "Форма и комфортный игровой сценарий на стороне первой команды."),
      ...(!cs ? [market("draw", "Ничья", draw, 3.45, "#d7c195", "Равный темп и осторожное начало могут сохранить паритет.")] : []),
      market("away", event.away, 100 - home - draw, event.awayOdds, "#b4b0ef", "Альтернативный сценарий зависит от адаптации соперника."),
    ],
    groups: {
      "Тоталы": [
        market("over", cs ? "Больше 2,5 карт" : "Больше 2,5 голов", 57 + event.index % 5, 1.86, "#92cbd5", cs ? "Серия дойдёт до третьей карты." : "В основное время будет минимум три гола."),
        market("under", cs ? "Меньше 2,5 карт" : "Меньше 2,5 голов", 43 - event.index % 5, 1.98, "#d7c195", cs ? "Матч завершится за две карты." : "В основное время будет не больше двух голов."),
      ],
      "Сценарии": [
        market("scenario-a", cs ? "Первая карта: П1" : "Обе забьют: да", cs ? home + 3 : 54, 1.91, "#a6c7ee", cs ? "Первая команда заберёт стартовую карту." : "Каждая команда забьёт хотя бы один гол."),
        market("scenario-b", cs ? "Фора П1 −1,5 карты" : "Угловые: больше 9,5", cs ? 34 : 61, cs ? 2.65 : 1.79, "#d6a6bb", cs ? "Первая команда выиграет серию со счётом 2:0." : "Общий тотал угловых обеих команд — 10 или больше."),
      ],
    },
    metrics: cs ? [
      ["Серии · последние 5", "4 / 5", "3 / 5", 80, 60],
      ["Открывающие дуэли", "54%", "49%", 54, 49],
      ["Победы на Mirage", "75%", "50%", 75, 50],
    ] : [
      ["Ожидаемые голы · xG", "1,8", "1,3", 72, 52],
      ["Владение мячом", "56%", "44%", 56, 44],
      ["Удары в створ", "5,2", "3,8", 65, 48],
    ],
  };
}

export function marketLine(event, market) {
  if (market.id === "home") return event.line;
  const direction = market.id === "away" || market.id === "under" ? -1 : 1;
  return event.line.map(value => Number((market.odds + (value - event.odds) * direction * .7).toFixed(2)));
}
