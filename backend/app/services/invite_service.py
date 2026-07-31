"""邀请服务."""

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import BusinessException
from app.models.invite_record import InviteRecord
from app.models.user import User
from app.services.credit_service import CreditService


class InviteService:
    """邀请服务."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.credit_service = CreditService(db)

    async def get_invite_stats(self, user: User) -> dict:
        """获取邀请统计."""
        result = await self.db.execute(
            select(func.count(InviteRecord.id)).where(InviteRecord.inviter_id == user.id)
        )
        invite_count = result.scalar() or 0
        return {
            "invite_code": user.invite_code,
            "invite_count": invite_count,
            "invite_url": f"/register?invite_code={user.invite_code}" if user.invite_code else "",
        }

    async def check_in(self, user: User) -> tuple[bool, int, int]:
        """每日签到."""
        return await self.credit_service.check_in(user)

    async def list_credit_logs(self, user_id: str) -> list[dict]:
        """积分流水."""
        logs = await self.credit_service.get_credit_logs(user_id)
        return [
            {
                "type": log.type,
                "amount": log.amount,
                "balance": log.balance,
                "created_at": log.created_at,
                "description": (log.meta or {}).get("description", ""),
            }
            for log in logs
        ]
