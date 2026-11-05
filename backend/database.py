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


def _use_public_dns():
    """Make dnspython (used by pymongo for mongodb+srv://) ask public resolvers instead of the OS ones.

    Some networks (hotspots, ISP/router resolvers, broken IPv6 DNS) do not answer the SRV/TXT lookups
    Atlas needs. Override the servers with DNS_NAMESERVERS="1.1.1.1,8.8.8.8".
    """
    import dns.resolver

    servers = [s.strip() for s in os.environ.get("DNS_NAMESERVERS", "1.1.1.1,8.8.8.8").split(",") if s.strip()]
    resolver = dns.resolver.Resolver(configure=False)
    resolver.nameservers = servers
    resolver.lifetime = 10.0
    dns.resolver.default_resolver = resolver
    logger.warning("SRV lookup failed with system DNS; retrying with %s", ", ".join(servers))


def get_db():
    """Lazily initialise the shared db handle, retrying transient connection failures."""
    global _client, _db
    if _db is None:
        mongo_url = os.environ["MONGO_URL"]
        db_name = os.environ["DB_NAME"]
        public_dns_tried = False
        for attempt in range(1, _CONNECT_ATTEMPTS + 1):
            try:
                _client = AsyncIOMotorClient(mongo_url)
                break
            except Exception:
                # mongodb+srv:// resolves DNS while the client is constructed; if the system
                # resolver cannot answer SRV records, fall back to public DNS once, right away.
                if mongo_url.startswith("mongodb+srv://") and not public_dns_tried:
                    public_dns_tried = True
                    _use_public_dns()
                    continue
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
