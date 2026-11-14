export function isTelegramWebApp(tg = window.Telegram?.WebApp) {
  return Boolean(
    tg && (tg.initData || (tg.platform && tg.platform !== "unknown")),
  );
}

export function initTelegram() {
  const tg = window.Telegram?.WebApp;
  if (!isTelegramWebApp(tg)) return () => {};
  const supports = (version) => Boolean(tg.isVersionAtLeast?.(version));
  const call = (method, ...args) => {
    try {
      tg[method]?.(...args);
    } catch {
      /* Older/unsupported hosts retain the expanded fallback. */
    }
  };
  let fullscreenUnsupported = false;
  function update() {
    const safe = tg.safeAreaInset || {},
      content = tg.contentSafeAreaInset || {};
    for (const edge of ["top", "bottom", "left", "right"]) {
      document.documentElement.style.setProperty(
        `--tg-${edge}`,
        `${Math.max(0, safe[edge] || 0) + Math.max(0, content[edge] || 0)}px`,
      );
    }
    document.documentElement.dataset.tgFullscreen = tg.isFullscreen
      ? "true"
      : "false";
  }
  function enter() {
    call("expand");
    if (supports("7.7")) call("disableVerticalSwipes");
    if (supports("8.0") && !tg.isFullscreen && !fullscreenUnsupported)
      call("requestFullscreen");
    update();
  }
  function failed(event) {
    if (event?.error === "UNSUPPORTED") fullscreenUnsupported = true;
    update();
  }
  const events = {
    safeAreaChanged: update,
    contentSafeAreaChanged: update,
    viewportChanged: update,
    fullscreenChanged: update,
    fullscreenFailed: failed,
    activated: enter,
  };
  for (const [name, handler] of Object.entries(events))
    call("onEvent", name, handler);
  call("ready");
  if (supports("6.1")) {
    const color = supports("6.9") ? "#080b20" : "bg_color";
    call("setHeaderColor", color);
    call("setBackgroundColor", color);
  }
  if (supports("7.10")) call("setBottomBarColor", "#080b20");
  enter();
  return () => {
    for (const [name, handler] of Object.entries(events))
      call("offEvent", name, handler);
  };
}
export function haptic() {
  const tg = window.Telegram?.WebApp;
  if (isTelegramWebApp(tg) && tg.isVersionAtLeast?.("6.1"))
    tg.HapticFeedback?.selectionChanged();
}
