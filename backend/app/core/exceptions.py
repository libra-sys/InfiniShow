"""业务异常与全局异常处理."""

from typing import Any

from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse

from app.schemas.base import ApiResponse


class BusinessException(Exception):
    """业务异常基类."""

    def __init__(
        self,
        message: str = "业务错误",
        code: int = status.HTTP_400_BAD_REQUEST,
        data: Any | None = None,
    ):
        self.message = message
        self.code = code
        self.data = data
        super().__init__(message)


class UnauthorizedException(BusinessException):
    """未授权异常."""

    def __init__(self, message: str = "未登录或登录已过期"):
        super().__init__(message=message, code=status.HTTP_401_UNAUTHORIZED)


class ForbiddenException(BusinessException):
    """无权限异常."""

    def __init__(self, message: str = "无权限访问"):
        super().__init__(message=message, code=status.HTTP_403_FORBIDDEN)


class NotFoundException(BusinessException):
    """资源不存在异常."""

    def __init__(self, message: str = "资源不存在"):
        super().__init__(message=message, code=status.HTTP_404_NOT_FOUND)


class RateLimitException(BusinessException):
    """限流异常."""

    def __init__(self, message: str = "请求过于频繁，请稍后再试"):
        super().__init__(message=message, code=status.HTTP_429_TOO_MANY_REQUESTS)


class InsufficientCreditsException(BusinessException):
    """积分不足异常."""

    def __init__(self, message: str = "额度不足，请邀请好友或签到获取"):
        super().__init__(message=message, code=status.HTTP_402_PAYMENT_REQUIRED)


def register_exception_handlers(app: FastAPI) -> None:
    """注册全局异常处理器."""

    @app.exception_handler(BusinessException)
    async def business_exception_handler(request: Request, exc: BusinessException):
        return JSONResponse(
            status_code=exc.code,
            content=ApiResponse(
                code=exc.code,
                message=exc.message,
                data=exc.data,
            ).model_dump(exclude_none=True),
        )

    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=ApiResponse(
                code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                message="服务器内部错误",
                data=None,
            ).model_dump(exclude_none=True),
        )
