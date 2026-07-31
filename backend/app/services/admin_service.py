"""Admin 后台服务."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.constants import UserRole
from app.core.exceptions import BusinessException, NotFoundException
from app.models.credit_log import CreditLog
from app.models.task import Task
from app.models.user import User
from app.schemas.user import UserProfileResponse
from app.services.credit_service import CreditService


class AdminService:
    """Admin 服务."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.credit_service = CreditService(db)

    async def list_users(
        self,
        keyword: str | None,
        page: int,
        page_size: int,
    ) -> tuple[list[User], int]:
        """用户列表."""
        query = select(User)
        if keyword:
            query = query.where(User.phone.ilike(f"%{keyword}%") | User.nickname.ilike(f"%{keyword}%"))

        total_result = await self.db.execute(query)
        total = len(total_result.scalars().all())

        result = await self.db.execute(
            query.order_by(User.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
        )
        return list(result.scalars().all()), total

    async def toggle_user_status(self, user_id: str) -> User:
        """启用/禁用用户."""
        user = await self.db.get(User, user_id)
        if not user:
            raise NotFoundException("用户不存在")
        if user.role == UserRole.SUPERADMIN.value:
            raise BusinessException("不能禁用超级管理员")
        user.is_active = not user.is_active
        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def adjust_credits(self, admin_id: str, user_id: str, amount: int, reason: str) -> User:
        """调整用户积分."""
        user = await self.db.get(User, user_id)
        if not user:
            raise NotFoundException("用户不存在")
        await self.credit_service.admin_adjust(user, amount, admin_id, reason)
        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def list_credit_logs(self, page: int, page_size: int) -> tuple[list[CreditLog], int]:
        """积分流水列表."""
        total_result = await self.db.execute(select(CreditLog))
        total = len(total_result.scalars().all())

        result = await self.db.execute(
            select(CreditLog).order_by(CreditLog.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
        )
        return list(result.scalars().all()), total

    async def list_tasks(
        self,
        status: str | None,
        page: int,
        page_size: int,
    ) -> tuple[list[Task], int]:
        """任务核验列表."""
        query = select(Task)
        if status:
            query = query.where(Task.status == status)

        total_result = await self.db.execute(query)
        total = len(total_result.scalars().all())

        result = await self.db.execute(
            query.order_by(Task.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
        )
        return list(result.scalars().all()), total

    async def verify_task(self, task_id: str) -> Task:
        """核验任务."""
        task = await self.db.get(Task, task_id)
        if not task:
            raise NotFoundException("任务不存在")
        return task
