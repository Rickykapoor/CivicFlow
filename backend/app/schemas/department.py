from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional


class DepartmentCreate(BaseModel):
    name: str
    description: Optional[str] = None


class DepartmentUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


class DepartmentResponse(BaseModel):
    id: UUID
    name: str
    description: Optional[str]
    created_at: datetime
    model_config = {"from_attributes": True}
