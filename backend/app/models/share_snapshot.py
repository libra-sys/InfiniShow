"""分享快照模型."""

import ulid
from sqlalchemy import Column, DateTime, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import relationship

from app.core.constants import ShareType
from app.models.base import Base, TimestampMixin


class ShareSnapshot(Base, TimestampMixin):
    """分享快照表."""

    __tablename__ = "share_snapshots"

    id = Column(String(26), primary_key=True, default=lambda: str(ulid.new()), index=True)
    token = Column(String(64), unique=True, nullable=False, index=True)
    share_code = Column(String(16), unique=True, nullable=True, index=True)
    ref_code = Column(String(16), nullable=True)
    share_type = Column(String(20), default=ShareType.REPORT.value, nullable=False)
    user_id = Column(String(26), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    report_id = Column(String(26), ForeignKey("reports.id", ondelete="CASCADE"), nullable=True, index=True)
    task_id = Column(String(26), ForeignKey("tasks.id", ondelete="CASCADE"), nullable=True, index=True)
    title = Column(String(200), nullable=False)
    snapshot_data = Column(JSON, nullable=False)
    poster_url = Column(String(500), nullable=True)
    password = Column(String(64), nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    view_count = Column(Integer, default=0, nullable=False)
    unique_visitor_count = Column(Integer, default=0, nullable=False)
    converted_count = Column(Integer, default=0, nullable=False)

    user = relationship("User")
    report = relationship("Report", back_populates="share_snapshots")
    task = relationship("Task")
