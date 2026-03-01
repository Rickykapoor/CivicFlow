from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional, List
from app.models.enums import IssueStatus, IssuePriority, IssueCategory
from app.schemas.user import UserListResponse


class IssueCreate(BaseModel):
    title: str
    description: str
    category: IssueCategory
    priority: IssuePriority = IssuePriority.MEDIUM
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    address: Optional[str] = None
    ward: Optional[str] = None
    zone: Optional[str] = None
    tag_names: List[str] = []


class IssueUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[IssueCategory] = None
    priority: Optional[IssuePriority] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    address: Optional[str] = None
    ward: Optional[str] = None
    zone: Optional[str] = None
    assigned_to_id: Optional[UUID] = None
    department_id: Optional[UUID] = None
    tag_names: Optional[List[str]] = None


class IssueStatusUpdate(BaseModel):
    status: IssueStatus
    comment: Optional[str] = None


class TagResponse(BaseModel):
    id: UUID
    name: str
    model_config = {"from_attributes": True}


class AttachmentResponse(BaseModel):
    id: UUID
    file_name: str
    file_path: str
    mime_type: Optional[str]
    uploaded_at: datetime
    model_config = {"from_attributes": True}


class StatusHistoryResponse(BaseModel):
    id: UUID
    old_status: Optional[IssueStatus]
    new_status: IssueStatus
    comment: Optional[str]
    changed_at: datetime
    changed_by: UserListResponse
    model_config = {"from_attributes": True}


class NoteCreate(BaseModel):
    content: str
    is_internal: bool = True


class NoteResponse(BaseModel):
    id: UUID
    content: str
    is_internal: bool
    created_at: datetime
    author: UserListResponse
    model_config = {"from_attributes": True}


class IssueResponse(BaseModel):
    id: UUID
    title: str
    description: str
    category: IssueCategory
    status: IssueStatus
    priority: IssuePriority
    latitude: Optional[float]
    longitude: Optional[float]
    address: Optional[str]
    ward: Optional[str]
    zone: Optional[str]
    sla_deadline: Optional[datetime]
    resolved_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    reporter: UserListResponse
    assignee: Optional[UserListResponse]
    tags: List[TagResponse] = []
    attachments: List[AttachmentResponse] = []
    model_config = {"from_attributes": True}


class IssueSummary(BaseModel):
    """Lightweight issue representation for list views."""
    id: UUID
    title: str
    category: IssueCategory
    status: IssueStatus
    priority: IssuePriority
    ward: Optional[str]
    address: Optional[str]
    created_at: datetime
    reporter: UserListResponse
    model_config = {"from_attributes": True}


class IssueFilterParams(BaseModel):
    category: Optional[IssueCategory] = None
    status: Optional[IssueStatus] = None
    priority: Optional[IssuePriority] = None
    ward: Optional[str] = None
    zone: Optional[str] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    search: Optional[str] = None
    page: int = 1
    page_size: int = 20
    sort_by: str = "created_at"
    sort_order: str = "desc"


class NearbyParams(BaseModel):
    latitude: float
    longitude: float
    radius_km: float = 1.0
