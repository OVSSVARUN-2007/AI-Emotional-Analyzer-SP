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


        # Ensure faculty table exists
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS faculty (
                faculty_id INTEGER PRIMARY KEY AUTOINCREMENT,
                name VARCHAR(100) UNIQUE NOT NULL,
                department VARCHAR(100) DEFAULT 'Science & Technology',
                email VARCHAR(150)
            );
        """))

        # Seed Sections A through K
        for sec_name in ["Section A", "Section B", "Section C", "Section D", "Section E", "Section F", "Section G", "Section H", "Section I", "Section J", "Section K"]:
            for sem_val in [3, 5, 7]:
                conn.execute(text("""
                    INSERT OR IGNORE INTO sections (class_name, semester, department_name)
                    VALUES (:cname, :sem, 'Faculty of Science & Technology')
                """), {"cname": sec_name, "sem": sem_val})

        # Seed official courses from exam schedule
        for c_data in [{"course_code": "ES201", "course_name": "OBJECT ORIENTED PROGRAMMING CONCEPTS", "program": "B.Tech", "department": "Computer Science", "semester": 3, "year_sem": "2nd Year (Sem 3)", "faculty_name": "Dr Ramesh Ponnala", "exam_date": "16-Sep-2026 (Morning)"}, {"course_code": "DS401", "course_name": "HUMAN COMPUTER INTERACTION", "program": "B.Tech", "department": "Data Science", "semester": 7, "year_sem": "4th Year (Sem 7)", "faculty_name": "Dr. Surya Samantha. B", "exam_date": "16-Sep-2026 (Morning)"}, {"course_code": "BCA408", "course_name": "ARTIFICIAL INTELLIGENCE", "program": "BCA", "department": "Computer Applications (BCA)", "semester": 5, "year_sem": "3rd Year (Sem 5)", "faculty_name": "Dr.K.Bhargavi", "exam_date": "16-Sep-2026 (Morning)"}, {"course_code": "BSCS302/BSDA302", "course_name": "Computer Networks", "program": "BSC", "department": "B.Sc Computer Science", "semester": 5, "year_sem": "3rd Year (Sem 5)", "faculty_name": "Mr Girish Kulkarni", "exam_date": "16-Sep-2026 (Morning)"}, {"course_code": "EC410", "course_name": "LOW POWER VLSI DESIGN", "program": "B.Tech", "department": "Electronics & Communication", "semester": 7, "year_sem": "4th Year (Sem 7)", "faculty_name": "Dr. Akhendra Kumar P", "exam_date": "16-Sep-2026 (Morning)"}, {"course_code": "ME401", "course_name": "ADDITIVE MANUFACTURING", "program": "B.Tech", "department": "Mechanical Engineering", "semester": 7, "year_sem": "4th Year (Sem 7)", "faculty_name": "Ms. PRIYANKA CHATTORAJ", "exam_date": "16-Sep-2026 (Morning)"}, {"course_code": "BSPH303", "course_name": "ADVANCED MATHEMATICAL METHODS FOR PHYSICS", "program": "BSC", "department": "B.Sc Physics", "semester": 5, "year_sem": "3rd Year (Sem 5)", "faculty_name": "Dr. THOKALA SOLOMAN RAJU", "exam_date": "16-Sep-2026 (Morning)"}, {"course_code": "CS305", "course_name": "SOFTWARE ENGINEERING", "program": "B.Tech", "department": "Computer Science", "semester": 5, "year_sem": "3rd Year (Sem 5)", "faculty_name": "Dr Sandeep Kumar Panda", "exam_date": "16-Sep-2026 (Afternoon)"}, {"course_code": "BCA102", "course_name": "PROBABILITY & STATISTICS", "program": "BCA", "department": "Computer Applications (BCA)", "semester": 3, "year_sem": "2nd Year (Sem 3)", "faculty_name": "Dr. Sunil", "exam_date": "16-Sep-2026 (Afternoon)"}, {"course_code": "DS307", "course_name": "COMPUTER VISION", "program": "B.Tech", "department": "Data Science", "semester": 5, "year_sem": "3rd Year (Sem 5)", "faculty_name": "Dr Suresh N", "exam_date": "16-Sep-2026 (Afternoon)"}, {"course_code": "AI301", "course_name": "PREDICTIVE ANALYTICS", "program": "B.Tech", "department": "Artificial Intelligence & Data Science", "semester": 5, "year_sem": "3rd Year (Sem 5)", "faculty_name": "Mr Madhav", "exam_date": "16-Sep-2026 (Afternoon)"}, {"course_code": "AIM301", "course_name": "SOFT COMPUTING", "program": "B.Tech", "department": "Artificial Intelligence & Data Science", "semester": 5, "year_sem": "3rd Year (Sem 5)", "faculty_name": "Dr Pallavi Mishra", "exam_date": "16-Sep-2026 (Afternoon)"}, {"course_code": "AEC103", "course_name": "ACADEMIC READING AND WRITING", "program": "BSC", "department": "Electronics & Communication", "semester": 3, "year_sem": "2nd Year (Sem 3)", "faculty_name": "Dr. Swathi", "exam_date": "16-Sep-2026 (Afternoon)"}, {"course_code": "EC321", "course_name": "ANALOG AND DIGITAL COMMUNICATION", "program": "B.Tech", "department": "Electronics & Communication", "semester": 5, "year_sem": "3rd Year (Sem 5)", "faculty_name": "Dr. Syed Shakeel H", "exam_date": "16-Sep-2026 (Afternoon)"}, {"course_code": "ME305", "course_name": "CAD/CAM", "program": "B.Tech", "department": "Mechanical Engineering", "semester": 5, "year_sem": "3rd Year (Sem 5)", "faculty_name": "Dr. A MANMADHA CHARY", "exam_date": "16-Sep-2026 (Afternoon)"}, {"course_code": "BS105", "course_name": "PROBABILITY & STATISTICS", "program": "B.Tech", "department": "Computer Science", "semester": 3, "year_sem": "2nd Year (Sem 3)", "faculty_name": "Dr. Divya", "exam_date": "17-Sep-2026 (Morning)"}, {"course_code": "MG401", "course_name": "INTRODUCTION TO ENTREPRENEURSHIP", "program": "B.Tech", "department": "Computer Science", "semester": 7, "year_sem": "4th Year (Sem 7)", "faculty_name": "Dr H Sudheer", "exam_date": "17-Sep-2026 (Morning)"}, {"course_code": "HS206", "course_name": "PROFESSIONAL ETHICS", "program": "B.Tech", "department": "Computer Science", "semester": 7, "year_sem": "4th Year (Sem 7)", "faculty_name": "Dr. SOMDATTA MUKHERJEE", "exam_date": "17-Sep-2026 (Morning)"}, {"course_code": "BCA409", "course_name": "BIG DATA SYSTEMS", "program": "BCA", "department": "Computer Applications (BCA)", "semester": 5, "year_sem": "3rd Year (Sem 5)", "faculty_name": "Mr Arram Sriram", "exam_date": "17-Sep-2026 (Morning)"}, {"course_code": "BSCS305", "course_name": "Software Engineering", "program": "BSC", "department": "B.Sc Computer Science", "semester": 5, "year_sem": "3rd Year (Sem 5)", "faculty_name": "Dr S Jayanthi", "exam_date": "17-Sep-2026 (Morning)"}, {"course_code": "BSPH302", "course_name": "ELECTRONICS-I", "program": "BSC", "department": "B.Sc Physics", "semester": 5, "year_sem": "3rd Year (Sem 5)", "faculty_name": "Dr.Ashwin Kumar", "exam_date": "17-Sep-2026 (Morning)"}, {"course_code": "CR301", "course_name": "POWER SKILLS-III", "program": "B.Tech", "department": "Computer Science", "semester": 5, "year_sem": "3rd Year (Sem 5)", "faculty_name": "Ms. Sai Prasanna", "exam_date": "17-Sep-2026 (Afternoon)"}, {"course_code": "BCA224", "course_name": "SOFTWARE ENGINEERING", "program": "BCA", "department": "Computer Applications (BCA)", "semester": 3, "year_sem": "2nd Year (Sem 3)", "faculty_name": "Dr S Jayanthi", "exam_date": "17-Sep-2026 (Afternoon)"}, {"course_code": "SEC103", "course_name": "IMPACTFUL PRESENTATIONS", "program": "BSC", "department": "Electronics & Communication", "semester": 3, "year_sem": "2nd Year (Sem 3)", "faculty_name": "Dr Madhupama", "exam_date": "17-Sep-2026 (Afternoon)"}, {"course_code": "CR201", "course_name": "POWER SKILLS - I", "program": "B.Tech", "department": "Computer Science", "semester": 3, "year_sem": "2nd Year (Sem 3)", "faculty_name": "Dr K Ramesh", "exam_date": "18-Sep-2026 (Morning)"}, {"course_code": "CS307", "course_name": "CLOUD COMPUTING", "program": "B.Tech", "department": "Computer Science", "semester": 7, "year_sem": "4th Year (Sem 7)", "faculty_name": "Dr K Vara Prasada Rao", "exam_date": "18-Sep-2026 (Morning)"}, {"course_code": "DS311", "course_name": "NATURAL LANGUAGE PROCESSING", "program": "B.Tech", "department": "Data Science", "semester": 7, "year_sem": "4th Year (Sem 7)", "faculty_name": "Dr Kuncham Sreenivasa Rao", "exam_date": "18-Sep-2026 (Morning)"}, {"course_code": "BCA424", "course_name": "INFORMATION SECURITY", "program": "BCA", "department": "Computer Applications (BCA)", "semester": 5, "year_sem": "3rd Year (Sem 5)", "faculty_name": "Dr.T.Bharath Kumar", "exam_date": "18-Sep-2026 (Morning)"}, {"course_code": "BSDA309", "course_name": "DATA VISUALISATION", "program": "BSC", "department": "B.Sc Data Analytics", "semester": 5, "year_sem": "3rd Year (Sem 5)", "faculty_name": "Mr. Abhiram D", "exam_date": "18-Sep-2026 (Morning)"}, {"course_code": "BSDA304", "course_name": "Cryptography and Network Security", "program": "BSC", "department": "B.Sc Data Analytics", "semester": 5, "year_sem": "3rd Year (Sem 5)", "faculty_name": "Mr Girish Kulkarni", "exam_date": "18-Sep-2026 (Morning)"}, {"course_code": "EC409", "course_name": "SMART ANTENNAS FOR MOBILE COMMUNICATION", "program": "B.Tech", "department": "Electronics & Communication", "semester": 7, "year_sem": "4th Year (Sem 7)", "faculty_name": "Dr. Sankar Ponnapalli", "exam_date": "18-Sep-2026 (Morning)"}, {"course_code": "MT403", "course_name": "ADVANCES IN ROBOTICS", "program": "B.Tech", "department": "Computer Science", "semester": 7, "year_sem": "4th Year (Sem 7)", "faculty_name": "Dr. CHANDRA SHEKHAR A", "exam_date": "18-Sep-2026 (Morning)"}, {"course_code": "BCA223 - ACC", "course_name": "COMPUTER NETWORKS", "program": "BCA", "department": "Computer Applications (BCA)", "semester": 5, "year_sem": "3rd Year (Sem 5)", "faculty_name": "JOYDEEP ROY", "exam_date": "18-Sep-2026 (Morning)"}, {"course_code": "HS301", "course_name": "CONSTITUTION OF INDIA", "program": "B.Tech", "department": "Computer Science", "semester": 5, "year_sem": "3rd Year (Sem 5)", "faculty_name": "Dr. GURSINGA LAKSHMAN KUMAR", "exam_date": "18-Sep-2026 (Afternoon)"}, {"course_code": "SHAE401", "course_name": "ACADEMIC READING AND WRITING", "program": "BCA", "department": "Computer Applications (BCA)", "semester": 3, "year_sem": "2nd Year (Sem 3)", "faculty_name": "Dr Swathi", "exam_date": "18-Sep-2026 (Afternoon)"}, {"course_code": "IDSC113", "course_name": "FOUNDATIONS OF ENTREPRENEURAL THINKING AND PRACTICE", "program": "BSC", "department": "Data Science", "semester": 3, "year_sem": "2nd Year (Sem 3)", "faculty_name": "Dr Isha Jha", "exam_date": "18-Sep-2026 (Afternoon)"}, {"course_code": "BSRA202", "course_name": "BASIC ELECTRICAL AND ELECTRONICS ENGINEERING", "program": "BSC", "department": "B.Sc Robotics", "semester": 3, "year_sem": "2nd Year (Sem 3)", "faculty_name": "Dr. Akhendra Kumar P", "exam_date": "18-Sep-2026 (Afternoon)"}, {"course_code": "AI203/AIM203/CS203/DS203", "course_name": "ARTIFICIAL INTELLIGENCE", "program": "B.Tech", "department": "Artificial Intelligence & Data Science", "semester": 3, "year_sem": "2nd Year (Sem 3)", "faculty_name": "Dr R Balamurali", "exam_date": "21-Sep-2026 (Morning)"}, {"course_code": "DS408", "course_name": "GENERATIVE AI", "program": "B.Tech", "department": "Data Science", "semester": 7, "year_sem": "4th Year (Sem 7)", "faculty_name": "Dr Sarit Chanda", "exam_date": "21-Sep-2026 (Morning)"}, {"course_code": "BCA311", "course_name": "MACHINE LEARNING", "program": "BCA", "department": "Computer Applications (BCA)", "semester": 5, "year_sem": "3rd Year (Sem 5)", "faculty_name": "Dr.T.Aruna Sri", "exam_date": "21-Sep-2026 (Morning)"}, {"course_code": "BSCS301", "course_name": "Design and Analysis of Algorithms", "program": "BSC", "department": "B.Sc Computer Science", "semester": 5, "year_sem": "3rd Year (Sem 5)", "faculty_name": "Dr B Deevena Raju", "exam_date": "21-Sep-2026 (Morning)"}, {"course_code": "BSDA301", "course_name": "Data Wrangling", "program": "BSC", "department": "B.Sc Data Analytics", "semester": 5, "year_sem": "3rd Year (Sem 5)", "faculty_name": "Mr. Abhiram D", "exam_date": "21-Sep-2026 (Morning)"}, {"course_code": "EC224", "course_name": "ELECTRONIC DEVICES", "program": "B.Tech", "department": "Electronics & Communication", "semester": 3, "year_sem": "2nd Year (Sem 3)", "faculty_name": "Dr. Kousik Midya", "exam_date": "21-Sep-2026 (Morning)"}, {"course_code": "ME202", "course_name": "ENGINEERING MATERIALS", "program": "B.Tech", "department": "Mechanical Engineering", "semester": 3, "year_sem": "2nd Year (Sem 3)", "faculty_name": "Dr. AVINASH MALLADI", "exam_date": "21-Sep-2026 (Morning)"}, {"course_code": "EC407", "course_name": "RADAR SYSTEMS", "program": "B.Tech", "department": "Electronics & Communication", "semester": 7, "year_sem": "4th Year (Sem 7)", "faculty_name": "Dr.Mallavarapu Sandhya", "exam_date": "21-Sep-2026 (Morning)"}, {"course_code": "ME408", "course_name": "COMPUTATIONAL FLUID DYNAMICS", "program": "B.Tech", "department": "Mechanical Engineering", "semester": 7, "year_sem": "4th Year (Sem 7)", "faculty_name": "Dr. M L PAVAN KISHORE", "exam_date": "21-Sep-2026 (Morning)"}, {"course_code": "BSPH410", "course_name": "MATERIAL PHYSICS", "program": "BSC", "department": "B.Sc Physics", "semester": 5, "year_sem": "3rd Year (Sem 5)", "faculty_name": "Dr. Elizabeth Zacharias", "exam_date": "21-Sep-2026 (Morning)"}, {"course_code": "BCA211", "course_name": "OBJECT ORIENTED ANALYSIS AND DESIGN", "program": "BCA", "department": "Computer Applications (BCA)", "semester": 5, "year_sem": "3rd Year (Sem 5)", "faculty_name": "Mr. Mohammed Kaleem", "exam_date": "21-Sep-2026 (Morning)"}, {"course_code": "AI302/AIM302/CS302/DS302", "course_name": "COMPUTER NETWORKS", "program": "B.Tech", "department": "Artificial Intelligence & Data Science", "semester": 5, "year_sem": "3rd Year (Sem 5)", "faculty_name": "Dr. K. Sridevi", "exam_date": "21-Sep-2026 (Afternoon)"}, {"course_code": "BCA214", "course_name": "DATA STRUCTURES AND ALGORITHMS", "program": "BCA", "department": "Computer Applications (BCA)", "semester": 3, "year_sem": "2nd Year (Sem 3)", "faculty_name": "Dr. P. Chakradhar", "exam_date": "21-Sep-2026 (Afternoon)"}, {"course_code": "BSCS201", "course_name": "OBJECT ORIENTED ANALYSIS AND DESIGN", "program": "BSC", "department": "B.Sc Computer Science", "semester": 3, "year_sem": "2nd Year (Sem 3)", "faculty_name": "Mr. Mohammed Kaleem", "exam_date": "21-Sep-2026 (Afternoon)"}, {"course_code": "EC323", "course_name": "DIGITAL VLSI DESIGN", "program": "B.Tech", "department": "Electronics & Communication", "semester": 5, "year_sem": "3rd Year (Sem 5)", "faculty_name": "Dr. Rajesh Kumar Jha", "exam_date": "21-Sep-2026 (Afternoon)"}, {"course_code": "BSRA201", "course_name": "ENGINEERING MECHANICS", "program": "BSC", "department": "B.Sc Robotics", "semester": 3, "year_sem": "2nd Year (Sem 3)", "faculty_name": "Dr. M L Pavan Kishore", "exam_date": "21-Sep-2026 (Afternoon)"}, {"course_code": "BSPH202", "course_name": "INTRODUCTORY MATHEMATICAL METHODS FOR PHYSICS", "program": "BSC", "department": "B.Sc Physics", "semester": 3, "year_sem": "2nd Year (Sem 3)", "faculty_name": "Dr. Shreecharan", "exam_date": "21-Sep-2026 (Afternoon)"}, {"course_code": "ME302", "course_name": "DESIGN OF MACHINE ELEMENTS", "program": "B.Tech", "department": "Mechanical Engineering", "semester": 5, "year_sem": "3rd Year (Sem 5)", "faculty_name": "Dr. M L Pavan Kishore", "exam_date": "21-Sep-2026 (Afternoon)"}, {"course_code": "BSMA202", "course_name": "DISCRETE MATHEMATICS", "program": "BSC", "department": "B.Sc Mathematics", "semester": 3, "year_sem": "2nd Year (Sem 3)", "faculty_name": "Dr. Ramesh", "exam_date": "21-Sep-2026 (Afternoon)"}, {"course_code": "AI204/AIM204/CS204/DS204", "course_name": "DESIGN AND ANALYSIS OF ALGORITHMS", "program": "B.Tech", "department": "Artificial Intelligence & Data Science", "semester": 3, "year_sem": "2nd Year (Sem 3)", "faculty_name": "Dr Dileep Kumar Murala", "exam_date": "22-Sep-2026 (Morning)"}, {"course_code": "CS305", "course_name": "COMPUTER VISION", "program": "B.Tech", "department": "Computer Science", "semester": 7, "year_sem": "4th Year (Sem 7)", "faculty_name": "Dr. E.L.N. Kiran Kumar", "exam_date": "22-Sep-2026 (Morning)"}, {"course_code": "BSCS304", "course_name": "Theory of Computation", "program": "BSC", "department": "B.Sc Computer Science", "semester": 5, "year_sem": "3rd Year (Sem 5)", "faculty_name": "Dr.Pradosh Kumar Gantayat", "exam_date": "22-Sep-2026 (Morning)"}, {"course_code": "BSDA303", "course_name": "Machine Learning", "program": "BSC", "department": "B.Sc Data Analytics", "semester": 5, "year_sem": "3rd Year (Sem 5)", "faculty_name": "Dr. Nafis Uddin Khan", "exam_date": "22-Sep-2026 (Morning)"}, {"course_code": "EC222", "course_name": "CIRCUIT THEORY", "program": "B.Tech", "department": "Electronics & Communication", "semester": 3, "year_sem": "2nd Year (Sem 3)", "faculty_name": "Dr. D. V. Nair", "exam_date": "22-Sep-2026 (Morning)"}, {"course_code": "ME201", "course_name": "ENGINEERING MECHANICS", "program": "B.Tech", "department": "Mechanical Engineering", "semester": 3, "year_sem": "2nd Year (Sem 3)", "faculty_name": "Dr. M L Pavan Kishore", "exam_date": "22-Sep-2026 (Morning)"}, {"course_code": "EC414", "course_name": "VLSI TESTING AND TESTABILITY", "program": "B.Tech", "department": "Electronics & Communication", "semester": 7, "year_sem": "4th Year (Sem 7)", "faculty_name": "Dr. Rajesh Kumar Jha", "exam_date": "22-Sep-2026 (Morning)"}, {"course_code": "ME414", "course_name": "NON CONVENTIONAL SOURCES OF ENERGY", "program": "B.Tech", "department": "Mechanical Engineering", "semester": 7, "year_sem": "4th Year (Sem 7)", "faculty_name": "Dr Suresh Kumar Grandhi", "exam_date": "22-Sep-2026 (Morning)"}, {"course_code": "BSPH301", "course_name": "MODERN PHYSICS", "program": "BSC", "department": "B.Sc Physics", "semester": 5, "year_sem": "3rd Year (Sem 5)", "faculty_name": "Dr. Shreecharan", "exam_date": "22-Sep-2026 (Morning)"}, {"course_code": "BCA222", "course_name": "WEB ENABLED TECHNOLOGIES", "program": "BCA", "department": "Computer Applications (BCA)", "semester": 5, "year_sem": "3rd Year (Sem 5)", "faculty_name": "A SRIRAM", "exam_date": "22-Sep-2026 (Morning)"}, {"course_code": "AI303/AIM303/DS303", "course_name": "BLOCKCHAIN TECHNOLOGY", "program": "B.Tech", "department": "Artificial Intelligence & Data Science", "semester": 5, "year_sem": "3rd Year (Sem 5)", "faculty_name": "Dr.TAMMINEEDI VENKATA SATYA VIVEK", "exam_date": "22-Sep-2026 (Afternoon)"}, {"course_code": "BCA212", "course_name": "DATABASE MANAGEMENT SYSTEMS", "program": "BCA", "department": "Computer Applications (BCA)", "semester": 3, "year_sem": "2nd Year (Sem 3)", "faculty_name": "K LOKESH REDDY", "exam_date": "22-Sep-2026 (Afternoon)"}, {"course_code": "BSDA301", "course_name": "DATA WRANGLING", "program": "BSC", "department": "B.Sc Data Analytics", "semester": 3, "year_sem": "2nd Year (Sem 3)", "faculty_name": "Mr. Abhiram D", "exam_date": "22-Sep-2026 (Afternoon)"}, {"course_code": "BSCS206", "course_name": "DATABASE MANAGEMENT SYSTEMS", "program": "BSC", "department": "B.Sc Computer Science", "semester": 3, "year_sem": "2nd Year (Sem 3)", "faculty_name": "Dr Suresh Kumar Grandhi", "exam_date": "22-Sep-2026 (Afternoon)"}, {"course_code": "EC322", "course_name": "MICROPROCESSOR PROGRAMMING AND INTERFACING", "program": "B.Tech", "department": "Electronics & Communication", "semester": 5, "year_sem": "3rd Year (Sem 5)", "faculty_name": "Dr. D. V. Nair", "exam_date": "22-Sep-2026 (Afternoon)"}, {"course_code": "BSRA203", "course_name": "MACHINE LEARNING", "program": "BSC", "department": "B.Sc Robotics", "semester": 3, "year_sem": "2nd Year (Sem 3)", "faculty_name": "Dr. A MANMADHA CHARY", "exam_date": "22-Sep-2026 (Afternoon)"}, {"course_code": "ME304", "course_name": "HEAT AND MASS TRANSFER", "program": "B.Tech", "department": "Mechanical Engineering", "semester": 5, "year_sem": "3rd Year (Sem 5)", "faculty_name": "Mr. VENUGOPAL CHITTEMSETTY", "exam_date": "22-Sep-2026 (Afternoon)"}, {"course_code": "CS201/EC201", "course_name": "INTRODUCTION TO IOT", "program": "B.Tech", "department": "Electronics & Communication", "semester": 3, "year_sem": "2nd Year (Sem 3)", "faculty_name": "Dr. V. A. Sankar Ponnapalli", "exam_date": "23-Sep-2026 (Morning)"}, {"course_code": "CS415", "course_name": "ETHICAL HACKING", "program": "B.Tech", "department": "Computer Science", "semester": 7, "year_sem": "4th Year (Sem 7)", "faculty_name": "Dr Sowjanya Ramisetty", "exam_date": "23-Sep-2026 (Morning)"}, {"course_code": "ES202", "course_name": "INDUSTRY CODING PRACTICES", "program": "B.Tech", "department": "Computer Science", "semester": 3, "year_sem": "2nd Year (Sem 3)", "faculty_name": "Dr.Sathya AR", "exam_date": "23-Sep-2026 (Morning)"}, {"course_code": "BSCS303", "course_name": "Web Enabled Technologies", "program": "BSC", "department": "B.Sc Computer Science", "semester": 5, "year_sem": "3rd Year (Sem 5)", "faculty_name": "Mr Arram Sriram", "exam_date": "23-Sep-2026 (Morning)"}, {"course_code": "BSDA305", "course_name": "Predictive Analytics", "program": "BSC", "department": "B.Sc Data Analytics", "semester": 5, "year_sem": "3rd Year (Sem 5)", "faculty_name": "Dr Kuncham Sreenivasa Rao", "exam_date": "23-Sep-2026 (Morning)"}, {"course_code": "EC308", "course_name": "EMBEDDED SYSTEMS", "program": "B.Tech", "department": "Electronics & Communication", "semester": 7, "year_sem": "4th Year (Sem 7)", "faculty_name": "Dr.Rajesh Jha", "exam_date": "23-Sep-2026 (Morning)"}, {"course_code": "ME204", "course_name": "FLUID MECHANICS", "program": "B.Tech", "department": "Mechanical Engineering", "semester": 3, "year_sem": "2nd Year (Sem 3)", "faculty_name": "Ms. PRIYANKA CHATTORAJ", "exam_date": "23-Sep-2026 (Morning)"}, {"course_code": "AI305/AIM305/DS305", "course_name": "DATA WRANGLING AND VISUALIZATION", "program": "B.Tech", "department": "Artificial Intelligence & Data Science", "semester": 5, "year_sem": "3rd Year (Sem 5)", "faculty_name": "Mr.Senthil Raja", "exam_date": "23-Sep-2026 (Afternoon)"}, {"course_code": "CS301", "course_name": "PRINCIPLE OF CRYPTOGRAPHY", "program": "B.Tech", "department": "Computer Science", "semester": 5, "year_sem": "3rd Year (Sem 5)", "faculty_name": "Dr. K. Adi Narayana Reddy", "exam_date": "23-Sep-2026 (Afternoon)"}, {"course_code": "SHIM407", "course_name": "IMPACTFUL PRESENTATIONS", "program": "BCA", "department": "Computer Applications (BCA)", "semester": 3, "year_sem": "2nd Year (Sem 3)", "faculty_name": "Dr Madhupama", "exam_date": "23-Sep-2026 (Afternoon)"}, {"course_code": "BSCS202", "course_name": "DATA STRUCTURES", "program": "BSC", "department": "B.Sc Computer Science", "semester": 3, "year_sem": "2nd Year (Sem 3)", "faculty_name": "Dr. Priyanka Parimi", "exam_date": "23-Sep-2026 (Afternoon)"}, {"course_code": "BSCS205", "course_name": "COMPUTER ORGANIZATION & ARCHITECTURE", "program": "BSC", "department": "B.Sc Computer Science", "semester": 3, "year_sem": "2nd Year (Sem 3)", "faculty_name": "Dr. Santosh Kumar Sahoo", "exam_date": "23-Sep-2026 (Afternoon)"}, {"course_code": "EC325", "course_name": "RF AND MICROWAVE ENGINEERING", "program": "B.Tech", "department": "Electronics & Communication", "semester": 5, "year_sem": "3rd Year (Sem 5)", "faculty_name": "Dr. Soumit Samadder Chaudhury", "exam_date": "23-Sep-2026 (Afternoon)"}, {"course_code": "BSRA204", "course_name": "MICROPROCESSOR AND MICROCONTROLLER", "program": "BSC", "department": "B.Sc Robotics", "semester": 3, "year_sem": "2nd Year (Sem 3)", "faculty_name": "Dr. BARLA MADHAVI", "exam_date": "23-Sep-2026 (Afternoon)"}, {"course_code": "BSPH201", "course_name": "WAVES AND OSCILLATIONS", "program": "BSC", "department": "B.Sc Physics", "semester": 3, "year_sem": "2nd Year (Sem 3)", "faculty_name": "Dr. THOKALA SOLOMAN RAJU", "exam_date": "23-Sep-2026 (Afternoon)"}, {"course_code": "ME303", "course_name": "INDUSTRIAL INTERNET OF THINGS", "program": "B.Tech", "department": "Mechanical Engineering", "semester": 5, "year_sem": "3rd Year (Sem 5)", "faculty_name": "Dr. CHANDRA SHEKHAR A", "exam_date": "23-Sep-2026 (Afternoon)"}, {"course_code": "BSMA201", "course_name": "GROUP THEORY", "program": "BSC", "department": "B.Sc Mathematics", "semester": 3, "year_sem": "2nd Year (Sem 3)", "faculty_name": "Dr. Rakesh Reddy", "exam_date": "23-Sep-2026 (Afternoon)"}, {"course_code": "AIM206/DS206", "course_name": "COMPUTER ORGANIZATION AND ARCHITECTURE", "program": "B.Tech", "department": "Artificial Intelligence & Data Science", "semester": 3, "year_sem": "2nd Year (Sem 3)", "faculty_name": "Dr. Sukanta Das", "exam_date": "24-Sep-2026 (Morning)"}, {"course_code": "MG201", "course_name": "ENGINEERING ECONOMICS AND MANAGEMENT", "program": "B.Tech", "department": "Computer Science", "semester": 3, "year_sem": "2nd Year (Sem 3)", "faculty_name": "Dr Balaji Vejju", "exam_date": "24-Sep-2026 (Morning)"}, {"course_code": "DS306", "course_name": "DEEP LEARNING", "program": "B.Tech", "department": "Data Science", "semester": 7, "year_sem": "4th Year (Sem 7)", "faculty_name": "Dr. Srinivasa Rao Kongara", "exam_date": "24-Sep-2026 (Morning)"}, {"course_code": "CS413", "course_name": "QUANTUM COMPUTING", "program": "B.Tech", "department": "Computer Science", "semester": 7, "year_sem": "4th Year (Sem 7)", "faculty_name": "Dr.B.SEETHARAMULU", "exam_date": "24-Sep-2026 (Morning)"}, {"course_code": "AI304/CS304", "course_name": "MACHINE LEARNING", "program": "B.Tech", "department": "Artificial Intelligence & Data Science", "semester": 5, "year_sem": "3rd Year (Sem 5)", "faculty_name": "Dr. Nafis Uddin Khan", "exam_date": "24-Sep-2026 (Afternoon)"}, {"course_code": "DS301", "course_name": "METAHEURISTIC OPTIMIZATION TECHNIQUES", "program": "B.Tech", "department": "Data Science", "semester": 5, "year_sem": "3rd Year (Sem 5)", "faculty_name": "Dr Upendar Mendu", "exam_date": "24-Sep-2026 (Afternoon)"}, {"course_code": "BCA311", "course_name": "MACHINE LEARNING", "program": "BCA", "department": "Computer Applications (BCA)", "semester": 3, "year_sem": "2nd Year (Sem 3)", "faculty_name": "Dr.T.Aruna Sri", "exam_date": "24-Sep-2026 (Afternoon)"}, {"course_code": "AIM306", "course_name": "NATURAL LANGUAGE PROCESSING", "program": "B.Tech", "department": "Artificial Intelligence & Data Science", "semester": 5, "year_sem": "3rd Year (Sem 5)", "faculty_name": "Dr. B. Srinivas", "exam_date": "24-Sep-2026 (Afternoon)"}, {"course_code": "BCA442", "course_name": "DATA VISUALIZATION", "program": "BCA", "department": "Computer Applications (BCA)", "semester": 3, "year_sem": "2nd Year (Sem 3)", "faculty_name": "Dr.Srinivasa Rao Dhanikonda", "exam_date": "24-Sep-2026 (Afternoon)"}, {"course_code": "EC324", "course_name": "SPEECH PROCESSING", "program": "B.Tech", "department": "Electronics & Communication", "semester": 5, "year_sem": "3rd Year (Sem 5)", "faculty_name": "Dr. N. Prasad", "exam_date": "24-Sep-2026 (Afternoon)"}, {"course_code": "ME301", "course_name": "MACHINE TOOLS AND METROLOGY", "program": "B.Tech", "department": "Mechanical Engineering", "semester": 5, "year_sem": "3rd Year (Sem 5)", "faculty_name": "Dr. AVINASH MALLADI", "exam_date": "24-Sep-2026 (Afternoon)"}, {"course_code": "AI202/CS202/AIM202/DS202", "course_name": "DATABASE MANAGEMENT SYSTEM", "program": "B.Tech", "department": "Artificial Intelligence & Data Science", "semester": 3, "year_sem": "2nd Year (Sem 3)", "faculty_name": "Dr Ramakrishna Reddy K", "exam_date": "25-Sep-2026 (Morning)"}, {"course_code": "EC203", "course_name": "DIGITAL SYSTEM DESIGN", "program": "B.Tech", "department": "Electronics & Communication", "semester": 3, "year_sem": "2nd Year (Sem 3)", "faculty_name": "Dr. Soumit Samadder Chaudhury", "exam_date": "25-Sep-2026 (Morning)"}, {"course_code": "ME203", "course_name": "THERMODYNAMICS", "program": "B.Tech", "department": "Mechanical Engineering", "semester": 3, "year_sem": "2nd Year (Sem 3)", "faculty_name": "Mr. VENUGOPAL CHITTEMSETTY", "exam_date": "25-Sep-2026 (Morning)"}, {"course_code": "CS303", "course_name": "PROGRAMMING LANGUAGE AND COMPLIER CONSTRUCTION", "program": "B.Tech", "department": "Computer Science", "semester": 5, "year_sem": "3rd Year (Sem 5)", "faculty_name": "Dr B Deevena Raju", "exam_date": "25-Sep-2026 (Afternoon)"}]:
            conn.execute(text("""
                INSERT OR IGNORE INTO courses (course_code, course_name, credits, department_name, program, semester, exam_slot)
                VALUES (:code, :name, 4, :dept, :prog, :sem, :slot)
            """), {
                "code": c_data["course_code"],
                "name": c_data["course_name"],
                "dept": c_data["department"],
                "prog": c_data["program"],
                "sem": c_data["semester"],
                "slot": c_data["exam_date"]
            })

        # Seed Faculty members
        for fac_name in ["A SRIRAM", "Dr B Deevena Raju", "Dr Balaji Vejju", "Dr Dileep Kumar Murala", "Dr H Sudheer", "Dr Isha Jha", "Dr K Ramesh", "Dr K Vara Prasada Rao", "Dr Kuncham Sreenivasa Rao", "Dr Madhupama", "Dr Pallavi Mishra", "Dr R Balamurali", "Dr Ramakrishna Reddy K", "Dr Ramesh Ponnala", "Dr S Jayanthi", "Dr Sandeep Kumar Panda", "Dr Sarit Chanda", "Dr Sowjanya Ramisetty", "Dr Suresh Kumar Grandhi", "Dr Suresh N", "Dr Swathi", "Dr Upendar Mendu", "Dr. A MANMADHA CHARY", "Dr. AVINASH MALLADI", "Dr. Akhendra Kumar P", "Dr. B. Srinivas", "Dr. BARLA MADHAVI", "Dr. CHANDRA SHEKHAR A", "Dr. D. V. Nair", "Dr. Divya", "Dr. E.L.N. Kiran Kumar", "Dr. Elizabeth Zacharias", "Dr. GURSINGA LAKSHMAN KUMAR", "Dr. K. Adi Narayana Reddy", "Dr. K. Sridevi", "Dr. Kousik Midya", "Dr. M L PAVAN KISHORE", "Dr. M L Pavan Kishore", "Dr. N. Prasad", "Dr. Nafis Uddin Khan", "Dr. P. Chakradhar", "Dr. Priyanka Parimi", "Dr. Rajesh Kumar Jha", "Dr. Rakesh Reddy", "Dr. Ramesh", "Dr. SOMDATTA MUKHERJEE", "Dr. Sankar Ponnapalli", "Dr. Santosh Kumar Sahoo", "Dr. Shreecharan", "Dr. Soumit Samadder Chaudhury", "Dr. Srinivasa Rao Kongara", "Dr. Sukanta Das", "Dr. Sunil", "Dr. Surya Samantha. B", "Dr. Swathi", "Dr. Syed Shakeel H", "Dr. THOKALA SOLOMAN RAJU", "Dr. V. A. Sankar Ponnapalli", "Dr.Ashwin Kumar", "Dr.B.SEETHARAMULU", "Dr.K.Bhargavi", "Dr.Mallavarapu Sandhya", "Dr.Pradosh Kumar Gantayat", "Dr.Rajesh Jha", "Dr.Sathya AR", "Dr.Srinivasa Rao Dhanikonda", "Dr.T.Aruna Sri", "Dr.T.Bharath Kumar", "Dr.TAMMINEEDI VENKATA SATYA VIVEK", "JOYDEEP ROY", "K LOKESH REDDY", "Mr Arram Sriram", "Mr Girish Kulkarni", "Mr Madhav", "Mr. Abhiram D", "Mr. Mohammed Kaleem", "Mr. VENUGOPAL CHITTEMSETTY", "Mr.Senthil Raja", "Ms. PRIYANKA CHATTORAJ", "Ms. Sai Prasanna"]:
            clean_email = fac_name.lower().replace("dr.", "").replace("dr", "").replace("mr.", "").replace("mr", "").replace("ms.", "").replace("ms", "").replace("prof.", "").strip().replace(" ", ".").replace("..", ".") + "@univ.edu"
            conn.execute(text("""
                INSERT OR IGNORE INTO faculty (name, department, email)
                VALUES (:name, 'Faculty of Science & Technology', :email)
            """), {"name": fac_name, "email": clean_email})

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)