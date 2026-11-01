from pydantic import BaseModel, Field
from typing import Optional, Any


class FeedbackCreate(BaseModel):
    student_id: int = 1
    offering_id: int = 1
    feedback_text: str = Field(min_length=1)
    is_anonymous: bool = True
    semester: Optional[int] = 5
    class_section: Optional[str] = "Class 3A"
    course_code: Optional[str] = None
    course_name: Optional[str] = None
    slide_image_base64: Optional[str] = None
    slide_name: Optional[str] = None
    acoustic_prosody: Optional[dict[str, Any]] = None
    facial_emotion: Optional[str] = None
    difficulty_rating: Optional[int] = 3
    language_hint: Optional[str] = "auto"


class RemedialPlanRequest(BaseModel):
    course_code: str
    course_name: str
    topic: str
    confusion_rate: Optional[float] = 0.45


class ClarificationBroadcastCreate(BaseModel):
    course_code: str
    course_name: Optional[str] = "Course"
    topic: str
    faculty_name: Optional[str] = "Dr. A. Sharma"
    title: Optional[str] = None
    message: Optional[str] = None
    clarification_text: Optional[str] = None
    reference_url: Optional[str] = None
    remedial_links: Optional[str] = None
    target_section: Optional[str] = "ALL"


class CommunityPostCreate(BaseModel):
    title: str
    content: str
    category: Optional[str] = "Academics & Teaching"
    class_section: Optional[str] = "Class 3A"
    author_name: Optional[str] = "Anonymous Student"
    is_anonymous: Optional[bool] = True


class WebhookConfigUpdate(BaseModel):
    service_name: Optional[str] = "Slack"
    platform: Optional[str] = "SLACK"
    webhook_url: str
    trigger_on: Optional[str] = "CRITICAL_ONLY"
    enabled: Optional[bool] = True
    is_enabled: Optional[bool] = True
    notify_critical_distress: Optional[bool] = True
    notify_weekly_digest: Optional[bool] = True


class StudyPodCreate(BaseModel):
    course_code: str
    topic: str
    pod_name: Optional[str] = None
    course_name: Optional[str] = None
    description: Optional[str] = None
    max_members: Optional[int] = 4
    meeting_link: Optional[str] = None


# ═══════════════════════════════════════════════════════════
# ACADEMIC ENTITY SCHEMAS: SEMESTERS, COURSES, LECTURES, OFFERINGS
# ═══════════════════════════════════════════════════════════

class SemesterCreate(BaseModel):
    semester_number: int
    term_name: str
    academic_year: Optional[str] = "2026-2027"
    is_active: Optional[bool] = False
    start_date: Optional[str] = None
    end_date: Optional[str] = None


class SemesterUpdate(BaseModel):
    term_name: Optional[str] = None
    academic_year: Optional[str] = None
    is_active: Optional[bool] = None


class CourseCreate(BaseModel):
    course_code: str
    course_name: str
    credits: Optional[int] = 4
    semester: int
    department_name: Optional[str] = "AI & Data Science"
    program: Optional[str] = "B.Tech"
    course_type: Optional[str] = "Core"
    syllabus_summary: Optional[str] = None
    faculty_name: Optional[str] = None
    class_section: Optional[str] = None


class CourseUpdate(BaseModel):
    course_name: Optional[str] = None
    credits: Optional[int] = None
    semester: Optional[int] = None
    department_name: Optional[str] = None
    program: Optional[str] = None
    course_type: Optional[str] = None
    syllabus_summary: Optional[str] = None


class OfferingCreate(BaseModel):
    course_id: Optional[int] = None
    course_code: Optional[str] = None
    faculty_name: str
    class_section: str
    semester: int
    term_name: Optional[str] = "Fall 2026"


class LectureCreate(BaseModel):
    course_code: str
    course_name: Optional[str] = None
    faculty_name: str
    class_section: str
    semester: int
    day_of_week: str
    start_time: str
    end_time: str
    room_number: Optional[str] = "Hall 301"
    topic: str
    lecture_type: Optional[str] = "Theory"
    status: Optional[str] = "SCHEDULED"


class LectureUpdate(BaseModel):
    status: Optional[str] = None
    topic: Optional[str] = None
    room_number: Optional[str] = None
    day_of_week: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    faculty_name: Optional[str] = None


class StudentEnrollRequest(BaseModel):
    student_id: Optional[int] = None
    course_id: Optional[int] = None
    course_code: Optional[str] = None
    semester: int
    enrollment_type: Optional[str] = "Elective"
