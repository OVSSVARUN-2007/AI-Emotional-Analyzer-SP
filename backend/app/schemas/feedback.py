from pydantic import BaseModel, Field
from typing import Optional


class FeedbackCreate(BaseModel):
    student_id: int = 1
    offering_id: int = 1
    feedback_text: str = Field(min_length=1)
    is_anonymous: bool = True
    semester: Optional[int] = 5
    class_section: Optional[str] = "Class 3A"
    course_code: Optional[str] = None
    course_name: Optional[str] = None