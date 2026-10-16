from pydantic import BaseModel, EmailStr, Field
from typing import Optional


class LoginRequest(BaseModel):
    email: str = Field(..., description="User university email address")
    password: Optional[str] = Field(default="pass123", description="User password")


class UserResponse(BaseModel):
    user_id: int
    name: str
    email: str
    role: str
    is_active: bool
    semester: Optional[int] = None
    class_section: Optional[str] = None
    assigned_classes: Optional[list[str]] = None
    program: Optional[str] = None
