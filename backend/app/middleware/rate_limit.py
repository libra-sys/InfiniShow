"""基于 Redis 的限流中间件."""

import time
from typing import Awaitable, Callable

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

from app.config import get_settings
from app.core.exceptions import RateLimitException
from app.services.redis_client import get_redis


class RateLimitMiddleware(BaseHTTPMiddleware):
    """限流中间件."""

    async def dispatch(
        self, request: Request, call_next: Callable[[Request], Awaitable[Response]]
    ) -> Response:
        if request.method == "OPTIONS":
            return await call_next(request)

        settings = get_settings()
        path = request.url.path
        client_id = self._get_client_id(request)

        limit, window = self._parse_limit(settings.rate_limit_general)
        if path.startswith("/api/v1/auth/login"):
            limit, window = self._parse_limit(settings.rate_limit_login)
        elif path == "/api/v1/tasks" and request.method == "POST":
            limit, window = self._parse_limit(settings.rate_limit_task_create)

        key = f"rate_limit:{client_id}:{path}"
        redis = await get_redis()
        current = await redis.get(key)
        if current is None:
            await redis.setex(key, window, 1)
            remaining = limit - 1
        else:
            current_count = int(current)
            if current_count >= limit:
                raise RateLimitException()
            await redis.incr(key)
            remaining = limit - current_count - 1

        response = await call_next(request)
        response.headers["X-RateLimit-Limit"] = str(limit)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        return response

    def _get_client_id(self, request: Request) -> str:
        """获取客户端标识."""
        if request.client:
            return request.client.host
        return "unknown"

    def _parse_limit(self, rate: str) -> tuple[int, int]:
        """解析限流字符串，如 '100/minute' -> (100, 60)."""
        count, unit = rate.split("/")
        count = int(count)
        unit = unit.lower()
        if unit in ("s", "sec", "second"):
            window = 1
        elif unit in ("m", "min", "minute"):
            window = 60
        elif unit in ("h", "hour"):
            window = 3600
        elif unit in ("d", "day"):
            window = 86400
        else:
            window = 60
        return count, window
