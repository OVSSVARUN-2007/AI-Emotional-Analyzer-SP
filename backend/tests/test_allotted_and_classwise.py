import sys
from pathlib import Path
from fastapi.testclient import TestClient

PROJECT_ROOT = Path(__file__).resolve().parents[2]
BACKEND_PATH = PROJECT_ROOT / "backend"
sys.path.insert(0, str(PROJECT_ROOT))
sys.path.insert(0, str(BACKEND_PATH))

from app.main import app

client = TestClient(app)


def test_student_allotted_subjects_semester_5():
    """Verify that a semester 5 student only receives semester 5 subjects."""
    response = client.get("/feedback/allotted-subjects?semester=5")
    assert response.status_code == 200
    data = response.json()
    assert data["semester"] == 5
    assert len(data["subjects"]) > 0

    # Ensure every subject returned is strictly semester 5
    for sub in data["subjects"]:
        assert sub["semester"] == 5
        assert sub["course_code"] in ["AI501", "AI502", "CS501", "CS502"]


def test_student_allotted_subjects_semester_3():
    """Verify that a semester 3 student only receives semester 3 subjects."""
    response = client.get("/feedback/allotted-subjects?semester=3")
    assert response.status_code == 200
    data = response.json()
    assert data["semester"] == 3
    assert len(data["subjects"]) > 0

    # Ensure every subject returned is strictly semester 3
    for sub in data["subjects"]:
        assert sub["semester"] == 3
        assert sub["course_code"] in ["CS201", "CS204", "MA201"]


def test_faculty_classes_list():
    """Verify that faculty can view classes organized class-wise."""
    response = client.get("/feedback/faculty-classes")
    assert response.status_code == 200
    data = response.json()
    assert "classes" in data
    class_names = [c["class_section"] for c in data["classes"]]
    assert "Class 3A" in class_names
    assert "Class 3B" in class_names
    assert "Class 2A" in class_names


def test_faculty_class_wise_feedback_filter():
    """Verify that faculty feed can be filtered class-wise."""
    response = client.get("/feedback/?class_section=Class 3A")
    assert response.status_code == 200
    data = response.json()
    assert "feedback" in data
    for item in data["feedback"]:
        assert item["class_section"] == "Class 3A"


def test_faculty_class_summary_metrics():
    """Verify class-wise KPI and summary calculation."""
    response = client.get("/feedback/class-summary?class_section=Class 3A")
    assert response.status_code == 200
    data = response.json()
    assert data["class_section"] == "Class 3A"
    assert "positive_percentage" in data
    assert "breakdown" in data
    assert "satisfaction" in data["breakdown"]
    assert "frustration" in data["breakdown"]
    assert "confusion" in data["breakdown"]


def test_student_submit_feedback_with_allotted_subject_and_class():
    """Verify student feedback submission correctly records semester and class."""
    payload = {
        "student_id": 1,
        "offering_id": 1,
        "feedback_text": "The natural language processing demonstrations and tokenization notebooks were extremely helpful.",
        "is_anonymous": True,
        "semester": 5,
        "class_section": "Class 3A",
        "course_code": "AI501",
        "course_name": "Natural Language Processing"
    }
    response = client.post("/feedback/", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["feedback"]["semester"] == 5
    assert data["feedback"]["class_section"] == "Class 3A"
    assert data["feedback"]["course_code"] == "AI501"
    assert data["feedback"]["status"] == "ANALYZED"
