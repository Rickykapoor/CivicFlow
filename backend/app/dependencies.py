from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from jose import JWTError

from app.db.session import get_db
from app.models.user import User
from app.models.enums import UserRole
from app.core.security import decode_token
from app.core.exceptions import UnauthorizedException, ForbiddenException

bearer_scheme = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    token = credentials.credentials
    try:
        payload = decode_token(token)
        if payload.get("type") != "access":
            raise UnauthorizedException("Invalid token type")
        user_id: str = payload.get("sub")
    except JWTError:
        raise UnauthorizedException("Invalid or expired token")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise UnauthorizedException("User not found")
    if not user.is_active:
        raise UnauthorizedException("Account is deactivated")
    return user


def require_roles(*roles: UserRole):
    """Dependency factory: raises 403 if current user's role is not in allowed roles."""
    def _checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in roles:
            raise ForbiddenException(
                f"Required role(s): {[r.value for r in roles]}. Your role: {current_user.role.value}"
            )
        return current_user
    return _checker


# Pre-built role dependencies for convenience
require_admin = require_roles(UserRole.ADMIN)
require_staff_or_admin = require_roles(UserRole.STAFF, UserRole.ADMIN)
