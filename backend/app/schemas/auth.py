"""认证相关 Schema."""

from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    """登录请求."""

    phone: str = Field(..., min_length=11, max_length=11, pattern=r"^1[3-9]\d{9}$")
    password: str = Field(..., min_length=6, max_length=32)


class RefreshTokenRequest(BaseModel):
    """刷新 Token 请求."""

    refresh_token: str


class TokenResponse(BaseModel):
    """Token 响应."""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user_id: str
    role: str
