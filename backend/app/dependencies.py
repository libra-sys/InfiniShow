"""全局依赖注入."""

from collections.abc import AsyncGenerator

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import AsyncSessionLocal
from app.services.redis_client import get_redis


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """获取数据库会话."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


async def get_redis_dependency():
    """获取 Redis 客户端依赖."""
    return await get_redis()


DbSession = Depends(get_db)
RedisDep = Depends(get_redis_dependency)
