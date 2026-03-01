import uuid
from sqlalchemy import Column, String, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship
from app.db.base import Base
from app.db.types import GUID


class IssueAttachment(Base):
    __tablename__ = "issue_attachments"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    issue_id = Column(GUID(), ForeignKey("issues.id", ondelete="CASCADE"), nullable=False, index=True)
    uploaded_by_id = Column(GUID(), ForeignKey("users.id"), nullable=False)
    file_name = Column(String(500), nullable=False)
    file_path = Column(String(2000), nullable=False)
    mime_type = Column(String(100), nullable=True)
    file_size = Column(String(50), nullable=True)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    issue = relationship("Issue", back_populates="attachments")
    uploaded_by = relationship("User", back_populates="attachments")
