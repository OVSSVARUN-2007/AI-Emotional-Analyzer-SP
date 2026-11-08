"""Database setup and seeding script for Sentio AI Emotional Sentiment Analyzer.

Usage:
    python scripts/seed_database.py
    python scripts/seed_database.py --reset
"""

from __future__ import annotations

import argparse
import json
import sqlite3
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
BACKEND_DIR = REPO_ROOT / "backend"
sys.path.insert(0, str(REPO_ROOT))
sys.path.insert(0, str(BACKEND_DIR))


def seed_database(reset: bool = False) -> None:
    db_path = BACKEND_DIR / "database" / "student_feedback.db"
    root_db_path = REPO_ROOT / "database" / "student_feedback.db"

    db_path.parent.mkdir(parents=True, exist_ok=True)
    root_db_path.parent.mkdir(parents=True, exist_ok=True)

    if reset and db_path.exists():
        print(f"Resetting existing database at {db_path}...")
        db_path.unlink()

    # Import connection which auto-creates tables and schemas
    from backend.app.database.connection import engine
    from sqlalchemy import text

    with engine.begin() as conn:
        print("Connected to database successfully.")

        # Ensure unique index on sections to prevent duplicates
        conn.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS idx_sections_class_sem ON sections (class_name, semester)"))

        # Deduplicate sections if any exist
        conn.execute(text("""
            DELETE FROM sections
            WHERE section_id NOT IN (
                SELECT MIN(section_id)
                FROM sections
                GROUP BY class_name, semester
            )
        """))

        # Verify critical seed data
        users_count = conn.execute(text("SELECT count(*) FROM users")).scalar()
        courses_count = conn.execute(text("SELECT count(*) FROM courses")).scalar()
        feedback_count = conn.execute(text("SELECT count(*) FROM feedback")).scalar()
        sections_count = conn.execute(text("SELECT count(*) FROM sections")).scalar()

        print(f"Database status:")
        print(f"  - Users: {users_count}")
        print(f"  - Courses: {courses_count}")
        print(f"  - Sections: {sections_count}")
        print(f"  - Feedback submissions: {feedback_count}")

    # Synchronize database/student_feedback.db
    if db_path.exists():
        import shutil
        shutil.copy2(db_path, root_db_path)
        print(f"Synchronized root database copy at {root_db_path}")

    print("\nDatabase is fully updated and ready for project operation.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Seed Sentio Database")
    parser.add_argument("--reset", action="store_true", help="Reset and reseed database from scratch")
    args = parser.parse_args()
    seed_database(reset=args.reset)

