"""数据销毁 API."""

from fastapi import APIRouter, Depends
from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.file_record import FileRecord
from app.models.report import Report
from app.models.share_snapshot import ShareSnapshot
from app.models.task import Task
from app.models.user import User
from app.schemas.base import ApiResponse

router = APIRouter()


@router.post("", response_model=ApiResponse[dict])
async def destroy_user_data(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """销毁当前用户所有经营数据（保留账号与审计日志）."""
    # 删除分享
    await db.execute(delete(ShareSnapshot).where(ShareSnapshot.user_id == user.id))
    # 删除报告
    await db.execute(delete(Report).where(Report.user_id == user.id))
    # 删除文件记录
    await db.execute(delete(FileRecord).where(FileRecord.user_id == user.id))
    # 删除任务
    await db.execute(delete(Task).where(Task.user_id == user.id))

    await db.commit()

    return ApiResponse(data={"message": "所有经营数据已销毁"})
