from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "CivicShield"
    app_version: str = "1.0.0"

    database_url: str = "sqlite:///./civicshield.db"

    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "qwen3:8b"

    upload_dir: str = "backend/uploads"

    allowed_origins: str = "http://localhost:5173,http://localhost:4173,http://127.0.0.1:5173,http://127.0.0.1:4173"

    secret_key: str = ""

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",
    )


settings = Settings()