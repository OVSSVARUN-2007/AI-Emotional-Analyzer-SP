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
    response = client.get("/feedback/5")

    assert response.status_code == 200

    data = response.json()

    assert data["feedback"]["feedback_id"] == 5
    assert data["feedback"]["status"] == "ANALYZED"

    assert data["prediction"] is not None
    assert data["prediction"]["feedback_id"] == 5

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
