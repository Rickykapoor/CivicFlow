from fastapi import APIRouter
from app.api.v1.routes import auth, users, issues, admin, departments

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(issues.router)
api_router.include_router(admin.router)
api_router.include_router(departments.router)
