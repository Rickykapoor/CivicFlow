from typing import Optional, List
from uuid import UUID
from sqlalchemy.orm import Session
from app.models.user import User
from app.schemas.user import UserUpdate, UserRoleUpdate
from app.core.exceptions import NotFoundException, ForbiddenException
from app.models.enums import UserRole


def get_user(db: Session, user_id: UUID) -> User:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise NotFoundException("User not found")
    return user


def update_profile(db: Session, user: User, data: UserUpdate) -> User:
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(user, field, value)
    db.commit()
    db.refresh(user)
    return user


def list_users(db: Session, page: int = 1, page_size: int = 20, role: Optional[UserRole] = None):
    query = db.query(User)
    if role:
        query = query.filter(User.role == role)
    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()
    return items, total


def update_user_role(db: Session, user_id: UUID, data: UserRoleUpdate) -> User:
    user = get_user(db, user_id)
    user.role = data.role
    db.commit()
    db.refresh(user)
    return user


def deactivate_user(db: Session, user_id: UUID) -> User:
    user = get_user(db, user_id)
    user.is_active = False
    db.commit()
    db.refresh(user)
    return user


def seed_admin(db: Session) -> Optional[User]:
    """Create the first admin user if none exists."""
    from app.core.config import settings
    from app.core.security import hash_password

    admin = db.query(User).filter(User.role == UserRole.ADMIN).first()
    if admin:
        return None

    admin = User(
        email=settings.FIRST_ADMIN_EMAIL,
        hashed_password=hash_password(settings.FIRST_ADMIN_PASSWORD),
        full_name="System Administrator",
        role=UserRole.ADMIN,
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)
    return admin
