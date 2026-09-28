from fastapi import APIRouter, HTTPException
from sqlalchemy import text

from app.database.connection import engine
from app.schemas.feedback import FeedbackCreate
from app.services.ai_service import analyze_feedback

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
        ORDER BY feedback_id DESC
    """)

    with engine.connect() as connection:
        result = connection.execute(query)
        feedback = [dict(row._mapping) for row in result]

    return {
        "count": len(feedback),
        "feedback": feedback,
    }


@router.get("/{feedback_id}")
def get_feedback_by_id(feedback_id: int):
    feedback_query = text("""
        SELECT
            feedback_id,
            student_id,
            offering_id,
            feedback_text,
            submitted_at,
            status,
            is_anonymous
        FROM feedback
        WHERE feedback_id = :feedback_id
    """)

    prediction_query = text("""
        SELECT
            prediction_id,
            feedback_id,
            model_version_id,
            sentiment,
            sentiment_confidence,
            emotion,
            emotion_confidence,
            predicted_at
        FROM predictions
        WHERE feedback_id = :feedback_id
        ORDER BY prediction_id DESC
        LIMIT 1
    """)

    aspects_query = text("""
        SELECT
            aspect_id,
            feedback_id,
            aspect,
            aspect_sentiment,
            confidence
        FROM feedback_aspects
        WHERE feedback_id = :feedback_id
        ORDER BY aspect_id
    """)

    with engine.connect() as connection:
        feedback_result = connection.execute(
            feedback_query,
            {"feedback_id": feedback_id},
        ).fetchone()

        if feedback_result is None:
            raise HTTPException(
                status_code=404,
                detail="Feedback not found",
            )

        try:
            prediction_result = connection.execute(
                prediction_query,
                {"feedback_id": feedback_id},
            ).fetchone()
        except Exception:
            prediction_result = None

        try:
            aspect_result = connection.execute(
                aspects_query,
                {"feedback_id": feedback_id},
            )
            aspects = [dict(row._mapping) for row in aspect_result]
        except Exception:
            aspects = []

    return {
        "feedback": dict(feedback_result._mapping),
        "prediction": (
            dict(prediction_result._mapping)
            if prediction_result
            else None
        ),
        "aspects": aspects,
    }


@router.post("/")
def create_feedback(feedback: FeedbackCreate):
    # 1. Save the feedback
    insert_feedback_query = text("""
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
    """)

    with engine.begin() as connection:
        result = connection.execute(
            insert_feedback_query,
            {
                "student_id": feedback.student_id or 1,
                "offering_id": feedback.offering_id or 1,
                "feedback_text": feedback.feedback_text,
                "is_anonymous": 1 if feedback.is_anonymous else 0,
            },
        )
        try:
            feedback_id = getattr(result, "lastrowid", None)
        except Exception:
            feedback_id = None

        if not feedback_id:
            try:
                last_id_res = connection.execute(text("SELECT MAX(feedback_id) FROM feedback")).scalar()
                feedback_id = last_id_res or 1
            except Exception:
                feedback_id = 1


    # 2. Analyze the feedback using AI
    try:
        analysis = analyze_feedback(feedback.feedback_text)

        sentiment = analysis.get("sentiment", {})
        emotion = analysis.get("emotion", {})

        sentiment_label = sentiment.get("label")
        sentiment_confidence = sentiment.get("confidence")

        emotion_label = emotion.get("label")
        emotion_confidence = emotion.get("confidence")

        # 3. Get model version id safely
        model_version_id = 1
        try:
            model_version_query = text("""
                SELECT model_version_id
                FROM model_versions
                WHERE is_active = TRUE
                ORDER BY model_version_id DESC
                LIMIT 1
            """)
            with engine.connect() as connection:
                mv_res = connection.execute(model_version_query).fetchone()
                if mv_res:
                    model_version_id = mv_res[0]
        except Exception:
            model_version_id = 1

        # 4. Save predictions & aspects
        insert_prediction_query = text("""
            INSERT INTO predictions (
                feedback_id,
                model_version_id,
                sentiment,
                sentiment_confidence,
                emotion,
                emotion_confidence
            )
            VALUES (
                :feedback_id,
                :model_version_id,
                :sentiment,
                :sentiment_confidence,
                :emotion,
                :emotion_confidence
            )
        """)

        insert_aspect_query = text("""
            INSERT INTO feedback_aspects (
                feedback_id,
                aspect,
                aspect_sentiment,
                confidence
            )
            VALUES (
                :feedback_id,
                :aspect,
                :aspect_sentiment,
                :confidence
            )
        """)

        update_status_query = text("""
            UPDATE feedback
            SET status = 'ANALYZED'
            WHERE feedback_id = :feedback_id
        """)

        with engine.begin() as connection:
            connection.execute(
                insert_prediction_query,
                {
                    "feedback_id": feedback_id,
                    "model_version_id": model_version_id,
                    "sentiment": (
                        sentiment_label.upper()
                        if sentiment_label
                        else "NEUTRAL"
                    ),
                    "sentiment_confidence": sentiment_confidence,
                    "emotion": emotion_label,
                    "emotion_confidence": emotion_confidence,
                },
            )

            for aspect in analysis.get("aspects", []):
                connection.execute(
                    insert_aspect_query,
                    {
                        "feedback_id": feedback_id,
                        "aspect": aspect.get("topic"),
                        "aspect_sentiment": (
                            aspect.get("sentiment", "").upper()
                            if aspect.get("sentiment")
                            else None
                        ),
                        "confidence": aspect.get("confidence"),
                    },
                )

            connection.execute(
                update_status_query,
                {"feedback_id": feedback_id},
            )

        return {
            "message": "Feedback submitted and analyzed successfully",
            "feedback": {
                "feedback_id": feedback_id,
                "student_id": feedback.student_id or 1,
                "offering_id": feedback.offering_id or 1,
                "feedback_text": feedback.feedback_text,
                "status": "ANALYZED",
                "is_anonymous": feedback.is_anonymous,
            },
            "analysis": analysis,
        }

    except Exception as error:
        update_failed_query = text("""
            UPDATE feedback
            SET status = 'FAILED'
            WHERE feedback_id = :feedback_id
        """)

        with engine.begin() as connection:
            connection.execute(
                update_failed_query,
                {"feedback_id": feedback_id},
            )

        return {
            "message": "Feedback submitted, but AI analysis failed",
            "feedback_id": feedback_id,
            "status": "FAILED",
            "error": str(error),
        }