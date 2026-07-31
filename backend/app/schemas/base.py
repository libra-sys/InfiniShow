"""基础 Schema 与统一响应体."""

from typing import Any, Generic, TypeVar

from pydantic import BaseModel, Field

T = TypeVar("T")


class PaginationParams(BaseModel):
    """分页参数."""

    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)


class PaginationMeta(BaseModel):
    """分页元数据."""

    page: int
    page_size: int
    total: int
    total_pages: int


class ApiResponse(BaseModel, Generic[T]):
    """统一 API 响应体."""

    code: int = 200
    message: str = "success"
    data: T | None = None
    meta: dict[str, Any] | None = None
