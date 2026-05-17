from pathlib import Path

from app.core.config import get_settings
from app.utils.exceptions import ResumeParsingError, UnsupportedFileTypeError


SUPPORTED_EXTENSIONS = {".pdf", ".txt"}


def validate_resume_file(filename: str, content: bytes) -> str:
    settings = get_settings()
    extension = Path(filename).suffix.lower()

    if extension not in SUPPORTED_EXTENSIONS:
        raise UnsupportedFileTypeError("Only PDF and TXT resumes are supported.")

    if not content:
        raise ResumeParsingError("Resume file is empty.")

    max_bytes = settings.max_resume_size_mb * 1024 * 1024
    if len(content) > max_bytes:
        raise ResumeParsingError(
            f"Resume file is too large. Maximum size is {settings.max_resume_size_mb} MB."
        )

    return extension

