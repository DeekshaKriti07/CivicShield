from datetime import timedelta

import pytest

from backend.auth import token_hash
from backend.auth_models import AuthSession, User, utc_now
from backend.config import settings
from backend.tests.conftest import PASSWORD


def test_login_logout_revokes_session(anonymous):
    assert anonymous.get("/api/auth/me").status_code == 401
    response = anonymous.post(
        "/api/auth/login", json={"username": " staff ", "password": PASSWORD}
    )
    assert response.status_code == 200
    assert response.json() == {"username": "staff", "role": "OPERATOR"}
    assert "access_token" not in response.json()
    cookie = response.headers["set-cookie"].lower()
    assert (
        "httponly" in cookie and "samesite=strict" in cookie and "path=/api" in cookie
    )
    token = anonymous.cookies.get("civicshield_session")
    assert anonymous.get("/api/auth/me").status_code == 200
    assert anonymous.post("/api/auth/logout").status_code == 204
    anonymous.cookies.set("civicshield_session", token, path="/api")
    assert anonymous.get("/api/auth/me").status_code == 401


def test_register_reporter_and_duplicate(anonymous):
    payload = {"username": "new-person", "password": PASSWORD}
    response = anonymous.post("/api/auth/register", json=payload)
    assert response.status_code == 201 and response.json()["role"] == "REPORTER"
    assert anonymous.post("/api/auth/register", json=payload).status_code == 409
    assert anonymous.post("/api/auth/login", json=payload).status_code == 200
    assert anonymous.get("/api/incidents").json() == []


@pytest.mark.parametrize(
    "payload",
    [
        {"username": "ab", "password": PASSWORD},
        {"username": "name with spaces", "password": PASSWORD},
        {"username": "user", "password": "short"},
        {"username": "a" * 51, "password": PASSWORD},
        {"username": "user", "password": "a" * 129},
    ],
)
def test_registration_validation(anonymous, payload):
    assert anonymous.post("/api/auth/register", json=payload).status_code == 422


@pytest.mark.parametrize("username,password", [("staff", "bad"), ("missing", PASSWORD)])
def test_invalid_credentials(anonymous, username, password):
    response = anonymous.post(
        "/api/auth/login", json={"username": username, "password": password}
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid username or password."


def test_expired_and_inactive_session(client, environment):
    with environment() as db:
        db.get(AuthSession, token_hash("staff")).expires_at = utc_now() - timedelta(
            seconds=1
        )
        db.commit()
    assert client.get("/api/incidents").status_code == 401
    client.cookies.set("civicshield_session", "citizen", path="/api")
    with environment() as db:
        db.query(User).filter_by(username="citizen").first().is_active = False
        db.commit()
    assert client.get("/api/auth/me").status_code == 401


def test_login_rotates_session(client):
    assert (
        client.post(
            "/api/auth/login", json={"username": "staff", "password": PASSWORD}
        ).status_code
        == 200
    )
    client.cookies.clear()
    client.cookies.set("civicshield_session", "staff", path="/api")
    assert client.get("/api/auth/me").status_code == 401


def test_rate_limit(anonymous):
    for _ in range(20):
        assert (
            anonymous.post(
                "/api/auth/login", json={"username": "staff", "password": "bad"}
            ).status_code
            == 401
        )
    response = anonymous.post(
        "/api/auth/login", json={"username": "staff", "password": PASSWORD}
    )
    assert response.status_code == 429 and response.headers["retry-after"] == "900"


def test_registration_disabled(anonymous, monkeypatch):
    monkeypatch.setattr(settings, "registration_enabled", False)
    assert (
        anonymous.post(
            "/api/auth/register", json={"username": "new", "password": PASSWORD}
        ).status_code
        == 403
    )


def test_secure_cookie(anonymous, monkeypatch):
    monkeypatch.setattr(settings, "cookie_secure", True)
    response = anonymous.post(
        "/api/auth/login", json={"username": "staff", "password": PASSWORD}
    )
    assert "secure" in [
        part.strip().lower() for part in response.headers["set-cookie"].split(";")
    ]
