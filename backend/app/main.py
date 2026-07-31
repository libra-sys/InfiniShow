"""FastAPI 应用入口."""

from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.api.v1 import api_router
from app.config import get_settings
from app.core.exceptions import register_exception_handlers
from app.db.session import init_db
from app.middleware import RateLimitMiddleware, setup_cors, setup_logging_middleware
from app.services.redis_client import close_redis


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理."""
    settings = get_settings()
    # 开发和生产都自动建表（生产用 SQLite 或首次部署时）
    await init_db()
    yield
    await close_redis()


def create_application() -> FastAPI:
    """创建 FastAPI 应用实例."""
    settings = get_settings()
    app = FastAPI(
        title="可信经营洞察引擎",
        description="面向中小实体经营者的全链路可溯源智能经营分析工具",
        version="0.1.0",
        docs_url="/docs" if settings.debug else None,
        redoc_url="/redoc" if settings.debug else None,
        lifespan=lifespan,
    )

    setup_cors(app)
    setup_logging_middleware(app)
    app.add_middleware(RateLimitMiddleware)
    register_exception_handlers(app)

    app.include_router(api_router, prefix="/api/v1")

    @app.get("/health")
    async def health_check():
        return {"status": "ok", "version": "0.1.0"}

    return app


app = create_application()
