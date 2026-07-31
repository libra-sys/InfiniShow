"""政策搜索日志模型."""

import ulid
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.models.base import Base, TimestampMixin


class PolicySearchLog(Base, TimestampMixin):
    """政策搜索日志表."""

    __tablename__ = "policy_search_logs"

    id = Column(String(26), primary_key=True, default=lambda: str(ulid.new()), index=True)
    user_id = Column(String(26), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    task_id = Column(String(26), nullable=True)
    region_code = Column(String(10), nullable=True)
    result_count = Column(Integer, default=0, nullable=False)
    cost_credits = Column(Integer, default=0, nullable=False)

    user = relationship("User")
