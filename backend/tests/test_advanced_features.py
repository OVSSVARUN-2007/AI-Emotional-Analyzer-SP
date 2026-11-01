import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_burnout_risk_endpoint():
    response = client.get("/feedback/burnout-risk")
    assert response.status_code == 200
    data = response.json()
    assert "average_burnout_risk" in data
    assert "weekly_trajectory" in data
    assert "at_risk_students" in data
    assert len(data["weekly_trajectory"]) > 0

def test_remedial_lesson_plan_generation():
    payload = {
        "course_code": "AI501",
        "course_name": "Natural Language Processing",
        "topic": "Backpropagation in Deep Networks",
        "confusion_rate": 45,
    }
    response = client.post("/feedback/remedial-plan/generate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "plan" in data
    assert data["plan"]["topic"] == "Backpropagation in Deep Networks"
    assert "ten_minute_plan" in data["plan"]

def test_clarification_broadcast():
    payload = {
        "course_code": "AI501",
        "course_name": "Natural Language Processing",
        "topic": "Backpropagation Proof",
        "clarification_text": "Here is the matrix chain rule explanation with step-by-step tensor shapes.",
        "reference_url": "https://colab.research.google.com/drive/nlp-backprop",
    }
    response = client.post("/feedback/broadcast-clarification", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["broadcast"]["topic"] == "Backpropagation Proof"

    # List clarifications
    list_res = client.get("/feedback/clarifications")
    assert list_res.status_code == 200
    assert len(list_res.json()["clarifications"]) > 0

def test_community_pulse_posts_and_upvotes():
    # Create post
    payload = {
        "title": "GPU Quota Limit for Lab 4",
        "category": "Lab & Resources",
        "content": "Several students have exhausted CUDA memory before completing batch training.",
        "is_anonymous": True,
    }
    post_res = client.post("/feedback/community/posts", json=payload)
    assert post_res.status_code == 200
    post_data = post_res.json()["post"]
    post_id = post_data["post_id"]

    # Upvote post
    upvote_res = client.post(f"/feedback/community/posts/{post_id}/upvote")
    assert upvote_res.status_code == 200
    assert upvote_res.json()["upvotes"] >= 1

def test_study_pods_creation_and_joining():
    payload = {
        "course_code": "AI501",
        "course_name": "Natural Language Processing",
        "topic": "Attention Query-Key-Value Multiplications",
        "max_members": 4,
        "meeting_link": "https://meet.google.com/test-pod",
    }
    pod_res = client.post("/feedback/community/study-pods", json=payload)
    assert pod_res.status_code == 200
    pod_data = pod_res.json()["pod"]
    pod_id = pod_data["pod_id"]

    # Join pod
    join_res = client.post(f"/feedback/community/study-pods/{pod_id}/join", json={"student_id": 999})
    assert join_res.status_code == 200
    assert join_res.json()["current_members"] >= 2

def test_department_heatmap():
    res = client.get("/feedback/department-heatmap")
    assert res.status_code == 200
    data = res.json()
    assert "departments" in data
    assert len(data["departments"]) >= 4

def test_syllabus_mapping():
    res = client.get("/feedback/syllabus-mapping?course_code=AI501")
    assert res.status_code == 200
    data = res.json()
    assert data["course_code"] == "AI501"
    assert len(data["units"]) == 5

def test_webhook_integration_and_dispatch():
    # Update webhook
    config_payload = {
        "service_name": "Slack",
        "webhook_url": "https://example.com/services/webhook-test",
        "trigger_on": "CRITICAL_ONLY",
        "enabled": True,
    }
    save_res = client.post("/feedback/integrations/webhook-config", json=config_payload)
    assert save_res.status_code == 200

    # Test webhook dispatch
    test_res = client.post("/feedback/integrations/test-webhook")
    assert test_res.status_code == 200
    assert test_res.json()["success"] is True

