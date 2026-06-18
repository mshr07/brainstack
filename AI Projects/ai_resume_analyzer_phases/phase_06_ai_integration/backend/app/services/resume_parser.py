import io
from pathlib import Path

from fastapi import HTTPException, UploadFile
from pypdf import PdfReader


class ResumeParser:
    async def parse(self, resume: UploadFile) -> str:
        filename = resume.filename or "resume"
        extension = Path(filename).suffix.lower()
        content = await resume.read()
        if extension not in {".txt", ".pdf"}:
            raise HTTPException(status_code=400, detail="Only TXT and PDF files are supported.")
        if not content:
            raise HTTPException(status_code=400, detail="Resume file is empty.")
        if extension == ".txt":
            return content.decode("utf-8", errors="ignore")
        try:
            reader = PdfReader(io.BytesIO(content))
            return "\n".join(page.extract_text() or "" for page in reader.pages)
        except Exception as exc:
            raise HTTPException(status_code=400, detail="Could not read PDF resume.") from exc

