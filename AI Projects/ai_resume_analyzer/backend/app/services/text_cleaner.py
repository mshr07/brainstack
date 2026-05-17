import re


class TextCleaner:
    """Small text-normalization service.

    This deliberately uses regex so students can understand the basics before
    replacing it with spaCy pipelines or custom NLP preprocessing.
    """

    whitespace_pattern = re.compile(r"\s+")
    bullet_pattern = re.compile(r"[•●▪▫◦]")

    def clean(self, text: str) -> str:
        text = text.replace("\x00", " ")
        text = self.bullet_pattern.sub(" ", text)
        text = text.replace("\r", "\n")
        text = self.whitespace_pattern.sub(" ", text)
        return text.strip()

    def normalize_for_matching(self, text: str) -> str:
        text = self.clean(text).lower()
        text = re.sub(r"[^a-z0-9+#.\s-]", " ", text)
        return self.whitespace_pattern.sub(" ", text).strip()

