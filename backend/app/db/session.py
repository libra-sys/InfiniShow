"""SQLAlchemy 异步会话管理."""

from collections.abc import AsyncGenerator
from typing import Any

from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import Session, declarative_base, sessionmaker

from app.config import get_settings

settings = get_settings()

# SQLite 不支持 pool_size/max_overflow
_engine_kwargs: dict[str, Any] = {
    "echo": settings.debug,
    "future": True,
    "pool_pre_ping": True,
}
if not settings.is_sqlite:
    _engine_kwargs["pool_size"] = 20
    _engine_kwargs["max_overflow"] = 10

engine = create_async_engine(
    str(settings.database_url),
    **_engine_kwargs,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)

# 同步引擎（Celery 任务使用，惰性初始化避免无 psycopg2 时导入失败）
_sync_engine = None
_sync_session_factory = None


def get_sync_engine():
    global _sync_engine
    if _sync_engine is None:
        _sync_engine = create_engine(
            str(settings.database_url_sync),
            echo=settings.debug,
            pool_size=10,
            max_overflow=5,
            pool_pre_ping=True,
        )
    return _sync_engine


def get_sync_session_factory():
    global _sync_session_factory
    if _sync_session_factory is None:
        _sync_session_factory = sessionmaker(bind=get_sync_engine(), class_=Session, expire_on_commit=False)
    return _sync_session_factory


# 兼容别名：惰性属性访问
class _SyncSessionFactoryProxy:
    """代理 sync_session_factory，首次调用时才创建同步引擎。"""

    def __call__(self, *args, **kwargs):
        return get_sync_session_factory()(*args, **kwargs)

    def __enter__(self):
        self._session = get_sync_session_factory()()
        return self._session

    def __exit__(self, exc_type, exc_val, exc_tb):
        if hasattr(self, "_session"):
            self._session.close()


sync_session_factory = _SyncSessionFactoryProxy()

# 别名：供异步代码直接使用
async_session_factory = AsyncSessionLocal

Base = declarative_base()


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """获取数据库会话依赖."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db() -> None:
    """初始化数据库表结构（仅开发/测试使用）."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
