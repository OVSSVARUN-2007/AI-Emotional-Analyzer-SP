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

# ✨ Key Features & Architecture

## 🔐 Authentication, Registration & Security
- **Registration**: Name, Roll Number / Staff ID, University Email, Password, and Role selection.
- **Email OTP Verification**: Secure 6-digit one-time password dispatched to university email with 10-minute expiry to verify student and faculty identity.
- **JWT Authorization**: Cryptographically signed JSON Web Tokens (Bearer tokens) with role verification (`STUDENT` vs `ADMIN` / `FACULTY`).
- **Secure Password Hashing**: Passwords stored using `bcrypt` salted hashes.

## 🤖 Grounded Structured Output AI (Configurable Google Gemini Engine)
- **Configurable Gemini Engine**: Supports dynamic model configuration (`gemini-2.5-flash`, `gemini-1.5-flash`, etc.) via Admin Dashboard or `.env` without hardcoding.
- **Grounded Structured Output**: Strict JSON schema validation with automatic retry on malformed outputs; grounded against database evidence.
- **Unified 7-Axis Emotion Taxonomy**: Synchronized across TF-IDF, Gemini, and Frontend radar: `joy`, `clarity`, `curiosity`, `confusion`, `frustration`, `fatigue`, and `neutral`.
- **Feedback Tone & Morale Indicator**: Real-time 0–100 academic climate & pace diagnostic with transparent driver breakdown (not a clinical mental health diagnosis).
- **Bixi AI Academic Assistant**: Grounded conversational assistant citing actual anonymized course feedback excerpts or admitting when data is unavailable.

## 👨‍🎓 1. Student Dashboard (Normal View)
- **Submit Course Feedback**:
  - Filtered strictly to student's enrolled semester subjects and instructors.
  - Speech-to-Text Microphone voice dictation with live audio wave pulse.
  - Client-side Privacy Shield scanner warning if email or phone number is accidentally typed.
  - Interactive `<SpecularButton>` for submission.
- **Community Feed & Upvoting**:
  - Real-time peer feedback feed with sentiment and emotion tags.
  - Community upvoting button (`POST /feedback/{id}/upvote`).
  - Toggle between **"🔥 Top Priorities"** (most upvoted) and **"⏱️ Latest"**.
  - Visible official faculty action plans on addressed concerns.
- **60-Second Lecture Pulse Polls**:
  - Live in-class clarity polls with interactive voting and real-time community vote percentages.
- **My Courses & Academic Mentors**:
  - Semester course schedule, exam slots, credits, and dedicated Academic Mentors (`Dr. Ramesh Ponnala` & `Dr. Sandeep Kumar Panda`).
- **Confidential Grievance Box**:
  - File formal complaints directly to the Academic Oversight Board with resolution tracking.

## 🏛️ 2. Admin & Faculty Dashboard (Executive View)
- **Institutional Overview & Analytics**:
  - Academic Wellbeing Gauge (0–100 index).
  - 6-Axis Emotional Radar spider chart.
  - Milestone Sentiment & Alert Timeline tracking satisfaction vs alerts.
  - Key performance indicator banners.
- **Pedagogical AI Advice Hub**:
  - Priority-triaged instructional and curricular intervention cards (`High`, `Normal`, `Low`).
- **Feedback Oversight & Department Filters**:
  - Filter feedback by Section (`Class 3A`, `Class 3B`, `Class 2A`, `All`), Semester, or Sentiment.
  - Modal to publish official administrative responses to student feedback.
- **Grievance Redressal Desk**:
  - Centralized queue of student complaints with status tracking (`PENDING`, `IN_REVIEW`, `RESOLVED`, `REJECTED`) and action recording.
- **Pulse Poll Manager**:
  - Create and broadcast new 60-Second Lecture Pulse Polls to any section.
- **Gemini Token Hub & Test Bench**:
  - Form to input and verify `GEMINI_API_KEY` against Google Gemini API with instant latency testing.
  - Live NLP comparison test bench (Google Gemini vs BERT vs TF-IDF).

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

## Web application

The Sentio Student Emotional Analyzer frontend is a modern React application built with Vite, Lucide icons, and interactive specular physics buttons (`SpecularButton`). It can be run via Vite dev server or built and served directly by FastAPI.

### Option A: Direct FastAPI Serving (Production Build)

FastAPI serves the built application directly at `http://localhost:8000`:

```bash
# 1. Build frontend distribution
cd frontend
npm install
npm run build
cd ..

# 2. Launch FastAPI backend
python -m uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000
```

### Option B: Vite Frontend Development Server (Hot Reload)

```bash
# Terminal 1: Backend
python -m uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000

# Terminal 2: Frontend
cd frontend
npm install
npm run dev
# Open http://localhost:5173
```

### Real-time updates and Kafka

Open dashboards receive feedback, complaint, and feedback-request updates via
`/ws/events`. This works locally without any extra service. With Kafka
configured, every server instance publishes and consumes those events, so
dashboards connected to different instances stay in sync.

```bash
pip install -r backend/requirements.txt
export KAFKA_BOOTSTRAP_SERVERS=localhost:9092
# Optional: defaults to student-feedback-events
export KAFKA_TOPIC=student-feedback-events
python -m uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000
```

If Kafka is unavailable, the application logs a warning and continues with
local WebSocket updates; feedback submission is not interrupted.

### Dynamic portal features

- Live dashboard refreshes for feedback, complaints, faculty action updates, and announcements.
- Course directory and submission choices sourced from the database.
- AI-style weekly feedback summary with recommended action and workload alerts.
- CSV feedback-report export at `/feedback/export.csv`.
- Faculty/admin announcements, scoped to a class section or all students.
- Faculty action records via `POST /feedback/{feedback_id}/response`.
- Motion effects respect the user's reduced-motion accessibility preference.

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

### Final NLP Model & Engine Workflow

The reusable NLP layer is deliberately separate from any backend and provides 3 interchangeable model engines:

1. **Local TF-IDF + LogisticRegression**:
   - Sentiment: TF-IDF n-grams + tuned Logistic Regression trained on clean student feedback splits.
   - Emotion: Six-class (`sadness`, `joy`, `love`, `anger`, `fear`, `surprise`) TF-IDF classifier.
2. **HuggingFace BERT Transformer Engine**:
   - Deep learning transformer pipelines for fine-grained sentiment and emotion detection.
3. **External Cloud AI Model Engine (Google Gemini / OpenAI)**:
   - Zero-shot / structured prompt extraction via cloud LLM APIs with automatic `.env` key resolution and offline fallback.
4. **Aspect-Based Sentiment & Topic Detection**:
   - Clause decomposition across contrast connectors (`but`, `however`, `although`, `whereas`, `yet`, `while`, `though`, `despite`) and whole-word keyword matching across 11 student feedback categories.

Run the complete local NLP workflow from the command line:

```bash
python training/preprocess_sentiment.py
python training/train_sentiment.py
python training/train_emotion.py --skip-tuning
python training/analyze_feedback.py "The lectures are clear but the assignment deadline is too short."
```

The emotion script uses a deterministic, stratified 60,000-row cap by default so it runs safely on a normal development machine; use `--max-rows 0` only when resources allow a full-data run. Generated `.joblib` files and metrics are stored under `ai/models/` and remain ignored by Git because they are reproducible artifacts.

Run the fast NLP checks with:

```bash
python -m pytest tests -q
```

### 📊 Real-World Labeled Benchmark Evaluation (360 Real Samples)

Unlike synthetic in-dataset splits that report inflated metrics, the models have been validated against an independent hand-curated academic benchmark (`ai/datasets/real_labeled_feedback_test.csv`) of **360 authentic student responses**, including 65+ Telugu-English (Tanglish) code-mixed samples, sarcasm, and negation edge cases.

| Metric | Sentiment (4 Classes) | Emotion (7 Canonical Classes) |
|---|---|---|
| **Accuracy** | **69.7%** | **55.8%** |
| **Macro Precision** | **68.4%** | **63.9%** |
| **Macro Recall** | **62.9%** | **54.4%** |
| **Macro F1** | **0.646** | **0.482** |
| **Confidence Calibration** | Temperature Scaling ($T=1.35$) | Uncertainty Band ($< 0.65$ flagged for human review) |

To re-evaluate against the real benchmark at any time:
```bash
python -m ai.training.evaluate_real_dataset
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

Run frontend build verification:

```bash
cd frontend
npm run build
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

- [x] Define requirements
- [x] Design architecture
- [x] Design database
- [x] Define API contracts
- [x] Create GitHub repository
- [x] Create project structure

## Phase 2 — Foundation

- [x] Setup React
- [x] Setup FastAPI
- [x] Setup SQLite & PostgreSQL compatibility
- [x] Configure environment variables
- [x] Setup Git workflow

## Phase 3 — AI

- [x] Collect and curate real feedback datasets (360 samples including Telugu-English code-mix)
- [x] Clean sentiment dataset
- [x] Preprocess sentiment text
- [x] Train sentiment baseline model (TF-IDF + Calibrated Classifier)
- [x] Train emotion model (7 canonical classes: joy, clarity, curiosity, confusion, frustration, fatigue, neutral)
- [x] Implement topic and aspect extraction
- [x] Add reproducible model evaluation and test suite (56 automated tests)

## Phase 4 — Backend

- [x] Authentication (Email OTP verification, JWT access tokens, rotating refresh tokens)
- [x] Rate limiting & 5-attempt account lockout
- [x] User management & profile completion tracking
- [x] Feedback API with server-side PII sanitization and analysis caching
- [x] AI analysis API with schema validation and fallback logic
- [x] Analytics API, cohort breakdowns, and audit logging
- [x] Database integration, indexing, and migration schema

## Phase 5 — Frontend

- [x] Login page with role selection
- [x] Registration page with 6-digit OTP verification & forgot password flow
- [x] Student dashboard with live lecture timetable & allotted subjects
- [x] Feedback form with speech-to-text, live helpfulness scorer, and Telugu code-mix detection
- [x] Feedback history and official faculty responses
- [x] Admin & faculty dashboard with interactive charts and syllabus mapping
- [x] Interactive Cohort Donut Chart & Stacked Bar with slice click drill-down

## Phase 6 — Integration

- [x] Connect frontend to backend with secure token storage
- [x] Connect backend to AI engine (Local ML + Configurable Google Gemini)
- [x] Connect analytics & cohort filters
- [x] Test complete workflow (56 pytest unit, API, and integration tests passing)

## Phase 7 — Deployment

- [ ] Dockerize application
- [ ] Configure Docker Compose
- [ ] Setup CI/CD
- [ ] Deploy backend
- [ ] Deploy frontend
- [ ] Deploy database
- [ ] Production testing

---

# 🔮 Completed & Advanced Features

- [x] Multilingual sentiment analysis & Telugu-English (Tanglish) code-mix detection
- [x] Speech-to-text voice feedback input with audio wave visualization
- [x] Aspect-based sentiment analysis (Concept clarity, Pacing, Materials, Doubt resolution)
- [x] Automated 1-click executive summary report generator (`/feedback/reports/executive-summary`)
- [x] Semantic complaint & grievance clustering (`/feedback/complaints/clusters`)
- [x] Safety & urgency risk escalation with confidential Grievance Desk
- [x] Semester-over-semester and section-vs-section delta comparisons
- [x] Explainable Feedback Tone & Morale Indicator with driver breakdown
- [x] Grounded Bixi AI Assistant citing real course feedback evidence
- [x] Faculty pedagogical action tracking & before/after clarity impact scoring
- [x] Gamified feedback quality and helpfulness scorer (0–100)
- [x] Server-side PII masking (phones, emails, roll numbers) & $k=5$ minimum group anonymity

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
