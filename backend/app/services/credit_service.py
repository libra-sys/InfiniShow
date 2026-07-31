"""积分服务."""

from datetime import datetime, timedelta, timezone
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.constants import (
    CREDITS_DAILY_CHECKIN,
    CREDITS_INVITE,
    CREDITS_REGISTER,
    CREDITS_TASK_CONSUME,
    CreditType,
)
from app.core.exceptions import BusinessException, InsufficientCreditsException
from app.models.credit_log import CreditLog
from app.models.user import User


class CreditService:
    """积分服务."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def add_credits(
        self,
        user: User,
        amount: int,
        credit_type: CreditType,
        related_id: str | None = None,
        meta: dict[str, Any] | None = None,
    ) -> int:
        """增加用户积分并记录流水."""
        user.credits += amount
        log = CreditLog(
            user_id=user.id,
            type=credit_type.value,
            amount=amount,
            balance=user.credits,
            related_id=related_id,
            meta=meta,
        )
        self.db.add(log)
        await self.db.flush()
        return user.credits

    async def deduct_credits(
        self,
        user: User,
        amount: int = CREDITS_TASK_CONSUME,
        credit_type: CreditType = CreditType.TASK_CONSUME,
        related_id: str | None = None,
        meta: dict[str, Any] | None = None,
    ) -> int:
        """扣减用户积分并记录流水."""
        if user.credits < amount:
            raise InsufficientCreditsException()

        user.credits -= amount
        log = CreditLog(
            user_id=user.id,
            type=credit_type.value,
            amount=-amount,
            balance=user.credits,
            related_id=related_id,
            meta=meta,
        )
        self.db.add(log)
        await self.db.flush()
        return user.credits

    async def reward_register(self, user: User) -> int:
        """注册奖励."""
        return await self.add_credits(
            user,
            CREDITS_REGISTER,
            CreditType.REGISTER,
            related_id=user.id,
            meta={"description": "新用户注册奖励"},
        )

    async def reward_invite(self, inviter: User, invitee_id: str, invitee_phone: str) -> int:
        """邀请奖励."""
        return await self.add_credits(
            inviter,
            CREDITS_INVITE,
            CreditType.INVITE,
            related_id=invitee_id,
            meta={"invitee_phone": invitee_phone, "description": "邀请好友奖励"},
        )

    async def check_in(self, user: User) -> tuple[bool, int, int]:
        """每日签到.

        Returns:
            (success, credits_added, total_credits)
        """
        now = datetime.now(timezone.utc)
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

        if user.last_check_in_at and user.last_check_in_at >= today_start:
            return False, 0, user.credits

        user.last_check_in_at = now
        total = await self.add_credits(
            user,
            CREDITS_DAILY_CHECKIN,
            CreditType.DAILY_CHECKIN,
            related_id=user.id,
            meta={"description": "每日签到"},
        )
        return True, CREDITS_DAILY_CHECKIN, total

    async def get_credit_logs(self, user_id: str) -> list[CreditLog]:
        """获取积分流水."""
        result = await self.db.execute(
            select(CreditLog).where(CreditLog.user_id == user_id).order_by(CreditLog.created_at.desc())
        )
        return list(result.scalars().all())

    async def admin_adjust(self, user: User, amount: int, admin_id: str, reason: str) -> int:
        """管理员调整积分."""
        if amount >= 0:
            return await self.add_credits(
                user,
                amount,
                CreditType.ADMIN_ADJUST,
                related_id=admin_id,
                meta={"reason": reason},
            )
        return await self.deduct_credits(
            user,
            abs(amount),
            CreditType.ADMIN_ADJUST,
            related_id=admin_id,
            meta={"reason": reason},
        )
