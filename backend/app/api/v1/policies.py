"""政策 API."""

from fastapi import APIRouter, Depends
from sqlalchemy import desc, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db, pagination_params, require_admin
from app.core.constants import PolicyStatus
from app.models.policy_feed import PolicyFeed
from app.models.user import User
from app.schemas.base import ApiResponse, PaginationParams
from app.schemas.policy import PolicyResponse

router = APIRouter()


@router.get("", response_model=ApiResponse[dict])
async def list_policies(
    keyword: str | None = None,
    region: str | None = None,
    industry: str | None = None,
    pagination: PaginationParams = Depends(pagination_params),
    db: AsyncSession = Depends(get_db),
):
    """政策列表."""
    query = select(PolicyFeed).where(PolicyFeed.status == PolicyStatus.APPROVED.value)

    if keyword:
        query = query.where(
            or_(
                PolicyFeed.title.ilike(f"%{keyword}%"),
                PolicyFeed.summary.ilike(f"%{keyword}%"),
            )
        )
    if region:
        query = query.where(PolicyFeed.region.ilike(f"%{region}%"))
    if industry:
        query = query.where(PolicyFeed.industry.ilike(f"%{industry}%"))

    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    query = query.order_by(desc(PolicyFeed.publish_date)).offset(
        (pagination.page - 1) * pagination.page_size
    ).limit(pagination.page_size)
    result = await db.execute(query)
    policies = result.scalars().all()

    return ApiResponse(
        data={
            "items": [PolicyResponse.model_validate(p).model_dump(mode="json") for p in policies],
            "meta": {
                "page": pagination.page,
                "page_size": pagination.page_size,
                "total": total,
                "total_pages": (total + pagination.page_size - 1) // pagination.page_size,
            },
        }
    )


@router.post("/{policy_id}/feedback", response_model=ApiResponse[dict])
async def policy_feedback(
    policy_id: str,
    body: dict,
    user: User = Depends(get_current_user),
):
    """政策反馈."""
    return ApiResponse(data={"message": "反馈已记录", "policy_id": policy_id})


@router.post("", response_model=ApiResponse[PolicyResponse])
async def create_policy(
    body: dict,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """创建政策（Admin）."""
    policy = PolicyFeed(
        title=body.get("title", ""),
        source=body.get("source"),
        source_url=body.get("source_url"),
        region=body.get("region"),
        industry=body.get("industry"),
        summary=body.get("summary"),
        content=body.get("content"),
        publish_date=body.get("publish_date"),
        status=body.get("status", PolicyStatus.PENDING.value),
        tags=body.get("tags"),
    )
    db.add(policy)
    await db.commit()
    await db.refresh(policy)
    return ApiResponse(data=PolicyResponse.model_validate(policy))
