"""任务模型."""

import ulid
from sqlalchemy import Column, DateTime, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import relationship

from app.core.constants import TaskStatus
from app.models.base import Base, TimestampMixin


class Task(Base, TimestampMixin):
    """分析任务表."""

    __tablename__ = "tasks"

    id = Column(String(26), primary_key=True, default=lambda: str(ulid.new()), index=True)
    user_id = Column(String(26), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    scenario_code = Column(String(50), nullable=False, index=True)
    scenario_name = Column(String(100), nullable=False)
    title = Column(String(200), nullable=True)
    status = Column(String(20), default=TaskStatus.PENDING.value, nullable=False, index=True)
    progress = Column(Integer, default=0, nullable=False)
    conn_id = Column(String(64), nullable=True, unique=True, index=True)
    task_id = Column(String(64), nullable=True, index=True)
    prompt_text = Column(Text, nullable=True)
    chat_settings = Column(JSON, nullable=True)
    current_event_id = Column(String(64), nullable=True)
    error_message = Column(Text, nullable=True)
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    user = relationship("User", back_populates="tasks")
    files = relationship("FileRecord", back_populates="task")
    report = relationship("Report", back_populates="task", uselist=False)
