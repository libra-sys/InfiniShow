"""结构化请求日志与 Trace ID 中间件."""

import logging
import time
import uuid
from typing import Awaitable, Callable

from fastapi import FastAPI, Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger("infinshow.api")


class LoggingMiddleware(BaseHTTPMiddleware):
    """请求日志中间件."""

    async def dispatch(
        self, request: Request, call_next: Callable[[Request], Awaitable[Response]]
    ) -> Response:
        start_time = time.time()
        trace_id = request.headers.get("X-Trace-ID") or str(uuid.uuid4())
        request.state.trace_id = trace_id

        response = await call_next(request)
        response.headers["X-Trace-ID"] = trace_id

        duration_ms = (time.time() - start_time) * 1000
        logger.info(
            "request",
            extra={
                "trace_id": trace_id,
                "method": request.method,
                "path": request.url.path,
                "status_code": response.status_code,
                "duration_ms": round(duration_ms, 2),
                "client_ip": request.client.host if request.client else None,
            },
        )
        return response


def setup_logging_middleware(app: FastAPI) -> None:
    """配置日志中间件."""
    app.add_middleware(LoggingMiddleware)

    # 配置 JSON 日志格式
    log_handler = logging.StreamHandler()
    log_handler.setFormatter(
        logging.Formatter(
            fmt="%(asctime)s %(levelname)s %(name)s %(message)s",
        )
    )
    api_logger = logging.getLogger("infinshow.api")
    api_logger.setLevel(logging.INFO)
    api_logger.addHandler(log_handler)
