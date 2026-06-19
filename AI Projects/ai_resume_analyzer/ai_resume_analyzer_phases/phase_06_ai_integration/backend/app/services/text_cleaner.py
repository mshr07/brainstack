import re


class TextCleaner:
    def clean(self, text: str) -> str:
        return re.sub(r"\s+", " ", text.replace("\x00", " ")).strip()

