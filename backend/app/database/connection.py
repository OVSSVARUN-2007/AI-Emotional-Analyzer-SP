import os
from pathlib import Path
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

BASE_DIR = Path(__file__).resolve().parents[2]
load_dotenv(BASE_DIR / ".env")

db_user = os.getenv("DB_USER")
db_name = os.getenv("DB_NAME")
db_host = os.getenv("DB_HOST", "localhost")
db_port = os.getenv("DB_PORT", "5432")
db_pass = os.getenv("DB_PASSWORD", "")

sqlite_db_path = BASE_DIR / "database" / "student_feedback.db"
sqlite_url = f"sqlite:///{sqlite_db_path}"

engine = None

if db_user and db_name:
    try:
        from sqlalchemy.engine import URL
        postgres_url = URL.create(
            drivername="postgresql+psycopg",
            username=db_user,
            password=db_pass,
            host=db_host,
            port=int(db_port),
            database=db_name,
        )
        pg_engine = create_engine(postgres_url, echo=False)
        with pg_engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        engine = pg_engine
    except Exception:
        engine = None

if engine is None:
    sqlite_db_path.parent.mkdir(parents=True, exist_ok=True)
    engine = create_engine(sqlite_url, echo=False, connect_args={"check_same_thread": False})
    with engine.begin() as conn:
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS feedback (
                feedback_id INTEGER PRIMARY KEY AUTOINCREMENT,
                student_id INTEGER DEFAULT 1,
                offering_id INTEGER DEFAULT 1,
                feedback_text TEXT NOT NULL,
                submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                status VARCHAR(20) DEFAULT 'PENDING',
                is_anonymous BOOLEAN DEFAULT 1,
                semester INTEGER DEFAULT 5,
                class_section VARCHAR(50) DEFAULT 'Class 3A',
                course_code VARCHAR(30) DEFAULT 'AI501',
                course_name VARCHAR(150) DEFAULT 'Natural Language Processing'
            );
        """))

        # Ensure columns exist if table was already created
        fb_cols = [r[1] for r in conn.execute(text("PRAGMA table_info(feedback)")).fetchall()]
        for col_name, col_type in [
            ("semester", "INTEGER DEFAULT 5"),
            ("class_section", "VARCHAR(50) DEFAULT 'Class 3A'"),
            ("course_code", "VARCHAR(30) DEFAULT 'AI501'"),
            ("course_name", "VARCHAR(150) DEFAULT 'Natural Language Processing'"),
        ]:
            if col_name not in fb_cols:
                conn.execute(text(f"ALTER TABLE feedback ADD COLUMN {col_name} {col_type}"))

        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS predictions (
                prediction_id INTEGER PRIMARY KEY AUTOINCREMENT,
                feedback_id INTEGER,
                model_version_id INTEGER DEFAULT 1,
                sentiment VARCHAR(20),
                sentiment_confidence FLOAT,
                emotion VARCHAR(20),
                emotion_confidence FLOAT,
                predicted_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        """))
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS feedback_aspects (
                aspect_id INTEGER PRIMARY KEY AUTOINCREMENT,
                feedback_id INTEGER,
                aspect VARCHAR(50),
                aspect_sentiment VARCHAR(20),
                confidence FLOAT
            );
        """))
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS users (
                user_id INTEGER PRIMARY KEY AUTOINCREMENT,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(150) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                role VARCHAR(20) NOT NULL,
                is_active BOOLEAN DEFAULT 1,
                semester INTEGER DEFAULT 5,
                class_section VARCHAR(50) DEFAULT 'Class 3A',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        """))

        user_cols = [r[1] for r in conn.execute(text("PRAGMA table_info(users)")).fetchall()]
        for col_name, col_type in [
            ("semester", "INTEGER DEFAULT 5"),
            ("class_section", "VARCHAR(50) DEFAULT 'Class 3A'"),
        ]:
            if col_name not in user_cols:
                conn.execute(text(f"ALTER TABLE users ADD COLUMN {col_name} {col_type}"))

        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS courses (
                course_id INTEGER PRIMARY KEY AUTOINCREMENT,
                course_code VARCHAR(30) UNIQUE NOT NULL,
                course_name VARCHAR(150) NOT NULL,
                credits INTEGER DEFAULT 4,
                department_name VARCHAR(100) DEFAULT 'AI & Data Science',
                semester INTEGER NOT NULL
            );
        """))

        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS sections (
                section_id INTEGER PRIMARY KEY AUTOINCREMENT,
                class_name VARCHAR(50) NOT NULL,
                semester INTEGER NOT NULL,
                department_name VARCHAR(100) DEFAULT 'AI & Data Science'
            );
        """))

        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS course_offerings (
                offering_id INTEGER PRIMARY KEY AUTOINCREMENT,
                course_id INTEGER NOT NULL,
                faculty_id INTEGER DEFAULT 2,
                faculty_name VARCHAR(100) NOT NULL,
                class_section VARCHAR(50) NOT NULL,
                semester INTEGER NOT NULL,
                term_name VARCHAR(50) DEFAULT 'Fall 2026'
            );
        """))

        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS students (
                student_id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(150) UNIQUE NOT NULL,
                roll_number VARCHAR(50) NOT NULL,
                semester INTEGER NOT NULL,
                class_section VARCHAR(50) NOT NULL,
                department_name VARCHAR(100) DEFAULT 'AI & Data Science'
            );
        """))

        user_count = conn.execute(text("SELECT COUNT(*) FROM users")).scalar()
        if user_count == 0:
            conn.execute(text("""
                INSERT INTO users (name, email, password_hash, role, semester, class_section) VALUES
                ('Arunn Reddy', 'student@univ.edu', 'pass123', 'STUDENT', 5, 'Class 3A'),
                ('Dr. A. Sharma', 'faculty@univ.edu', 'pass123', 'FACULTY', 5, 'Class 3A'),
                ('Dean Academics', 'admin@univ.edu', 'pass123', 'ADMIN', 5, 'Class 3A'),
                ('Test Student', 'student@test.com', 'pass123', 'STUDENT', 5, 'Class 3A'),
                ('Test Faculty', 'faculty@test.com', 'pass123', 'FACULTY', 5, 'Class 3A'),
                ('Test Admin', 'admin@test.com', 'pass123', 'ADMIN', 5, 'Class 3A'),
                ('Priya Patel', 'priya@univ.edu', 'pass123', 'STUDENT', 3, 'Class 2A'),
                ('Rahul Verma', 'rahul@univ.edu', 'pass123', 'STUDENT', 5, 'Class 3B');
            """))

        # Seed Courses
        course_count = conn.execute(text("SELECT COUNT(*) FROM courses")).scalar()
        if course_count == 0:
            conn.execute(text("""
                INSERT INTO courses (course_id, course_code, course_name, credits, department_name, semester) VALUES
                (1, 'CS101', 'Intro to Programming & Problem Solving', 4, 'Computer Science', 1),
                (2, 'MA101', 'Engineering Mathematics I', 4, 'Mathematics', 1),
                (3, 'PH101', 'Engineering Physics', 3, 'Physics', 1),
                (4, 'CS201', 'Data Structures & Algorithms', 4, 'Computer Science', 3),
                (5, 'CS204', 'Operating Systems', 4, 'Computer Science', 3),
                (6, 'MA201', 'Discrete Mathematics', 3, 'Mathematics', 3),
                (7, 'AI501', 'Natural Language Processing', 4, 'AI & Data Science', 5),
                (8, 'AI502', 'Machine Learning', 4, 'AI & Data Science', 5),
                (9, 'CS501', 'Computer Networks', 4, 'Computer Science', 5),
                (10, 'CS502', 'Database Management Systems', 4, 'Computer Science', 5),
                (11, 'AI601', 'Deep Learning & Neural Networks', 4, 'AI & Data Science', 6),
                (12, 'CS602', 'Cloud Computing & DevOps', 3, 'Computer Science', 6),
                (13, 'CS603', 'Information & Cyber Security', 3, 'Computer Science', 6),
                (14, 'AI701', 'Generative AI & LLMs', 4, 'AI & Data Science', 7),
                (15, 'CS702', 'Distributed Systems', 4, 'Computer Science', 7);
            """))

        # Seed Sections
        sec_count = conn.execute(text("SELECT COUNT(*) FROM sections")).scalar()
        if sec_count == 0:
            conn.execute(text("""
                INSERT INTO sections (class_name, semester, department_name) VALUES
                ('Class 1A', 1, 'Computer Science'),
                ('Class 2A', 3, 'Computer Science'),
                ('Class 2B', 3, 'Computer Science'),
                ('Class 3A', 5, 'AI & Data Science'),
                ('Class 3B', 5, 'AI & Data Science'),
                ('Class 4A', 7, 'AI & Data Science');
            """))

        # Seed Course Offerings
        offering_count = conn.execute(text("SELECT COUNT(*) FROM course_offerings")).scalar()
        if offering_count == 0:
            conn.execute(text("""
                INSERT INTO course_offerings (offering_id, course_id, faculty_name, class_section, semester, term_name) VALUES
                (1, 7, 'Dr. A. Sharma', 'Class 3A', 5, 'Fall 2026'),
                (2, 8, 'Prof. R. Menon', 'Class 3A', 5, 'Fall 2026'),
                (3, 9, 'Dr. S. Nair', 'Class 3A', 5, 'Fall 2026'),
                (4, 10, 'Dr. K. Iyer', 'Class 3A', 5, 'Fall 2026'),
                (5, 7, 'Dr. A. Sharma', 'Class 3B', 5, 'Fall 2026'),
                (6, 8, 'Prof. R. Menon', 'Class 3B', 5, 'Fall 2026'),
                (7, 9, 'Dr. S. Nair', 'Class 3B', 5, 'Fall 2026'),
                (8, 10, 'Dr. K. Iyer', 'Class 3B', 5, 'Fall 2026'),
                (9, 4, 'Dr. A. Sharma', 'Class 2A', 3, 'Fall 2026'),
                (10, 5, 'Prof. R. Menon', 'Class 2A', 3, 'Fall 2026'),
                (11, 6, 'Dr. K. Iyer', 'Class 2A', 3, 'Fall 2026'),
                (12, 1, 'Dr. A. Sharma', 'Class 1A', 1, 'Fall 2026'),
                (13, 2, 'Dr. K. Iyer', 'Class 1A', 1, 'Fall 2026'),
                (14, 3, 'Dr. V. Raman', 'Class 1A', 1, 'Fall 2026'),
                (15, 14, 'Dr. A. Sharma', 'Class 4A', 7, 'Fall 2026');
            """))

        # Seed Students
        stud_count = conn.execute(text("SELECT COUNT(*) FROM students")).scalar()
        if stud_count == 0:
            conn.execute(text("""
                INSERT INTO students (name, email, roll_number, semester, class_section, department_name) VALUES
                ('Arunn Reddy', 'student@univ.edu', '2024-AI-042', 5, 'Class 3A', 'AI & Data Science'),
                ('Test Student', 'student@test.com', 'TEST-AIDS-001', 5, 'Class 3A', 'AI & Data Science'),
                ('Priya Patel', 'priya@univ.edu', '2025-CS-018', 3, 'Class 2A', 'Computer Science'),
                ('Rahul Verma', 'rahul@univ.edu', '2024-AI-077', 5, 'Class 3B', 'AI & Data Science'),
                ('Ananya Sen', 'ananya@univ.edu', '2026-CS-005', 1, 'Class 1A', 'Computer Science');
            """))

        # Ensure feedback rows 1 to 5 exist for test compatibility and class-wise analytics
        fb5 = conn.execute(text("SELECT feedback_id FROM feedback WHERE feedback_id = 5")).fetchone()
        if not fb5:
            conn.execute(text("""
                INSERT OR REPLACE INTO feedback (
                    feedback_id, student_id, offering_id, feedback_text, status, is_anonymous,
                    semester, class_section, course_code, course_name
                ) VALUES (
                    5, 2, 9,
                    'The graph algorithm explanations and visualization slides made difficult concepts much simpler to grasp.',
                    'ANALYZED', 1, 3, 'Class 2A', 'CS201', 'Data Structures & Algorithms'
                );
            """))
            conn.execute(text("""
                INSERT OR REPLACE INTO predictions (
                    prediction_id, feedback_id, model_version_id, sentiment, sentiment_confidence,
                    emotion, emotion_confidence
                ) VALUES (
                    5, 5, 1, 'POSITIVE', 0.95, 'satisfaction', 0.92
                );
            """))
            conn.execute(text("""
                INSERT INTO feedback_aspects (feedback_id, aspect, aspect_sentiment, confidence) VALUES
                (5, 'Teaching', 'POSITIVE', 0.95),
                (5, 'Materials', 'POSITIVE', 0.91);
            """))

        # Update initial feedbacks to have proper class and semester
        conn.execute(text("""
            UPDATE feedback SET semester = 5, class_section = 'Class 3A', course_code = 'AI501', course_name = 'Natural Language Processing'
            WHERE feedback_id = 1;
        """))
        conn.execute(text("""
            UPDATE feedback SET semester = 5, class_section = 'Class 3A', course_code = 'AI502', course_name = 'Machine Learning'
            WHERE feedback_id = 2;
        """))
        conn.execute(text("""
            UPDATE feedback SET semester = 5, class_section = 'Class 3B', course_code = 'AI501', course_name = 'Natural Language Processing'
            WHERE feedback_id = 3;
        """))
        conn.execute(text("""
            UPDATE feedback SET semester = 5, class_section = 'Class 3A', course_code = 'CS501', course_name = 'Computer Networks'
            WHERE feedback_id = 4;
        """))

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)