from pathlib import Path

from fastapi import UploadFile

from app.utils.exceptions import ResumeParsingError
from app.utils.file_validation import validate_resume_file


class ResumeParser:
    """Extract text from TXT and PDF resumes.

    The parser is intentionally simple. In interviews, students can explain
    that production systems often add OCR for scanned PDFs and better layout
    handling for multi-column resumes.
    """

    async def parse_upload(self, resume: UploadFile) -> str:
        filename = resume.filename or "resume"
        content = await resume.read()
        extension = validate_resume_file(filename, content)

        if extension == ".txt":
            return self._parse_txt(content)
        if extension == ".pdf":
            return self._parse_pdf(content)

        raise ResumeParsingError("Unsupported resume format.")

    def _parse_txt(self, content: bytes) -> str:
        for encoding in ("utf-8", "utf-16", "latin-1"):
            try:
                return content.decode(encoding)
            except UnicodeDecodeError:
                continue
        raise ResumeParsingError("Could not decode TXT resume.")

    def _parse_pdf(self, content: bytes) -> str:
        try:
            from pypdf import PdfReader
        except ImportError as exc:
            raise ResumeParsingError(
                "PDF parsing requires pypdf. Install backend/requirements.txt."
            ) from exc

        try:
            import io

            reader = PdfReader(io.BytesIO(content))
            pages = [page.extract_text() or "" for page in reader.pages]
        except Exception as exc:
            raise ResumeParsingError("Could not read PDF resume.") from exc

        text = "\n".join(pages).strip()
        if not text:
            raise ResumeParsingError("No text could be extracted from this PDF.")
        return text

    def parse_local_file(self, path: str) -> str:
        file_path = Path(path)
        extension = validate_resume_file(file_path.name, file_path.read_bytes())
        if extension == ".txt":
            return self._parse_txt(file_path.read_bytes())
        return self._parse_pdf(file_path.read_bytes())

