// DevNotes runtime configuration.
// Production uses the same-origin /api path, which Vercel proxies to the Render API.
(() => {
  const local = /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname);
  if (!window.DEVNOTES_API_BASE) {
    window.DEVNOTES_API_BASE = local
      ? "http://127.0.0.1:5000/api"
      : "/api";
  }
  window.DEVNOTES_CLIENT_ORIGIN = window.DEVNOTES_CLIENT_ORIGIN || window.location.origin;
  window.DEVNOTES_LOGIN_ORIGIN = window.DEVNOTES_LOGIN_ORIGIN || window.location.origin;
})();
