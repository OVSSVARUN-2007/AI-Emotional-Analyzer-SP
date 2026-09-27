# 🧪 Student Emotional Analyzer — Model Testing Backend

FastAPI backend application created **exclusively for testing** the trained NLP models (Sentiment Analysis, Emotion Detection, Aspect-Based Sentiment, and Topic Extraction).

---

## 🚀 Running the Testing Backend

### 1. Install Dependencies
```bash
pip install -r backend/requirements.txt
```

### 2. Start the Server
```bash
python backend/app/main.py
```
*or directly with Uvicorn:*
```bash
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```

---

## 🌐 Interactive Web UI & API Documentation

- **Web Playground UI**: Open [http://localhost:8000](http://localhost:8000) in your browser to test feedback texts interactively with visual sentiment badges, emotion confidence bars, aspect breakdown table, and JSON response viewer.
- **Interactive OpenAPI (Swagger) Docs**: Open [http://localhost:8000/docs](http://localhost:8000/docs).
- **ReDoc Documentation**: Open [http://localhost:8000/redoc](http://localhost:8000/redoc).

---

## 🔌 API Endpoints Summary

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Web UI Playground for interactive browser testing |
| `GET` | `/api/health` | Model loading status and diagnostic check |
| `GET` | `/api/metrics` | Returns validation & test F1 metrics for trained models |
| `POST` | `/api/analyze` | Analyzes single feedback text |
| `POST` | `/api/analyze/batch` | Analyzes list of feedback texts in batch |

---

## 💻 Sample cURL Requests

### Analyze Single Feedback
```bash
curl -X POST "http://localhost:8000/api/analyze" \
     -H "Content-Type: application/json" \
     -d '{"feedback": "The professor explains concepts clearly, but assignments are too difficult."}'
```

### Health Check
```bash
curl "http://localhost:8000/api/health"
```
