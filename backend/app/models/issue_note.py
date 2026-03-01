import uuid
from sqlalchemy import Column, String, Text, ForeignKey, Boolean, DateTime, func
from sqlalchemy.orm import relationship
from app.db.base import Base
from app.db.types import GUID


class IssueNote(Base):
    __tablename__ = "issue_notes"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    issue_id = Column(GUID(), ForeignKey("issues.id", ondelete="CASCADE"), nullable=False, index=True)
    author_id = Column(GUID(), ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    is_internal = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    issue = relationship("Issue", back_populates="notes")
    author = relationship("User", back_populates="notes")
