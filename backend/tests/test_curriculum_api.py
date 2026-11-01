import uuid
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_curriculum_semesters_api():
    # 1. Fetch semesters
    res = client.get("/feedback/semesters")
    assert res.status_code == 200
    data = res.json()
    assert "semesters" in data
    assert len(data["semesters"]) >= 8

    # 2. Add new test semester
    sem_num = 12
    res = client.post("/feedback/semesters", json={
        "semester_number": sem_num,
        "term_name": "Autumn 2028 Test",
        "academic_year": "2028-2029",
        "is_active": False
    })
    # If already exists from earlier test, 200 or 400 is fine
    assert res.status_code in [200, 400]

    # 3. Toggle active status
    res = client.patch(f"/feedback/semesters/{sem_num}", json={"is_active": True})
    assert res.status_code == 200
    assert res.json()["status"] == "SUCCESS"


def test_curriculum_courses_api():
    unique_code = f"CS{uuid.uuid4().hex[:4].upper()}"
    # 1. Create a course
    create_res = client.post("/feedback/courses", json={
        "course_code": unique_code,
        "course_name": "Advanced Quantum ML",
        "credits": 4,
        "semester": 5,
        "department_name": "AI & Data Science",
        "program": "B.Tech",
        "course_type": "Core",
        "syllabus_summary": "Quantum circuits, Variational Algorithms, QNNs",
        "faculty_name": "Dr. Q. Physicist",
        "class_section": "Class 3A"
    })
    assert create_res.status_code == 200
    assert create_res.json()["status"] == "SUCCESS"
    course_id = create_res.json()["course_id"]

    # 2. Get courses
    get_res = client.get("/feedback/courses?semester=5")
    assert get_res.status_code == 200
    courses = get_res.json()["courses"]
    assert any(c["course_code"] == unique_code for c in courses)

    # 3. Update course
    put_res = client.put(f"/feedback/courses/{course_id}", json={
        "course_name": "Quantum Machine Learning (Updated)",
        "credits": 5,
        "course_type": "Professional Elective"
    })
    assert put_res.status_code == 200
    assert put_res.json()["status"] == "SUCCESS"

    # 4. Delete course
    del_res = client.delete(f"/feedback/courses/{course_id}")
    assert del_res.status_code == 200
    assert del_res.json()["status"] == "SUCCESS"


def test_curriculum_lectures_api():
    # 1. Schedule a lecture
    lec_res = client.post("/feedback/lectures", json={
        "course_code": "AI501",
        "course_name": "Natural Language Processing",
        "faculty_name": "Dr. A. Sharma",
        "class_section": "Class 3A",
        "semester": 5,
        "day_of_week": "Friday",
        "start_time": "04:00 PM",
        "end_time": "05:00 PM",
        "room_number": "Lab 4B",
        "topic": "HuggingFace Transformers Live Demo",
        "lecture_type": "Lab",
        "status": "SCHEDULED"
    })
    assert lec_res.status_code == 200
    assert lec_res.json()["status"] == "SUCCESS"
    lecture_id = lec_res.json()["lecture_id"]

    # 2. Fetch lectures
    get_lec = client.get("/feedback/lectures?semester=5&class_section=Class 3A&day_of_week=Friday")
    assert get_lec.status_code == 200
    lecs = get_lec.json()["lectures"]
    assert any(l["lecture_id"] == lecture_id for l in lecs)

    # 3. Update status to COMPLETED
    patch_res = client.patch(f"/feedback/lectures/{lecture_id}", json={
        "status": "COMPLETED",
        "topic": "HuggingFace Transformers Live Demo (Concluded)"
    })
    assert patch_res.status_code == 200
    assert patch_res.json()["status"] == "SUCCESS"

    # 4. Remove lecture
    del_lec = client.delete(f"/feedback/lectures/{lecture_id}")
    assert del_lec.status_code == 200
    assert del_lec.json()["status"] == "SUCCESS"


def test_curriculum_offerings_and_enroll_api():
    # 1. Post offering
    off_res = client.post("/feedback/offerings", json={
        "course_code": "AI501",
        "faculty_name": "Dr. Guest Speaker",
        "class_section": "Class 3C",
        "semester": 5,
        "term_name": "Fall 2026"
    })
    assert off_res.status_code == 200
    assert off_res.json()["status"] == "SUCCESS"
    offering_id = off_res.json()["offering_id"]

    # 2. Get offerings
    get_off = client.get("/feedback/offerings?class_section=Class 3C")
    assert get_off.status_code == 200
    assert len(get_off.json()["offerings"]) >= 1

    # 3. Student enroll
    enr_res = client.post("/feedback/student-enroll", json={
        "course_code": "AI501",
        "student_id": 9999,
        "semester": 5,
        "enrollment_type": "Core"
    })
    assert enr_res.status_code == 200
    assert enr_res.json()["status"] == "SUCCESS"

    # 4. Delete offering
    del_off = client.delete(f"/feedback/offerings/{offering_id}")
    assert del_off.status_code == 200
    assert del_off.json()["status"] == "SUCCESS"
