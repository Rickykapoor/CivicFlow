from pydantic_settings import BaseSettings
from pydantic import AnyUrl, field_validator
from typing import List, Optional
import json


class Settings(BaseSettings):
    # App
    PROJECT_NAME: str = "Citizen Issue Processing System"
    VERSION: str = "1.0.0"
    DEBUG: bool = False
    API_V1_STR: str = "/api/v1"

    # Database
    DATABASE_URL: str

    # JWT
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # CORS / Hosts
    ALLOWED_HOSTS: List[str] = ["*"]

    # Email
    MAIL_USERNAME: str = ""
    MAIL_PASSWORD: str = ""
    MAIL_FROM: str = "noreply@cityissues.gov"
    MAIL_PORT: int = 587
    MAIL_SERVER: str = "smtp.gmail.com"
    MAIL_STARTTLS: bool = True
    MAIL_SSL_TLS: bool = False
    MAIL_ENABLED: bool = False

    # File Storage
    STORAGE_BACKEND: str = "local"  # "local" | "s3"
    UPLOAD_DIR: str = "uploads"
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_REGION: str = "us-east-1"
    S3_BUCKET_NAME: str = "cityissues-uploads"

    # Rate Limiting
    RATE_LIMIT_TIMES: int = 10
    RATE_LIMIT_SECONDS: int = 60

    # SLA thresholds (days)
    SLA_CRITICAL_DAYS: int = 1
    SLA_HIGH_DAYS: int = 3
    SLA_MEDIUM_DAYS: int = 7
    SLA_LOW_DAYS: int = 14

    # Admin seed
    FIRST_ADMIN_EMAIL: str = "admin@cityissues.gov"
    FIRST_ADMIN_PASSWORD: str = "Admin@123456"

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
