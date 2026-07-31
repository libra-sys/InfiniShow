"""邀请/积分相关 Schema."""

from datetime import datetime

from pydantic import BaseModel, Field


class InviteCodeResponse(BaseModel):
    """邀请码响应."""

    invite_code: str
    invite_url: str
    invite_count: int


class CheckInResponse(BaseModel):
    """签到响应."""

    success: bool
    credits_added: int
    total_credits: int
    next_check_in_at: datetime | None


class CreditLogItem(BaseModel):
    """积分流水项."""

    type: str
    amount: int
    balance: int
    created_at: datetime
    description: str | None
