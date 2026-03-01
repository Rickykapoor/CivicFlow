import pytest

ISSUE_PAYLOAD = {
    "title": "Pothole on Main Street",
    "description": "Large pothole causing damage to vehicles",
    "category": "ROAD",
    "priority": "HIGH",
    "address": "123 Main Street",
    "ward": "Ward-5",
    "latitude": 28.6139,
    "longitude": 77.2090,
}

created_issue_id = None


def test_create_issue(client, auth_headers):
    global created_issue_id
    resp = client.post("/api/v1/issues/", json=ISSUE_PAYLOAD, headers=auth_headers)
    assert resp.status_code == 201
    data = resp.json()
    assert data["success"] is True
    assert data["data"]["title"] == ISSUE_PAYLOAD["title"]
    assert data["data"]["status"] == "OPEN"
    assert data["data"]["sla_deadline"] is not None
    created_issue_id = data["data"]["id"]


def test_list_issues(client, auth_headers):
    resp = client.get("/api/v1/issues/", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    assert data["data"]["total"] >= 1


def test_filter_by_category(client, auth_headers):
    resp = client.get("/api/v1/issues/?category=ROAD", headers=auth_headers)
    assert resp.status_code == 200
    items = resp.json()["data"]["items"]
    for item in items:
        assert item["category"] == "ROAD"


def test_filter_by_ward(client, auth_headers):
    resp = client.get("/api/v1/issues/?ward=Ward-5", headers=auth_headers)
    assert resp.status_code == 200
    items = resp.json()["data"]["items"]
    for item in items:
        assert "Ward-5" in (item.get("ward") or "")


def test_search_issues(client, auth_headers):
    resp = client.get("/api/v1/issues/?search=Pothole", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["data"]["total"] >= 1


def test_get_issue_by_id(client, auth_headers):
    resp = client.get(f"/api/v1/issues/{created_issue_id}", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["data"]["id"] == created_issue_id


def test_get_nonexistent_issue(client, auth_headers):
    fake_id = "00000000-0000-0000-0000-000000000000"
    resp = client.get(f"/api/v1/issues/{fake_id}", headers=auth_headers)
    assert resp.status_code == 404


def test_status_history(client, auth_headers):
    resp = client.get(f"/api/v1/issues/{created_issue_id}/history", headers=auth_headers)
    assert resp.status_code == 200
    history = resp.json()["data"]
    assert len(history) >= 1
    assert history[0]["new_status"] == "OPEN"


def test_nearby_issues(client, auth_headers):
    resp = client.get(
        "/api/v1/issues/nearby?latitude=28.6139&longitude=77.2090&radius_km=1",
        headers=auth_headers,
    )
    assert resp.status_code == 200


def test_pagination(client, auth_headers):
    resp = client.get("/api/v1/issues/?page=1&page_size=5", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert "items" in data
    assert "total" in data
    assert "pages" in data
