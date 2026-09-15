# AI Emotional Analyzer Database Schema & Setup

This directory contains the database SQL dump and setup documentation for the **AI Emotional Feedback Analyzer** system.

---

## 📁 Directory Contents

- **`student_feedback_ai.sql`**: PostgreSQL database dump containing the complete table structures, sequences, foreign key constraints, and seed data for the system.
- **`README.md`**: Database schema documentation and setup instructions.

---

## 🗄️ Database Overview

The system uses a **PostgreSQL** relational database designed to manage user roles, academic structures (departments, programs, batches, courses, offerings, enrollments), student feedback, and AI model predictions for sentiment & aspect-based emotion analysis.

---

## 📋 Entity & Table Descriptions

### 1. Core & User Management
- **`departments`**: Academic departments (e.g., CSE, ECE, IT).
- **`programs`**: Degree programs under departments (e.g., B.Tech, M.Tech).
- **`batches`**: Academic student batches with start/end years (e.g., 2024-2028).
- **`sections`**: Student class sections within batches (e.g., Section A, B).
- **`users`**: System user accounts (Students, Faculty, Admins) with hashed passwords and role flags.

### 2. Academic & Course Structure
- **`students`**: Detailed student profile linking user records to department, program, batch, and section.
- **`faculty`**: Detailed faculty profile linking user records to departments and designations.
- **`academic_terms`**: Academic years and semesters (e.g., 2026-27, Semester 5).
- **`courses`**: Subject catalog with course codes, names, credits, and department mapping.
- **`course_offerings`**: Specific instances of courses assigned to faculty and academic terms.
- **`enrollments`**: Student course registrations for specific offerings.

### 3. Feedback & AI Analytics Engine
- **`feedback`**: Student feedback entries submitted for course offerings, including timestamp, anonymity setting, and analysis status (`PENDING`, `ANALYZED`, `FAILED`).
- **`model_versions`**: Registry of deployed AI models for sentiment, emotion, or combined analysis tasks.
- **`predictions`**: AI-generated sentiment classification (Positive/Neutral/Negative) and emotion detection results with confidence scores.
- **`feedback_aspects`**: Aspect-based sentiment analysis breaking down feedback into specific aspects (e.g., teaching style, course material) with fine-grained sentiments and confidence ratings.

---

## 🚀 Setup & Restoration Instructions

### Prerequisites
- PostgreSQL 14+ installed and running.
- A created database instance (e.g., `student_feedback_ai`).

### Step 1: Create Database
Connect to your local PostgreSQL server via `psql` or pgAdmin and create the target database:

```sql
CREATE DATABASE student_feedback_ai;
```

### Step 2: Restore Schema & Data
Import `student_feedback_ai.sql` into your database:

Using command line (`psql`):
```bash
psql -U postgres -d student_feedback_ai -f database/student_feedback_ai.sql
```

Or using `pg_restore` (if exported in custom binary format):
```bash
pg_restore -U postgres -d student_feedback_ai database/student_feedback_ai.sql
```

---

## 🔗 Key Constraints & Validation Rules
- **Role Enforcement**: `users.role` restricted to `'STUDENT'`, `'FACULTY'`, or `'ADMIN'`.
- **Status Workflow**: `feedback.status` limited to `'PENDING'`, `'ANALYZED'`, or `'FAILED'`.
- **Confidence Range**: `confidence` metrics in `predictions` and `feedback_aspects` bounded between `0.0000` and `1.0000`.
- **Semester Bound**: `academic_terms.semester` validated between `1` and `8`.
