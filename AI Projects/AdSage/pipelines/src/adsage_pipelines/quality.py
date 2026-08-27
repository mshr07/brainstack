"""Data-quality gate errors shared by medallion stages."""

from __future__ import annotations

from adsage_pipelines.manifest import QualityResult


class DataQualityError(RuntimeError):
    """A measured quality result failed the configured publication gate."""

    def __init__(self, message: str, quality: QualityResult) -> None:
        super().__init__(message)
        self.quality = quality
