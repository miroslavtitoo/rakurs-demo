import React from "react";

// Original identities for the fictional demo teams. Colours follow the team,
// not its home/away position, so the same club stays recognisable everywhere.
const identities = {
  NF: ["Northern Foxes", "#e8b48a", <><path d="M7 7 18 14h12L41 7l-4 24-13 11L11 31Z" fill="currentColor"/><path d="m11 17 11 10-8 1 10 9 10-9-8-1 11-10-5 16-8 8-8-8Z" fill="#24272b"/><path d="m16 20 5 3m6 0 5-3" stroke="#24272b" strokeWidth="2.5"/></>],
  M5: ["Metro Five", "#b7aff2", <><path d="m24 5 6 12 13 2-10 10 2 14-11-7-12 7 2-14L4 19l14-2Z" fill="currentColor"/><path d="m14 26 10-12 10 12-10 7Z" fill="#252333"/><path d="m18 26 6-7 6 7-6 4Z" fill="currentColor"/></>],
  AT: ["Атлас", "#9dbcef", <><circle cx="24" cy="24" r="17"/><ellipse cx="24" cy="24" rx="8" ry="17"/><path d="M8 19h32M8 29h32M24 7v34"/></>],
  RU: ["Ривер Юнайтед", "#88c9c0", <><path d="M10 8h28v19c0 8-14 15-14 15S10 35 10 27Z"/><path d="M14 19c7-8 13 8 20 0M14 27c7-8 13 8 20 0"/></>],
  NV: ["Nova Esports", "#a9afea", <><path d="m24 4 5 14 15 6-15 5-5 15-6-15-14-5 14-6Z" fill="currentColor"/><circle cx="24" cy="24" r="4" fill="#232536"/></>],
  PL: ["Pulse", "#d49eb9", <><path d="m5 26 10 0 5-14 8 25 5-17 4 6h6" strokeWidth="4"/><path d="M12 8h24M12 42h24" opacity=".35"/></>],
  PN: ["Порто Норд", "#96c4e1", <><path d="m24 6 8 7H16Z" fill="currentColor"/><path d="M19 16h10l5 22H14ZM10 42h28M8 18l5-2m22 0 5 2M19 25h10"/><path d="M22 17h4v6h-4Z" fill="currentColor"/></>],
  RC: ["Роял Сити", "#ddc88e", <><path d="m8 14 9 9 7-15 7 15 9-9-4 21H12Z" fill="currentColor"/><path d="M13 41h22"/><circle cx="24" cy="28" r="3" fill="#302b20"/></>],
  EM: ["Ember", "#e8a58b", <><path d="M26 5c3 13-7 13-5 21 5-1 8-6 10-10 16 19 2 29-9 27C8 40 5 28 15 18c0 7 2 9 4 10C14 15 26 13 26 5Z" fill="currentColor"/><path d="M25 28c-9 7-4 13 0 13s7-6 0-13Z" fill="#382820"/></>],
  FR: ["Frost Union", "#9dd5e5", <><path d="M24 5v38M8 14l32 20M8 34l32-20M18 8l6 6 6-6M18 40l6-6 6 6M8 21l8-2-2-8M34 37l-2-8 8-2M8 27l8 2-2 8M34 11l-2 8 8 2"/></>],
  UN: ["Юнион", "#c8baed", <><path d="M9 10v19a11 11 0 0 0 22 0V10M17 10v19a11 11 0 0 0 22 0V10" strokeWidth="4"/></>],
  EA: ["Истборн", "#e2bd8a", <><path d="M6 31h36M10 37h28M16 43h16M13 28a11 11 0 0 1 22 0M24 5v7M8 12l5 5M40 12l-5 5"/><path d="M18 28a6 6 0 0 1 12 0Z" fill="currentColor"/></>],
  VX: ["Vertex", "#a8d3bb", <><path d="M24 5 44 41H4Z"/><path d="m24 17 12 21H12Z" fill="currentColor"/><path d="m24 27 5 9H19Z" fill="#26342f"/></>],
  EC: ["Echo Club", "#c0b4de", <><path d="M14 17a10 10 0 0 1 0 14M22 10a20 20 0 0 1 0 28M30 4a28 28 0 0 1 0 40" strokeWidth="4"/><circle cx="9" cy="24" r="3" fill="currentColor" stroke="none"/></>],
  AU: ["Аврора", "#b7d9c4", <><path d="M8 32 16 9v29L24 5v37L32 9v29l8-22" strokeWidth="3"/></>],
  SP: ["Саут Парк", "#a8c895", <><path d="m24 5 14 16h-7l10 14H7l10-14h-7Z" fill="currentColor"/><path d="M24 24v19" stroke="#243124" strokeWidth="3"/></>],
  OR: ["Orbit", "#97bedc", <><ellipse cx="24" cy="24" rx="21" ry="9" transform="rotate(-35 24 24)"/><circle cx="24" cy="24" r="10"/><circle cx="39" cy="12" r="4" fill="currentColor" stroke="#25303c" strokeWidth="2"/></>],
  ZN: ["Zenith", "#d5c7a8", <><path d="m6 38 18-26 18 26Z"/><path d="m17 28 7-16 7 16-7-4Z" fill="currentColor"/><path d="M24 3v3M8 8l4 4M40 8l-4 4"/></>],
  WH: ["Вест Хилл", "#b6c69d", <><path d="M5 36 18 17l9 12 5-7 11 14ZM10 42h28"/><circle cx="32" cy="11" r="5" fill="currentColor" stroke="none"/></>],
  AC: ["Атлетик", "#dea6a2", <><path d="m24 14 7 8 13-10-5 17-15 12L9 29 4 12l13 10Z" fill="currentColor"/><path d="m14 29 10 6 10-6M24 20v15" stroke="#35292a"/><circle cx="24" cy="8" r="3" fill="currentColor" stroke="none"/></>],
};

export default function TeamMark({ code, away = false }) {
  const [name, color, art] = identities[code] || ["Команда", "#b8c4cf", <circle cx="24" cy="24" r="14" />];
  return <span className={`team-mark${away ? " away" : ""}`} style={{ "--team-color": color }} title={name} aria-hidden="true">
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">{art}</svg>
  </span>;
}
