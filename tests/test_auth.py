import pytest


def test_register_success(client):
    resp = client.post("/api/v1/auth/register", json={
        "email": "newuser@test.com",
        "password": "Newuser@123",
        "full_name": "New User",
    })
    assert resp.status_code == 201
    data = resp.json()
    assert data["success"] is True
    assert data["data"]["email"] == "newuser@test.com"


def test_register_duplicate_email(client):
    payload = {"email": "dup@test.com", "password": "Dup@1234", "full_name": "Dup User"}
    client.post("/api/v1/auth/register", json=payload)
    resp = client.post("/api/v1/auth/register", json=payload)
    assert resp.status_code == 409
    assert resp.json()["success"] is False


def test_register_weak_password(client):
    resp = client.post("/api/v1/auth/register", json={
        "email": "weak@test.com",
        "password": "password",  # no uppercase, no digit in requirement check
        "full_name": "Weak",
    })
    assert resp.status_code == 422


def test_login_success(client):
    client.post("/api/v1/auth/register", json={
        "email": "logintest@test.com",
        "password": "Login@123",
        "full_name": "Login Test",
    })
    resp = client.post("/api/v1/auth/login", json={
        "email": "logintest@test.com",
        "password": "Login@123",
    })
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert "access_token" in data
    assert "refresh_token" in data


def test_login_wrong_password(client):
    resp = client.post("/api/v1/auth/login", json={
        "email": "logintest@test.com",
        "password": "Wrong@999",
    })
    assert resp.status_code == 401
    assert resp.json()["success"] is False


def test_refresh_token(client):
    client.post("/api/v1/auth/register", json={
        "email": "refresh@test.com",
        "password": "Refresh@123",
        "full_name": "Refresh User",
    })
    login_resp = client.post("/api/v1/auth/login", json={
        "email": "refresh@test.com",
        "password": "Refresh@123",
    })
    refresh_token = login_resp.json()["data"]["refresh_token"]
    resp = client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token})
    assert resp.status_code == 200
    assert "access_token" in resp.json()["data"]


def test_get_profile(client, auth_headers):
    resp = client.get("/api/v1/users/me", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["data"]["email"] == "citizen@test.com"


def test_update_profile(client, auth_headers):
    resp = client.put("/api/v1/users/me", headers=auth_headers, json={"full_name": "Updated Citizen"})
    assert resp.status_code == 200
    assert resp.json()["data"]["full_name"] == "Updated Citizen"


def test_unauthenticated_profile(client):
    resp = client.get("/api/v1/users/me")
    assert resp.status_code == 403  # HTTPBearer returns 403 when no credentials
