import uuid
from sqlalchemy import Column, String, Text, ForeignKey, DateTime, func, Enum as SAEnum
from sqlalchemy.orm import relationship
from app.db.base import Base
from app.db.types import GUID
from app.models.enums import IssueStatus


class IssueStatusHistory(Base):
    __tablename__ = "issue_status_history"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    issue_id = Column(GUID(), ForeignKey("issues.id", ondelete="CASCADE"), nullable=False, index=True)
    old_status = Column(SAEnum(IssueStatus), nullable=True)
    new_status = Column(SAEnum(IssueStatus), nullable=False)
    changed_by_id = Column(GUID(), ForeignKey("users.id"), nullable=False)
    comment = Column(Text, nullable=True)
    changed_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    issue = relationship("Issue", back_populates="status_history")
    changed_by = relationship("User", back_populates="status_changes")
