"""邀请/积分 API."""

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.core.exceptions import BusinessException
from app.models.credit_log import CreditLog
from app.models.user import User
from app.schemas.base import ApiResponse
from app.schemas.invite import CheckInResponse, InviteCodeResponse
from app.services.user_service import check_in, list_credit_logs

router = APIRouter()


@router.post("/claim", response_model=ApiResponse[dict])
async def claim_invite_reward(
    body: dict,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """手动领取邀请奖励（如未自动到账时）."""
    invite_code = body.get("invite_code", "")
    if not invite_code:
        raise BusinessException("邀请码不能为空")

    if user.invited_by:
        raise BusinessException("已绑定邀请关系，无法重复领取")

    # 查找邀请人
    result = await db.execute(select(User).where(User.invite_code == invite_code))
    inviter = result.scalar_one_or_none()
    if not inviter:
        raise BusinessException("邀请码无效")

    # 绑定邀请关系
    user.invited_by = inviter.id

    # 双方各得 +3 额度
    user.credits += 3
    inviter.credits += 3

    # 记录积分流水
    db.add(CreditLog(user_id=user.id, type="invite_reward_invitee", amount=3, balance=user.credits, related_id=inviter.id))
    db.add(CreditLog(user_id=inviter.id, type="invite_reward_inviter", amount=3, balance=inviter.credits, related_id=user.id))

    await db.commit()

    return ApiResponse(data={
        "credits_added": 3,
        "balance": user.credits,
        "inviter": inviter.nickname or inviter.phone,
    })


@router.get("/code", response_model=ApiResponse[InviteCodeResponse])
async def get_invite_code(
    user: User = Depends(get_current_user),
):
    """获取邀请码."""
    base_url = "http://localhost:5173"
    return ApiResponse(data=InviteCodeResponse(
        invite_code=user.invite_code or "",
        invite_url=f"{base_url}/register?invite_code={user.invite_code or ''}",
        invite_count=0,
    ))


@router.post("/check-in", response_model=ApiResponse[CheckInResponse])
async def check_in_endpoint(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """每日签到."""
    result = await check_in(db, user)
    return ApiResponse(data=CheckInResponse(
        success=result["success"],
        credits_added=result["credits_added"],
        total_credits=result["total_credits"],
        next_check_in_at=result["next_check_in_at"],
    ))


@router.get("/credits/logs", response_model=ApiResponse[dict])
async def list_credit_logs_endpoint(
    page: int = 1,
    page_size: int = 20,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """积分流水."""
    result = await list_credit_logs(db, user, page, page_size)
    return ApiResponse(data=result)
