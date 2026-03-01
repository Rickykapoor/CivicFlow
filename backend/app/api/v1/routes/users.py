from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.db.session import get_db
from app.models.user import User
from app.models.enums import UserRole
from app.schemas.user import UserUpdate, UserRoleUpdate, UserResponse, UserListResponse
from app.services import user_service
from app.dependencies import get_current_user, require_admin
from app.core.response import success_response, paginated_response

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return success_response(
        data=UserResponse.model_validate(current_user).model_dump(mode="json"),
        message="Profile retrieved",
    )


@router.put("/me")
def update_me(
    data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    updated = user_service.update_profile(db, current_user, data)
    return success_response(
        data=UserResponse.model_validate(updated).model_dump(mode="json"),
        message="Profile updated",
    )


@router.get("/")
def list_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    role: Optional[UserRole] = None,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    items, total = user_service.list_users(db, page, page_size, role)
    data = [UserListResponse.model_validate(u).model_dump(mode="json") for u in items]
    return paginated_response(items=data, total=total, page=page, page_size=page_size)


@router.get("/{user_id}")
def get_user(
    user_id: str,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    user = user_service.get_user(db, user_id)
    return success_response(
        data=UserResponse.model_validate(user).model_dump(mode="json"),
        message="User retrieved",
    )


@router.put("/{user_id}/role")
def update_role(
    user_id: str,
    data: UserRoleUpdate,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    updated = user_service.update_user_role(db, user_id, data)
    return success_response(
        data=UserResponse.model_validate(updated).model_dump(mode="json"),
        message="User role updated",
    )


@router.delete("/{user_id}/deactivate")
def deactivate_user(
    user_id: str,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    user_service.deactivate_user(db, user_id)
    return success_response(message="User deactivated")
