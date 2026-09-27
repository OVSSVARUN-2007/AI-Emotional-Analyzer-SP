from fastapi import FastAPI

app = FastAPI(
    title="AI Emotional Sentiment Analyzer",
    description="Backend API for analyzing student feedback",
    version="1.0.0"
)


@app.get("/")
def root():
    return {
        "message": "AI Emotional Sentiment Analyzer API is running"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy"
    }