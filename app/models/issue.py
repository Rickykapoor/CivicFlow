import uuid
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Text, Enum as SAEnum, func
from sqlalchemy.orm import relationship
from app.db.base import Base
from app.db.types import GUID
from app.models.enums import IssueStatus, IssuePriority, IssueCategory


# Association table for Issue <-> Tag
from sqlalchemy import Table
issue_tags = Table(
    "issue_tags",
    Base.metadata,
    Column("issue_id", GUID(), ForeignKey("issues.id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", GUID(), ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True),
)


class Issue(Base):
    __tablename__ = "issues"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4, index=True)
    title = Column(String(500), nullable=False, index=True)
    description = Column(Text, nullable=False)
    category = Column(SAEnum(IssueCategory), nullable=False, index=True)
    status = Column(SAEnum(IssueStatus), nullable=False, default=IssueStatus.OPEN, index=True)
    priority = Column(SAEnum(IssuePriority), nullable=False, default=IssuePriority.MEDIUM, index=True)

    # Location
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    address = Column(String(1000), nullable=True)
    ward = Column(String(100), nullable=True, index=True)
    zone = Column(String(100), nullable=True, index=True)

    # Relationships (FKs)
    reported_by_id = Column(GUID(), ForeignKey("users.id"), nullable=False, index=True)
    assigned_to_id = Column(GUID(), ForeignKey("users.id"), nullable=True)
    department_id = Column(GUID(), ForeignKey("departments.id"), nullable=True)

    # SLA
    sla_deadline = Column(DateTime(timezone=True), nullable=True)
    resolved_at = Column(DateTime(timezone=True), nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # ORM Relationships
    reporter = relationship("User", back_populates="reported_issues", foreign_keys=[reported_by_id])
    assignee = relationship("User", back_populates="assigned_issues", foreign_keys=[assigned_to_id])
    department = relationship("Department", back_populates="issues")
    status_history = relationship("IssueStatusHistory", back_populates="issue", cascade="all, delete-orphan")
    notes = relationship("IssueNote", back_populates="issue", cascade="all, delete-orphan")
    attachments = relationship("IssueAttachment", back_populates="issue", cascade="all, delete-orphan")
    tags = relationship("Tag", secondary=issue_tags, back_populates="issues")
