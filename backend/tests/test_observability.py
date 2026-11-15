"""F0-9: request ids, health check, structured logs and Sentry scrubbing."""
import json
import logging
import os
import sys
from pathlib import Path

import requests

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import observability  # noqa: E402

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")
API = f"{BASE_URL}/api"


def test_health_reports_database_ok():
    r = requests.get(f"{API}/health", timeout=30)
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "ok" and body["database"] == "ok"
    assert isinstance(body["uptime_seconds"], int)


def test_health_needs_no_auth_and_leaks_no_details():
    body = requests.get(f"{API}/health", timeout=30).json()
    assert set(body) == {"status", "database", "uptime_seconds"}


def test_response_gets_generated_request_id():
    r = requests.get(f"{API}/", timeout=30)
    rid = r.headers.get("X-Request-ID")
    assert rid and len(rid) >= 8
    assert requests.get(f"{API}/", timeout=30).headers["X-Request-ID"] != rid


def test_safe_incoming_request_id_is_echoed():
    r = requests.get(f"{API}/", headers={"X-Request-ID": "trace-abc-12345"}, timeout=30)
    assert r.headers["X-Request-ID"] == "trace-abc-12345"


def test_unsafe_incoming_request_id_is_replaced():
    r = requests.get(f"{API}/", headers={"X-Request-ID": "bad id\twith spaces"}, timeout=30)
    assert r.headers["X-Request-ID"] != "bad id\twith spaces"


def test_error_responses_also_carry_request_id():
    r = requests.get(f"{API}/auth/me", timeout=30)
    assert r.status_code == 401
    assert r.headers.get("X-Request-ID")
    assert "detail" in r.json()


# ── unit tests (no server needed) ──
def _record(msg="hello", **extra):
    rec = logging.LogRecord("educentre.request", logging.INFO, __file__, 1, msg, (), None)
    rec.__dict__.update(extra)
    return rec


def test_json_formatter_emits_fields_and_request_id():
    token = observability.request_id_var.set("rid-12345678")
    try:
        line = observability.JsonFormatter().format(_record("GET /x 200", status=200, duration_ms=1.5))
    finally:
        observability.request_id_var.reset(token)
    data = json.loads(line)
    assert data["level"] == "INFO" and data["msg"] == "GET /x 200"
    assert data["status"] == 200 and data["duration_ms"] == 1.5
    assert data["request_id"] == "rid-12345678"


def test_json_formatter_includes_traceback():
    try:
        raise ValueError("boom")
    except ValueError:
        rec = logging.LogRecord("x", logging.ERROR, __file__, 1, "failed", (), sys.exc_info())
    assert "ValueError: boom" in json.loads(observability.JsonFormatter().format(rec))["exc"]


def test_scrub_masks_pii():
    event = {
        "request": {"headers": {"Authorization": "Bearer abc", "Cookie": "access_token=x"}, "data": {"password": "pw", "name": "Budi"}},
        "message": "login failed for budi@example.com",
        "extra": {"reset_token": "t", "list": ["a@b.id"]},
    }
    out = observability.scrub(event)
    assert out["request"]["headers"] == {"Authorization": "[Filtered]", "Cookie": "[Filtered]"}
    assert out["request"]["data"] == {"password": "[Filtered]", "name": "Budi"}
    assert "budi@example.com" not in out["message"]
    assert out["extra"]["reset_token"] == "[Filtered]" and out["extra"]["list"] == ["[Filtered]"]


def test_before_send_keeps_only_user_id():
    ev = observability._before_send({"user": {"id": "u1", "email": "a@b.id", "ip_address": "1.2.3.4"}}, {})
    assert ev["user"] == {"id": "u1"}


def test_sentry_stays_off_without_dsn(monkeypatch):
    monkeypatch.delenv("SENTRY_DSN", raising=False)
    assert observability.init_sentry() is False


def _run_asgi(app, path="/boom"):
    import asyncio

    sent = []

    async def receive():
        return {"type": "http.request", "body": b"", "more_body": False}

    async def send(message):
        sent.append(message)

    scope = {"type": "http", "method": "GET", "path": path, "headers": []}
    asyncio.run(observability.RequestContextMiddleware(app)(scope, receive, send))
    return sent


def test_unhandled_error_becomes_json_500_with_request_id(caplog):
    async def app(scope, receive, send):
        raise RuntimeError("kaboom")

    with caplog.at_level(logging.ERROR):
        start, body = _run_asgi(app)
    assert start["status"] == 500
    headers = dict(start["headers"])
    payload = json.loads(body["body"])
    assert payload["detail"] == "Internal server error"
    assert headers[b"x-request-id"].decode() == payload["request_id"]
    assert "kaboom" not in body["body"].decode()  # internals never reach the client
    assert any(r.exc_info for r in caplog.records)  # traceback is logged
