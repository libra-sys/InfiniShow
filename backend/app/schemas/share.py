"""分享相关 Schema."""

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class ShareCreateRequest(BaseModel):
    """创建分享请求."""

    report_id: str | None = None
    task_id: str | None = None
    share_type: str = Field(default="report", pattern=r"^(report|poster)$")
    title: str = Field(..., min_length=1, max_length=200)
    password: str | None = Field(default=None, max_length=20)
    expires_days: int | None = Field(default=None, ge=1, le=30)


class ShareResponse(BaseModel):
    """分享响应."""

    token: str
    share_url: str
    share_type: str
    title: str
    expires_at: datetime | None


class ShareDetailResponse(BaseModel):
    """分享详情响应（只读快照）."""

    token: str
    title: str
    share_type: str
    snapshot_data: dict[str, Any]
    view_count: int
    created_at: datetime
    expires_at: datetime | None
