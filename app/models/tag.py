import uuid
from sqlalchemy import Column, String, DateTime, func
from sqlalchemy.orm import relationship
from app.db.base import Base
from app.db.types import GUID
from app.models.issue import issue_tags


class Tag(Base):
    __tablename__ = "tags"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), unique=True, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    issues = relationship("Issue", secondary=issue_tags, back_populates="tags")
