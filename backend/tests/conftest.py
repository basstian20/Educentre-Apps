"""Pytest bootstrap: run the API against an isolated test database.

By default the suite starts its own uvicorn process on a free port, pointed at a dedicated
database (``edu_test``) so it can never touch the demo/production data in ``edu_db``. The
database is dropped again when the session ends.

Environment variables
---------------------
REACT_APP_BACKEND_URL  Test an already-running server instead (nothing is started or dropped).
MONGO_URL              MongoDB to use. Falls back to backend/.env, then mongodb://localhost:27017.
TEST_DB_NAME           Override the throw-away database name (must contain "test").
"""
import os
import socket
import subprocess
import sys
import tempfile
import time
from pathlib import Path

import pytest
import requests
from dotenv import dotenv_values

BACKEND_DIR = Path(__file__).resolve().parent.parent
TEST_JWT_SECRET = "test-only-secret-not-for-production"

_state = {"proc": None, "log": None, "mongo_url": None, "db_name": None}


def _free_port() -> int:
    with socket.socket() as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


def _resolve_mongo_url() -> str:
    if os.environ.get("MONGO_URL"):
        return os.environ["MONGO_URL"]
    env_file = BACKEND_DIR / ".env"
    if env_file.exists():
        url = dotenv_values(env_file).get("MONGO_URL")
        if url:
            return url
    return "mongodb://localhost:27017"


def pytest_configure(config):
    if os.environ.get("REACT_APP_BACKEND_URL"):
        return  # caller supplied a server; leave it alone

    db_name = os.environ.get("TEST_DB_NAME", "edu_test")
    if "test" not in db_name.lower():
        raise RuntimeError(f"Refusing to run tests against database '{db_name}': the name must contain 'test'.")

    port = _free_port()
    mongo_url = _resolve_mongo_url()
    env = {
        **os.environ,
        "MONGO_URL": mongo_url,
        "DB_NAME": db_name,
        "JWT_SECRET": TEST_JWT_SECRET,
        # Short lock so the lock-expiry test is quick; proxy header trusted so tests can vary the client IP.
        "LOGIN_LOCK_SECONDS": "6",
        "TRUST_PROXY": "true",
        # Reset links come back in the API response (no inbox in tests); never enabled outside the test server.
        "MAIL_PROVIDER": "console",
        "PASSWORD_RESET_DEBUG_LINK": "true",
        "FRONTEND_URL": "http://localhost:3000",
    }
    log = tempfile.NamedTemporaryFile("w+", prefix="educentre-test-server-", suffix=".log", delete=False)
    proc = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "server:app", "--host", "127.0.0.1", "--port", str(port)],
        cwd=BACKEND_DIR,
        env=env,
        stdout=log,
        stderr=subprocess.STDOUT,
    )
    _state.update(proc=proc, log=log, mongo_url=mongo_url, db_name=db_name)

    base = f"http://127.0.0.1:{port}"
    deadline = time.time() + 150  # Atlas can take a while to wake up; the app retries the connection itself
    while time.time() < deadline:
        if proc.poll() is not None:
            break
        try:
            if requests.get(f"{base}/api/", timeout=2).status_code == 200:
                os.environ["REACT_APP_BACKEND_URL"] = base
                return
        except requests.RequestException:
            pass
        time.sleep(1)

    _stop_server()
    log.flush()
    log.seek(0)
    tail = "".join(log.readlines()[-30:])
    raise RuntimeError(f"Test server did not start (log: {log.name}):\n{tail}")


def _stop_server():
    proc = _state["proc"]
    if proc and proc.poll() is None:
        proc.terminate()
        try:
            proc.wait(timeout=15)
        except subprocess.TimeoutExpired:
            proc.kill()


def pytest_unconfigure(config):
    if not _state["proc"]:
        return
    _stop_server()
    try:
        from pymongo import MongoClient

        client = MongoClient(_state["mongo_url"], serverSelectionTimeoutMS=15000)
        client.drop_database(_state["db_name"])
        client.close()
    except Exception as exc:  # cleanup must never mask test results
        print(f"\n[conftest] could not drop test database '{_state['db_name']}': {exc}")
    if _state["log"]:
        _state["log"].close()
        try:
            os.unlink(_state["log"].name)
        except OSError:
            pass


@pytest.fixture(scope="session")
def mongo_db():
    """Direct handle on the throw-away test database (only when this conftest started the server)."""
    if not _state["proc"]:
        pytest.skip("test server was not started by conftest; its database is out of reach")
    from pymongo import MongoClient

    client = MongoClient(_state["mongo_url"], serverSelectionTimeoutMS=15000)
    yield client[_state["db_name"]]
    client.close()
