import uuid
from sqlalchemy import Column, String, Text, DateTime, func
from sqlalchemy.orm import relationship
from app.db.base import Base
from app.db.types import GUID


class Department(Base):
    __tablename__ = "departments"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    issues = relationship("Issue", back_populates="department")
