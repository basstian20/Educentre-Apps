"""Observability (F0-9): structured logs, request IDs and optional Sentry.

* ``configure_logging()`` - JSON log lines on stdout (``LOG_FORMAT=text`` for a readable dev format),
  level from ``LOG_LEVEL`` (default INFO). Uvicorn's own loggers are routed through the same handler.
* ``RequestContextMiddleware`` - gives every request an ``X-Request-ID`` (an incoming one is reused when
  it looks sane), logs one line per request (method, path, status, duration, user_id, request_id) and
  turns unhandled errors into a JSON 500 that carries the request id, so a user report can be matched
  to the log line.
* ``init_sentry()`` - only active when ``SENTRY_DSN`` is set and ``sentry-sdk`` is installed; events are
  scrubbed of emails, passwords, tokens and cookies before they leave the process.

Nothing here imports ``core`` so it can be loaded first without circular imports.
"""
import json
import logging
import os
import re
import sys
import time
import uuid
from contextvars import ContextVar
from typing import Any, Optional

REDACTED = "[Filtered]"
REQUEST_ID_HEADER = "X-Request-ID"
# only accept caller-supplied ids that cannot be used for log injection
_SAFE_REQUEST_ID = re.compile(r"^[A-Za-z0-9._-]{8,64}$")
# health checks are polled constantly by the platform; keep them out of the INFO log
_QUIET_PATHS = {"/api/health"}

request_id_var: ContextVar[Optional[str]] = ContextVar("request_id", default=None)
user_id_var: ContextVar[Optional[str]] = ContextVar("user_id", default=None)

_RESERVED = set(logging.LogRecord("", 0, "", 0, "", (), None).__dict__) | {"message", "asctime"}


class JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        data = {
            "ts": self.formatTime(record, "%Y-%m-%dT%H:%M:%S") + f".{int(record.msecs):03d}Z",
            "level": record.levelname,
            "logger": record.name,
            "msg": record.getMessage(),
        }
        rid = request_id_var.get()
        if rid:
            data["request_id"] = rid
        for key, value in record.__dict__.items():
            if key not in _RESERVED and not key.startswith("_"):
                data[key] = value
        if record.exc_info:
            data["exc"] = self.formatException(record.exc_info)
        return json.dumps(data, default=str, ensure_ascii=False)


def configure_logging() -> None:
    level = getattr(logging, os.environ.get("LOG_LEVEL", "INFO").strip().upper(), logging.INFO)
    handler = logging.StreamHandler(sys.stdout)
    if os.environ.get("LOG_FORMAT", "json").strip().lower() == "text":
        handler.setFormatter(logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s"))
    else:
        handler.setFormatter(JsonFormatter())
    root = logging.getLogger()
    root.handlers[:] = [handler]
    root.setLevel(level)
    for name in ("uvicorn", "uvicorn.error", "uvicorn.access"):
        lg = logging.getLogger(name)
        lg.handlers[:] = []
        lg.propagate = True


# ── request middleware (pure ASGI so contextvars and the response stay under our control) ──
def _user_id_from_headers(headers: dict) -> Optional[str]:
    """Best-effort user id for the log line. Signature is verified; no DB access."""
    token = None
    for part in headers.get(b"cookie", b"").decode("latin-1").split(";"):
        name, _, value = part.strip().partition("=")
        if name == "access_token":
            token = value
    if not token:
        auth = headers.get(b"authorization", b"").decode("latin-1")
        if auth.startswith("Bearer "):
            token = auth[7:]
    if not token:
        return None
    try:
        import auth

        return auth.decode_token(token).get("sub")
    except Exception:
        return None


class RequestContextMiddleware:
    def __init__(self, app):
        self.app = app
        self.log = logging.getLogger("educentre.request")

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        headers = dict(scope["headers"])
        incoming = headers.get(REQUEST_ID_HEADER.lower().encode(), b"").decode("latin-1")
        rid = incoming if _SAFE_REQUEST_ID.match(incoming) else uuid.uuid4().hex
        uid = _user_id_from_headers(headers)
        rid_token = request_id_var.set(rid)
        uid_token = user_id_var.set(uid)
        _sentry_context(rid, uid)

        started = time.perf_counter()
        state = {"status": 500, "started": False}

        async def send_wrapper(message):
            if message["type"] == "http.response.start":
                state["status"] = message["status"]
                state["started"] = True
                message.setdefault("headers", [])
                message["headers"] = [*message["headers"], (REQUEST_ID_HEADER.lower().encode(), rid.encode())]
            await send(message)

        try:
            await self.app(scope, receive, send_wrapper)
        except Exception as exc:
            self.log.exception("Unhandled error", extra={"path": scope["path"]})
            _sentry_capture(exc)
            if state["started"]:
                raise  # headers already sent; nothing sane left to answer with
            state["status"] = 500
            body = json.dumps({"detail": "Internal server error", "request_id": rid}).encode()
            await send({"type": "http.response.start", "status": 500, "headers": [
                (b"content-type", b"application/json"),
                (b"content-length", str(len(body)).encode()),
                (REQUEST_ID_HEADER.lower().encode(), rid.encode()),
            ]})
            await send({"type": "http.response.body", "body": body})
        finally:
            duration_ms = round((time.perf_counter() - started) * 1000, 1)
            status = state["status"]
            level = logging.ERROR if status >= 500 else logging.WARNING if status >= 400 else logging.INFO
            if scope["path"] in _QUIET_PATHS and status < 400:
                level = logging.DEBUG
            self.log.log(
                level,
                "%s %s %s", scope["method"], scope["path"], status,
                extra={
                    "method": scope["method"], "path": scope["path"], "status": status,
                    "duration_ms": duration_ms, "user_id": uid, "request_id": rid,
                },
            )
            request_id_var.reset(rid_token)
            user_id_var.reset(uid_token)


# ── Sentry (optional) ──
_EMAIL = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")
_SENSITIVE_KEYS = ("password", "passwd", "secret", "token", "authorization", "cookie", "api_key", "apikey", "email")
_sentry = None


def scrub(value: Any, key: Any = None) -> Any:
    """Copy of ``value`` with sensitive keys masked and e-mail addresses blanked out of strings."""
    if key is not None and any(part in str(key).lower() for part in _SENSITIVE_KEYS):
        return REDACTED
    if isinstance(value, dict):
        return {k: scrub(v, k) for k, v in value.items()}
    if isinstance(value, (list, tuple)):
        return [scrub(v) for v in value]
    if isinstance(value, str):
        return _EMAIL.sub(REDACTED, value)
    return value


def _before_send(event, hint):
    user = event.get("user") or {}
    event["user"] = {"id": user["id"]} if user.get("id") else {}  # id only, never email/ip/username
    return scrub(event)


def init_sentry() -> bool:
    """Start Sentry when SENTRY_DSN is set. Returns whether it is active."""
    global _sentry
    dsn = os.environ.get("SENTRY_DSN", "").strip()
    if not dsn:
        return False
    try:
        import sentry_sdk
    except ImportError:
        logging.getLogger("educentre").warning("SENTRY_DSN is set but sentry-sdk is not installed; Sentry disabled")
        return False
    sentry_sdk.init(
        dsn=dsn,
        environment=os.environ.get("SENTRY_ENVIRONMENT", os.environ.get("RAILWAY_ENVIRONMENT_NAME", "production")),
        release=os.environ.get("SENTRY_RELEASE") or os.environ.get("RAILWAY_GIT_COMMIT_SHA") or None,
        traces_sample_rate=float(os.environ.get("SENTRY_TRACES_SAMPLE_RATE", "0") or 0),
        send_default_pii=False,
        before_send=_before_send,
    )
    _sentry = sentry_sdk
    logging.getLogger("educentre").info("Sentry enabled")
    return True


def _sentry_context(request_id: str, user_id: Optional[str]) -> None:
    if _sentry is None:
        return
    _sentry.set_tag("request_id", request_id)
    _sentry.set_user({"id": user_id} if user_id else None)


def _sentry_capture(exc: BaseException) -> None:
    if _sentry is not None:
        _sentry.capture_exception(exc)
