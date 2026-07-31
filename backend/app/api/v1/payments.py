"""付费模块 API（套餐/订单/支付回调）."""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.core.exceptions import BusinessException, NotFoundException
from app.models.order import Order
from app.models.package import Package
from app.models.user import User
from app.schemas.base import ApiResponse

router = APIRouter()


@router.get("/packages", response_model=ApiResponse[list[dict]])
async def list_packages(
    db: AsyncSession = Depends(get_db),
):
    """获取在售套餐."""
    result = await db.execute(select(Package).where(Package.is_active == True).order_by(Package.price_cents))
    packages = result.scalars().all()
    return ApiResponse(data=[
        {
            "id": p.id,
            "name": p.name,
            "credits": p.credits,
            "price_cents": p.price_cents,
            "price_yuan": f"{p.price_cents / 100:.2f}",
            "currency": p.currency,
            "valid_days": p.valid_days,
        }
        for p in packages
    ])


@router.post("/orders", response_model=ApiResponse[dict])
async def create_order(
    body: dict,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """创建订单."""
    package_id = body.get("package_id")
    payment_channel = body.get("payment_channel", "wechat")

    package = await db.get(Package, package_id)
    if not package or not package.is_active:
        raise NotFoundException("套餐不存在或已下架")

    order = Order(
        user_id=user.id,
        package_id=package.id,
        status="pending",
        amount_cents=package.price_cents,
        payment_channel=payment_channel,
    )
    db.add(order)
    await db.commit()
    await db.refresh(order)

    # 实际项目中这里调用微信/支付宝下单接口
    return ApiResponse(data={
        "order_id": order.id,
        "amount_cents": order.amount_cents,
        "status": order.status,
        "payment_channel": payment_channel,
        "pay_url": f"mock://pay/{order.id}",  # 实际替换为真实支付链接
    })


@router.post("/payments/webhook", response_model=ApiResponse[dict])
async def payment_webhook(
    body: dict,
    db: AsyncSession = Depends(get_db),
):
    """支付回调（微信/支付宝异步通知）."""
    order_id = body.get("order_id")
    out_trade_no = body.get("out_trade_no")
    status = body.get("status")

    order = await db.get(Order, order_id)
    if not order:
        raise NotFoundException("订单不存在")

    if status == "paid":
        order.status = "paid"
        order.paid_at = datetime.now(timezone.utc)
        order.out_trade_no = out_trade_no

        # 增加用户额度
        package = await db.get(Package, order.package_id)
        if package:
            user = await db.get(User, order.user_id)
            if user:
                user.credits += package.credits
                from app.models.credit_log import CreditLog
                db.add(CreditLog(
                    user_id=user.id,
                    type="purchase",
                    amount=package.credits,
                    balance=user.credits,
                    related_id=order.id,
                ))

        await db.commit()

    return ApiResponse(data={"order_id": order_id, "status": "ok"})


@router.post("/orders/{order_id}/query", response_model=ApiResponse[dict])
async def query_order(
    order_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """查询订单支付状态."""
    order = await db.get(Order, order_id)
    if not order or order.user_id != user.id:
        raise NotFoundException("订单不存在")

    return ApiResponse(data={
        "order_id": order.id,
        "status": order.status,
        "amount_cents": order.amount_cents,
        "paid_at": order.paid_at.isoformat() if order.paid_at else None,
    })
