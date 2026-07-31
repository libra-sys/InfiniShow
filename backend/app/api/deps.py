"""API 通用依赖."""

from fastapi import Depends, Header, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import UnauthorizedException
from app.core.security import decode_token
from app.db.session import AsyncSessionLocal
from app.models.user import User
from app.schemas.base import PaginationParams

security = HTTPBearer(auto_error=False)


async def get_db() -> AsyncSession:
    """获取数据库会话."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


async def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
) -> User:
    """获取当前登录用户."""
    token = None
    if credentials:
        token = credentials.credentials
    if not token:
        token = request.cookies.get("access_token")
    if not token:
        # SSE 端点通过 query param 传递 token（浏览器 EventSource 不支持自定义 header）
        token = request.query_params.get("token")
    if not token:
        raise UnauthorizedException()

    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        raise UnauthorizedException()

    user_id = payload.get("sub")
    if not user_id:
        raise UnauthorizedException()

    from sqlalchemy import select

    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if not user or not user.is_active:
            raise UnauthorizedException()
        request.state.user = user
        return user


async def get_current_active_user(user: User = Depends(get_current_user)) -> User:
    """获取当前活跃用户."""
    return user


async def require_admin(user: User = Depends(get_current_user)) -> User:
    """要求管理员权限."""
    if not user.is_admin():
        from app.core.exceptions import ForbiddenException

        raise ForbiddenException()
    return user


async def require_superadmin(user: User = Depends(get_current_user)) -> User:
    """要求超级管理员权限."""
    if not user.is_superadmin():
        from app.core.exceptions import ForbiddenException

        raise ForbiddenException()
    return user


async def pagination_params(
    page: int = 1,
    page_size: int = 20,
) -> PaginationParams:
    """分页参数."""
    return PaginationParams(page=page, page_size=page_size)


async def trace_id_header(x_trace_id: str | None = Header(None)) -> str | None:
    """Trace ID 请求头."""
    return x_trace_id
