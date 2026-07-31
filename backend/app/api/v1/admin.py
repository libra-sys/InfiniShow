"""Admin 后台 API."""

from fastapi import APIRouter, Depends
from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, pagination_params, require_admin
from app.core.constants import PolicyStatus
from app.models.credit_log import CreditLog
from app.models.policy_feed import PolicyFeed
from app.models.task import Task
from app.models.user import User
from app.schemas.base import ApiResponse, PaginationParams

router = APIRouter()


@router.get("/users", response_model=ApiResponse[dict])
async def list_users(
    keyword: str = "",
    page: int = 1,
    page_size: int = 20,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """用户列表."""
    query = select(User)
    if keyword:
        query = query.where(
            User.phone.ilike(f"%{keyword}%") | User.nickname.ilike(f"%{keyword}%")
        )

    count_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = count_result.scalar() or 0

    result = await db.execute(
        query.order_by(desc(User.created_at)).offset((page - 1) * page_size).limit(page_size)
    )
    users = result.scalars().all()

    return ApiResponse(data={
        "items": [
            {
                "id": u.id,
                "phone": u.phone,
                "nickname": u.nickname,
                "avatar": u.avatar,
                "role": u.role,
                "credits": u.credits,
                "invite_code": u.invite_code,
                "is_active": u.is_active,
                "created_at": u.created_at.isoformat(),
            }
            for u in users
        ],
        "meta": {"page": page, "page_size": page_size, "total": total, "total_pages": (total + page_size - 1) // page_size},
    })


@router.post("/users/{user_id}/toggle", response_model=ApiResponse[dict])
async def toggle_user_status(
    user_id: str,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """切换用户状态."""
    user = await db.get(User, user_id)
    if not user:
        from app.core.exceptions import NotFoundException
        raise NotFoundException("用户不存在")
    if user.role == "superadmin":
        from app.core.exceptions import ForbiddenException
        raise ForbiddenException("不能禁用超级管理员")

    user.is_active = not user.is_active
    await db.commit()

    return ApiResponse(data={"id": user.id, "is_active": user.is_active})


@router.get("/credits/logs", response_model=ApiResponse[dict])
async def list_credit_logs(
    page: int = 1,
    page_size: int = 20,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """积分流水列表."""
    total_result = await db.execute(select(func.count()).select_from(CreditLog))
    total = total_result.scalar() or 0

    result = await db.execute(
        select(CreditLog).order_by(desc(CreditLog.created_at)).offset((page - 1) * page_size).limit(page_size)
    )
    logs = result.scalars().all()

    return ApiResponse(data={
        "items": [
            {
                "id": log.id,
                "user_id": log.user_id,
                "type": log.type,
                "amount": log.amount,
                "balance": log.balance,
                "created_at": log.created_at.isoformat(),
            }
            for log in logs
        ],
        "meta": {"page": page, "page_size": page_size, "total": total, "total_pages": (total + page_size - 1) // page_size},
    })


@router.post("/credits/adjust", response_model=ApiResponse[dict])
async def adjust_credits(
    body: dict,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """调整用户额度."""
    user_id = body.get("user_id")
    amount = body.get("amount", 0)
    reason = body.get("reason", "")

    user = await db.get(User, user_id)
    if not user:
        from app.core.exceptions import NotFoundException
        raise NotFoundException("用户不存在")

    user.credits += amount
    log = CreditLog(
        user_id=user.id,
        type="admin_adjust",
        amount=amount,
        balance=user.credits,
        meta={"reason": reason, "operator": admin.id},
    )
    db.add(log)
    await db.commit()

    return ApiResponse(data={"user_id": user.id, "phone": user.phone, "credits": user.credits})


@router.get("/tasks", response_model=ApiResponse[dict])
async def list_tasks(
    status: str = "",
    page: int = 1,
    page_size: int = 20,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """任务列表."""
    query = select(Task)
    if status:
        query = query.where(Task.status == status)

    count_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = count_result.scalar() or 0

    result = await db.execute(
        query.order_by(desc(Task.created_at)).offset((page - 1) * page_size).limit(page_size)
    )
    tasks = result.scalars().all()

    return ApiResponse(data={
        "items": [
            {
                "id": t.id,
                "user_id": t.user_id,
                "scenario_code": t.scenario_code,
                "scenario_name": t.scenario_name,
                "title": t.title,
                "status": t.status,
                "progress": t.progress,
                "conn_id": t.conn_id,
                "task_id": t.task_id,
                "created_at": t.created_at.isoformat(),
            }
            for t in tasks
        ],
        "meta": {"page": page, "page_size": page_size, "total": total, "total_pages": (total + page_size - 1) // page_size},
    })


@router.get("/tasks/{task_id}/verify", response_model=ApiResponse[dict])
async def verify_task(
    task_id: str,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """任务核验详情."""
    task = await db.get(Task, task_id)
    if not task:
        from app.core.exceptions import NotFoundException
        raise NotFoundException("任务不存在")

    return ApiResponse(data={
        "id": task.id,
        "user_id": task.user_id,
        "scenario_name": task.scenario_name,
        "status": task.status,
        "progress": task.progress,
        "conn_id": task.conn_id,
        "task_id": task.task_id,
        "verify_url": f"https://app.infinisynapse.cn",
        "created_at": task.created_at.isoformat(),
    })


@router.get("/policies/pending", response_model=ApiResponse[dict])
async def list_pending_policies(
    page: int = 1,
    page_size: int = 20,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """待审核政策列表."""
    query = select(PolicyFeed).where(PolicyFeed.status == PolicyStatus.PENDING.value)

    count_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = count_result.scalar() or 0

    result = await db.execute(
        query.order_by(desc(PolicyFeed.created_at)).offset((page - 1) * page_size).limit(page_size)
    )
    policies = result.scalars().all()

    return ApiResponse(data={
        "items": [
            {
                "id": p.id,
                "title": p.title,
                "source": p.source,
                "source_url": p.source_url,
                "region": p.region,
                "industry": p.industry,
                "summary": p.summary,
                "publish_date": p.publish_date.isoformat() if p.publish_date else None,
                "status": p.status,
                "view_count": p.view_count,
                "tags": p.tags,
                "created_at": p.created_at.isoformat(),
            }
            for p in policies
        ],
        "meta": {"page": page, "page_size": page_size, "total": total, "total_pages": (total + page_size - 1) // page_size},
    })


@router.post("/policies/{policy_id}/review", response_model=ApiResponse[dict])
async def review_policy(
    policy_id: str,
    body: dict,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """审核政策."""
    policy = await db.get(PolicyFeed, policy_id)
    if not policy:
        from app.core.exceptions import NotFoundException
        raise NotFoundException("政策不存在")

    policy.status = body.get("status", PolicyStatus.APPROVED.value)
    await db.commit()

    return ApiResponse(data={"id": policy.id, "status": policy.status})
