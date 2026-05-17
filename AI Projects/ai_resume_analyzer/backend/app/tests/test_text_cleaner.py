from app.services.text_cleaner import TextCleaner


def test_clean_removes_extra_whitespace_and_bullets():
    cleaner = TextCleaner()

    result = cleaner.clean("Python   developer\n\n• FastAPI\tSQL")

    assert result == "Python developer FastAPI SQL"


def test_normalize_for_matching_lowercases_text():
    cleaner = TextCleaner()

    result = cleaner.normalize_for_matching("Built REST APIs with FastAPI!")

    assert result == "built rest apis with fastapi"

