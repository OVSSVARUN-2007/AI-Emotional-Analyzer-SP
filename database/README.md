# AI Emotional Analyzer Database Schema & Setup

This directory contains the database SQL dump, schema definition, and setup documentation for the **Sentio — AI-Powered Multimodal Emotional Sentiment Analyzer** platform.

---

## 📁 Directory Contents

- **`student_feedback_ai.sql`**: Complete PostgreSQL database schema dump with all 31 tables, sequences, indexes, and full seed data.
- **`student_feedback.db`**: Synchronized SQLite database instance for zero-config local operation.
- **`README.md`**: Database schema documentation and setup instructions.

---

## 🗄️ Database Overview

The system supports dual-database operation:
1. **Local Development (Default)**: Embedded SQLite (`backend/database/student_feedback.db`), zero configuration required.
2. **Enterprise Production**: PostgreSQL (via `student_feedback_ai.sql` or `DB_USER`/`DB_NAME` environment variables).

---

## 📋 Entity & Table Descriptions (31 Tables)

### 1. Identity, Authentication & Security
- **`users`**: System user accounts (Students, Faculty, Admins) with bcrypt-hashed passwords, role flags, session lockouts (`failed_login_attempts`, `locked_until`).
- **`refresh_tokens`**: Cryptographically hashed rotating refresh tokens with expirations and revocation tracking.
- **`otps`**: 6-digit email verification codes with 10-minute expiry for user registration and password resets.
- **`audit_logs`**: Immutable security log recording user actions, IP address, resource accessed, and timestamps.

### 2. Academic & Curriculum Structure
- **`semesters`**: Academic terms (Semesters 1 through 8) with term names, active indicator, and date bounds.
- **`courses`**: Master catalog of university subjects (`course_code`, `course_name`, `credits`, `department_name`, `program`, `semester`, `exam_slot`).
- **`sections`**: Student class cohorts (Section A through Section K) across semesters with unique constraints.
- **`faculty`**: Faculty directory with department mapping, designations, and contact emails.
- **`students`**: Student profiles linked to user accounts with roll numbers, section allocations, and contact info.
- **`course_offerings`**: Allocation of courses to faculty and sections for active academic terms.
- **`student_enrollments`**: Student subject registrations (`Core` and `Elective`) with enrollment statuses.
- **`lectures`**: Weekly course timetable schedule (day of week, start/end times, room number, lecture type, topic).

### 3. Feedback, ABSA & AI Engine
- **`feedback`**: Student feedback entries with anonymization, upvotes, helpfulness scores, PII masking, urgency flags, and multimodal attachments (slide vision URL, acoustic prosody).
- **`predictions`**: AI-generated sentiment classification (`POSITIVE`, `NEGATIVE`, `NEUTRAL`, `MIXED`) and 7-axis canonical emotion detections with calibrated confidence scores.
- **`feedback_aspects`**: Aspect-based sentiment analysis (ABSA) breaking down feedback into pedagogical aspects (`Teaching`, `Assignments`, `Deadlines`, `Materials`, `Infrastructure`) with confidence ratings.
- **`feedback_responses`**: Official administrative and instructor replies to feedback entries with action tracking.
- **`feedback_requests`**: Instructor-created 60-second lecture pulse polls broadcast to classes.
- **`poll_votes`**: Real-time student votes on lecture pulse options.
- **`model_versions`**: Registry of deployed AI models (TF-IDF, DistilBERT, Gemini) with performance metrics.
- **`analysis_cache`**: SHA-256 hash-indexed cache preventing redundant NLP/Gemini invocations on duplicate feedback.

### 4. Pedagogical Interventions, Grievances & Community
- **`complaints`**: Confidential student grievance desk with severity triage (`HIGH`, `MEDIUM`, `LOW`), categories, and resolution tracking.
- **`announcements`**: Broadcast notices from Dean and faculty targeted to all or specific sections.
- **`community_posts`**: Anonymous student campus pulse posts with "Me Too" upvotes and administrative action plans.
- **`community_upvotes`**: Per-user tracking of community post upvotes.
- **`remedial_lesson_plans`**: AI-drafted 10-minute recap lesson plans for difficult lecture topics.
- **`clarification_broadcasts`**: Instructor explanatory notes, slides, and Colab links addressing student confusion.
- **`study_pods`**: Collaborative anonymous peer study circles matching high-clarity students with peers.
- **`faculty_actions`**: Logged pedagogical interventions with before/after clarity impact metrics.
- **`webhook_integrations`**: Slack / Microsoft Teams webhook dispatchers for critical distress and weekly digests.
- **`system_settings`**: Key-value system configuration (e.g. Gemini model selection, anonymity threshold).

---

## 🚀 Setup & Restoration Instructions

### SQLite (Default)
The database is auto-initialized on first run. To manually seed or reset:

```bash
# Seed or verify database
python scripts/seed_database.py

# Complete reset and reseed
python scripts/seed_database.py --reset
```

### PostgreSQL Setup
1. Create target database:
```sql
CREATE DATABASE student_feedback_ai;
```

2. Restore complete schema and seed data:
```bash
psql -U postgres -d student_feedback_ai -f database/student_feedback_ai.sql
```

3. Configure environment in `.env`:
```env
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=student_feedback_ai
DB_HOST=localhost
DB_PORT=5432
```

---

## 🔗 Key Performance Indexes
- `idx_feedback_course_sec`: Fast filtering on `(course_code, class_section)`
- `idx_feedback_created`: Time-series trend and semester timeline lookups
- `idx_feedback_hash`: Sub-millisecond text deduplication against `analysis_cache`
- `idx_audit_logs_user`: Fast security compliance lookups on `(user_id, created_at)`
- `idx_sections_class_sem`: Unique constraint preventing duplicate section entries
