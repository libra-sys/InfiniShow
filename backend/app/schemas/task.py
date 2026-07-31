"""任务相关 Schema."""

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class TaskCreateRequest(BaseModel):
    """创建任务请求."""

    scenario_code: str = Field(..., min_length=1, max_length=50)
    scenario_name: str = Field(..., min_length=1, max_length=100)
    title: str | None = Field(default=None, max_length=200)
    prompt_text: str | None = Field(default=None)
    file_ids: list[str] = Field(default_factory=list)
    quick_fields: dict[str, Any] | None = Field(default=None)


class TaskResponse(BaseModel):
    """任务详情响应."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    scenario_code: str
    scenario_name: str
    title: str | None
    status: str
    progress: int
    conn_id: str | None
    task_id: str | None
    current_event_id: str | None
    error_message: str | None
    started_at: datetime | None
    completed_at: datetime | None
    created_at: datetime
    updated_at: datetime


class TaskSummary(BaseModel):
    """任务列表项."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    scenario_code: str
    scenario_name: str
    title: str | None
    status: str
    progress: int
    created_at: datetime


class TaskEvent(BaseModel):
    """SSE 任务事件."""

    event_id: str | None = None
    type: str
    task_id: str
    payload: dict[str, Any]
    created_at: datetime | None = None


class TaskAskRequest(BaseModel):
    """任务追问请求."""

    question: str = Field(..., min_length=1, max_length=2000)
