class ResumeAnalyzerError(Exception):
    """Base exception for expected application errors."""


class ResumeParsingError(ResumeAnalyzerError):
    """Raised when a resume cannot be read safely."""


class UnsupportedFileTypeError(ResumeParsingError):
    """Raised when a user uploads a file type the parser does not support."""

