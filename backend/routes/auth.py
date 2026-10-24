from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session

from database.connection import get_db
from models.db_models import AuthSession, User, utcnow
from models.schemas import (
    AuthStatusResponse, LoginRequest, PasswordChangeRequest, ProfileUpdate, UserResponse,
)
from security import (
    CSRF_HEADER, CSRF_VALUE, SESSION_COOKIE, _token_id, account_exists, authenticate,
    clear_session_cookie, client_ip, create_session, delete_session, hash_password,
    login_throttle, require_user, revoke_other_sessions, set_session_cookie, verify_password,
)

router = APIRouter(prefix="/api/auth", tags=["Auth"])


def _user_out(user: User) -> UserResponse:
    return UserResponse(username=user.username, display_name=user.display_name or user.username)


def _require_csrf(request: Request) -> None:
    if request.headers.get(CSRF_HEADER) != CSRF_VALUE:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Missing request header")


@router.get("/status", response_model=AuthStatusResponse)
def auth_status(request: Request, db: Session = Depends(get_db)):
    """Public: tells the login screen whether a session is active."""
    token = request.cookies.get(SESSION_COOKIE)
    if token:
        session = db.query(AuthSession).filter(AuthSession.id == _token_id(token)).first()
        if session and session.expires_at > utcnow():
            user = db.get(User, session.user_id)
            if user:
                return AuthStatusResponse(authenticated=True, account_exists=True, user=_user_out(user))
    return AuthStatusResponse(authenticated=False, account_exists=account_exists(db))


@router.post("/login", response_model=UserResponse)
def login(payload: LoginRequest, request: Request, response: Response, db: Session = Depends(get_db)):
    _require_csrf(request)
    ip = client_ip(request)
    wait = login_throttle.retry_after(ip)
    if wait:
        raise HTTPException(
            status.HTTP_429_TOO_MANY_REQUESTS,
            f"Too many attempts. Try again in {max(1, wait // 60)} min.",
            headers={"Retry-After": str(wait)},
        )
    if not account_exists(db):
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE,
            "No account has been set up yet. Set ADMIN_PASSWORD on the server and restart.",
        )

    user = authenticate(db, payload.username, payload.password)
    if not user:
        login_throttle.fail(ip)
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "That username and password don't match.")

    login_throttle.reset(ip)
    token = create_session(db, user, request.headers.get("user-agent", ""))
    set_session_cookie(response, token)
    return _user_out(user)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(request: Request, response: Response, db: Session = Depends(get_db)):
    _require_csrf(request)
    delete_session(db, request.cookies.get(SESSION_COOKIE))
    clear_session_cookie(response)
    response.status_code = status.HTTP_204_NO_CONTENT
    return response


@router.get("/me", response_model=UserResponse)
def me(user: User = Depends(require_user)):
    return _user_out(user)


@router.put("/profile", response_model=UserResponse)
def update_profile(payload: ProfileUpdate, user: User = Depends(require_user), db: Session = Depends(get_db)):
    user = db.merge(user)
    user.display_name = payload.display_name.strip()
    db.commit()
    return _user_out(user)


@router.post("/password", status_code=status.HTTP_204_NO_CONTENT)
def change_password(
    payload: PasswordChangeRequest,
    request: Request,
    response: Response,
    user: User = Depends(require_user),
    db: Session = Depends(get_db),
):
    user = db.merge(user)
    if not verify_password(payload.current_password, user.password_hash):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Your current password isn't right.")
    user.password_hash = hash_password(payload.new_password)
    user.password_changed_at = utcnow()
    db.commit()
    # Sign out every other browser that still holds the old password's session
    revoke_other_sessions(db, user, getattr(request.state, "session_token", None))
    response.status_code = status.HTTP_204_NO_CONTENT
    return response
