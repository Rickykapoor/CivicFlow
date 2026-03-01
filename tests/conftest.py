import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.db.base import Base
from app.db.session import get_db
from app.models import *  # ensure all models registered

SQLALCHEMY_TEST_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(
    SQLALCHEMY_TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(scope="module", autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="module")
def client():
    from app.main import app
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app, raise_server_exceptions=False) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture(scope="module")
def auth_headers(client):
    """Register + login a citizen user and return auth headers."""
    client.post("/api/v1/auth/register", json={
        "email": "citizen@test.com",
        "password": "Citizen@123",
        "full_name": "Test Citizen",
    })
    resp = client.post("/api/v1/auth/login", json={
        "email": "citizen@test.com",
        "password": "Citizen@123",
    })
    token = resp.json()["data"]["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="module")
def admin_headers(client):
    """Register a user, promote to ADMIN directly in DB, then return auth headers."""
    # Register a fresh admin user
    client.post("/api/v1/auth/register", json={
        "email": "admintest@test.com",
        "password": "Admin@1234",
        "full_name": "Test Admin",
    })

    # Directly promote to ADMIN in the test DB
    db = TestingSessionLocal()
    try:
        from app.models.user import User
        from app.models.enums import UserRole
        admin_user = db.query(User).filter(User.email == "admintest@test.com").first()
        if admin_user:
            admin_user.role = UserRole.ADMIN
            db.commit()
    finally:
        db.close()

    # Login and return headers
    resp = client.post("/api/v1/auth/login", json={
        "email": "admintest@test.com",
        "password": "Admin@1234",
    })
    token = resp.json()["data"]["access_token"]
    return {"Authorization": f"Bearer {token}"}
