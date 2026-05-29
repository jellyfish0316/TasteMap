"""Redis client used for task status, sessions, temporary results, and caching."""
from __future__ import annotations

import redis

from app.core.config import settings

# decode_responses=True so callers get str instead of bytes.
redis_client: redis.Redis = redis.Redis.from_url(settings.redis_url, decode_responses=True)


def get_redis() -> redis.Redis:
    """FastAPI dependency / accessor for the shared Redis client."""
    return redis_client
