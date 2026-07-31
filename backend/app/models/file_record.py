"""文件记录模型."""

import ulid
from sqlalchemy import Column, ForeignKey, Integer, JSON, String
from sqlalchemy.orm import relationship

from app.core.constants import FileType
from app.models.base import Base, TimestampMixin


class FileRecord(Base, TimestampMixin):
    """上传文件记录表."""

    __tablename__ = "file_records"

    id = Column(String(26), primary_key=True, default=lambda: str(ulid.new()), index=True)
    user_id = Column(String(26), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    task_id = Column(String(26), ForeignKey("tasks.id", ondelete="SET NULL"), nullable=True, index=True)
    original_name = Column(String(255), nullable=False)
    file_type = Column(String(20), default=FileType.EXCEL.value, nullable=False)
    storage_key = Column(String(500), nullable=False, unique=True, index=True)
    size_bytes = Column(Integer, nullable=False)
    columns = Column(JSON, nullable=True)
    row_count = Column(Integer, nullable=True)

    user = relationship("User", back_populates="files")
    task = relationship("Task", back_populates="files")
