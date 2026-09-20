from fastapi.testclient import TestClient

from backend.main import app


client = TestClient(app)


def test_create_incident_missing_description():
    response = client.post(
        "/incident",
        json={
            "latitude": 11.0175,
            "longitude": 76.9568
        }
    )

    assert response.status_code == 422


def test_create_incident_invalid_latitude():
    response = client.post(
        "/incident",
        json={
            "description": "Flooding incident",
            "latitude": 200,
            "longitude": 76.9568
        }
    )

    assert response.status_code == 422


def test_create_incident_invalid_longitude():
    response = client.post(
        "/incident",
        json={
            "description": "Flooding incident",
            "latitude": 11.0175,
            "longitude": 300
        }
    )

    assert response.status_code == 422


def test_nonexistent_incident_workflow():
    response = client.post(
        "/incident/999999/workflow"
    )

    assert response.status_code in [404, 400]


def test_nonexistent_incident_approval():
    response = client.post(
        "/incident/999999/approve"
    )

    assert response.status_code in [404, 400]


def test_nonexistent_incident_dispatch():
    response = client.post(
        "/incident/999999/dispatch"
    )

    assert response.status_code in [404, 400]


def test_nonexistent_incident_timeline():
    response = client.get(
        "/incident/999999/timeline"
    )

    assert response.status_code in [404, 400]


def test_nonexistent_incident_facilities():
    response = client.get(
        "/incident/999999/facilities"
    )

    assert response.status_code in [404, 400]