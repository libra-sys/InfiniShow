"""订单模型."""

import ulid
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.models.base import Base, TimestampMixin


class Order(Base, TimestampMixin):
    """订单表."""

    __tablename__ = "orders"

    id = Column(String(26), primary_key=True, default=lambda: str(ulid.new()), index=True)
    user_id = Column(String(26), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    package_id = Column(String(26), ForeignKey("packages.id"), nullable=False, index=True)
    status = Column(String(20), default="pending", nullable=False)  # pending/paid/cancelled/refunded
    amount_cents = Column(Integer, nullable=False)
    paid_at = Column(DateTime(timezone=True), nullable=True)
    out_trade_no = Column(String(64), nullable=True)
    payment_channel = Column(String(20), nullable=True)  # wechat/alipay

    user = relationship("User")
    package = relationship("Package", back_populates="orders")
