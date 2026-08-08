# 🧠 AI-Based Emotional Sentiment Analyzer for Student Feedback

An AI-powered platform that analyzes student feedback to identify **sentiment, emotions, topics, and recurring issues**, helping educational institutions understand student experiences and make data-driven decisions.

---

## 📌 Overview

Student feedback contains valuable information about teaching quality, course difficulty, workload, assignments, faculty performance, and overall student satisfaction. However, manually analyzing hundreds or thousands of feedback responses is time-consuming and difficult.

The **AI-Based Emotional Sentiment Analyzer for Student Feedback** automates this process using Natural Language Processing (NLP) and Machine Learning.

The system analyzes student feedback and provides:

- Overall sentiment
- Emotional state
- Emotion confidence scores
- Important topics
- Course-wise sentiment
- Faculty-wise feedback analysis
- Sentiment trends
- Common complaints
- Positive aspects
- Analytics dashboards

### Example

**Student Feedback:**

> "The professor explains concepts very clearly, but the assignments are too difficult and deadlines are very short."

**AI Analysis:**

```text
Overall Sentiment: MIXED

Teaching:
    Positive — 94%

Assignments:
    Negative — 91%

Deadlines:
    Negative — 87%

Detected Emotions:
    Frustration — 64%
    Satisfaction — 25%
    Confusion — 11%

Main Topic:
    Assignments / Workload
```

---

# 🎯 Objectives

1. Automatically analyze student feedback.
2. Detect positive, negative, neutral, and mixed sentiment.
3. Identify emotions expressed in feedback.
4. Extract important topics and issues.
5. Provide course-wise and faculty-wise insights.
6. Help institutions identify recurring student problems.
7. Provide interactive analytics dashboards.
8. Reduce the manual effort required for feedback analysis.
9. Maintain student feedback securely.
10. Support data-driven educational improvements.

---

# ✨ Key Features

## 👨‍🎓 Student Features

- Student registration and login
- Secure authentication
- Submit feedback
- Select course/faculty
- Anonymous feedback option
- View submitted feedback
- View previous feedback
- AI-generated feedback analysis

---

## 🤖 AI Features

### Sentiment Analysis

Classifies feedback into:

```text
Positive
Negative
Neutral
Mixed
```

### Emotion Detection

Detect emotions such as:

```text
Happy
Sad
Angry
Frustrated
Anxious
Confused
Satisfied
Neutral
```

### Topic Detection

Identifies recurring topics:

```text
Teaching
Assignments
Examinations
Workload
Attendance
Infrastructure
Faculty
Course Content
Laboratories
Projects
Deadlines
```

### Aspect-Based Sentiment Analysis

Instead of classifying only the entire sentence, the system analyzes individual aspects.

Example:

```text
Feedback:
"The teaching is excellent but the assignments
are extremely difficult."

Teaching:
    Positive

Assignments:
    Negative
```

---

# 📊 Analytics

The dashboard provides:

- Total feedback count
- Positive feedback percentage
- Negative feedback percentage
- Neutral feedback percentage
- Mixed feedback percentage
- Emotion distribution
- Course-wise sentiment
- Faculty-wise sentiment
- Topic frequency
- Sentiment trends
- Emotion trends
- Common complaints
- Positive highlights

---

# 🏗️ System Architecture

```text
                         ┌─────────────────────┐
                         │       Student       │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │     React UI        │
                         │  Tailwind CSS       │
                         └──────────┬──────────┘
                                    │
                               REST API
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │      FastAPI        │
                         │      Backend        │
                         └──────────┬──────────┘
                                    │
                ┌───────────────────┼───────────────────┐
                │                   │                   │
                ▼                   ▼                   ▼
       ┌────────────────┐  ┌────────────────┐  ┌────────────────┐
       │   AI / NLP     │  │   PostgreSQL   │  │   Analytics    │
       │     Engine     │  │    Database    │  │     Engine     │
       └───────┬────────┘  └────────────────┘  └───────┬────────┘
               │                                        │
               ▼                                        ▼
       ┌────────────────┐                     ┌────────────────┐
       │   Sentiment    │                     │    Reports     │
       │    Emotion     │                     │    Charts      │
       │    Topics      │                     │    Insights    │
       └────────────────┘                     └────────────────┘
```

---

# 🛠️ Technology Stack

## Frontend

- React
- TypeScript
- Tailwind CSS
- Recharts
- Axios
- React Router

## Backend

- Python
- FastAPI
- Pydantic
- SQLAlchemy
- JWT Authentication

## AI / NLP

- Python
- Hugging Face Transformers
- PyTorch
- scikit-learn
- Pandas
- NumPy
- NLTK / spaCy

## Database

- PostgreSQL

## DevOps

- Docker
- Docker Compose
- GitHub Actions

## Testing

- Pytest
- Vitest
- API testing
- End-to-end testing

---

# 📁 Project Structure

```text
student-emotional-analyzer/
│
├── README.md
├── LICENSE
├── .gitignore
├── .env.example
├── docker-compose.yml
├── Makefile
│
├── docs/
│   ├── architecture.md
│   ├── api.md
│   ├── database.md
│   ├── ai-model.md
│   ├── deployment.md
│   └── contribution.md
│
├── frontend/
│   ├── public/
│   │
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── layouts/
│   │   ├── hooks/
│   │   ├── context/
│   │   ├── charts/
│   │   ├── types/
│   │   ├── utils/
│   │   ├── App.tsx
│   │   └── main.tsx
│   │
│   ├── package.json
│   └── README.md
│
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   │
│   │   ├── api/
│   │   │   ├── auth.py
│   │   │   ├── feedback.py
│   │   │   ├── analysis.py
│   │   │   ├── analytics.py
│   │   │   └── users.py
│   │   │
│   │   ├── core/
│   │   ├── database/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── repositories/
│   │   └── utils/
│   │
│   ├── tests/
│   ├── requirements.txt
│   └── README.md
│
├── ai/
│   ├── datasets/
│   │   ├── raw/
│   │   └── processed/
│   │
│   ├── preprocessing/
│   ├── models/
│   │   ├── sentiment/
│   │   ├── emotion/
│   │   └── topic/
│   │
│   ├── training/
│   ├── evaluation/
│   ├── inference/
│   ├── notebooks/
│   ├── requirements.txt
│   └── README.md
│
├── analytics/
│   ├── services/
│   ├── aggregation/
│   ├── topic_modeling/
│   ├── reports/
│   └── README.md
│
├── devops/
│   ├── Dockerfile.backend
│   ├── Dockerfile.frontend
│   ├── nginx/
│   └── github-actions/
│
├── scripts/
│   ├── setup.sh
│   ├── seed_database.py
│   └── download_models.py
│
└── tests/
    ├── integration/
    └── e2e/
```

---

# 👥 Team Responsibilities

The project is divided among four team members.

## Member 1 — AI/NLP Engineer

Responsible for:

- Dataset collection
- Dataset preprocessing
- Sentiment model
- Emotion model
- Topic extraction
- Model training
- Model evaluation
- AI inference pipeline

Main directory:

```text
ai/
```

---

## Member 2 — Backend Engineer

Responsible for:

- FastAPI
- PostgreSQL
- Database models
- Authentication
- REST APIs
- Feedback APIs
- AI integration
- Backend testing

Main directory:

```text
backend/
```

---

## Member 3 — Frontend Engineer

Responsible for:

- React application
- UI/UX
- Student dashboard
- Admin dashboard
- Feedback forms
- Charts
- API integration
- Frontend testing

Main directory:

```text
frontend/
```

---

## Member 4 — Analytics & DevOps Engineer

Responsible for:

- Analytics
- Topic statistics
- Trend analysis
- Reports
- Docker
- CI/CD
- Deployment
- Integration testing
- System monitoring

Main directories:

```text
analytics/
devops/
```

---

# 🔄 Application Workflow

```text
Student
   │
   ▼
Login / Register
   │
   ▼
Select Course / Faculty
   │
   ▼
Write Feedback
   │
   ▼
Submit Feedback
   │
   ▼
FastAPI Backend
   │
   ▼
NLP Processing
   │
   ├───────────────┐
   ▼               ▼
Sentiment       Emotion
Analysis        Analysis
   │               │
   └───────┬───────┘
           ▼
      Topic Extraction
           │
           ▼
      Store Results
           │
           ▼
       PostgreSQL
           │
           ▼
        Analytics
           │
           ▼
    Admin / Faculty
      Dashboard
```

---

# 🔌 API Endpoints

## Authentication

```text
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

## Feedback

```text
POST /api/feedback
GET  /api/feedback
GET  /api/feedback/{id}
DELETE /api/feedback/{id}
```

## AI Analysis

```text
POST /api/analyze
GET  /api/analysis/{feedback_id}
```

## Analytics

```text
GET /api/analytics/overview
GET /api/analytics/sentiment
GET /api/analytics/emotions
GET /api/analytics/topics
GET /api/analytics/trends
GET /api/analytics/courses
GET /api/analytics/faculty
```

---

# 🧠 AI Pipeline

```text
Raw Feedback
      │
      ▼
Text Cleaning
      │
      ▼
Normalization
      │
      ▼
Tokenization
      │
      ▼
Transformer / ML Model
      │
      ├──────────────┬──────────────┐
      ▼              ▼              ▼
 Sentiment        Emotion         Topic
 Detection        Detection       Extraction
      │              │              │
      └──────────────┼──────────────┘
                     ▼
               Final Analysis
                     │
                     ▼
               Confidence Score
                     │
                     ▼
                  Backend
```

---

# 📈 Model Evaluation

AI models will be evaluated using:

```text
Accuracy
Precision
Recall
F1 Score
Confusion Matrix
ROC-AUC
```

For emotion classification, macro and weighted F1 scores should also be considered because emotion datasets may have class imbalance.

---

# 🗄️ Database Structure

Main tables:

```text
users
students
faculty
courses
feedback
sentiment_results
emotion_results
topics
```

Relationship:

```text
Users
 │
 ├── Students
 │      │
 │      └── Feedback
 │             │
 │             ├── Sentiment Results
 │             ├── Emotion Results
 │             └── Topics
 │
 └── Faculty

Courses
 │
 └── Feedback
```

---

# 🔐 Security

The application should implement:

- JWT authentication
- Password hashing
- Role-based authorization
- Input validation
- SQL injection protection
- CORS configuration
- Environment variables
- Secure database credentials
- Anonymous feedback protection
- API rate limiting where required

Sensitive configuration should never be committed.

Use:

```text
.env
```

and provide:

```text
.env.example
```

---

# 🐳 Running with Docker

Clone the repository:

```bash
git clone <repository-url>
cd student-emotional-analyzer
```

Create environment file:

```bash
cp .env.example .env
```

Start the complete application:

```bash
docker compose up --build
```

Stop the application:

```bash
docker compose down
```

---

# 💻 Local Development

## Backend

```bash
cd backend

python -m venv .venv
source .venv/bin/activate

pip install -r requirements.txt

uvicorn app.main:app --reload
```

Backend:

```text
http://localhost:8000
```

API documentation:

```text
http://localhost:8000/docs
```

---

## Frontend

```bash
cd frontend

npm install
npm run dev
```

Frontend:

```text
http://localhost:5173
```

---

## AI Environment

```bash
cd ai

python -m venv .venv
source .venv/bin/activate

pip install -r requirements.txt
```

Train models:

```bash
python training/train_sentiment.py
python training/train_emotion.py
```

Evaluate:

```bash
python evaluation/evaluate.py
```

---

# 🌿 Git Workflow

Development should happen through feature branches.

```text
main
 │
 ├── ai/member1
 ├── backend/member2
 ├── frontend/member3
 └── analytics-devops/member4
```

Create a branch:

```bash
git checkout -b feature/<feature-name>
```

Example:

```bash
git checkout -b feature/emotion-model
```

Commit:

```bash
git add .
git commit -m "feat: add emotion classification pipeline"
```

Push:

```bash
git push origin feature/emotion-model
```

Then create a Pull Request.

### Recommended commit format

```text
feat: add feedback API
fix: resolve authentication bug
docs: update API documentation
test: add sentiment tests
refactor: improve NLP pipeline
chore: update dependencies
```

---

# 🧪 Testing

Run backend tests:

```bash
cd backend
pytest
```

Run frontend tests:

```bash
cd frontend
npm test
```

Run integration tests:

```bash
pytest tests/integration
```

The project should include:

- Unit tests
- API tests
- AI model tests
- Database tests
- Integration tests
- End-to-end tests

---

# 🚀 Development Roadmap

## Phase 1 — Planning

- [ ] Define requirements
- [ ] Design architecture
- [ ] Design database
- [ ] Define API contracts
- [ ] Create GitHub repository
- [ ] Create project structure

## Phase 2 — Foundation

- [ ] Setup React
- [ ] Setup FastAPI
- [ ] Setup PostgreSQL
- [ ] Configure environment variables
- [ ] Setup Git workflow

## Phase 3 — AI

- [ ] Collect datasets
- [ ] Clean datasets
- [ ] Preprocess text
- [ ] Train sentiment model
- [ ] Train emotion model
- [ ] Implement topic extraction
- [ ] Evaluate models

## Phase 4 — Backend

- [ ] Authentication
- [ ] User management
- [ ] Feedback API
- [ ] AI analysis API
- [ ] Analytics API
- [ ] Database integration

## Phase 5 — Frontend

- [ ] Login page
- [ ] Registration page
- [ ] Student dashboard
- [ ] Feedback form
- [ ] Feedback history
- [ ] Admin dashboard
- [ ] Analytics charts

## Phase 6 — Integration

- [ ] Connect frontend to backend
- [ ] Connect backend to AI
- [ ] Connect analytics
- [ ] Test complete workflow

## Phase 7 — Deployment

# AI-Based Emotional Sentiment Analyzer for Student Feedback

- [ ] Dockerize application
- [ ] Configure Docker Compose
- [ ] Setup CI/CD
- [ ] Deploy backend
- [ ] Deploy frontend
- [ ] Deploy database
- [ ] Production testing

---

# 🔮 Future Enhancements

Possible future improvements:

- Multilingual sentiment analysis
- Telugu + English feedback
- Voice feedback
- Speech-to-text
- Real-time sentiment monitoring
- Aspect-based sentiment analysis
- Advanced topic modeling
- AI-generated summaries
- Automatic complaint detection
- Urgency detection
- Semester-wise comparison
- Course recommendation insights
- PDF report generation
- CSV/Excel export
- Email notifications
- Institution-level analytics
- Explainable AI

---

# ⚠️ Important Considerations

The system should treat AI predictions as **decision-support information**, not as definitive judgments about individual students, faculty, or mental/emotional states.

Student feedback should be handled with:

- Privacy
- Anonymization where appropriate
- Access control
- Secure storage
- Responsible AI practices

---

# 📜 License

This project is intended for educational and research purposes.

Add your chosen license here, for example:

```text
MIT License
```

---

# 👨‍💻 Team

| Member   | Responsibility     |
| -------- | ------------------ |
| Member 1 | AI / NLP           |
| Member 2 | Backend / Database |
| Member 3 | Frontend           |
| Member 4 | Analytics / DevOps |

---

# ⭐ Project Vision

> **Transform raw student feedback into actionable educational insights using AI.**

The goal is not simply to classify feedback as positive or negative, but to understand **what students are saying, how they feel, what problems they are experiencing, and where educational improvements are needed.**
