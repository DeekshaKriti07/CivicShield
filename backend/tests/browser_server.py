"""Isolated disposable server for browser tests, never imports a production .env."""

import os
import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

with tempfile.TemporaryDirectory(prefix="civicshield-browser-") as folder:
    os.chdir(folder)
    os.environ.update(
        DATABASE_URL=f"sqlite:///{folder}/browser.db",
        ENVIRONMENT="development",
        COOKIE_SECURE="false",
        AI_ENABLED="false",
        FACILITIES_FILE="",
        REGISTRATION_ENABLED="true",
    )
    from backend.auth import hash_password
    from backend.auth_models import User
    from backend.database import SessionLocal, init_db

    init_db()
    with SessionLocal() as db:
        db.add(
            User(
                username="test-operator",
                password_hash=hash_password("test-only-password-for-browser"),
                role="OPERATOR",
            )
        )
        db.commit()
    import uvicorn

    uvicorn.run("backend.main:app", host="127.0.0.1", port=8098, log_level="warning")
