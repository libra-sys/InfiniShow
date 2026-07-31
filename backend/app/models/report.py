"""报告模型."""

import ulid
from sqlalchemy import Column, ForeignKey, JSON, String, Text
from sqlalchemy.orm import relationship

from app.core.constants import ReportStatus
from app.models.base import Base, TimestampMixin


class Report(Base, TimestampMixin):
    """分析报告表."""

    __tablename__ = "reports"

    id = Column(String(26), primary_key=True, default=lambda: str(ulid.new()), index=True)
    user_id = Column(String(26), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    task_id = Column(String(26), ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    title = Column(String(200), nullable=False)
    overall_score = Column(String(10), nullable=True)
    health_scores = Column(JSON, nullable=True)
    kpis = Column(JSON, nullable=True)
    charts = Column(JSON, nullable=True)
    conclusions = Column(JSON, nullable=True)
    actions = Column(JSON, nullable=True)
    raw_data_summary = Column(JSON, nullable=True)
    status = Column(String(20), default=ReportStatus.PENDING.value, nullable=False)
    markdown_content = Column(Text, nullable=True)
    pdf_url = Column(String(500), nullable=True)

    user = relationship("User", back_populates="reports")
    task = relationship("Task", back_populates="report")
    share_snapshots = relationship("ShareSnapshot", back_populates="report")
