from fastapi.testclient import TestClient

from backend.main import app


client = TestClient(app)


def test_complete_incident_workflow():
    payload = {
        "description": "Heavy flooding has blocked the road near the hospital",
        "latitude": 11.0175,
        "longitude": 76.9568
    }

    create_response = client.post(
        "/incident",
        json=payload
    )

    assert create_response.status_code == 201

    incident_id = create_response.json()["id"]

    workflow_response = client.post(
        f"/incident/{incident_id}/workflow"
    )

    assert workflow_response.status_code == 200

    data = workflow_response.json()

    assert "incident" in data
    assert "classification" in data
    assert "risk" in data
    assert "nearby_facilities" in data
    assert "routing" in data
    assert "response_plan" in data
    assert "next_action" in data


def test_approve_incident():
    payload = {
        "description": "Flooding near emergency hospital access road",
        "latitude": 11.0175,
        "longitude": 76.9568
    }

    create_response = client.post(
        "/incident",
        json=payload
    )

    assert create_response.status_code == 201

    incident_id = create_response.json()["id"]

    client.post(
        f"/incident/{incident_id}/workflow"
    )

    response = client.post(
        f"/incident/{incident_id}/approve"
    )

    assert response.status_code == 200

    data = response.json()

    assert data["incident_id"] == incident_id
    assert data["status"] == "APPROVED"


def test_dispatch_incident():
    payload = {
        "description": "Flood emergency requiring response team",
        "latitude": 11.0175,
        "longitude": 76.9568
    }

    create_response = client.post(
        "/incident",
        json=payload
    )

    assert create_response.status_code == 201

    incident_id = create_response.json()["id"]

    client.post(
        f"/incident/{incident_id}/workflow"
    )

    client.post(
        f"/incident/{incident_id}/approve"
    )

    response = client.post(
        f"/incident/{incident_id}/dispatch"
    )

    assert response.status_code == 200

    data = response.json()

    assert data["incident_id"] == incident_id
    assert data["status"] == "DISPATCHED"
    assert "department" in data
    assert "response_team" in data
    assert "simulation" in data