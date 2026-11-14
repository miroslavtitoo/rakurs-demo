// Client-side profile adapter only. Verify signed initData on the backend before release.
export function isTelegramAccount(value) {
  return Boolean(
    value?.method === "telegram" &&
      Number.isSafeInteger(value.telegramId) &&
      value.telegramId > 0 &&
      typeof value.name === "string" &&
      value.name.trim(),
  );
}

export function telegramAccount(tg) {
  const peer = tg?.initDataUnsafe?.user;
  if (!Number.isSafeInteger(peer?.id) || peer.id <= 0) return null;
  const name = [peer.first_name, peer.last_name]
    .filter((part) => typeof part === "string" && part.trim())
    .join(" ").trim() || (typeof peer.username === "string" && peer.username.trim()) || "Участник";
  return { name, telegramId: peer.id, method: "telegram", avatar: "avatar" };
}

// Callback reports consent only. The phone itself arrives at the bot backend.
export function requestTelegramContact(tg, complete) {
  if (!tg?.isVersionAtLeast?.("6.9") || typeof tg.requestContact !== "function") {
    complete("unsupported");
    return;
  }
  try {
    tg.requestContact((shared) => complete(shared ? "shared" : "declined"));
  } catch {
    complete("error");
  }
}
