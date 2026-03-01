from fastapi import APIRouter, Depends, status, Request
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse, RefreshRequest
from app.services import auth_service
from app.core.response import success_response
from app.middleware.rate_limit import limiter

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    user = auth_service.register_user(db, data)
    return success_response(
        data={"id": str(user.id), "email": user.email, "full_name": user.full_name},
        message="User registered successfully",
        status_code=status.HTTP_201_CREATED,
    )


@router.post("/login")
@limiter.limit("20/minute")
def login(request: Request, data: LoginRequest, db: Session = Depends(get_db)):
    tokens = auth_service.login_user(db, data)
    return success_response(data=tokens, message="Login successful")


@router.post("/refresh")
def refresh(data: RefreshRequest, db: Session = Depends(get_db)):
    tokens = auth_service.refresh_access_token(db, data.refresh_token)
    return success_response(data=tokens, message="Token refreshed")
