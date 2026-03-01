import pytest


def test_admin_stats(client, admin_headers):
    resp = client.get("/api/v1/admin/stats", headers=admin_headers)
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert "total_issues" in data
    assert "by_status" in data
    assert "by_category" in data
    assert "overdue_count" in data
    assert "avg_resolution_hours" in data


def test_admin_summary_report(client, admin_headers):
    resp = client.get(
        "/api/v1/admin/reports?date_from=2020-01-01T00:00:00Z&date_to=2030-01-01T00:00:00Z",
        headers=admin_headers,
    )
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert "total_issues" in data
    assert "resolution_rate_pct" in data


def test_admin_overdue(client, admin_headers):
    resp = client.get("/api/v1/admin/overdue", headers=admin_headers)
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert "items" in data
    assert "total" in data


def test_admin_audit_logs(client, admin_headers):
    resp = client.get("/api/v1/admin/audit-logs", headers=admin_headers)
    assert resp.status_code == 200


def test_citizen_cannot_access_admin(client, auth_headers):
    resp = client.get("/api/v1/admin/stats", headers=auth_headers)
    assert resp.status_code == 403


def test_unauthenticated_admin(client):
    resp = client.get("/api/v1/admin/stats")
    assert resp.status_code in (401, 403)


def test_create_department(client, admin_headers):
    resp = client.post(
        "/api/v1/departments/",
        json={"name": "Roads Department", "description": "Manages road infrastructure"},
        headers=admin_headers,
    )
    assert resp.status_code == 201
    assert resp.json()["data"]["name"] == "Roads Department"


def test_list_departments(client, auth_headers):
    resp = client.get("/api/v1/departments/", headers=auth_headers)
    assert resp.status_code == 200
    assert isinstance(resp.json()["data"], list)
