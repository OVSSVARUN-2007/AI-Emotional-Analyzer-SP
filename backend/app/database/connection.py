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
                is_anonymous BOOLEAN DEFAULT 1
            );
        """))
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

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)