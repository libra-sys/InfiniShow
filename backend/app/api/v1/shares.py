"""分享 API."""

import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.core.exceptions import NotFoundException
from app.models.report import Report
from app.models.share_snapshot import ShareSnapshot
from app.models.user import User
from app.schemas.base import ApiResponse
from app.schemas.share import ShareCreateRequest, ShareDetailResponse, ShareResponse

router = APIRouter()


@router.post("/poster/{token}", response_model=ApiResponse[dict])
async def generate_poster(
    token: str,
    db: AsyncSession = Depends(get_db),
):
    """触发海报生成（异步）."""
    result = await db.execute(select(ShareSnapshot).where(ShareSnapshot.token == token))
    share = result.scalar_one_or_none()
    if not share:
        raise NotFoundException("分享不存在")

    # 触发 Celery 异步海报生成
    from app.tasks.report_tasks import render_share_poster
    render_share_poster.delay(share.id)

    return ApiResponse(data={"job_id": share.id, "status": "processing"})


@router.get("/{token}/stats", response_model=ApiResponse[dict])
async def get_share_stats(
    token: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """获取分享访问/转化统计."""
    result = await db.execute(
        select(ShareSnapshot).where(ShareSnapshot.token == token, ShareSnapshot.user_id == user.id)
    )
    share = result.scalar_one_or_none()
    if not share:
        raise NotFoundException("分享不存在")

    return ApiResponse(data={
        "token": share.token,
        "view_count": share.view_count,
        "unique_visitor_count": share.view_count,  # 简化：去重需设备指纹
        "converted_count": 0,
        "created_at": share.created_at.isoformat() if share.created_at else None,
    })


@router.post("", response_model=ApiResponse[ShareResponse])
async def create_share(
    request: ShareCreateRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """创建分享."""
    # 获取报告数据作为快照
    snapshot_data = {}
    if request.report_id:
        report = await db.get(Report, request.report_id)
        if not report or report.user_id != user.id:
            raise NotFoundException("报告不存在")
        snapshot_data = {
            "title": report.title,
            "overall_score": report.overall_score,
            "kpis": report.kpis,
            "actions": report.actions,
        }
    elif request.task_id:
        snapshot_data = {"title": request.title, "task_id": request.task_id}

    token = secrets.token_urlsafe(32)
    expires_at = None
    if request.expires_days:
        expires_at = datetime.now(timezone.utc) + timedelta(days=request.expires_days)

    share = ShareSnapshot(
        token=token,
        share_type=request.share_type,
        user_id=user.id,
        report_id=request.report_id,
        task_id=request.task_id,
        title=request.title,
        snapshot_data=snapshot_data,
        password=request.password,
        expires_at=expires_at,
    )
    db.add(share)
    await db.commit()
    await db.refresh(share)

    base_url = "http://localhost:5173"
    return ApiResponse(data=ShareResponse(
        token=token,
        share_url=f"{base_url}/share/{token}",
        share_type=request.share_type,
        title=request.title,
        expires_at=expires_at,
    ))


@router.get("/{token}", response_model=ApiResponse[ShareDetailResponse])
async def get_share(
    token: str,
    password: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    """获取分享详情."""
    result = await db.execute(select(ShareSnapshot).where(ShareSnapshot.token == token))
    share = result.scalar_one_or_none()
    if not share:
        raise NotFoundException("分享不存在或已失效")

    if share.expires_at and share.expires_at < datetime.now(timezone.utc):
        raise NotFoundException("分享已过期")

    if share.password and share.password != password:
        from app.core.exceptions import UnauthorizedException
        raise UnauthorizedException("密码错误")

    # 增加浏览数
    share.view_count += 1
    await db.commit()

    return ApiResponse(data=ShareDetailResponse(
        token=share.token,
        title=share.title,
        share_type=share.share_type,
        snapshot_data=share.snapshot_data,
        poster_url=share.poster_url,
        view_count=share.view_count,
        created_at=share.created_at,
        expires_at=share.expires_at,
    ))


@router.get("/{token}/poster")
async def get_share_poster(
    token: str,
    db: AsyncSession = Depends(get_db),
):
    """获取分享海报."""
    result = await db.execute(select(ShareSnapshot).where(ShareSnapshot.token == token))
    share = result.scalar_one_or_none()
    if not share:
        raise NotFoundException("分享不存在")

    return {
        "token": share.token,
        "title": share.title,
        "poster_url": share.poster_url,
        "snapshot_data": share.snapshot_data,
    }
