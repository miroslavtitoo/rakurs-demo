export const SNAPSHOT = "5 октября 2026, 14:30 МСК";
export const authors = [
  {
    id: "mark",
    name: "Марк Волков",
    initials: "МВ",
    handle: "@mark.reads",
    sport: "CS2",
    role: "Читает игру между раундами",
    color: "#ece5d7",
    bio: "Разбираю экономику раундов, карту за картой. Смотрю на качество соперников и устойчивость состава, а не только на последние победы.",
    price: 1490,
  },
  {
    id: "anna",
    name: "Анна Миронова",
    initials: "АМ",
    handle: "@anna.tactics",
    sport: "Футбол",
    role: "Тактика важнее громких имён",
    color: "#e3e8dc",
    bio: "Объясняю футбол через пространство, прессинг и качество моментов. В каждом материале — основной сценарий и условия, при которых он перестаёт работать.",
    price: 1290,
  },
  {
    id: "lev",
    name: "Лев Орлов",
    initials: "ЛО",
    handle: "@lev.data",
    sport: "CS2",
    role: "Данные. Карты. Контекст.",
    color: "#e3e5ee",
    bio: "Изучаю пул карт и влияние замен на командную игру. Отделяю устойчивые закономерности от шума коротких серий.",
    price: 1190,
  },
  {
    id: "nika",
    name: "Ника Белова",
    initials: "НБ",
    handle: "@nika.pitch",
    sport: "Футбол",
    role: "Большая картина в деталях",
    color: "#f0ded6",
    bio: "Слежу за темпом, стандартами и изменением тактики по ходу матча. Открыто веду историю удачных и неудачных оценок.",
    price: 990,
  },
];
const rows = [
  [
    "fox-metro",
    "CS2",
    "Northern Foxes",
    "Metro Five",
    "NF",
    "M5",
    "18:00",
    "today",
    "Northern League • BO3",
    1.82,
    2.04,
    "mark",
  ],
  [
    "atlas-river",
    "Футбол",
    "Атлас",
    "Ривер Юнайтед",
    "AT",
    "RU",
    "19:30",
    "today",
    "Премьер-дивизион • 12-й тур",
    2.12,
    3.2,
    "anna",
  ],
  [
    "nova-pulse",
    "CS2",
    "Nova Esports",
    "Pulse",
    "NV",
    "PL",
    "20:00",
    "today",
    "Continental Cup • BO3",
    1.74,
    2.18,
    "lev",
  ],
  [
    "porto-royal",
    "Футбол",
    "Порто Норд",
    "Роял Сити",
    "PN",
    "RC",
    "21:00",
    "today",
    "Национальная лига • 8-й тур",
    1.95,
    3.6,
    "nika",
  ],
  [
    "ember-frost",
    "CS2",
    "Ember",
    "Frost Union",
    "EM",
    "FR",
    "21:30",
    "today",
    "Northern League • BO3",
    2.05,
    1.8,
    "mark",
  ],
  [
    "united-east",
    "Футбол",
    "Юнион",
    "Истборн",
    "UN",
    "EA",
    "22:00",
    "today",
    "Премьер-дивизион • 12-й тур",
    2.3,
    2.85,
    "anna",
  ],
  [
    "vertex-echo",
    "CS2",
    "Vertex",
    "Echo Club",
    "VX",
    "EC",
    "17:00",
    "tomorrow",
    "Continental Cup • BO3",
    1.9,
    1.95,
    "lev",
  ],
  [
    "aurora-south",
    "Футбол",
    "Аврора",
    "Саут Парк",
    "AU",
    "SP",
    "18:30",
    "tomorrow",
    "Национальная лига • 9-й тур",
    2.05,
    3.3,
    "nika",
  ],
  [
    "orbit-zenith",
    "CS2",
    "Orbit",
    "Zenith",
    "OR",
    "ZN",
    "20:00",
    "tomorrow",
    "Northern League • BO3",
    2.12,
    1.76,
    "mark",
  ],
  [
    "west-athletic",
    "Футбол",
    "Вест Хилл",
    "Атлетик",
    "WH",
    "AC",
    "21:00",
    "tomorrow",
    "Премьер-дивизион • 13-й тур",
    1.85,
    3.85,
    "anna",
  ],
  [
    "fox-echo",
    "CS2",
    "Northern Foxes",
    "Echo Club",
    "NF",
    "EC",
    "2 : 1",
    "finished",
    "Northern League • Завершён",
    1.85,
    1.96,
    "mark",
  ],
  [
    "atlas-aurora",
    "Футбол",
    "Атлас",
    "Аврора",
    "AT",
    "AU",
    "1 : 1",
    "finished",
    "Премьер-дивизион • Завершён",
    2.1,
    3.2,
    "anna",
  ],
];
export const events = rows.map((r, i) => ({
  id: r[0],
  sport: r[1],
  home: r[2],
  away: r[3],
  homeCode: r[4],
  awayCode: r[5],
  time: r[6],
  day: r[7],
  league: r[8],
  odds: r[9],
  awayOdds: r[10],
  authorId: r[11],
  index: i,
  analyses: 2,
  form: i % 2 === 0 ? ["W", "W", "L", "W", "W"] : ["W", "D", "W", "L", "W"],
  probability: 58 - (i % 4) * 2,
  line: [r[9] + 0.18, r[9] + 0.12, r[9] + 0.15, r[9] + 0.06, r[9] + 0.08, r[9]],
  date:
    r[7] === "tomorrow"
      ? "6 октября"
      : r[7] === "finished"
        ? "4 октября"
        : "5 октября",
}));
const primaryMaterials = events.map((e, i) => ({
  id: "read-" + e.id,
  eventId: e.id,
  authorId: e.authorId,
  title:
    e.sport === "CS2"
      ? `${e.home}: что решит выбор карт`
      : `${e.home}: где искать преимущество`,
  price: i === 3 ? 0 : 390 + (i % 3) * 100,
  market: e.sport === "CS2" ? "Победа в серии" : "Победа в матче",
  selection: e.home,
  published: e.day === "finished" ? "3 октября, 12:40" : "5 октября, 12:40",
  summary:
    e.sport === "CS2"
      ? "За серией побед легко не заметить главное: команды по-разному чувствуют себя на решающей карте. Сравниваем пул и разбираем два сценария veto."
      : "Форма — только начало истории. Разбираемся, как прессинг и игра на флангах влияют на качество моментов и темп встречи.",
}));
export const materials = primaryMaterials.flatMap((m) => {
  const e = events.find((e) => e.id === m.eventId);
  const other = authors.find((a) => a.sport === e.sport && a.id !== m.authorId);
  return [
    m,
    {
      ...m,
      id: m.id + "-alternative",
      authorId: other.id,
      title:
        e.sport === "CS2"
          ? `${e.away}: другой взгляд на пул карт`
          : `${e.away}: пространство для контригры`,
      price: 490,
      summary:
        e.sport === "CS2"
          ? "Форма хозяев заметна, но пока не выбран пул карт, перевес нельзя считать устойчивым. Разбираю условия, при которых соперник сможет навязать свою игру."
          : "Атакующий темп хозяев открывает зоны для гостей. Рассматриваю альтернативный сценарий и объясняю, какие изменения состава усилят контригру.",
      body:
        e.sport === "CS2"
          ? `Для ${e.away} ключевым остаётся комфортный выбор карты. До завершения veto я не делаю окончательный выбор: преимущество по форме может исчезнуть на неудобном пуле.`
          : `Для ${e.away} важен быстрый выход из-под прессинга. Я жду подтверждения состава: скорость флангов определит, удастся ли превратить свободное пространство в моменты.`,
      selection: "Оценка после подтверждения вводных",
    },
  ];
});
export const archive = authors.flatMap((a, ai) =>
  Array.from({ length: 24 }, (_, i) => {
    const outcome = [
      "win",
      "loss",
      "win",
      "void",
      "win",
      "loss",
      "win",
      "loss",
    ][(i + ai * 2) % 8];
    const odds = Number((1.78 + (i % 5) * 0.12 + ai * 0.03).toFixed(2));
    return {
      id: `${a.id}-${i}`,
      authorId: a.id,
      daysAgo: 2 + i * 5,
      date: new Date(Date.UTC(2026, 9, 5 - i * 5 - 2))
        .toISOString()
        .slice(0, 10),
      title:
        a.sport === "CS2"
          ? [
              "Northern Foxes — Echo Club",
              "Nova — Metro Five",
              "Ember — Pulse",
            ][i % 3]
          : ["Атлас — Аврора", "Юнион — Роял Сити", "Истборн — Атлетик"][i % 3],
      market: a.sport === "CS2" ? "Победа в серии" : "Тотал больше 2,5",
      odds,
      stake: 1,
      outcome,
      profit:
        outcome === "win"
          ? Number((odds - 1).toFixed(2))
          : outcome === "loss"
            ? -1
            : 0,
    };
  }),
);
export function getStats(id, period = 90) {
  const picks = archive.filter((p) => p.authorId === id && p.daysAgo <= period);
  const profit = picks.reduce((n, p) => n + p.profit, 0);
  const stake = picks.reduce((n, p) => n + p.stake, 0);
  let balance = 0,
    peak = 0,
    drawdown = 0;
  const curve = [
    0,
    ...[...picks].reverse().map((p) => {
      balance += p.profit;
      peak = Math.max(peak, balance);
      drawdown = Math.max(drawdown, peak - balance);
      return Number(balance.toFixed(2));
    }),
  ];
  return {
    picks,
    profit,
    roi: stake ? (profit / stake) * 100 : 0,
    count: picks.length,
    wins: picks.filter((p) => p.outcome === "win").length,
    losses: picks.filter((p) => p.outcome === "loss").length,
    voids: picks.filter((p) => p.outcome === "void").length,
    average: stake ? picks.reduce((n, p) => n + p.odds, 0) / picks.length : 0,
    drawdown,
    curve,
  };
}
export const money = (n) => n.toLocaleString("ru-RU") + " ₽";
export const signed = (n, d = 1) =>
  (n > 0 ? "+" : "") + n.toFixed(d).replace(".", ",");
export function canRead(material, purchases, subscriptions) {
  return (
    material.price === 0 ||
    purchases.includes(material.id) ||
    subscriptions.includes(material.authorId)
  );
}
export function getMatchContext(e) {
  const cs = e.sport === "CS2";
  return {
    factors: cs
      ? [
          `${e.home} выиграли 4 из 5 последних серий в демонстрационной выборке.`,
          `На Mirage преимущество по пулу у ${e.home}; на Nuke — у ${e.away}.`,
          "Оба состава стабильны. Формат BO3 снижает влияние одной неудачной карты.",
        ]
      : [
          `${e.home} создаёт 1,8 ожидаемого гола за матч в демонстрационной выборке.`,
          `${e.away} допускает свободные зоны за линией прессинга.`,
          "У хозяев 3 победы в последних 5 встречах; домашняя выборка ограничена.",
        ],
    risk: cs
      ? "Veto ещё не завершено. Выбор первой карты способен изменить оценку серии."
      : "Стартовые составы не подтверждены. Ротация в центре поля способна изменить темп игры.",
    disagreement: cs
      ? "Марк отдаёт преимущество хозяевам по форме. Лев считает важнее удобство карт и ждёт veto. Оба обсуждают победу в серии, но по-разному взвешивают факторы."
      : "Анна выделяет преимущество хозяев в прессинге. Ника осторожнее: открытые фланги дают гостям возможность для контратак. Обе оценки относятся к победе в матче.",
  };
}
