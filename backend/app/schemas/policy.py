"""政策相关 Schema."""

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class PolicySearchRequest(BaseModel):
    """政策搜索请求."""

    keyword: str | None = Field(default=None, max_length=100)
    region: str | None = Field(default=None, max_length=100)
    industry: str | None = Field(default=None, max_length=100)


class PolicyResponse(BaseModel):
    """政策响应."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    source: str | None
    source_url: str | None
    region: str | None
    industry: str | None
    summary: str | None
    publish_date: datetime | None
    view_count: int
    tags: list[str] | None


class PolicyFeedbackRequest(BaseModel):
    """政策反馈请求."""

    policy_id: str
    feedback_type: str = Field(..., pattern=r"^(useful|outdated|irrelevant|error)$")
    content: str | None = Field(default=None, max_length=500)
