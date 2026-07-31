"""积分流水模型."""

import ulid
from sqlalchemy import Column, ForeignKey, Integer, JSON, String
from sqlalchemy.orm import relationship

from app.core.constants import CreditType
from app.models.base import Base, TimestampMixin


class CreditLog(Base, TimestampMixin):
    """积分流水表."""

    __tablename__ = "credit_logs"

    id = Column(String(26), primary_key=True, default=lambda: str(ulid.new()), index=True)
    user_id = Column(String(26), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    type = Column(String(30), nullable=False, index=True)
    amount = Column(Integer, nullable=False)
    balance = Column(Integer, nullable=False)
    related_id = Column(String(26), nullable=True, index=True)
    meta = Column(JSON, nullable=True)

    user = relationship("User", back_populates="credit_logs")
