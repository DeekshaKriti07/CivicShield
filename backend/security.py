"""Shared database rate limits; atomic increments across application workers."""

import hashlib
from datetime import timedelta

from fastapi import HTTPException, Request
from sqlalchemy import update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from backend.auth_models import RateBucket, utc_now


def rate_limit(db: Session, key: str, limit: int, seconds: int = 60):
    now = utc_now()
    key = hashlib.sha256(key.encode()).hexdigest()
    db.query(RateBucket).filter(RateBucket.expires_at <= now).delete(
        synchronize_session=False
    )
    if db.get(RateBucket, key) is None:
        try:
            with db.begin_nested():
                db.add(
                    RateBucket(
                        key=key, count=0, expires_at=now + timedelta(seconds=seconds)
                    )
                )
                db.flush()
        except IntegrityError:
            pass
    result = db.execute(
        update(RateBucket)
        .where(RateBucket.key == key, RateBucket.count < limit)
        .values(count=RateBucket.count + 1)
    )
    db.commit()
    if result.rowcount != 1:
        raise HTTPException(
            429,
            "Too many requests. Please try again later.",
            headers={"Retry-After": str(seconds)},
        )


def client_key(request: Request) -> str:
    # Use the server's trusted proxy configuration, never arbitrary forwarding headers.
    return request.client.host if request.client else "unknown"


class RequestBodyLimit:
    """Bound JSON input even when a client omits Content-Length (chunked HTTP)."""

    def __init__(self, app, max_bytes=16_384):
        self.app = app
        self.max_bytes = max_bytes

    async def __call__(self, scope, receive, send):
        if (
            scope["type"] != "http"
            or not scope["path"].startswith("/api/")
            or scope["method"] in {"GET", "HEAD", "OPTIONS"}
        ):
            await self.app(scope, receive, send)
            return
        messages = []
        size = 0
        while True:
            message = await receive()
            if message["type"] == "http.disconnect":
                return
            size += len(message.get("body", b""))
            request_limit = (
                5_500_000
                if scope["path"] == "/api/incident-with-evidence"
                else self.max_bytes
            )
            if size > request_limit:
                from starlette.responses import JSONResponse

                await JSONResponse(
                    {"detail": "Request body is too large."}, status_code=413
                )(scope, receive, send)
                return
            messages.append(message)
            if not message.get("more_body", False):
                break
        iterator = iter(messages)

        async def replay():
            return next(
                iterator, {"type": "http.request", "body": b"", "more_body": False}
            )

        await self.app(scope, replay, send)
