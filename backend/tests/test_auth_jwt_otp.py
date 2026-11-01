"""Tests for OTP registration, JWT authentication, and authorization."""

from __future__ import annotations

import sys
import uuid
from pathlib import Path
from fastapi.testclient import TestClient

PROJECT_ROOT = Path(__file__).resolve().parents[2]
BACKEND_PATH = PROJECT_ROOT / "backend"
sys.path.insert(0, str(PROJECT_ROOT))
sys.path.insert(0, str(BACKEND_PATH))

from app.main import app

client = TestClient(app)


def test_send_otp_success():
    uid = uuid.uuid4().hex[:6]
    resp = client.post("/api/auth/send-otp", json={"email": f"newstudent_{uid}@univ.edu", "purpose": "REGISTER"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    assert "otp_code" in data
    assert len(data["otp_code"]) == 6


def test_register_invalid_otp():
    uid = uuid.uuid4().hex[:6]
    payload = {
        "name": "Kavya Sharma",
        "roll_no": f"2026-AI-{uid}",
        "email": f"kavya_{uid}@univ.edu",
        "password": "strongPassword123",
        "role": "STUDENT",
        "semester": 5,
        "class_section": "Class 3A",
        "otp_code": "000000",
    }
    resp = client.post("/api/auth/register", json=payload)
    assert resp.status_code == 400
    assert "invalid" in resp.json()["detail"].lower()


def test_full_otp_registration_and_login_flow():
    uid = uuid.uuid4().hex[:6]
    test_email = f"student_{uid}@univ.edu"
    test_roll = f"2026-AI-{uid}"
    test_pass = "SecurePass@2026"

    # 1. Request OTP
    otp_resp = client.post("/api/auth/send-otp", json={"email": test_email, "purpose": "REGISTER"})
    assert otp_resp.status_code == 200
    otp = otp_resp.json()["otp_code"]

    # 2. Register
    reg_payload = {
        "name": "Vikram Malhotra",
        "roll_no": test_roll,
        "email": test_email,
        "password": test_pass,
        "role": "STUDENT",
        "semester": 5,
        "class_section": "Class 3A",
        "otp_code": otp,
    }
    reg_resp = client.post("/api/auth/register", json=reg_payload)
    assert reg_resp.status_code == 200
    reg_data = reg_resp.json()
    assert reg_data["success"] is True
    assert "access_token" in reg_data
    assert reg_data["user"]["roll_no"] == test_roll
    assert reg_data["user"]["role"] == "STUDENT"

    token = reg_data["access_token"]

    # 3. Access protected /me route
    me_resp = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_resp.status_code == 200
    me_data = me_resp.json()
    assert me_data["user"]["email"] == test_email
    assert me_data["user"]["roll_no"] == test_roll

    # 4. Login using Email
    login_email_resp = client.post("/api/auth/login", json={"email": test_email, "password": test_pass})
    assert login_email_resp.status_code == 200
    assert "access_token" in login_email_resp.json()

    # 5. Login using Roll Number
    login_roll_resp = client.post("/api/auth/login", json={"email": test_roll, "password": test_pass})
    assert login_roll_resp.status_code == 200
    assert "access_token" in login_roll_resp.json()


def test_admin_registration_with_otp():
    uid = uuid.uuid4().hex[:6]
    admin_email = f"admin_{uid}@univ.edu"
    admin_roll = f"ADM-{uid}"
    admin_pass = "AdminPass#2026"

    otp_resp = client.post("/api/auth/send-otp", json={"email": admin_email, "purpose": "REGISTER"})
    assert otp_resp.status_code == 200
    otp = otp_resp.json()["otp_code"]

    reg_payload = {
        "name": "Prof. S. Sengupta",
        "roll_no": admin_roll,
        "email": admin_email,
        "password": admin_pass,
        "role": "ADMIN",
        "otp_code": otp,
    }
    reg_resp = client.post("/api/auth/register", json=reg_payload)
    assert reg_resp.status_code == 200
    reg_data = reg_resp.json()
    assert reg_data["user"]["role"] == "ADMIN"


def test_gemini_config_endpoint():
    resp = client.get("/api/auth/gemini-config")
    assert resp.status_code == 200
    data = resp.json()
    assert "has_gemini_key" in data
    assert "active_engine" in data


def test_forgot_and_reset_password_flow():
    uid = uuid.uuid4().hex[:6]
    test_email = f"reset_{uid}@univ.edu"
    test_roll = f"ROLL-{uid}"
    orig_pass = "InitialPass123"
    new_pass = "BrandNewSecret999"

    # 1. Register student
    otp_resp = client.post("/api/auth/send-otp", json={"email": test_email, "purpose": "REGISTER"})
    otp = otp_resp.json()["otp_code"]
    client.post("/api/auth/register", json={
        "name": "Reset Test User",
        "roll_no": test_roll,
        "email": test_email,
        "password": orig_pass,
        "role": "STUDENT",
        "otp_code": otp,
    })

    # 2. Request password reset using Roll Number
    reset_otp_resp = client.post("/api/auth/send-otp", json={"email": test_roll, "purpose": "RESET_PASSWORD"})
    assert reset_otp_resp.status_code == 200
    reset_data = reset_otp_resp.json()
    assert reset_data["success"] is True
    assert reset_data["email"] == test_email
    reset_otp = reset_data["otp_code"]

    # 3. Reset password
    reset_resp = client.post("/api/auth/reset-password", json={
        "email": test_roll,
        "otp_code": reset_otp,
        "new_password": new_pass,
    })
    assert reset_resp.status_code == 200
    assert reset_resp.json()["success"] is True

    # 4. Old password should fail
    old_login = client.post("/api/auth/login", json={"email": test_email, "password": orig_pass})
    assert old_login.status_code == 401

    # 5. New password should succeed
    new_login = client.post("/api/auth/login", json={"email": test_email, "password": new_pass})
    assert new_login.status_code == 200
    assert "access_token" in new_login.json()


def test_update_profile_and_change_password():
    uid = uuid.uuid4().hex[:6]
    orig_email = f"user_{uid}@univ.edu"
    updated_email = f"updated_{uid}@univ.edu"
    test_pass = "InitialPass123"
    new_pass = "ChangedPass456"

    # Register
    otp = client.post("/api/auth/send-otp", json={"email": orig_email}).json()["otp_code"]
    reg = client.post("/api/auth/register", json={
        "name": "Original Name",
        "roll_no": f"OLD-{uid}",
        "email": orig_email,
        "password": test_pass,
        "role": "STUDENT",
        "otp_code": otp,
    }).json()
    token = reg["access_token"]

    # Update profile (name, roll_no, email)
    upd_resp = client.post(
        "/api/auth/update-profile",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "name": "Updated Name",
            "roll_no": f"NEW-{uid}",
            "email": updated_email,
            "semester": 7,
            "class_section": "Class 3B",
        },
    )
    assert upd_resp.status_code == 200
    upd_data = upd_resp.json()
    assert upd_data["success"] is True
    assert upd_data["user"]["name"] == "Updated Name"
    assert upd_data["user"]["roll_no"] == f"NEW-{uid}"
    assert upd_data["user"]["email"] == updated_email
    new_token = upd_data["access_token"]

    # Change password
    chg_resp = client.post(
        "/api/auth/change-password",
        headers={"Authorization": f"Bearer {new_token}"},
        json={
            "current_password": test_pass,
            "new_password": new_pass,
        },
    )
    assert chg_resp.status_code == 200

    # Login with updated email and new password
    login_resp = client.post("/api/auth/login", json={"email": updated_email, "password": new_pass})
    assert login_resp.status_code == 200
