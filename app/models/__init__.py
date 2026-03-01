"""Import all models so Alembic / Base.metadata knows about them."""
from app.db.base import Base  # noqa
from app.models.user import User  # noqa
from app.models.department import Department  # noqa
from app.models.issue import Issue, issue_tags  # noqa
from app.models.issue_status_history import IssueStatusHistory  # noqa
from app.models.issue_note import IssueNote  # noqa
from app.models.issue_attachment import IssueAttachment  # noqa
from app.models.tag import Tag  # noqa
from app.models.audit_log import AuditLog  # noqa
