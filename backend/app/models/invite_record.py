"""邀请记录模型."""

import ulid
from sqlalchemy import Column, DateTime, ForeignKey, String
from sqlalchemy.orm import relationship

from app.models.base import Base, TimestampMixin


class InviteRecord(Base, TimestampMixin):
    """邀请记录表."""

    __tablename__ = "invite_records"

    id = Column(String(26), primary_key=True, default=lambda: str(ulid.new()), index=True)
    inviter_id = Column(String(26), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    invitee_id = Column(String(26), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    invitee_phone = Column(String(20), nullable=False)
    rewarded_at = Column(DateTime(timezone=True), nullable=True)

    inviter = relationship("User", foreign_keys=[inviter_id], back_populates="invite_records")
    invitee = relationship("User", foreign_keys=[invitee_id])
