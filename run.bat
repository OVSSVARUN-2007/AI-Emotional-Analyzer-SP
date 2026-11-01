@echo off
echo ========================================================
echo   Starting AI Emotional Analyzer for Student Feedback
echo ========================================================
echo.
if not exist "frontend\dist\index.html" (
    echo Building frontend production assets...
    cd frontend && call npm run build && cd ..
)
echo URL: http://127.0.0.1:8000
echo Press Ctrl+C in this window to stop the server.
echo.
python -m uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000
pause
