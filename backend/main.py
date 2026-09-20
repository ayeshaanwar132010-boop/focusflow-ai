from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="FocusFlow AI API")


class StudyPlanRequest(BaseModel):
    subjects: list[str]
    available_hours: int


@app.get("/")
def root():
    return {
        "message": "FocusFlow AI API is running"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy"
    }


@app.post("/study-plan")
def create_study_plan(request: StudyPlanRequest):
    subject_count = max(len(request.subjects), 1)
    hours_per_subject = request.available_hours / subject_count

    return {
        "title": "Personalized Study Plan",
        "plan": [
            {
                "subject": subject,
                "recommended_hours": round(hours_per_subject, 1),
            }
            for subject in request.subjects
        ],
    }