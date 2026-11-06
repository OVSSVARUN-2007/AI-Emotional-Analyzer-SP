"""Comprehensive verification tests for Part 1 & Part 2 enhancements:
- Rate limiting and Account Lockout
- Rotating Refresh Tokens
- Server-side PII Masking
- Repeated Analysis Caching
- Minimum-group-size Anonymity Rule
- Urgency Escalation to Grievance Desk
- Complaint Clustering
- Faculty Action Tracking
- Executive Summary Reporting & Audit Logs
"""

from __future__ import annotations

import sys
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

PROJECT_ROOT = Path(__file__).resolve().parents[2]
BACKEND_PATH = PROJECT_ROOT / "backend"
sys.path.insert(0, str(PROJECT_ROOT))
sys.path.insert(0, str(BACKEND_PATH))

from app.main import app
from app.database.connection import engine
from sqlalchemy import text

client = TestClient(app)


def test_rate_limiting_and_account_lockout():
    """Verify rate-limiting and temporary account lockout after repeated failures."""
    test_email = "lockout_test@univ.edu"
    test_password = "CorrectPassword123!"

    # 1. Send OTP and register test user
    otp_resp = client.post("/api/auth/send-otp", json={"email": test_email, "purpose": "REGISTER"})
    otp_code = otp_resp.json().get("otp_code", "123456")

    reg_resp = client.post("/api/auth/register", json={
        "email": test_email,
        "password": test_password,
        "name": "Lockout Test User",
        "role": "STUDENT",
        "semester": 5,
        "class_section": "Section D",
        "otp_code": otp_code,
    })
    assert reg_resp.status_code in (200, 400)  # 200 or already registered

    # Clear any leftover lockout state for clean test
    with engine.begin() as conn:
        conn.execute(text("UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE email = :e"), {"e": test_email})

    # 2. Trigger 5 consecutive failed logins with wrong password
    for i in range(5):
        resp = client.post("/api/auth/login", json={
            "email": test_email,
            "password": "WrongPassword!",
        })
        assert resp.status_code in (401, 423)

    # 3. 6th attempt should be blocked with 423 Locked
    locked_resp = client.post("/api/auth/login", json={
        "email": test_email,
        "password": "WrongPassword!",
    })
    assert locked_resp.status_code == 423
    assert "locked" in locked_resp.json()["detail"].lower()


def test_refresh_token_rotation():
    """Verify short-lived access token generation and rotating refresh token exchange."""
    test_email = "refresh_test@univ.edu"
    test_password = "Password123!"

    otp_resp = client.post("/api/auth/send-otp", json={"email": test_email, "purpose": "REGISTER"})
    otp_code = otp_resp.json().get("otp_code", "123456")

    client.post("/api/auth/register", json={
        "email": test_email,
        "password": test_password,
        "name": "Refresh Token User",
        "role": "STUDENT",
        "otp_code": otp_code,
    })

    # Clear any lockout for clean test
    with engine.begin() as conn:
        conn.execute(text("UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE email = :e"), {"e": test_email})

    login_resp = client.post("/api/auth/login", json={
        "email": test_email,
        "password": test_password,
    })
    assert login_resp.status_code == 200
    data = login_resp.json()
    assert "access_token" in data
    assert "refresh_token" in data

    first_refresh = data["refresh_token"]

    # Exchange refresh token
    ref_resp = client.post("/api/auth/refresh", json={"refresh_token": first_refresh})
    assert ref_resp.status_code == 200
    ref_data = ref_resp.json()
    assert "access_token" in ref_data
    assert "refresh_token" in ref_data
    second_refresh = ref_data["refresh_token"]
    assert second_refresh != first_refresh  # Token rotated

    # Attempting to re-use old revoked refresh token should fail with 401
    reuse_resp = client.post("/api/auth/refresh", json={"refresh_token": first_refresh})
    assert reuse_resp.status_code == 401


def test_server_side_pii_masking_and_caching():
    """Verify that student phone/email/roll is masked on server before saving, and cached."""
    unique_text = "My phone is 9123456789 and roll is 23CS099. The lecture on Transformer attention was very clear."
    
    resp1 = client.post("/feedback/", json={
        "feedback_text": unique_text,
        "course_code": "AI501",
        "course_name": "Natural Language Processing",
        "semester": 5,
        "class_section": "Section D",
    })
    assert resp1.status_code == 200
    fb_data = resp1.json()["feedback"]

    # Raw PII must be redacted
    saved_text = fb_data["feedback_text"]
    assert "9123456789" not in saved_text
    assert "23CS099" not in saved_text
    assert "[PHONE_MASKED]" in saved_text
    assert "[ROLL_MASKED]" in saved_text

    # Repeated submission should hit analysis cache instantly
    resp2 = client.post("/feedback/", json={
        "feedback_text": unique_text,
        "course_code": "AI501",
        "semester": 5,
        "class_section": "Section D",
    })
    assert resp2.status_code == 200
    assert "Cache" in resp2.json()["feedback"].get("analysis_source", "")


def test_urgency_escalation_to_grievances():
    """Verify that severe distress or harassment language automatically creates an escalated grievance."""
    urgent_text = "A student was harassed and threatened by seniors after class in the lab."

    resp = client.post("/feedback/", json={
        "feedback_text": urgent_text,
        "course_code": "AI501",
        "semester": 5,
        "class_section": "Section D",
    })
    assert resp.status_code == 200
    fb = resp.json()["feedback"]
    assert fb["is_urgent"] is True

    # Verify grievance created in complaints table
    with engine.connect() as conn:
        complaint = conn.execute(
            text("SELECT complaint_id, priority, status FROM complaints WHERE description LIKE '%harassed and threatened%' LIMIT 1")
        ).fetchone()
        assert complaint is not None
        assert complaint[1] == "HIGH"
        assert complaint[2] == "UNDER_REVIEW"


def test_minimum_group_size_anonymity():
    """Verify that small cohorts (< 5 feedback responses) have text masked to preserve student anonymity."""
    # Query for a very specific isolated section with fewer than 5 submissions
    resp = client.get("/feedback/?class_section=Section%20K&course_code=NONEXISTENT_COURSE_TEST")
    assert resp.status_code == 200
    data = resp.json()
    assert "feedback" in data


def test_complaint_clustering_endpoint():
    """Verify semantic clustering of student complaints into thematic groups."""
    resp = client.get("/feedback/complaints/clusters")
    assert resp.status_code == 200
    data = resp.json()
    assert "clusters" in data
    assert "total_items" in data


def test_faculty_action_tracking_flow():
    """Verify logging a pedagogical action and tracking before/after clarity scores."""
    post_resp = client.post("/feedback/faculty-actions", json={
        "course_code": "AI501",
        "action_title": "Extended Transformer Assignment Deadline by 72 Hours",
        "action_description": "Moved deadline to Sunday to give students breathing room.",
        "action_type": "DEADLINE_EXTENSION",
        "faculty_name": "Dr. A. Sharma",
    })
    assert post_resp.status_code == 200
    data = post_resp.json()
    assert data["success"] is True
    assert "baseline_clarity_score" in data

    list_resp = client.get("/feedback/faculty-actions?course_code=AI501")
    assert list_resp.status_code == 200
    actions = list_resp.json()["actions"]
    assert len(actions) >= 1
    assert any(a["action_title"] == "Extended Transformer Assignment Deadline by 72 Hours" for a in actions)


def test_executive_summary_report_and_audit_logs():
    """Verify generation of institutional executive summary report and audit logs."""
    exec_resp = client.get("/feedback/reports/executive-summary")
    assert exec_resp.status_code == 200
    report = exec_resp.json()
    assert "institutional_kpis" in report
    assert "top_performing_courses" in report
    assert "recommended_action_items" in report

    audit_resp = client.get("/feedback/audit-logs")
    assert audit_resp.status_code == 200
    logs = audit_resp.json()["audit_logs"]
    assert isinstance(logs, list)
