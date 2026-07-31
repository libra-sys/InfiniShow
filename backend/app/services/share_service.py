"""分享服务."""

from datetime import datetime, timedelta, timezone
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundException
from app.models.report import Report
from app.models.share_snapshot import ShareSnapshot
from app.models.task import Task
from app.models.user import User
from app.schemas.share import ShareCreateRequest
from app.utils.helpers import generate_share_token, generate_ulid


class ShareService:
    """分享服务."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def create_share(self, user: User, request: ShareCreateRequest) -> ShareSnapshot:
        """创建分享快照."""
        snapshot_data: dict[str, Any] = {}
        report_id = request.report_id
        task_id = request.task_id

        if report_id:
            result = await self.db.execute(
                select(Report).where(Report.id == report_id, Report.user_id == user.id)
            )
            report = result.scalar_one_or_none()
            if not report:
                raise NotFoundException("报告不存在")
            snapshot_data = {
                "title": report.title,
                "overall_score": report.overall_score,
                "health_scores": report.health_scores,
                "kpis": report.kpis,
                "charts": report.charts,
                "conclusions": report.conclusions,
                "actions": report.actions,
            }
            task_id = report.task_id
        elif task_id:
            result = await self.db.execute(
                select(Task).where(Task.id == task_id, Task.user_id == user.id)
            )
            task = result.scalar_one_or_none()
            if not task:
                raise NotFoundException("任务不存在")
            snapshot_data = {
                "title": task.title,
                "scenario_name": task.scenario_name,
                "status": task.status,
                "progress": task.progress,
            }
        else:
            raise NotFoundException("缺少 report_id 或 task_id")

        expires_at = None
        if request.expires_days:
            expires_at = datetime.now(timezone.utc) + timedelta(days=request.expires_days)

        share = ShareSnapshot(
            id=generate_ulid(),
            token=generate_share_token(),
            share_type=request.share_type,
            user_id=user.id,
            report_id=report_id,
            task_id=task_id,
            title=request.title,
            snapshot_data=snapshot_data,
            password=request.password,
            expires_at=expires_at,
            view_count=0,
        )
        self.db.add(share)
        await self.db.commit()
        await self.db.refresh(share)
        return share

    async def get_share(self, token: str, password: str | None = None) -> ShareSnapshot:
        """获取分享快照."""
        result = await self.db.execute(select(ShareSnapshot).where(ShareSnapshot.token == token))
        share = result.scalar_one_or_none()
        if not share:
            raise NotFoundException("分享不存在")

        if share.expires_at and share.expires_at < datetime.now(timezone.utc):
            raise NotFoundException("分享已过期")

        if share.password and share.password != password:
            raise NotFoundException("访问密码错误")

        share.view_count += 1
        await self.db.commit()
        return share

    def build_share_url(self, token: str) -> str:
        """构建分享 URL."""
        return f"/share/{token}"
