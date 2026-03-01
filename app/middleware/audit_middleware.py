import time
import logging
from fastapi import Request
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.audit_log import AuditLog

logger = logging.getLogger(__name__)


async def audit_log_middleware(request: Request, call_next):
    """Log every mutating request to the audit_logs table."""
    start = time.time()
    response = await call_next(request)
    duration_ms = round((time.time() - start) * 1000, 2)

    # Only audit write operations
    if request.method in ("POST", "PUT", "DELETE", "PATCH"):
        user_id = getattr(request.state, "user_id", None)
        entity_type, entity_id = _parse_entity(request.url.path)

        if user_id:
            db: Session = SessionLocal()
            try:
                log = AuditLog(
                    user_id=user_id,
                    action=request.method,
                    entity_type=entity_type,
                    entity_id=entity_id,
                    details={"path": request.url.path, "duration_ms": duration_ms, "status_code": response.status_code},
                    ip_address=request.client.host if request.client else None,
                    user_agent=request.headers.get("user-agent"),
                )
                db.add(log)
                db.commit()
            except Exception as e:
                logger.error(f"Audit log failed: {e}")
            finally:
                db.close()

    return response


def _parse_entity(path: str) -> tuple[str, str | None]:
    """Extract entity type and optional ID from URL path."""
    parts = [p for p in path.strip("/").split("/") if p]
    # /api/v1/<entity>/<id>/...
    entity_type = parts[2] if len(parts) > 2 else "unknown"
    entity_id = parts[3] if len(parts) > 3 else None
    return entity_type.upper(), entity_id
