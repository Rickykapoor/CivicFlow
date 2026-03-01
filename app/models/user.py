import uuid
from sqlalchemy import Column, String, Boolean, Enum as SAEnum, DateTime, func
from sqlalchemy.orm import relationship
from app.db.base import Base
from app.db.types import GUID
from app.models.enums import UserRole


class User(Base):
    __tablename__ = "users"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    phone = Column(String(20), nullable=True)
    role = Column(SAEnum(UserRole), nullable=False, default=UserRole.CITIZEN)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    reported_issues = relationship("Issue", back_populates="reporter", foreign_keys="Issue.reported_by_id")
    assigned_issues = relationship("Issue", back_populates="assignee", foreign_keys="Issue.assigned_to_id")
    notes = relationship("IssueNote", back_populates="author")
    attachments = relationship("IssueAttachment", back_populates="uploaded_by")
    status_changes = relationship("IssueStatusHistory", back_populates="changed_by")
    audit_logs = relationship("AuditLog", back_populates="user")
