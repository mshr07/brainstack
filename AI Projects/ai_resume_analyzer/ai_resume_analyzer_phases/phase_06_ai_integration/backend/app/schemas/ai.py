from pydantic import BaseModel, Field


class InterviewQuestion(BaseModel):
    question: str = Field(..., description="Likely interview question.")
    why_it_matters: str = Field(..., description="Why an interviewer may ask this.")
    strong_answer_points: list[str] = Field(
        ...,
        min_length=2,
        description="Bullet points the candidate can use to structure an answer.",
    )


class AICoachOutput(BaseModel):
    ai_summary: str = Field(
        ...,
        description="A tailored fit summary grounded in the resume and job description.",
    )
    resume_recommendations: list[str] = Field(
        ...,
        min_length=4,
        description="Specific resume edits, not generic advice. Mention sections or bullets to improve.",
    )
    job_alignment_advice: list[str] = Field(
        ...,
        min_length=3,
        description="Advice for aligning the candidate with this exact job description.",
    )
    interview_questions: list[InterviewQuestion] = Field(
        ...,
        min_length=5,
        description="Interview questions tailored to the resume, JD, matched skills, and missing skills.",
    )
    answer_strategy: list[str] = Field(
        ...,
        min_length=4,
        description="Practical strategy for answering likely interview questions accurately.",
    )
    study_plan: list[str] = Field(
        ...,
        min_length=7,
        description="A short preparation plan focused on the candidate's gaps and target role.",
    )
    recruiter_pitch: str = Field(
        ...,
        description="A concise pitch the student can say honestly based on shown experience.",
    )
    ai_provider: str = "openai"
    ai_generated: bool = True
