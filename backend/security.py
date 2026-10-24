"""Single-user authentication: scrypt password hashes, opaque session cookies,
login throttling, and a custom-header CSRF guard."""
import base64
import hashlib
import hmac
import logging
import secrets
import threading
import time
from collections import defaultdict, deque
from datetime import timedelta
from typing import Optional

from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from config import settings
from database.connection import get_db
from models.db_models import AuthSession, User, utcnow

logger = logging.getLogger("lemon_stain")

SESSION_COOKIE = "ls_session"
CSRF_HEADER = "x-requested-with"
CSRF_VALUE = "lemon-stain"
MIN_PASSWORD_LENGTH = 10

# scrypt parameters: ~16 MB memory, well under the API container limit
_SCRYPT_N = 2 ** 14
_SCRYPT_R = 8
_SCRYPT_P = 1


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.scrypt(
        password.encode("utf-8"), salt=salt, n=_SCRYPT_N, r=_SCRYPT_R, p=_SCRYPT_P, dklen=32
    )
    return "scrypt${}${}${}${}${}".format(
        _SCRYPT_N, _SCRYPT_R, _SCRYPT_P,
        base64.b64encode(salt).decode(), base64.b64encode(digest).decode(),
    )


def verify_password(password: str, encoded: str) -> bool:
    try:
        algo, n, r, p, salt_b64, digest_b64 = encoded.split("$")
        if algo != "scrypt":
            return False
        salt = base64.b64decode(salt_b64)
        expected = base64.b64decode(digest_b64)
        actual = hashlib.scrypt(
            password.encode("utf-8"), salt=salt, n=int(n), r=int(r), p=int(p), dklen=len(expected)
        )
        return hmac.compare_digest(actual, expected)
    except (ValueError, TypeError):
        return False


# Verifying against this when the username is unknown keeps response timing uniform.
_DUMMY_HASH = hash_password(secrets.token_urlsafe(16))


def _token_id(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def create_session(db: Session, user: User, user_agent: str = "") -> str:
    token = secrets.token_urlsafe(32)
    now = utcnow()
    db.add(AuthSession(
        id=_token_id(token),
        user_id=user.id,
        created_at=now,
        last_seen_at=now,
        expires_at=now + timedelta(days=settings.SESSION_DAYS),
        user_agent=(user_agent or "")[:255],
    ))
    # Opportunistic cleanup of expired sessions
    db.query(AuthSession).filter(AuthSession.expires_at < now).delete()
    db.commit()
    return token


def delete_session(db: Session, token: Optional[str]) -> None:
    if not token:
        return
    db.query(AuthSession).filter(AuthSession.id == _token_id(token)).delete()
    db.commit()


def revoke_other_sessions(db: Session, user: User, keep_token: Optional[str]) -> None:
    q = db.query(AuthSession).filter(AuthSession.user_id == user.id)
    if keep_token:
        q = q.filter(AuthSession.id != _token_id(keep_token))
    q.delete()
    db.commit()


def set_session_cookie(response, token: str) -> None:
    response.set_cookie(
        SESSION_COOKIE,
        token,
        max_age=settings.SESSION_DAYS * 86400,
        httponly=True,
        secure=settings.cookie_secure,
        samesite="strict",
        path="/",
    )


def clear_session_cookie(response) -> None:
    response.delete_cookie(SESSION_COOKIE, path="/", samesite="strict",
                           secure=settings.cookie_secure, httponly=True)


def require_user(request: Request, db: Session = Depends(get_db)) -> User:
    """Dependency for every protected route."""
    if request.method not in {"GET", "HEAD", "OPTIONS"}:
        if request.headers.get(CSRF_HEADER) != CSRF_VALUE:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Missing request header")

    token = request.cookies.get(SESSION_COOKIE)
    if not token:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Not signed in")

    session = db.query(AuthSession).filter(AuthSession.id == _token_id(token)).first()
    now = utcnow()
    if not session or session.expires_at < now:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Session expired")

    # Sliding expiry, written at most once an hour to keep SQLite writes rare
    if now - (session.last_seen_at or now) > timedelta(hours=1):
        session.last_seen_at = now
        session.expires_at = now + timedelta(days=settings.SESSION_DAYS)
        db.commit()

    user = db.get(User, session.user_id)
    if not user:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Not signed in")
    request.state.session_token = token
    return user


class LoginThrottle:
    """Sliding-window limit on failed logins per client IP (in-memory, single worker)."""

    def __init__(self) -> None:
        self._failures: dict[str, deque] = defaultdict(deque)
        self._lock = threading.Lock()

    def _prune(self, key: str, now: float) -> deque:
        window = settings.LOGIN_WINDOW_SECONDS
        q = self._failures[key]
        while q and now - q[0] > window:
            q.popleft()
        return q

    def retry_after(self, key: str) -> int:
        with self._lock:
            now = time.monotonic()
            q = self._prune(key, now)
            if len(q) >= settings.LOGIN_MAX_ATTEMPTS:
                return max(1, int(settings.LOGIN_WINDOW_SECONDS - (now - q[0])))
            return 0

    def fail(self, key: str) -> None:
        with self._lock:
            self._failures[key].append(time.monotonic())

    def reset(self, key: str) -> None:
        with self._lock:
            self._failures.pop(key, None)


login_throttle = LoginThrottle()


def client_ip(request: Request) -> str:
    # The API is only reachable through Caddy, which sets X-Real-IP from the socket peer.
    return request.headers.get("x-real-ip") or (request.client.host if request.client else "unknown")


def authenticate(db: Session, username: str, password: str) -> Optional[User]:
    user = db.query(User).filter(User.username == username.strip().lower()).first()
    if not user:
        verify_password(password, _DUMMY_HASH)
        return None
    return user if verify_password(password, user.password_hash) else None


def create_user(db: Session, username: str, password: str, display_name: str = "") -> User:
    user = User(
        username=username.strip().lower(),
        password_hash=hash_password(password),
        display_name=display_name or settings.DISPLAY_NAME,
        password_changed_at=utcnow(),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def ensure_initial_user(db: Session) -> None:
    if db.query(User).first():
        return
    if settings.ADMIN_PASSWORD:
        if len(settings.ADMIN_PASSWORD) < MIN_PASSWORD_LENGTH:
            logger.error("ADMIN_PASSWORD must be at least %d characters; no account created.",
                         MIN_PASSWORD_LENGTH)
            return
        create_user(db, settings.ADMIN_USERNAME, settings.ADMIN_PASSWORD)
        logger.info("Created the dashboard account '%s' from ADMIN_PASSWORD.", settings.ADMIN_USERNAME)
    elif settings.is_dev:
        create_user(db, "admin", "lemon-and-stain")
        logger.warning("Development mode: created account admin / lemon-and-stain. "
                       "Never use this in production.")
    else:
        logger.warning("No dashboard account exists. Set ADMIN_PASSWORD in .env and restart, "
                       "or run `python manage.py create-user`.")


def account_exists(db: Session) -> bool:
    return db.query(User).first() is not None
