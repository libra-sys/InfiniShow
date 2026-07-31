"""用户服务."""

import secrets

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.constants import CREDITS_INVITE, CREDITS_REGISTER, UserRole
from app.core.exceptions import BusinessException, NotFoundException
from app.core.security import get_password_hash, verify_password
from app.models.credit_log import CreditLog
from app.models.invite_record import InviteRecord
from app.models.user import User


async def get_user_by_phone(db: AsyncSession, phone: str) -> User | None:
    """根据手机号查询用户."""
    result = await db.execute(select(User).where(User.phone == phone))
    return result.scalar_one_or_none()


async def get_user_by_id(db: AsyncSession, user_id: str) -> User | None:
    """根据 ID 查询用户."""
    return await db.get(User, user_id)


async def create_user(
    db: AsyncSession,
    phone: str,
    password: str,
    nickname: str | None = None,
    invite_code: str | None = None,
) -> User:
    """创建新用户."""
    existing = await get_user_by_phone(db, phone)
    if existing:
        raise BusinessException("该手机号已注册", code=409)

    # 生成邀请码
    own_invite_code = secrets.token_hex(6).upper()

    # 查找邀请人
    inviter_id = None
    if invite_code:
        inviter = await db.execute(select(User).where(User.invite_code == invite_code))
        inviter_obj = inviter.scalar_one_or_none()
        if inviter_obj:
            inviter_id = inviter_obj.id

    user = User(
        phone=phone,
        hashed_password=get_password_hash(password),
        nickname=nickname,
        invite_code=own_invite_code,
        invited_by=inviter_id,
        credits=CREDITS_REGISTER,
    )
    db.add(user)
    await db.flush()

    # 记录注册积分
    credit_log = CreditLog(
        user_id=user.id,
        type="register",
        amount=CREDITS_REGISTER,
        balance=user.credits,
        related_id=user.id,
    )
    db.add(credit_log)

    # 邀请奖励
    if inviter_id:
        inviter_obj = await db.get(User, inviter_id)
        if inviter_obj:
            inviter_obj.credits += CREDITS_INVITE
            inviter_log = CreditLog(
                user_id=inviter_id,
                type="invite",
                amount=CREDITS_INVITE,
                balance=inviter_obj.credits,
                related_id=user.id,
            )
            db.add(inviter_log)

            invite_record = InviteRecord(
                inviter_id=inviter_id,
                invitee_id=user.id,
                invitee_phone=phone,
            )
            db.add(invite_record)

    await db.commit()
    await db.refresh(user)
    return user


async def authenticate_user(db: AsyncSession, phone: str, password: str) -> User:
    """验证用户凭据."""
    user = await get_user_by_phone(db, phone)
    if not user:
        raise NotFoundException("用户不存在")
    if not verify_password(password, user.hashed_password):
        raise BusinessException("手机号或密码错误", code=401)
    if not user.is_active:
        raise BusinessException("账号已被禁用", code=403)
    return user


async def check_in(db: AsyncSession, user: User) -> dict:
    """每日签到."""
    from datetime import datetime, timezone

    if user.last_check_in_at:
        today = datetime.now(timezone.utc).date()
        last_checkin = user.last_check_in_at.date() if user.last_check_in_at.tzinfo else user.last_check_in_at.replace(tzinfo=timezone.utc).date()
        if today == last_checkin:
            raise BusinessException("今天已签到，明天再来吧")

    from app.core.constants import CREDITS_DAILY_CHECKIN

    user.credits += CREDITS_DAILY_CHECKIN
    user.last_check_in_at = datetime.now(timezone.utc)

    credit_log = CreditLog(
        user_id=user.id,
        type="daily_checkin",
        amount=CREDITS_DAILY_CHECKIN,
        balance=user.credits,
    )
    db.add(credit_log)
    await db.commit()

    return {
        "success": True,
        "credits_added": CREDITS_DAILY_CHECKIN,
        "total_credits": user.credits,
        "next_check_in_at": None,
    }


async def list_credit_logs(db: AsyncSession, user: User, page: int = 1, page_size: int = 20) -> dict:
    """查询积分流水."""
    from sqlalchemy import desc, func

    total_result = await db.execute(
        select(func.count()).where(CreditLog.user_id == user.id)
    )
    total = total_result.scalar() or 0

    result = await db.execute(
        select(CreditLog)
        .where(CreditLog.user_id == user.id)
        .order_by(desc(CreditLog.created_at))
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    logs = result.scalars().all()

    return {
        "items": [
            {
                "type": log.type,
                "amount": log.amount,
                "balance": log.balance,
                "created_at": log.created_at,
                "description": log.meta.get("description") if log.meta else None,
            }
            for log in logs
        ],
        "meta": {
            "page": page,
            "page_size": page_size,
            "total": total,
            "total_pages": (total + page_size - 1) // page_size,
        },
    }
