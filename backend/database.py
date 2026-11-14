from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from backend.config import settings

url = settings.database_url
if url.startswith("postgres://"):
    url = url.replace("postgres://", "postgresql+psycopg://", 1)
elif url.startswith("postgresql://"):
    url = url.replace("postgresql://", "postgresql+psycopg://", 1)
engine = create_engine(
    url,
    pool_pre_ping=True,
    connect_args={"check_same_thread": False} if url.startswith("sqlite") else {},
)
SessionLocal = sessionmaker(bind=engine, autoflush=False)


class Base(DeclarativeBase):
    pass


def get_db():
    with SessionLocal() as db:
        yield db


def init_db():
    from backend import auth_models, models  # noqa: F401

    Base.metadata.create_all(bind=engine)
