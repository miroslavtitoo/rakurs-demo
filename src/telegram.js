export function initTelegram() {
  const tg = window.Telegram?.WebApp;
  if (!tg?.initData) return () => {};
  tg.ready();
  tg.expand();
  if (tg.isVersionAtLeast?.("6.1")) {
    tg.setHeaderColor("#ffffff");
    tg.setBackgroundColor("#f7f8fa");
  }
  if (tg.isVersionAtLeast?.("7.10")) tg.setBottomBarColor("#ffffff");
  function update() {
    const safe = tg.safeAreaInset || {},
      content = tg.contentSafeAreaInset || {};
    document.documentElement.style.setProperty(
      "--tg-top",
      `${(safe.top || 0) + (content.top || 0)}px`,
    );
    document.documentElement.style.setProperty(
      "--tg-bottom",
      `${safe.bottom || 0}px`,
    );
  }
  update();
  tg.onEvent("safeAreaChanged", update);
  tg.onEvent("contentSafeAreaChanged", update);
  return () => {
    tg.offEvent("safeAreaChanged", update);
    tg.offEvent("contentSafeAreaChanged", update);
  };
}
export function haptic() {
  const t = window.Telegram?.WebApp;
  if (t?.initData && t.isVersionAtLeast?.("6.1"))
    t.HapticFeedback.selectionChanged();
}
