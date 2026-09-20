from fastapi.testclient import TestClient

from backend.main import app


client = TestClient(app)


def test_openapi():
    response = client.get("/openapi.json")

    assert response.status_code == 200


def test_dashboard_summary():
    response = client.get("/dashboard/summary")

    assert response.status_code == 200

    data = response.json()

    assert "total_incidents" in data
    assert "status" in data
    assert "risk" in data
    assert "incident_types" in data


def test_create_incident():
    payload = {
        "description": "Test flooding incident near hospital",
        "latitude": 11.0175,
        "longitude": 76.9568
    }

    response = client.post(
        "/incident",
        json=payload
    )

    assert response.status_code == 201

    data = response.json()

    assert "id" in data
    assert data["description"] == payload["description"]


def test_incident_timeline():
    response = client.get("/incident/1/timeline")

    assert response.status_code == 200

    data = response.json()

    assert "incident_id" in data
    assert "events" in data