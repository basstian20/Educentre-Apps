"""auth routes."""
import os

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request, Response
from auth import create_access_token, create_refresh_token, get_current_user, hash_password, require_roles, verify_password
from core import _clear_cookies, _set_auth_cookies, db, new_id, now_iso
import audit
import login_guard
import mailer
import password_reset
from models import ForgotPasswordInput, LoginInput, RegisterInput, ResetPasswordInput

router = APIRouter()


# ── Auth ──
@router.post("/auth/login")
async def login(payload: LoginInput, request: Request, response: Response):
    email = payload.email.lower().strip()
    ip = login_guard.client_ip(request)
    await login_guard.ensure_not_locked(ip, email)
    user = await db.users.find_one({"email": email}, {"_id": 0})
    if not user or not verify_password(payload.password, user["password_hash"]):
        locked_for = await login_guard.register_failure(ip, email)
        if locked_for:
            await audit.record(
                {"id": user["id"], "full_name": user.get("full_name"), "email": email, "role": user["role"]} if user else {"email": email},
                "login_locked", "auth", user["id"] if user else None,
                f"Sign-in locked for {email} after repeated failures", ip=ip,
            )
            raise login_guard.locked_error(locked_for)
        raise HTTPException(status_code=401, detail="Invalid email or password")
    await login_guard.register_success(ip, email)
    if not user.get("is_active", True):
        raise HTTPException(status_code=403, detail="Account disabled")
    await audit.record(user, "login_success", "auth", user["id"], f"{user.get('full_name') or email} signed in", ip=ip)
    access = create_access_token(user["id"], user["email"], user["role"])
    refresh = create_refresh_token(user["id"])
    _set_auth_cookies(response, access, refresh)
    user.pop("password_hash", None)
    return {"user": user, "access_token": access}


@router.post("/auth/logout")
async def logout(response: Response):
    _clear_cookies(response)
    return {"ok": True}


@router.get("/auth/me")
async def me(current=Depends(get_current_user)):
    return current


@router.post("/auth/register")
async def register(payload: RegisterInput, response: Response, current=Depends(require_roles("admin"))):
    """Admin-only endpoint to create user accounts."""
    email = payload.email.lower().strip()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user_doc = {
        "id": new_id(),
        "email": email,
        "password_hash": hash_password(payload.password),
        "full_name": payload.full_name,
        "role": payload.role,
        "phone": payload.phone,
        "is_active": True,
        "created_at": now_iso(),
    }
    await db.users.insert_one(user_doc)
    user_doc.pop("password_hash", None)
    user_doc.pop("_id", None)
    await audit.record(current, "create", "user", user_doc["id"], f"Created {user_doc['role']} account {email}",
                       audit.diff(None, user_doc, ("email", "full_name", "role", "phone")))
    return user_doc


@router.get("/auth/lockouts")
async def list_lockouts(current=Depends(require_roles("admin"))):
    """Admin: sign-in locks that are active right now."""
    return await login_guard.list_locks()


@router.delete("/auth/lockouts/{email}")
async def clear_lockout(email: str, current=Depends(require_roles("admin"))):
    """Admin: lift the lock and reset the failure counters for an email address."""
    email = email.lower().strip()
    cleared = await login_guard.clear_email(email)
    await audit.record(current, "unlock", "auth", None, f"Lifted sign-in lock for {email}")
    return {"ok": True, "cleared": cleared}


@router.post("/auth/forgot-password")
async def forgot_password(payload: ForgotPasswordInput, background: BackgroundTasks):
    """Email a one-time reset link. The answer is the same whether or not the address has an account."""
    issued = await password_reset.issue_token(payload.email.lower().strip())
    response = {"ok": True}
    if issued:
        user, link = issued
        await audit.record(user, "password_reset_requested", "auth", user["id"], f"Password reset link issued for {user['email']}")
        subject, body = password_reset.email_body(user.get("full_name") or user["email"], link)
        background.add_task(mailer.send_email, user["email"], subject, body)
        # Development/demo convenience only: the console mailer has no inbox, so the link can be returned.
        debug = os.environ.get("PASSWORD_RESET_DEBUG_LINK", "").strip().lower() in ("1", "true", "yes")
        if mailer.provider() == "console" and debug:
            response["debug_reset_url"] = link
    return response


@router.post("/auth/reset-password")
async def reset_password(payload: ResetPasswordInput):
    user = await password_reset.reset_password(payload.token.strip(), payload.new_password)
    await audit.record(user, "password_reset", "auth", user.get("id"), f"Password reset completed for {user.get('email')}")
    return {"ok": True}
