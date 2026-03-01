import asyncio
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, File, Query, Request, UploadFile, status, BackgroundTasks
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.dependencies import get_current_user, require_staff_or_admin
from app.middleware.rate_limit import limiter
from app.models.enums import IssueCategory, IssuePriority, IssueStatus, UserRole
from app.models.user import User
from app.schemas.issue import (
    IssueCreate, IssueUpdate, IssueStatusUpdate, IssueFilterParams,
    IssueResponse, IssueSummary, NoteCreate, NoteResponse,
    StatusHistoryResponse, AttachmentResponse, NearbyParams,
)
from app.services import issue_service, file_service, notification_service
from app.core.response import success_response, paginated_response
from datetime import datetime

router = APIRouter(prefix="/issues", tags=["Issues"])


def _can_view_internal(user: User) -> bool:
    return user.role in (UserRole.STAFF, UserRole.ADMIN)


@router.post("/", status_code=status.HTTP_201_CREATED)
@limiter.limit("10/minute")
async def create_issue(
    request: Request,
    data: IssueCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    issue = issue_service.create_issue(db, data, current_user)
    # Async email notification in background
    background_tasks.add_task(
        notification_service.notify_issue_created,
        current_user.email,
        issue.title,
        str(issue.id),
    )
    # Attach user_id to request state for audit middleware
    request.state.user_id = str(current_user.id)
    return success_response(
        data=IssueResponse.model_validate(issue).model_dump(mode="json"),
        message="Issue reported successfully",
        status_code=status.HTTP_201_CREATED,
    )


@router.get("/nearby")
def nearby_issues(
    latitude: float = Query(...),
    longitude: float = Query(...),
    radius_km: float = Query(1.0, ge=0.1, le=50.0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    issues = issue_service.detect_nearby_issues(db, latitude, longitude, radius_km)
    data = [IssueSummary.model_validate(i).model_dump(mode="json") for i in issues]
    return success_response(data=data, message=f"{len(data)} nearby issue(s) found")


@router.get("/")
def list_issues(
    category: Optional[IssueCategory] = None,
    status: Optional[IssueStatus] = None,
    priority: Optional[IssuePriority] = None,
    ward: Optional[str] = None,
    zone: Optional[str] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    sort_by: str = Query("created_at"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    params = IssueFilterParams(
        category=category, status=status, priority=priority,
        ward=ward, zone=zone, date_from=date_from, date_to=date_to,
        search=search, page=page, page_size=page_size,
        sort_by=sort_by, sort_order=sort_order,
    )
    items, total = issue_service.list_issues(db, params)
    data = [IssueSummary.model_validate(i).model_dump(mode="json") for i in items]
    return paginated_response(items=data, total=total, page=page, page_size=page_size)


@router.get("/{issue_id}")
def get_issue(
    issue_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    issue = issue_service.get_issue(db, issue_id)
    return success_response(
        data=IssueResponse.model_validate(issue).model_dump(mode="json"),
        message="Issue retrieved",
    )


@router.put("/{issue_id}")
def update_issue(
    issue_id: UUID,
    data: IssueUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff_or_admin),
):
    request.state.user_id = str(current_user.id)
    issue = issue_service.update_issue(db, issue_id, data, current_user)
    return success_response(
        data=IssueResponse.model_validate(issue).model_dump(mode="json"),
        message="Issue updated",
    )


@router.delete("/{issue_id}", status_code=status.HTTP_200_OK)
def delete_issue(
    issue_id: UUID,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff_or_admin),
):
    request.state.user_id = str(current_user.id)
    issue_service.delete_issue(db, issue_id)
    return success_response(message="Issue deleted")


@router.post("/{issue_id}/status")
async def change_status(
    issue_id: UUID,
    data: IssueStatusUpdate,
    request: Request,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff_or_admin),
):
    request.state.user_id = str(current_user.id)
    issue = issue_service.change_status(db, issue_id, data, current_user)
    background_tasks.add_task(
        notification_service.notify_status_changed,
        issue.reporter.email,
        issue.title,
        issue.status.value,
    )
    return success_response(
        data=IssueResponse.model_validate(issue).model_dump(mode="json"),
        message=f"Status changed to {issue.status.value}",
    )


@router.get("/{issue_id}/history")
def status_history(
    issue_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    history = issue_service.get_status_history(db, issue_id)
    data = [StatusHistoryResponse.model_validate(h).model_dump(mode="json") for h in history]
    return success_response(data=data, message="Status history retrieved")


@router.post("/{issue_id}/notes", status_code=status.HTTP_201_CREATED)
def add_note(
    issue_id: UUID,
    data: NoteCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff_or_admin),
):
    request.state.user_id = str(current_user.id)
    note = issue_service.add_note(db, issue_id, data, current_user)
    return success_response(
        data=NoteResponse.model_validate(note).model_dump(mode="json"),
        message="Note added",
        status_code=status.HTTP_201_CREATED,
    )


@router.get("/{issue_id}/notes")
def get_notes(
    issue_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    include_internal = _can_view_internal(current_user)
    notes = issue_service.get_notes(db, issue_id, include_internal=include_internal)
    data = [NoteResponse.model_validate(n).model_dump(mode="json") for n in notes]
    return success_response(data=data, message="Notes retrieved")


@router.post("/{issue_id}/attachments", status_code=status.HTTP_201_CREATED)
async def upload_attachment(
    issue_id: UUID,
    request: Request,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    request.state.user_id = str(current_user.id)
    issue = issue_service.get_issue(db, issue_id)
    orig_name, file_path, file_size = await file_service.save_file(file, str(issue_id))
    attachment = issue_service.add_attachment(
        db, issue_id, orig_name, file_path, file.content_type, file_size, current_user
    )
    return success_response(
        data=AttachmentResponse.model_validate(attachment).model_dump(mode="json"),
        message="Attachment uploaded",
        status_code=status.HTTP_201_CREATED,
    )


@router.get("/{issue_id}/attachments")
def get_attachments(
    issue_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    issue = issue_service.get_issue(db, issue_id)
    data = [AttachmentResponse.model_validate(a).model_dump(mode="json") for a in issue.attachments]
    return success_response(data=data, message="Attachments retrieved")
