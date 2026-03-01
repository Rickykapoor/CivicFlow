"""RBAC integration tests: verify role boundaries are enforced across all protected endpoints."""
import pytest


def _register_and_login(client, email, password="Test@1234", name="Test User"):
    client.post("/api/v1/auth/register", json={"email": email, "password": password, "full_name": name})
    resp = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    token = resp.json().get("data", {}).get("access_token", "")
    return {"Authorization": f"Bearer {token}"}


def test_citizen_cannot_change_issue_status(client, auth_headers):
    # Create an issue first
    create_resp = client.post("/api/v1/issues/", json={
        "title": "RBAC Test Issue",
        "description": "Testing RBAC",
        "category": "GARBAGE",
    }, headers=auth_headers)
    issue_id = create_resp.json()["data"]["id"]

    # Citizen should NOT be able to change status
    resp = client.post(
        f"/api/v1/issues/{issue_id}/status",
        json={"status": "IN_PROGRESS"},
        headers=auth_headers,
    )
    assert resp.status_code == 403


def test_citizen_cannot_add_internal_note(client, auth_headers):
    create_resp = client.post("/api/v1/issues/", json={
        "title": "Note RBAC Test",
        "description": "Testing note RBAC",
        "category": "WATER",
    }, headers=auth_headers)
    issue_id = create_resp.json()["data"]["id"]

    resp = client.post(
        f"/api/v1/issues/{issue_id}/notes",
        json={"content": "Internal note", "is_internal": True},
        headers=auth_headers,
    )
    assert resp.status_code == 403


def test_citizen_cannot_update_issue(client, auth_headers):
    create_resp = client.post("/api/v1/issues/", json={
        "title": "Update RBAC Test",
        "description": "Testing update RBAC",
        "category": "ELECTRICITY",
    }, headers=auth_headers)
    issue_id = create_resp.json()["data"]["id"]

    resp = client.put(
        f"/api/v1/issues/{issue_id}",
        json={"title": "Hacked Title"},
        headers=auth_headers,
    )
    assert resp.status_code == 403


def test_citizen_cannot_list_all_users(client, auth_headers):
    resp = client.get("/api/v1/users/", headers=auth_headers)
    assert resp.status_code == 403


def test_citizen_cannot_create_department(client, auth_headers):
    resp = client.post(
        "/api/v1/departments/",
        json={"name": "Unauthorized Dept"},
        headers=auth_headers,
    )
    assert resp.status_code == 403


def test_no_token_returns_error(client):
    endpoints = [
        ("GET", "/api/v1/users/me"),
        ("GET", "/api/v1/issues/"),
        ("GET", "/api/v1/admin/stats"),
    ]
    for method, url in endpoints:
        resp = client.request(method, url)
        assert resp.status_code in (401, 403), f"{method} {url} should require auth"
