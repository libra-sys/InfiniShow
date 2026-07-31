"""套餐模型."""

import ulid
from sqlalchemy import Boolean, Column, Integer, String
from sqlalchemy.orm import relationship

from app.models.base import Base, TimestampMixin


class Package(Base, TimestampMixin):
    """套餐表."""

    __tablename__ = "packages"

    id = Column(String(26), primary_key=True, default=lambda: str(ulid.new()), index=True)
    name = Column(String(100), nullable=False)
    credits = Column(Integer, nullable=False)
    price_cents = Column(Integer, nullable=False)
    currency = Column(String(10), default="CNY", nullable=False)
    valid_days = Column(Integer, default=30, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    orders = relationship("Order", back_populates="package")
