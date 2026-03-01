import uuid
from sqlalchemy import Column, String, Text, ForeignKey, DateTime, func, JSON
from sqlalchemy.orm import relationship
from app.db.base import Base
from app.db.types import GUID


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID(), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    action = Column(String(100), nullable=False)         # e.g. "CREATE", "UPDATE", "DELETE", "STATUS_CHANGE"
    entity_type = Column(String(100), nullable=False)    # e.g. "Issue", "User"
    entity_id = Column(String(255), nullable=True)
    details = Column(JSON, nullable=True)                # extra metadata (JSON works on SQLite + PostgreSQL)
    ip_address = Column(String(50), nullable=True)
    user_agent = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)

    user = relationship("User", back_populates="audit_logs")
