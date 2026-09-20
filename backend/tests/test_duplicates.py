from fastapi.testclient import TestClient

from backend.main import app


client = TestClient(app)


def test_duplicate_incident_detection():
    payload = {
        "description": "Heavy flooding has blocked the road near the hospital",
        "latitude": 11.0175,
        "longitude": 76.9568
    }

    first_response = client.post(
        "/incident",
        json=payload
    )

    assert first_response.status_code == 201

    second_response = client.post(
        "/incident",
        json=payload
    )

    assert second_response.status_code == 201

    first_id = first_response.json()["id"]
    second_id = second_response.json()["id"]

    assert first_id != second_id