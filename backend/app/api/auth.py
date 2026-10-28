import sys
from pathlib import Path
from typing import Any
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy import text

# Ensure repository root and backend directory are on Python path
REPO_ROOT = Path(__file__).resolve().parents[3]
BACKEND_DIR = Path(__file__).resolve().parents[2]
for p in [str(REPO_ROOT), str(BACKEND_DIR)]:
    if p not in sys.path:
        sys.path.insert(0, p)

try:
    from app.database.connection import engine
    from app.schemas.auth import LoginRequest, UserResponse
except ImportError:
    from backend.app.database.connection import engine
    from backend.app.schemas.auth import LoginRequest, UserResponse

router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication & Users"],
)


def detect_role_from_email(email: str) -> str:
    """Heuristic role resolver based on university email formatting."""
    email_lower = email.lower().strip()
    if any(keyword in email_lower for keyword in ["admin", "dean", "hod", "director"]):
        return "ADMIN"
    elif any(keyword in email_lower for keyword in ["faculty", "prof", "dr.", "teacher", "instructor"]):
        return "FACULTY"
    else:
        return "STUDENT"


@router.post("/login", summary="Login by email and resolve user role")
def login(payload: LoginRequest) -> dict[str, Any]:
    email = payload.email.lower().strip()
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")

    with engine.begin() as conn:
        # Check if user exists
        query = text("""
            SELECT user_id, name, email, role, is_active, semester, class_section
            FROM users
            WHERE LOWER(email) = :email
            LIMIT 1
        """)
        row = conn.execute(query, {"email": email}).fetchone()

        if row:
            user = dict(row._mapping)
        else:
            # Auto-provision new user based on email heuristic
            role = detect_role_from_email(email)
            name_part = email.split("@")[0].replace(".", " ").title()
            default_sem = 5 if role == "STUDENT" else None
            default_cls = "Class 3A" if role == "STUDENT" else None
            insert_query = text("""
                INSERT INTO users (name, email, password_hash, role, semester, class_section)
                VALUES (:name, :email, :password, :role, :semester, :class_section)
            """)
            conn.execute(
                insert_query,
                {
                    "name": name_part or f"User ({role})",
                    "email": email,
                    "password": payload.password or "pass123",
                    "role": role,
                    "semester": default_sem,
                    "class_section": default_cls,
                },
            )
            fetch_query = text("SELECT user_id, name, email, role, is_active, semester, class_section FROM users WHERE email = :email")
            user = dict(conn.execute(fetch_query, {"email": email}).fetchone()._mapping)

    # Attach profile metadata for students and faculty
    if user.get("role") == "STUDENT":
        user["semester"] = user.get("semester") or 5
        user["class_section"] = user.get("class_section") or "Class 3A"
        user["program"] = "B.Tech AI & Data Science"
    elif user.get("role") == "FACULTY":
        user["assigned_classes"] = ["Class 3A", "Class 3B", "Class 2A"]
        user["department"] = "AI & Data Science"

    return {
        "success": True,
        "message": f"Successfully logged in as {user['role']}",
        "user": user,
    }


@router.get("/demo-users", summary="Retrieve standard sample users for all roles")
def get_demo_users() -> dict[str, Any]:
    with engine.connect() as conn:
        query = text("""
            SELECT user_id, name, email, role, semester, class_section
            FROM users
            WHERE email IN ('student@univ.edu', 'priya@univ.edu', 'faculty@univ.edu', 'admin@univ.edu')
            ORDER BY user_id ASC
        """)
        results = [dict(r._mapping) for r in conn.execute(query)]

    demo_list = results or [
        {"user_id": 1, "name": "Arunn Reddy", "email": "student@univ.edu", "role": "STUDENT", "semester": 5, "class_section": "Class 3A"},
        {"user_id": 7, "name": "Priya Patel", "email": "priya@univ.edu", "role": "STUDENT", "semester": 3, "class_section": "Class 2A"},
        {"user_id": 2, "name": "Dr. A. Sharma", "email": "faculty@univ.edu", "role": "FACULTY", "semester": None, "class_section": None},
        {"user_id": 3, "name": "Dean Academics", "email": "admin@univ.edu", "role": "ADMIN", "semester": None, "class_section": None},
    ]

    for u in demo_list:
        if u.get("role") == "STUDENT":
            u["semester"] = u.get("semester") or 5
            u["class_section"] = u.get("class_section") or "Class 3A"
            u["program"] = "B.Tech AI & Data Science"
        elif u.get("role") == "FACULTY":
            u["assigned_classes"] = ["Class 3A", "Class 3B", "Class 2A"]

    return {
        "demo_accounts": demo_list
    }
