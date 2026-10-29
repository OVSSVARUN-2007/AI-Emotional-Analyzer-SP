from pydantic import BaseModel, EmailStr, Field
from typing import Optional


class LoginRequest(BaseModel):
    email: str = Field(..., description="User university email address")
    password: Optional[str] = Field(default="pass123", description="User password")
    role: Optional[str] = Field(default=None, description="User role (STUDENT, FACULTY, ADMIN)")
    name: Optional[str] = Field(default=None, description="Full name of user")


class UserResponse(BaseModel):
    user_id: int
    student_id: Optional[int] = None
    name: str
    email: str
    role: str
    is_active: bool
    semester: Optional[int] = None
    class_section: Optional[str] = None
    assigned_classes: Optional[list[str]] = None
    program: Optional[str] = None
