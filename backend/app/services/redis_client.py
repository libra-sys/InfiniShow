"""Redis 客户端管理 — 无 Redis 时降级为内存字典."""

import json
import logging
from typing import Any

from app.config import get_settings

logger = logging.getLogger("infinshow.redis")


class MemoryRedis:
    """内存字典模拟 Redis，无 Redis 服务时使用."""

    def __init__(self):
        self._data: dict[str, str] = {}
        self._lists: dict[str, list[str]] = {}
        self._expiry: dict[str, float] = {}

    def _cleanup_expired(self, key: str) -> None:
        import time
        if key in self._expiry and time.time() > self._expiry[key]:
            self._data.pop(key, None)
            self._lists.pop(key, None)
            del self._expiry[key]

    async def get(self, key: str) -> str | None:
        self._cleanup_expired(key)
        return self._data.get(key)

    async def set(self, key: str, value: str, ex: int | None = None) -> None:
        self._data[key] = value
        if ex:
            import time
            self._expiry[key] = time.time() + ex

    async def delete(self, key: str) -> None:
        self._data.pop(key, None)
        self._lists.pop(key, None)
        self._expiry.pop(key, None)

    async def rpush(self, key: str, value: str) -> None:
        self._cleanup_expired(key)
        if key not in self._lists:
            self._lists[key] = []
        self._lists[key].append(value)

    async def lrange(self, key: str, start: int, stop: int) -> list[str]:
        self._cleanup_expired(key)
        lst = self._lists.get(key, [])
        if stop == -1:
            return lst[start:]
        return lst[start:stop + 1]

    async def ltrim(self, key: str, start: int, stop: int) -> None:
        if key in self._lists:
            lst = self._lists[key]
            if stop == -1:
                self._lists[key] = lst[start:]
            else:
                self._lists[key] = lst[start:stop + 1]

    async def expire(self, key: str, seconds: int) -> None:
        import time
        if key in self._data or key in self._lists:
            self._expiry[key] = time.time() + seconds

    async def lpush(self, key: str, value: str) -> None:
        self._cleanup_expired(key)
        if key not in self._lists:
            self._lists[key] = []
        self._lists[key].insert(0, value)

    async def close(self) -> None:
        pass


_redis_client: Any = None


async def get_redis() -> Any:
    """获取 Redis 客户端（无 Redis 时降级为内存字典）."""
    global _redis_client
    if _redis_client is not None:
        return _redis_client

    settings = get_settings()
    if settings.has_redis:
        try:
            import redis.asyncio as redis
            _redis_client = redis.from_url(settings.redis_url, decode_responses=True)
            # 测试连接
            await _redis_client.ping()
            logger.info("Redis connected: %s", settings.redis_url)
        except Exception as e:
            logger.warning("Redis connection failed, falling back to memory: %s", e)
            _redis_client = MemoryRedis()
    else:
        logger.info("Redis not configured, using in-memory cache")
        _redis_client = MemoryRedis()

    return _redis_client


async def close_redis() -> None:
    """关闭 Redis 连接."""
    global _redis_client
    if _redis_client is not None:
        await _redis_client.close()
        _redis_client = None
