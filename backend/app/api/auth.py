"""Authentication, Registration with OTP, JWT tokens, and Role-Based Authorization."""

from __future__ import annotations

import logging
import os
import random
import smtplib
import sys
from datetime import datetime, timedelta, timezone
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
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
        create_refresh_token,
        decode_access_token,
        decode_refresh_token,
        check_rate_limit,
        is_account_locked,
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
        create_refresh_token,
        decode_access_token,
        decode_refresh_token,
        check_rate_limit,
        is_account_locked,
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


def log_audit_event(
    user_id: Optional[int],
    user_email: Optional[str],
    action: str,
    resource_type: Optional[str] = None,
    resource_id: Optional[str] = None,
    details: Optional[str] = None,
    ip_address: Optional[str] = None,
) -> None:
    """Record an audit trail entry in the database for sensitive administrative and privacy operations."""
    try:
        with engine.begin() as conn:
            conn.execute(
                text("""
                    INSERT INTO audit_logs (user_id, user_email, action, resource_type, resource_id, details, ip_address)
                    VALUES (:uid, :email, :act, :rtype, :rid, :det, :ip)
                """),
                {
                    "uid": user_id,
                    "email": user_email,
                    "act": action,
                    "rtype": resource_type,
                    "rid": str(resource_id) if resource_id else None,
                    "det": details,
                    "ip": ip_address,
                },
            )
    except Exception as e:
        logger.warning(f"[AuditLog] Could not log audit event: {e}")



def resolve_student_cohort(roll_no: Optional[str], fallback_sem: Optional[int] = None) -> tuple[int, int]:
    """
    Enrollment / Roll Number rules:
    - Starts with 24 (or 2024) -> 3rd Year, Semester 5
    - Starts with 25 (or 2025) -> 2nd Year, Semester 3
    - Starts with 26 (or 2026) -> 4th Year, Semester 7
    Returns: (academic_year, semester)
    """
    if not roll_no:
        sem = int(fallback_sem) if fallback_sem is not None else 5
        ayear = max(1, min(4, ((sem - 1) // 2) + 1))
        return (ayear, sem)
    clean = str(roll_no).strip().upper()
    if clean.startswith("24") or clean.startswith("2024"):
        return (3, 5)
    elif clean.startswith("25") or clean.startswith("2025"):
        return (2, 3)
    elif clean.startswith("26") or clean.startswith("2026"):
        return (4, 7)
    sem = int(fallback_sem) if fallback_sem is not None else 5
    ayear = max(1, min(4, ((sem - 1) // 2) + 1))
    return (ayear, sem)


def _enrich_user_profile(user: dict[str, Any]) -> dict[str, Any]:
    """Attach enrolled semester, section, department, contact info, and profile completion tracking."""
    role = str(user.get("role") or "").upper()
    user["role"] = role

    uid = user.get("user_id")
    if uid:
        try:
            with engine.connect() as check_conn:
                u_row = check_conn.execute(
                    text("SELECT phone, department, bio, emergency_contact, designation, class_section, semester, roll_no FROM users WHERE user_id = :uid"),
                    {"uid": uid}
                ).fetchone()
                if u_row:
                    m = dict(u_row._mapping)
                    if m.get("phone"): user["phone"] = m.get("phone")
                    if m.get("department"): user["department"] = m.get("department")
                    if m.get("bio"): user["bio"] = m.get("bio")
                    if m.get("emergency_contact"): user["emergency_contact"] = m.get("emergency_contact")
                    if m.get("designation"): user["designation"] = m.get("designation")
                    if m.get("class_section") and not str(m.get("class_section")).startswith("Class "):
                        user["class_section"] = m.get("class_section")
                    if m.get("semester"): user["semester"] = m.get("semester")
                    if m.get("roll_no"): user["roll_no"] = m.get("roll_no")
        except Exception:
            pass

    # Ensure clean section format (Section A-K)
    sec = user.get("class_section")
    if not sec or str(sec).startswith("Class "):
        sec = "Section D" if role == "STUDENT" else "All Sections"
        user["class_section"] = sec

    if role == "STUDENT":
        ayear, asem = resolve_student_cohort(user.get("roll_no"), fallback_sem=user.get("semester"))
        user["academic_year"] = ayear
        user["semester"] = asem
        user["program"] = "B.Tech AI & Data Science"
        user["department"] = user.get("department") or "AI & Data Science"
        try:
            with engine.connect() as check_conn:
                stud_row = check_conn.execute(
                    text("SELECT student_id, roll_number, semester, class_section, phone, bio, department_name FROM students WHERE LOWER(email) = :email OR user_id = :uid LIMIT 1"),
                    {"email": user.get("email", "").lower(), "uid": user.get("user_id")}
                ).fetchone()
                if stud_row:
                    s_map = dict(stud_row._mapping)
                    user["student_id"] = s_map.get("student_id")
                    if not user.get("roll_no") and s_map.get("roll_number"):
                        user["roll_no"] = s_map.get("roll_number")
                    ayear, asem = resolve_student_cohort(user.get("roll_no"), fallback_sem=s_map.get("semester") or user.get("semester"))
                    user["academic_year"] = ayear
                    user["semester"] = asem
                    if s_map.get("class_section") and not str(s_map.get("class_section")).startswith("Class "):
                        user["class_section"] = s_map.get("class_section")
                    if not user.get("phone") and s_map.get("phone"):
                        user["phone"] = s_map.get("phone")
                    if not user.get("bio") and s_map.get("bio"):
                        user["bio"] = s_map.get("bio")
                    if s_map.get("department_name"):
                        user["department"] = s_map.get("department_name")
                else:
                    user["student_id"] = user.get("user_id")
        except Exception:
            user["student_id"] = user.get("user_id")
    elif role in ("FACULTY", "ADMIN"):
        user["assigned_classes"] = ["Section A", "Section B", "Section C", "Section D", "Section E", "Section F"]
        user["department"] = user.get("department") or ("Computer Science & Engineering" if role == "FACULTY" else "Academic Administration")
        user["designation"] = user.get("designation") or ("Associate Professor" if role == "FACULTY" else "Dean of Academics")

    # Profile Completion Score Calculation
    missing_fields = []
    points = 0
    total_criteria = 7

    # 1. Full Name
    if user.get("name") and str(user["name"]).strip():
        points += 1
    else:
        missing_fields.append("Full Name")

    # 2. Email Address
    if user.get("email") and "@" in str(user["email"]):
        points += 1
    else:
        missing_fields.append("University Email")

    # 3. Roll Number or Staff ID
    if user.get("roll_no") and str(user["roll_no"]).strip():
        points += 1
    else:
        missing_fields.append("Roll Number / Employee ID")

    # 4. Department
    if user.get("department") and str(user["department"]).strip():
        points += 1
    else:
        missing_fields.append("Department")

    # 5. Cohort / Designation
    if role == "STUDENT":
        if user.get("semester") and user.get("class_section"):
            points += 1
        else:
            missing_fields.append("Semester & Class Section")
    else:
        if user.get("designation"):
            points += 1
        else:
            missing_fields.append("Academic Designation")

    # 6. Phone Number
    if user.get("phone") and len(str(user["phone"]).strip()) >= 7:
        points += 1
    else:
        missing_fields.append("Contact Phone Number")

    # 7. Academic Bio / Interests
    if user.get("bio") and len(str(user["bio"]).strip()) >= 5:
        points += 1
    else:
        missing_fields.append("Academic Bio / Focus")

    completion_pct = round((points / total_criteria) * 100)
    user["profile_completion_pct"] = completion_pct
    user["missing_fields"] = missing_fields
    user["is_profile_complete"] = (completion_pct == 100)

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


logger = logging.getLogger("sentio.auth")


def dispatch_otp_email(to_email: str, otp_code: str, purpose: str) -> tuple[bool, str]:
    """
    Attempts to dispatch real email via SMTP (e.g. Gmail / institutional SMTP).
    Returns (delivered: bool, message: str).
    """
    smtp_host = os.getenv("SMTP_HOST") or os.getenv("SMTP_SERVER", "smtp.gmail.com")
    smtp_port_raw = os.getenv("SMTP_PORT", "587")
    try:
        smtp_port = int(smtp_port_raw)
    except ValueError:
        smtp_port = 587

    smtp_user = os.getenv("SMTP_USER") or os.getenv("SMTP_USERNAME") or os.getenv("GMAIL_USER")
    smtp_pass = os.getenv("SMTP_PASS") or os.getenv("SMTP_PASSWORD") or os.getenv("GMAIL_APP_PASSWORD")
    smtp_from = os.getenv("SMTP_FROM") or os.getenv("SMTP_FROM_EMAIL") or (f"Sentio Academic Portal <{smtp_user}>" if smtp_user else "Sentio Portal <noreply@sentio.edu>")

    if not smtp_user or not smtp_pass:
        logger.info(f"[OTP Service] SMTP not configured. Ready with in-portal verification code for {to_email}: {otp_code}")
        return False, "SMTP credentials not configured"

    try:
        msg = MIMEMultipart("alternative")
        action_name = "Password Reset" if purpose == "RESET_PASSWORD" else "Account Registration"
        msg["Subject"] = f"Sentio Portal - {action_name} Verification Code: {otp_code}"
        msg["From"] = smtp_from
        msg["To"] = to_email

        plain_text = (
            f"Sentio Academic Portal\n\n"
            f"Your 6-digit {action_name} verification code is: {otp_code}\n\n"
            f"This code is valid for 10 minutes. Please enter it on the portal to continue.\n"
            f"If you did not request this verification code, please ignore this email.\n"
        )
        html_text = f"""
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
            <div style="text-align: center; margin-bottom: 20px;">
                <h2 style="color: #2563eb; margin: 0; font-size: 24px; font-weight: 700;">Sentio Academic Portal</h2>
                <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Security & Verification Desk</p>
            </div>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; text-align: center; margin-bottom: 20px;">
                <p style="color: #334155; font-size: 15px; margin-top: 0; font-weight: 500;">Your 6-Digit Verification Code:</p>
                <div style="font-size: 34px; font-weight: 700; letter-spacing: 8px; color: #1e40af; padding: 12px 24px; background: #ffffff; border: 2px dashed #93c5fd; border-radius: 8px; display: inline-block;">
                    {otp_code}
                </div>
                <p style="color: #64748b; font-size: 12px; margin-top: 14px; margin-bottom: 0;">Valid for 10 minutes. If you did not request this, please ignore this email.</p>
            </div>
            <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0;">Sentio Automated Notification System</p>
        </div>
        """
        msg.attach(MIMEText(plain_text, "plain"))
        msg.attach(MIMEText(html_text, "html"))

        server = smtplib.SMTP(smtp_host, smtp_port, timeout=12)
        server.ehlo()
        server.starttls()
        server.login(smtp_user, smtp_pass)
        server.sendmail(smtp_user, [to_email], msg.as_string())
        server.quit()
        logger.info(f"[OTP Service] Successfully sent OTP email to {to_email}")
        return True, "Email dispatched via SMTP"
    except Exception as exc:
        logger.warning(f"[OTP Service] Could not send SMTP email to {to_email}: {exc}")
        return False, str(exc)


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

    # Rate limiting: max 5 OTP requests per 15 minutes
    allowed, retry_after = check_rate_limit(f"otp_{email}", max_requests=5, window_seconds=900)
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Too many OTP requests. Please wait {retry_after} seconds before requesting another code.",
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

    email_dispatched, email_status = dispatch_otp_email(email, otp_code, purpose)

    action_label = "Password reset" if purpose == "RESET_PASSWORD" else "Verification"
    if email_dispatched:
        msg = f"{action_label} code sent directly to your email ({email}). Valid for 10 minutes."
    else:
        msg = f"{action_label} code generated! (Code: {otp_code} - auto-filled for instant verification)."

    return {
        "success": True,
        "message": msg,
        "email": email,
        "otp_code": otp_code,
        "email_dispatched": email_dispatched,
        "email_status": email_status,
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
        semester = resolve_student_cohort(roll_no, fallback_sem=payload.semester)[1] if role == "STUDENT" else None
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

    # Rate limiting on login attempts (max 10 attempts per 5 minutes per identifier)
    allowed, retry_after = check_rate_limit(f"login_{identifier}", max_requests=10, window_seconds=300)
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Too many login attempts. Please wait {retry_after} seconds before trying again.",
        )

    with engine.connect() as conn:
        # Match by email or roll_no
        query = text("""
            SELECT user_id, name, roll_no, email, password_hash, role, is_active, is_verified, semester, class_section, failed_login_attempts, locked_until
            FROM users
            WHERE LOWER(email) = :ident OR LOWER(roll_no) = :ident
            LIMIT 1
        """)
        row = conn.execute(query, {"ident": identifier}).fetchone()

        if not row:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email/roll number or password")

        user_data = dict(row._mapping)
        user_id = user_data["user_id"]

        # Check account lockout
        locked, rem_sec = is_account_locked(user_data)
        if locked:
            raise HTTPException(
                status_code=status.HTTP_423_LOCKED,
                detail=f"Account is temporarily locked due to consecutive failed login attempts. Please wait {rem_sec} seconds or reset your password via OTP.",
            )

        stored_hash = user_data.get("password_hash")

        # Verify password
        if not verify_password(payload.password, stored_hash):
            attempts = (user_data.get("failed_login_attempts") or 0) + 1
            if attempts >= 5:
                lock_exp = datetime.now(timezone.utc) + timedelta(minutes=15)
                with engine.begin() as wconn:
                    wconn.execute(
                        text("UPDATE users SET failed_login_attempts = :att, locked_until = :lck WHERE user_id = :uid"),
                        {"att": attempts, "lck": lock_exp.strftime("%Y-%m-%d %H:%M:%S"), "uid": user_id},
                    )
                raise HTTPException(
                    status_code=status.HTTP_423_LOCKED,
                    detail="Account locked for 15 minutes due to 5 consecutive failed login attempts. You can reset your password via OTP.",
                )
            else:
                with engine.begin() as wconn:
                    wconn.execute(
                        text("UPDATE users SET failed_login_attempts = :att WHERE user_id = :uid"),
                        {"att": attempts, "uid": user_id},
                    )
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email/roll number or password")

        if not user_data.get("is_active", True):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is disabled. Please contact administration.")

        # Reset failed attempts and lockout on success
        with engine.begin() as wconn:
            wconn.execute(
                text("UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE user_id = :uid"),
                {"uid": user_id},
            )

    # Remove password hash from response
    user_data.pop("password_hash", None)
    enriched = _enrich_user_profile(user_data)

    token_data = {
        "sub": str(enriched["user_id"]),
        "email": enriched["email"],
        "role": enriched["role"],
        "name": enriched["name"],
        "roll_no": enriched.get("roll_no"),
    }
    access_token = create_access_token(token_data)
    refresh_token, ref_hash, ref_exp = create_refresh_token(token_data)

    # Store refresh token hash in DB
    try:
        with engine.begin() as conn:
            conn.execute(
                text("INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (:uid, :thash, :exp)"),
                {"uid": enriched["user_id"], "thash": ref_hash, "exp": ref_exp.strftime("%Y-%m-%d %H:%M:%S")},
            )
    except Exception as e:
        logger.warning(f"Could not persist refresh token: {e}")

    log_audit_event(
        user_id=enriched["user_id"],
        user_email=enriched["email"],
        action="USER_LOGIN",
        resource_type="USER",
        resource_id=str(enriched["user_id"]),
        details=f"Successful login as {enriched['role']}",
    )

    return {
        "success": True,
        "message": f"Successfully authenticated as {enriched['role']}",
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": enriched,
    }


from pydantic import BaseModel

class RefreshTokenRequest(BaseModel):
    refresh_token: str


@router.post("/refresh", summary="Exchange rotating refresh token for new access and refresh tokens")
def refresh_token_endpoint(payload: RefreshTokenRequest) -> dict[str, Any]:
    raw_token = payload.refresh_token.strip()
    if not raw_token:
        raise HTTPException(status_code=400, detail="Refresh token is required")

    import hashlib
    decoded = decode_refresh_token(raw_token)
    if not decoded:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired refresh token")

    token_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()

    with engine.begin() as conn:
        row = conn.execute(
            text("SELECT token_id, user_id, is_revoked, expires_at FROM refresh_tokens WHERE token_hash = :thash LIMIT 1"),
            {"thash": token_hash},
        ).fetchone()

        if not row or row._mapping["is_revoked"]:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token has been revoked or is invalid")

        user_id = row._mapping["user_id"]

        # Revoke old refresh token (rotation)
        conn.execute(
            text("UPDATE refresh_tokens SET is_revoked = 1 WHERE token_id = :tid"),
            {"tid": row._mapping["token_id"]},
        )

        u_row = conn.execute(
            text("SELECT user_id, name, roll_no, email, role, is_active, is_verified, semester, class_section FROM users WHERE user_id = :uid LIMIT 1"),
            {"uid": user_id},
        ).fetchone()

        if not u_row or not u_row._mapping.get("is_active", True):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is disabled or not found")

        enriched = _enrich_user_profile(dict(u_row._mapping))

        token_data = {
            "sub": str(enriched["user_id"]),
            "email": enriched["email"],
            "role": enriched["role"],
            "name": enriched["name"],
            "roll_no": enriched.get("roll_no"),
        }
        new_access_token = create_access_token(token_data)
        new_refresh_token, new_ref_hash, new_ref_exp = create_refresh_token(token_data)

        conn.execute(
            text("INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (:uid, :thash, :exp)"),
            {"uid": user_id, "thash": new_ref_hash, "exp": new_ref_exp.strftime("%Y-%m-%d %H:%M:%S")},
        )

    return {
        "success": True,
        "access_token": new_access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer",
        "user": enriched,
    }


@router.get("/export-my-data", summary="Export personal feedback submissions and profile data (GDPR / Privacy Compliance)")
def export_my_data(current_user: dict[str, Any] = Depends(get_current_user)) -> dict[str, Any]:
    user_id = current_user["user_id"]
    email = current_user["email"]

    with engine.connect() as conn:
        feedbacks = conn.execute(
            text("SELECT feedback_id, feedback_text, course_code, course_name, submitted_at, is_anonymous, helpfulness_score FROM feedback WHERE student_id = :uid ORDER BY feedback_id DESC"),
            {"uid": user_id},
        ).fetchall()

        complaints = conn.execute(
            text("SELECT complaint_id, category, subject, description, status, filed_at, is_anonymous FROM complaints WHERE student_id = :uid ORDER BY complaint_id DESC"),
            {"uid": user_id},
        ).fetchall()

    log_audit_event(
        user_id=user_id,
        user_email=email,
        action="DATA_EXPORT",
        resource_type="USER",
        resource_id=str(user_id),
        details="Student requested personal data export",
    )

    return {
        "success": True,
        "exported_at": datetime.now(timezone.utc).isoformat(),
        "user_profile": current_user,
        "feedback_submissions": [dict(r._mapping) for r in feedbacks],
        "grievances": [dict(r._mapping) for r in complaints],
    }


@router.delete("/delete-my-account", summary="Anonymize personal identifiers and deactivate account upon user request")
def delete_my_account(current_user: dict[str, Any] = Depends(get_current_user)) -> dict[str, Any]:
    import secrets
    user_id = current_user["user_id"]
    email = current_user["email"]

    with engine.begin() as conn:
        # Anonymize student feedbacks: keep pedagogical rating data but detach student identity
        conn.execute(
            text("UPDATE feedback SET student_id = NULL, is_anonymous = 1 WHERE student_id = :uid"),
            {"uid": user_id},
        )
        conn.execute(
            text("UPDATE refresh_tokens SET is_revoked = 1 WHERE user_id = :uid"),
            {"uid": user_id},
        )
        anonymized_email = f"deleted_{secrets.token_hex(6)}@anonymized.local"
        conn.execute(
            text("UPDATE users SET is_active = 0, email = :anom, roll_no = NULL, name = 'Deactivated Student', password_hash = 'DEACTIVATED' WHERE user_id = :uid"),
            {"anom": anonymized_email, "uid": user_id},
        )

    log_audit_event(
        user_id=user_id,
        user_email=email,
        action="ACCOUNT_DELETION",
        resource_type="USER",
        resource_id=str(user_id),
        details="User requested account anonymization and deactivation",
    )

    return {
        "success": True,
        "message": "Your account and personal data have been completely scrubbed and anonymized.",
    }



@router.get("/me", summary="Get currently authenticated user details via JWT token")
def get_me(current_user: dict[str, Any] = Depends(get_current_user)) -> dict[str, Any]:
    return {
        "success": True,
        "user": current_user,
    }


@router.put("/profile", summary="Update user profile and contact details")
@router.put("/update-profile", summary="Update user profile and contact details (PUT alias)")
@router.post("/update-profile", summary="Update user name, roll number, email, semester, section, or password")
def update_profile(
    payload: UpdateProfileRequest,
    current_user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, Any]:
    user_id = current_user["user_id"]

    with engine.begin() as conn:
        # Check current user in DB
        u_row = conn.execute(
            text("SELECT user_id, name, roll_no, email, password_hash, role, semester, class_section, department, phone, bio, emergency_contact, designation FROM users WHERE user_id = :uid"),
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

        new_role = payload.role.upper().strip() if (payload.role and payload.role.strip()) else u_data.get("role") or "STUDENT"
        new_name = payload.name.strip() if (payload.name and payload.name.strip()) else u_data["name"]
        new_sem = resolve_student_cohort(new_roll, fallback_sem=payload.semester if payload.semester is not None else u_data.get("semester"))[1] if new_role == "STUDENT" else (payload.semester if payload.semester is not None else u_data.get("semester"))
        new_sec = payload.class_section if (payload.class_section and not payload.class_section.startswith("Class ")) else u_data.get("class_section") or "Section D"
        new_dept = payload.department.strip() if (payload.department and payload.department.strip()) else u_data.get("department") or "AI & Data Science"
        new_phone = payload.phone.strip() if (payload.phone and payload.phone.strip()) else u_data.get("phone")
        new_emerg = payload.emergency_contact.strip() if (payload.emergency_contact and payload.emergency_contact.strip()) else u_data.get("emergency_contact")
        new_bio = payload.bio.strip() if (payload.bio and payload.bio.strip()) else u_data.get("bio")
        new_desig = payload.designation.strip() if (payload.designation and payload.designation.strip()) else u_data.get("designation")

        # Password change handling
        new_pw_hash = u_data["password_hash"]
        req_old_pw = payload.old_password or payload.current_password
        if payload.new_password:
            if req_old_pw:
                if not verify_password(req_old_pw, u_data["password_hash"]):
                    raise HTTPException(status_code=400, detail="Current password does not match.")
            new_pw_hash = hash_password(payload.new_password)

        # Update users table
        conn.execute(
            text("""
                UPDATE users
                SET name = :name, roll_no = :roll_no, email = :email,
                    password_hash = :hash, semester = :sem, class_section = :sec,
                    department = :dept, phone = :phone, bio = :bio,
                    emergency_contact = :emerg, designation = :desig, role = :role
                WHERE user_id = :uid
            """),
            {
                "name": new_name,
                "roll_no": new_roll,
                "email": new_email,
                "hash": new_pw_hash,
                "sem": new_sem,
                "sec": new_sec,
                "dept": new_dept,
                "phone": new_phone,
                "bio": new_bio,
                "emerg": new_emerg,
                "desig": new_desig,
                "role": new_role,
                "uid": user_id,
            },
        )

        # If student, sync with students table
        if new_role == "STUDENT":
            s_row = conn.execute(
                text("SELECT student_id FROM students WHERE user_id = :uid OR LOWER(email) = :email LIMIT 1"),
                {"uid": user_id, "email": new_email},
            ).fetchone()
            if s_row:
                conn.execute(
                    text("""
                        UPDATE students
                        SET name = :name, roll_number = :roll_no, email = :email, semester = :sem,
                            class_section = :sec, department_name = :dept, phone = :phone, bio = :bio
                        WHERE student_id = :sid
                    """),
                    {
                        "name": new_name,
                        "roll_no": new_roll,
                        "email": new_email,
                        "sem": new_sem,
                        "sec": new_sec,
                        "dept": new_dept,
                        "phone": new_phone,
                        "bio": new_bio,
                        "sid": s_row._mapping["student_id"],
                    },
                )
            else:
                conn.execute(
                    text("""
                        INSERT INTO students (user_id, name, email, roll_number, semester, class_section, department_name, phone, bio)
                        VALUES (:uid, :name, :email, :roll_no, :sem, :sec, :dept, :phone, :bio)
                    """),
                    {
                        "uid": user_id,
                        "name": new_name,
                        "email": new_email,
                        "roll_no": new_roll,
                        "sem": new_sem,
                        "sec": new_sec,
                        "dept": new_dept,
                        "phone": new_phone,
                        "bio": new_bio,
                    },
                )
        elif new_role == "FACULTY":
            # If faculty, sync with faculty table
            f_row = conn.execute(
                text("SELECT faculty_id FROM faculty WHERE LOWER(email) = :email OR LOWER(name) = :name LIMIT 1"),
                {"email": new_email, "name": new_name.lower()},
            ).fetchone()
            if f_row:
                conn.execute(
                    text("UPDATE faculty SET name = :name, email = :email, department = :dept WHERE faculty_id = :fid"),
                    {"name": new_name, "email": new_email, "dept": new_dept, "fid": f_row._mapping["faculty_id"]},
                )
            else:
                conn.execute(
                    text("INSERT INTO faculty (name, email, department) VALUES (:name, :email, :dept)"),
                    {"name": new_name, "email": new_email, "dept": new_dept},
                )

        # Re-fetch updated user
        updated_row = conn.execute(
            text("SELECT user_id, name, roll_no, email, role, is_active, is_verified, semester, class_section, department, phone, bio, emergency_contact, designation FROM users WHERE user_id = :uid"),
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
        "message": f"Profile saved successfully! ({enriched.get('profile_completion_pct', 100)}% Complete)",
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
        {"user_id": 1, "name": "Arunn Reddy", "roll_no": "2024-AI-042", "email": "student@univ.edu", "role": "STUDENT", "semester": 5, "class_section": "Section D"},
        {"user_id": 7, "name": "Priya Patel", "roll_no": "2025-CS-018", "email": "priya@univ.edu", "role": "STUDENT", "semester": 3, "class_section": "Class 2A"},
        {"user_id": 2, "name": "Dr. A. Sharma", "roll_no": "FACULTY-001", "email": "faculty@univ.edu", "role": "FACULTY", "semester": None, "class_section": None},
        {"user_id": 3, "name": "Dean Academics", "roll_no": "ADMIN-001", "email": "admin@univ.edu", "role": "ADMIN", "semester": None, "class_section": None},
    ]

    for u in demo_list:
        _enrich_user_profile(u)

    return {"demo_accounts": demo_list}
