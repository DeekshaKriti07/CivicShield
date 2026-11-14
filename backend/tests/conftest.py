from datetime import timedelta

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend import main
from backend.auth import hash_password, token_hash
from backend.auth_models import AuthSession, User, utc_now
from backend.database import Base, get_db
from backend.main import app

PASSWORD = "correct horse battery staple"


@pytest.fixture(scope="session")
def password_hash():
    return hash_password(PASSWORD)


@pytest.fixture()
def environment(tmp_path, monkeypatch, password_hash):
    engine = create_engine(
        f"sqlite:///{tmp_path}/test.db", connect_args={"check_same_thread": False}
    )
    Base.metadata.create_all(engine)
    factory = sessionmaker(bind=engine)
    with factory() as db:
        for username, role in [
            ("staff", "OPERATOR"),
            ("citizen", "REPORTER"),
            ("other", "REPORTER"),
        ]:
            user = User(username=username, password_hash=password_hash, role=role)
            db.add(user)
            db.flush()
            db.add(
                AuthSession(
                    token_hash=token_hash(username),
                    user_id=user.id,
                    expires_at=utc_now() + timedelta(hours=1),
                )
            )
        db.commit()

    def override():
        with factory() as db:
            yield db

    app.dependency_overrides[get_db] = override
    monkeypatch.setattr(main, "init_db", lambda: None)
    monkeypatch.setattr(main, "engine", engine)
    yield factory
    app.dependency_overrides.clear()
    engine.dispose()


@pytest.fixture()
def client(environment):
    with TestClient(app, headers={"X-CSRF-Protection": "1"}) as client:
        client.cookies.set("civicshield_session", "staff", path="/api")
        yield client


@pytest.fixture()
def anonymous(client):
    client.cookies.clear()
    return client


@pytest.fixture()
def record(client):
    response = client.post(
        "/api/incident",
        json={
            "description": "Flooding has blocked the hospital access road",
            "latitude": 11.0175,
            "longitude": 76.9568,
        },
    )
    assert response.status_code == 201
    return response.json()["id"]
