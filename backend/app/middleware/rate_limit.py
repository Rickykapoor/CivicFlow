from slowapi import Limiter
from slowapi.util import get_remote_address
from app.core.config import settings

limiter = Limiter(key_func=get_remote_address)

# Pre-configured limit string for issue creation
ISSUE_CREATE_LIMIT = f"{settings.RATE_LIMIT_TIMES}/{settings.RATE_LIMIT_SECONDS}second"
