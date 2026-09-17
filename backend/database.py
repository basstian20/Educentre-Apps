"""Shared MongoDB connection — single source of truth, breaks circular imports."""
import os
import time
import logging
from motor.motor_asyncio import AsyncIOMotorClient

logger = logging.getLogger("educentre")

_client: AsyncIOMotorClient | None = None
_db = None

# mongodb+srv:// resolves via DNS at client construction time. Atlas free-tier
# clusters auto-pause and take a bit to wake up, so a fresh DNS lookup can
# briefly fail right after the cluster comes back — retry instead of crashing
# the whole app on the first attempt.
_CONNECT_ATTEMPTS = 5
_RETRY_DELAY_SECONDS = 3


def get_db():
    """Lazily initialise the shared db handle, retrying transient connection failures."""
    global _client, _db
    if _db is None:
        mongo_url = os.environ["MONGO_URL"]
        db_name = os.environ["DB_NAME"]
        for attempt in range(1, _CONNECT_ATTEMPTS + 1):
            try:
                _client = AsyncIOMotorClient(mongo_url)
                break
            except Exception:
                if attempt == _CONNECT_ATTEMPTS:
                    raise
                logger.warning(
                    "MongoDB connection attempt %d/%d failed, retrying in %ds",
                    attempt, _CONNECT_ATTEMPTS, _RETRY_DELAY_SECONDS,
                )
                time.sleep(_RETRY_DELAY_SECONDS)
        _db = _client[db_name]
    return _db


def close_client():
    global _client
    if _client is not None:
        _client.close()
        _client = None
