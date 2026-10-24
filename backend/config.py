import os
from pathlib import Path
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    APP_ENV: str = "production"

    # Auto-detect SQLite path: in Docker container `/data/dashboard.db`, locally `./data/dashboard.db`
    DATABASE_URL: str = ""

    CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173"
    DEFAULT_SHEET_URL: str = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRLEXf7tzlK1byIE6qXmD5aFbjBFxfNX5tJJj8AeXqlZS3bAgIAG4O0s_OLwsW6uBG2v7WwR2NO7Z_K/pub?gid=0&single=true&output=csv"
    AUTO_SYNC_ENABLED: bool = True

    # --- Auth ---
    # Used only on first boot, when the database has no account yet.
    ADMIN_USERNAME: str = "admin"
    ADMIN_PASSWORD: str = ""
    DISPLAY_NAME: str = "Aretta"
    SESSION_DAYS: int = 30
    # None = secure cookies everywhere except APP_ENV=development
    COOKIE_SECURE: Optional[bool] = None
    LOGIN_MAX_ATTEMPTS: int = 5
    LOGIN_WINDOW_SECONDS: int = 900

    @property
    def is_dev(self) -> bool:
        return self.APP_ENV.lower() in {"development", "dev", "local", "test"}

    @property
    def cookie_secure(self) -> bool:
        if self.COOKIE_SECURE is not None:
            return self.COOKIE_SECURE
        return not self.is_dev


settings = Settings()

if not settings.DATABASE_URL:
    data_dir = Path("/data")
    if data_dir.exists() and os.access(str(data_dir), os.W_OK):
        settings.DATABASE_URL = "sqlite:////data/dashboard.db"
    else:
        local_dir = Path(__file__).resolve().parent.parent / "data"
        local_dir.mkdir(parents=True, exist_ok=True)
        settings.DATABASE_URL = f"sqlite:///{local_dir / 'dashboard.db'}"
