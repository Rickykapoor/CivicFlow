from sqlalchemy.orm import Session
from app.models.user import User
from app.models.audit_log import AuditLog
from app.schemas.auth import RegisterRequest, LoginRequest
from app.core.security import hash_password, verify_password, create_access_token, create_refresh_token, decode_token
from app.core.exceptions import ConflictException, UnauthorizedException, BadRequestException
from app.models.enums import UserRole
from jose import JWTError
import logging

logger = logging.getLogger(__name__)


def register_user(db: Session, data: RegisterRequest) -> User:
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise ConflictException("A user with this email already exists")

    user = User(
        email=data.email,
        hashed_password=hash_password(data.password),
        full_name=data.full_name,
        phone=data.phone,
        role=UserRole.CITIZEN,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    logger.info(f"New user registered: {user.email}")
    return user


def login_user(db: Session, data: LoginRequest) -> dict:
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not verify_password(data.password, user.hashed_password):
        raise UnauthorizedException("Invalid email or password")
    if not user.is_active:
        raise UnauthorizedException("Your account has been deactivated")

    access_token = create_access_token(str(user.id))
    refresh_token = create_refresh_token(str(user.id))
    logger.info(f"User logged in: {user.email}")
    return {"access_token": access_token, "refresh_token": refresh_token, "token_type": "bearer"}


def refresh_access_token(db: Session, refresh_token: str) -> dict:
    try:
        payload = decode_token(refresh_token)
        if payload.get("type") != "refresh":
            raise UnauthorizedException("Invalid token type")
        user_id = payload.get("sub")
    except JWTError:
        raise UnauthorizedException("Invalid or expired refresh token")

    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_active:
        raise UnauthorizedException("User not found or inactive")

    new_access_token = create_access_token(str(user.id))
    return {"access_token": new_access_token, "refresh_token": refresh_token, "token_type": "bearer"}


def get_user_by_id(db: Session, user_id: str) -> User:
    from app.core.exceptions import NotFoundException
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise NotFoundException("User not found")
    return user
