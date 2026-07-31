"""用户相关 Schema."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class UserRegisterRequest(BaseModel):
    """用户注册请求."""

    phone: str = Field(..., min_length=11, max_length=11, pattern=r"^1[3-9]\d{9}$")
    password: str = Field(..., min_length=6, max_length=32)
    nickname: str | None = Field(default=None, max_length=50)
    invite_code: str | None = Field(default=None, max_length=20)


class UserProfileResponse(BaseModel):
    """用户资料响应."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    phone: str
    nickname: str | None
    avatar: str | None
    role: str
    credits: int
    invite_code: str | None
    last_check_in_at: datetime | None
    created_at: datetime


class UserCreditsResponse(BaseModel):
    """用户积分响应."""

    credits: int
    today_checked_in: bool
    last_check_in_at: datetime | None
