from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "CivicShield"
    app_version: str = "2.1.0"
    environment: str = "development"
    database_url: str = "sqlite:///./civicshield.db"
    allowed_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    cookie_secure: bool = False
    session_hours: int = 8
    registration_enabled: bool = True
    ai_enabled: bool = False
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "qwen3:8b"
    ai_timeout_seconds: float = 15
    facilities_file: str = ""
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
