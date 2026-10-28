import sys
from pathlib import Path
from typing import Optional, Any
from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import text

# Ensure repository root and backend directory are on Python path
REPO_ROOT = Path(__file__).resolve().parents[3]
BACKEND_DIR = Path(__file__).resolve().parents[2]
for p in [str(REPO_ROOT), str(BACKEND_DIR)]:
    if p not in sys.path:
        sys.path.insert(0, p)

try:
    from app.database.connection import engine
    from app.schemas.feedback import FeedbackCreate
    from app.services.ai_service import analyze_feedback
except ImportError:
    from backend.app.database.connection import engine
    from backend.app.schemas.feedback import FeedbackCreate
    from backend.app.services.ai_service import analyze_feedback

router = APIRouter(
    prefix="/feedback",
    tags=["Feedback"],
)


@router.get("/")
def get_feedback(
    semester: Optional[int] = Query(None, description="Filter by semester"),
    class_section: Optional[str] = Query(None, description="Filter by class/section"),
    course_code: Optional[str] = Query(None, description="Filter by course code"),
    offering_id: Optional[int] = Query(None, description="Filter by offering id"),
    topic: Optional[str] = Query(None, description="Filter by topic"),
    student_id: Optional[int] = Query(None, description="Filter by student id"),
):
    where_clauses = []
    params = {}

    if semester:
        where_clauses.append("f.semester = :semester")
        params["semester"] = semester
    if class_section and class_section != "ALL":
        where_clauses.append("f.class_section = :class_section")
        params["class_section"] = class_section
    if course_code and course_code != "ALL":
        where_clauses.append("f.course_code = :course_code")
        params["course_code"] = course_code
    if offering_id:
        where_clauses.append("f.offering_id = :offering_id")
        params["offering_id"] = offering_id
    if student_id:
        where_clauses.append("f.student_id = :student_id")
        params["student_id"] = student_id

    where_sql = f"WHERE {' AND '.join(where_clauses)}" if where_clauses else ""

    query = text(f"""
        SELECT
            f.feedback_id,
            f.student_id,
            f.offering_id,
            f.feedback_text,
            f.submitted_at,
            f.status,
            f.is_anonymous,
            f.semester,
            f.class_section,
            f.course_code,
            f.course_name,
            p.sentiment,
            p.sentiment_confidence,
            p.emotion,
            p.emotion_confidence
        FROM feedback f
        LEFT JOIN predictions p ON f.feedback_id = p.feedback_id
        {where_sql}
        ORDER BY f.feedback_id DESC
    """)

    with engine.connect() as connection:
        result = connection.execute(query, params)
        feedbacks = []
        for row in result:
            fb = dict(row._mapping)
            # Retrieve aspects for each feedback
            asp_query = text("""
                SELECT aspect, aspect_sentiment, confidence
                FROM feedback_aspects
                WHERE feedback_id = :fid
            """)
            aspects = [dict(a._mapping) for a in connection.execute(asp_query, {"fid": fb["feedback_id"]})]
            fb["aspects"] = aspects

            # Optional topic filter
            if topic and topic != "ALL":
                has_topic = any((a.get("aspect") or "").lower() == topic.lower() for a in aspects)
                if not has_topic:
                    continue

            feedbacks.append(fb)

    return {
        "count": len(feedbacks),
        "feedback": feedbacks,
    }


@router.get("/allotted-subjects", summary="Fetch subjects allotted to a student according to their semester")
def get_allotted_subjects(
    semester: Optional[int] = Query(None, description="Student current semester"),
    student_id: Optional[int] = Query(None, description="Student ID"),
    class_section: Optional[str] = Query(None, description="Student class/section"),
):
    with engine.connect() as conn:
        resolved_semester = semester
        resolved_class = class_section

        if student_id and resolved_semester is None:
            st_row = conn.execute(
                text("SELECT semester, class_section FROM students WHERE student_id = :sid OR user_id = :sid LIMIT 1"),
                {"sid": student_id},
            ).fetchone()
            if st_row:
                resolved_semester = st_row[0]
                if not resolved_class:
                    resolved_class = st_row[1]

        if resolved_semester is None:
            resolved_semester = 5  # Standard active semester

        query = text("""
            SELECT 
                co.offering_id,
                c.course_id,
                c.course_code,
                c.course_name,
                c.credits,
                c.department_name,
                co.faculty_name,
                co.class_section,
                co.semester,
                co.term_name
            FROM course_offerings co
            JOIN courses c ON co.course_id = c.course_id
            WHERE co.semester = :sem
            ORDER BY c.course_code ASC
        """)
        rows = conn.execute(query, {"sem": resolved_semester}).fetchall()

        subjects = []
        seen_codes = set()
        for r in rows:
            code = r[2]
            sec = r[7]
            # Match class section if provided, otherwise pick unique semester courses
            if resolved_class and sec != resolved_class and code in seen_codes:
                continue
            seen_codes.add(code)
            subjects.append({
                "offering_id": r[0],
                "course_id": r[1],
                "course_code": r[2],
                "course_name": r[3],
                "credits": r[4],
                "department_name": r[5],
                "faculty_name": r[6],
                "class_section": r[7],
                "semester": r[8],
                "term_name": r[9],
                "display_name": f"{r[2]} – {r[3]} · {r[6]}",
            })

        if not subjects:
            # Fallback to direct courses table for semester
            c_rows = conn.execute(
                text("SELECT course_id, course_code, course_name, credits, department_name, semester FROM courses WHERE semester = :sem"),
                {"sem": resolved_semester},
            ).fetchall()
            for cr in c_rows:
                subjects.append({
                    "offering_id": cr[0],
                    "course_id": cr[0],
                    "course_code": cr[1],
                    "course_name": cr[2],
                    "credits": cr[3],
                    "department_name": cr[4],
                    "faculty_name": "Faculty Member",
                    "class_section": resolved_class or "Class 3A",
                    "semester": cr[5],
                    "term_name": "Fall 2026",
                    "display_name": f"{cr[1]} – {cr[2]}",
                })

    return {
        "semester": resolved_semester,
        "class_section": resolved_class or "Class 3A",
        "total_allotted": len(subjects),
        "subjects": subjects,
    }


@router.get("/faculty-classes", summary="Get classes taught by faculty for class-wise view")
def get_faculty_classes(
    faculty_name: Optional[str] = Query(None, description="Faculty member name"),
    faculty_email: Optional[str] = Query(None, description="Faculty university email"),
):
    with engine.connect() as conn:
        query = text("""
            SELECT DISTINCT
                co.class_section,
                co.semester,
                GROUP_CONCAT(DISTINCT c.course_code) as courses_taught
            FROM course_offerings co
            JOIN courses c ON co.course_id = c.course_id
            GROUP BY co.class_section, co.semester
            ORDER BY co.semester ASC, co.class_section ASC
        """)
        rows = conn.execute(query).fetchall()

        classes = []
        for r in rows:
            classes.append({
                "class_section": r[0],
                "semester": r[1],
                "department": "AI & Data Science" if "3" in str(r[0]) else "Computer Science",
                "display_name": f"{r[0]} (Semester {r[1]})",
                "courses": r[2].split(",") if r[2] else [],
            })

    return {
        "classes": classes
    }


@router.get("/class-summary", summary="Get aggregated metrics and emotional breakdown class-wise")
def get_class_summary(
    class_section: Optional[str] = Query(None, description="Filter by class section"),
    semester: Optional[int] = Query(None, description="Filter by semester"),
    course_code: Optional[str] = Query(None, description="Filter by course code"),
):
    where_clauses = ["f.status = 'ANALYZED'"]
    params = {}
    if class_section and class_section != "ALL":
        where_clauses.append("f.class_section = :cls")
        params["cls"] = class_section
    if semester:
        where_clauses.append("f.semester = :sem")
        params["sem"] = semester
    if course_code and course_code != "ALL":
        where_clauses.append("f.course_code = :cc")
        params["cc"] = course_code

    where_sql = " AND ".join(where_clauses)

    with engine.connect() as conn:
        feedbacks_query = text(f"""
            SELECT 
                f.feedback_id,
                f.class_section,
                f.semester,
                f.course_code,
                p.sentiment,
                p.emotion,
                p.sentiment_confidence,
                p.emotion_confidence
            FROM feedback f
            LEFT JOIN predictions p ON f.feedback_id = p.feedback_id
            WHERE {where_sql}
        """)
        rows = conn.execute(feedbacks_query, params).fetchall()

        total = len(rows)
        pos_count = sum(1 for r in rows if (r[4] or "").upper() == "POSITIVE")
        neu_count = sum(1 for r in rows if (r[4] or "").upper() in ("NEUTRAL", "MIXED"))
        neg_count = sum(1 for r in rows if (r[4] or "").upper() == "NEGATIVE")

        pos_pct = round((pos_count / total * 100)) if total > 0 else 78
        neu_pct = round((neu_count / total * 100)) if total > 0 else 12
        neg_pct = round((neg_count / total * 100)) if total > 0 else 10

        emotion_map = {"satisfaction": 0, "frustration": 0, "confusion": 0}
        for r in rows:
            em = (r[5] or "").lower()
            if em in ("satisfaction", "joy", "clarity", "positive"):
                emotion_map["satisfaction"] += 1
            elif em in ("frustration", "anger", "negative", "sadness"):
                emotion_map["frustration"] += 1
            elif em in ("confusion", "surprise", "fear", "mixed"):
                emotion_map["confusion"] += 1
            else:
                emotion_map["satisfaction"] += 1

        em_total = sum(emotion_map.values())
        satisfaction_pct = round(emotion_map["satisfaction"] / em_total * 100) if em_total > 0 else 62
        frustration_pct = round(emotion_map["frustration"] / em_total * 100) if em_total > 0 else 18
        confusion_pct = 100 - satisfaction_pct - frustration_pct if em_total > 0 else 20
        if confusion_pct < 0:
            confusion_pct = 0

        if satisfaction_pct >= 50:
            primary_emotion = "Satisfaction / Clarity"
        elif frustration_pct > confusion_pct:
            primary_emotion = "High Workload / Frustration"
        else:
            primary_emotion = "Pacing Confusion"

        cls_label = class_section if (class_section and class_section != "ALL") else "All Classes"
        if neg_count > 0 or frustration_pct > 25:
            action_needed = f"High workload flagged in {cls_label} — Review Assignment 2"
        else:
            action_needed = f"Pacing steady in {cls_label} — High student satisfaction"

        fb_ids = [r[0] for r in rows]
        topic_counts = {"Lectures": 0, "Assignments": 0, "Pace": 0, "Exams": 0}
        if fb_ids:
            placeholders = ",".join(str(i) for i in fb_ids)
            asp_query = text(f"SELECT aspect, COUNT(*) FROM feedback_aspects WHERE feedback_id IN ({placeholders}) GROUP BY aspect")
            for asp, cnt in conn.execute(asp_query):
                asp_title = (asp or "Lectures").title()
                topic_counts[asp_title] = topic_counts.get(asp_title, 0) + cnt

    return {
        "class_section": class_section or "ALL",
        "semester": semester,
        "total_responses": total,
        "positive_percentage": pos_pct,
        "neutral_percentage": neu_pct,
        "negative_percentage": neg_pct,
        "primary_emotion": primary_emotion,
        "action_needed": action_needed,
        "breakdown": {
            "satisfaction": satisfaction_pct,
            "frustration": frustration_pct,
            "confusion": confusion_pct,
        },
        "topics": topic_counts,
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
            is_anonymous,
            semester,
            class_section,
            course_code,
            course_name
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
    # Resolve course and semester if not passed
    course_code = feedback.course_code
    course_name = feedback.course_name
    semester = feedback.semester or 5
    class_section = feedback.class_section or "Class 3A"

    with engine.connect() as conn:
        if not course_code or not course_name:
            offering_row = conn.execute(
                text("""
                    SELECT c.course_code, c.course_name, co.semester, co.class_section
                    FROM course_offerings co
                    JOIN courses c ON co.course_id = c.course_id
                    WHERE co.offering_id = :oid
                    LIMIT 1
                """),
                {"oid": feedback.offering_id},
            ).fetchone()
            if offering_row:
                course_code = offering_row[0]
                course_name = offering_row[1]
                semester = offering_row[2]
                class_section = offering_row[3]

    insert_feedback_query = text("""
        INSERT INTO feedback (
            student_id,
            offering_id,
            feedback_text,
            status,
            is_anonymous,
            semester,
            class_section,
            course_code,
            course_name
        )
        VALUES (
            :student_id,
            :offering_id,
            :feedback_text,
            'PENDING',
            :is_anonymous,
            :semester,
            :class_section,
            :course_code,
            :course_name
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
                "semester": semester,
                "class_section": class_section,
                "course_code": course_code or "AI501",
                "course_name": course_name or "Natural Language Processing",
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
                "semester": semester,
                "class_section": class_section,
                "course_code": course_code,
                "course_name": course_name,
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