"""用户 API."""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.base import ApiResponse
from app.schemas.user import UserCreditsResponse, UserProfileResponse
from app.services.user_service import check_in, list_credit_logs

router = APIRouter()


@router.get("/me", response_model=ApiResponse[UserProfileResponse])
async def get_me(
    user: User = Depends(get_current_user),
):
    """获取当前用户信息."""
    return ApiResponse(data=UserProfileResponse.model_validate(user))


@router.get("/credits", response_model=ApiResponse[UserCreditsResponse])
async def get_credits(
    user: User = Depends(get_current_user),
):
    """获取当前用户积分."""
    today = datetime.now(timezone.utc).date()
    today_checked_in = False
    if user.last_check_in_at:
        last_date = user.last_check_in_at.date() if user.last_check_in_at.tzinfo else user.last_check_in_at.replace(tzinfo=timezone.utc).date()
        today_checked_in = today == last_date

    return ApiResponse(data=UserCreditsResponse(
        credits=user.credits,
        today_checked_in=today_checked_in,
        last_check_in_at=user.last_check_in_at,
    ))


@router.get("/credits/logs", response_model=ApiResponse[dict])
async def get_credit_logs(
    page: int = 1,
    page_size: int = 20,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """获取积分流水."""
    result = await list_credit_logs(db, user, page, page_size)
    return ApiResponse(data=result)
