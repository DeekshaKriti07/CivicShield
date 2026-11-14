"""Create staff accounts from a trusted shell; never through public registration."""

import argparse
from getpass import getpass

from backend.auth import hash_password
from backend.auth_models import User
from backend.database import SessionLocal, init_db


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("username")
    args = parser.parse_args()
    from backend.api.auth import RegisterRequest

    password = getpass("Password (12–128 characters): ")
    if password != getpass("Confirm password: "):
        raise SystemExit("Passwords do not match")
    checked = RegisterRequest(username=args.username, password=password)
    init_db()
    with SessionLocal() as db:
        if db.query(User).filter(User.username == checked.username).first():
            raise SystemExit("Username already exists; no account changed")
        db.add(
            User(
                username=checked.username,
                password_hash=hash_password(password),
                role="OPERATOR",
            )
        )
        db.commit()
    print("Operator account created")


if __name__ == "__main__":
    main()
