"""政策资讯模型."""

import ulid
from sqlalchemy import Column, DateTime, Integer, JSON, String, Text

from app.core.constants import PolicyStatus
from app.models.base import Base, TimestampMixin


class PolicyFeed(Base, TimestampMixin):
    """政策资讯缓存表."""

    __tablename__ = "policy_feeds"

    id = Column(String(26), primary_key=True, default=lambda: str(ulid.new()), index=True)
    title = Column(String(300), nullable=False)
    source = Column(String(200), nullable=True)
    source_url = Column(String(500), nullable=True)
    region = Column(String(100), nullable=True, index=True)
    industry = Column(String(100), nullable=True, index=True)
    summary = Column(Text, nullable=True)
    content = Column(Text, nullable=True)
    publish_date = Column(DateTime(timezone=True), nullable=True)
    status = Column(String(20), default=PolicyStatus.APPROVED.value, nullable=False)
    view_count = Column(Integer, default=0, nullable=False)
    tags = Column(JSON, nullable=True)
