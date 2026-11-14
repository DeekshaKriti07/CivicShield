import secrets
from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from pydantic import BaseModel, Field, field_validator
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from backend.auth import hash_password, token_hash, verify_password
from backend.auth_models import AuthSession, User, utc_now
from backend.config import settings
from backend.database import get_db
from backend.security import client_key, rate_limit

router = APIRouter(prefix="/auth", tags=["Authentication"])
COOKIE = "civicshield_session"
DUMMY_HASH = hash_password(secrets.token_urlsafe(32))


class LoginRequest(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    password: str = Field(min_length=1, max_length=128)

    @field_validator("username", mode="before")
    @classmethod
    def trim_username(cls, value):
        return value.strip() if isinstance(value, str) else value


class RegisterRequest(LoginRequest):
    password: str = Field(min_length=12, max_length=128)
    username: str = Field(min_length=3, max_length=50, pattern=r"^[A-Za-z0-9_.-]+$")


def public_user(user):
    return {"username": user.username, "role": user.role}


def get_current_user(request: Request, db: Session = Depends(get_db)):
    token = request.cookies.get(COOKIE)
    session = db.get(AuthSession, token_hash(token)) if token else None
    if session is None or session.expires_at <= utc_now():
        raise HTTPException(401, "Your session has expired. Please sign in.")
    user = db.get(User, session.user_id)
    if user is None or not user.is_active:
        raise HTTPException(401, "Account unavailable. Please sign in.")
    return user


def require_operator(user: User = Depends(get_current_user)):
    if user.role not in {"OPERATOR", "ADMIN"}:
        raise HTTPException(403, "Operator access is required for this action.")
    return user


@router.post("/register", status_code=201)
def register(data: RegisterRequest, request: Request, db: Session = Depends(get_db)):
    if not settings.registration_enabled:
        raise HTTPException(
            403, "Account creation is disabled. Contact your administrator."
        )
    rate_limit(db, f"register:{client_key(request)}", 5, 3600)
    user = User(
        username=data.username,
        password_hash=hash_password(data.password),
        role="REPORTER",
    )
    try:
        db.add(user)
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "That username is already in use.") from None
    return public_user(user)


@router.post("/login")
def login(
    data: LoginRequest,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
):
    rate_limit(db, f"login:{client_key(request)}", 20, 900)
    user = db.query(User).filter(User.username == data.username).first()
    valid = verify_password(data.password, user.password_hash if user else DUMMY_HASH)
    if not user or not valid or not user.is_active:
        raise HTTPException(401, "Invalid username or password.")
    old_token = request.cookies.get(COOKIE)
    if old_token:
        db.query(AuthSession).filter(
            AuthSession.token_hash == token_hash(old_token)
        ).delete()
    db.query(AuthSession).filter(AuthSession.expires_at <= utc_now()).delete()
    token = secrets.token_urlsafe(48)
    db.add(
        AuthSession(
            token_hash=token_hash(token),
            user_id=user.id,
            expires_at=utc_now() + timedelta(hours=settings.session_hours),
        )
    )
    db.commit()
    response.set_cookie(
        COOKIE,
        token,
        httponly=True,
        secure=settings.cookie_secure,
        samesite="strict",
        max_age=settings.session_hours * 3600,
        path="/api",
    )
    return public_user(user)


@router.get("/me")
def me(user: User = Depends(get_current_user)):
    return public_user(user)


@router.post("/logout", status_code=204)
def logout(request: Request, response: Response, db: Session = Depends(get_db)):
    token = request.cookies.get(COOKIE)
    if token:
        db.query(AuthSession).filter(
            AuthSession.token_hash == token_hash(token)
        ).delete()
        db.commit()
    response.delete_cookie(
        COOKIE,
        path="/api",
        secure=settings.cookie_secure,
        httponly=True,
        samesite="strict",
    )
