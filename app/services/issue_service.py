from datetime import datetime, timezone, timedelta
from typing import Optional, List, Tuple
from uuid import UUID
import math

from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, desc, asc

from app.models.issue import Issue
from app.models.issue_status_history import IssueStatusHistory
from app.models.issue_note import IssueNote
from app.models.issue_attachment import IssueAttachment
from app.models.tag import Tag
from app.models.user import User
from app.models.enums import IssueStatus, IssuePriority, IssueCategory

from app.schemas.issue import IssueCreate, IssueUpdate, IssueStatusUpdate, IssueFilterParams, NoteCreate
from app.core.exceptions import NotFoundException, ForbiddenException, BadRequestException
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

_SLA_MAP = {
    IssuePriority.CRITICAL: settings.SLA_CRITICAL_DAYS,
    IssuePriority.HIGH: settings.SLA_HIGH_DAYS,
    IssuePriority.MEDIUM: settings.SLA_MEDIUM_DAYS,
    IssuePriority.LOW: settings.SLA_LOW_DAYS,
}

_VALID_TRANSITIONS = {
    IssueStatus.OPEN: [IssueStatus.IN_PROGRESS, IssueStatus.CLOSED],
    IssueStatus.IN_PROGRESS: [IssueStatus.RESOLVED, IssueStatus.OPEN, IssueStatus.CLOSED],
    IssueStatus.RESOLVED: [IssueStatus.CLOSED, IssueStatus.IN_PROGRESS],
    IssueStatus.CLOSED: [],
}


def _get_or_create_tags(db: Session, names: List[str]) -> List[Tag]:
    tags = []
    for name in names:
        name = name.strip().lower()
        tag = db.query(Tag).filter(Tag.name == name).first()
        if not tag:
            tag = Tag(name=name)
            db.add(tag)
        tags.append(tag)
    return tags


def _compute_sla(priority: IssuePriority) -> datetime:
    days = _SLA_MAP.get(priority, 7)
    return datetime.now(timezone.utc) + timedelta(days=days)


def create_issue(db: Session, data: IssueCreate, reporter: User) -> Issue:
    # Duplicate detection: warn if open issue nearby (<500m)
    nearby = detect_nearby_issues(db, data.latitude, data.longitude, radius_km=0.5)
    if nearby:
        logger.warning(
            f"Possible duplicate issue reported near ({data.latitude}, {data.longitude}). "
            f"Existing IDs: {[str(i.id) for i in nearby]}"
        )

    tags = _get_or_create_tags(db, data.tag_names) if data.tag_names else []

    issue = Issue(
        title=data.title,
        description=data.description,
        category=data.category,
        priority=data.priority,
        latitude=data.latitude,
        longitude=data.longitude,
        address=data.address,
        ward=data.ward,
        zone=data.zone,
        reported_by_id=reporter.id,
        sla_deadline=_compute_sla(data.priority),
        tags=tags,
    )
    db.add(issue)

    # Initial status history entry
    history = IssueStatusHistory(
        old_status=None,
        new_status=IssueStatus.OPEN,
        changed_by_id=reporter.id,
        comment="Issue created",
    )
    issue.status_history.append(history)

    db.commit()
    db.refresh(issue)
    logger.info(f"Issue created: {issue.id} by user {reporter.email}")
    return issue


def get_issue(db: Session, issue_id: UUID) -> Issue:
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise NotFoundException(f"Issue with ID {issue_id} not found")
    return issue


def list_issues(db: Session, params: IssueFilterParams) -> Tuple[List[Issue], int]:
    query = db.query(Issue)

    if params.category:
        query = query.filter(Issue.category == params.category)
    if params.status:
        query = query.filter(Issue.status == params.status)
    if params.priority:
        query = query.filter(Issue.priority == params.priority)
    if params.ward:
        query = query.filter(Issue.ward.ilike(f"%{params.ward}%"))
    if params.zone:
        query = query.filter(Issue.zone.ilike(f"%{params.zone}%"))
    if params.date_from:
        query = query.filter(Issue.created_at >= params.date_from)
    if params.date_to:
        query = query.filter(Issue.created_at <= params.date_to)
    if params.search:
        term = f"%{params.search}%"
        query = query.filter(
            or_(Issue.title.ilike(term), Issue.description.ilike(term), Issue.address.ilike(term))
        )

    total = query.count()

    sort_col = getattr(Issue, params.sort_by, Issue.created_at)
    if params.sort_order.lower() == "asc":
        query = query.order_by(asc(sort_col))
    else:
        query = query.order_by(desc(sort_col))

    offset = (params.page - 1) * params.page_size
    items = query.offset(offset).limit(params.page_size).all()
    return items, total


def update_issue(db: Session, issue_id: UUID, data: IssueUpdate, actor: User) -> Issue:
    issue = get_issue(db, issue_id)
    for field, value in data.model_dump(exclude_none=True, exclude={"tag_names"}).items():
        setattr(issue, field, value)

    if data.tag_names is not None:
        issue.tags = _get_or_create_tags(db, data.tag_names)

    db.commit()
    db.refresh(issue)
    return issue


def delete_issue(db: Session, issue_id: UUID) -> None:
    issue = get_issue(db, issue_id)
    db.delete(issue)
    db.commit()


def change_status(db: Session, issue_id: UUID, data: IssueStatusUpdate, actor: User) -> Issue:
    issue = get_issue(db, issue_id)
    old_status = issue.status
    new_status = data.status

    allowed = _VALID_TRANSITIONS.get(old_status, [])
    if new_status not in allowed:
        raise BadRequestException(
            f"Cannot transition from {old_status} to {new_status}. "
            f"Allowed: {[s.value for s in allowed]}"
        )

    issue.status = new_status
    if new_status == IssueStatus.RESOLVED:
        issue.resolved_at = datetime.now(timezone.utc)

    history = IssueStatusHistory(
        issue_id=issue.id,
        old_status=old_status,
        new_status=new_status,
        changed_by_id=actor.id,
        comment=data.comment,
    )
    db.add(history)
    db.commit()
    db.refresh(issue)
    logger.info(f"Issue {issue_id} status changed: {old_status} -> {new_status} by {actor.email}")
    return issue


def add_note(db: Session, issue_id: UUID, data: NoteCreate, actor: User) -> IssueNote:
    issue = get_issue(db, issue_id)
    note = IssueNote(
        issue_id=issue.id,
        author_id=actor.id,
        content=data.content,
        is_internal=data.is_internal,
    )
    db.add(note)
    db.commit()
    db.refresh(note)
    return note


def get_notes(db: Session, issue_id: UUID, include_internal: bool = False) -> List[IssueNote]:
    issue = get_issue(db, issue_id)
    query = db.query(IssueNote).filter(IssueNote.issue_id == issue_id)
    if not include_internal:
        query = query.filter(IssueNote.is_internal == False)
    return query.order_by(IssueNote.created_at.asc()).all()


def get_status_history(db: Session, issue_id: UUID) -> List[IssueStatusHistory]:
    get_issue(db, issue_id)
    return (
        db.query(IssueStatusHistory)
        .filter(IssueStatusHistory.issue_id == issue_id)
        .order_by(IssueStatusHistory.changed_at.asc())
        .all()
    )


def add_attachment(db: Session, issue_id: UUID, file_name: str, file_path: str, mime_type: str, file_size: str, actor: User) -> IssueAttachment:
    issue = get_issue(db, issue_id)
    attachment = IssueAttachment(
        issue_id=issue.id,
        uploaded_by_id=actor.id,
        file_name=file_name,
        file_path=file_path,
        mime_type=mime_type,
        file_size=file_size,
    )
    db.add(attachment)
    db.commit()
    db.refresh(attachment)
    return attachment


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def detect_nearby_issues(
    db: Session,
    latitude: Optional[float],
    longitude: Optional[float],
    radius_km: float = 1.0,
) -> List[Issue]:
    if latitude is None or longitude is None:
        return []

    open_issues = (
        db.query(Issue)
        .filter(
            Issue.status.in_([IssueStatus.OPEN, IssueStatus.IN_PROGRESS]),
            Issue.latitude.isnot(None),
            Issue.longitude.isnot(None),
        )
        .all()
    )
    return [
        i for i in open_issues
        if _haversine_km(latitude, longitude, i.latitude, i.longitude) <= radius_km
    ]
