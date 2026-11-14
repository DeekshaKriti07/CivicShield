"""Password hashing compatible with existing PBKDF2 accounts; opaque sessions."""

import hashlib

from passlib.context import CryptContext

pwd_context = CryptContext(
    schemes=["pbkdf2_sha256"], pbkdf2_sha256__default_rounds=600_000
)


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return pwd_context.verify(password, password_hash)
    except (ValueError, TypeError):
        return False


def token_hash(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()
