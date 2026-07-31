"""文件相关 Schema."""

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict


class FileUploadResponse(BaseModel):
    """文件上传响应."""

    id: str
    original_name: str
    file_type: str
    size_bytes: int
    storage_key: str
    columns: list[dict[str, Any]] | None
    row_count: int | None


class FileRecordResponse(BaseModel):
    """文件记录响应."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    original_name: str
    file_type: str
    storage_key: str
    size_bytes: int
    columns: list[dict[str, Any]] | None
    row_count: int | None
    created_at: datetime
