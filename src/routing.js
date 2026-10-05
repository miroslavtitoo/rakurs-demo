// Telegram shares the URL fragment with our hash router. Read only the app
// path, without rewriting the fragment: the SDK still needs its launch data.
export function routeFromHash(hash) {
  const value = hash.replace(/^#/, "");
  if (!value) return "/";
  if (value.startsWith("/")) return value.split(/[?&]/, 1)[0];

  const params = new URLSearchParams(value.replace(/^\?/, ""));
  if (value.includes("=") && [...params.keys()].some((key) => key.startsWith("tgWebApp"))) {
    return "/";
  }
  // Keep genuine unknown routes visible instead of silently hiding bad links.
  return value;
}
