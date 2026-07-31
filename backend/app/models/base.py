"""SQLAlchemy 基础模型与通用字段."""

from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, String
from sqlalchemy.orm import declarative_base

Base = declarative_base()


class TimestampMixin:
    """时间戳 Mixin."""

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )


class ULIDPrimaryKeyMixin:
    """ULID 主键 Mixin."""

    id = Column(String(26), primary_key=True, index=True)
