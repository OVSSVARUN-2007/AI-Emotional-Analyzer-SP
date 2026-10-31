import sys
from pathlib import Path

from fastapi.testclient import TestClient

# Add the backend folder to Python's import path
PROJECT_ROOT = Path(__file__).resolve().parents[2]
BACKEND_PATH = PROJECT_ROOT / "backend"

sys.path.insert(0, str(PROJECT_ROOT))
sys.path.insert(0, str(BACKEND_PATH))

from app.main import app


client = TestClient(app)


def test_health():
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_database_health():
    response = client.get("/health/database")

    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_get_existing_feedback():
    # Submit a feedback first to test retrieval and analysis
    create_payload = {
        "student_id": 1,
        "offering_id": 1,
        "feedback_text": "The graph algorithm explanations and visualization slides made difficult concepts much simpler to grasp.",
        "is_anonymous": True,
        "semester": 5,
        "class_section": "Class 3A",
        "course_code": "AI501",
        "course_name": "Natural Language Processing"
    }
    create_res = client.post("/feedback/", json=create_payload)
    assert create_res.status_code == 200
    created_id = create_res.json()["feedback"]["feedback_id"]

    response = client.get(f"/feedback/{created_id}")

    assert response.status_code == 200

    data = response.json()

    assert data["feedback"]["feedback_id"] == created_id
    assert data["feedback"]["status"] == "ANALYZED"

    assert data["prediction"] is not None
    assert data["prediction"]["feedback_id"] == created_id

    assert isinstance(data["aspects"], list)


def test_get_missing_feedback():
    response = client.get("/feedback/9999")

    assert response.status_code == 404
    assert response.json()["detail"] == "Feedback not found"

def test_student_mentors():
    response = client.get('/feedback/student-mentors')
    assert response.status_code == 200
    data = response.json()
    assert 'academic_mentor' in data
    assert 'project_mentor' in data
    assert 'Dr. Ramesh Ponnala' in data['academic_mentor']['name']
    assert 'Cabin B-304' in data['academic_mentor']['cabin_no']
    assert 'Dr. Sandeep Kumar Panda' in data['project_mentor']['name']
    assert 'Cabin R-412' in data['project_mentor']['cabin_no']
