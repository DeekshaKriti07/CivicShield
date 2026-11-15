from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text

from backend.api.auth import router as auth_router
from backend.api.incidents import router as incidents_router
from backend.config import settings
from backend.database import engine, init_db
from backend.security import RequestBodyLimit


@asynccontextmanager
async def lifespan(app):
    if settings.environment == "production":
        if not settings.cookie_secure:
            raise RuntimeError("COOKIE_SECURE must be true in production")
        if settings.database_url.startswith("sqlite"):
            raise RuntimeError("Production requires a durable PostgreSQL DATABASE_URL")
    init_db()
    yield


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    lifespan=lifespan,
    docs_url="/api/docs" if settings.environment != "production" else None,
    redoc_url=None,
    openapi_url="/api/openapi.json" if settings.environment != "production" else None,
)
origins = [
    o.strip().rstrip("/") for o in settings.allowed_origins.split(",") if o.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "X-CSRF-Protection"],
)


app.add_middleware(RequestBodyLimit)


@app.middleware("http")
async def protect_requests(request: Request, call_next):
    response = None
    if request.url.path.startswith("/api/") and request.method not in {
        "GET",
        "HEAD",
        "OPTIONS",
    }:
        origin = request.headers.get("origin")
        same_origin = f"{request.url.scheme}://{request.url.netloc}"
        if request.headers.get("x-csrf-protection") != "1" or (
            origin and origin not in [same_origin, *origins]
        ):
            response = JSONResponse(
                {"detail": "Request origin could not be verified."}, status_code=403
            )
        length = request.headers.get("content-length", "0")
        if not length.isdigit() or int(length) > 16_384:
            response = JSONResponse(
                {"detail": "Request body is too large."}, status_code=413
            )
    if response is None:
        response = await call_next(request)
    response.headers.update(
        {
            "X-Content-Type-Options": "nosniff",
            "X-Frame-Options": "DENY",
            "Referrer-Policy": "same-origin",
            "Permissions-Policy": "camera=(), microphone=(), geolocation=(self)",
            "Content-Security-Policy": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://*.basemaps.cartocdn.com; connect-src 'self' https://nominatim.openstreetmap.org; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
        }
    )
    if request.url.path.startswith("/api/"):
        response.headers["Cache-Control"] = "no-store"
    if settings.cookie_secure:
        response.headers["Strict-Transport-Security"] = "max-age=31536000"
    return response


app.include_router(auth_router, prefix="/api")
app.include_router(incidents_router, prefix="/api")


@app.get("/health")
def health():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
    except Exception:
        return JSONResponse({"status": "unavailable"}, status_code=503)
    return {
        "status": "ok",
        "analysis_mode": "ollama" if settings.ai_enabled else "rules",
    }


dist = Path(__file__).resolve().parents[1] / "frontend" / "dist"
if (dist / "assets").is_dir():
    app.mount("/assets", StaticFiles(directory=dist / "assets"), name="assets")


if (dist / "icons").is_dir():
    app.mount("/icons", StaticFiles(directory=dist / "icons"), name="icons")


@app.get("/")
def frontend():
    if (dist / "index.html").is_file():
        return FileResponse(dist / "index.html", headers={"Cache-Control": "no-cache"})
    raise HTTPException(
        503, "Frontend build missing. Run the documented build command."
    )
