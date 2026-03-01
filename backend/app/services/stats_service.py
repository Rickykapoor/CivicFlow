from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import func, case
from app.models.issue import Issue
from app.models.audit_log import AuditLog
from app.models.enums import IssueStatus, IssuePriority, IssueCategory


def get_dashboard_stats(db: Session) -> dict:
    total = db.query(Issue).count()

    by_status = (
        db.query(Issue.status, func.count(Issue.id))
        .group_by(Issue.status)
        .all()
    )

    by_category = (
        db.query(Issue.category, func.count(Issue.id))
        .group_by(Issue.category)
        .all()
    )

    by_priority = (
        db.query(Issue.priority, func.count(Issue.id))
        .group_by(Issue.priority)
        .all()
    )

    # Average resolution time (resolved issues only)
    resolved_issues = (
        db.query(Issue)
        .filter(Issue.status.in_([IssueStatus.RESOLVED, IssueStatus.CLOSED]), Issue.resolved_at.isnot(None))
        .all()
    )
    if resolved_issues:
        avg_secs = sum(
            (i.resolved_at - i.created_at).total_seconds()
            for i in resolved_issues
        ) / len(resolved_issues)
        avg_resolution_hours = round(avg_secs / 3600, 2)
    else:
        avg_resolution_hours = 0.0

    now = datetime.now(timezone.utc)
    overdue_count = (
        db.query(Issue)
        .filter(
            Issue.sla_deadline < now,
            Issue.status.notin_([IssueStatus.RESOLVED, IssueStatus.CLOSED]),
        )
        .count()
    )

    return {
        "total_issues": total,
        "by_status": {str(s): c for s, c in by_status},
        "by_category": {str(cat): c for cat, c in by_category},
        "by_priority": {str(p): c for p, c in by_priority},
        "avg_resolution_hours": avg_resolution_hours,
        "overdue_count": overdue_count,
    }


def get_overdue_issues(db: Session, page: int = 1, page_size: int = 20):
    now = datetime.now(timezone.utc)
    query = db.query(Issue).filter(
        Issue.sla_deadline < now,
        Issue.status.notin_([IssueStatus.RESOLVED, IssueStatus.CLOSED]),
    )
    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()
    return items, total


def get_summary_report(db: Session, date_from: datetime, date_to: datetime) -> dict:
    q = db.query(Issue).filter(Issue.created_at >= date_from, Issue.created_at <= date_to)
    total = q.count()

    by_status = {str(s): c for s, c in q.with_entities(Issue.status, func.count(Issue.id)).group_by(Issue.status).all()}
    by_category = {str(c): n for c, n in q.with_entities(Issue.category, func.count(Issue.id)).group_by(Issue.category).all()}
    by_ward = {str(w): n for w, n in q.with_entities(Issue.ward, func.count(Issue.id)).group_by(Issue.ward).all() if w}

    resolved = q.filter(Issue.status.in_([IssueStatus.RESOLVED, IssueStatus.CLOSED])).count()
    resolution_rate = round((resolved / total * 100), 1) if total else 0.0

    return {
        "date_from": date_from.isoformat(),
        "date_to": date_to.isoformat(),
        "total_issues": total,
        "resolved": resolved,
        "resolution_rate_pct": resolution_rate,
        "by_status": by_status,
        "by_category": by_category,
        "by_ward": by_ward,
    }
