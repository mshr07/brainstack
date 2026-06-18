import os
import re
from textwrap import shorten

from ..core.config import get_settings
from ..schemas.ai import AICoachOutput
from .skill_extractor import SkillComparison


class AICoachConfigurationError(RuntimeError):
    """Raised when the OpenAI integration is not configured."""


class AICoachGenerationError(RuntimeError):
    """Raised when the OpenAI API call fails."""


class AICoachService:
    """Generate all coaching content through the OpenAI API.

    Phase 6 intentionally does not use static interview questions or local
    suggestion templates. The deterministic services still compute facts
    such as matched skills and score breakdown, then OpenAI generates the
    human-facing guidance from that data.
    """

    def __init__(self) -> None:
        self.settings = get_settings()

    def generate(
        self,
        resume_text: str,
        job_description: str,
        skills: SkillComparison,
        score_breakdown: dict[str, float],
    ) -> AICoachOutput:
        api_key = os.getenv("OPENAI_API_KEY")
        if not self.settings.enable_openai:
            raise AICoachConfigurationError("ENABLE_OPENAI must be true for Phase 6.")
        if not api_key:
            raise AICoachConfigurationError(
                "OPENAI_API_KEY is required. Phase 6 generates coaching content with OpenAI."
            )

        try:
            coach_output = self._generate_with_openai(
                resume_text=resume_text,
                job_description=job_description,
                skills=skills,
                score_breakdown=score_breakdown,
            )
            quality_issues = self._quality_issues(coach_output)
            if quality_issues:
                coach_output = self._generate_with_openai(
                    resume_text=resume_text,
                    job_description=job_description,
                    skills=skills,
                    score_breakdown=score_breakdown,
                    quality_feedback=quality_issues,
                )
                quality_issues = self._quality_issues(coach_output)
                if quality_issues:
                    raise AICoachGenerationError(
                        "OpenAI returned malformed or insufficiently grounded coaching content."
                    )
            return coach_output
        except Exception as exc:
            if isinstance(exc, AICoachGenerationError):
                raise
            error_message = str(exc)
            if "insufficient_quota" in error_message or "exceeded your current quota" in error_message:
                raise AICoachGenerationError(
                    "OpenAI quota is unavailable for this API key. Check billing/quota or use another key."
                ) from exc
            if "Incorrect API key" in error_message or "invalid_api_key" in error_message:
                raise AICoachGenerationError(
                    "OpenAI authentication failed. Check OPENAI_API_KEY."
                ) from exc
            raise AICoachGenerationError("OpenAI coaching generation failed.") from exc

    def _generate_with_openai(
        self,
        resume_text: str,
        job_description: str,
        skills: SkillComparison,
        score_breakdown: dict[str, float],
        quality_feedback: list[str] | None = None,
    ) -> AICoachOutput:
        from openai import OpenAI

        client = OpenAI()
        response = client.responses.parse(
            model=self.settings.openai_model,
            input=[
                {
                    "role": "system",
                    "content": (
                        "You are an expert career coach for college students. "
                        "Generate every recommendation, suggestion, interview "
                        "question, answer strategy, study plan, summary, and "
                        "pitch from the provided resume and job description. "
                        "Do not use generic boilerplate. Do not invent experience "
                        "the candidate has not shown. Every recommendation must "
                        "be grounded in the resume text, the job description, the "
                        "matched skills, the missing skills, or the score breakdown. "
                        "If a skill is missing, frame it as a learning/preparation "
                        "gap instead of pretending the candidate has it. Do not say "
                        "the candidate is currently learning something unless the "
                        "resume explicitly says so. Use conditional language such as "
                        "'if you have used it' or 'prepare a small project' for skills "
                        "that are missing. Do not recommend listing certifications, "
                        "coursework, projects, or skills unless the candidate has completed "
                        "them. Instead recommend completing a small proof project first. "
                        "Every sentence must be clean natural language, with no debug text, "
                        "schema field names, random numbers, or metadata. Be specific, "
                        "practical, and interview-focused."
                    ),
                },
                {
                    "role": "user",
                    "content": self._build_prompt(
                        resume_text=resume_text,
                        job_description=job_description,
                        skills=skills,
                        score_breakdown=score_breakdown,
                        quality_feedback=quality_feedback,
                    ),
                },
            ],
            text_format=AICoachOutput,
        )

        coach_output = response.output_parsed
        coach_output.ai_provider = f"openai:{self.settings.openai_model}"
        coach_output.ai_generated = True
        return coach_output

    def _build_prompt(
        self,
        resume_text: str,
        job_description: str,
        skills: SkillComparison,
        score_breakdown: dict[str, float],
        quality_feedback: list[str] | None = None,
    ) -> str:
        feedback_text = ""
        if quality_feedback:
            feedback_text = (
                "\nPrevious output quality issues to fix completely:\n- "
                + "\n- ".join(quality_feedback)
                + "\n"
            )

        return f"""
Resume text:
{shorten(resume_text, width=5000, placeholder=" ...")}

Job description:
{shorten(job_description, width=3500, placeholder=" ...")}

Matched skills from deterministic extractor: {skills.matched_skills}
Missing skills from deterministic extractor: {skills.missing_skills}
Score breakdown from deterministic scoring engine: {score_breakdown}
{feedback_text}

Generate all fields in the output schema:
1. A tailored fit summary that separates demonstrated strengths from gaps.
2. At least 4 resume recommendations based on this resume and job description. Refer to
   sections such as Skills, Projects, Education, Internship, or Summary when useful.
   Do not recommend adding a missing skill as a skill claim unless the candidate has used it.
3. At least 3 job alignment advice items that connect the candidate's shown experience to the JD.
4. At least 5 likely interview questions tailored to the JD and resume, including questions
   about missing skills where the candidate should explain a learning plan.
5. Why each question matters.
6. Strong answer points grounded in the candidate's shown experience. Do not
   claim AWS, CI/CD, or other missing skills as experience unless the resume shows them.
7. At least 4 interview answer strategy items.
8. A 7-day study plan based on missing skills and weak score areas.
9. A recruiter pitch the student can say out loud.
"""

    def _quality_issues(self, output: AICoachOutput) -> list[str]:
        issues: list[str] = []
        text_items = [
            output.ai_summary,
            output.recruiter_pitch,
            *output.resume_recommendations,
            *output.job_alignment_advice,
            *output.answer_strategy,
            *output.study_plan,
        ]
        for question in output.interview_questions:
            text_items.extend(
                [
                    question.question,
                    question.why_it_matters,
                    *question.strong_answer_points,
                ]
            )

        bad_patterns = [
            r"\bstrong_answer_points\b",
            r"\binterview_questions\b",
            r"\bIndeterminate\b",
            r"\bN/A\b",
            r"\b\d{4}\s+\d{4}\b",
            r"\b0\.\d{3}\s+0\.\d{3}\b",
        ]

        for item in text_items:
            if len(item.strip()) < 12:
                issues.append("One or more generated fields are too short to be useful.")
                break
            if any(re.search(pattern, item) for pattern in bad_patterns):
                issues.append("Generated text contains schema names, debug artifacts, or numeric junk.")
                break

        missing_skill_claims = [
            "currently learning",
            "have experience with aws",
            "have experience with ci/cd",
            "have experience with nlp",
            "my experience with aws",
            "my experience with ci/cd",
            "my experience with nlp",
        ]
        combined_text = " ".join(text_items).lower()
        if any(claim in combined_text for claim in missing_skill_claims):
            issues.append("Generated text overclaims missing skills instead of framing them as gaps.")

        return issues
