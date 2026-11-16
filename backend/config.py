import os
from pathlib import Path
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    APP_ENV: str = "production"
    SECRET_KEY: str = "lemon-and-stain-dashboard-auth-key-2026-v2"

    # Auto-detect SQLite path: in Docker container `/data/dashboard.db`, locally `./data/dashboard.db`
    DATABASE_URL: str = ""

    CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173"
    DEFAULT_SHEET_URL: str = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRLEXf7tzlK1byIE6qXmD5aFbjBFxfNX5tJJj8AeXqlZS3bAgIAG4O0s_OLwsW6uBG2v7WwR2NO7Z_K/pub?gid=0&single=true&output=csv"
    AUTO_SYNC_ENABLED: bool = True

    # --- Integrations & AI ---
    INTEGRATION_KEY: str = ""
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-2.5-flash"
    DASHBOARD_PUBLIC_URL: str = ""

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

    @property
    def effective_integration_key(self) -> str:
        if self.INTEGRATION_KEY and self.INTEGRATION_KEY.strip():
            return self.INTEGRATION_KEY.strip()
        import hashlib
        return hashlib.sha256(f"{self.SECRET_KEY}:integration-key".encode()).hexdigest()[:32]


settings = Settings()

# Check alternative Postgres environment variable names (e.g. Vercel Marketplace / Neon)
if not settings.DATABASE_URL:
    for env_var in [
        "POSTGRES_URL",
        "DATABASE_URL_POOLED",
        "POSTGRES_PRISMA_URL",
        "NEON_DATABASE_URL",
        "POSTGRES_URL_NON_POOLING",
    ]:
        val = os.environ.get(env_var)
        if val:
            settings.DATABASE_URL = val
            break

if not settings.DATABASE_URL:
    data_dir = Path("/data")
    if data_dir.exists() and os.access(str(data_dir), os.W_OK):
        settings.DATABASE_URL = "sqlite:////data/dashboard.db"
    else:
        try:
            local_dir = Path(__file__).resolve().parent.parent / "data"
            local_dir.mkdir(parents=True, exist_ok=True)
            settings.DATABASE_URL = f"sqlite:///{local_dir / 'dashboard.db'}"
        except OSError:
            # Fallback for serverless environments where local filesystem is read-only
            settings.DATABASE_URL = "sqlite:////tmp/dashboard.db"
