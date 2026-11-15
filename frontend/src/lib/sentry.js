// Optional error reporting (F0-9). Does nothing unless REACT_APP_SENTRY_DSN is set at build time;
// the SDK is loaded lazily so builds without a DSN never download it.
const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const SENSITIVE = /password|passwd|secret|token|authorization|cookie|api_?key|email/i;

export function scrub(value, key) {
  if (key && SENSITIVE.test(String(key))) return "[Filtered]";
  if (Array.isArray(value)) return value.map((v) => scrub(v));
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, scrub(v, k)]));
  }
  if (typeof value === "string") return value.replace(EMAIL, "[Filtered]");
  return value;
}

export function beforeSend(event) {
  const id = event.user && event.user.id;
  event.user = id ? { id } : {};
  return scrub(event);
}

export function initSentry() {
  const dsn = process.env.REACT_APP_SENTRY_DSN;
  if (!dsn) return;
  import("@sentry/react")
    .then((Sentry) => {
      Sentry.init({
        dsn,
        environment: process.env.REACT_APP_SENTRY_ENVIRONMENT || process.env.NODE_ENV,
        tracesSampleRate: 0,
        sendDefaultPii: false,
        beforeSend,
      });
    })
    .catch(() => {});
}
