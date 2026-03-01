import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.exceptions import (
    AppException,
    app_exception_handler,
    http_exception_handler,
    validation_exception_handler,
    global_exception_handler,
)
from app.core.logging import setup_logging
from app.db.session import SessionLocal
from app.middleware.audit_middleware import audit_log_middleware
from app.middleware.rate_limit import limiter
from fastapi import HTTPException
import pathlib

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown logic."""
    setup_logging()

    # Create uploads dir
    pathlib.Path(settings.UPLOAD_DIR).mkdir(parents=True, exist_ok=True)

    # Seed admin user
    db = SessionLocal()
    try:
        from app.services.user_service import seed_admin
        admin = seed_admin(db)
        if admin:
            logger.info(f"Admin user seeded: {admin.email}")
    except Exception as e:
        logger.warning(f"Admin seed skipped: {e}")
    finally:
        db.close()

    logger.info(f"🚀 {settings.PROJECT_NAME} v{settings.VERSION} started")
    yield
    logger.info("Server shutting down.")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=(
        "Production-ready backend for managing citizen-reported city issues. "
        "Supports full issue lifecycle management, RBAC, SLA tracking, audit logging, "
        "geo-based filtering, file uploads, and email notifications."
    ),
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

# ── Rate Limiter ──────────────────────────────────────────────────────────────
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_HOSTS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Audit Logging Middleware ──────────────────────────────────────────────────
app.middleware("http")(audit_log_middleware)

# ── Exception Handlers ────────────────────────────────────────────────────────
app.add_exception_handler(AppException, app_exception_handler)
app.add_exception_handler(HTTPException, http_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(Exception, global_exception_handler)

# ── Serve uploaded files statically (dev only) ────────────────────────────────
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR, check_dir=False), name="uploads")

# ── Include API Routes ────────────────────────────────────────────────────────
app.include_router(api_router)


@app.get("/", tags=["Health"])
def health_check():
    return {"success": True, "message": f"{settings.PROJECT_NAME} is running", "version": settings.VERSION}


@app.get("/health", tags=["Health"])
def detailed_health():
    return {
        "success": True,
        "message": "OK",
        "data": {"project": settings.PROJECT_NAME, "version": settings.VERSION, "debug": settings.DEBUG},
    }
