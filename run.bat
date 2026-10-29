@echo off
echo ========================================================
echo   Starting AI Emotional Analyzer for Student Feedback
echo ========================================================
echo.
echo URL: http://127.0.0.1:8000
echo Press Ctrl+C in this window to stop the server.
echo.
python -m uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000
pause

