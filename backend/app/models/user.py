"""用户模型."""

import ulid
from sqlalchemy import Boolean, Column, DateTime, Integer, String
from sqlalchemy.orm import relationship

from app.core.constants import INITIAL_CREDITS, UserRole
from app.models.base import Base, TimestampMixin


class User(Base, TimestampMixin):
    """用户表."""

    __tablename__ = "users"

    id = Column(String(26), primary_key=True, default=lambda: str(ulid.new()), index=True)
    phone = Column(String(20), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    nickname = Column(String(50), nullable=True)
    avatar = Column(String(255), nullable=True)
    role = Column(String(20), default=UserRole.USER.value, nullable=False)
    credits = Column(Integer, default=INITIAL_CREDITS, nullable=False)
    invite_code = Column(String(20), unique=True, nullable=True, index=True)
    invited_by = Column(String(26), nullable=True, index=True)
    referred_by = Column(String(26), nullable=True, index=True)
    preferred_language = Column(String(10), default="zh-CN", nullable=False)
    last_check_in_at = Column(DateTime(timezone=True), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

    tasks = relationship("Task", back_populates="user", cascade="all, delete-orphan")
    files = relationship("FileRecord", back_populates="user", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="user", cascade="all, delete-orphan")
    credit_logs = relationship("CreditLog", back_populates="user", cascade="all, delete-orphan")
    invite_records = relationship(
        "InviteRecord", foreign_keys="InviteRecord.inviter_id", back_populates="inviter"
    )

    def is_admin(self) -> bool:
        return self.role in (UserRole.ADMIN.value, UserRole.SUPERADMIN.value)

    def is_superadmin(self) -> bool:
        return self.role == UserRole.SUPERADMIN.value
