import pytest


def test_record_persists_and_history(client, record):
    item = client.get(f"/api/incident/{record}").json()
    assert item["description"] == "Flooding has blocked the hospital access road"
    assert client.get("/api/incidents").json()[0]["id"] == record
    events = client.get(f"/api/incident/{record}/timeline").json()["events"]
    assert len(events) == 1 and events[0]["agent"] == "staff"
    assert events[0]["timestamp"].endswith("Z")
    assert client.get(f"/api/incident/{record}/analysis").json() is None


def test_full_workflow_and_state_guards(client, record):
    prefix = f"/api/incident/{record}"
    assert client.post(prefix + "/approve").status_code == 409
    assert client.post(prefix + "/assign").status_code == 409
    response = client.post(prefix + "/workflow")
    assert response.status_code == 200
    analysis = response.json()
    assert analysis["classification"]["incident_type"] == "FLOOD"
    assert analysis["classification"]["source"] == "keyword_rules"
    assert analysis["classification"]["confidence"] is None
    assert analysis["risk"]["score"] == 25
    assert analysis["nearby_facilities"] == []
    assert client.get(prefix).json()["status"] == "ANALYZED"
    assert client.get(prefix + "/analysis").json() == analysis
    assert client.post(prefix + "/workflow").json() == analysis
    assert len(client.get(prefix + "/timeline").json()["events"]) == 2
    assert client.post(prefix + "/approve").json()["approved_by"] == "staff"
    assert client.post(prefix + "/approve").status_code == 409
    assert client.post(prefix + "/workflow").status_code == 409
    assert client.post(prefix + "/dispatch").status_code == 503
    assert client.get(prefix).json()["status"] == "APPROVED"
    assigned = client.post(prefix + "/assign")
    assert assigned.status_code == 200 and assigned.json()["external_dispatch"] is False
    assert client.post(prefix + "/assign").status_code == 409
    assert client.post(prefix + "/resolve", json={"note": "short"}).status_code == 422
    assert (
        client.post(
            prefix + "/resolve",
            json={"note": "Operator verified that the access road is clear."},
        ).status_code
        == 200
    )
    assert client.get(prefix).json()["status"] == "RESOLVED"
    events = client.get(prefix + "/timeline").json()["events"]
    assert [e["event_type"] for e in events] == [
        "INCIDENT_CREATED",
        "ANALYZED",
        "APPROVED",
        "ASSIGNED",
        "RESOLVED",
    ]
    assert "access road is clear" in events[-1]["summary"]
    assert (
        client.post(
            prefix + "/resolve", json={"note": "Another resolution note."}
        ).status_code
        == 409
    )


def test_reporter_scope_and_permissions(client, record):
    client.cookies.set("civicshield_session", "citizen", path="/api")
    assert client.get("/api/incidents").json() == []
    assert client.get(f"/api/incident/{record}").status_code == 404
    response = client.post(
        "/api/incident",
        json={"description": "Broken drain cover", "latitude": 0, "longitude": 0},
    )
    own = response.json()["id"]
    assert client.get(f"/api/incident/{own}").status_code == 200
    assert client.post(f"/api/incident/{own}/workflow").status_code == 200
    for action in ["approve", "assign", "dispatch"]:
        assert client.post(f"/api/incident/{own}/{action}").status_code == 403
    assert (
        client.post(
            f"/api/incident/{own}/resolve", json={"note": "A sufficiently long note."}
        ).status_code
        == 403
    )
    client.cookies.set("civicshield_session", "other", path="/api")
    for suffix in ["", "/analysis", "/timeline"]:
        assert client.get(f"/api/incident/{own}{suffix}").status_code == 404
    assert client.post(f"/api/incident/{own}/workflow").status_code == 404


@pytest.mark.parametrize(
    "payload",
    [
        {"description": "   ", "latitude": 0, "longitude": 0},
        {"description": "a" * 5001, "latitude": 0, "longitude": 0},
        {"description": "Broken road", "latitude": 91, "longitude": 0},
        {"description": "Broken road", "latitude": 0, "longitude": -181},
        {"description": "Broken road", "latitude": None, "longitude": 0},
        {"description": "Broken road", "latitude": 0, "longitude": 0, "role": "ADMIN"},
        {"latitude": 0, "longitude": 0},
    ],
)
def test_invalid_records(client, payload):
    assert client.post("/api/incident", json=payload).status_code == 422


@pytest.mark.parametrize("suffix", ["", "/analysis", "/timeline"])
def test_missing_records(client, suffix):
    assert client.get("/api/incident/999999" + suffix).status_code == 404


def test_pagination(client):
    for i in range(3):
        client.post(
            "/api/incident",
            json={"description": f"Road report {i}", "latitude": 0, "longitude": 0},
        )
    assert len(client.get("/api/incidents?limit=2").json()) == 2
    assert len(client.get("/api/incidents?limit=2&offset=2").json()) == 1
    assert client.get("/api/incidents?limit=201").status_code == 422


def test_unauthorized_reads_and_writes(anonymous):
    assert anonymous.get("/api/incidents").status_code == 401
    assert (
        anonymous.post(
            "/api/incident",
            json={"description": "Broken drain", "latitude": 0, "longitude": 0},
        ).status_code
        == 401
    )


def test_csrf_and_security_headers(client):
    assert (
        client.post("/api/auth/logout", headers={"X-CSRF-Protection": ""}).status_code
        == 403
    )
    assert (
        client.post(
            "/api/auth/logout", headers={"Origin": "https://untrusted.example"}
        ).status_code
        == 403
    )
    response = client.get("/api/auth/me")
    assert response.headers["cache-control"] == "no-store"
    assert response.headers["x-content-type-options"] == "nosniff"
    assert response.headers["x-frame-options"] == "DENY"
    assert client.get("/health").json()["status"] == "ok"
    assert client.post("/api/incident", content="a" * 17000).status_code == 413


def test_chunked_body_limit(client):
    def chunks():
        yield b'{"description":"'
        yield b"a" * 17000
        yield b'","latitude":0,"longitude":0}'

    response = client.post(
        "/api/incident", content=chunks(), headers={"Content-Type": "application/json"}
    )
    assert response.status_code == 413
    assert response.headers["x-content-type-options"] == "nosniff"
