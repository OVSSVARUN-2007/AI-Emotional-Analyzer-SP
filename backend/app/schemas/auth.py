from pydantic import BaseModel, Field
from typing import Optional, Any


class LoginRequest(BaseModel):
    email: str = Field(..., description="User university email address or Roll Number")
    password: str = Field(..., description="User password")
    role: Optional[str] = Field(default=None, description="Optional requested role hint")
    name: Optional[str] = Field(default=None, description="Optional display name hint")


class SendOtpRequest(BaseModel):
    email: str = Field(..., description="University email address to receive verification OTP")
    purpose: str = Field(default="REGISTER", description="Purpose of OTP ('REGISTER', 'RESET_PASSWORD')")


class VerifyOtpRequest(BaseModel):
    email: str = Field(..., description="University email address")
    otp_code: str = Field(..., description="6-digit verification code")


class ResetPasswordRequest(BaseModel):
    email: str = Field(..., description="University email address or Roll Number")
    otp_code: str = Field(..., description="6-digit verification code")
    new_password: str = Field(..., min_length=4, description="New password")


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(..., description="Current password")
    new_password: str = Field(..., min_length=4, description="New password")


class UpdateProfileRequest(BaseModel):
    name: Optional[str] = Field(default=None, description="Updated full name")
    roll_no: Optional[str] = Field(default=None, description="Updated roll number / staff ID")
    email: Optional[str] = Field(default=None, description="Updated email address")
    semester: Optional[int] = Field(default=None, description="Updated semester")
    class_section: Optional[str] = Field(default=None, description="Updated class section")
    department: Optional[str] = Field(default=None, description="Academic department")
    phone: Optional[str] = Field(default=None, description="Mobile / WhatsApp number")
    emergency_contact: Optional[str] = Field(default=None, description="Emergency contact phone number")
    bio: Optional[str] = Field(default=None, description="Academic interests or research focus")
    designation: Optional[str] = Field(default=None, description="Faculty designation / title")
    role: Optional[str] = Field(default=None, description="User role ('STUDENT', 'FACULTY', 'ADMIN')")
    old_password: Optional[str] = Field(default=None, description="Current password")
    current_password: Optional[str] = Field(default=None, description="Current password if changing password")
    new_password: Optional[str] = Field(default=None, min_length=4, description="New password if updating password")


class RegisterRequest(BaseModel):
    name: str = Field(..., description="Full Name of the student or faculty member")
    roll_no: Optional[str] = Field(default=None, description="University Roll Number or Staff ID")
    email: str = Field(..., description="University email address")
    password: str = Field(..., min_length=4, description="Account password")
    role: str = Field(default="STUDENT", description="Role: 'STUDENT', 'ADMIN', or 'FACULTY'")
    semester: Optional[int] = Field(default=5, description="Academic semester for students")
    class_section: Optional[str] = Field(default="Section A", description="Enrolled class section")
    otp_code: str = Field(..., description="6-digit verification OTP received via email")


class GeminiConfigPayload(BaseModel):
    gemini_api_key: str = Field(..., description="Google Gemini API Key (starts with AIzaSy...)")
    model_name: Optional[str] = Field(default="gemini-1.5-flash", description="Gemini model identifier")


class UserResponse(BaseModel):
    user_id: int
    student_id: Optional[int] = None
    name: str
    roll_no: Optional[str] = None
    email: str
    role: str
    is_active: bool
    is_verified: Optional[bool] = True
    semester: Optional[int] = None
    class_section: Optional[str] = None
    department: Optional[str] = None
    phone: Optional[str] = None
    bio: Optional[str] = None
    assigned_classes: Optional[list[str]] = None
    program: Optional[str] = None
    profile_completion_pct: Optional[int] = 100
    missing_fields: Optional[list[str]] = None
    is_profile_complete: Optional[bool] = True


class TokenResponse(BaseModel):
    success: bool = True
    access_token: str
    token_type: str = "bearer"
    user: dict[str, Any]
