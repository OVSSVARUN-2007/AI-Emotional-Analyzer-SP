from fastapi import APIRouter
from sqlalchemy import text

from app.database.connection import engine
from app.schemas.feedback import FeedbackCreate

router = APIRouter(
    prefix="/feedback",
    tags=["Feedback"],
)


@router.get("/")
def get_feedback():
    query = text("""
        SELECT
            feedback_id,
            student_id,
            offering_id,
            feedback_text,
            submitted_at,
            status,
            is_anonymous
        FROM feedback
        ORDER BY submitted_at DESC
    """)

    with engine.connect() as connection:
        result = connection.execute(query)

        feedback = [
            dict(row._mapping)
            for row in result
        ]

    return {
        "count": len(feedback),
        "feedback": feedback,
    }


@router.post("/")
def create_feedback(feedback: FeedbackCreate):
    query = text("""
        INSERT INTO feedback (
            student_id,
            offering_id,
            feedback_text,
            status,
            is_anonymous
        )
        VALUES (
            :student_id,
            :offering_id,
            :feedback_text,
            'PENDING',
            :is_anonymous
        )
        RETURNING
            feedback_id,
            student_id,
            offering_id,
            feedback_text,
            submitted_at,
            status,
            is_anonymous
    """)

    with engine.begin() as connection:
        result = connection.execute(
            query,
            {
                "student_id": feedback.student_id,
                "offering_id": feedback.offering_id,
                "feedback_text": feedback.feedback_text,
                "is_anonymous": feedback.is_anonymous,
            },
        )

        row = result.fetchone()

    return {
        "message": "Feedback submitted successfully",
        "feedback": dict(row._mapping),
    }