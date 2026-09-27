from pydantic import BaseModel, Field


class FeedbackCreate(BaseModel):
    student_id: int
    offering_id: int
    feedback_text: str = Field(min_length=1)
    is_anonymous: bool = True