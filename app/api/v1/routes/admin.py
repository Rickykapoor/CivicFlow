from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from typing import Optional

from app.db.session import get_db
from app.dependencies import require_admin
from app.models.user import User
from app.schemas.issue import IssueSummary
from app.services import stats_service
from app.models.audit_log import AuditLog
from app.core.response import success_response, paginated_response

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/stats")
def dashboard_stats(
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    stats = stats_service.get_dashboard_stats(db)
    return success_response(data=stats, message="Dashboard statistics retrieved")


@router.get("/reports")
def summary_report(
    date_from: datetime = Query(default_factory=lambda: datetime(2020, 1, 1, tzinfo=timezone.utc)),
    date_to: datetime = Query(default_factory=lambda: datetime.now(timezone.utc)),
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    report = stats_service.get_summary_report(db, date_from, date_to)
    return success_response(data=report, message="Summary report generated")


@router.get("/overdue")
def overdue_issues(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    items, total = stats_service.get_overdue_issues(db, page, page_size)
    data = [IssueSummary.model_validate(i).model_dump(mode="json") for i in items]
    return paginated_response(items=data, total=total, page=page, page_size=page_size, message="Overdue issues")


@router.get("/audit-logs")
def audit_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    query = db.query(AuditLog).order_by(AuditLog.created_at.desc())
    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()
    data = [
        {
            "id": str(log.id),
            "user_id": str(log.user_id) if log.user_id else None,
            "action": log.action,
            "entity_type": log.entity_type,
            "entity_id": log.entity_id,
            "details": log.details,
            "ip_address": log.ip_address,
            "created_at": log.created_at.isoformat(),
        }
        for log in items
    ]
    return paginated_response(items=data, total=total, page=page, page_size=page_size, message="Audit logs retrieved")
