"""Authentication, Registration with OTP, JWT tokens, and Role-Based Authorization."""

from __future__ import annotations

import random
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Optional

from fastapi import APIRouter, Depends, Header, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import text

# Ensure repository root and backend directory are on Python path
REPO_ROOT = Path(__file__).resolve().parents[3]
BACKEND_DIR = Path(__file__).resolve().parents[2]
for p in [str(REPO_ROOT), str(BACKEND_DIR)]:
    if p not in sys.path:
        sys.path.insert(0, p)

try:
    from app.database.connection import engine
    from app.schemas.auth import (
        ChangePasswordRequest,
        GeminiConfigPayload,
        LoginRequest,
        RegisterRequest,
        ResetPasswordRequest,
        SendOtpRequest,
        TokenResponse,
        UpdateProfileRequest,
        UserResponse,
        VerifyOtpRequest,
    )
    from app.core.security import (
        create_access_token,
        decode_access_token,
        hash_password,
        verify_password,
    )
    from app.services.gemini_service import (
        get_gemini_api_key,
        set_gemini_api_key,
        verify_gemini_key,
    )
except ImportError:
    from backend.app.database.connection import engine
    from backend.app.schemas.auth import (
        ChangePasswordRequest,
        GeminiConfigPayload,
        LoginRequest,
        RegisterRequest,
        ResetPasswordRequest,
        SendOtpRequest,
        TokenResponse,
        UpdateProfileRequest,
        UserResponse,
        VerifyOtpRequest,
    )
    from backend.app.core.security import (
        create_access_token,
        decode_access_token,
        hash_password,
        verify_password,
    )
    from backend.app.services.gemini_service import (
        get_gemini_api_key,
        set_gemini_api_key,
        verify_gemini_key,
    )

router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication & Users"],
)

security_bearer = HTTPBearer(auto_error=False)


def _enrich_user_profile(user: dict[str, Any]) -> dict[str, Any]:
    """Attach enrolled semester, section, and student_id metadata."""
    role = str(user.get("role") or "").upper()
    user["role"] = role

    if role == "STUDENT":
        user["semester"] = user.get("semester") or 5
        user["class_section"] = user.get("class_section") or "Class 3A"
        user["program"] = "B.Tech AI & Data Science"
        with engine.connect() as check_conn:
            stud_row = check_conn.execute(
                text("SELECT student_id, roll_number, semester, class_section FROM students WHERE LOWER(email) = :email OR user_id = :uid LIMIT 1"),
                {"email": user.get("email", "").lower(), "uid": user.get("user_id")}
            ).fetchone()
            if stud_row:
                s_map = dict(stud_row._mapping)
                user["student_id"] = s_map.get("student_id")
                if not user.get("roll_no"):
                    user["roll_no"] = s_map.get("roll_number")
                if s_map.get("semester"):
                    user["semester"] = s_map.get("semester")
                if s_map.get("class_section"):
                    user["class_section"] = s_map.get("class_section")
            else:
                user["student_id"] = user.get("user_id")
    elif role in ("FACULTY", "ADMIN"):
        user["assigned_classes"] = ["Class 3A", "Class 3B", "Class 2A"]
        user["department"] = "AI & Data Science"

    return user


def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer)) -> dict[str, Any]:
    """Dependency: Extract and validate JWT Bearer token, then return full user payload."""
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided. Please log in.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_access_token(credentials.credentials)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload.get("sub")
    with engine.connect() as conn:
        row = conn.execute(
            text("SELECT user_id, name, roll_no, email, role, is_active, is_verified, semester, class_section FROM users WHERE user_id = :uid LIMIT 1"),
            {"uid": user_id},
        ).fetchone()

        if not row:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User account not found")

        user = dict(row._mapping)
        if not user.get("is_active", True):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User account is deactivated")

        return _enrich_user_profile(user)


def require_role(allowed_roles: list[str]):
    """Authorization dependency factory: Enforces specific roles (e.g. ['ADMIN', 'FACULTY'])."""
    def _role_checker(current_user: dict[str, Any] = Depends(get_current_user)) -> dict[str, Any]:
        user_role = (current_user.get("role") or "").upper()
        if user_role not in [r.upper() for r in allowed_roles]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied: This action requires one of the following roles: {', '.join(allowed_roles)}",
            )
        return current_user
    return _role_checker


@router.post("/send-otp", summary="Generate and dispatch a 6-digit OTP to user email or roll number")
def send_otp(payload: SendOtpRequest) -> dict[str, Any]:
    """Generate a secure 6-digit OTP, store in database with 10-minute validity, and dispatch."""
    raw_ident = (payload.email or "").strip()
    if not raw_ident:
        raise HTTPException(status_code=400, detail="University email address or Roll Number is required")

    purpose = (payload.purpose or "REGISTER").upper().strip()

    # Find user if input is Roll Number or Email
    with engine.connect() as conn:
        user_row = conn.execute(
            text("SELECT user_id, email, roll_no, name FROM users WHERE LOWER(email) = :ident OR LOWER(roll_no) = :ident LIMIT 1"),
            {"ident": raw_ident.lower()},
        ).fetchone()

    if purpose == "RESET_PASSWORD":
        if not user_row:
            raise HTTPException(
                status_code=404,
                detail=f"No account found matching '{raw_ident}'. Please check your email or roll number, or create an account.",
            )
        email = user_row._mapping["email"].lower()
    else:
        # REGISTER or general verification
        if "@" in raw_ident:
            email = raw_ident.lower()
        elif user_row:
            email = user_row._mapping["email"].lower()
        else:
            raise HTTPException(
                status_code=400,
                detail="A valid university email address (e.g. you@univ.edu) is required to register.",
            )

    # Generate 6-digit OTP
    otp_code = f"{random.randint(100000, 999999)}"
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)

    with engine.begin() as conn:
        # Invalidate old unused OTPs for this email and purpose
        conn.execute(
            text("UPDATE otps SET is_used = 1 WHERE LOWER(email) = :email AND is_used = 0"),
            {"email": email},
        )
        conn.execute(
            text("""
                INSERT INTO otps (email, otp_code, purpose, expires_at, is_used)
                VALUES (:email, :otp_code, :purpose, :expires_at, 0)
            """),
            {
                "email": email,
                "otp_code": otp_code,
                "purpose": purpose,
                "expires_at": expires_at.strftime("%Y-%m-%d %H:%M:%S"),
            },
        )

    action_label = "Password reset" if purpose == "RESET_PASSWORD" else "Verification"
    return {
        "success": True,
        "message": f"{action_label} code sent to {email}. Valid for 10 minutes.",
        "email": email,
        "otp_code": otp_code,
        "expires_in_minutes": 10,
    }


@router.post("/verify-otp", summary="Verify OTP validity without completing registration")
def verify_otp_endpoint(payload: VerifyOtpRequest) -> dict[str, Any]:
    raw_ident = payload.email.lower().strip()
    otp_code = payload.otp_code.strip()

    with engine.connect() as conn:
        user_row = conn.execute(
            text("SELECT email FROM users WHERE LOWER(email) = :ident OR LOWER(roll_no) = :ident LIMIT 1"),
            {"ident": raw_ident},
        ).fetchone()
        email = user_row._mapping["email"].lower() if user_row else raw_ident

        row = conn.execute(
            text("""
                SELECT otp_id, expires_at, is_used
                FROM otps
                WHERE LOWER(email) = :email AND otp_code = :otp_code AND is_used = 0
                ORDER BY otp_id DESC
                LIMIT 1
            """),
            {"email": email, "otp_code": otp_code},
        ).fetchone()

        if not row:
            raise HTTPException(status_code=400, detail="Invalid verification code")

        # Check expiration
        expires_str = row._mapping["expires_at"]
        try:
            exp_dt = datetime.strptime(str(expires_str).split(".")[0], "%Y-%m-%d %H:%M:%S").replace(tzinfo=timezone.utc)
            if datetime.now(timezone.utc) > exp_dt:
                raise HTTPException(status_code=400, detail="Verification code has expired. Please request a new one.")
        except Exception:
            pass

    return {
        "success": True,
        "message": "OTP verified successfully.",
    }


@router.post("/reset-password", summary="Reset account password using verified 6-digit OTP")
def reset_password(payload: ResetPasswordRequest) -> dict[str, Any]:
    identifier = payload.email.strip()
    otp_code = payload.otp_code.strip()
    new_password = payload.new_password

    if not identifier or not otp_code or not new_password:
        raise HTTPException(status_code=400, detail="Email or Roll Number, OTP code, and new password are required")
    if len(new_password) < 4:
        raise HTTPException(status_code=400, detail="Password must be at least 4 characters long")

    with engine.begin() as conn:
        # Find user by email or roll number
        user_row = conn.execute(
            text("SELECT user_id, email, name, roll_no FROM users WHERE LOWER(email) = :ident OR LOWER(roll_no) = :ident LIMIT 1"),
            {"ident": identifier.lower()},
        ).fetchone()

        if not user_row:
            raise HTTPException(status_code=404, detail="No registered account found matching that email or roll number")

        user_map = dict(user_row._mapping)
        email = user_map["email"].lower()
        user_id = user_map["user_id"]

        # Validate OTP
        otp_row = conn.execute(
            text("""
                SELECT otp_id, expires_at, is_used
                FROM otps
                WHERE LOWER(email) = :email AND otp_code = :otp_code AND is_used = 0
                ORDER BY otp_id DESC
                LIMIT 1
            """),
            {"email": email, "otp_code": otp_code},
        ).fetchone()

        if not otp_row:
            raise HTTPException(status_code=400, detail="Invalid or expired verification code. Please request a new OTP.")

        # Check expiration
        expires_str = otp_row._mapping["expires_at"]
        try:
            exp_dt = datetime.strptime(str(expires_str).split(".")[0], "%Y-%m-%d %H:%M:%S").replace(tzinfo=timezone.utc)
            if datetime.now(timezone.utc) > exp_dt:
                raise HTTPException(status_code=400, detail="Verification code has expired. Please request a new one.")
        except Exception:
            pass

        # Mark OTP used
        conn.execute(text("UPDATE otps SET is_used = 1 WHERE otp_id = :oid"), {"oid": otp_row._mapping["otp_id"]})

        # Hash new password and update user credentials
        pw_hash = hash_password(new_password)
        conn.execute(
            text("UPDATE users SET password_hash = :hash, is_active = 1 WHERE user_id = :uid"),
            {"hash": pw_hash, "uid": user_id},
        )

    return {
        "success": True,
        "message": "Password reset successfully! You can now sign in with your new password.",
        "email": email,
    }


@router.post("/register", summary="Register new user with Roll No, Name, Email, Password, and OTP verification")
def register(payload: RegisterRequest) -> dict[str, Any]:
    email = payload.email.lower().strip()
    otp_code = payload.otp_code.strip()
    name = payload.name.strip()
    roll_no = (payload.roll_no or "").strip()
    role = payload.role.upper().strip()
    if role not in ("STUDENT", "ADMIN", "FACULTY"):
        role = "STUDENT"

    if not name or not email or not payload.password:
        raise HTTPException(status_code=400, detail="Name, Email, and Password are required")

    # 1. Verify OTP
    with engine.begin() as conn:
        otp_row = conn.execute(
            text("""
                SELECT otp_id, expires_at, is_used
                FROM otps
                WHERE LOWER(email) = :email AND otp_code = :otp_code AND is_used = 0
                ORDER BY otp_id DESC
                LIMIT 1
            """),
            {"email": email, "otp_code": otp_code},
        ).fetchone()

        if not otp_row:
            raise HTTPException(status_code=400, detail="Invalid or expired OTP code")

        # Mark OTP as consumed
        conn.execute(text("UPDATE otps SET is_used = 1 WHERE otp_id = :oid"), {"oid": otp_row._mapping["otp_id"]})

        # 2. Check if user already exists
        existing_user = conn.execute(
            text("SELECT user_id FROM users WHERE LOWER(email) = :email LIMIT 1"),
            {"email": email},
        ).fetchone()

        pw_hash = hash_password(payload.password)
        semester = payload.semester if role == "STUDENT" else None
        class_section = payload.class_section if role == "STUDENT" else None

        if existing_user:
            uid = existing_user._mapping["user_id"]
            conn.execute(
                text("""
                    UPDATE users
                    SET name = :name, roll_no = :roll_no, password_hash = :pw_hash,
                        role = :role, semester = :semester, class_section = :class_section,
                        is_verified = 1, is_active = 1
                    WHERE user_id = :uid
                """),
                {
                    "name": name,
                    "roll_no": roll_no or f"STU-{uid:04d}",
                    "pw_hash": pw_hash,
                    "role": role,
                    "semester": semester,
                    "class_section": class_section,
                    "uid": uid,
                },
            )
            user_id = uid
        else:
            ins = conn.execute(
                text("""
                    INSERT INTO users (name, roll_no, email, password_hash, role, semester, class_section, is_verified, is_active)
                    VALUES (:name, :roll_no, :email, :pw_hash, :role, :semester, :class_section, 1, 1)
                """),
                {
                    "name": name,
                    "roll_no": roll_no or "2026-AI-REG",
                    "email": email,
                    "pw_hash": pw_hash,
                    "role": role,
                    "semester": semester,
                    "class_section": class_section,
                },
            )
            user_id = ins.lastrowid

        # If student, sync with students table
        if role == "STUDENT":
            s_row = conn.execute(
                text("SELECT student_id FROM students WHERE LOWER(email) = :email LIMIT 1"),
                {"email": email},
            ).fetchone()
            if s_row:
                conn.execute(
                    text("UPDATE students SET user_id = :uid, name = :name, roll_number = :roll_no, semester = :sem, class_section = :cls WHERE student_id = :sid"),
                    {"uid": user_id, "name": name, "roll_no": roll_no or "2026-AI-REG", "sem": semester or 5, "cls": class_section or "Class 3A", "sid": s_row._mapping["student_id"]},
                )
            else:
                conn.execute(
                    text("""
                        INSERT INTO students (user_id, name, email, roll_number, semester, class_section, department_name)
                        VALUES (:uid, :name, :email, :roll_no, :sem, :cls, 'AI & Data Science')
                    """),
                    {"uid": user_id, "name": name, "email": email, "roll_no": roll_no or "2026-AI-REG", "sem": semester or 5, "cls": class_section or "Class 3A"},
                )

        # Retrieve freshly updated user
        user_row = conn.execute(
            text("SELECT user_id, name, roll_no, email, role, is_active, is_verified, semester, class_section FROM users WHERE user_id = :uid"),
            {"uid": user_id},
        ).fetchone()
        user_dict = dict(user_row._mapping)

    enriched = _enrich_user_profile(user_dict)
    token = create_access_token({
        "sub": str(enriched["user_id"]),
        "email": enriched["email"],
        "role": enriched["role"],
        "name": enriched["name"],
        "roll_no": enriched.get("roll_no"),
    })

    return {
        "success": True,
        "message": f"Account registered and verified successfully as {enriched['role']}!",
        "access_token": token,
        "token_type": "bearer",
        "user": enriched,
    }


@router.post("/login", summary="Login with Email or Roll Number and Password to receive JWT Token")
def login(payload: LoginRequest) -> dict[str, Any]:
    identifier = payload.email.lower().strip()
    if not identifier:
        raise HTTPException(status_code=400, detail="Email or Roll Number is required")

    with engine.connect() as conn:
        # Match by email or roll_no
        query = text("""
            SELECT user_id, name, roll_no, email, password_hash, role, is_active, is_verified, semester, class_section
            FROM users
            WHERE LOWER(email) = :ident OR LOWER(roll_no) = :ident
            LIMIT 1
        """)
        row = conn.execute(query, {"ident": identifier}).fetchone()

        if not row:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email/roll number or password")

        user_data = dict(row._mapping)
        stored_hash = user_data.get("password_hash")

        # Verify password
        if not verify_password(payload.password, stored_hash):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email/roll number or password")

        if not user_data.get("is_active", True):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is disabled. Please contact administration.")

    # Remove password hash from response
    user_data.pop("password_hash", None)
    enriched = _enrich_user_profile(user_data)

    token = create_access_token({
        "sub": str(enriched["user_id"]),
        "email": enriched["email"],
        "role": enriched["role"],
        "name": enriched["name"],
        "roll_no": enriched.get("roll_no"),
    })

    return {
        "success": True,
        "message": f"Successfully authenticated as {enriched['role']}",
        "access_token": token,
        "token_type": "bearer",
        "user": enriched,
    }


@router.get("/me", summary="Get currently authenticated user details via JWT token")
def get_me(current_user: dict[str, Any] = Depends(get_current_user)) -> dict[str, Any]:
    return {
        "success": True,
        "user": current_user,
    }


@router.post("/update-profile", summary="Update user name, roll number, email, semester, section, or password")
def update_profile(
    payload: UpdateProfileRequest,
    current_user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, Any]:
    user_id = current_user["user_id"]

    with engine.begin() as conn:
        # Check current user in DB
        u_row = conn.execute(
            text("SELECT user_id, name, roll_no, email, password_hash, role, semester, class_section FROM users WHERE user_id = :uid"),
            {"uid": user_id},
        ).fetchone()
        if not u_row:
            raise HTTPException(status_code=404, detail="User account not found")
        u_data = dict(u_row._mapping)

        # If changing email, ensure uniqueness
        new_email = payload.email.lower().strip() if (payload.email and payload.email.strip()) else u_data["email"].lower()
        if new_email != u_data["email"].lower():
            conflict = conn.execute(
                text("SELECT user_id FROM users WHERE LOWER(email) = :email AND user_id != :uid"),
                {"email": new_email, "uid": user_id},
            ).fetchone()
            if conflict:
                raise HTTPException(status_code=400, detail=f"The email '{new_email}' is already in use by another account.")

        # If changing roll_no, ensure uniqueness
        new_roll = payload.roll_no.strip() if (payload.roll_no and payload.roll_no.strip()) else u_data.get("roll_no")
        if new_roll and new_roll.lower() != (u_data.get("roll_no") or "").lower():
            conflict_roll = conn.execute(
                text("SELECT user_id FROM users WHERE LOWER(roll_no) = :roll AND user_id != :uid"),
                {"roll": new_roll.lower(), "uid": user_id},
            ).fetchone()
            if conflict_roll:
                raise HTTPException(status_code=400, detail=f"Roll Number/ID '{new_roll}' is already in use by another user.")

        new_name = payload.name.strip() if (payload.name and payload.name.strip()) else u_data["name"]
        new_sem = payload.semester if payload.semester is not None else u_data.get("semester")
        new_sec = payload.class_section if payload.class_section is not None else u_data.get("class_section")

        # Password change handling
        new_pw_hash = u_data["password_hash"]
        if payload.new_password:
            if payload.current_password:
                if not verify_password(payload.current_password, u_data["password_hash"]):
                    raise HTTPException(status_code=400, detail="Current password does not match.")
            new_pw_hash = hash_password(payload.new_password)

        # Update users table
        conn.execute(
            text("""
                UPDATE users
                SET name = :name, roll_no = :roll_no, email = :email,
                    password_hash = :hash, semester = :sem, class_section = :sec
                WHERE user_id = :uid
            """),
            {
                "name": new_name,
                "roll_no": new_roll,
                "email": new_email,
                "hash": new_pw_hash,
                "sem": new_sem,
                "sec": new_sec,
                "uid": user_id,
            },
        )

        # If user is student, sync with students table
        if (u_data.get("role") or "").upper() == "STUDENT":
            s_row = conn.execute(
                text("SELECT student_id FROM students WHERE user_id = :uid OR LOWER(email) = :email LIMIT 1"),
                {"uid": user_id, "email": u_data["email"].lower()},
            ).fetchone()
            if s_row:
                conn.execute(
                    text("""
                        UPDATE students
                        SET name = :name, roll_number = :roll_no, email = :email, semester = :sem, class_section = :sec
                        WHERE student_id = :sid
                    """),
                    {
                        "name": new_name,
                        "roll_no": new_roll,
                        "email": new_email,
                        "sem": new_sem,
                        "sec": new_sec,
                        "sid": s_row._mapping["student_id"],
                    },
                )
            else:
                conn.execute(
                    text("""
                        INSERT INTO students (user_id, name, email, roll_number, semester, class_section, department_name)
                        VALUES (:uid, :name, :email, :roll_no, :sem, :sec, 'AI & Data Science')
                    """),
                    {
                        "uid": user_id,
                        "name": new_name,
                        "email": new_email,
                        "roll_no": new_roll,
                        "sem": new_sem,
                        "sec": new_sec,
                    },
                )

        # Re-fetch updated user
        updated_row = conn.execute(
            text("SELECT user_id, name, roll_no, email, role, is_active, is_verified, semester, class_section FROM users WHERE user_id = :uid"),
            {"uid": user_id},
        ).fetchone()
        updated_dict = dict(updated_row._mapping)

    enriched = _enrich_user_profile(updated_dict)
    new_token = create_access_token({
        "sub": str(enriched["user_id"]),
        "email": enriched["email"],
        "role": enriched["role"],
        "name": enriched["name"],
        "roll_no": enriched.get("roll_no"),
    })

    return {
        "success": True,
        "message": "Account credentials and profile updated successfully!",
        "user": enriched,
        "access_token": new_token,
    }


@router.post("/change-password", summary="Change password for authenticated user")
def change_password(
    payload: ChangePasswordRequest,
    current_user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, Any]:
    user_id = current_user["user_id"]
    with engine.begin() as conn:
        row = conn.execute(
            text("SELECT password_hash FROM users WHERE user_id = :uid"),
            {"uid": user_id},
        ).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="User account not found")
        stored_hash = row._mapping["password_hash"]
        if not verify_password(payload.current_password, stored_hash):
            raise HTTPException(status_code=400, detail="Current password does not match.")

        new_hash = hash_password(payload.new_password)
        conn.execute(
            text("UPDATE users SET password_hash = :hash WHERE user_id = :uid"),
            {"hash": new_hash, "uid": user_id},
        )

    return {"success": True, "message": "Password changed successfully."}


@router.get("/gemini-config", summary="Retrieve active Gemini Token configuration status")
def get_gemini_config() -> dict[str, Any]:
    key = get_gemini_api_key()
    has_key = bool(key and len(key) > 5)
    preview = f"{key[:6]}...{key[-4:]}" if has_key else None
    return {
        "has_gemini_key": has_key,
        "key_preview": preview,
        "active_engine": "Google Gemini 1.5 Flash (Verified Live AI)" if has_key else "Domain-Calibrated Local NLP",
        "model_name": "gemini-1.5-flash",
    }


@router.post("/gemini-config", summary="Save and verify Google Gemini API Key")
def save_gemini_config(payload: GeminiConfigPayload) -> dict[str, Any]:
    is_valid, msg = verify_gemini_key(payload.gemini_api_key)
    if not is_valid:
        raise HTTPException(status_code=400, detail=f"Gemini Verification Failed: {msg}")

    set_gemini_api_key(payload.gemini_api_key)
    return {
        "success": True,
        "message": "Google Gemini API Key successfully verified and saved! Real-time AI reasoning is now active.",
        "active_engine": "Google Gemini 1.5 Flash (Verified Live AI)",
    }


@router.get("/demo-users", summary="Retrieve standard sample users for compatibility")
def get_demo_users() -> dict[str, Any]:
    with engine.connect() as conn:
        query = text("""
            SELECT user_id, name, roll_no, email, role, semester, class_section
            FROM users
            WHERE email IN ('student@univ.edu', 'priya@univ.edu', 'faculty@univ.edu', 'admin@univ.edu')
            ORDER BY user_id ASC
        """)
        results = [dict(r._mapping) for r in conn.execute(query)]

    demo_list = results or [
        {"user_id": 1, "name": "Arunn Reddy", "roll_no": "2024-AI-042", "email": "student@univ.edu", "role": "STUDENT", "semester": 5, "class_section": "Class 3A"},
        {"user_id": 7, "name": "Priya Patel", "roll_no": "2025-CS-018", "email": "priya@univ.edu", "role": "STUDENT", "semester": 3, "class_section": "Class 2A"},
        {"user_id": 2, "name": "Dr. A. Sharma", "roll_no": "FACULTY-001", "email": "faculty@univ.edu", "role": "FACULTY", "semester": None, "class_section": None},
        {"user_id": 3, "name": "Dean Academics", "roll_no": "ADMIN-001", "email": "admin@univ.edu", "role": "ADMIN", "semester": None, "class_section": None},
    ]

    for u in demo_list:
        _enrich_user_profile(u)

    return {"demo_accounts": demo_list}
